import { Redis } from "@upstash/redis";
import crypto from "node:crypto";
import { decryptSecret } from "../../../../lib/google-session";

const redis = Redis.fromEnv();
const COOKIE = "scoutool_gmail_session";

function getSessionId(request) {
  const [id, signature] = (request.cookies.get(COOKIE)?.value || "").split(".");
  if (!id || !signature || !process.env.GOOGLE_SESSION_SECRET) return "";
  const expected = crypto.createHmac("sha256", process.env.GOOGLE_SESSION_SECRET).update(id).digest("base64url");
  if (signature.length !== expected.length) return "";
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? id : "";
}

function rawMessage(record) {
  return [`To: ${record.email}`, `Subject: ${record.subject || ""}`, "Content-Type: text/plain; charset=UTF-8", "MIME-Version: 1.0", "", record.body || ""].join("\r\n");
}

function encode(value) {
  return Buffer.from(value).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function accessToken(refreshToken) {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: refreshToken, grant_type: "refresh_token" }) });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error("Unable to refresh the Gmail access token.");
  return data.access_token;
}

export async function POST(request) {
  try {
    const id = getSessionId(request);
    const session = id ? await redis.get(`google-session:${id}`) : null;
    if (!session) return Response.json({ ok: false, error: "Connect a Gmail account first." }, { status: 401 });
    const body = await request.json();
    const records = Array.isArray(body.records) ? body.records : [];
    if (!records.length || records.length > 500) return Response.json({ ok: false, error: "Provide between 1 and 500 draft records." }, { status: 400 });
    const seen = new Set();
    const valid = records.filter((record) => { const email = String(record?.email || "").trim().toLowerCase(); if (!email || !email.includes("@") || seen.has(email)) return false; seen.add(email); return true; });
    if (valid.length !== records.length) return Response.json({ ok: false, error: "Records contain duplicate or invalid email addresses." }, { status: 400 });
    let token;
    if (session.accessToken && Number(session.accessTokenExpiresAt) > Date.now() + 60_000) {
      token = decryptSecret(session.accessToken);
    } else if (session.refreshToken) {
      token = await accessToken(decryptSecret(session.refreshToken));
    } else {
      throw new Error("Google access expired. Reconnect Gmail and try again.");
    }
    const drafts = [];
    for (const record of valid) {
      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ message: { raw: encode(rawMessage(record)) } }) });
      const data = await response.json();
      if (!response.ok) return Response.json({ ok: false, created: drafts.length, error: data.error?.message || "Gmail draft creation failed." }, { status: 502 });
      drafts.push({ id: data.id, email: record.email });
    }
    return Response.json({ ok: true, count: drafts.length, drafts, sent: false });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || "Draft creation failed." }, { status: 500 });
  }
}

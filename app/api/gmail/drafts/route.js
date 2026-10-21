import { Redis } from "@upstash/redis";
import crypto from "node:crypto";
import { decryptSecret } from "../../../../lib/google-session";

const redis = Redis.fromEnv();
const SESSION_COOKIE = "scoutool_gmail_session";

function getSessionId(request) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value || "";
  const [sessionId, signature] = cookie.split(".");

  if (!sessionId || !signature || !process.env.GOOGLE_SESSION_SECRET) return "";

  const expected = crypto
    .createHmac("sha256", process.env.GOOGLE_SESSION_SECRET)
    .update(sessionId)
    .digest("base64url");

  if (signature.length !== expected.length) return "";

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ? sessionId
    : "";
}

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function messageFor(record) {
  return [
    `To: ${record.email}`,
    `Subject: ${record.subject || ""}`,
    "Content-Type: text/plain; charset=UTF-8",
    "MIME-Version: 1.0",
    "",
    record.body || "",
  ].join("\r\n");
}

async function accessToken(refreshToken) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error("Unable to refresh the Gmail access token.");
  }

  return data.access_token;
}

export async function POST(request) {
  try {
    const sessionId = getSessionId(request);
    const session = sessionId
      ? await redis.get(`google-session:${sessionId}`)
      : null;

    if (!session) {
      return Response.json(
        { ok: false, error: "Connect a Gmail account first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const records = Array.isArray(body.records) ? body.records : [];

    if (!records.length || records.length > 500) {
      return Response.json(
        { ok: false, error: "Provide between 1 and 500 draft records." },
        { status: 400 }
      );
    }

    const seen = new Set();
    const validRecords = records.filter((record) => {
      const email = String(record?.email || "").trim().toLowerCase();

      if (!email || !email.includes("@") || seen.has(email)) return false;

      seen.add(email);
      return true;
    });

    if (validRecords.length !== records.length) {
      return Response.json(
        { ok: false, error: "Records contain duplicate or invalid email addresses." },
        { status: 400 }
      );
    }

    const token = await accessToken(decryptSecret(session.refreshToken));
    const created = [];

    for (const record of validRecords) {
      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: { raw: encodeBase64Url(messageFor(record)) },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return Response.json(
          {
            ok: false,
            created: created.length,
            error: data.error?.message || "Gmail draft creation failed.",
          },
          { status: 502 }
        );
      }

      created.push({ id: data.id, email: record.email });
    }

    return Response.json({
      ok: true,
      count: created.length,
      drafts: created,
      sent: false,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error.message || "Draft creation failed." },
      { status: 500 }
    );
  }
}

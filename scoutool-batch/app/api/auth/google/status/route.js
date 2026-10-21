import { Redis } from "@upstash/redis";
import crypto from "node:crypto";

const redis = Redis.fromEnv();
const COOKIE = "scoutool_gmail_session";

function sessionId(request) {
  const [id, signature] = (request.cookies.get(COOKIE)?.value || "").split(".");
  if (!id || !signature || !process.env.GOOGLE_SESSION_SECRET) return "";
  const expected = crypto.createHmac("sha256", process.env.GOOGLE_SESSION_SECRET).update(id).digest("base64url");
  if (signature.length !== expected.length) return "";
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? id : "";
}

export async function GET(request) {
  const id = sessionId(request);
  const session = id ? await redis.get(`google-session:${id}`) : null;
  return Response.json({ ok: true, connected: Boolean(session), email: session?.email || null });
}

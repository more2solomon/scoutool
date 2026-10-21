import { Redis } from "@upstash/redis";
import crypto from "node:crypto";

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

export async function GET(request) {
  const sessionId = getSessionId(request);
  const session = sessionId
    ? await redis.get(`google-session:${sessionId}`)
    : null;

  return Response.json({
    ok: true,
    connected: Boolean(session),
    email: session?.email || null,
  });
}

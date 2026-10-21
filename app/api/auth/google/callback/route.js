import { Redis } from "@upstash/redis";
import crypto from "node:crypto";
import { encryptSecret } from "../../../../../lib/google-session";

const redis = Redis.fromEnv();
const SESSION_COOKIE = "scoutool_gmail_session";

function sign(value) {
  return crypto
    .createHmac("sha256", process.env.GOOGLE_SESSION_SECRET || "")
    .update(value)
    .digest("base64url");
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return Response.json({ ok: false, error }, { status: 400 });
  }

  if (!code || !state || !process.env.GOOGLE_SESSION_SECRET) {
    return Response.json(
      { ok: false, error: "Invalid Google OAuth callback." },
      { status: 400 }
    );
  }

  const stateRecord = await redis.get(`google-oauth-state:${state}`);

  if (!stateRecord) {
    return Response.json(
      { ok: false, error: "OAuth state expired or is invalid." },
      { status: 400 }
    );
  }

  await redis.del(`google-oauth-state:${state}`);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.refresh_token) {
    return Response.json(
      { ok: false, error: tokenData.error_description || "Google token exchange failed." },
      { status: 502 }
    );
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileResponse.json();

  if (!profileResponse.ok || !profile.email) {
    return Response.json(
      { ok: false, error: "Unable to identify the Google account." },
      { status: 502 }
    );
  }

  const sessionId = crypto.randomBytes(32).toString("hex");

  await redis.set(
    `google-session:${sessionId}`,
    {
      email: profile.email,
      refreshToken: encryptSecret(tokenData.refresh_token),
      connectedAt: Date.now(),
    },
    { ex: 60 * 60 * 24 * 30 }
  );

  const cookieValue = `${sessionId}.${sign(sessionId)}`;
  const response = Response.redirect(
    new URL("/?gmail=connected", requestUrl.origin)
  );

  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
  );

  return response;
}

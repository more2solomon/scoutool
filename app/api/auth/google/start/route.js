import { Redis } from "@upstash/redis";
import crypto from "node:crypto";

const redis = Redis.fromEnv();

export async function GET(request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return Response.json(
      { ok: false, error: "Google OAuth is not configured." },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(32).toString("hex");

  await redis.set(
    `google-oauth-state:${state}`,
    { createdAt: Date.now() },
    { ex: 600 }
  );

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email https://www.googleapis.com/auth/gmail.compose");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent select_account");
  const loginHint = new URL(request.url).searchParams.get("email");

  if (loginHint && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginHint)) {
    url.searchParams.set("login_hint", loginHint);
  }

  url.searchParams.set("state", state);

  return Response.redirect(url);
}

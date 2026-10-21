import { Redis } from "@upstash/redis";
import crypto from "node:crypto";
import { encryptSecret } from "../../../../../lib/google-session";

const redis = Redis.fromEnv();
const COOKIE = "scoutool_gmail_session";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error")) return Response.json({ ok: false, error: url.searchParams.get("error") }, { status: 400 });
  if (!code || !state || !process.env.GOOGLE_SESSION_SECRET) return Response.json({ ok: false, error: "Invalid Google OAuth callback." }, { status: 400 });
  const stateRecord = await redis.get(`google-oauth-state:${state}`);
  if (!stateRecord) return Response.json({ ok: false, error: "OAuth state expired or is invalid." }, { status: 400 });
  await redis.del(`google-oauth-state:${state}`);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: process.env.GOOGLE_REDIRECT_URI, grant_type: "authorization_code" }) });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) return Response.json({ ok: false, error: token.error_description || "Google token exchange failed." }, { status: 502 });
  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
  const profile = await profileResponse.json();
  if (!profileResponse.ok || !profile.email) return Response.json({ ok: false, error: "Unable to identify the Google account." }, { status: 502 });
  const id = crypto.randomBytes(32).toString("hex");
  await redis.set(`google-session:${id}`, {
    email: profile.email,
    refreshToken: token.refresh_token ? encryptSecret(token.refresh_token) : null,
    accessToken: encryptSecret(token.access_token),
    accessTokenExpiresAt: Date.now() + Number(token.expires_in || 3600) * 1000,
    connectedAt: Date.now(),
  }, { ex: 60 * 60 * 24 * 30 });
  const signature = crypto.createHmac("sha256", process.env.GOOGLE_SESSION_SECRET).update(id).digest("base64url");
  const response = new Response(null, {
    status: 302,
    headers: {
      Location: new URL("/?gmail=connected", url.origin).toString(),
    },
  });
  response.headers.append("Set-Cookie", `${COOKIE}=${id}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return response;
}

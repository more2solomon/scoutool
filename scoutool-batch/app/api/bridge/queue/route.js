import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const KEY = "scoutmail:queue";

export async function GET() {
  try {
    const items = await redis.get(KEY);
    return Response.json({ ok: true, items: Array.isArray(items) ? items : [], updatedAt: Date.now() });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body.items)) return Response.json({ ok: false, error: "items must be an array" }, { status: 400 });
    const items = body.items.filter((item) => item && typeof item.email === "string").map((item) => ({ email: item.email.trim(), gmailUrl: typeof item.gmailUrl === "string" ? item.gmailUrl : "", subject: typeof item.subject === "string" ? item.subject : "", body: typeof item.body === "string" ? item.body : "" }));
    await redis.set(KEY, items);
    return Response.json({ ok: true, count: items.length, updatedAt: Date.now() });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

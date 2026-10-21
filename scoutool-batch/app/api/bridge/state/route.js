import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const KEY = "scoutmail:state";
const DEFAULT_STATE = { running: false, completed: 0, failed: 0, currentIndex: 0 };

export async function GET() {
  try {
    return Response.json({ ok: true, state: (await redis.get(KEY)) || DEFAULT_STATE });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const next = { ...DEFAULT_STATE, ...((await redis.get(KEY)) || {}), ...body, updatedAt: Date.now() };
    await redis.set(KEY, next);
    return Response.json({ ok: true, state: next });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

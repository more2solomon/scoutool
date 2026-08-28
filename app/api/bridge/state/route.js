import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const STATE_KEY = "scoutmail:state";

const DEFAULT_STATE = {
  running: false,
  completed: 0,
  failed: 0,
  currentIndex: 0
};

export async function GET() {
  try {
    const state = await redis.get(STATE_KEY);

    return Response.json({
      ok: true,
      state: state || DEFAULT_STATE
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const current = (await redis.get(STATE_KEY)) || DEFAULT_STATE;

    const next = {
      ...DEFAULT_STATE,
      ...current,
      ...body,
      updatedAt: Date.now()
    };

    await redis.set(STATE_KEY, next);

    return Response.json({
      ok: true,
      state: next
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

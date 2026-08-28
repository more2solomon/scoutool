import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

function tokenFrom(request) {
  const value =
    request.headers.get("authorization") || "";

  if (!value.startsWith("Bearer ")) {
    return "";
  }

  return value.slice(7);
}

export async function GET(request) {
  try {
    const token = tokenFrom(request);

    if (!token) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const auth = await redis.get(
      `desktop-token:${token}`
    );

    if (!auth) {
      return Response.json(
        { ok: false, error: "Invalid device token" },
        { status: 401 }
      );
    }

    const device =
      await redis.get(
        `device:${auth.deviceId}`
      );

    return Response.json({
      ok: true,
      device: device || null
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pairingId = searchParams.get("pairingId");

    if (!pairingId) {
      return Response.json(
        { ok: false, error: "Missing pairingId." },
        { status: 400 }
      );
    }

    const result = await redis.get(
      `pairing-result:${pairingId}`
    );

    if (!result) {
      return Response.json({
        ok: true,
        status: "waiting"
      });
    }

    await redis.del(
      `pairing-result:${pairingId}`
    );

    return Response.json({
      ok: true,
      status: "paired",
      ...result
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

import { Redis } from "@upstash/redis";
import crypto from "node:crypto";

const redis = Redis.fromEnv();

export async function POST() {
  try {
    const code = String(
      crypto.randomInt(100000, 1000000)
    );

    const desktopToken = crypto
      .randomBytes(32)
      .toString("hex");

    const pairingId = crypto
      .randomBytes(16)
      .toString("hex");

    await redis.set(
      `pair:${code}`,
      {
        pairingId,
        desktopToken,
        createdAt: Date.now()
      },
      { ex: 600 }
    );

    return Response.json({
      ok: true,
      code,
      pairingId,
      expiresIn: 600
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

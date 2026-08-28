import { Redis } from "@upstash/redis";
import crypto from "node:crypto";

const redis = Redis.fromEnv();

export async function POST(request) {
  try {
    const body = await request.json();

    const code = String(
      body.code || ""
    ).trim();

    if (!/^\d{6}$/.test(code)) {
      return Response.json(
        {
          ok: false,
          error: "Enter the 6-digit pairing code."
        },
        { status: 400 }
      );
    }

    const pairing = await redis.get(
      `pair:${code}`
    );

    if (!pairing) {
      return Response.json(
        {
          ok: false,
          error: "Pairing code expired or invalid."
        },
        { status: 400 }
      );
    }

    const userId = crypto
      .randomBytes(16)
      .toString("hex");

    const userToken = crypto
      .randomBytes(32)
      .toString("hex");

    const deviceId = crypto
      .randomBytes(16)
      .toString("hex");

    await redis.set(
      `user:${userId}`,
      {
        userId,
        createdAt: Date.now()
      }
    );

    await redis.set(
      `user-token:${userToken}`,
      {
        userId,
        createdAt: Date.now()
      }
    );

    await redis.set(
      `device:${deviceId}`,
      {
        deviceId,
        userId,
        name:
          body.deviceName ||
          "Scout Mail Desktop",
        connectedAt: Date.now()
      }
    );

    await redis.set(
      `desktop-token:${pairing.desktopToken}`,
      {
        userId,
        deviceId
      }
    );

    await redis.del(`pair:${code}`);

    return Response.json({
      ok: true,
      userId,
      userToken,
      deviceId
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

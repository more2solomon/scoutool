import { Redis } from "@upstash/redis";
import crypto from "node:crypto";

const redis = Redis.fromEnv();

export async function POST(request) {
  try {
    const body = await request.json();

    const code = String(body.code || "").trim();

    if (!/^\d{6}$/.test(code)) {
      return Response.json(
        {
          ok: false,
          error: "Enter the 6-digit pairing code."
        },
        { status: 400 }
      );
    }

    const pairing = await redis.get(`pair:${code}`);

    if (!pairing) {
      return Response.json(
        {
          ok: false,
          error: "Pairing code expired or is invalid."
        },
        { status: 400 }
      );
    }

    const userId = crypto.randomUUID();
    const deviceId = crypto.randomUUID();
    const userToken = crypto.randomBytes(32).toString("hex");
    const desktopToken = pairing.desktopToken;

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
        connectedAt: Date.now(),
        online: true
      }
    );

    await redis.set(
      `desktop-token:${desktopToken}`,
      {
        userId,
        deviceId
      }
    );

    await redis.set(
      `pairing-result:${pairing.pairingId}`,
      {
        userId,
        deviceId,
        userToken,
        desktopToken
      },
      { ex: 600 }
    );

    await redis.del(`pair:${code}`);

    return Response.json({
      ok: true,
      userId,
      deviceId,
      userToken
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

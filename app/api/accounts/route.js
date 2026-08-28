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

async function resolveUser(request) {
  const token = tokenFrom(request);

  if (!token) {
    return null;
  }

  const desktop =
    await redis.get(
      `desktop-token:${token}`
    );

  if (desktop?.userId) {
    return {
      userId: desktop.userId
    };
  }

  const mobile =
    await redis.get(
      `user-token:${token}`
    );

  if (mobile?.userId) {
    return {
      userId: mobile.userId
    };
  }

  return null;
}

export async function GET(request) {
  try {
    const user =
      await resolveUser(request);

    if (!user) {
      return Response.json(
        {
          ok: false,
          error: "Unauthorized"
        },
        { status: 401 }
      );
    }

    const accounts =
      (await redis.get(
        `accounts:${user.userId}`
      )) || [];

    return Response.json({
      ok: true,
      accounts
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

export async function POST(request) {
  try {
    const user =
      await resolveUser(request);

    if (!user) {
      return Response.json(
        {
          ok: false,
          error: "Unauthorized"
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const existing =
      (await redis.get(
        `accounts:${user.userId}`
      )) || [];

    if (existing.length >= 50) {
      return Response.json(
        {
          ok: false,
          error:
            "Maximum of 50 linked mail accounts reached.",
          limit: 50
        },
        { status: 409 }
      );
    }

    const provider =
      body.provider === "outlook"
        ? "outlook"
        : "gmail";

    const account = {
      id:
        `${provider}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
      name:
        String(
          body.name || ""
        ).trim() ||
        `${provider} ${existing.length + 1}`,
      provider,
      createdAt:
        new Date().toISOString()
    };

    const next =
      [...existing, account];

    await redis.set(
      `accounts:${user.userId}`,
      next
    );

    return Response.json({
      ok: true,
      account,
      accounts: next
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

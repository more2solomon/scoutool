import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const QUEUE_KEY = "scoutmail:queue";

export async function GET() {
  try {
    const data = await redis.get(QUEUE_KEY);

    return Response.json({
      ok: true,
      items: Array.isArray(data) ? data : [],
      updatedAt: Date.now()
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
    const body = await request.json();

    if (!Array.isArray(body.items)) {
      return Response.json(
        { ok: false, error: "items must be an array" },
        { status: 400 }
      );
    }

    const cleaned = body.items
      .filter((item) => item && typeof item.email === "string")
      .map((item) => ({
        email: item.email.trim(),
        gmailUrl: typeof item.gmailUrl === "string" ? item.gmailUrl : "",
        subject: typeof item.subject === "string" ? item.subject : "",
        body: typeof item.body === "string" ? item.body : ""
      }));

    await redis.set(QUEUE_KEY, cleaned);

    return Response.json({
      ok: true,
      count: cleaned.length,
      updatedAt: Date.now()
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

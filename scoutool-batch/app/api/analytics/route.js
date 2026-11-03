import { getAnalytics } from "../../lib/analytics";

export async function GET() {
  try {
    const stats = getAnalytics();
    return Response.json({ ok: true, ...stats });
  } catch (error) {
    return Response.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
import {NextRequest, NextResponse} from "next/server";
import {listPendingOrders, markOrderPaid} from "@/lib/shopifyAdmin";
import {verifyWebhookSignature} from "@/lib/grey";

export const dynamic = "force-dynamic";

type WebhookPayload = {
  event_type?: string;
  amount?: number;
  source_currency?: string;
  destination_currency?: string;
  status?: string;
  transaction_reference?: string;
  client_reference?: string | null;
  created_at?: string;
  sender?: {name?: string; account_number?: string};
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("X-Webhook-Signature") ||
      request.headers.get("x-webhook-signature");
    const secret = process.env.GREY_WEBHOOK_SECRET?.trim() || "";

    if (!secret) {
      return NextResponse.json(
        {error: "GREY_WEBHOOK_SECRET is not configured"},
        {status: 503},
      );
    }

    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json({error: "Invalid signature"}, {status: 401});
    }

    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody) as WebhookPayload;
    } catch {
      return NextResponse.json({error: "Invalid payload"}, {status: 400});
    }

    if (payload.event_type !== "transaction.received") {
      return NextResponse.json({ok: true, ignored: true});
    }
    if (String(payload.status || "").toLowerCase() !== "completed") {
      return NextResponse.json({ok: true, ignored: true, reason: "not completed"});
    }

    const amount = Number(payload.amount || 0);
    const currency = (
      payload.destination_currency ||
      payload.source_currency ||
      "USD"
    ).toUpperCase();
    if (!amount) {
      return NextResponse.json({ok: true, ignored: true, reason: "no amount"});
    }

    const pending = await listPendingOrders(50);
    const match = pending.find((order) => {
      const orderAmount = Number(order.totalPriceSet.shopMoney.amount);
      const orderCurrency = (
        order.totalPriceSet.shopMoney.currencyCode || ""
      ).toUpperCase();
      if (orderCurrency && orderCurrency !== currency) return false;
      return Math.abs(orderAmount - amount) < 0.011;
    });

    if (!match) {
      return NextResponse.json({
        ok: true,
        matched: false,
        reason: "no pending order matches this amount",
      });
    }

    const marked = await markOrderPaid(match.id);
    return NextResponse.json({
      ok: true,
      matched: true,
      paid: marked,
      order: match.name,
      reference: payload.client_reference || null,
    });
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : "Webhook failed"},
      {status: 500},
    );
  }
}

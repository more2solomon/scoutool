import {NextRequest, NextResponse} from "next/server";
import {verifyTransaction, verifyWebhookSignature} from "@/lib/flutterwave";
import {markOrderPaid} from "@/lib/shopifyAdmin";

export const dynamic = "force-dynamic";

type WebhookPayload = {
  event?: string;
  data?: {
    id?: number;
    tx_ref?: string;
    status?: string;
    amount?: number;
    currency?: string;
    meta?: Record<string, string | number | undefined>;
  };
};

export async function POST(request: NextRequest) {
  try {
    const signature =
      request.headers.get("verif-hash") ||
      request.headers.get("verif_hash") ||
      request.headers.get("ver-hash");

    if (!verifyWebhookSignature(signature)) {
      return NextResponse.json({error: "Invalid signature"}, {status: 401});
    }

    const payload = (await request.json().catch(() => null)) as WebhookPayload | null;
    const data = payload?.data;
    if (!data?.id) {
      return NextResponse.json({ok: true, ignored: true});
    }

    const transaction = await verifyTransaction(String(data.id));
    if (!transaction || transaction.status !== "successful") {
      return NextResponse.json({ok: true, ignored: true, reason: "not successful"});
    }

    const meta = data.meta || {};
    const orderId = String(meta.order_id || "");
    const expectedAmount = Number(meta.order_amount ?? NaN);
    const expectedCurrency = String(meta.currency || "").toUpperCase();

    const amountMatches =
      !Number.isFinite(expectedAmount) ||
      Math.abs(Number(transaction.amount) - expectedAmount) < 0.011;
    const currencyMatches =
      !expectedCurrency ||
      String(transaction.currency).toUpperCase() === expectedCurrency;
    const refMatches = !meta.reference || transaction.tx_ref === meta.reference;

    if (!amountMatches || !currencyMatches || !refMatches) {
      return NextResponse.json({
        ok: false,
        ignored: true,
        reason: "transaction does not match the order",
      });
    }

    const paid = orderId ? await markOrderPaid(orderId) : false;

    return NextResponse.json({
      ok: true,
      paid,
      reference: transaction.tx_ref,
      order: orderId || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook failed",
      },
      {status: 500},
    );
  }
}

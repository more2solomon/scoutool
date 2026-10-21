import {NextRequest, NextResponse} from "next/server";
import {verifyTransaction} from "@/lib/flutterwave";
import {readPaymentIntent} from "@/lib/paymentIntent";
import {markOrderPaid} from "@/lib/shopifyAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const transactionId = params.get("transaction_id") || "";
    const txRef = params.get("tx_ref") || "";
    const intent = readPaymentIntent(params.get("intent"));

    if (!transactionId) {
      return NextResponse.json(
        {ok: false, status: "unknown", error: "transaction_id is required"},
        {status: 400},
      );
    }

    const transaction = await verifyTransaction(transactionId);
    if (!transaction) {
      return NextResponse.json({ok: false, status: "unknown"}, {status: 404});
    }

    const successful = transaction.status === "successful";
    const matchesRef = !txRef || transaction.tx_ref === txRef;
    const matchesIntent =
      !intent ||
      (transaction.tx_ref === intent.reference &&
        Number(transaction.amount) === Number(intent.amount) &&
        String(transaction.currency).toUpperCase() ===
          String(intent.currency).toUpperCase());

    if (!successful || !matchesRef || !matchesIntent) {
      return NextResponse.json({
        ok: false,
        status: successful ? "mismatch" : "pending",
        reference: transaction.tx_ref,
        amount: transaction.amount,
        currency: transaction.currency,
      });
    }

    let paid = false;
    if (intent?.orderId) {
      paid = await markOrderPaid(intent.orderId);
    }

    return NextResponse.json({
      ok: true,
      status: paid ? "paid" : "review",
      reference: transaction.tx_ref,
      amount: transaction.amount,
      currency: transaction.currency,
      email: transaction.customer?.email || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "unknown",
        error:
          error instanceof Error ? error.message : "Unable to verify the payment",
      },
      {status: 500},
    );
  }
}

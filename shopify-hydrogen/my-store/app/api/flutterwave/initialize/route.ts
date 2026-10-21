import {NextRequest, NextResponse} from "next/server";
import {
  createPaymentLink,
  flutterwaveCurrency,
  flutterwaveSecretKey,
} from "@/lib/flutterwave";
import {readPaymentIntent} from "@/lib/paymentIntent";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!flutterwaveSecretKey()) {
      return NextResponse.json(
        {error: "FLUTTERWAVE_SECRET_KEY is not configured"},
        {status: 500},
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({error: "Invalid request body"}, {status: 400});
    }

    const intent = readPaymentIntent(String(body.intent || ""));
    if (!intent) {
      return NextResponse.json(
        {error: "Your payment session has expired. Please checkout again."},
        {status: 400},
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.velvetjournalco.store";
    const currency = flutterwaveCurrency();

    const payment = await createPaymentLink({
      txRef: intent.reference,
      amount: intent.amount,
      currency,
      email: intent.email,
      name: String(body.name || "") || undefined,
      phone: String(body.phone || "") || undefined,
      redirectUrl: `${siteUrl}/checkout/success?reference=${encodeURIComponent(
        intent.reference,
      )}&provider=flutterwave`,
      description: `Velvet Journal Co order ${intent.reference}`,
      meta: {
        order_id: intent.orderId,
        order_amount: intent.amount,
        currency: intent.currency,
        reference: intent.reference,
        percent_off: intent.percentOff,
      },
    });

    return NextResponse.json({
      ok: true,
      link: payment.link,
      txRef: intent.reference,
      amount: intent.amount,
      currency,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start the Flutterwave payment",
      },
      {status: 500},
    );
  }
}

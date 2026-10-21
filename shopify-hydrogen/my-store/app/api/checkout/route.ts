import {NextRequest, NextResponse} from "next/server";
import {cookies} from "next/headers";
import {getProduct} from "@/lib/shopify";
import {
  createPendingOrder,
  type OrderAddress,
} from "@/lib/shopifyAdmin";
import {greyAccount} from "@/lib/grey";
import {CUSTOMER_TOKEN_COOKIE, fetchCustomer} from "@/lib/customer";
import {rewardForNextOrder} from "@/lib/loyalty";
import {createPaymentIntent} from "@/lib/paymentIntent";

export const dynamic = "force-dynamic";

type CartLineInput = {
  handle?: unknown;
  quantity?: unknown;
};

function newReference(): string {
  return `VJ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function loyaltyRewardForSession(): Promise<{
  percentOff: number;
  milestone: number;
  label: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;
    if (!token) return null;

    const customer = await fetchCustomer(token);
    if (!customer) return null;

    return rewardForNextOrder(customer.numberOfOrders);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({error: "Invalid request body"}, {status: 400});
    }

    const email = String(body.email || "").trim();
    const lines = Array.isArray(body.lines) ? (body.lines as CartLineInput[]) : [];
    const paymentMethod = String(body.paymentMethod || "bank");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({error: "A valid email is required"}, {status: 400});
    }
    if (!lines.length || lines.length > 20) {
      return NextResponse.json({error: "Your cart is empty"}, {status: 400});
    }

    const address: OrderAddress = {
      firstName: String(body.firstName || "").trim(),
      lastName: String(body.lastName || "").trim(),
      address: String(body.address || "").trim(),
      apartment: String(body.apartment || "").trim(),
      city: String(body.city || "").trim(),
      state: String(body.state || "").trim(),
      postalCode: String(body.postalCode || "").trim(),
      country: String(body.country || "").trim(),
      phone: String(body.phone || "").trim(),
    };

    if (
      !address.firstName ||
      !address.lastName ||
      !address.address ||
      !address.city ||
      !address.postalCode ||
      !address.country
    ) {
      return NextResponse.json(
        {error: "Please complete the delivery address"},
        {status: 400},
      );
    }

    const lineItems: Array<{
      variantId: string;
      quantity: number;
      unitPrice: number;
    }> = [];
    let total = 0;
    let currency = "USD";

    for (const line of lines) {
      const handle = String(line.handle || "").trim();
      const quantity = Math.max(1, Math.min(20, Number(line.quantity) || 1));
      if (!handle) continue;

      const product = await getProduct(handle);
      if (!product || !product.variants.nodes.length) {
        return NextResponse.json(
          {error: `Product not found: ${handle}`},
          {status: 400},
        );
      }

      const variant = product.variants.nodes[0];
      const unitPrice = Number(product.priceRange.minVariantPrice.amount);
      currency = product.priceRange.minVariantPrice.currencyCode || currency;
      total += unitPrice * quantity;
      lineItems.push({variantId: variant.id, quantity, unitPrice});
    }

    if (!lineItems.length) {
      return NextResponse.json({error: "Your cart is empty"}, {status: 400});
    }

    const account = greyAccount();
    if (paymentMethod !== "flutterwave" && !account) {
      return NextResponse.json(
        {error: "Payment account is not configured yet"},
        {status: 503},
      );
    }

    const reward = await loyaltyRewardForSession();
    const discountPercent = reward?.percentOff || 0;
    const discountedTotal =
      Math.round(total * (1 - discountPercent / 100) * 100) / 100;

    const reference = newReference();
    const order = await createPendingOrder({
      lineItems,
      email,
      address,
      reference,
      total: discountedTotal,
      currency,
      discountPercent,
      discountLabel: reward?.label,
    });

    const intent = createPaymentIntent({
      reference,
      orderId: order.id,
      amount: discountedTotal,
      currency,
      email,
      percentOff: discountPercent,
    });

    return NextResponse.json({
      ok: true,
      reference: order.reference,
      orderName: order.name,
      orderId: order.id,
      subtotal: Math.round(total * 100) / 100,
      total: discountedTotal,
      currency: order.currency,
      discountPercent,
      discountLabel: reward?.label || null,
      account,
      intent,
    });
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : "Unable to start checkout"},
      {status: 500},
    );
  }
}

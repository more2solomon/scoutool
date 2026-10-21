import { NextResponse } from "next/server";
import { cartCreateMutation, shopifyFetch } from "../../../lib/shopify";

export async function POST(request) {
  try {
    const { merchandiseId } = await request.json();

    if (!merchandiseId) {
      return NextResponse.json({ error: "A product variant is required." }, { status: 400 });
    }

    const data = await shopifyFetch(cartCreateMutation, {
      input: { lines: [{ merchandiseId, quantity: 1 }] },
    });
    const result = data.cartCreate;

    if (result.userErrors?.length) {
      return NextResponse.json({ error: result.userErrors[0].message }, { status: 400 });
    }

    return NextResponse.json({ checkoutUrl: result.cart.checkoutUrl });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

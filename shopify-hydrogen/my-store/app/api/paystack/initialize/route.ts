import {NextRequest, NextResponse} from "next/server";
import {CATALOG} from "@/data/catalog";

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({error:"PAYSTACK_SECRET_KEY is not configured"},{status:500});
    }

    const body = await request.json();
    const handle = String(body.product || "");
    const email = String(body.email || "").trim();
    const product = CATALOG[handle as keyof typeof CATALOG];

    if (!product || !email) {
      return NextResponse.json({error:"Valid product and email are required"},{status:400});
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.velvetjournalco.store";
    const currency = process.env.PAYSTACK_CURRENCY || "USD";
    const reference = `VJ-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    const metadata = {
      product: handle,
      product_title: product.title,
      delivery: {
        first_name: String(body.firstName || ""),
        last_name: String(body.lastName || ""),
        address: String(body.address || ""),
        city: String(body.city || ""),
        state: String(body.state || ""),
        postal_code: String(body.postalCode || ""),
        country: String(body.country || ""),
      }
    };

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method:"POST",
      headers:{
        Authorization:`Bearer ${secret}`,
        "Content-Type":"application/json",
      },
      body:JSON.stringify({
        email,
        amount: Math.round(product.price * 100),
        currency,
        reference,
        callback_url:`${siteUrl}/checkout/success`,
        metadata,
      }),
      cache:"no-store",
    });

    const result = await response.json();
    if (!response.ok || !result.status) {
      return NextResponse.json({error:result.message || "Payment initialization failed"},{status:502});
    }

    return NextResponse.json({
      authorization_url: result.data.authorization_url,
      reference: result.data.reference,
    });
  } catch (error) {
    return NextResponse.json(
      {error:error instanceof Error ? error.message : "Unable to initialize payment"},
      {status:500},
    );
  }
}

import {NextRequest, NextResponse} from "next/server";

export async function GET(request: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const reference = request.nextUrl.searchParams.get("reference");

  if (!secret || !reference) {
    return NextResponse.json({ok:false},{status:400});
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {headers:{Authorization:`Bearer ${secret}`}, cache:"no-store"},
  );
  const result = await response.json();

  return NextResponse.json({
    ok: response.ok && result.status === true && result.data?.status === "success",
    reference,
    amount: result.data?.amount,
    currency: result.data?.currency,
    email: result.data?.customer?.email,
  });
}

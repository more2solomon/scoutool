import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {CUSTOMER_TOKEN_COOKIE, fetchCustomer} from "@/lib/customer";
import {loyaltyState} from "@/lib/loyalty";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ok: true, authenticated: false});
    }

    let customer;
    try {
      customer = await fetchCustomer(token);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load your account";
      return NextResponse.json(
        {ok: false, authenticated: false, error: message},
        {status: 401},
      );
    }

    if (!customer) {
      cookieStore.delete(CUSTOMER_TOKEN_COOKIE);
      return NextResponse.json({ok: true, authenticated: false});
    }

    return NextResponse.json({
      ok: true,
      authenticated: true,
      customer,
      loyalty: loyaltyState(customer.numberOfOrders),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        authenticated: false,
        error:
          error instanceof Error ? error.message : "Unable to load your account",
      },
      {status: 500},
    );
  }
}

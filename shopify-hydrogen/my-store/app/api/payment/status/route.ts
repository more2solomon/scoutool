import {NextRequest, NextResponse} from "next/server";
import {
  findOrderByReference,
  markOrderPaid,
} from "@/lib/shopifyAdmin";
import {
  findInflowForAmount,
  greyAccount,
  listTransactions,
} from "@/lib/grey";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference") || "";
    if (!reference) {
      return NextResponse.json({error: "reference is required"}, {status: 400});
    }

    const order = await findOrderByReference(reference);
    if (!order) {
      return NextResponse.json({status: "unknown", reference});
    }

    const paid = order.displayFinancialStatus === "PAID";
    const result: Record<string, unknown> = {
      status: paid ? "paid" : "pending",
      reference,
      orderName: order.name,
      total: Number(order.totalPriceSet.shopMoney.amount),
      currency: order.totalPriceSet.shopMoney.currencyCode,
      createdAt: order.createdAt,
      account: greyAccount(),
    };

    if (!paid) {
      try {
        const transactions = await listTransactions(100);
        const inflow = findInflowForAmount({
          transactions,
          amount: Number(order.totalPriceSet.shopMoney.amount),
          currency: order.totalPriceSet.shopMoney.currencyCode,
          sinceIso: order.createdAt,
        });
        if (inflow) {
          const marked = await markOrderPaid(order.id);
          result.status = marked ? "paid" : "review";
          result.matchedTransaction = inflow.reference;
        }
      } catch (error) {
        result.warning =
          error instanceof Error ? error.message : "Grey verification unavailable";
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to check payment",
      },
      {status: 500},
    );
  }
}

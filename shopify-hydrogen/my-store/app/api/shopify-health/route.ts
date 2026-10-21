import {NextResponse} from "next/server";
import {shopifyFetch} from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await shopifyFetch<{
      shop: {name: string};
      products: {nodes: Array<{title: string; handle: string}>};
    }>(`
      query Health {
        shop { name }
        products(first: 5) {
          nodes { title handle }
        }
      }
    `);

    return NextResponse.json({
      ok: true,
      shop: data.shop.name,
      productCountInSample: data.products.nodes.length,
      products: data.products.nodes,
      domainPresent: Boolean(
        process.env.PUBLIC_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN,
      ),
      privateTokenPresent: Boolean(process.env.PRIVATE_STOREFRONT_API_TOKEN),
      publicTokenPresent: Boolean(process.env.PUBLIC_STOREFRONT_API_TOKEN),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        domainPresent: Boolean(
          process.env.PUBLIC_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN,
        ),
        privateTokenPresent: Boolean(process.env.PRIVATE_STOREFRONT_API_TOKEN),
        publicTokenPresent: Boolean(process.env.PUBLIC_STOREFRONT_API_TOKEN),
      },
      {status: 500},
    );
  }
}

export type StoreProduct = {
  id: string;
  title: string;
  handle: string;
  description: string;
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
};

function getShopDomain() {
  return (
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
    ""
  )
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

function getToken() {
  return (
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    ""
  );
}

/* --------------------------------------------------
   GENERIC SHOPIFY FETCH
-------------------------------------------------- */

export async function shopifyFetch({
  query,
  variables = {},
}: {
  query: string;
  variables?: Record<string, unknown>;
}) {
  const domain = getShopDomain();
  const token = getToken();

  if (!domain) {
    throw new Error(
      "Missing SHOPIFY_STORE_DOMAIN in .env.local"
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["X-Shopify-Storefront-Access-Token"] = token;
  }

  const response = await fetch(
    `https://${domain}/api/2026-07/graphql.json`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: "no-store",
    }
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(
      `Shopify API error ${response.status}: ${JSON.stringify(body)}`
    );
  }

  if (body.errors) {
    throw new Error(
      `Shopify GraphQL error: ${JSON.stringify(body.errors)}`
    );
  }

  return body;
}

/* --------------------------------------------------
   PRODUCTS QUERY
-------------------------------------------------- */

export const productsQuery = `
  query StorefrontProducts {
    products(first: 16, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        title
        handle
        description

        featuredImage {
          url
          altText
          width
          height
        }

        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }

        variants(first: 1) {
          nodes {
            id
            availableForSale
          }
        }
      }
    }
  }
`;

/* --------------------------------------------------
   CART CREATE
-------------------------------------------------- */

export const cartCreateMutation = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity

        lines(first: 50) {
          nodes {
            id
            quantity

            merchandise {
              ... on ProductVariant {
                id
                title

                product {
                  title
                  handle
                }
              }
            }
          }
        }

        cost {
          subtotalAmount {
            amount
            currencyCode
          }

          totalAmount {
            amount
            currencyCode
          }
        }
      }

      userErrors {
        field
        message
      }
    }
  }
`;

/* --------------------------------------------------
   GET PRODUCTS
-------------------------------------------------- */

export async function getProducts(): Promise<StoreProduct[]> {
  try {
    const result = await shopifyFetch({
      query: productsQuery,
    });

    return result?.data?.products?.nodes || [];
  } catch (error) {
    console.error("Unable to load Shopify products:", error);
    return [];
  }
}

/* --------------------------------------------------
   MONEY
-------------------------------------------------- */

export function formatMoney(
  amount: string,
  currencyCode: string
) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode,
    }).format(Number(amount));
  } catch {
    return `${currencyCode} ${amount}`;
  }
}

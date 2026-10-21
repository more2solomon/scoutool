const API_VERSION =
  process.env.SHOPIFY_API_VERSION ||
  process.env.PUBLIC_STOREFRONT_API_VERSION ||
  "2026-07";

function storeDomain() {
  return (
    process.env.PUBLIC_STORE_DOMAIN ||
    process.env.SHOPIFY_STORE_DOMAIN ||
    ""
  )
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

function privateToken() {
  return process.env.PRIVATE_STOREFRONT_API_TOKEN || "";
}

function publicToken() {
  return process.env.PUBLIC_STOREFRONT_API_TOKEN || "";
}

type FetchOptions = {
  buyerIp?: string | null;
};

async function storefrontRequest(
  query: string,
  variables: Record<string, unknown>,
  tokenType: "private" | "public",
  options: FetchOptions,
) {
  const domain = storeDomain();
  const token = tokenType === "private" ? privateToken() : publicToken();

  if (!domain) throw new Error("Missing Shopify store domain");
  if (!token) throw new Error(`Missing Shopify ${tokenType} Storefront token`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (tokenType === "private") {
    headers["Shopify-Storefront-Private-Token"] = token;
    if (options.buyerIp) {
      headers["Shopify-Storefront-Buyer-IP"] = options.buyerIp;
    }
  } else {
    headers["X-Shopify-Storefront-Access-Token"] = token;
  }

  return fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({query, variables}),
    cache: "no-store",
  });
}

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: FetchOptions = {},
): Promise<T> {
  const attempts: Array<"private" | "public"> = [];
  if (privateToken()) attempts.push("private");
  if (publicToken()) attempts.push("public");

  if (!attempts.length) {
    throw new Error(
      "Missing PRIVATE_STOREFRONT_API_TOKEN and PUBLIC_STOREFRONT_API_TOKEN",
    );
  }

  let lastError = "Shopify request failed";

  for (const tokenType of attempts) {
    try {
      const response = await storefrontRequest(
        query,
        variables,
        tokenType,
        options,
      );

      const body = await response.json();

      if (response.ok && !body.errors) {
        return body.data as T;
      }

      lastError = `${tokenType} token: HTTP ${response.status} ${JSON.stringify(
        body.errors || body,
      )}`;
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Unknown Shopify error";
    }
  }

  throw new Error(lastError);
}

export type Money = {
  amount: string;
  currencyCode: string;
};

export type Product = {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml?: string;
  vendor: string;
  productType?: string;
  tags?: string[];
  seo?: {
    title?: string | null;
    description?: string | null;
  } | null;
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  images?: {
    nodes: Array<{
      url: string;
      altText?: string | null;
      width?: number | null;
      height?: number | null;
    }>;
  };
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice?: Money;
  };
  variants: {
    nodes: Array<{
      id: string;
      availableForSale: boolean;
      title: string;
    }>;
  };
};

export type Collection = {
  id: string;
  title: string;
  handle: string;
  description: string;
  seo?: {
    title?: string | null;
    description?: string | null;
  } | null;
  image?: {
    url: string;
    altText?: string | null;
  } | null;
  products: {
    nodes: Product[];
  };
};

export type ContentPage = {
  id: string;
  title: string;
  handle: string;
  body: string;
  bodySummary: string;
  seo?: {
    title?: string | null;
    description?: string | null;
  } | null;
};

export type ShopPolicy = {
  title: string;
  handle: string;
  body: string;
};

const PRODUCT_FIELDS = `
  id
  title
  handle
  description
  descriptionHtml
  vendor
  productType
  tags
  seo { title description }
  featuredImage { url altText width height }
  images(first: 12) {
    nodes { url altText width height }
  }
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  variants(first: 50) {
    nodes { id availableForSale title }
  }
`;

export async function getProducts(first = 24): Promise<Product[]> {
  const data = await shopifyFetch<{products: {nodes: Product[]}}>(
    `query Products($first: Int!) {
      products(first: $first, sortKey: CREATED_AT, reverse: true) {
        nodes { ${PRODUCT_FIELDS} }
      }
    }`,
    {first},
  );
  return data.products.nodes;
}

export async function getAllProducts(maxProducts = 500): Promise<Product[]> {
  const all: Product[] = [];
  let after: string | null = null;

  while (all.length < maxProducts) {
    const data: {
      products: {
        nodes: Product[];
        pageInfo: {hasNextPage: boolean; endCursor: string | null};
      };
    } = await shopifyFetch(
      `query AllProducts($first: Int!, $after: String) {
        products(first: $first, after: $after, sortKey: TITLE) {
          nodes { ${PRODUCT_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      {first: Math.min(100, maxProducts - all.length), after},
    );

    all.push(...data.products.nodes);
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
    if (!after) break;
  }

  return all;
}

export async function getProduct(handle: string): Promise<Product | null> {
  const data = await shopifyFetch<{product: Product | null}>(
    `query Product($handle: String!) {
      product(handle: $handle) { ${PRODUCT_FIELDS} }
    }`,
    {handle},
  );
  return data.product;
}

export async function getCollections(first = 50) {
  const data = await shopifyFetch<{
    collections: {
      nodes: Array<{
        id: string;
        title: string;
        handle: string;
        description: string;
        image?: {url: string; altText?: string | null} | null;
        seo?: {title?: string | null; description?: string | null} | null;
      }>;
    };
  }>(
    `query Collections($first: Int!) {
      collections(first: $first, sortKey: TITLE) {
        nodes {
          id title handle description
          image { url altText }
          seo { title description }
        }
      }
    }`,
    {first},
  );
  return data.collections.nodes;
}

export async function getCollection(handle: string): Promise<Collection | null> {
  const data = await shopifyFetch<{collection: Collection | null}>(
    `query Collection($handle: String!) {
      collection(handle: $handle) {
        id title handle description
        seo { title description }
        image { url altText }
        products(first: 100) {
          nodes { ${PRODUCT_FIELDS} }
        }
      }
    }`,
    {handle},
  );
  return data.collection;
}

export async function getPages(first = 100) {
  const data = await shopifyFetch<{pages: {nodes: ContentPage[]}}>(
    `query Pages($first: Int!) {
      pages(first: $first, sortKey: TITLE) {
        nodes {
          id title handle body bodySummary
          seo { title description }
        }
      }
    }`,
    {first},
  );
  return data.pages.nodes;
}

export async function getPage(handle: string): Promise<ContentPage | null> {
  const data = await shopifyFetch<{page: ContentPage | null}>(
    `query Page($handle: String!) {
      page(handle: $handle) {
        id title handle body bodySummary
        seo { title description }
      }
    }`,
    {handle},
  );
  return data.page;
}

export async function getPolicies(): Promise<ShopPolicy[]> {
  const data = await shopifyFetch<{
    shop: {
      privacyPolicy?: ShopPolicy | null;
      refundPolicy?: ShopPolicy | null;
      shippingPolicy?: ShopPolicy | null;
      termsOfService?: ShopPolicy | null;
    };
  }>(`
    query Policies {
      shop {
        privacyPolicy { title handle body }
        refundPolicy { title handle body }
        shippingPolicy { title handle body }
        termsOfService { title handle body }
      }
    }
  `);

  return [
    data.shop.privacyPolicy,
    data.shop.refundPolicy,
    data.shop.shippingPolicy,
    data.shop.termsOfService,
  ].filter(Boolean) as ShopPolicy[];
}

export async function getPolicy(handle: string): Promise<ShopPolicy | null> {
  const policies = await getPolicies();
  return policies.find((policy) => policy.handle === handle) || null;
}

export async function getArticles(first = 30) {
  const data = await shopifyFetch<{
    blogs: {
      nodes: Array<{
        id: string;
        title: string;
        handle: string;
        articles: {
          nodes: Array<{
            id: string;
            title: string;
            handle: string;
            excerpt: string;
            contentHtml: string;
            publishedAt: string;
            image?: {url: string; altText?: string | null} | null;
            seo?: {title?: string | null; description?: string | null} | null;
          }>;
        };
      }>;
    };
  }>(
    `query Blogs($first: Int!) {
      blogs(first: 10) {
        nodes {
          id title handle
          articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
            nodes {
              id title handle excerpt contentHtml publishedAt
              image { url altText }
              seo { title description }
            }
          }
        }
      }
    }`,
    {first},
  );

  return data.blogs.nodes.flatMap((blog) =>
    blog.articles.nodes.map((article) => ({
      ...article,
      blogHandle: blog.handle,
      blogTitle: blog.title,
    })),
  );
}

export async function getArticle(blogHandle: string, articleHandle: string) {
  const data = await shopifyFetch<{
    blog: {
      articleByHandle: {
        id: string;
        title: string;
        handle: string;
        excerpt: string;
        contentHtml: string;
        publishedAt: string;
        image?: {url: string; altText?: string | null} | null;
        seo?: {title?: string | null; description?: string | null} | null;
      } | null;
    } | null;
  }>(
    `query Article($blogHandle: String!, $articleHandle: String!) {
      blog(handle: $blogHandle) {
        articleByHandle(handle: $articleHandle) {
          id title handle excerpt contentHtml publishedAt
          image { url altText }
          seo { title description }
        }
      }
    }`,
    {blogHandle, articleHandle},
  );
  return data.blog?.articleByHandle || null;
}

export function money(amount: string, currencyCode: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(Number(amount));
  } catch {
    return `${currencyCode} ${amount}`;
  }
}

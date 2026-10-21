const API_VERSION =
  process.env.SHOPIFY_API_VERSION ||
  process.env.PUBLIC_STOREFRONT_API_VERSION ||
  "2026-07";

function storeDomain(): string {
  const domain = (
    process.env.PUBLIC_STORE_DOMAIN ||
    process.env.SHOPIFY_STORE_DOMAIN ||
    ""
  ).trim();
  if (!domain) throw new Error("PUBLIC_STORE_DOMAIN is not configured");
  return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

let cachedToken: {value: string; expiresAt: number} | null = null;

export async function adminToken(): Promise<string> {
  const direct = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  if (direct) return direct;

  const clientId = process.env.SHOPIFY_ADMIN_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Shopify Admin credentials missing: set SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_ADMIN_CLIENT_ID/SHOPIFY_ADMIN_CLIENT_SECRET",
    );
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const res = await fetch(`https://${storeDomain()}/admin/oauth/access_token`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      `Shopify Admin token exchange failed (${res.status}): ${JSON.stringify(data)}`,
    );
  }

  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 86400;
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  return data.access_token;
}

export async function adminGraphql<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await adminToken();
  const res = await fetch(
    `https://${storeDomain()}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({query, variables}),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify Admin API ${res.status}: ${text.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{message: string}>;
  };

  if (json.errors?.length) {
    throw new Error(`Shopify Admin API error: ${json.errors[0].message}`);
  }
  if (!json.data) throw new Error("Shopify Admin API returned no data");
  return json.data;
}

const COUNTRY_NAMES_TO_CODES = (() => {
  let display: Intl.DisplayNames;
  try {
    display = new Intl.DisplayNames(["en"], {type: "region"});
  } catch {
    return null;
  }
  const map = new Map<string, string>();
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const a of letters) {
    for (const b of letters) {
      const code = a + b;
      try {
        const name = display.of(code);
        if (name && name !== code) map.set(name.toLowerCase(), code);
      } catch {
        // ignore invalid codes
      }
    }
  }
  return map;
})();

export function countryToCode(country: string): string {
  const normalized = country.trim().toLowerCase();
  if (/^[a-z]{2}$/.test(normalized)) return normalized.toUpperCase();
  return COUNTRY_NAMES_TO_CODES?.get(normalized) || "US";
}

export type OrderAddress = {
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
};

export type CreatedOrder = {
  id: string;
  name: string;
  reference: string;
  total: number;
  currency: string;
};

type AdminOrderNode = {
  id: string;
  name: string;
  displayFinancialStatus: string | null;
  createdAt: string;
  totalPriceSet: {shopMoney: {amount: string; currencyCode: string}};
};

function buildOrderInput(options: {
  lineItems: Array<{variantId: string; quantity: number}>;
  email: string;
  address: OrderAddress;
  reference: string;
  includeProvince: boolean;
  currency: string;
}): Record<string, unknown> {
  const {lineItems, email, address, reference, includeProvince, currency} = options;

  const shippingAddress: Record<string, unknown> = {
    firstName: address.firstName,
    lastName: address.lastName,
    address1: address.address,
    address2: address.apartment || "",
    city: address.city,
    zip: address.postalCode,
    countryCode: countryToCode(address.country),
  };
  if (includeProvince && address.state) shippingAddress.provinceCode = address.state;
  if (address.phone) shippingAddress.phone = address.phone;

  return {
    currency,
    email,
    financialStatus: "PENDING",
    processedAt: new Date().toISOString(),
    note: `Velvet Journal order — payment reference ${reference}`,
    tags: ["velvet-journal", `ref-${reference}`],
    lineItems,
    shippingAddress,
    customer: {
      toUpsert: {
        email,
        firstName: address.firstName,
        lastName: address.lastName,
      },
    },
  };
}

const ORDER_CREATE_MUTATION = `
  mutation CreateOrder($order: OrderCreateOrderInput!) {
    orderCreate(order: $order) {
      userErrors { field message }
      order {
        id
        name
        displayFinancialStatus
        totalPriceSet { shopMoney { amount currencyCode } }
      }
    }
  }
`;

const DRAFT_ORDER_MUTATION = `
  mutation CreateDraft($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      userErrors { field message }
      draftOrder { id }
    }
  }
`;

const DRAFT_COMPLETE_MUTATION = `
  mutation CompleteDraft($id: ID!) {
    draftOrderComplete(id: $id) {
      userErrors { field message }
      order { id name totalPriceSet { shopMoney { amount currencyCode } } }
    }
  }
`;

type OrderCreatePayload = {
  orderCreate: {
    userErrors: Array<{field: string[] | null; message: string}>;
    order: AdminOrderNode | null;
  };
};

type DraftPayload = {
  draftOrderCreate: {
    userErrors: Array<{field: string[] | null; message: string}>;
    draftOrder: {id: string} | null;
  };
};

type DraftCompletePayload = {
  draftOrderComplete: {
    userErrors: Array<{field: string[] | null; message: string}>;
    order: AdminOrderNode | null;
  };
};

export async function createPendingOrder(options: {
  lineItems: Array<{variantId: string; quantity: number}>;
  email: string;
  address: OrderAddress;
  reference: string;
  total: number;
  currency: string;
}): Promise<CreatedOrder> {
  const input = buildOrderInput({...options, includeProvince: true});

  let data = await adminGraphql<OrderCreatePayload>(ORDER_CREATE_MUTATION, {
    order: input,
  });
  let payload = data.orderCreate;

  if (payload.userErrors.length && payload.userErrors.some((e) => (e.field || []).join(".").includes("province"))) {
    data = await adminGraphql<OrderCreatePayload>(ORDER_CREATE_MUTATION, {
      order: buildOrderInput({...options, includeProvince: false}),
    });
    payload = data.orderCreate;
  }

  if (payload.order && payload.userErrors.length === 0) {
    return {
      id: payload.order.id,
      name: payload.order.name,
      reference: options.reference,
      total: options.total,
      currency: options.currency,
    };
  }

  const messages = payload.userErrors.map((e) => e.message).join("; ");

  // orderCreate requires offline tokens on some app types — fall back to a draft order.
  const draftInput = {
    ...input,
    useCustomerDefaultAddress: false,
  };
  const draft = await adminGraphql<DraftPayload>(DRAFT_ORDER_MUTATION, {
    input: draftInput,
  });
  if (draft.draftOrderCreate.userErrors.length || !draft.draftOrderCreate.draftOrder) {
    throw new Error(
      `Unable to create order: ${messages || JSON.stringify(draft.draftOrderCreate.userErrors)}`,
    );
  }

  const completed = await adminGraphql<DraftCompletePayload>(
    DRAFT_COMPLETE_MUTATION,
    {id: draft.draftOrderCreate.draftOrder.id},
  );
  const order = completed.draftOrderComplete.order;
  if (!order) {
    throw new Error(
      `Unable to complete draft order: ${JSON.stringify(completed.draftOrderComplete.userErrors)}`,
    );
  }

  return {
    id: order.id,
    name: order.name,
    reference: options.reference,
    total: options.total,
    currency: options.currency,
  };
}

const ORDERS_QUERY = `
  query OrdersByQuery($query: String!, $first: Int!) {
    orders(first: $first, query: $query, reverse: true) {
      nodes {
        id
        name
        displayFinancialStatus
        createdAt
        totalPriceSet { shopMoney { amount currencyCode } }
      }
    }
  }
`;

export async function findOrderByReference(
  reference: string,
): Promise<AdminOrderNode | null> {
  const data = await adminGraphql<{orders: {nodes: AdminOrderNode[]}}>(
    ORDERS_QUERY,
    {query: `tag:"ref-${reference}"`, first: 5},
  );
  return data.orders.nodes[0] || null;
}

export async function listPendingOrders(
  limit = 25,
): Promise<AdminOrderNode[]> {
  const data = await adminGraphql<{orders: {nodes: AdminOrderNode[]}}>(
    ORDERS_QUERY,
    {query: "financial_status:pending", first: limit},
  );
  return data.orders.nodes;
}

const MARK_PAID_MUTATION = `
  mutation MarkOrderPaid($input: OrderMarkAsPaidInput!) {
    orderMarkAsPaid(input: $input) {
      userErrors { field message }
      order { id name displayFinancialStatus }
    }
  }
`;

export async function markOrderPaid(orderId: string): Promise<boolean> {
  try {
    const data = await adminGraphql<{
      orderMarkAsPaid: {
        userErrors: Array<{field: string[] | null; message: string}>;
        order: {id: string; displayFinancialStatus: string | null} | null;
      };
    }>(MARK_PAID_MUTATION, {input: {id: orderId}});
    const payload = data.orderMarkAsPaid;
    if (payload.order?.displayFinancialStatus === "PAID") return true;
    if (payload.order) return true;
    return false;
  } catch {
    return false;
  }
}

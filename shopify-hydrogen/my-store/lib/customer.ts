import {shopifyFetch} from "@/lib/shopify";

export const CUSTOMER_TOKEN_COOKIE = "vj_customer_token";
export const CUSTOMER_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

export type CustomerOrder = {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  total: number;
  currencyCode: string;
  itemCount: number;
};

export type CustomerProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  numberOfOrders: number;
  orders: CustomerOrder[];
  lifetimeValue: number;
};

const CREATE_TOKEN_MUTATION = `
  mutation CreateCustomerAccessToken($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`;

const CREATE_CUSTOMER_MUTATION = `
  mutation CreateCustomer($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`;

const DELETE_TOKEN_MUTATION = `
  mutation DeleteCustomerAccessToken($customerAccessToken: String!) {
    customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
      deletedAccessToken
      userErrors {
        field
        message
      }
    }
  }
`;

const CUSTOMER_QUERY = `
  query CustomerDashboard($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      email
      firstName
      lastName
      numberOfOrders
      orders(first: 30, reverse: true) {
        nodes {
          id
          name
          orderNumber
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice {
            amount
            currencyCode
          }
          lineItems(first: 20) {
            nodes {
              title
              quantity
            }
          }
        }
      }
    }
  }
`;

const RECOVER_MUTATION = `
  mutation RecoverCustomer($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors {
        field
        message
      }
    }
  }
`;

type TokenResult = {
  customerAccessToken: {accessToken: string; expiresAt: string} | null;
  customerUserErrors: Array<{field: string[] | null; message: string}>;
};

export type CustomerAuthResult =
  | {ok: true; accessToken: string; expiresAt: string}
  | {ok: false; error: string};

export async function loginCustomer(
  email: string,
  password: string,
): Promise<CustomerAuthResult> {
  const data = await shopifyFetch<{customerAccessTokenCreate: TokenResult}>(
    CREATE_TOKEN_MUTATION,
    {input: {email, password}},
  );

  const payload = data.customerAccessTokenCreate;
  if (payload.customerAccessToken?.accessToken) {
    return {
      ok: true,
      accessToken: payload.customerAccessToken.accessToken,
      expiresAt: payload.customerAccessToken.expiresAt,
    };
  }

  const message =
    payload.customerUserErrors?.[0]?.message || "Unable to sign in with those details";
  return {ok: false, error: message};
}

export async function registerCustomer(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ok: true} | {ok: false; error: string}> {
  const data = await shopifyFetch<{
    customerCreate: {
      customer: {id: string} | null;
      customerUserErrors: Array<{field: string[] | null; message: string}>;
    };
  }>(CREATE_CUSTOMER_MUTATION, {
    input: {
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });

  const payload = data.customerCreate;
  if (payload.customer) return {ok: true};

  const message =
    payload.customerUserErrors?.[0]?.message ||
    "Unable to create your account right now";
  return {ok: false, error: message};
}

export async function recoverCustomer(email: string): Promise<void> {
  await shopifyFetch(RECOVER_MUTATION, {email});
}

export async function logoutCustomer(accessToken: string): Promise<void> {
  try {
    await shopifyFetch(DELETE_TOKEN_MUTATION, {customerAccessToken: accessToken});
  } catch {
    // Revoking is best effort; the cookie is cleared either way.
  }
}

async function customerRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  accessToken: string,
): Promise<T> {
  const domain = (
    process.env.PUBLIC_STORE_DOMAIN ||
    process.env.SHOPIFY_STORE_DOMAIN ||
    ""
  )
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const version =
    process.env.SHOPIFY_API_VERSION ||
    process.env.PUBLIC_STOREFRONT_API_VERSION ||
    "2026-07";

  const response = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": accessToken,
    },
    body: JSON.stringify({query, variables}),
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.errors) {
    const message =
      body.errors?.[0]?.message || `Storefront request failed (${response.status})`;
    throw new Error(message);
  }

  return body.data as T;
}

type StorefrontOrderNode = {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: {amount: string; currencyCode: string} | null;
  lineItems: {nodes: Array<{title: string; quantity: number}>};
};

export async function fetchCustomer(
  accessToken: string,
): Promise<CustomerProfile | null> {
  const data = await customerRequest<{
    customer: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      numberOfOrders: number;
      orders: {nodes: StorefrontOrderNode[]};
    } | null;
  }>(CUSTOMER_QUERY, {customerAccessToken: accessToken}, accessToken);

  const customer = data.customer;
  if (!customer) return null;

  const orders: CustomerOrder[] = (customer.orders?.nodes || []).map((order) => ({
    id: order.id,
    name: order.name,
    orderNumber: order.orderNumber,
    processedAt: order.processedAt || null,
    financialStatus: order.financialStatus || null,
    fulfillmentStatus: order.fulfillmentStatus || null,
    total: Number(order.totalPrice?.amount || 0),
    currencyCode: order.totalPrice?.currencyCode || "USD",
    itemCount: (order.lineItems?.nodes || []).reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    ),
  }));

  const lifetimeValue = orders
    .filter((order) => order.financialStatus === "PAID")
    .reduce((sum, order) => sum + order.total, 0);

  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName || "",
    lastName: customer.lastName || "",
    numberOfOrders: customer.numberOfOrders || orders.length,
    orders,
    lifetimeValue,
  };
}

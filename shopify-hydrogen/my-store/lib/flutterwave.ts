import crypto from "node:crypto";

const API_BASE =
  process.env.FLUTTERWAVE_API_BASE || "https://api.flutterwave.com/v3";

export type FlutterwaveCustomer = {
  email?: string;
  name?: string;
  phonenumber?: string;
};

export type FlutterwaveTransaction = {
  id: number;
  tx_ref: string;
  amount: number;
  currency: string;
  status: string;
  customer?: FlutterwaveCustomer;
  created_at?: string;
};

export type FlutterwavePaymentInput = {
  txRef: string;
  amount: number;
  currency: string;
  email: string;
  name?: string;
  phone?: string;
  redirectUrl: string;
  description?: string;
  meta?: Record<string, unknown>;
};

export function flutterwaveSecretKey(): string {
  return (
    process.env.FLUTTERWAVE_SECRET_KEY?.trim() ||
    process.env.FLW_SECRET_KEY?.trim() ||
    ""
  );
}

export function flutterwaveCurrency(): string {
  return (
    process.env.FLUTTERWAVE_CURRENCY?.trim() ||
    process.env.FLUTTERWAVE_CURRENCY_CODE?.trim() ||
    "USD"
  ).toUpperCase();
}

export function flutterwavePaymentOptions(): string {
  return (
    process.env.FLUTTERWAVE_PAYMENT_OPTIONS?.trim() ||
    "card,mobilemoney,banktransfer"
  );
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${flutterwaveSecretKey()}`,
    "Content-Type": "application/json",
  };
}

export async function createPaymentLink(
  input: FlutterwavePaymentInput,
): Promise<{link: string}> {
  const secret = flutterwaveSecretKey();
  if (!secret) throw new Error("FLUTTERWAVE_SECRET_KEY is not configured");

  const response = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      tx_ref: input.txRef,
      amount: Number(input.amount),
      currency: input.currency,
      redirect_url: input.redirectUrl,
      payment_options: flutterwavePaymentOptions(),
      customer: {
        email: input.email,
        name: input.name || undefined,
        phonenumber: input.phone || undefined,
      },
      customizations: {
        title: process.env.FLUTTERWAVE_PAYMENT_TITLE || "Velvet Journal Co",
        description:
          input.description || "Payment for your Velvet Journal Co order",
      },
      meta: input.meta || {},
    }),
    cache: "no-store",
  });

  const body = (await response.json().catch(() => ({}))) as {
    status?: string;
    message?: string;
    data?: {link?: string};
  };

  if (!response.ok || body.status !== "success" || !body.data?.link) {
    throw new Error(
      body.message || `Flutterwave request failed (${response.status})`,
    );
  }

  return {link: body.data.link};
}

export async function verifyTransaction(
  transactionId: string,
): Promise<FlutterwaveTransaction | null> {
  const secret = flutterwaveSecretKey();
  if (!secret || !transactionId) return null;

  const response = await fetch(
    `${API_BASE}/transactions/${encodeURIComponent(transactionId)}/verify`,
    {headers: authHeaders(), cache: "no-store"},
  );

  const body = (await response.json().catch(() => ({}))) as {
    status?: string;
    message?: string;
    data?: FlutterwaveTransaction;
  };

  if (!response.ok || body.status !== "success" || !body.data) {
    throw new Error(
      body.message || `Flutterwave verification failed (${response.status})`,
    );
  }

  return body.data;
}

/**
 * Flutterwave sends the dashboard secret hash back in the `verif-hash` header.
 * Older integrations compare it against a SHA-256 hash of the secret key, so
 * both forms are accepted.
 */
export function verifyWebhookSignature(
  signatureHeader: string | null,
): boolean {
  const expected = process.env.FLUTTERWAVE_WEBHOOK_SECRET?.trim();
  if (!signatureHeader || !expected) return false;

  const provided = signatureHeader.trim();
  if (provided === expected) return true;

  const secretKey = flutterwaveSecretKey();
  if (!secretKey) return false;

  const legacy = crypto.createHash("sha256").update(secretKey).digest("hex");
  if (provided === legacy) return true;

  const providedBuf = Buffer.from(provided, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (
    providedBuf.length === expectedBuf.length &&
    providedBuf.length > 0 &&
    crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return true;
  }

  return false;
}

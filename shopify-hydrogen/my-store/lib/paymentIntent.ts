import crypto from "node:crypto";

export type PaymentIntent = {
  reference: string;
  orderId: string;
  amount: number;
  currency: string;
  email: string;
  percentOff: number;
  issuedAt: number;
};

const TTL_MS = 1000 * 60 * 60 * 2;

function secret(): string {
  return (
    process.env.PAYMENT_INTENT_SECRET?.trim() ||
    process.env.FLUTTERWAVE_SECRET_KEY?.trim() ||
    process.env.GREY_API_SECRET_KEY?.trim() ||
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() ||
    ""
  );
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
}

export function createPaymentIntent(
  intent: Omit<PaymentIntent, "issuedAt">,
): string | null {
  const key = secret();
  if (!key) return null;

  const payload = encode(JSON.stringify({...intent, issuedAt: Date.now()}));
  return `${payload}.${sign(payload)}`;
}

export function readPaymentIntent(token: string | null | undefined): PaymentIntent | null {
  const key = secret();
  if (!key || !token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const providedBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const intent = JSON.parse(decode(payload)) as PaymentIntent;
    if (!intent?.reference || !Number.isFinite(intent.amount)) return null;
    if (Date.now() - Number(intent.issuedAt || 0) > TTL_MS) return null;
    return intent;
  } catch {
    return null;
  }
}

import crypto from "node:crypto";

function greyBase(): string {
  return process.env.GREY_ENV === "sandbox"
    ? "https://businessapi-sandbox.grey.co"
    : "https://businessapi.grey.co";
}

export function greySecretKey(): string {
  const key =
    process.env.GREY_API_SECRET_KEY?.trim() ||
    process.env.GREY_API_KEY?.trim() ||
    "";
  return key;
}

export type GreyTransaction = {
  id: string;
  reference: string;
  client_reference?: string | null;
  status: string;
  source_amount: number;
  source_currency: string;
  destination_amount: number;
  destination_currency: string;
  transaction_type?: string;
  created_at?: string;
  completed_at?: string;
  sender?: {
    name?: string;
    bank_name?: string;
    account_number?: string;
    country?: string;
  };
};

type GreyListResponse = {
  status?: string;
  data?: GreyTransaction[] | {transactions?: GreyTransaction[]};
  message?: string;
};

export type GreyAccount = {
  holder: string;
  bankName: string;
  accountNumber: string;
  routing: string;
  swift: string;
  country: string;
  currency: string;
  referenceRequired: boolean;
};

export function greyAccount(): GreyAccount | null {
  const accountNumber =
    process.env.GREY_ACCOUNT_NUMBER?.trim() ||
    process.env.GREY_ACCOUNT_IBAN?.trim() ||
    "";
  if (!accountNumber) return null;
  return {
    holder: process.env.GREY_ACCOUNT_HOLDER?.trim() || "",
    bankName: process.env.GREY_ACCOUNT_BANK_NAME?.trim() || "Grey Finance",
    accountNumber,
    routing:
      process.env.GREY_ACCOUNT_ROUTING?.trim() ||
      process.env.GREY_ACCOUNT_SORT_CODE?.trim() ||
      "",
    swift: process.env.GREY_ACCOUNT_SWIFT?.trim() || "",
    country: process.env.GREY_ACCOUNT_COUNTRY?.trim() || "US",
    currency: (process.env.GREY_CURRENCY?.trim() || "USD").toUpperCase(),
    referenceRequired: true,
  };
}

export async function listTransactions(limit = 100): Promise<GreyTransaction[]> {
  const secret = greySecretKey();
  if (!secret) throw new Error("GREY_API_SECRET_KEY is not configured");

  const res = await fetch(
    `${greyBase()}/api/v1/transactions?page=1&limit=${Math.min(limit, 100)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Grey API ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as GreyListResponse;
  if (Array.isArray(json.data)) return json.data;
  if (json.data && Array.isArray(json.data.transactions)) return json.data.transactions;
  return [];
}

function amountsMatch(a: number, b: number): boolean {
  return Math.abs(Number(a) - Number(b)) < 0.011;
}

export function findInflowForAmount(options: {
  transactions: GreyTransaction[];
  amount: number;
  currency: string;
  sinceIso?: string;
}): GreyTransaction | null {
  const {transactions, amount, currency, sinceIso} = options;
  const since = sinceIso ? Date.parse(sinceIso) : 0;

  const candidates = transactions.filter((tx) => {
    if (String(tx.status).toLowerCase() !== "completed") return false;
    const txAmount =
      Number(tx.destination_amount ?? 0) > 0
        ? Number(tx.destination_amount)
        : Number(tx.source_amount ?? 0);
    if (!amountsMatch(txAmount, amount)) return false;
    const txCurrency = (tx.destination_currency || tx.source_currency || "").toUpperCase();
    if (txCurrency && txCurrency !== currency.toUpperCase()) return false;
    const created = Date.parse(tx.created_at || tx.completed_at || "");
    if (since && Number.isFinite(created) && created < since) return false;
    return true;
  });

  return candidates[0] || null;
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const provided = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice("sha256=".length)
    : signatureHeader;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const providedBuf = Buffer.from(provided, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

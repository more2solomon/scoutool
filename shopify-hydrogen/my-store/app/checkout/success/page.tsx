"use client";

import {Suspense, useCallback, useEffect, useRef, useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type PaymentStatus = {
  status: "pending" | "paid" | "review" | "unknown";
  reference: string;
  orderName?: string;
  total?: number;
  currency?: string;
  createdAt?: string;
  account?: {
    holder: string;
    bankName: string;
    accountNumber: string;
    routing: string;
    swift: string;
    country: string;
    currency: string;
  } | null;
  error?: string;
  warning?: string;
};

function SuccessContent() {
  const search = useSearchParams();
  const reference = search.get("reference") || "";
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const attempts = useRef(0);

  const check = useCallback(
    async (manual = false) => {
      if (!reference) return;
      if (manual) setChecking(true);
      try {
        const response = await fetch(
          `/api/payment/status?reference=${encodeURIComponent(reference)}`,
        );
        const data = (await response.json()) as PaymentStatus;
        setPayment(data);
      } catch {
        setPayment({status: "unknown", reference});
      } finally {
        if (manual) setChecking(false);
      }
    },
    [reference],
  );

  useEffect(() => {
    if (!reference) return;
    const initial = setTimeout(() => void check(), 0);
    const interval = setInterval(() => {
      attempts.current += 1;
      if (attempts.current > 20) {
        clearInterval(interval);
        return;
      }
      void check();
    }, 15000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [reference, check]);

  const paid = payment?.status === "paid";
  const account = payment?.account;

  return (
    <>
      <Header />
      <main className="charge-shell simple-page">
        {!reference && <h1>Order reference missing</h1>}

        {reference && paid && (
          <>
            <h1>Payment confirmed</h1>
            <p>Thank you for your order {payment?.orderName ? <strong>{payment.orderName}</strong> : null}.</p>
            <p>
              Reference: <strong>{reference}</strong>
            </p>
            <p>We will prepare your journals for dispatch.</p>
            <Link className="charge-button" href="/collections/all">
              Continue shopping
            </Link>
          </>
        )}

        {reference && !paid && (
          <>
            <h1>Complete your payment</h1>
            <p>
              Your order <strong>{payment?.orderName || reference}</strong> has
              been reserved. Pay the exact amount below using any bank transfer
              method, and include the reference so we can match your payment.
            </p>

            <div className="payment-instructions">
              <div className="payment-instructions-row">
                <span>Amount</span>
                <strong>
                  {(payment?.currency || "USD")}{" "}
                  {payment?.total != null ? payment.total.toFixed(2) : "—"}
                </strong>
              </div>

              <div className="payment-instructions-row">
                <span>Reference (required)</span>
                <strong>{reference}</strong>
              </div>

              {account ? (
                <>
                  <div className="payment-instructions-row">
                    <span>Account holder</span>
                    <strong>{account.holder || "Velvet Journal Co"}</strong>
                  </div>
                  <div className="payment-instructions-row">
                    <span>Bank</span>
                    <strong>{account.bankName}</strong>
                  </div>
                  <div className="payment-instructions-row">
                    <span>Account number</span>
                    <strong>{account.accountNumber}</strong>
                  </div>
                  {account.routing && (
                    <div className="payment-instructions-row">
                      <span>Routing / sort code</span>
                      <strong>{account.routing}</strong>
                    </div>
                  )}
                  {account.swift && (
                    <div className="payment-instructions-row">
                      <span>SWIFT / BIC</span>
                      <strong>{account.swift}</strong>
                    </div>
                  )}
                </>
              ) : (
                <p>
                  Payment account details are being configured. Email
                  gnewton581@gmail.com with your reference and we will send them
                  to you.
                </p>
              )}
            </div>

            {payment?.warning && <p className="checkout-error">{payment.warning}</p>}

            <p className="payment-small">
              Once your transfer lands, this page confirms automatically — you
              can also check manually below.
            </p>

            <button
              type="button"
              className="charge-button"
              onClick={() => void check(true)}
              disabled={checking}
            >
              {checking ? "Checking…" : "I have sent the payment"}
            </button>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<main style={{padding: 40}}>Loading…</main>}>
      <SuccessContent />
    </Suspense>
  );
}

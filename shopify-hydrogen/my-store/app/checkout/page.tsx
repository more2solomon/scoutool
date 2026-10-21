"use client";

import {useEffect, useMemo, useState, useSyncExternalStore} from "react";
import {useSearchParams, useRouter} from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type {LocalCartLine} from "@/components/AddToCart";

const CART_KEY = "vj_local_cart";

function subscribeToCart(callback: () => void) {
  window.addEventListener("vj-cart-updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("vj-cart-updated", callback);
    window.removeEventListener("storage", callback);
  };
}

function readCartSnapshot(): string {
  try {
    return localStorage.getItem(CART_KEY) || "[]";
  } catch {
    return "[]";
  }
}

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const directProduct = params.get("product");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"flutterwave" | "bank">(
    "flutterwave",
  );
  const [rewardPercent, setRewardPercent] = useState(0);
  const [rewardLabel, setRewardLabel] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/account/dashboard", {cache: "no-store"})
      .then((response) => response.json())
      .then(
        (data: {
          authenticated?: boolean;
          loyalty?: {reward?: {percentOff: number; label?: string} | null};
        }) => {
          if (!active || !data?.authenticated) return;
          const reward = data.loyalty?.reward;
          if (reward?.percentOff) {
            setRewardPercent(reward.percentOff);
            setRewardLabel(reward.label || "");
          }
        },
      )
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const cartSnapshot = useSyncExternalStore(
    subscribeToCart,
    readCartSnapshot,
    () => "[]",
  );

  const cart = useMemo<LocalCartLine[]>(() => {
    try {
      const parsed = JSON.parse(cartSnapshot);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [cartSnapshot]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, line) =>
          sum + Number(line.price) * Number(line.quantity),
        0,
      ),
    [cart],
  );

  const discount = useMemo(
    () => Math.round(subtotal * (rewardPercent / 100) * 100) / 100,
    [subtotal, rewardPercent],
  );

  const total = useMemo(
    () => Math.round((subtotal - discount) * 100) / 100,
    [subtotal, discount],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");

    const form = new FormData(event.currentTarget);
    const lines = cart.map((line) => ({
      handle: line.handle,
      quantity: line.quantity,
    }));

    if (directProduct && !lines.some((line) => line.handle === directProduct)) {
      lines.push({handle: directProduct, quantity: 1});
    }

    if (!lines.length) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          email: form.get("email"),
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          address: form.get("address"),
          apartment: form.get("apartment"),
          city: form.get("city"),
          state: form.get("state"),
          postalCode: form.get("postalCode"),
          country: form.get("country"),
          phone: form.get("phone"),
          lines,
          paymentMethod,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to place your order");
      }

      try {
        localStorage.setItem("vj_last_order", JSON.stringify(result));
        localStorage.removeItem(CART_KEY);
        window.dispatchEvent(new Event("vj-cart-updated"));
      } catch {
        // storage failures should not block checkout
      }

      if (paymentMethod === "flutterwave" && result.intent) {
        const paymentResponse = await fetch("/api/flutterwave/initialize", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            intent: result.intent,
            name: `${form.get("firstName") || ""} ${form.get("lastName") || ""}`.trim(),
            phone: form.get("phone") || "",
          }),
        });

        const payment = await paymentResponse.json();
        if (!paymentResponse.ok || !payment.link) {
          throw new Error(payment.error || "Unable to start the payment");
        }

        window.location.href = payment.link;
        return;
      }

      router.push(
        `/checkout/success?reference=${encodeURIComponent(result.reference)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place your order");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />

      <main className="charge-shell checkout-page">
        <section>
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/cart">Cart</Link>
            <span>›</span>
            <span>Checkout</span>
          </div>

          <h1>Checkout</h1>

          <p className="checkout-intro">
            Enter your contact and delivery information below.
          </p>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <h2>Contact</h2>

            <label>
              Email*
              <input
                required
                type="email"
                name="email"
                placeholder="Email"
              />
            </label>

            <h2>Delivery</h2>

            <div className="checkout-two">
              <label>
                First name*
                <input required name="firstName" />
              </label>

              <label>
                Last name*
                <input required name="lastName" />
              </label>
            </div>

            <label>
              Address*
              <input required name="address" />
            </label>

            <label>
              Apartment, suite, etc. (optional)
              <input name="apartment" />
            </label>

            <div className="checkout-three">
              <label>
                City*
                <input required name="city" />
              </label>

              <label>
                State / Region*
                <input required name="state" />
              </label>

              <label>
                Postal code*
                <input required name="postalCode" />
              </label>
            </div>

            <label>
              Country / Region*
              <input required name="country" />
            </label>

            <label>
              Phone (optional)
              <input type="tel" name="phone" placeholder="Phone" />
            </label>

            <h2>Payment</h2>

            {rewardPercent > 0 && (
              <div className="checkout-reward">
                <strong>{rewardPercent}% loyalty reward applied</strong>
                <span>
                  {rewardLabel || "Applied automatically when you place this order."}
                </span>
              </div>
            )}

            <div className="payment-options">
              <label
                className={
                  paymentMethod === "flutterwave"
                    ? "payment-option is-active"
                    : "payment-option"
                }
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="flutterwave"
                  checked={paymentMethod === "flutterwave"}
                  onChange={() => setPaymentMethod("flutterwave")}
                />
                <span className="payment-option-icon">F</span>
                <span className="payment-option-copy">
                  <strong>Card, mobile money or bank transfer</strong>
                  <small>
                    Pay securely with Flutterwave. You will be redirected to
                    complete your payment and brought straight back.
                  </small>
                </span>
              </label>

              <label
                className={
                  paymentMethod === "bank"
                    ? "payment-option is-active"
                    : "payment-option"
                }
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={paymentMethod === "bank"}
                  onChange={() => setPaymentMethod("bank")}
                />
                <span className="payment-option-icon">G</span>
                <span className="payment-option-copy">
                  <strong>Pay by direct bank transfer</strong>
                  <small>
                    Place your order and you will receive our bank account
                    details plus a unique payment reference.
                  </small>
                </span>
              </label>
            </div>

            {paymentMethod === "bank" && (
              <p className="payment-small">
                Your order will remain on Velvet Journal Co. You will not be
                redirected to Shopify.
              </p>
            )}

            {error && <p className="checkout-error">{error}</p>}

            <button
              type="submit"
              className="charge-button"
              disabled={submitting || !cart.length}
            >
              {submitting ? "Placing order…" : "Place order"}
            </button>
          </form>
        </section>

        <aside className="checkout-summary">
          <h2>Order summary</h2>

          {!cart.length ? (
            <div className="checkout-empty">
              <p>Your cart is currently empty.</p>
              <Link href="/collections/all">Return to products</Link>
            </div>
          ) : (
            <>
              {cart.map((line) => (
                <div className="checkout-summary-product" key={line.handle}>
                  {line.image && <img src={line.image} alt="" />}

                  <div>
                    <strong>{line.title}</strong>
                    <span>Qty {line.quantity}</span>
                  </div>

                  <strong>
                    {line.currency}{" "}
                    {(line.price * line.quantity).toFixed(2)}
                  </strong>
                </div>
              ))}

              <div className="checkout-summary-line">
                <span>Subtotal</span>
                <strong>USD {subtotal.toFixed(2)}</strong>
              </div>

              {rewardPercent > 0 && (
                <div className="checkout-summary-line checkout-summary-discount">
                  <span>Loyalty reward ({rewardPercent}%)</span>
                  <strong>−USD {discount.toFixed(2)}</strong>
                </div>
              )}

              <div className="checkout-summary-line">
                <span>Shipping</span>
                <span>Calculated later</span>
              </div>

              <div className="checkout-summary-total">
                <strong>Total</strong>
                <strong>USD {total.toFixed(2)}</strong>
              </div>
            </>
          )}
        </aside>
      </main>

      <Footer />
    </>
  );
}

import {Suspense} from "react";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="charge-shell simple-page">Loading checkout…</main>}>
      <CheckoutContent />
    </Suspense>
  );
}

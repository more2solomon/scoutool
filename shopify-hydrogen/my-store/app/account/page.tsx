"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Order = {
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

type Milestone = {
  milestone: number;
  percentOff: number;
  unlocked: boolean;
  current: boolean;
};

type Loyalty = {
  orderCount: number;
  nextOrderNumber: number;
  nextMilestone: number;
  nextPercentOff: number;
  ordersToNextMilestone: number;
  progress: number;
  reward: {milestone: number; percentOff: number; label: string} | null;
  milestones: Milestone[];
};

type DashboardPayload = {
  ok: boolean;
  authenticated: boolean;
  error?: string;
  customer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    numberOfOrders: number;
    lifetimeValue: number;
    orders: Order[];
  };
  loyalty?: Loyalty;
};

type Mode = "login" | "register" | "recover";

const MODE_COPY: Record<Mode, {title: string; subtitle: string; action: string}> = {
  login: {
    title: "Member sign in",
    subtitle: "Track your orders, loyalty rewards and lifetime spend.",
    action: "Sign in",
  },
  register: {
    title: "Create your account",
    subtitle: "One account unlocks every milestone reward you earn.",
    action: "Create account",
  },
  recover: {
    title: "Reset your password",
    subtitle: "We will email you a secure reset link.",
    action: "Send reset link",
  },
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function statusPill(status: string | null) {
  const value = (status || "PENDING").toUpperCase();
  if (value === "PAID") return "pill pill-paid";
  if (value === "REFUNDED") return "pill pill-refunded";
  if (value === "PARTIALLY_REFUNDED") return "pill pill-refunded";
  if (value === "VOIDED") return "pill pill-voided";
  return "pill pill-pending";
}

export default function AccountPage() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/account/dashboard", {
        cache: "no-store",
      });
      const data = (await response.json()) as DashboardPayload;
      setPayload(data);
    } catch {
      setPayload({ok: false, authenticated: false, error: "Unable to load your account"});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const customer = payload?.customer;
  const loyalty = payload?.loyalty;

  const stats = useMemo(() => {
    if (!customer) return [];
    return [
      {label: "Orders placed", value: String(customer.numberOfOrders)},
      {
        label: "Lifetime spend",
        value: money(customer.lifetimeValue, "USD"),
      },
      {
        label: "Next reward",
        value: loyalty?.reward ? `${loyalty.reward.percentOff}% off` : "—",
      },
      {
        label: "Orders to next reward",
        value: loyalty ? String(loyalty.ordersToNextMilestone) : "—",
      },
    ];
  }, [customer, loyalty]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/account/session", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          action: mode,
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to continue");
      }

      if (mode === "recover") {
        setNotice(result.message || "Check your inbox for a reset link.");
      } else {
        setForm({email: form.email, password: "", firstName: "", lastName: ""});
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    setSubmitting(true);
    try {
      await fetch("/api/account/session", {method: "DELETE"});
      setPayload({ok: true, authenticated: false});
    } finally {
      setSubmitting(false);
    }
  }

  const copy = MODE_COPY[mode];

  return (
    <>
      <Header />

      <main className="charge-shell account-page">
        {loading && (
          <div className="account-loading">
            <span className="account-spinner" /> Loading your account…
          </div>
        )}

        {!loading && !payload?.authenticated && (
          <section className="account-gate">
            <div className="account-gate-art">
              <span className="account-gate-eyebrow">Velvet Journal Co</span>
              <h1>Your loyalty dashboard</h1>
              <p>
                Every 10th order earns 50% off. Your 100th order earns 75% off.
                Sign in to see your progress and claim each reward automatically
                at checkout.
              </p>
              <ul className="account-gate-points">
                <li>
                  <strong>50% off</strong> on orders 10, 20, 30 … 90
                </li>
                <li>
                  <strong>75% off</strong> on your 100th order
                </li>
                <li>Rewards apply automatically at checkout</li>
              </ul>
            </div>

            <div className="account-card">
              <div className="account-tabs">
                {(["login", "register", "recover"] as Mode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={mode === item ? "account-tab is-active" : "account-tab"}
                    onClick={() => {
                      setMode(item);
                      setError("");
                      setNotice("");
                    }}
                  >
                    {item === "login"
                      ? "Sign in"
                      : item === "register"
                        ? "Register"
                        : "Forgot password"}
                  </button>
                ))}
              </div>

              <h2>{copy.title}</h2>
              <p className="account-card-sub">{copy.subtitle}</p>

              <form onSubmit={submit} className="account-form">
                {mode === "register" && (
                  <div className="account-two">
                    <label>
                      First name
                      <input
                        required
                        value={form.firstName}
                        onChange={(event) =>
                          setForm({...form, firstName: event.target.value})
                        }
                      />
                    </label>
                    <label>
                      Last name
                      <input
                        required
                        value={form.lastName}
                        onChange={(event) =>
                          setForm({...form, lastName: event.target.value})
                        }
                      />
                    </label>
                  </div>
                )}

                <label>
                  Email
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({...form, email: event.target.value})
                    }
                  />
                </label>

                {mode !== "recover" && (
                  <label>
                    Password
                    <input
                      required
                      type="password"
                      minLength={mode === "register" ? 8 : undefined}
                      value={form.password}
                      onChange={(event) =>
                        setForm({...form, password: event.target.value})
                      }
                    />
                  </label>
                )}

                {error && <p className="checkout-error">{error}</p>}
                {notice && <p className="account-notice">{notice}</p>}

                <button
                  type="submit"
                  className="charge-button"
                  disabled={submitting}
                >
                  {submitting ? "Please wait…" : copy.action}
                </button>
              </form>
            </div>
          </section>
        )}

        {!loading && payload?.authenticated && customer && loyalty && (
          <>
            <section className="account-hero">
              <div className="account-hero-copy">
                <span className="account-gate-eyebrow">
                  {customer.firstName ? `Welcome back, ${customer.firstName}` : "Welcome back"}
                </span>
                <h1>Your loyalty journey</h1>
                <p>
                  You are on order{" "}
                  <strong>#{loyalty.nextOrderNumber}</strong>.{" "}
                  {loyalty.reward
                    ? `That order unlocks ${loyalty.reward.percentOff}% off — it will be applied automatically at checkout.`
                    : `Your next reward lands on order #${loyalty.nextMilestone} with ${loyalty.nextPercentOff}% off.`}
                </p>

                <div className="account-hero-actions">
                  <Link className="charge-button" href="/collections/all">
                    Shop the catalog
                  </Link>
                  <button
                    type="button"
                    className="charge-button charge-button-ghost"
                    onClick={() => void signOut()}
                    disabled={submitting}
                  >
                    Sign out
                  </button>
                </div>
              </div>

              <div className="account-ring-card">
                <svg className="account-ring" viewBox="0 0 120 120" aria-hidden="true">
                  <circle
                    className="account-ring-track"
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    strokeWidth="10"
                  />
                  <circle
                    className="account-ring-value"
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.max(
                      0.02,
                      loyalty.progress,
                    ) * 326.7} 326.7`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="account-ring-label">
                  <strong>{loyalty.orderCount}</strong>
                  <span>orders placed</span>
                </div>
              </div>
            </section>

            <section className="account-stats">
              {stats.map((stat) => (
                <div className="account-stat" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </section>

            <section className="account-rewards">
              <div className="account-rewards-copy">
                <span className="account-gate-eyebrow">Milestone rewards</span>
                <h2>
                  {loyalty.reward
                    ? `${loyalty.reward.percentOff}% off is ready`
                    : `${loyalty.ordersToNextMilestone} order${
                        loyalty.ordersToNextMilestone === 1 ? "" : "s"
                      } to your next reward`}
                </h2>
                <p>
                  Every tenth order earns 50% off. Your hundredth order earns
                  75% off. Rewards are applied automatically when you sign in
                  and check out — no codes to remember.
                </p>
                <div className="account-progress">
                  <div
                    className="account-progress-bar"
                    style={{width: `${Math.round(loyalty.progress * 100)}%`}}
                  />
                </div>
                <span className="account-progress-note">
                  {loyalty.orderCount} of {loyalty.nextMilestone} orders
                </span>
              </div>

              <ol className="account-timeline">
                {loyalty.milestones.map((milestone) => (
                  <li
                    key={milestone.milestone}
                    className={
                      milestone.unlocked
                        ? "account-timeline-item is-unlocked"
                        : milestone.current
                          ? "account-timeline-item is-current"
                          : "account-timeline-item"
                    }
                  >
                    <span className="account-timeline-marker">
                      {milestone.unlocked ? "✓" : milestone.milestone}
                    </span>
                    <span className="account-timeline-label">
                      Order #{milestone.milestone}
                    </span>
                    <span className="account-timeline-value">
                      {milestone.percentOff}% off
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="account-orders">
              <div className="account-orders-head">
                <h2>Order history</h2>
                <span>{customer.numberOfOrders} orders</span>
              </div>

              {!customer.orders.length ? (
                <div className="account-empty">
                  <p>No orders yet — your first milestone is 10 orders away.</p>
                  <Link className="charge-button" href="/collections/all">
                    Start shopping
                  </Link>
                </div>
              ) : (
                <div className="account-table-wrap">
                  <table className="account-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.orders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong>{order.name}</strong>
                            <span className="account-table-sub">
                              #{order.orderNumber}
                            </span>
                          </td>
                          <td>{formatDate(order.processedAt)}</td>
                          <td>{order.itemCount}</td>
                          <td>{money(order.total, order.currencyCode)}</td>
                          <td>
                            <span className={statusPill(order.financialStatus)}>
                              {order.financialStatus || "PENDING"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}

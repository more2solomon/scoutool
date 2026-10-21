"use client";

import {useEffect, useMemo, useState} from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type {LocalCartLine} from "@/components/AddToCart";

const CART_KEY = "vj_local_cart";

export default function CartPage() {
  const [cart, setCart] = useState<LocalCartLine[]>([]);

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem(CART_KEY) || "[]"));
    } catch {
      setCart([]);
    }
  }, []);

  function save(next: LocalCartLine[]) {
    setCart(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("vj-cart-updated"));
  }

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, line) =>
          sum + Number(line.price) * Number(line.quantity),
        0,
      ),
    [cart],
  );

  return (
    <>
      <Header />

      <main className="charge-shell cart-page">
        <div className="breadcrumb">
          <a href="/">Home</a>
          <span>›</span>
          <span>Cart</span>
        </div>

        <h1>Your cart</h1>

        {!cart.length ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add a journal or planner to begin your order.</p>
            <a className="charge-button inline-button" href="/collections/all">
              Continue shopping
            </a>
          </div>
        ) : (
          <>
            <div className="local-cart-list">
              {cart.map((line) => (
                <article className="local-cart-line" key={line.handle}>
                  {line.image ? (
                    <img src={line.image} alt={line.title} />
                  ) : (
                    <div className="cart-placeholder" />
                  )}

                  <div className="local-cart-details">
                    <a href={`/products/${line.handle}`}>
                      <h2>{line.title}</h2>
                    </a>

                    <p className="cart-line-price">
                      {line.currency} {Number(line.price).toFixed(2)}
                    </p>

                    <div className="cart-quantity">
                      <button
                        type="button"
                        onClick={() =>
                          save(
                            cart
                              .map((item) =>
                                item.handle === line.handle
                                  ? {
                                      ...item,
                                      quantity: Math.max(
                                        0,
                                        item.quantity - 1,
                                      ),
                                    }
                                  : item,
                              )
                              .filter((item) => item.quantity > 0),
                          )
                        }
                      >
                        −
                      </button>

                      <span>{line.quantity}</span>

                      <button
                        type="button"
                        onClick={() =>
                          save(
                            cart.map((item) =>
                              item.handle === line.handle
                                ? {
                                    ...item,
                                    quantity: item.quantity + 1,
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        +
                      </button>

                      <button
                        type="button"
                        className="remove-line"
                        onClick={() =>
                          save(
                            cart.filter(
                              (item) => item.handle !== line.handle,
                            ),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <strong className="cart-line-total">
                    {line.currency}{" "}
                    {(line.price * line.quantity).toFixed(2)}
                  </strong>
                </article>
              ))}
            </div>

            <div className="cart-summary-box">
              <div>
                <span>Subtotal</span>
                <strong>USD {subtotal.toFixed(2)}</strong>
              </div>

              <p>
                Shipping and payment will be confirmed at checkout.
              </p>

              <a className="charge-button cart-checkout-button" href="/checkout">
                Proceed to checkout
              </a>
            </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}

"use client";

import {useState} from "react";

export type LocalCartLine = {
  handle: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
  quantity: number;
};

const CART_KEY = "vj_local_cart";

export default function AddToCart({
  handle,
  title,
  price,
  currency,
  image,
  label = "Add to cart",
}: {
  handle: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
  label?: string;
}) {
  const [added, setAdded] = useState(false);

  function add() {
    let cart: LocalCartLine[] = [];

    try {
      cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      cart = [];
    }

    const existing = cart.find((line) => line.handle === handle);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        handle,
        title,
        price,
        currency,
        image,
        quantity: 1,
      });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));

    // Remove old Shopify checkout/cart remnants so they can never redirect.
    localStorage.removeItem("vj_checkout_url");
    localStorage.removeItem("vj_cart_id");
    localStorage.removeItem("vj_cart_quantity");

    window.dispatchEvent(new Event("vj-cart-updated"));

    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button type="button" className="charge-button" onClick={add}>
      {added ? "Added ✓" : label}
    </button>
  );
}

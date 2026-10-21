"use client";

import {useEffect, useState} from "react";

const CART_KEY = "vj_local_cart";

const announcement =
  process.env.NEXT_PUBLIC_ANNOUNCEMENT ||
  "Free shipping on orders over $100 • Journals designed for intentional living";

export default function Header() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function sync() {
      try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        const quantity = cart.reduce(
          (sum: number, line: {quantity?: number}) =>
            sum + Number(line.quantity || 0),
          0,
        );
        setCount(quantity);
      } catch {
        setCount(0);
      }

      // Kill old Shopify checkout data permanently.
      localStorage.removeItem("vj_checkout_url");
      localStorage.removeItem("vj_cart_id");
      localStorage.removeItem("vj_cart_quantity");
    }

    sync();
    window.addEventListener("vj-cart-updated", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("vj-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <>
      <div className="top-strip">
        <div className="charge-shell top-strip-inner">
          <strong>{announcement}</strong>
          <a href="mailto:gnewton581@gmail.com">gnewton581@gmail.com</a>
        </div>
      </div>

      <header className="charge-header">
        <div className="charge-shell header-main">
          <a href="/" className="logo-link" aria-label="Velvet Journal Co home">
            <img
              className="charge-logo"
              src="/charge-media/ChatGPT_Image_Jun_5_2026_06_21_36_AM.png"
              alt="Velvet Journal Co logo"
            />
          </a>

          <form className="header-search" action="/collections/all">
            <input name="search" placeholder="Search our store..." />
            <button aria-label="Search">⌕</button>
          </form>

          <div className="header-actions">
            <a href="/account">♙ <span>Log in</span></a>
            <a href="/cart" className="cart-link">
              🛒 <span>Cart {count}</span>
            </a>
          </div>
        </div>

        <nav className="charge-nav" aria-label="Primary navigation">
          <div className="charge-shell nav-inner">
            <a className="nav-home" href="/">Home</a>
            <a href="/collections/all">Catalog</a>
            <a href="/pages/about">About</a>
            <a href="/journal">Journal</a>
            <a href="/pages/contact">Contact</a>
          </div>
        </nav>
      </header>
    </>
  );
}

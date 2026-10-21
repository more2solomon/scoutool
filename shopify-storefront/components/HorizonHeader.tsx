"use client";

import Link from "next/link";

const logoPath = "";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.8-4.2 3.3-6.4 7.5-6.4s6.7 2.2 7.5 6.4" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 8h14l-1 13H6L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

export default function HorizonHeader() {
  return (
    <>
      <div className="announcement">
        <span>Free shipping on qualifying orders</span>
      </div>

      <header className="horizon-header">
        <div className="header-inner">
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link href="/">Shop</Link>
            <Link href="/collections/all">All products</Link>
          </nav>

          <Link href="/" className="brand" aria-label="Home">
            {logoPath ? (
              <img src={logoPath} alt="Store logo" />
            ) : (
              <span className="brand-text">SCOUTOOL</span>
            )}
          </Link>

          <div className="header-actions">
            <button aria-label="Search">
              <SearchIcon />
            </button>

            <button aria-label="Account">
              <UserIcon />
            </button>

            <button aria-label="Cart" className="cart-button">
              <BagIcon />
              <span className="cart-count">0</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

"use client";

import { useState } from "react";

export default function ProductCard({ product }) {
  const [busy, setBusy] = useState(false);

  const variant = product.variants.nodes[0];
  const price = product.priceRange.minVariantPrice;
  const image = product.featuredImage;

  async function buy() {
    if (!variant?.availableForSale || busy) return;

    setBusy(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchandiseId: variant.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      window.location.assign(data.checkoutUrl);
    } catch (error) {
      window.alert(error.message);
      setBusy(false);
    }
  }

  return (
    <article className="product-card">
      <a href={`/products/${product.handle}`} className="product-image-link">
        {image ? (
          <img
            src={image.url}
            alt={image.altText || product.title}
            width={image.width}
            height={image.height}
          />
        ) : (
          <div className="image-placeholder" />
        )}
      </a>

      <div className="product-card-info">
        <a href={`/products/${product.handle}`} className="product-title">
          {product.title}
        </a>

        <div className="product-price">
          {price.currencyCode} {Number(price.amount).toFixed(2)}
        </div>

        <button
          className="product-button"
          disabled={!variant?.availableForSale || busy}
          onClick={buy}
        >
          {busy
            ? "Opening..."
            : variant?.availableForSale
              ? "Add to cart"
              : "Sold out"}
        </button>
      </div>
    </article>
  );
}

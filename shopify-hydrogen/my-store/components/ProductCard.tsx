import type {Product} from "@/lib/shopify";
import {money} from "@/lib/shopify";
import AddToCart from "./AddToCart";

export default function ProductCard({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const price = product.priceRange.minVariantPrice;

  return (
    <article className={`product-card ${compact ? "compact-card" : ""}`}>
      <a href={`/products/${product.handle}`} className="product-image-link">
        {product.featuredImage ? (
          <img
            src={product.featuredImage.url}
            alt={product.featuredImage.altText || product.title}
            className="product-image"
          />
        ) : (
          <div className="product-image placeholder" />
        )}
      </a>

      <div className="product-copy">
        <span className="vendor">{product.vendor || "Velvet Journal Co"}</span>

        <a href={`/products/${product.handle}`} className="product-title">
          {product.title}
        </a>

        <span className="price">
          {money(price.amount, price.currencyCode)}
        </span>

        {!compact && (
          <div className="card-add">
            <AddToCart
              handle={product.handle}
              title={product.title}
              price={Number(price.amount)}
              currency={price.currencyCode}
              image={product.featuredImage?.url}
            />
          </div>
        )}
      </div>
    </article>
  );
}

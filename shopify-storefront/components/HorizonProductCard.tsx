import Link from "next/link";
import { formatMoney } from "../lib/shopify";
import type { StoreProduct } from "../lib/shopify";

export default function HorizonProductCard({
  product,
}: {
  product: StoreProduct;
}) {
  const price = product.priceRange.minVariantPrice;

  return (
    <article className="product-card">
      <Link
        href={`/products/${product.handle}`}
        className="product-card-link"
      >
        <div className="product-image-wrap">
          {product.featuredImage?.url ? (
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText || product.title}
              className="product-image"
            />
          ) : (
            <div className="product-image-placeholder" />
          )}

          <button className="quick-add" type="button">
            +
          </button>
        </div>

        <div className="product-card-info">
          <h3>{product.title}</h3>

          <p className="product-price">
            {formatMoney(price.amount, price.currencyCode)}
          </p>
        </div>
      </Link>
    </article>
  );
}

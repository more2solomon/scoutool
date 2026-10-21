import {Link} from 'react-router';
import {Money} from '@shopify/hydrogen';

export function ChargeProductCard({product}: {product: any}) {
  if (!product) return null;
  const image = product.featuredImage;
  const price = product.priceRange?.minVariantPrice;
  return (
    <Link className="charge-product-card" to={`/products/${product.handle}`} prefetch="intent">
      <div className="charge-product-image">
        {image?.url ? <img src={image.url} alt={image.altText || product.title} loading="lazy" /> : null}
      </div>
      {product.vendor ? <div className="charge-vendor">{product.vendor}</div> : null}
      <div className="charge-product-title">{product.title}</div>
      {price ? <div className="charge-product-price"><span>Regular price </span><Money data={price} /></div> : null}
    </Link>
  );
}

import type {Metadata} from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToCart from "@/components/AddToCart";
import BuyNow from "@/components/BuyNow";
import JsonLd from "@/components/JsonLd";
import {getProduct, money} from "@/lib/shopify";
import {notFound} from "next/navigation";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.velvetjournalco.store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{handle: string}>;
}): Promise<Metadata> {
  const {handle} = await params;
  const product = await getProduct(handle);

  if (!product) return {};

  const title =
    product.seo?.title ||
    `${product.title} | Velvet Journal Co`;

  const description =
    product.seo?.description ||
    product.description ||
    `Shop ${product.title} from Velvet Journal Co. Discover thoughtfully designed journals and planners for gratitude, goals, wellness and intentional living.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${product.handle}`,
    },
    openGraph: {
      title,
      description,
      url: `/products/${product.handle}`,
      type: "website",
      images: product.featuredImage
        ? [
            {
              url: product.featuredImage.url,
              alt: product.featuredImage.altText || product.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.featuredImage
        ? [product.featuredImage.url]
        : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{handle: string}>;
}) {
  const {handle} = await params;
  const product = await getProduct(handle);

  if (!product) notFound();

  const price = product.priceRange.minVariantPrice;
  const variants = product.variants?.nodes || [];
  const isAvailable =
    variants.length === 0 ||
    variants.some(
      (variant: {availableForSale?: boolean}) =>
        variant.availableForSale !== false,
    );

  const paymentsLive =
    process.env.NEXT_PUBLIC_PAYMENTS_LIVE === "true";

  const productUrl =
    `${SITE_URL}/products/${product.handle}`;

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.title,
    url: productUrl,
    description:
      product.description ||
      `Velvet Journal Co ${product.title}`,
    image: product.featuredImage
      ? [product.featuredImage.url]
      : undefined,
    brand: {
      "@type": "Brand",
      name: product.vendor || "Velvet Journal Co",
    },
    category: "Journals & Planners",
  };

  if (paymentsLive) {
    productSchema.offers = {
      "@type": "Offer",
      url: productUrl,
      price: Number(price.amount),
      priceCurrency: price.currencyCode,
      itemCondition: "https://schema.org/NewCondition",
      availability: isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Velvet Journal Co",
      },
    };
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Journals & Planners",
        item: `${SITE_URL}/collections/all`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[productSchema, breadcrumbSchema]} />

      <Header />

      <div className="breadcrumb charge-shell">
        <a href="/">Home</a>
        <span>›</span>
        <a href="/collections/all">Journals & Planners</a>
        <span>›</span>
        <span>{product.title}</span>
      </div>

      <main className="charge-shell product-page">
        <div className="product-page-image">
          {product.featuredImage && (
            <img
              src={product.featuredImage.url}
              alt={
                product.featuredImage.altText ||
                `${product.title} journal by Velvet Journal Co`
              }
            />
          )}
        </div>

        <div className="product-page-copy">
          <span className="vendor">
            {product.vendor || "Velvet Journal Co"}
          </span>

          <h1>{product.title}</h1>

          <div className="product-page-price">
            {money(price.amount, price.currencyCode)}
          </div>

          {product.descriptionHtml ? (
            <div
              className="rich-text"
              dangerouslySetInnerHTML={{
                __html: product.descriptionHtml,
              }}
            />
          ) : (
            <p>{product.description}</p>
          )}

          <div className="product-actions">
            <AddToCart
              handle={product.handle}
              title={product.title}
              price={Number(price.amount)}
              currency={price.currencyCode}
              image={product.featuredImage?.url}
              label="Add to cart"
            />

            <BuyNow handle={product.handle} />
          </div>

          <p className="checkout-note">
            Checkout is handled on Velvet Journal Co. Payment is currently
            unavailable while configuration is completed.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}

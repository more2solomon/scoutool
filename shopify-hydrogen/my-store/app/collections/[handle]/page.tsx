import type {Metadata} from "next";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import {getCollection} from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{handle: string}>;
}): Promise<Metadata> {
  const {handle} = await params;
  const collection = await getCollection(handle);
  if (!collection) return {};

  return {
    title: collection.seo?.title || collection.title,
    description:
      collection.seo?.description ||
      collection.description ||
      `Shop ${collection.title} from Velvet Journal Co.`,
    alternates: {canonical: `/collections/${collection.handle}`},
    openGraph: collection.image
      ? {images: [{url: collection.image.url, alt: collection.image.altText || collection.title}]}
      : undefined,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{handle: string}>;
}) {
  const {handle} = await params;
  const collection = await getCollection(handle);
  if (!collection) notFound();

  return (
    <>
      <Header />
      <div className="breadcrumb charge-shell">
        <a href="/">Home</a> › <a href="/collections/all">Catalog</a> › <span>{collection.title}</span>
      </div>

      <main className="charge-shell simple-page collection-page">
        <h1>{collection.title}</h1>
        {collection.description && <p className="collection-description">{collection.description}</p>}
        <div className="product-grid four catalog-grid">
          {collection.products.nodes.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

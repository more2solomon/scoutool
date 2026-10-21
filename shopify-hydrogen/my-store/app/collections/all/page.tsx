import type {Metadata} from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import {getAllProducts} from "@/lib/shopify";
import type {Product} from "@/lib/shopify";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop All Journals & Planners",
  description:
    "Browse all Velvet Journal Co gratitude journals, goal-setting planners, mindfulness journals, wellness journals and guided notebooks.",
  alternates: {canonical: "/collections/all"},
};

export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{search?: string}>;
}) {
  const params = await searchParams;
  const search = (params.search || "").trim().toLowerCase();

  let products: Product[] = [];
  try {
    products = await getAllProducts();
  } catch {
    products = [];
  }

  const filtered = search
    ? products.filter((p) =>
        `${p.title} ${p.vendor} ${p.productType || ""} ${(p.tags || []).join(" ")}`
          .toLowerCase()
          .includes(search),
      )
    : products;

  return (
    <>
      <Header />

      <div className="breadcrumb charge-shell">
        <a href="/">Home</a> › <span>Products</span>
      </div>

      <main className="charge-shell catalog-layout">
        <aside className="filters">
          <h3>Availability</h3>
          <label><input type="checkbox" /> In Stock <span>{filtered.length}</span></label>
          <hr />
          <h3>Price</h3>
          <div className="price-line" />
          <div className="price-inputs">
            <input placeholder="0" />
            <span>-</span>
            <input placeholder="150.00" />
          </div>
        </aside>

        <section className="catalog-main">
          <h1>{search ? `Search: ${params.search}` : "Products"}</h1>

          <div className="catalog-toolbar">
            <span>{filtered.length} products</span>
            <span>View ▦ &nbsp;&nbsp; Sort by Alphabetically, A-Z⌄</span>
          </div>

          <div className="product-grid four catalog-grid">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

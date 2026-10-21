import ProductCard from "./ProductCard";
import { productsQuery, shopifyFetch } from "../lib/shopify";

export const dynamic = "force-dynamic";

export default async function Home() {
  let products = [];
  let error = "";

  try {
    const data = await shopifyFetch(productsQuery, { first: 24 });
    products = data.products.nodes;
  } catch (e) {
    error = e.message;
  }

  return (
    <main>
      {/* ANNOUNCEMENT */}
      <div className="announcement">
        Thoughtful things for everyday living.
      </div>

      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo">
            Velvet Journal Co.
          </a>

          <nav className="desktop-nav">
            <a href="/">Home</a>
            <a href="#shop">Shop</a>
            <a href="#featured">Featured</a>
          </nav>

          <div className="header-actions">
            <a href="#shop" aria-label="Search">
              Search
            </a>
            <a href="#shop" aria-label="Cart">
              Cart
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-overlay" />

        <div className="hero-content">
          <p className="hero-kicker">VELVET JOURNAL CO.</p>

          <h1>
            Thoughtful things
            <br />
            for everyday living.
          </h1>

          <p className="hero-text">
            Journals, planners and thoughtful tools designed to help you
            slow down, reflect and make every day count.
          </p>

          <a href="#shop" className="hero-button">
            Shop collection
          </a>
        </div>
      </section>

      {/* FEATURED COLLECTION */}
      <section className="collection-section" id="shop">
        <div className="section-header">
          <div>
            <p className="section-kicker">FEATURED COLLECTION</p>
            <h2>Shop the latest collection</h2>
          </div>

          <a href="#shop" className="view-all">
            Shop all
          </a>
        </div>

        {error && <div className="error">{error}</div>}

        {!error && products.length === 0 && (
          <p className="empty">No products are currently available.</p>
        )}

        <div className="product-grid" id="featured">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </section>

      {/* BRAND SECTION */}
      <section className="brand-section">
        <div className="brand-copy">
          <p className="section-kicker">VELVET JOURNAL CO.</p>

          <h2>
            Make space for the things
            <br />
            that matter.
          </h2>

          <p>
            Thoughtfully designed journals and planners for reflection,
            gratitude, wellness, goals and everyday growth.
          </p>

          <a href="#shop" className="secondary-button">
            Explore products
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              Velvet Journal Co.
            </div>
            <p>
              Thoughtful things for everyday living.
            </p>
          </div>

          <div className="footer-links">
            <a href="/">Home</a>
            <a href="#shop">Shop</a>
            <a href="#featured">Featured</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Velvet Journal Co.</span>
          <span>Powered by Shopify</span>
        </div>
      </footer>
    </main>
  );
}

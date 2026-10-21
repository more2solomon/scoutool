import type {Metadata} from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import {getProducts} from "@/lib/shopify";
import type {Product} from "@/lib/shopify";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title:
    "Gratitude Journals, Goal Planners & Wellness Journals",
  description:
    "Discover Velvet Journal Co gratitude journals, goal-setting planners, mindfulness journals and wellness notebooks designed for reflection, growth and intentional living.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title:
      "Velvet Journal Co | Journals & Planners for Intentional Living",
    description:
      "Shop gratitude journals, goal planners, mindfulness journals and guided notebooks for intentional living.",
    url: "/",
    type: "website",
  },
};

export default async function Home() {
  let products: Product[] = [];
  try {
    products = await getProducts(20);
  } catch {
    products = [];
  }

  const row1 = products.slice(0, 4);
  const row2 = products.slice(4, 8);
  const row3 = products.slice(8, 12);
  const favourites = products.slice(1, 5);

  return (
    <>
      <Header />

      <main>
        <section className="hero charge-shell-wide">
          <div className="hero-copy">
            <p className="hero-eyebrow">Journals for intentional living</p>
            <h1>Make space for<br/><em>what matters.</em></h1>
            <p className="hero-intro">
              Thoughtfully designed journals and planners to help you slow down,
              dream bigger, and turn everyday intentions into meaningful rituals.
            </p>
            <div className="hero-actions">
              <a href="/collections/all" className="hero-button">Explore the collection</a>
              <a href="/journal" className="hero-text-link">Discover our story <span aria-hidden="true">→</span></a>
            </div>
            <div className="hero-note">
              <span aria-hidden="true">✦</span>
              <span>Designed to inspire your everyday</span>
            </div>
          </div>
          <div className="hero-visual">
            <img
              src="/charge-media/ready_to_manifest_and_to_journal.jpg"
              alt="A curated collection of floral notebooks and journals"
            />
            <div className="hero-stamp" aria-hidden="true">
              <span>Write</span>
              <strong>YOUR STORY</strong>
              <span>beautifully</span>
            </div>
          </div>
        </section>

        <section className="service-strip">
          <div className="charge-shell service-grid">
            <div><b>🚚 FREE SHIPPING</b><span>Free for orders over $100</span></div>
            <div><b>◷ 24/7 Support</b><span>Fast, professional support</span></div>
            <div><b>▣ CHOOSE DELIVERY DATE</b><span>Flexible delivery date</span></div>
            <div><b>☑ EXTENDED SUPPORT PERIOD</b><span>30 days return policy</span></div>
          </div>
        </section>

        <section className="charge-shell promo-grid">
          <div className="promo-card">
            <img src="/charge-media/Vintage_Floral_Pattern_Spiral_Notebook___Ruled_Journal.jpg" alt="" />
            <div className="promo-text">
              <small>DAILY REFLECTION</small>
              <h2>Gratitude Journals</h2>
              <p>Build a positive mindset and appreciate life's meaningful moments.</p>
            </div>
          </div>
          <div className="promo-card reverse">
            <img src="/charge-media/70437490356239.jpg" alt="" />
            <div className="promo-text light">
              <small>ACHIEVE MORE</small>
              <h2>Goal Setting Journals</h2>
              <p>Plan your goals, track progress, and stay focused every day.</p>
            </div>
          </div>
        </section>

        <ProductBand
          title="Achieve Success"
          subtitle="Set clear goals, track progress, and stay motivated toward your dreams."
          color="#dad9d7"
          products={row1}
        />
        <ProductBand
          title="Mind & Body"
          subtitle="Build healthy habits, reduce stress, and support your well-being."
          color="#efd3eb"
          products={row2.length ? row2 : row1}
        />
        <ProductBand
          title="Positive Living"
          subtitle="Cultivate mindfulness and focus on gratitude every day."
          image="/charge-media/aesthetic.jpg"
          products={row3.length ? row3 : row1}
        />

        <section className="charge-shell section-space">
          <div className="section-title-row">
            <h2>Our favourite products</h2>
            <a className="mini-red-button" href="/collections/all">View all ›</a>
          </div>
          <div className="product-grid four">
            {favourites.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </section>

        <section className="charge-shell collage">
          <div className="collage-main">
            <img src="/charge-media/aesthetic_1.jpg" alt="" />
            <div className="collage-copy">Write Your<br/>Story<br/>Beautifully</div>
          </div>
          {products[0] && (
            <div className="collage-product">
              <ProductCard product={products[0]} compact />
            </div>
          )}
        </section>

        <section className="charge-shell section-space">
          <h2 className="small-heading">Browse our collections</h2>
          <div className="collection-strip">
            {[
              ["Morning", "Morning Journals", "The_Inspired_Stories.jpg"],
              ["Gratitude", "Gratitude Journals", "Journal_intro_page.jpg"],
              ["Goals", "Goal Setting Journals", "BulletJournalGoals.jpg"],
              ["Flourish", "Flourish Journal", "Mindfulness_Journal.jpg"],
              ["Daily", "Daily Reflection", "Journal_intro_page_idea____journalideas.jpg"],
            ].map(([key, label, image]) => (
              <a href="/collections/all" className="collection-tile" key={key}>
                <img src={`/charge-media/${image}`} alt="" />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="charge-shell growth">
          <div className="growth-copy">
            <h2>Where Every<br/>Page Inspires<br/>Growth</h2>
            <p>
              At Velvet Journal Co, we believe journaling is more than putting words
              on paper. Our thoughtfully designed journals help you capture meaningful
              moments, set inspiring goals, and create habits that support intentional living.
            </p>
            <a href="/collections/all" className="mini-red-button">View all</a>
          </div>
          <img src="/charge-media/Escucho_al_Universo_disponible_en_Chile___La.jpg" alt="" />
        </section>

        <section className="about-section">
          <div className="charge-shell about-inner">
            <h2>Designed for Intentional Living</h2>
            <p>
              At Velvet Journal Co, we create thoughtfully designed journals and planners
              that help you stay organized, set meaningful goals, and capture life's important
              moments. Our products are designed to inspire reflection, productivity, and personal growth every day.
            </p>
          </div>
        </section>

        <section className="brand-strip">
          <div className="charge-shell brand-images">
            {[
              "The_Inspired_Stories.jpg",
              "512073420129521389.jpg",
              "497295983852804702.jpg",
              "Journal_intro_page_idea____journalideas.jpg",
              "376191375148414619.jpg",
              "kawaii_journaling.jpg",
              "Printed_neutral_beige_planner_cards_l_Set_of_4_l_Minimal_journal_quotes_l_Inspirational_words_l_Simple_aesthetic_l_Gold_foil_floral_line_art.jpg",
            ].map((img) => (
              <img key={img} src={`/charge-media/${img}`} alt="" />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function ProductBand({
  title,
  subtitle,
  products,
  color,
  image,
}: {
  title: string;
  subtitle: string;
  products: Product[];
  color?: string;
  image?: string;
}) {
  return (
    <section className="charge-shell product-band">
      <div
        className="band-cover"
        style={{
          backgroundColor: color || "#ddd",
          backgroundImage: image ? `linear-gradient(#0005,#0005),url('${image}')` : undefined,
        }}
      >
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <a href="/collections/all">View all ›</a>
      </div>
      <div className="band-products">
        {products.map((p) => <ProductCard key={p.id} product={p} compact />)}
      </div>
    </section>
  );
}

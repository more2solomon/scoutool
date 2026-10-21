import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {ChargeProductCard} from '~/components/ChargeProductCard';

export const meta: Route.MetaFunction = () => [{title: 'Velvet Journal Co'}];

export async function loader({context}: Route.LoaderArgs) {
  return context.storefront.query(HOME_QUERY);
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const goal = data.goal?.products?.nodes ?? [];
  const gratitude = data.gratitude?.products?.nodes ?? [];
  const flourish = data.flourish?.products?.nodes ?? [];
  const favourites = data.favourites?.nodes ?? [];
  const collections = data.collections?.nodes ?? [];

  return <div className="charge-home">
    <section className="charge-hero">
      <img src="/charge-media/Pink_Rose_Lace_Rice_Paper_-_A4_Decoupage_Journal_Paper.jpg" alt="Floral journal background"/>
      <div className="charge-hero-copy"><h1>Design Your Best Life,<br/>One Page at a Time</h1><p>Beautiful journals for mindfulness, gratitude, productivity, and personal growth.</p><Link to="/collections/all" className="charge-btn">Shop Journal</Link></div>
    </section>

    <section className="charge-home-services">
      <div><b>FREE SHIPPING</b><span>Free for orders over 100$</span></div><div><b>24/7 Support</b><span>Fast, professional support</span></div><div><b>CHOOSE DELIVERY DATE</b><span>Flexible delivery date</span></div><div><b>EXTENDED SUPPORT PERIOD</b><span>30 days return policy</span></div>
    </section>

    <section className="charge-promo-grid">
      <article><div className="promo-copy"><small>DAILY REFLECTION</small><h2>Gratitude Journals</h2><p>Build a positive mindset and appreciate life's meaningful moments.</p></div><img src="/charge-media/Vintage_Floral_Pattern_Spiral_Notebook___Ruled_Journal.jpg" alt="Gratitude journal"/></article>
      <article><div className="promo-copy"><small>ACHIEVE MORE</small><h2>Goal Setting Journals</h2><p>Plan your goals, track progress, and stay focused every day.</p></div><img src="/charge-media/70437490356239.jpg" alt="Goal setting journal"/></article>
    </section>

    <ProductBand title="Achieve Success" subtitle="Set clear goals, track progress, and stay motivated toward your dreams." products={goal}/>
    <ProductBand title="Mind & Body" subtitle="Build better habits, reduce stress, and support your well-being." products={flourish.length ? flourish : gratitude}/>
    <ProductBand title="Positive Living" subtitle="Cultivate gratitude and focus on the good every day." products={gratitude}/>

    <section className="charge-favourites"><div className="charge-section-heading"><h2>Our favourite products</h2><Link className="charge-red-link" to="/collections/all">View all →</Link></div><div className="charge-card-grid four">{favourites.slice(0,4).map((p:any)=><ChargeProductCard key={p.id} product={p}/>)}</div></section>

    <section className="charge-collage"><div className="charge-collage-main"><img src="/charge-media/aesthetic.jpg" alt="Journaling desk"/><div className="charge-collage-overlay">Write Your<br/>Story<br/>Beautifully</div></div><Link className="charge-collage-side" to="/products/daily-goal-planner"><img src="/charge-media/ThePerfectPlannerforGoalDiggers_BossBabes1891.jpg" alt="Daily goal planner"/><b>Daily Goal Planner</b></Link></section>

    <section className="charge-collections"><h2>Browse our collections</h2><div className="charge-collection-row">{collections.slice(0,6).map((c:any)=><Link key={c.id} to={`/collections/${c.handle}`}><div className="charge-collection-thumb">{c.image?.url?<img src={c.image.url} alt={c.image.altText||c.title}/>:null}</div><span>{c.title}</span></Link>)}</div></section>

    <section className="charge-story"><div className="charge-story-copy"><h2>Where Every<br/>Page Inspires<br/>Growth</h2><p>At Velvet Journal Co, we believe that journaling is more than putting words on paper—it's a powerful tool for reflection, creativity, and personal transformation.</p><Link className="charge-btn red" to="/collections/all">View all</Link></div><img src="/charge-media/Escucho_al_Universo_disponible_en_Chile___La.jpg" alt="Gratitude journal"/></section>

    <section className="charge-about"><h2>Designed for Intentional Living</h2><p>At Velvet Journal Co, we create thoughtfully designed journals and planners that help you stay organized, set meaningful goals, and capture life's important moments. Our products are designed to inspire reflection, productivity, and personal growth every day.</p></section>

    <section className="charge-brand-strip">{['The_Inspired_Stories.jpg','512073420129521389.jpg','497295983852804702.jpg','Journal_intro_page_idea____journalideas.jpg','376191375148414619.jpg','kawaii_journaling.jpg','Printed_neutral_beige_planner_cards_l_Set_of_4_l_Minimal_journal_quotes_l_Inspirational_words_l_Simple_aesthetic_l_Gold_foil_floral_line_art.jpg'].map((n)=><img key={n} src={`/charge-media/${n}`} alt="Journal inspiration"/>)}</section>
  </div>;
}

function ProductBand({title, subtitle, products}:{title:string;subtitle:string;products:any[]}) {
  return <section className="charge-product-band"><div className="charge-band-intro"><h2>{title}</h2><p>{subtitle}</p><Link to="/collections/all" className="charge-mini-btn">View all →</Link></div><div className="charge-band-products">{products.slice(0,4).map((p:any)=><ChargeProductCard key={p.id} product={p}/>)}</div></section>;
}

const HOME_QUERY = `#graphql
  fragment HomeProduct on Product { id handle title vendor featuredImage { url altText width height } priceRange { minVariantPrice { amount currencyCode } } }
  query VelvetHome($country: CountryCode, $language: LanguageCode) @inContext(country:$country, language:$language) {
    goal: collection(handle:"goal-setting-journals") { products(first:4) { nodes { ...HomeProduct } } }
    gratitude: collection(handle:"gratitude-journals") { products(first:4) { nodes { ...HomeProduct } } }
    flourish: collection(handle:"flourish-journal") { products(first:4) { nodes { ...HomeProduct } } }
    favourites: products(first:4, sortKey:UPDATED_AT, reverse:true) { nodes { ...HomeProduct } }
    collections(first:6) { nodes { id title handle image { url altText width height } } }
  }
` as const;

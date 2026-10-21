import {Link, useLoaderData} from 'react-router';
import {Money} from '@shopify/hydrogen';
import type {Route} from './+types/_index';

export const meta: Route.MetaFunction = () => [
  {title: 'Velvet Journal Co'},
  {
    name: 'description',
    content:
      'Thoughtfully designed journals and planners for gratitude, mindfulness, productivity, and personal growth.',
  },
];

export async function loader({context}: Route.LoaderArgs) {
  const data = await context.storefront.query(CHARGE_HOME_QUERY, {
    cache: context.storefront.CacheLong(),
  });
  return data;
}

type Product = {
  id: string;
  title: string;
  handle: string;
  featuredImage?: {url: string; altText?: string | null} | null;
  priceRange: {
    minVariantPrice: {amount: string; currencyCode: string};
  };
};

type Collection = {
  id: string;
  title: string;
  handle: string;
  image?: {url: string; altText?: string | null} | null;
  products?: {nodes: Product[]};
};

const heroSlides = [
  {
    image:
      '/charge-media/Pink_Rose_Lace_Rice_Paper_-_A4_Decoupage_Journal_Paper.jpg',
    title: 'Design Your Best Life, One Page at a Time',
    text: 'Beautiful journals for mindfulness, gratitude, productivity, and personal growth.',
    button: 'Shop Journal',
  },
  {
    image: '/charge-media/desk_set_up.jpg',
    title: 'Capture Your Thoughts, Create Your Future',
    text: 'Premium journals designed to help you stay organized, inspired, and focused on what matters most.',
    button: 'Explore Collection',
  },
  {
    image: '/charge-media/1407443630439307.jpg',
    title: 'Every Great Journey Begins With a Blank Page',
    text: 'Elegant journals created for dreamers, planners, and mindful thinkers who value intentional living.',
    button: 'Start Writing',
  },
];

const serviceItems = [
  {
    image: '/charge-media/aesthetic_1.jpg',
    title: 'FREE SHIPPING',
    text: 'Free for orders over 100$',
  },
  {
    image: '/charge-media/ready_to_manifest_and_to_journal.jpg',
    title: '24/7 Support',
    text: 'Fast, professional support',
  },
  {
    image: '/charge-media/Note_book.jpg',
    title: 'CHOOSE DELIVERY DATE',
    text: 'Flexible delivery dates',
  },
  {
    image: '/charge-media/149322543895082991.jpg',
    title: 'EXTENDED SUPPORT PERIOD',
    text: '30 days return policy',
  },
];

export default function Homepage() {
  const data = useLoaderData<typeof loader>() as {
    goal: Collection | null;
    flourish: Collection | null;
    gratitude: Collection | null;
    collections: {nodes: Collection[]};
    dailyGoal: Product | null;
  };

  const goal = data.goal?.products?.nodes ?? [];
  const flourish = data.flourish?.products?.nodes ?? [];
  const gratitude = data.gratitude?.products?.nodes ?? [];
  const favourite = flourish.slice(0, 4);

  return (
    <div className="charge-home">
      <section className="charge-hero" aria-label="Featured journals">
        {heroSlides.map((slide, index) => (
          <article
            className={`charge-hero-slide ${index === 0 ? 'is-active' : ''}`}
            key={slide.title}
            style={{backgroundImage: `url("${slide.image}")`}}
          >
            <div className="charge-hero-copy">
              <h1>{slide.title}</h1>
              <p>{slide.text}</p>
              <Link className="charge-button charge-button-light" to="/collections/all">
                {slide.button}
              </Link>
            </div>
          </article>
        ))}
        <div className="charge-hero-dots" aria-hidden="true">
          <span className="active" />
          <span />
          <span />
        </div>
      </section>

      <section className="charge-service-bar charge-container">
        {serviceItems.map((item) => (
          <div className="charge-service-item" key={item.title}>
            <img src={item.image} alt="" />
            <div>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="charge-promo-grid charge-container">
        <PromoCard
          title="Gratitude Journals"
          subtitle="Daily Reflection"
          text="Build a positive mindset and appreciate life's meaningful moments."
          image="/charge-media/Vintage_Floral_Pattern_Spiral_Notebook___Ruled_Journal.jpg"
          background="#ebdccf"
          href="/collections/gratitude-journals"
        />
        <PromoCard
          title="Goal Setting Journals"
          subtitle="Achieve More"
          text="Plan your goals, track progress, and stay focused every day."
          image="/charge-media/70437490356239.jpg"
          background="#f1f1f1"
          href="/collections/goal-setting-journals"
        />
      </section>

      <MagazineCollection
        title="Achieve Success"
        subtitle="Set clear goals, track progress, and stay motivated toward your dreams."
        background="#dad9d7"
        products={goal}
        href="/collections/goal-setting-journals"
      />

      <MagazineCollection
        title="Mind & Body"
        subtitle="Build healthy habits, reduce stress, and support your well-being."
        background="#ead3e6"
        products={flourish}
        href="/collections/flourish-journal"
      />

      <MagazineCollection
        title="Positive Living"
        subtitle="Cultivate thankfulness and focus on the good in every day."
        background="#dac1aa"
        coverImage="/charge-media/desk_set_up.jpg"
        products={gratitude}
        href="/collections/gratitude-journals"
      />

      <section className="charge-section charge-container">
        <SectionHeading
          title="Our favourite products"
          href="/collections/flourish-journal"
        />
        <div className="charge-products-grid">
          {favourite.map((product) => (
            <ChargeProductCard product={product} key={product.id} />
          ))}
        </div>
      </section>

      <section className="charge-collage charge-container">
        <Link className="charge-story-card" to="/collections/all">
          <img
            src="/charge-media/794815034281825159.jpg"
            alt="Journal inspiration"
          />
          <div className="charge-story-overlay">
            <span className="charge-play">▶</span>
            <strong>Write Your Story Beautifully</strong>
          </div>
        </Link>

        {data.dailyGoal ? (
          <div className="charge-collage-product">
            <ChargeProductCard product={data.dailyGoal} />
          </div>
        ) : null}
      </section>

      <section className="charge-section charge-container">
        <h2>Browse our collections</h2>
        <div className="charge-collections-strip">
          {data.collections.nodes.slice(0, 5).map((collection) => (
            <Link
              className="charge-collection-card"
              key={collection.id}
              to={`/collections/${collection.handle}`}
            >
              {collection.image ? (
                <img
                  src={collection.image.url}
                  alt={collection.image.altText || collection.title}
                />
              ) : (
                <div className="charge-image-placeholder" />
              )}
              <span>{collection.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="charge-image-text charge-container">
        <div className="charge-image-text-copy">
          <h2>Where Every Page Inspires Growth</h2>
          <p>
            At Velvet Journal Co, we believe that journaling is more than putting
            words on paper—it&apos;s a powerful tool for reflection, creativity,
            and personal transformation. Our thoughtfully designed journals help
            you capture meaningful moments, set inspiring goals, and create habits
            that support a more intentional life.
          </p>
          <Link className="charge-button charge-button-red" to="/collections/all">
            View all
          </Link>
        </div>
        <div className="charge-image-text-media">
          <img
            src="/charge-media/Escucho_al_Universo_disponible_en_Chile___La.jpg"
            alt="Velvet Journal Co journal"
          />
        </div>
      </section>

      <section className="charge-about">
        <div className="charge-container charge-about-inner">
          <h2>Designed for Intentional Living</h2>
          <p>
            At Velvet Journal Co, we create thoughtfully designed journals and
            planners that help you stay organized, set meaningful goals, and
            capture life&apos;s important moments. Our products are designed to
            inspire reflection, productivity, and personal growth every day.
          </p>
        </div>
      </section>

      <section className="charge-brand-slider">
        <div className="charge-container charge-brand-track">
          {[
            'The_Inspired_Stories.jpg',
            '512073420129521389.jpg',
            '497295983852804702.jpg',
            'Journal_intro_page_idea____journalideas.jpg',
            '376191375148414619.jpg',
            'kawaii_journaling.jpg',
            'Printed_neutral_beige_planner_cards_l_Set_of_4_l_Minimal_journal_quotes_l_Inspirational_words_l_Simple_aesthetic_l_Gold_foil_floral_line_art.jpg',
          ].map((image) => (
            <div className="charge-brand-item" key={image}>
              <img src={`/charge-media/${image}`} alt="Journal inspiration" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PromoCard({
  title,
  subtitle,
  text,
  image,
  background,
  href,
}: {
  title: string;
  subtitle: string;
  text: string;
  image: string;
  background: string;
  href: string;
}) {
  return (
    <Link className="charge-promo" to={href} style={{background}}>
      <div className="charge-promo-copy">
        <small>{subtitle}</small>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <img src={image} alt={title} />
    </Link>
  );
}

function MagazineCollection({
  title,
  subtitle,
  background,
  coverImage,
  products,
  href,
}: {
  title: string;
  subtitle: string;
  background: string;
  coverImage?: string;
  products: Product[];
  href: string;
}) {
  return (
    <section className="charge-magazine charge-container">
      <div
        className="charge-magazine-cover"
        style={{
          background,
          ...(coverImage
            ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,.16),rgba(0,0,0,.16)),url("${coverImage}")`,
              }
            : {}),
        }}
      >
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
          <Link className="charge-small-button" to={href}>
            View all →
          </Link>
        </div>
      </div>
      <div className="charge-magazine-products">
        {products.slice(0, 4).map((product) => (
          <ChargeProductCard product={product} key={product.id} compact />
        ))}
      </div>
    </section>
  );
}

function SectionHeading({title, href}: {title: string; href: string}) {
  return (
    <div className="charge-section-heading">
      <h2>{title}</h2>
      <Link className="charge-view-all" to={href}>
        View all →
      </Link>
    </div>
  );
}

function ChargeProductCard({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  return (
    <article className={`charge-product-card ${compact ? 'is-compact' : ''}`}>
      <Link to={`/products/${product.handle}`}>
        <div className="charge-product-image">
          {product.featuredImage ? (
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText || product.title}
            />
          ) : (
            <div className="charge-image-placeholder" />
          )}
        </div>
        <h3>{product.title}</h3>
        <div className="charge-price">
          <Money data={product.priceRange.minVariantPrice} />
        </div>
      </Link>
    </article>
  );
}

const CHARGE_HOME_QUERY = `#graphql
  query ChargeHome($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    goal: collection(handle: "goal-setting-journals") {
      ...ChargeCollection
    }
    flourish: collection(handle: "flourish-journal") {
      ...ChargeCollection
    }
    gratitude: collection(handle: "gratitude-journals") {
      ...ChargeCollection
    }
    collections(first: 8, sortKey: UPDATED_AT) {
      nodes {
        id
        title
        handle
        image {
          url
          altText
        }
      }
    }
    dailyGoal: product(handle: "daily-goal-planner") {
      ...ChargeProduct
    }
  }

  fragment ChargeCollection on Collection {
    id
    title
    handle
    products(first: 8) {
      nodes {
        ...ChargeProduct
      }
    }
  }

  fragment ChargeProduct on Product {
    id
    title
    handle
    featuredImage {
      url
      altText
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
` as const;

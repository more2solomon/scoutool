import type {Metadata} from "next";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import {JOURNAL_POSTS} from "@/data/journal";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.velvetjournalco.store";

export function generateStaticParams() {
  return JOURNAL_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{slug: string}>;
}): Promise<Metadata> {
  const {slug} = await params;
  const post = JOURNAL_POSTS.find((item) => item.slug === slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/journal/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/journal/${post.slug}`,
      type: "article",
      publishedTime: post.published,
      images: [{url: post.image, alt: post.title}],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}

export default async function JournalArticle({
  params,
}: {
  params: Promise<{slug: string}>;
}) {
  const {slug} = await params;
  const post = JOURNAL_POSTS.find((item) => item.slug === slug);

  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: [`${SITE_URL}${post.image}`],
    datePublished: post.published,
    dateModified: post.published,
    mainEntityOfPage: `${SITE_URL}/journal/${post.slug}`,
    author: {
      "@type": "Organization",
      name: "Velvet Journal Co",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Velvet Journal Co",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.png`,
      },
    },
  };

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
        name: "Journal",
        item: `${SITE_URL}/journal`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE_URL}/journal/${post.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[articleSchema, breadcrumbSchema]} />

      <Header />

      <main className="charge-shell article-page">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>›</span>
          <a href="/journal">Journal</a>
          <span>›</span>
          <span>{post.title}</span>
        </nav>

        <p className="editorial-kicker">THE VELVET JOURNAL</p>
        <h1>{post.title}</h1>
        <p className="article-lede">{post.excerpt}</p>

        <img className="article-hero" src={post.image} alt={post.title} />

        <div
          className="rich-text article-body"
          dangerouslySetInnerHTML={{__html: post.body}}
        />

        <div className="article-next">
          <a href="/collections/all">Explore journals and planners →</a>
        </div>
      </main>

      <Footer />
    </>
  );
}

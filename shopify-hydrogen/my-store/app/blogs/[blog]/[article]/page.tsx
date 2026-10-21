import type {Metadata} from "next";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {getArticle} from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{blog: string; article: string}>;
}): Promise<Metadata> {
  const {blog, article} = await params;
  const post = await getArticle(blog, article);
  if (!post) return {};

  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    alternates: {canonical: `/blogs/${blog}/${article}`},
    openGraph: post.image
      ? {images: [{url: post.image.url, alt: post.image.altText || post.title}]}
      : undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{blog: string; article: string}>;
}) {
  const {blog, article} = await params;
  const post = await getArticle(blog, article);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="charge-shell article-page">
        <p className="article-date">
          {new Date(post.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1>{post.title}</h1>
        {post.image && (
          <img
            className="article-hero"
            src={post.image.url}
            alt={post.image.altText || post.title}
          />
        )}
        <div
          className="rich-text article-body"
          dangerouslySetInnerHTML={{__html: post.contentHtml}}
        />
      </main>
      <Footer />
    </>
  );
}

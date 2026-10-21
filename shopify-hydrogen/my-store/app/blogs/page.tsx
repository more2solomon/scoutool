import type {Metadata} from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {getArticles} from "@/lib/shopify";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Read Velvet Journal Co articles about journaling, gratitude, goal setting, mindfulness, planning and intentional living.",
  alternates: {canonical: "/blogs"},
};

export default async function BlogIndex() {
  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  try {
    articles = await getArticles();
  } catch {
    articles = [];
  }

  return (
    <>
      <Header />
      <main className="charge-shell simple-page">
        <h1>Velvet Journal</h1>
        <p className="collection-description">
          Ideas and inspiration for gratitude, reflection, goals and intentional living.
        </p>

        {articles.length ? (
          <div className="blog-grid">
            {articles.map((article) => (
              <article className="blog-card" key={article.id}>
                {article.image && (
                  <a href={`/blogs/${article.blogHandle}/${article.handle}`}>
                    <img src={article.image.url} alt={article.image.altText || article.title} />
                  </a>
                )}
                <div>
                  <small>{article.blogTitle}</small>
                  <h2>
                    <a href={`/blogs/${article.blogHandle}/${article.handle}`}>
                      {article.title}
                    </a>
                  </h2>
                  <p>{article.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>No articles have been published yet.</p>
        )}
      </main>
      <Footer />
    </>
  );
}

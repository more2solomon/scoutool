import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {JOURNAL_POSTS} from "@/data/journal";

export default function JournalPage() {
  return (
    <>
      <Header />

      <main className="charge-shell editorial-page">
        <p className="editorial-kicker">THE VELVET JOURNAL</p>
        <h1>Ideas for a More Intentional Life</h1>

        <p className="journal-intro">
          Practical inspiration for gratitude journaling, goal setting,
          reflection, planning and meaningful everyday routines.
        </p>

        <div className="blog-grid">
          {JOURNAL_POSTS.map((post) => (
            <article className="blog-card" key={post.slug}>
              <a href={`/journal/${post.slug}`}>
                <img src={post.image} alt={post.title} />
              </a>

              <div>
                <small>VELVET JOURNAL CO</small>

                <h2>
                  <a href={`/journal/${post.slug}`}>{post.title}</a>
                </h2>

                <p>{post.excerpt}</p>

                <a className="journal-read" href={`/journal/${post.slug}`}>
                  Read article →
                </a>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}

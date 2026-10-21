import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />

      <main className="not-found-page">
        <div className="not-found-scene" aria-hidden="true">
          <div className="floating-book">
            <div className="book-cover">
              <span>404</span>
            </div>

            <div className="book-page page-one" />
            <div className="book-page page-two" />
            <div className="book-page page-three" />
          </div>

          <span className="floating-spark spark-one">✦</span>
          <span className="floating-spark spark-two">✧</span>
          <span className="floating-spark spark-three">✦</span>
        </div>

        <div className="not-found-copy">
          <p className="editorial-kicker">PAGE NOT FOUND</p>

          <h1>This page wandered off.</h1>

          <p>
            The page you were looking for may have moved, but there are still plenty of pages worth writing.
          </p>

          <div className="not-found-actions">
            <a className="charge-button" href="/">
              Back home
            </a>

            <a className="not-found-secondary" href="/collections/all">
              Browse journals
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

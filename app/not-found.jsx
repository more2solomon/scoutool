"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="notFound">
      <div className="notFoundCard">
        <div className="code">404</div>

        <h1>Page not found</h1>

        <p>
          The page you are looking for doesn't exist or may have been moved.
        </p>

        <Link href="/" className="homeButton">
          Back to Scout Mail
        </Link>
      </div>
    </main>
  );
}

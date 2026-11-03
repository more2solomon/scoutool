"use client";

import { useState } from "react";
import Link from "next/link";

export default function ScraperPage() {
  const [scraperFile, setScraperFile] = useState(null);
  const [scraperBusy, setScraperBusy] = useState(false);
  const [scraperStatus, setScraperStatus] = useState("Ready");
  const [scraperProgress, setScraperProgress] = useState(0);
  const [scraperProcessed, setScraperProcessed] = useState(0);
  const [scraperTotal, setScraperTotal] = useState(0);
  const [scraperResults, setScraperResults] = useState(null);
  const [scraperCsv, setScraperCsv] = useState("");
  const [message, setMessage] = useState("");

  async function runScraper() {
    if (!scraperFile) {
      setMessage("Please select a CSV file first.");
      return;
    }

    setScraperBusy(true);
    setScraperStatus("Processing URLs...");
    setScraperProgress(0);
    setScraperProcessed(0);
    setScraperTotal(0);
    setScraperResults(null);
    setScraperCsv("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", scraperFile);

      const response = await fetch("/api/scraper", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Scraping failed");
      }

      setScraperResults(data.stats);
      setScraperCsv(data.csv);
      setScraperStatus("Completed");
      setScraperProgress(100);
      setScraperProcessed(data.stats.totalUrls);
      setScraperTotal(data.stats.totalUrls);
      setMessage(`Scraped ${data.stats.totalUrls} URLs. Found ${data.stats.totalEmails} emails (${data.stats.uniqueEmails} unique).`);
    } catch (error) {
      setScraperStatus("Failed");
      setMessage(error.message);
    } finally {
      setScraperBusy(false);
    }
  }

  function downloadCsv() {
    if (!scraperCsv) return;

    const blob = new Blob([scraperCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scraped-emails-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <main className="shell">
      <header className="header">
        <div>
          <h1>Email Scraper</h1>
          <p>Extract email addresses from websites</p>
        </div>
        <nav className="nav">
          <Link href="/">Generator</Link>
          <Link href="/drafts">Drafts</Link>
          <Link href="/automation">Automation</Link>
          <Link href="/scraper" className="active">Scraper</Link>
          <Link href="/analytics">Analytics</Link>
        </nav>
      </header>

      <section className="panel">
        <div className="sectionHeader">
          <div>
            <h2>Upload CSV</h2>
            <p className="subtle">
              Upload a CSV file with a 'url', 'domain', 'store', or 'domain_url' column to scrape for email addresses
            </p>
          </div>
        </div>

        <div className="scraperUpload">
          <label>
            CSV File (must have 'url', 'domain', 'store', or 'domain_url' column)
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setScraperFile(e.target.files[0])}
              disabled={scraperBusy}
            />
          </label>
        </div>

        {scraperResults && (
          <div className="scraperStats">
            <div className="card">
              <span>Total URLs</span>
              <strong>{scraperResults.totalUrls}</strong>
            </div>
            <div className="card">
              <span>Successful</span>
              <strong>{scraperResults.successful}</strong>
            </div>
            <div className="card">
              <span>Failed</span>
              <strong>{scraperResults.failed}</strong>
            </div>
            <div className="card">
              <span>Total Emails</span>
              <strong>{scraperResults.totalEmails}</strong>
            </div>
            <div className="card">
              <span>Unique Emails</span>
              <strong>{scraperResults.uniqueEmails}</strong>
            </div>
          </div>
        )}

        <div className="scraperStatus">
          <span>{scraperStatus}</span>
        </div>

        {scraperBusy && (
          <div className="scraperProgressSection">
            <div className="scraperProgressHeader">
              <span>Processing... {scraperProcessed}/{scraperTotal}</span>
              <strong>{scraperProgress}%</strong>
            </div>
            <div className="progressTrack" aria-label="Scraping progress">
              <div
                className="progressBar"
                style={{ width: `${scraperProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="scraperControls">
          <button
            className="scrape"
            disabled={scraperBusy || !scraperFile}
            onClick={runScraper}
          >
            {scraperBusy ? "SCRAPING..." : "SCRAPE URLS"}
          </button>

          {scraperCsv && (
            <button
              className="download"
              onClick={downloadCsv}
            >
              DOWNLOAD CSV
            </button>
          )}
        </div>

        {message && (
          <div className="message">
            {message}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Instructions</h2>
        <ul>
          <li>Create a CSV file with a column named 'url', 'domain', 'store', or 'domain_url'</li>
          <li>Add website URLs you want to scrape for emails</li>
          <li>Upload the file and click "SCRAPE URLS"</li>
          <li>The scraper will extract all email addresses from each website</li>
          <li>Download the results as a CSV with columns: url, status, email, domain</li>
        </ul>
      </section>

      <footer>
        <div className="footerLinks">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/policies">Policies</Link>
        </div>
        <div className="footerText">
          Scoutool Batch · Email scraping and automation tools
        </div>
      </footer>
    </main>
  );
}

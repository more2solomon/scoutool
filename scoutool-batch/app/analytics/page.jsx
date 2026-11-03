"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function fetchStats() {
    try {
      const response = await fetch("/api/analytics");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  }

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  if (!stats) {
    return (
      <main className="shell">
        <header className="header">
          <div>
            <h1>Analytics Dashboard</h1>
            <p>Email campaign performance tracking</p>
          </div>
          <nav className="nav">
            <Link href="/">Generator</Link>
            <Link href="/drafts">Drafts</Link>
            <Link href="/automation">Automation</Link>
            <Link href="/scraper">Scraper</Link>
            <Link href="/analytics" className="active">Analytics</Link>
          </nav>
        </header>
        <div className="empty">Loading analytics...</div>
        <footer>
          <div className="footerLinks">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/policies">Policies</Link>
          </div>
          <div className="footerText">
            Scoutool Batch · Analytics and performance tracking
          </div>
        </footer>
      </main>
    );
  }

  const summary = stats.summary;

  return (
    <main className="shell">
      <header className="header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Email campaign performance tracking</p>
        </div>
        <nav className="nav">
          <Link href="/">Generator</Link>
          <Link href="/drafts">Drafts</Link>
          <Link href="/automation">Automation</Link>
          <Link href="/scraper">Scraper</Link>
          <Link href="/analytics" className="active">Analytics</Link>
        </nav>
      </header>

      <section className="panel">
        <div className="sectionHeader">
          <h2>Campaign Overview</h2>
          <span>Session: {new Date(stats.sessionStart).toLocaleTimeString()}</span>
        </div>

        <div className="dashboardStats">
          <div className="card">
            <span>Total Sent</span>
            <strong>{summary.sent}</strong>
          </div>
          <div className="card">
            <span>Unique Sent</span>
            <strong>{summary.uniqueSent}</strong>
          </div>
          <div className="card">
            <span>Delivered</span>
            <strong>{summary.delivered}</strong>
          </div>
          <div className="card">
            <span>Failed</span>
            <strong>{summary.failed}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Engagement Metrics</h2>
        <div className="dashboardStats">
          <div className="card">
            <span>Opens</span>
            <strong>{summary.opened}</strong>
            <small>Unique: {summary.uniqueOpened}</small>
          </div>
          <div className="card success">
            <span>Open Rate</span>
            <strong>{summary.openRate}%</strong>
          </div>
          <div className="card">
            <span>Clicks</span>
            <strong>{summary.clicked}</strong>
            <small>Unique: {summary.uniqueClicked}</small>
          </div>
          <div className="card success">
            <span>Click Rate</span>
            <strong>{summary.clickRate}%</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Delivery Health</h2>
        <div className="dashboardStats">
          <div className="card warning">
            <span>Bounces</span>
            <strong>{summary.bounced}</strong>
            <small>Unique: {summary.uniqueBounced}</small>
          </div>
          <div className="card warning">
            <span>Bounce Rate</span>
            <strong>{summary.bounceRate}%</strong>
          </div>
          <div className="card">
            <span>Replies</span>
            <strong>{summary.replied}</strong>
            <small>Unique: {summary.uniqueReplied}</small>
          </div>
          <div className="card success">
            <span>Reply Rate</span>
            <strong>{summary.replyRate}%</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Performance Summary</h2>
        <div className="resultsSummary">
          <div className="card success">
            <span>Success Rate</span>
            <strong>{summary.successRate}%</strong>
          </div>
          <div className="card">
            <span>Total Events</span>
            <strong>{summary.totalEvents}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionHeader">
          <h2>Recent Activity</h2>
          <button className="secondary" onClick={() => setRefreshKey(k => k + 1)}>
            Refresh
          </button>
        </div>

        {stats.timeline && stats.timeline.length > 0 ? (
          <div className="resultsList">
            {stats.timeline.map((event, index) => (
              <div key={event.id || index} className="resultItem">
                <div>
                  <strong>{event.type.replace(/_/g, " ").toUpperCase()}</strong>
                  <small>{new Date(event.timestamp).toLocaleString()}</small>
                </div>
                <div>
                  {event.to && <span>{event.to}</span>}
                  {event.email && <span>{event.email}</span>}
                  {event.subject && <small>{event.subject}</small>}
                  {event.error && <span className="failed">{event.error}</span>}
                  {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer">link</a>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No activity yet. Send some emails to see analytics.</div>
        )}
      </section>

      <footer>
        <div className="footerLinks">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/policies">Policies</Link>
        </div>
        <div className="footerText">
          Scoutool Batch · Analytics and performance tracking
        </div>
      </footer>
    </main>
  );
}
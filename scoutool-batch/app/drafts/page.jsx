"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DB_NAME = "scoutool-batch-db";
const DB_VERSION = 2;
const STORE_NAME = "generated-records";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadRecords() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export default function DraftsPage() {
  const [generated, setGenerated] = useState([]);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftStatus, setDraftStatus] = useState("Ready");
  const [draftCount, setDraftCount] = useState(0);
  const [draftTotal, setDraftTotal] = useState(0);
  const [draftStart, setDraftStart] = useState(1);
  const [draftEnd, setDraftEnd] = useState(100);
  const [message, setMessage] = useState("");

  async function refreshGmailStatus() {
    try {
      const response = await fetch("/api/auth/google/status", {
        cache: "no-store",
      });
      const data = await response.json();
      setGmailConnected(Boolean(data.connected));
      setGmailEmail(data.email || "");
    } catch {
      setGmailConnected(false);
      setGmailEmail("");
    }
  }

  async function createGmailDrafts() {
    const rangeStart = Math.max(1, Number(draftStart) || 1);
    const rangeEnd = Math.max(rangeStart, Number(draftEnd) || rangeStart);
    const seen = new Set();
    const candidates = generated.filter((record) => {
      const email = String(record.email || "").trim().toLowerCase();
      if (!email || !email.includes("@") || seen.has(email)) return false;
      seen.add(email);
      return true;
    }).slice(rangeStart - 1, rangeEnd);

    if (!candidates.length) {
      setDraftStatus("No valid records");
      setMessage("Generate valid email records first");
      return;
    }

    setDraftBusy(true);
    setDraftStatus("Creating unsent Gmail drafts");
    setDraftCount(0);
    setDraftTotal(candidates.length);

    try {
      let created = 0;
      for (let index = 0; index < candidates.length; index += 5) {
        const response = await fetch("/api/gmail/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: candidates.slice(index, index + 5) }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Draft creation failed.");
        created += data.count || 0;
        setDraftCount(created);
      }
      setDraftStatus("Drafts created");
      setMessage(`Created ${created} unsent Gmail drafts`);
    } catch (error) {
      setDraftStatus("Draft creation failed");
      setMessage(error.message);
    } finally {
      setDraftBusy(false);
    }
  }

  useEffect(() => {
    const gmailResult = new URLSearchParams(window.location.search).get("gmail");
    if (gmailResult === "connected") {
      setMessage("Gmail connected successfully. Drafts are ready.");
      window.history.replaceState({}, "", "/drafts");
    }
    refreshGmailStatus();
    loadRecords().then(setGenerated).catch(() => setMessage("Unable to load records"));
    const gmailTimer = setInterval(refreshGmailStatus, 10000);
    return () => clearInterval(gmailTimer);
  }, []);

  return (
    <main className="shell">
      <header className="header">
        <div>
          <h1>Gmail Drafts</h1>
          <p>Create and manage Gmail drafts</p>
        </div>
        <nav className="nav">
          <Link href="/">Generator</Link>
          <Link href="/drafts" className="active">Drafts</Link>
          <Link href="/automation">Automation</Link>
          <Link href="/scraper">Scraper</Link>
          <Link href="/analytics">Analytics</Link>
        </nav>
      </header>

      <section className="panel">
        <div className="sectionHeader">
          <div>
            <h2>Gmail Connection</h2>
            <p className="subtle">
              {gmailConnected
                ? `Connected as ${gmailEmail}`
                : "Connect Gmail to create unsent drafts from your records."}
            </p>
          </div>
          <span className={`connectionBadge ${gmailConnected ? "connected" : "disconnected"}`}>
            <span className="dot" />
            {gmailConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="gmailActions">
          <a className="secondary large" href="/api/auth/google/start">
            {gmailConnected ? "Reconnect Gmail" : "Connect Gmail"}
          </a>
        </div>
      </section>

      <section className="panel">
        <h2>Draft Range</h2>
        <div className="draftRangePanel">
          <label>
            From
            <input type="number" min="1" value={draftStart} onChange={(event) => setDraftStart(Number(event.target.value) || 1)} />
          </label>
          <label>
            Through
            <input type="number" min={draftStart} value={draftEnd} onChange={(event) => setDraftEnd(Number(event.target.value) || draftStart)} />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="sectionHeader">
          <h2>Create Drafts</h2>
          <span>{generated.length} records available</span>
        </div>

        <div className="draftProgressHeader">
          <span>{draftStatus}</span>
          <strong>{draftCount}/{draftTotal || 0}</strong>
        </div>
        <div className="progressTrack" aria-label="Gmail draft progress">
          <div
            className={`progressBar ${draftBusy ? "indeterminate" : ""}`}
            style={{ width: draftTotal ? `${Math.min(100, (draftCount / draftTotal) * 100)}%` : "0%" }}
          />
        </div>

        <div className="controls">
          <button
            className="primary large"
            disabled={draftBusy || !gmailConnected || !generated.length}
            onClick={createGmailDrafts}
          >
            {draftBusy ? "CREATING DRAFTS..." : `CREATE DRAFTS ${draftStart}-${draftEnd}`}
          </button>
        </div>

        {message && (
          <div className="message">
            {message}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Records Preview</h2>
        {generated.length === 0 ? (
          <div className="empty">
            No records found. Go to the Generator page to create records first.
          </div>
        ) : (
          <div className="queue">
            {generated.slice(0, 20).map((record, index) => (
              <div className="row" key={record.id}>
                <span>#{index + 1}</span>
                <div>
                  <strong>{record.email}</strong>
                  {record.subject && <small>{record.subject}</small>}
                </div>
              </div>
            ))}
            {generated.length > 20 && (
              <div className="empty">
                And {generated.length - 20} more records...
              </div>
            )}
          </div>
        )}
      </section>

      <footer>
        <div className="footerLinks">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/policies">Policies</Link>
        </div>
        <div className="footerText">
          Scoutool Batch · Gmail draft management
        </div>
      </footer>
    </main>
  );
}

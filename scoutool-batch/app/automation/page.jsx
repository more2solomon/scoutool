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

export default function AutomationPage() {
  const [generated, setGenerated] = useState([]);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");
  const [sendBusy, setSendBusy] = useState(false);
  const [sendStatus, setSendStatus] = useState("Ready");
  const [sendCount, setSendCount] = useState(0);
  const [sendTotal, setSendTotal] = useState(0);
  const [sendStart, setSendStart] = useState(1);
  const [sendEnd, setSendEnd] = useState(100);
  const [delay, setDelay] = useState(5);
  const [autoSend, setAutoSend] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState([]);

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

  async function sendEmails() {
    const rangeStart = Math.max(1, Number(sendStart) || 1);
    const rangeEnd = Math.max(rangeStart, Number(sendEnd) || rangeStart);
    const seen = new Set();
    const candidates = generated.filter((record) => {
      const email = String(record.email || "").trim().toLowerCase();
      if (!email || !email.includes("@") || seen.has(email)) return false;
      seen.add(email);
      return true;
    }).slice(rangeStart - 1, rangeEnd);

    if (!candidates.length) {
      setSendStatus("No valid records");
      setMessage("Generate valid email records first");
      return;
    }

    setSendBusy(true);
    setSendStatus("Sending emails...");
    setSendCount(0);
    setSendTotal(candidates.length);
    setResults([]);

    try {
      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          records: candidates,
          delay: Number(delay) || 5
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Send failed");
      }

      setSendStatus("Completed");
      setResults(data.results || []);
      setMessage(`Sent ${data.successful} emails successfully. ${data.failed} failed.`);
    } catch (error) {
      setSendStatus("Send failed");
      setMessage(error.message);
    } finally {
      setSendBusy(false);
    }
  }

  useEffect(() => {
    const gmailResult = new URLSearchParams(window.location.search).get("gmail");
    if (gmailResult === "connected") {
      setMessage("Gmail connected successfully. Automation is ready.");
      window.history.replaceState({}, "", "/automation");
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
          <h1>Email Automation</h1>
          <p>Automate email sending with scheduling</p>
        </div>
        <nav className="nav">
          <Link href="/">Generator</Link>
          <Link href="/drafts">Drafts</Link>
          <Link href="/automation" className="active">Automation</Link>
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
                : "Connect Gmail to enable automated email sending."}
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
        <h2>Send Configuration</h2>
        
        <div className="sendConfig">
          <label>
            Send range
            <div className="rangeInputs">
              <input 
                type="number" 
                min="1" 
                value={sendStart} 
                onChange={(event) => setSendStart(Number(event.target.value) || 1)} 
                placeholder="From"
              />
              <span>to</span>
              <input 
                type="number" 
                min={sendStart} 
                value={sendEnd} 
                onChange={(event) => setSendEnd(Number(event.target.value) || sendStart)} 
                placeholder="Through"
              />
            </div>
          </label>

          <label>
            Delay between sends (seconds)
            <input
              type="number"
              min="1"
              max="60"
              value={delay}
              onChange={(e) => setDelay(Math.max(1, Math.min(60, Number(e.target.value) || 5)))}
            />
            <p className="hint">
              Longer delays help avoid rate limiting. Recommended: 5-10 seconds.
            </p>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="sectionHeader">
          <h2>Send Emails</h2>
          <span>{generated.length} records available</span>
        </div>

        <div className="sendProgressHeader">
          <span>{sendStatus}</span>
          <strong>{sendCount}/{sendTotal || 0}</strong>
        </div>
        <div className="progressTrack" aria-label="Email send progress">
          <div
            className={`progressBar ${sendBusy ? "indeterminate" : ""}`}
            style={{ width: sendTotal ? `${Math.min(100, (sendCount / sendTotal) * 100)}%` : "0%" }}
          />
        </div>

        <div className="controls">
          <button
            className="primary large"
            disabled={sendBusy || !gmailConnected || !generated.length}
            onClick={sendEmails}
          >
            {sendBusy ? "SENDING..." : `SEND EMAILS ${sendStart}-${sendEnd}`}
          </button>
        </div>

        {message && (
          <div className="message">
            {message}
          </div>
        )}
      </section>

      {results.length > 0 && (
        <section className="panel">
          <div className="sectionHeader">
            <h2>Send Results</h2>
            <span>{results.length} processed</span>
          </div>

          <div className="resultsSummary">
            <div className="card success">
              <span>Successful</span>
              <strong>{results.filter(r => r.success).length}</strong>
            </div>
            <div className="card failed">
              <span>Failed</span>
              <strong>{results.filter(r => !r.success).length}</strong>
            </div>
          </div>

          <div className="resultsList">
            {results.map((result, index) => (
              <div key={index} className={`resultItem ${result.success ? 'success' : 'failed'}`}>
                <span>{result.email}</span>
                <span>{result.success ? '✓ Sent' : `✗ ${result.error}`}</span>
              </div>
            ))}
          </div>
        </section>
      )}

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

      <section className="panel warningPanel">
        <h2>⚠️ Important Warning</h2>
        <p>
          Sending emails automatically carries risks. Please ensure:
        </p>
        <ul>
          <li>You have explicit consent from all recipients</li>
          <li>Your emails comply with anti-spam laws (CAN-SPAM, GDPR, etc.)</li>
          <li>You include clear opt-out mechanisms in every email</li>
          <li>You use appropriate delays to avoid rate limiting</li>
          <li>You test with small batches before sending to large lists</li>
        </ul>
        <p className="subtle">
          Scoutool is not responsible for emails sent through your account. You are solely responsible for your email marketing activities.
        </p>
      </section>

      <footer>
        <div className="footerLinks">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/policies">Policies</Link>
        </div>
        <div className="footerText">
          Scoutool Batch · Email automation and sending
        </div>
      </footer>
    </main>
  );
}

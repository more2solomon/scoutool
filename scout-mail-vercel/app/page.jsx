"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_URL = "https://scoutool-mail.created.app/";
const DEFAULT_DELAY = 6;

export default function Home() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [delay, setDelay] = useState(DEFAULT_DELAY);
  const [queue, setQueue] = useState([]);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [failed, setFailed] = useState(0);
  const [logs, setLogs] = useState(["Ready. Install the browser bridge to read Scoutool/Gmail pages."]);
  const [siteText, setSiteText] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("scout-mail-settings") || "{}");
      if (saved.url) setUrl(saved.url);
      if (Number.isFinite(saved.delay)) setDelay(Math.max(6, saved.delay));
      const savedQueue = JSON.parse(localStorage.getItem("scout-mail-queue") || "[]");
      if (Array.isArray(savedQueue)) setQueue(savedQueue);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("scout-mail-settings", JSON.stringify({ url, delay }));
  }, [url, delay]);

  useEffect(() => {
    localStorage.setItem("scout-mail-queue", JSON.stringify(queue));
  }, [queue]);

  const remaining = Math.max(0, queue.length - completed - failed);

  const addLog = (message) => {
    setLogs((items) => [`${new Date().toLocaleTimeString()}  ${message}`, ...items].slice(0, 100));
  };

  const start = () => {
    if (!queue.length) {
      addLog("No queued email records. Install the bridge and scan Scoutool first.");
      return;
    }
    setRunning(true);
    addLog(`Run started. ${queue.length} queued item(s), ${delay}s delay.`);
    addLog("Send remains user-confirmed in this web-only build.");
  };

  const stop = () => {
    setRunning(false);
    addLog("Run stopped.");
  };

  const clearQueue = () => {
    setQueue([]);
    setCompleted(0);
    setFailed(0);
    setRunning(false);
    addLog("Queue cleared.");
  };

  const importQueue = () => {
    try {
      const parsed = JSON.parse(siteText);
      if (!Array.isArray(parsed)) throw new Error("Queue JSON must be an array.");
      const normalized = parsed
        .map((item) => ({
          email: String(item.email || "").trim(),
          gmailUrl: String(item.gmailUrl || "").trim(),
          subject: String(item.subject || ""),
          body: String(item.body || "")
        }))
        .filter((item) => item.email);
      setQueue(normalized);
      addLog(`Imported ${normalized.length} queue item(s).`);
    } catch (error) {
      addLog(`Import failed: ${error.message}`);
    }
  };

  const analyzeWithGroq = async () => {
    setAiLoading(true);
    setAiResult("");
    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url,
          instructions:
            "Read the supplied website and return a concise JSON object with site_name, summary, target_customer, and any visible contact/outreach constraints. Do not invent facts."
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Groq request failed");
      setAiResult(data.text || "No response");
      addLog("Groq site analysis completed.");
    } catch (error) {
      setAiResult(error.message);
      addLog(`Groq error: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const installBridge = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/scout-mail-bridge.user.js`;
  }, []);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="brand">SCOUT MAIL</div>
          <div className="subtitle">Web control panel + browser bridge</div>
        </div>
        <div className={running ? "status running" : "status"}>
          <span className="dot" /> {running ? "Running" : "Ready"}
        </div>
      </header>

      <section className="grid settings-grid">
        <div className="panel">
          <h2>Connection</h2>
          <label>Scoutool base URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} />
          <div className="two-col">
            <div>
              <label>Delay (seconds)</label>
              <input type="number" min="6" value={delay} onChange={(e) => setDelay(Math.max(6, Number(e.target.value) || 6))} />
            </div>
            <div>
              <label>Queue source</label>
              <div className="readonly">Browser bridge</div>
            </div>
          </div>
          <div className="actions">
            <button onClick={start}>START</button>
            <button className="secondary" onClick={stop}>STOP</button>
            <button className="ghost" onClick={clearQueue}>CLEAR</button>
          </div>
        </div>

        <div className="panel bridge-panel">
          <h2>Browser bridge</h2>
          <p>
            A normal Vercel page cannot access Gmail/Scoutool tabs. Use the supplied userscript in a browser userscript manager to bridge those pages to this control panel.
          </p>
          <a className="download" href={installBridge} download>Download browser bridge</a>
          <div className="mini-help">
            <strong>Bridge scope:</strong> reads visible Scoutool queue data and reports it here. Gmail sending stays user-confirmed.
          </div>
        </div>
      </section>

      <section className="stats">
        <div><span>Queued</span><strong>{queue.length}</strong></div>
        <div><span>Completed</span><strong>{completed}</strong></div>
        <div><span>Failed</span><strong>{failed}</strong></div>
        <div><span>Remaining</span><strong>{remaining}</strong></div>
      </section>

      <section className="grid content-grid">
        <div className="panel">
          <h2>Queue</h2>
          {queue.length === 0 ? (
            <div className="empty">No queue items yet.</div>
          ) : (
            <div className="queue-list">
              {queue.slice(0, 50).map((item, index) => (
                <div className="queue-item" key={`${item.email}-${index}`}>
                  <div>
                    <strong>#{index + 1} · {item.email}</strong>
                    <div className="muted">{item.subject || "No subject supplied"}</div>
                  </div>
                  {item.gmailUrl && <a href={item.gmailUrl} target="_blank" rel="noreferrer">Gmail</a>}
                </div>
              ))}
            </div>
          )}
          <h3>Manual queue import</h3>
          <textarea value={siteText} onChange={(e) => setSiteText(e.target.value)} placeholder='[{"email":"name@example.com","gmailUrl":"https://mail.google.com/","subject":"Hello","body":"Message"}]' />
          <button className="ghost full" onClick={importQueue}>IMPORT JSON</button>
        </div>

        <div className="panel">
          <h2>Groq website analysis</h2>
          <p className="muted">The API key stays server-side as <code>GROQ_API_KEY</code>.</p>
          <button onClick={analyzeWithGroq} disabled={aiLoading}>{aiLoading ? "ANALYZING…" : "ANALYZE SCOUTOOL URL"}</button>
          <pre className="result">{aiResult || "No analysis yet."}</pre>

          <h2>Activity</h2>
          <div className="logs">
            {logs.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
      </section>

      <footer>
        <span>Scout Mail · Vercel-ready</span>
        <span>Web-only build · manual Gmail send confirmation</span>
      </footer>
    </main>
  );
}

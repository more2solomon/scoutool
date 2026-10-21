"use client";

import { useEffect, useState } from "react";

const DEFAULT_URL = "https://scoutool-mail.created.app/";

export default function Home() {
  const [queue, setQueue] = useState([]);
  const [state, setState] = useState({
    running: false,
    completed: 0,
    failed: 0,
    currentIndex: 0
  });

  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [delay, setDelay] = useState(6);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_URL);
  const [busy, setBusy] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftStatus, setDraftStatus] = useState("Ready");
  const [draftCount, setDraftCount] = useState(0);
  const [draftTotal, setDraftTotal] = useState(0);
  const [draftStart, setDraftStart] = useState(1);
  const [draftEnd, setDraftEnd] = useState(100);
  const [message, setMessage] = useState("");

  async function refresh() {
    try {
      const [queueResponse, stateResponse] = await Promise.all([
        fetch("/api/bridge/queue", { cache: "no-store" }),
        fetch("/api/bridge/state", { cache: "no-store" }),
      ]);

      if (!queueResponse.ok || !stateResponse.ok) {
        throw new Error("API unavailable");
      }

      const queueData = await queueResponse.json();
      const stateData = await stateResponse.json();

      setQueue(Array.isArray(queueData.items) ? queueData.items : []);
      setState(
        stateData.state || {
          running: false,
          completed: 0,
          failed: 0,
          currentIndex: 0
        }
      );

      setBridgeOnline(true);
      setMessage("");
    } catch (error) {
      setBridgeOnline(false);
      setMessage(error.message);
    }
  }

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
    const records = queue
      .filter((item) => {
        const email = String(item.email || "").trim().toLowerCase();

        if (!email || seen.has(email)) return false;

        seen.add(email);
        return true;
      })
      .slice(rangeStart - 1, rangeEnd);

    if (!records.length) {
      setDraftStatus("No valid records");
      setMessage("There are no valid queue items to draft.");
      return;
    }

    setDraftBusy(true);
    setDraftStatus("Creating unsent drafts in batches of 5");
    setDraftCount(0);
    setDraftTotal(records.length);

    try {
      let created = 0;

      for (let index = 0; index < records.length; index += 5) {
        const batch = records.slice(index, index + 5);
        const response = await fetch("/api/gmail/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: batch }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Draft batch ${Math.floor(index / 5) + 1} failed.`);
        }

        created += data.count || 0;
        setDraftCount(created);
      }

      setDraftTotal(records.length);
      setDraftStatus("Drafts created");
      setMessage(`Created ${created} unsent Gmail drafts in batches of 5.`);
    } catch (error) {
      setDraftStatus("Draft creation failed");
      setMessage(error.message);
    } finally {
      setDraftBusy(false);
    }
  }

  async function changeState(patch) {
    setBusy(true);

    try {
      const response = await fetch("/api/bridge/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(patch)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "State update failed");
      }

      setState(data.state);
      setMessage("State updated.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
    refreshGmailStatus();

    const gmailResult = new URLSearchParams(window.location.search).get("gmail");

    if (gmailResult === "connected") {
      setMessage("Gmail connected successfully. Drafts are ready.");
      window.history.replaceState({}, "", "/");
    }

    const timer = setInterval(refresh, 3000);
    const gmailTimer = setInterval(refreshGmailStatus, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(gmailTimer);
    };
  }, []);

  const remaining = Math.max(
    0,
    queue.length - state.completed - state.failed
  );

  return (
    <main className="shell">
      <header className="header">
        <div>
          <h1>Scout Mail</h1>
          <p>Gmail draft automation dashboard</p>
        </div>

        <div className={`bridge ${bridgeOnline ? "online" : "offline"}`}>
          <span className="dot" />
          {bridgeOnline ? "API connected" : "API offline"}
        </div>
      </header>

      <section className="panel">
        <h2>Settings</h2>

        <label>
          Scoutool URL
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </label>

        <label>
          Delay
          <div className="delay">
            <input
              type="number"
              min="6"
              value={delay}
              onChange={(e) =>
                setDelay(Math.max(6, Number(e.target.value) || 6))
              }
            />
            <span>seconds</span>
          </div>
        </label>

        <div className="gmailStatus">
          <span>
            Gmail: <strong>{gmailConnected ? gmailEmail : "Not connected"}</strong>
          </span>
          <a href="/api/auth/google/start">
            {gmailConnected ? "Reconnect Gmail" : "Connect Gmail"}
          </a>
        </div>
      </section>

      <section className="stats">
        <div className="card">
          <span>Queued</span>
          <strong>{queue.length}</strong>
        </div>

        <div className="card">
          <span>Completed</span>
          <strong>{state.completed}</strong>
        </div>

        <div className="card">
          <span>Failed</span>
          <strong>{state.failed}</strong>
        </div>

        <div className="card">
          <span>Remaining</span>
          <strong>{remaining}</strong>
        </div>
      </section>

      <section className="panel gmailPanel">
        <div className="sectionHeader">
          <div>
            <h2>Gmail Draft Automation</h2>
            <p className="subtle">
              {gmailConnected
                ? `Connected as ${gmailEmail}`
                : "Connect Gmail to create unsent drafts from the queue."}
            </p>
          </div>
          <span className={`connectionBadge ${gmailConnected ? "connected" : "disconnected"}`}>
            <span className="dot" />
            {gmailConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="draftProgressHeader">
          <span>{draftStatus}</span>
          <strong>{draftCount}/{draftTotal || 0}</strong>
        </div>
        <div className="progressTrack" aria-label="Gmail draft progress">
          <div
            className={`progressBar ${draftBusy ? "indeterminate" : ""}`}
            style={{
              width: draftTotal
                ? `${Math.min(100, (draftCount / draftTotal) * 100)}%`
                : "0%",
            }}
          />
        </div>
      </section>

      <section className="controls">
        <button
          disabled={busy || state.running}
          onClick={() =>
            changeState({
              running: true,
              currentIndex: state.currentIndex
            })
          }
        >
          START
        </button>

        <button
          className="stop"
          disabled={busy || !state.running}
          onClick={() => changeState({ running: false })}
        >
          STOP
        </button>

        <button
          className="refresh"
          disabled={busy}
          onClick={refresh}
        >
          REFRESH
        </button>

        <button
          className="drafts"
          disabled={draftBusy || !gmailConnected || !queue.length}
          onClick={createGmailDrafts}
        >
          {draftBusy ? "CREATING DRAFTS..." : `CREATE DRAFTS ${draftStart}-${draftEnd}`}
        </button>
      </section>

      <section className="panel draftRangePanel">
        <label>
          Draft records from
          <input type="number" min="1" value={draftStart} onChange={(event) => setDraftStart(Number(event.target.value) || 1)} />
        </label>
        <label>
          through
          <input type="number" min={draftStart} value={draftEnd} onChange={(event) => setDraftEnd(Number(event.target.value) || draftStart)} />
        </label>
      </section>

      <section className="panel">
        <div className="sectionHeader">
          <h2>Live Queue</h2>
          <span>{queue.length} items</span>
        </div>

        {queue.length === 0 ? (
          <div className="empty">
            No queue has been received yet. Open Scoutool with the bridge
            enabled.
          </div>
        ) : (
          <div className="queue">
            {queue.map((item, index) => (
              <div className="row" key={`${item.email}-${index}`}>
                <span>#{index + 1}</span>

                <div>
                  <strong>{item.email}</strong>
                  {item.subject && <small>{item.subject}</small>}
                </div>

                {item.gmailUrl ? (
                  <a
                    href={item.gmailUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Gmail
                  </a>
                ) : (
                  <span>-</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Activity</h2>

        <p>
          Status: <strong>{state.running ? "Running" : "Stopped"}</strong>
        </p>

        <p>
          Current item:{" "}
          <strong>{state.currentIndex + 1}</strong>
        </p>

        <p>{message || "Waiting for bridge data."}</p>
      </section>
    </main>
  );
}

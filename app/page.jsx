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
  const [message, setMessage] = useState("");

  async function refresh() {
    try {
      const [queueResponse, stateResponse] = await Promise.all([
        fetch("/api/bridge/queue", { cache: "no-store" }),
        fetch("/api/bridge/state", { cache: "no-store" })
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

    const timer = setInterval(refresh, 3000);

    return () => clearInterval(timer);
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
          <p>Live Scoutool queue dashboard</p>
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
            {queue.slice(0, 100).map((item, index) => (
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

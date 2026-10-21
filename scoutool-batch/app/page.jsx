"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DB_NAME = "scoutool-batch-db";
const DB_VERSION = 2;
const STORE_NAME = "generated-records";
const SETTINGS_KEY = "scoutool-batch-settings-v4";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () =>
      resolve(request.result);

    request.onerror = () =>
      reject(request.error);
  });
}

async function saveRecords(records) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store =
      tx.objectStore(STORE_NAME);

    store.clear();

    for (const record of records) {
      store.put(record);
    }

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function loadRecords() {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      "readonly"
    );

    const request =
      tx.objectStore(STORE_NAME).getAll();

    request.onsuccess = () =>
      resolve(request.result || []);

    request.onerror = () =>
      reject(request.error);
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (
      ch === '"' &&
      quoted &&
      next === '"'
    ) {
      cell += '"';
      i++;
      continue;
    }

    if (ch === '"') {
      quoted = !quoted;
      continue;
    }

    if (ch === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (
      (ch === "\n" || ch === "\r") &&
      !quoted
    ) {
      if (
        ch === "\r" &&
        next === "\n"
      ) {
        i++;
      }

      row.push(cell.trim());

      if (row.some(Boolean)) {
        rows.push(row);
      }

      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  row.push(cell.trim());

  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

function interpolate(template, record) {
  const values = {
    "{email}": record.email || "",
    "{store}": record.store || "",
    "{name}": record.name || "",
    "{company}":
      record.company ||
      record.store ||
      "",
    "{website}":
      record.website || "",
    "{phone}":
      record.phone || "",
  };

  let result = template;

  for (const [key, value] of Object.entries(values)) {
    result = result
      .split(key)
      .join(value);
  }

  return result;
}

function gmailComposeUrl(
  record,
  subjectTemplate,
  bodyTemplate
) {
  const subject =
    interpolate(
      subjectTemplate,
      record
    );

  const body =
    interpolate(
      bodyTemplate,
      record
    );

  return (
    "https://mail.google.com/mail/u/0/?" +
    "fs=1" +
    `&to=${encodeURIComponent(
      record.email
    )}` +
    `&su=${encodeURIComponent(
      subject
    )}` +
    `&body=${encodeURIComponent(
      body
    )}` +
    "&tf=cm"
  );
}

function mailtoUrl(
  record,
  subjectTemplate,
  bodyTemplate
) {
  const subject =
    interpolate(
      subjectTemplate,
      record
    );

  const body =
    interpolate(
      bodyTemplate,
      record
    );

  return (
    `mailto:${record.email}` +
    `?subject=${encodeURIComponent(
      subject
    )}` +
    `&body=${encodeURIComponent(
      body
    )}`
  );
}

function buildBatches(
  records,
  size
) {
  const batches = [];

  for (
    let i = 0;
    i < records.length;
    i += size
  ) {
    batches.push(
      records.slice(
        i,
        i + size
      )
    );
  }

  return batches;
}

function csvEscape(value) {
  const text =
    String(value ?? "");

  return `"${text.replaceAll(
    '"',
    '""'
  )}"`;
}

export default function Home() {
  const fileRef =
    useRef(null);

  const [fileName, setFileName] =
    useState("");

  const [csvText, setCsvText] =
    useState("");

  const [headers, setHeaders] =
    useState([]);

  const [rows, setRows] =
    useState([]);

  const [storeColumn, setStoreColumn] =
    useState("");

  const [emailColumn, setEmailColumn] =
    useState("");

  const [previewCount, setPreviewCount] =
    useState(10);

  const [subject, setSubject] =
    useState(
      "Special update for {store}"
    );

  const [body, setBody] =
    useState(
      `Hello,

We have an update for {store}.

Best regards,
Scoutool`
    );

  const [generated, setGenerated] =
    useState([]);

  const [start, setStart] =
    useState(1);

  const [end, setEnd] =
    useState(200);

  const [batchSize, setBatchSize] =
    useState(5);

  const [delay, setDelay] =
    useState(0);

  const [batchIndex, setBatchIndex] =
    useState(0);

  const [mode, setMode] =
    useState("csv");

  const [workspace, setWorkspace] =
    useState("batch");

  const [status, setStatus] =
    useState("Ready");

  const [selected, setSelected] =
    useState(null);

  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftStatus, setDraftStatus] = useState("Ready");
  const [draftCount, setDraftCount] = useState(0);
  const [draftTotal, setDraftTotal] = useState(0);
  const [draftStart, setDraftStart] = useState(1);
  const [draftEnd, setDraftEnd] = useState(100);
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [bridgeQueue, setBridgeQueue] = useState([]);
  const [bridgeState, setBridgeState] = useState({
    running: false,
    completed: 0,
    failed: 0,
    currentIndex: 0,
  });
  const [bridgeMessage, setBridgeMessage] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const saved =
          await loadRecords();

        if (!alive) return;

        setGenerated(saved);

        const settings =
          localStorage.getItem(
            SETTINGS_KEY
          );

        if (settings) {
          const data =
            JSON.parse(settings);

          setSubject(
            data.subject ??
              "Special update for {store}"
          );

          setBody(
            data.body ??
              `Hello,

We have an update for {store}.

Best regards,
Scoutool`
          );

          setPreviewCount(
            data.previewCount ?? 10
          );

          setStart(
            data.start ?? 1
          );

          setEnd(
            data.end ?? 200
          );

          setBatchSize(
            data.batchSize ?? 5
          );

          setDelay(
            data.delay ?? 0
          );

          setBatchIndex(
            data.batchIndex ?? 0
          );

          setDraftStart(data.draftStart ?? 1);

          setDraftEnd(data.draftEnd ?? 100);
        }

        if (saved.length) {
          setStatus(
            `Restored ${saved.length} generated links`
          );
        }
      } catch {
        setStatus(
          "Storage initialization failed"
        );
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

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

  async function refreshBridge() {
    try {
      const [queueResponse, stateResponse] = await Promise.all([
        fetch("/api/bridge/queue", { cache: "no-store" }),
        fetch("/api/bridge/state", { cache: "no-store" }),
      ]);
      if (!queueResponse.ok || !stateResponse.ok) throw new Error("Bridge API unavailable");
      const queueData = await queueResponse.json();
      const stateData = await stateResponse.json();
      setBridgeQueue(Array.isArray(queueData.items) ? queueData.items : []);
      setBridgeState(stateData.state || bridgeState);
      setBridgeOnline(true);
      setBridgeMessage("");
    } catch (error) {
      setBridgeOnline(false);
      setBridgeMessage(error.message);
    }
  }

  async function changeBridgeState(patch) {
    try {
      const response = await fetch("/api/bridge/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "State update failed");
      setBridgeState(data.state);
      setBridgeMessage("State updated.");
    } catch (error) {
      setBridgeMessage(error.message);
    }
  }

  async function createGmailDrafts(records = generated) {
    const rangeStart = Math.max(1, Number(draftStart) || 1);
    const rangeEnd = Math.max(rangeStart, Number(draftEnd) || rangeStart);
    const seen = new Set();
    const candidates = records.filter((record) => {
      const email = String(record.email || "").trim().toLowerCase();
      if (!email || !email.includes("@") || seen.has(email)) return false;
      seen.add(email);
      return true;
    }).slice(rangeStart - 1, rangeEnd);

    if (!candidates.length) {
      setDraftStatus("No valid records");
      setStatus("Generate valid email records first");
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
      setStatus(`Created ${created} unsent Gmail drafts`);
    } catch (error) {
      setDraftStatus("Draft creation failed");
      setStatus(error.message);
    } finally {
      setDraftBusy(false);
    }
  }

  useEffect(() => {
    const gmailResult = new URLSearchParams(window.location.search).get("gmail");
    if (gmailResult === "connected") {
      setStatus("Gmail connected successfully. Drafts are ready.");
      window.history.replaceState({}, "", "/");
    }
    refreshGmailStatus();
    refreshBridge();
    const gmailTimer = setInterval(refreshGmailStatus, 10000);
    const bridgeTimer = setInterval(refreshBridge, 3000);
    return () => {
      clearInterval(gmailTimer);
      clearInterval(bridgeTimer);
    };
  }, []);

  useEffect(() => {
    const timer =
      setTimeout(() => {
        saveRecords(
          generated
        ).catch(() => {
          setStatus(
            "Unable to save generated links"
          );
        });
      }, 250);

    return () =>
      clearTimeout(timer);
  }, [generated]);

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        subject,
        body,
        previewCount,
        start,
        end,
        batchSize,
        delay,
        batchIndex,
        draftStart,
        draftEnd,
      })
    );
  }, [
    subject,
    body,
    previewCount,
    start,
    end,
    batchSize,
    delay,
    batchIndex,
    draftStart,
    draftEnd,
  ]);

  const recordsInRange =
    useMemo(() => {
      return generated.filter(
        (_, index) => {
          const number =
            index + 1;

          return (
            number >= start &&
            number <= end
          );
        }
      );
    }, [
      generated,
      start,
      end,
    ]);

  const batches =
    useMemo(() => {
      return buildBatches(
        recordsInRange,
        batchSize
      );
    }, [
      recordsInRange,
      batchSize,
    ]);

  const currentBatch =
    batches[batchIndex] || [];

  const openedCount =
    generated.filter(
      (record) =>
        record.opened
    ).length;

  function selectFile() {
    fileRef.current?.click();
  }

  async function handleFile(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      const text =
        await file.text();

      const parsed =
        parseCsv(text);

      const firstRow =
        parsed[0] || [];

      setFileName(
        file.name
      );

      setCsvText(text);
      setHeaders(firstRow);
      setRows(
        parsed.slice(1)
      );

      const emailHeader =
        firstRow.find(
          (header) =>
            /email/i.test(
              header
            )
        );

      const storeHeader =
        firstRow.find(
          (header) =>
            /store|company|business/i.test(
              header
            )
        );

      setEmailColumn(
        emailHeader ||
          firstRow[0] ||
          ""
      );

      setStoreColumn(
        storeHeader ||
          firstRow[1] ||
          firstRow[0] ||
          ""
      );

      setStatus(
        `${Math.max(
          0,
          parsed.length - 1
        )} rows loaded`
      );
    } catch {
      setStatus(
        "Unable to read CSV file"
      );
    }
  }

  function generateLinks() {
    if (!headers.length) {
      setStatus(
        "Upload a CSV file first"
      );
      return;
    }

    const emailIndex =
      headers.indexOf(
        emailColumn
      );

    const storeIndex =
      headers.indexOf(
        storeColumn
      );

    if (emailIndex < 0) {
      setStatus(
        "Select an email column"
      );
      return;
    }

    const limitedRows =
      rows.slice(
        0,
        Math.max(
          1,
          Number(previewCount) ||
            1
        )
      );

    const generatedRows =
      limitedRows
        .map(
          (row, index) => {
            const email =
              (
                row[emailIndex] ||
                ""
              ).trim();

            const store =
              storeIndex >= 0
                ? (
                    row[
                      storeIndex
                    ] || ""
                  ).trim()
                : "";

            if (
              !email ||
              !email.includes("@")
            ) {
              return null;
            }

            const record = {
              id: crypto.randomUUID(),
              number:
                index + 1,
              email,
              store,
              name: store,
              company: store,
              website: "",
              phone: "",
              opened: false,
              draftStatus: "ready",
            };

            return {
              ...record,
              subject:
                interpolate(
                  subject,
                  record
                ),
              body:
                interpolate(
                  body,
                  record
                ),
              gmailUrl:
                gmailComposeUrl(
                  record,
                  subject,
                  body
                ),
              mailto:
                mailtoUrl(
                  record,
                  subject,
                  body
                ),
            };
          }
        )
        .filter(Boolean);

    setGenerated(
      generatedRows
    );

    setStart(1);

    setEnd(
      generatedRows.length
    );

    setBatchIndex(0);

    setSelected(
      generatedRows[0] ||
        null
    );

    setStatus(
      `Generated ${generatedRows.length} links`
    );
  }

  function prepareDraftQueue() {
    if (!generated.length) {
      setStatus("Generate links before preparing drafts");
      return;
    }

    const seen = new Set();
    const candidates = generated.filter((record) => {
      const email = record.email.toLowerCase();

      if (seen.has(email)) return false;

      seen.add(email);
      return true;
    });

    const preparedIds = new Set(
      candidates
        .slice(Math.max(0, (Number(draftStart) || 1) - 1), Math.max(0, Number(draftEnd) || 100))
        .map((record) => record.id)
    );

    setGenerated((previous) =>
      previous.map((record) =>
        preparedIds.has(record.id)
          ? { ...record, draftStatus: "prepared" }
          : record
      )
    );

    setStatus(
      `Prepared ${preparedIds.size} unsent drafts from records ${draftStart}-${draftEnd}. Mailbox connection is required to save them.`
    );
  }

  async function openNextBatch() {
    if (!currentBatch.length) {
      setStatus(
        "No batch available"
      );
      return;
    }

    /*
     * Keep the window.open calls within
     * the user's direct button action.
     * Browsers may still enforce popup
     * limits.
     */
    let count = 0;

    const openedIds = new Set();

    for (
      const item of currentBatch
    ) {
      if (item.opened) {
        continue;
      }

      const opened =
        window.open(
          item.gmailUrl,
          "_blank"
        );

      if (opened) {
        count++;
        openedIds.add(item.id);
      }

      if (
        delay > 0 &&
        item !==
          currentBatch[
            currentBatch.length - 1
          ]
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              delay * 1000
            )
        );
      }
    }

    setGenerated(
      (previous) =>
        previous.map(
          (item) =>
            openedIds.has(item.id)
              ? {
                  ...item,
                  opened: true,
                }
              : item
        )
    );

    setStatus(
      `Batch ${
        batchIndex + 1
      }: opened ${count}/${currentBatch.length}`
    );

    if (
      batchIndex <
      batches.length - 1
    ) {
      setBatchIndex(
        batchIndex + 1
      );
    }
  }

  function copyLink(record) {
    navigator.clipboard
      .writeText(
        record.gmailUrl
      )
      .then(() =>
        setStatus(
          `Gmail link copied for ${record.email}`
        )
      )
      .catch(() =>
        setStatus(
          "Clipboard access blocked"
        )
      );
  }

  function downloadCsv() {
    if (!generated.length) {
      return;
    }

    const header =
      [
        "number",
        "email",
        "store",
        "subject",
        "body",
        "gmailUrl",
        "mailto",
        "status",
      ];

    const lines = [
      header.join(","),
      ...generated.map(
        (record) =>
          [
            record.number,
            record.email,
            record.store,
            record.subject,
            record.body,
            record.gmailUrl,
            record.mailto,
            record.draftStatus === "prepared"
              ? "draft-ready"
              : record.opened
              ? "opened"
              : "ready",
          ]
            .map(csvEscape)
            .join(",")
      ),
    ];

    const blob =
      new Blob(
        [lines.join("\n")],
        {
          type:
            "text/csv;charset=utf-8",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;
    link.download =
      "scoutool-generated-links.csv";
    link.click();

    URL.revokeObjectURL(
      url
    );
  }

  function reset() {
    setGenerated([]);
    setRows([]);
    setHeaders([]);
    setCsvText("");
    setFileName("");
    setBatchIndex(0);
    setSelected(null);
    setStatus("Reset");
  }

  return (
    <main className="page">
      <header className="hero">
        <div className="brand">
          <div className="logo">
            S
          </div>

          <div>
            <h1>
              Scoutool
            </h1>

            <p>
              Smart Gmail Link Generator
              + Batch Launcher
            </p>
          </div>
        </div>

        <div className="liveStatus">
          {status}
        </div>
      </header>

      <section className={`accountBar ${gmailConnected ? "connected" : "needsConnection"}`}>
        <div>
          <strong>{gmailConnected ? "Google account connected" : "Connect a Google account"}</strong>
          <span>
            {gmailConnected
              ? `${gmailEmail} is ready to create unsent Gmail drafts.`
              : "Connect Gmail before creating drafts. Your messages will remain unsent."}
          </span>
        </div>
        <a href="/api/auth/google/start">
          {gmailConnected ? "Reconnect account" : "Connect Google account"}
        </a>
      </section>

      <section className="workspaceTabs">
        <button
          className={`workspaceTab ${workspace === "batch" ? "active" : ""}`}
          onClick={() => setWorkspace("batch")}
        >
          Batch Workspace
        </button>
        <button
          className={`workspaceTab ${workspace === "dashboard" ? "active" : ""}`}
          onClick={() => setWorkspace("dashboard")}
        >
          Scout Mail Dashboard
        </button>
      </section>

      <section className="draftRangeBar" aria-label="Draft record range">
        <div>
          <strong>Draft range</strong>
          <span>Select which loaded records to create or open manually.</span>
        </div>
        <label>
          From
          <input type="number" min="1" value={draftStart} onChange={(event) => setDraftStart(Number(event.target.value) || 1)} />
        </label>
        <label>
          Through
          <input type="number" min={draftStart} value={draftEnd} onChange={(event) => setDraftEnd(Number(event.target.value) || draftStart)} />
        </label>
        <span className="draftRangeExample">Example: 100–199</span>
      </section>

      {workspace === "batch" ? <>
      <section className="tabsTop">
        <button
          className={`tab ${mode === "csv" ? "active" : ""}`}
          onClick={() => setMode("csv")}
        >
          CSV Upload
        </button>

        <button
          className={`tab ${mode === "manual" ? "active" : ""}`}
          onClick={() => setMode("manual")}
        >
          Manual Entry
        </button>
      </section>

      {mode === "manual" ? (
        <section className="card">
          <h2>Manual Entry</h2>
          <p className="hint">
            Manual entry is not available yet. Switch back to CSV Upload to
            generate links.
          </p>
          <button
            className="secondary"
            onClick={() => setMode("csv")}
          >
            Use CSV Upload
          </button>
        </section>
      ) : null}

      {mode === "csv" ? <section className="generatorGrid">
        <div className="card">
          <h2>
            1. Upload CSV
          </h2>

          <p className="label">
            Select Your CSV File
          </p>

          <button
            className="fileBox"
            onClick={
              selectFile
            }
          >
            <span>
              Choose File
            </span>

            <span className="filename">
              {fileName ||
                "No file chosen"}
            </span>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={
              handleFile
            }
          />

          {rows.length > 0 ? (
            <div className="loaded">
              ✓{" "}
              {rows.length} rows loaded
            </div>
          ) : null}

          <p className="label">
            Store Column
          </p>

          <select
            value={storeColumn}
            onChange={(event) =>
              setStoreColumn(
                event.target.value
              )
            }
          >
            <option value="">
              Select store column
            </option>

            {headers.map(
              (header) => (
                <option
                  value={header}
                  key={header}
                >
                  {header}
                </option>
              )
            )}
          </select>

          <p className="label">
            Email Column
          </p>

          <select
            value={emailColumn}
            onChange={(event) =>
              setEmailColumn(
                event.target.value
              )
            }
          >
            <option value="">
              Select email column
            </option>

            {headers.map(
              (header) => (
                <option
                  value={header}
                  key={header}
                >
                  {header}
                </option>
              )
            )}
          </select>

          <p className="label">
            Preview Count
          </p>

          <input
            type="number"
            min="1"
            value={previewCount}
            onChange={(event) =>
              setPreviewCount(
                Math.max(
                  1,
                  Number(
                    event.target.value
                  ) || 1
                )
              )
            }
          />

          <p className="hint">
            Generate links for up to
            this many rows.
          </p>
        </div>

        <div className="card">
          <h2>
            2. Message
          </h2>

          <p className="label">
            Subject
          </p>

          <input
            value={subject}
            onChange={(event) =>
              setSubject(
                event.target.value
              )
            }
          />

          <p className="tokenHelp">
            Use{" "}
            <code>
              {"{store}"}
            </code>{" "}
            to insert the store name
          </p>

          <p className="label">
            Body
          </p>

          <textarea
            value={body}
            onChange={(event) =>
              setBody(
                event.target.value
              )
            }
            rows={11}
          />

          <p className="hint">
            Use {"{email}"},{" "}
            {"{store}"},{" "}
            {"{name}"},{" "}
            {"{company}"},{" "}
            {"{website}"},{" "}
            {"{phone}"}
          </p>
        </div>
      </section> : null}

      <section className="generatorActions">
        <button
          className="primary large"
          onClick={
            generateLinks
          }
        >
          Generate Links
        </button>

        <button
          className="secondary large"
          onClick={
            downloadCsv
          }
          disabled={
            !generated.length
          }
        >
          ↓ Download CSV
        </button>

        <button
          className="secondary large"
          onClick={
            prepareDraftQueue
          }
          disabled={!generated.length}
        >
          Prepare records {draftStart}-{draftEnd}
        </button>

        <button
          className="secondary large"
          onClick={reset}
        >
          Reset
        </button>
      </section>

      <section className="card generatedCard">
        <div className="sectionHeader">
          <div>
            <h2>
              3. Generated Links (
              {generated.length}
              )
            </h2>

            <p className="hint">
              Gmail compose links are
              generated from your
              message template.
            </p>
          </div>
        </div>

        <div className="generatedList">
          {generated.length === 0 ? (
            <div className="empty">
              Upload a CSV and click
              Generate Links.
            </div>
          ) : (
            generated.map(
                (record) => (
                  <div
                    className={
                      record.opened
                        ? "generatedRow opened"
                        : "generatedRow"
                    }
                    key={record.id}
                  >
                    <div className="recordNo">
                      #{record.number}
                    </div>

                    <div className="recordMain">
                      <strong>
                        {record.email}
                      </strong>

                      <span>
                        {record.store}
                      </span>

                      <small>
                        {record.subject}
                      </small>
                    </div>

                    <div className="rowActions">
                      <button
                        className="small"
                        onClick={() =>
                          setSelected(
                            record
                          )
                        }
                      >
                        Preview
                      </button>

                      <button
                        className="small"
                        onClick={() =>
                          copyLink(
                            record
                          )
                        }
                      >
                        Copy Link
                      </button>

                      <button
                        className="small"
                        onClick={() =>
                          window.open(
                            record.gmailUrl,
                            "_blank"
                          )
                        }
                      >
                        Open
                      </button>

                      <span
                        className={
                          record.draftStatus === "prepared" || record.opened
                            ? "openedText"
                            : "readyText"
                        }
                      >
                        {record.draftStatus === "prepared"
                          ? "Draft ready"
                          : record.opened
                          ? "Opened"
                          : "Ready"}
                      </span>
                    </div>
                  </div>
                )
              )
          )}
        </div>
      </section>

      <section className="card gmailPanel">
        <div className="sectionHeader">
          <div>
            <h2>Google account &amp; drafts</h2>
            <p className="hint">
              {gmailConnected
                ? `Connected as ${gmailEmail}. Create unsent drafts directly in Gmail.`
                : "Connect Gmail to create unsent drafts from generated records."}
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
          <button
            className="primary large"
            disabled={draftBusy || !gmailConnected || !generated.length}
            onClick={() => createGmailDrafts()}
          >
            {draftBusy ? "CREATING DRAFTS..." : `CREATE DRAFTS ${draftStart}-${draftEnd}`}
          </button>
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
      </section>

      <section className="card batchCard">
        <div className="sectionHeader">
          <div>
            <h2>
              4. Batch Launcher
            </h2>

          <p className="hint">
            Open the generated Gmail compose links in batches of five.
            </p>
          </div>
        </div>

        <div className="batchFields">
          <label>
            Start
            <input
              type="number"
              min="1"
              value={start}
              onChange={(event) =>
                setStart(
                  Math.max(
                    1,
                    Number(
                      event.target.value
                    ) || 1
                  )
                )
              }
            />
          </label>

          <label>
            End
            <input
              type="number"
              min={start}
              value={end}
              onChange={(event) =>
                setEnd(
                  Math.max(
                    start,
                    Number(
                      event.target.value
                    ) || start
                  )
                )
              }
            />
          </label>

          <label>
            Batch size
            <input
              type="number"
              min="1"
              max="20"
              value={batchSize}
              onChange={(event) =>
                setBatchSize(
                  Math.min(
                    20,
                    Math.max(
                      1,
                      Number(
                        event.target.value
                      ) || 1
                    )
                  )
                )
              }
            />
          </label>

          <label>
            Delay
            <input
              type="number"
              min="0"
              value={delay}
              onChange={(event) =>
                setDelay(
                  Math.max(
                    0,
                    Number(
                      event.target.value
                    ) || 0
                  )
                )
              }
            />
          </label>
        </div>

        <div className="batchSummary">
          <div>
            <span>
              Current
            </span>

            <strong>
              {currentBatch.length
                ? `#${currentBatch[0].number}–#${
                    currentBatch[
                      currentBatch.length - 1
                    ].number
                  }`
                : "—"}
            </strong>
          </div>

          <div>
            <span>
              Batch
            </span>

            <strong>
              {batches.length
                ? `${batchIndex + 1}/${batches.length}`
                : "0/0"}
            </strong>
          </div>

          <div>
            <span>
              Opened
            </span>

            <strong>
              {openedCount}
            </strong>
          </div>

          <div>
            <span>
              Remaining
            </span>

            <strong>
              {Math.max(
                0,
                generated.length -
                  openedCount
              )}
            </strong>
          </div>
        </div>

        <button
          className="primary batchButton"
          disabled={
            !currentBatch.length
          }
          onClick={
            openNextBatch
          }
        >
          OPEN NEXT BATCH (
          {Math.min(
            batchSize,
            20
          )}
          )
        </button>
      </section>

      {selected ? (
        <section className="card previewCard">
          <div className="sectionHeader">
            <h2>
              Message Preview
            </h2>

            <button
              className="secondary"
              onClick={() =>
                setSelected(null)
              }
            >
              Close
            </button>
          </div>

          <label>
            To
            <input
              readOnly
              value={
                selected.email
              }
            />
          </label>

          <label>
            Subject
            <input
              readOnly
              value={
                selected.subject
              }
            />
          </label>

          <label>
            Gmail compose link
            <input
              readOnly
              value={
                selected.gmailUrl
              }
            />
          </label>

          <label>
            Message
            <textarea
              readOnly
              rows={10}
              value={
                selected.body
              }
            />
          </label>

          <div className="actions">
            <button
              className="primary"
              onClick={() =>
                copyLink(
                  selected
                )
              }
            >
              COPY GMAIL LINK
            </button>

            <button
              className="secondary"
              onClick={() =>
                window.open(
                  selected.gmailUrl,
                  "_blank"
                )
              }
            >
              OPEN IN GMAIL
            </button>
          </div>
        </section>
      ) : null}

      </> : (
        <section className="dashboardWorkspace">
          <section className="card dashboardHeader">
            <div>
              <h2>Scout Mail automation</h2>
              <p className="hint">Monitor the shared queue, control the bridge, and create Gmail drafts from this same batch URL.</p>
            </div>
            <span className={`connectionBadge ${bridgeOnline ? "connected" : "disconnected"}`}>
              <span className="dot" />
              {bridgeOnline ? "API connected" : "API offline"}
            </span>
          </section>

          <section className="dashboardStats">
            <div className="card"><span>Queued</span><strong>{bridgeQueue.length}</strong></div>
            <div className="card"><span>Completed</span><strong>{bridgeState.completed}</strong></div>
            <div className="card"><span>Failed</span><strong>{bridgeState.failed}</strong></div>
            <div className="card"><span>Remaining</span><strong>{Math.max(0, bridgeQueue.length - bridgeState.completed - bridgeState.failed)}</strong></div>
          </section>

          <section className="card">
            <div className="sectionHeader">
              <h2>Gmail Draft Automation</h2>
              <span className={`connectionBadge ${gmailConnected ? "connected" : "disconnected"}`}>
                {gmailConnected ? gmailEmail : "Not connected"}
              </span>
            </div>
            <p className="hint">{gmailConnected ? "Your Google account is ready for unsent drafts." : "Connect Gmail to create drafts from the shared queue."}</p>
            <div className="gmailActions">
              <a className="secondary large" href="/api/auth/google/start">{gmailConnected ? "Reconnect Gmail" : "Connect Gmail"}</a>
              <button
                className="primary large"
                disabled={draftBusy || !gmailConnected || !bridgeQueue.length}
                onClick={() => createGmailDrafts(bridgeQueue)}
              >
                {draftBusy ? "CREATING DRAFTS..." : `CREATE DRAFTS ${draftStart}-${draftEnd}`}
              </button>
            </div>
            <div className="draftProgressHeader"><span>{draftStatus}</span><strong>{draftCount}/{draftTotal || 0}</strong></div>
            <div className="progressTrack"><div className={`progressBar ${draftBusy ? "indeterminate" : ""}`} style={{ width: draftTotal ? `${Math.min(100, (draftCount / draftTotal) * 100)}%` : "0%" }} /></div>
          </section>

          <section className="controls">
            <button disabled={!bridgeOnline || bridgeState.running} onClick={() => changeBridgeState({ running: true })}>START</button>
            <button className="stop" disabled={!bridgeState.running} onClick={() => changeBridgeState({ running: false })}>STOP</button>
            <button onClick={refreshBridge}>REFRESH</button>
          </section>

          <section className="card">
            <div className="sectionHeader"><h2>Live Queue</h2><span>{bridgeQueue.length} items</span></div>
            {bridgeQueue.length === 0 ? <div className="empty">No queue has been received yet.</div> : (
              <div className="queue">
                {bridgeQueue.map((item, index) => (
                  <div className="queueRow" key={`${item.email}-${index}`}>
                    <span>#{index + 1}</span>
                    <div><strong>{item.email}</strong>{item.subject ? <small>{item.subject}</small> : null}</div>
                    {item.gmailUrl ? <a href={item.gmailUrl} target="_blank" rel="noreferrer">Gmail</a> : <span>-</span>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h2>Activity</h2>
            <p>Status: <strong>{bridgeState.running ? "Running" : "Stopped"}</strong></p>
            <p>Current item: <strong>{bridgeState.currentIndex + 1}</strong></p>
            <p>{bridgeMessage || "Waiting for bridge data."}</p>
          </section>
        </section>
      )}

      <footer>
        Scoutool Batch · generated
        messages and links stay in
        this browser.
      </footer>
    </main>
  );
}

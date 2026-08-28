// ==UserScript==
// @name         Scout Mail Automatic Bridge
// @namespace    scout-mail
// @version      2.0.0
// @description  Automatically sends the visible Scoutool queue to Scout Mail.
// @match        https://scoutool-mail.created.app/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      scoutool-lilac.vercel.app
// ==/UserScript==

(() => {
  "use strict";

  const API =
    "https://scoutool-lilac.vercel.app/api/bridge/queue";

  function extractQueue() {
    const results = [];
    const seen = new Set();

    for (const element of document.querySelectorAll("a, button")) {
      const text = (
        element.innerText ||
        element.textContent ||
        ""
      ).trim().toLowerCase();

      if (!text.includes("gmail")) continue;

      const gmailUrl =
        element.href ||
        element.closest("a")?.href ||
        "";

      const container =
        element.closest("div[class]") ||
        element.parentElement;

      const containerText = container?.innerText || "";

      const match = containerText.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
      );

      if (!match) continue;

      const email = match[0].trim().toLowerCase();

      if (seen.has(email)) continue;
      seen.add(email);

      results.push({
        email,
        gmailUrl,
        subject: "",
        body: ""
      });
    }

    return results;
  }

  function sendQueue(items) {
    GM_xmlhttpRequest({
      method: "POST",
      url: API,
      headers: {
        "Content-Type": "application/json"
      },
      data: JSON.stringify({
        items
      }),
      onload(response) {
        try {
          const data = JSON.parse(response.responseText);

          console.log(
            "[Scout Mail] Synced:",
            data.count,
            "items"
          );
        } catch {
          console.error(
            "[Scout Mail] Invalid API response."
          );
        }
      },
      onerror(error) {
        console.error(
          "[Scout Mail] Bridge error:",
          error
        );
      }
    });
  }

  function scan() {
    const items = extractQueue();

    if (!items.length) {
      console.log(
        "[Scout Mail] No visible Gmail queue items."
      );
      return;
    }

    sendQueue(items);
  }

  scan();

  setInterval(scan, 5000);

  const observer = new MutationObserver(() => {
    clearTimeout(observer.timer);

    observer.timer = setTimeout(scan, 1000);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  console.log(
    "[Scout Mail] Automatic bridge active."
  );
})();

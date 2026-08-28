// ==UserScript==
// @name         Scout Mail Browser Bridge
// @namespace    scout-mail
// @version      1.0.0
// @description  Reads visible Scoutool Gmail queue links and makes them easy to hand off to the Scout Mail web app.
// @match        https://scoutool-mail.created.app/*
// @match        https://mail.google.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
  'use strict';

  const KEY = 'scout_mail_queue';

  function scanScoutool() {
    const items = [];
    for (const el of document.querySelectorAll('a,button')) {
      const text = (el.innerText || el.textContent || '').trim().toLowerCase();
      if (!text.includes('gmail')) continue;
      const href = el.href || el.closest('a')?.href || '';
      if (!href) continue;
      const container = el.closest('div');
      const raw = container?.innerText || '';
      const match = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      if (!match) continue;
      items.push({ email: match[0], gmailUrl: href, subject: '', body: '' });
    }
    GM_setValue(KEY, JSON.stringify(items));
    alert(`Scout Mail: ${items.length} visible Gmail queue item(s) captured.`);
  }

  function showQueue() {
    let items = [];
    try { items = JSON.parse(GM_getValue(KEY, '[]')); } catch {}
    const text = items.map((x, i) => `${i + 1}. ${x.email} — ${x.gmailUrl}`).join('\n');
    alert(items.length ? `Scout Mail queue:\n\n${text.slice(0, 5000)}` : 'Scout Mail queue is empty.');
  }

  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483647;background:#fff;border:1px solid #dce8e5;border-radius:12px;padding:9px;box-shadow:0 8px 28px rgba(0,0,0,.18);font:12px Arial;color:#163e38';
  box.innerHTML = `<strong style="display:block;margin-bottom:6px">Scout Mail</strong>`;

  const scan = document.createElement('button');
  scan.textContent = 'Scan Scoutool';
  scan.style.cssText = 'margin-right:6px;border:0;border-radius:7px;padding:7px 9px;background:#147c70;color:white;cursor:pointer';
  scan.onclick = scanScoutool;

  const view = document.createElement('button');
  view.textContent = 'View Queue';
  view.style.cssText = 'border:0;border-radius:7px;padding:7px 9px;background:#edf4f1;color:#163e38;cursor:pointer';
  view.onclick = showQueue;

  box.append(scan, view);
  document.documentElement.appendChild(box);
})();

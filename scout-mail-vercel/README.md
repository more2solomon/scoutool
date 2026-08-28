# Scout Mail — Vercel Web App

This is the Vercel-ready web version of the Scout Mail project.

## What it does

- Installable web/PWA-style control panel.
- Per-user Scoutool URL setting, defaulting to `https://scoutool-mail.created.app/`.
- Configurable delay with a 6-second minimum.
- Queue dashboard with completed/failed/remaining counters.
- Manual JSON queue import.
- Server-side Groq route using `GROQ_API_KEY`.
- Health endpoint at `/api/health`.
- Includes a browser userscript bridge for reading visible Scoutool Gmail links.

## Important browser limitation

A website hosted on Vercel cannot directly manipulate an unrelated Gmail tab the way a Chrome extension content script can. This project therefore separates the web control panel from the browser bridge.

The supplied userscript can read the visible Scoutool queue and help hand it off to the web app. Gmail send remains user-confirmed in this web-only build.

## Local development (PowerShell)

```powershell
cd "$env:USERPROFILE\Desktop\ScoutMailWeb"
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Vercel deployment

Option A — Vercel CLI:

```powershell
npm install -g vercel
vercel login
cd "$env:USERPROFILE\Desktop\ScoutMailWeb"
vercel
```

After the preview is working:

```powershell
vercel --prod
```

Option B — GitHub + Vercel dashboard:

1. Put this folder in a GitHub repository.
2. In Vercel, choose Add New → Project.
3. Import the repository.
4. Leave the framework as Next.js and deploy.

## Groq environment variable

In Vercel: Project → Settings → Environment Variables.

Add:

`GROQ_API_KEY` = your Groq API key

Use Production (and Preview if you need previews). Redeploy after adding/changing environment variables.

Do not use `NEXT_PUBLIC_GROQ_API_KEY`; client-exposed variables are bundled into browser JavaScript.

## Userscript bridge

Install a browser userscript manager such as Tampermonkey, then install:

`/scout-mail-bridge.user.js`

Open Scoutool and click **Scan Scoutool**. The script captures visible Gmail links and stores them locally in the userscript manager.

## Production architecture

For a true extension-equivalent experience, keep this Vercel app as the control plane and add a local browser agent (Electron/Tauri or a browser userscript) for page-level browser interaction. The web app alone cannot cross the browser security boundary into Gmail tabs.

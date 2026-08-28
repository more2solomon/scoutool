const {
  app,
  BrowserWindow,
  ipcMain
} = require("electron");

const fs = require("fs");
const path = require("path");

const SCOUTOOL_URL = "https://scoutool-mail.created.app/";

const MAX_ACCOUNTS = 7;

let controlWindow = null;
let scoutWindow = null;

const mailWindows = new Map();

function accountsFile() {
  return path.join(
    app.getPath("userData"),
    "accounts.json"
  );
}

function loadAccounts() {
  try {
    if (!fs.existsSync(accountsFile())) return [];

    const accounts = JSON.parse(
      fs.readFileSync(accountsFile(), "utf8")
    );

    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  fs.mkdirSync(
    path.dirname(accountsFile()),
    { recursive: true }
  );

  fs.writeFileSync(
    accountsFile(),
    JSON.stringify(accounts, null, 2),
    "utf8"
  );
}

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 700,
    height: 600,
    minWidth: 600,
    minHeight: 500,
    title: "Scout Mail",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  controlWindow.loadFile(
    path.join(__dirname, "renderer", "index.html")
  );

  controlWindow.on("closed", () => {
    controlWindow = null;
  });

  controlWindow.webContents.once(
    "did-finish-load",
    () => sendAccounts()
  );
}

function openScoutool() {
  if (scoutWindow && !scoutWindow.isDestroyed()) {
    scoutWindow.focus();
    return;
  }

  scoutWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Scout Mail - Scoutool",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  scoutWindow.loadURL(SCOUTOOL_URL);

  scoutWindow.on("closed", () => {
    scoutWindow = null;
  });
}

function providerUrl(provider) {
  switch (provider) {
    case "outlook":
      return "https://outlook.live.com/mail/";
    case "gmail":
    default:
      return "https://mail.google.com/";
  }
}

function openMailAccount(account) {
  if (
    mailWindows.has(account.id) &&
    !mailWindows.get(account.id).isDestroyed()
  ) {
    mailWindows.get(account.id).focus();
    return;
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 850,
    title: `Scout Mail - ${account.name}`,
    webPreferences: {
      partition: `persist:${account.partition}`,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL(providerUrl(account.provider));

  mailWindows.set(account.id, win);

  win.on("closed", () => {
    mailWindows.delete(account.id);
  });
}

function sendAccounts() {
  if (!controlWindow || controlWindow.isDestroyed()) {
    return;
  }

  controlWindow.webContents.send(
    "accounts-updated",
    loadAccounts()
  );
}

ipcMain.handle(
  "get-accounts",
  () => loadAccounts()
);

ipcMain.handle(
  "add-account",
  (event, data) => {
    const accounts = loadAccounts();

    if (accounts.length >= MAX_ACCOUNTS) {
      throw new Error(
        `Maximum of ${MAX_ACCOUNTS} accounts reached.`
      );
    }

    const provider =
      data.provider === "outlook"
        ? "outlook"
        : "gmail";

    const id =
      `${provider}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    const account = {
      id,
      name:
        String(data.name || "").trim() ||
        `${provider} ${accounts.length + 1}`,
      provider,
      partition: id,
      createdAt: new Date().toISOString()
    };

    accounts.push(account);
    saveAccounts(accounts);

    openMailAccount(account);
    sendAccounts();

    return account;
  }
);

ipcMain.handle(
  "open-account",
  (event, id) => {
    const account =
      loadAccounts().find(
        (item) => item.id === id
      );

    if (!account) {
      throw new Error("Account not found.");
    }

    openMailAccount(account);
    return true;
  }
);

ipcMain.handle(
  "open-all-accounts",
  () => {
    const accounts = loadAccounts();

    accounts.forEach(openMailAccount);

    return accounts.length;
  }
);

ipcMain.handle(
  "open-scoutool",
  () => {
    openScoutool();
    return true;
  }
);

ipcMain.handle(
  "close-all-mail",
  () => {
    for (const win of mailWindows.values()) {
      if (!win.isDestroyed()) {
        win.close();
      }
    }

    mailWindows.clear();

    return true;
  }
);

app.whenReady().then(() => {
  createControlWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createControlWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  dialog
} = require("electron");

const { autoUpdater } = require("electron-updater");

const fs = require("fs");
const path = require("path");

const SCOUTOOL_URL =
  "https://scoutool-mail.created.app/";

const API_URL =
  "https://scoutool-lilac.vercel.app";

let mainWindow = null;
let scoutView = null;

const mailViews = new Map();

let pairingTimer = null;

function accountsPath() {
  return path.join(
    app.getPath("userData"),
    "accounts.json"
  );
}

function devicePath() {
  return path.join(
    app.getPath("userData"),
    "device.json"
  );
}

function loadDevice() {
  try {
    if (!fs.existsSync(devicePath())) {
      return null;
    }

    return JSON.parse(
      fs.readFileSync(
        devicePath(),
        "utf8"
      )
    );
  } catch {
    return null;
  }
}

function saveDevice(device) {
  fs.mkdirSync(
    path.dirname(devicePath()),
    { recursive: true }
  );

  fs.writeFileSync(
    devicePath(),
    JSON.stringify(device, null, 2),
    "utf8"
  );
}

function loadAccounts() {
  try {
    if (!fs.existsSync(accountsPath())) {
      return [];
    }

    const value = JSON.parse(
      fs.readFileSync(accountsPath(), "utf8")
    );

    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  fs.mkdirSync(
    path.dirname(accountsPath()),
    { recursive: true }
  );

  fs.writeFileSync(
    accountsPath(),
    JSON.stringify(accounts, null, 2),
    "utf8"
  );
}

function layoutViews() {
  if (!mainWindow || !scoutView) {
    return;
  }

  const bounds =
    mainWindow.getContentBounds();

  const headerHeight = 140;
  const gap = 8;

  const width =
    Math.floor(
      (bounds.width - gap) / 2
    );

  const height =
    Math.max(
      300,
      bounds.height - headerHeight
    );

  scoutView.setBounds({
    x: 0,
    y: headerHeight,
    width,
    height
  });

  scoutView.setAutoResize({
    width: true,
    height: true
  });

  for (const view of mailViews.values()) {
    view.setBounds({
      x: width + gap,
      y: headerHeight,
      width:
        bounds.width - width - gap,
      height
    });

    view.setAutoResize({
      width: true,
      height: true
    });
  }
}

function createScoutoolView() {
  scoutView = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.addBrowserView(
    scoutView
  );

  scoutView.webContents.loadURL(
    SCOUTOOL_URL
  );
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
    mailViews.has(account.id) &&
    !mailViews
      .get(account.id)
      .isDestroyed()
  ) {
    mailViews
      .get(account.id)
      .focus();

    return;
  }

  const view = new BrowserView({
    webPreferences: {
      partition:
        `persist:${account.partition}`,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mailViews.set(
    account.id,
    view
  );

  mainWindow.addBrowserView(
    view
  );

  view.webContents.loadURL(
    providerUrl(account.provider)
  );

  layoutViews();
}


function startPairingMonitor(pairingId) {
  if (pairingTimer) {
    clearInterval(pairingTimer);
  }

  pairingTimer = setInterval(async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/pair/status?pairingId=${encodeURIComponent(pairingId)}`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.status !== "paired") {
        return;
      }

      const device = {
        userId: data.userId,
        deviceId: data.deviceId,
        desktopToken: data.desktopToken,
        pairedAt: new Date().toISOString()
      };

      saveDevice(device);

      clearInterval(pairingTimer);
      pairingTimer = null;

      mainWindow?.webContents.send(
        "device-paired",
        device
      );
    } catch (error) {
      console.error(
        "Pairing monitor error:",
        error
      );
    }
  }, 2000);
}

function sendAccounts() {
  if (
    !mainWindow ||
    mainWindow.isDestroyed()
  ) {
    return;
  }

  mainWindow.webContents.send(
    "accounts-updated",
    loadAccounts()
  );
}

function createControlWindow() {
  mainWindow =
    new BrowserWindow({
      width: 1500,
      height: 920,
      minWidth: 1100,
      minHeight: 700,
      title: "Scout Mail",

      webPreferences: {
        preload: path.join(
          __dirname,
          "preload.js"
        ),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

  mainWindow.loadFile(
    path.join(
      __dirname,
      "renderer",
      "index.html"
    )
  );

  mainWindow.on(
    "resize",
    layoutViews
  );

  mainWindow.webContents.once(
    "did-finish-load",
    () => {
      createScoutoolView();
      layoutViews();
      sendAccounts();

      const accounts =
        loadAccounts();

      for (const account of accounts) {
        openMailAccount(account);
      }

      layoutViews();
    }
  );
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on(
    "checking-for-update",
    () => {
      mainWindow?.webContents.send(
        "update-status",
        {
          status: "checking"
        }
      );
    }
  );

  autoUpdater.on(
    "update-available",
    (info) => {
      mainWindow?.webContents.send(
        "update-status",
        {
          status: "available",
          version: info.version
        }
      );
    }
  );

  autoUpdater.on(
    "update-not-available",
    () => {
      mainWindow?.webContents.send(
        "update-status",
        {
          status: "current"
        }
      );
    }
  );

  autoUpdater.on(
    "download-progress",
    (progress) => {
      mainWindow?.webContents.send(
        "update-status",
        {
          status: "downloading",
          percent:
            Math.round(
              progress.percent
            )
        }
      );
    }
  );

  autoUpdater.on(
    "update-downloaded",
    (info) => {
      mainWindow?.webContents.send(
        "update-status",
        {
          status: "downloaded",
          version: info.version
        }
      );

      dialog
        .showMessageBox({
          type: "info",
          buttons: [
            "Restart now",
            "Later"
          ],
          title:
            "Scout Mail update ready",
          message:
            `Scout Mail ${info.version} is ready to install.`,
          detail:
            "Restart Scout Mail to apply the update."
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall(
              false,
              true
            );
          }
        });
    }
  );

  autoUpdater.on(
    "error",
    (error) => {
      console.error(
        "Auto-update error:",
        error
      );

      mainWindow?.webContents.send(
        "update-status",
        {
          status: "error",
          message: error.message
        }
      );
    }
  );

  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 5000);
  }
}

ipcMain.handle(
  "get-accounts",
  () => loadAccounts()
);

ipcMain.handle(
  "add-account",
  (event, data) => {
    const accounts =
      loadAccounts();

    if (accounts.length >= 50) {
      throw new Error(
        "Maximum of 50 linked mail accounts."
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
      createdAt:
        new Date().toISOString()
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
  (event, accountId) => {
    const account =
      loadAccounts().find(
        (item) =>
          item.id === accountId
      );

    if (!account) {
      throw new Error(
        "Account not found."
      );
    }

    openMailAccount(account);

    return true;
  }
);

ipcMain.handle(
  "open-all-accounts",
  () => {
    const accounts =
      loadAccounts();

    for (const account of accounts) {
      openMailAccount(account);
    }

    return accounts.length;
  }
);

ipcMain.handle(
  "open-scoutool",
  () => {
    if (
      scoutView &&
      !scoutView
        .webContents
        .isDestroyed()
    ) {
      scoutView.webContents.loadURL(
        SCOUTOOL_URL
      );

      return true;
    }

    return false;
  }
);

ipcMain.handle(
  "check-for-updates",
  async () => {
    if (!app.isPackaged) {
      return {
        ok: false,
        message:
          "Updates are only checked in packaged builds."
      };
    }

    await autoUpdater.checkForUpdates();

    return {
      ok: true
    };
  }
);


ipcMain.handle(
  "start-pairing",
  async () => {
    const response = await fetch(
      `${API_URL}/api/pair/start`,
      {
        method: "POST"
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Unable to create pairing code."
      );
    }

    startPairingMonitor(data.pairingId);

    return data;
  }
);

ipcMain.handle(
  "get-device",
  () => loadDevice()
);

ipcMain.handle(
  "save-paired-device",
  (event, device) => {
    saveDevice(device);
    return true;
  }
);

ipcMain.handle(
  "sync-accounts",
  async () => {
    const device =
      loadDevice();

    if (!device?.desktopToken) {
      return {
        ok: false,
        accounts: []
      };
    }

    const response =
      await fetch(
        `${API_URL}/api/accounts`,
        {
          headers: {
            Authorization:
              `Bearer ${device.desktopToken}`
          }
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Account sync failed."
      );
    }

    saveAccounts(
      data.accounts || []
    );

    return data;
  }
);

app.whenReady().then(() => {
  createControlWindow();
  setupAutoUpdater();

  app.on(
    "activate",
    () => {
      if (
        BrowserWindow
          .getAllWindows()
          .length === 0
      ) {
        createControlWindow();
      }
    }
  );
});

app.on(
  "window-all-closed",
  () => {
    if (
      process.platform !==
      "darwin"
    ) {
      app.quit();
    }
  }
);

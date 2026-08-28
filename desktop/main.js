const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain
} = require("electron");

const fs = require("fs");
const path = require("path");

const SCOUTOOL_URL =
  "https://scoutool-mail.created.app/";

const MAIL_URL =
  "https://mail.google.com/";

let mainWindow = null;
let scoutView = null;

const mailViews = new Map();

function accountsPath() {
  return path.join(
    app.getPath("userData"),
    "gmail-accounts.json"
  );
}

function loadAccounts() {
  try {
    if (!fs.existsSync(accountsPath())) {
      return [];
    }

    const data = JSON.parse(
      fs.readFileSync(accountsPath(), "utf8")
    );

    return Array.isArray(data) ? data : [];
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

  const browserWidth =
    Math.floor(
      (bounds.width - gap) / 2
    );

  const browserHeight =
    Math.max(
      300,
      bounds.height - headerHeight
    );

  scoutView.setBounds({
    x: 0,
    y: headerHeight,
    width: browserWidth,
    height: browserHeight
  });

  scoutView.setAutoResize({
    width: true,
    height: true
  });

  for (const view of mailViews.values()) {
    view.setBounds({
      x: browserWidth + gap,
      y: headerHeight,
      width:
        bounds.width -
        browserWidth -
        gap,
      height: browserHeight
    });

    view.setAutoResize({
      width: true,
      height: true
    });
  }
}

function sendAccountList() {
  if (!mainWindow) {
    return;
  }

  const accounts = loadAccounts();

  mainWindow.webContents.send(
    "accounts-updated",
    accounts
  );
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

function createMailView(account) {
  if (!account) {
    throw new Error(
      "Account not found."
    );
  }

  const existing =
    mailViews.get(account.id);

  if (existing) {
    existing.webContents.loadURL(
      MAIL_URL
    );

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
    MAIL_URL
  );

  layoutViews();
}

function hideMailViews() {
  for (const view of mailViews.values()) {
    mainWindow.removeBrowserView(
      view
    );
  }
}

function showMailView(accountId) {
  const view =
    mailViews.get(accountId);

  if (!view) {
    return false;
  }

  hideMailViews();

  mainWindow.addBrowserView(
    view
  );

  layoutViews();

  return true;
}

function createWindow() {
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
      sendAccountList();

      const accounts =
        loadAccounts();

      if (accounts.length > 0) {
        createMailView(
          accounts[0]
        );

        showMailView(
          accounts[0].id
        );
      }
    }
  );
}

app.whenReady().then(() => {
  ipcMain.handle(
    "get-accounts",
    () => loadAccounts()
  );

  ipcMain.handle(
    "add-gmail-account",
    (event, name) => {
      const accounts =
        loadAccounts();

      const id =
        `gmail-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

      const account = {
        id,
        name:
          String(name || "").trim() ||
          `Gmail ${accounts.length + 1}`,
        provider: "gmail",
        partition: id,
        createdAt:
          new Date().toISOString()
      };

      accounts.push(account);

      saveAccounts(accounts);

      createMailView(account);

      showMailView(account.id);

      sendAccountList();

      return account;
    }
  );

  ipcMain.handle(
    "select-account",
    (event, accountId) => {
      const accounts =
        loadAccounts();

      const account =
        accounts.find(
          (item) =>
            item.id === accountId
        );

      if (!account) {
        throw new Error(
          "Account not found."
        );
      }

      if (!mailViews.has(account.id)) {
        createMailView(account);
      }

      return showMailView(
        account.id
      );
    }
  );

  ipcMain.handle(
    "reload-scoutool",
    async () => {
      if (!scoutView) {
        return false;
      }

      await scoutView.webContents.reload();

      return true;
    }
  );

  ipcMain.handle(
    "reload-mail",
    async () => {
      for (const view of mailViews.values()) {
        if (
          view ===
          mainWindow.getBrowserViews()
            .find(
              (candidate) =>
                candidate === view
            )
        ) {
          await view.webContents.reload();
          return true;
        }
      }

      return false;
    }
  );

  createWindow();
});

app.on(
  "window-all-closed",
  () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  }
);

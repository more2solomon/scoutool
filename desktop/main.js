const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  session
} = require("electron");

const path = require("path");

const SCOUTOOL_URL =
  "https://scoutool-mail.created.app/";

const MAIL_URL =
  "https://mail.google.com/";

let mainWindow;
let scoutView;
let mailView;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Scout Mail",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(
    path.join(__dirname, "renderer", "index.html")
  );

  mainWindow.on("resize", layoutViews);

  mainWindow.webContents.on("did-finish-load", () => {
    createBrowserViews();
  });
}

function createBrowserViews() {
  scoutView = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mailView = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setBrowserView(scoutView);
  mainWindow.addBrowserView(mailView);

  scoutView.webContents.loadURL(SCOUTOOL_URL);
  mailView.webContents.loadURL(MAIL_URL);

  layoutViews();
}

function layoutViews() {
  if (!mainWindow || !scoutView || !mailView) return;

  const bounds = mainWindow.getContentBounds();

  const headerHeight = 86;
  const gap = 8;
  const availableHeight = bounds.height - headerHeight;
  const leftWidth = Math.floor(
    (bounds.width - gap) / 2
  );

  scoutView.setBounds({
    x: 0,
    y: headerHeight,
    width: leftWidth,
    height: availableHeight
  });

  mailView.setBounds({
    x: leftWidth + gap,
    y: headerHeight,
    width: bounds.width - leftWidth - gap,
    height: availableHeight
  });

  scoutView.setAutoResize({
    width: true,
    height: true
  });

  mailView.setAutoResize({
    width: true,
    height: true
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      callback(false);
    }
  );

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.handle("reload-scoutool", async () => {
  if (scoutView) {
    await scoutView.webContents.reload();
    return true;
  }

  return false;
});

ipcMain.handle("reload-mail", async () => {
  if (mailView) {
    await mailView.webContents.reload();
    return true;
  }

  return false;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

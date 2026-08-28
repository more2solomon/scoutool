const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("scoutMail", {
  reloadScoutool: () =>
    ipcRenderer.invoke("reload-scoutool"),

  reloadMail: () =>
    ipcRenderer.invoke("reload-mail")
});

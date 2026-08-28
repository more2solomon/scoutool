const {
  contextBridge,
  ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
  "scoutMail",
  {
    getAccounts: () =>
      ipcRenderer.invoke(
        "get-accounts"
      ),

    addAccount: (data) =>
      ipcRenderer.invoke(
        "add-account",
        data
      ),

    openAccount: (id) =>
      ipcRenderer.invoke(
        "open-account",
        id
      ),

    openAllAccounts: () =>
      ipcRenderer.invoke(
        "open-all-accounts"
      ),

    openScoutool: () =>
      ipcRenderer.invoke(
        "open-scoutool"
      ),

    checkForUpdates: () =>
      ipcRenderer.invoke(
        "check-for-updates"
      ),

    onUpdateStatus: (callback) => {
      const handler = (
        event,
        status
      ) => callback(status);

      ipcRenderer.on(
        "update-status",
        handler
      );

      return () =>
        ipcRenderer.removeListener(
          "update-status",
          handler
        );
    },

    closeAllMail: () =>
      ipcRenderer.invoke(
        "close-all-mail"
      )
  }
);

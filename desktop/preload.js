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

    startPairing: () =>
      ipcRenderer.invoke(
        "start-pairing"
      ),

    getDevice: () =>
      ipcRenderer.invoke(
        "get-device"
      ),

    savePairedDevice: (device) =>
      ipcRenderer.invoke(
        "save-paired-device",
        device
      ),

    syncAccounts: () =>
      ipcRenderer.invoke(
        "sync-accounts"
      ),

    onAccountsUpdated: (
      callback
    ) => {
      const handler =
        (event, accounts) =>
          callback(accounts);

      ipcRenderer.on(
        "accounts-updated",
        handler
      );

      return () =>
        ipcRenderer.removeListener(
          "accounts-updated",
          handler
        );
    }
  }
);

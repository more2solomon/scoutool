const {
  contextBridge,
  ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
  "scoutMail",
  {
    getAccounts: () =>
      ipcRenderer.invoke("get-accounts"),

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

    closeAllMail: () =>
      ipcRenderer.invoke(
        "close-all-mail"
      ),

    onAccountsUpdated: (callback) => {
      const handler = (
        event,
        accounts
      ) => callback(accounts);

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

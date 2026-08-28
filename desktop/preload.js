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

    addGmailAccount: (name) =>
      ipcRenderer.invoke(
        "add-gmail-account",
        name
      ),

    selectAccount: (id) =>
      ipcRenderer.invoke(
        "select-account",
        id
      ),

    reloadScoutool: () =>
      ipcRenderer.invoke(
        "reload-scoutool"
      ),

    reloadMail: () =>
      ipcRenderer.invoke(
        "reload-mail"
      ),

    onAccountsUpdated: (
      callback
    ) => {
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

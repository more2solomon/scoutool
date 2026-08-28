const accounts =
  document.getElementById(
    "accounts"
  );

function renderAccounts(list) {
  accounts.innerHTML = "";

  list.forEach((account) => {
    const button =
      document.createElement(
        "button"
      );

    button.className =
      "account";

    button.textContent =
      account.name;

    button.addEventListener(
      "click",
      async () => {
        await window.scoutMail
          .selectAccount(
            account.id
          );

        renderActive(
          account.id
        );
      }
    );

    button.dataset.accountId =
      account.id;

    accounts.appendChild(
      button
    );
  });
}

function renderActive(id) {
  document
    .querySelectorAll(
      ".account"
    )
    .forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.accountId ===
          id
      );
    });
}

async function loadAccounts() {
  const list =
    await window.scoutMail
      .getAccounts();

  renderAccounts(list);

  if (list.length) {
    renderActive(
      list[0].id
    );
  }
}

document
  .getElementById(
    "addAccount"
  )
  .addEventListener(
    "click",
    async () => {
      const name =
        prompt(
          "Name this Gmail account:",
          `Gmail Account`
        );

      if (!name) {
        return;
      }

      const account =
        await window.scoutMail
          .addGmailAccount(
            name
          );

      await loadAccounts();

      renderActive(
        account.id
      );
    }
  );

document
  .getElementById(
    "reloadScoutool"
  )
  .addEventListener(
    "click",
    () =>
      window.scoutMail
        .reloadScoutool()
  );

document
  .getElementById(
    "reloadMail"
  )
  .addEventListener(
    "click",
    () =>
      window.scoutMail
        .reloadMail()
  );

document
  .getElementById(
    "stop"
  )
  .addEventListener(
    "click",
    () => {
      console.log(
        "Stop requested."
      );
    }
  );

window.scoutMail
  .onAccountsUpdated(
    (list) => {
      renderAccounts(list);
    }
  );

loadAccounts();

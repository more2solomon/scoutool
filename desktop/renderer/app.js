const accountsEl =
  document.getElementById("accounts");

const counterEl =
  document.getElementById("counter");

function render(accounts) {
  accountsEl.innerHTML = "";

  counterEl.textContent =
    `${accounts.length} / 50`;

  if (!accounts.length) {
    accountsEl.innerHTML =
      `<div class="empty">
        No mail accounts added.
      </div>`;

    return;
  }

  accounts.forEach((account) => {
    const row =
      document.createElement("div");

    row.className = "account";

    const info =
      document.createElement("div");

    info.className = "accountInfo";

    info.innerHTML = `
      <strong>${escapeHtml(account.name)}</strong>
      <span>${escapeHtml(
        account.provider
      )}</span>
    `;

    const open =
      document.createElement("button");

    open.textContent = "Open";

    open.addEventListener(
      "click",
      () => {
        window.scoutMail
          .openAccount(account.id);
      }
    );

    row.appendChild(info);
    row.appendChild(open);

    accountsEl.appendChild(row);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document
  .getElementById("addAccount")
  .addEventListener(
    "click",
    async () => {
      const name =
        prompt(
          "Account name:",
          "Mail Account"
        );

      if (!name) return;

      const provider =
        prompt(
          "Provider: gmail or outlook",
          "gmail"
        )
          ?.trim()
          .toLowerCase();

      if (
        provider !== "gmail" &&
        provider !== "outlook"
      ) {
        alert(
          "Use gmail or outlook."
        );

        return;
      }

      try {
        await window.scoutMail
          .addAccount({
            name,
            provider
          });
      } catch (error) {
        alert(error.message);
      }
    }
  );

document
  .getElementById("openAll")
  .addEventListener(
    "click",
    () => {
      window.scoutMail
        .openAllAccounts();
    }
  );

document
  .getElementById("scoutool")
  .addEventListener(
    "click",
    () => {
      window.scoutMail
        .openScoutool();
    }
  );

document
  .getElementById("closeAll")
  .addEventListener(
    "click",
    () => {
      window.scoutMail
        .closeAllMail();
    }
  );

window.scoutMail
  .onAccountsUpdated(
    render
  );

window.scoutMail
  .getAccounts()
  .then(render);

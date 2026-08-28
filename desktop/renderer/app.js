document
  .getElementById("reloadScoutool")
  .addEventListener("click", async () => {
    await window.scoutMail.reloadScoutool();
  });

document
  .getElementById("reloadMail")
  .addEventListener("click", async () => {
    await window.scoutMail.reloadMail();
  });

document
  .getElementById("stop")
  .addEventListener("click", () => {
    console.log("Automation stopped.");
  });

document.addEventListener("shopify:block:select", (event) => {
    const timer = event.target.closest("countdown-timer");

    timer?.initTimer?.();
});

document.addEventListener("shopify:section:select", function (sectionId, load) {
    const timer = sectionId.target.querySelector("countdown-timer");

    timer?.initTimer?.();
});

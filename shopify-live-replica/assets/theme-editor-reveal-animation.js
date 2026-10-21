async function reinitOnReveal(target) {
    const element =
        target?.querySelector(".reveal-slide-in") ||
        target?.closest(".reveal-slide-in");
    if (!element) return;

    await onReveal(new Set([element]));
}

const editorEvents = [
    "shopify:inspector:activate",
    "shopify:inspector:deactivate",
    "shopify:block:select",
    "shopify:section:select",
    "shopify:section:load",
];

editorEvents.forEach((eventName) => {
    document.addEventListener(eventName, (e) => {
        reinitOnReveal(e.target);
    });
});

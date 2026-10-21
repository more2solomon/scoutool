document.addEventListener("shopify:section:select", function (sectionId, load) {
    const currentEl = sectionId.target.querySelector(".text-animation");

    if (currentEl) currentEl.classList.remove("text-animation");
});

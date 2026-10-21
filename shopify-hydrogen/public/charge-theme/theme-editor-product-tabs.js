document.addEventListener("shopify:block:select", function (event) {
    const tabsContainer = event.target.closest(".product-tabs");
    const block = JSON.parse(event.target.dataset.shopifyEditorBlock);

    tabsContainer &&
        tabsContainer.querySelector(`#tab-label-${block.id}-title`)?.click?.();
});

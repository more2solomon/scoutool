if (!customElements.get("collection-modes")) {
    class CollectionModes extends HTMLElement {
        constructor() {
            super();
            this.filters = document.querySelector("collection-filters-form");
            this.bindModeChangeEvent();
        }

        buildFetchUrl(href) {
            const formData = new FormData(this.filters.form);
            const params = new URLSearchParams(formData).toString();

            return href.indexOf("?") !== -1
                ? `${href}&${params}`
                : `${href}?${params}`;
        }

        bindModeChangeEvent() {
            this.addEventListener("click", (event) => {
                const link = event.target.closest("[href]");
                const url = link && this.buildFetchUrl(link.href);
                const filters = this.filters;
                const filterDataUrl = (element) => element.url === url;

                /* Check `Shopify.designMode`. It is 'true' in Shopify theme editor.
                 * Disable ajax in theme editor to make it easier configure grid and list templates.
                 */
                if (link && filters) {
                    event.preventDefault();
                    filters.showLoading();

                    if (Shopify.designMode) {
                        window.location = url;
                    } else {
                        filters.filterData.some(filterDataUrl)
                            ? filters.renderSectionFromCache(
                                  filterDataUrl,
                                  {},
                                  event
                              )
                            : filters.renderSectionFromFetch(url, {}, event);
                        filters.updateURLHash(
                            new URL(url).searchParams.toString()
                        );
                    }
                }
            });
        }
    }

    customElements.define("collection-modes", CollectionModes);
}

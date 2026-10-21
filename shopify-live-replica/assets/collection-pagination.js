if (!customElements.get("collection-pagination")) {
    class CollectionPagination extends HTMLElement {
        constructor() {
            super();
            this.addEventListener("click", (event) => {
                const link = event.target.closest("[href]");
                const collectionFilter = document.querySelector(
                    "collection-filters-form"
                );
                const stickyHeader = document.querySelector("sticky-header");

                if (link && collectionFilter) {
                    event.preventDefault();

                    window.scroll({
                        top:
                            (collectionFilter.getCollectionEl()?.offsetTop ||
                                0) - (stickyHeader?.clientHeight || 0),
                        behavior: "smooth",
                    });
                    collectionFilter.renderPage(
                        new URL(link.href).searchParams.toString()
                    );
                }
            });
        }
    }

    customElements.define("collection-pagination", CollectionPagination);
}

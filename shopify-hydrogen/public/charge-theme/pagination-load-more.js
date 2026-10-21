if (!customElements.get("pagination-load-more")) {
    class PaginationLoadMore extends HTMLElement {
        constructor() {
            super();

            this.loadMoreBtn = this.querySelector(".pagination-load-more");
            this.paginationType = this.dataset.paginationType;
            if (!this.loadMoreBtn) return;
        }

        connectedCallback() {
            if (this.paginationType == "infinity_scroll") {
                this.infinityScroll();
            } else {
                this.loadMoreBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    this.loadNextPage();
                });
            }
        }

        infinityScroll() {
            window.infiniteScrollObserver = new IntersectionObserver(
                (entries, observer) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) this.loadNextPage();
                    });
                },
                {
                    root: null,
                    rootMargin: "0px 0px -30% 0px",
                    threshold: 0.5,
                }
            );

            window.infiniteScrollObserver.observe(this.loadMoreBtn);
        }

        loadNextPage() {
            let loadMoreBtn = this.loadMoreBtn;

            //window.loadMoreBtn = this.loadMoreBtn;
            window.scrollLoad = true;

            if (window.scrollLoad) {
                let url = this.getPageUrl(),
                    sources = [
                        "[data-product-id]",
                        "[data-collection-id]",
                        "[data-article-id]",
                    ];

                this.showLoader();
                window.scrollLoad = false;

                fetch(url)
                    .then((response) => response.text())
                    .then((text) => {
                        this.hideLoader();

                        let itemsChildren = null,
                            dataHtml = new DOMParser().parseFromString(
                                text,
                                "text/html"
                            );

                        sources.forEach((source) => {
                            itemsChildren = dataHtml.querySelectorAll(
                                `[data-list-items] ${source}`
                            );

                            if (itemsChildren.length === 0) return;

                            // filter items availability
                            if (url.includes("availability=1"))
                                itemsChildren = [...itemsChildren].filter(
                                    (item) =>
                                        !item.classList.contains("sold-out")
                                );
                            else if (url.includes("availability=0"))
                                itemsChildren = [...itemsChildren].filter(
                                    (item) =>
                                        item.classList.contains("sold-out")
                                );

                            // add new items to the end of the list
                            this.appendItems(itemsChildren);
                        });

                        let currentPageNumber = JSON.parse(
                                new URL(loadMoreBtn.href)?.searchParams?.get(
                                    "page"
                                )
                            ),
                            nextPage = dataHtml.querySelector(
                                ".pagination-load-more"
                            )?.href,
                            nextPageNumber =
                                nextPage &&
                                JSON.parse(
                                    new URL(nextPage)?.searchParams?.get("page")
                                );

                        // if load more button url has param page
                        if (
                            nextPage &&
                            nextPageNumber !== null &&
                            nextPageNumber !== currentPageNumber
                        ) {
                            loadMoreBtn.href = nextPage;

                            // update history url
                            history.pushState(null, "", nextPage);
                            window.scrollLoad = true;
                        } else {
                            loadMoreBtn.remove();
                            window.infiniteScrollObserver?.unobserve(
                                loadMoreBtn
                            );
                        }
                    })
                    .catch(function (err) {
                        console.error(err);
                    });
            }
        }

        getPageUrl() {
            let url = this.loadMoreBtn.href;
            const filtersForm = document.querySelector(
                "collection-filters-form"
            );

            if (filtersForm) {
                const formData = new FormData(filtersForm.form);
                const separator = url.includes("?") ? "&" : "?";

                // update url if filter applied
                document
                    .getElementById("CollectionProducts")
                    ?.addEventListener("renderProductGrid", (e) => {
                        url +=
                            separator +
                            new URLSearchParams(formData).toString();
                        return url;
                    });

                const searchParams = new URLSearchParams(formData).toString();
                // Check if the current URL already contains query parameters
                if (searchParams) url += separator + searchParams;
            }

            return url;
        }

        appendItems(items) {
            const listItems = document.querySelector("[data-list-items]");

            items.forEach((item) => {
                if (item.nodeName === "LI" || item.nodeName === "ARTICLE")
                    listItems.appendChild(item);
            });

            this.updateRevealAnimation();
            this.reinitPreloadImages();
        }

        async updateRevealAnimation() {
            const listItems = document.querySelector("[data-list-items]");
            const revealList =
                listItems && listItems.closest(".reveal-slide-in");

            if (!revealList) return;

            const revealListArr = [];
            revealListArr.push(listItems);

            if (revealListArr.length) {
                await onReveal?.(revealListArr);
                await updateItemZIndex?.(revealListArr);
            }
        }

        async reinitPreloadImages() {
            const listItems = document.querySelector("[data-list-items]");
            const blurImages =
                listItems?.querySelectorAll(".media--blur-image");

            blurImages.length > 0 &&
                typeof _preloadImg === "function" &&
                (await _preloadImg?.(blurImages));
        }

        showLoader() {
            let btn = this.loadMoreBtn;
            if (!btn.querySelector(".loading-overlay"))
                btn.prepend(createFromTemplate("template-loading-overlay"));

            btn && btn.classList.add("loading");
            if (btn.children[0].classList.contains("hidden"))
                btn.children[0].classList.remove("hidden");
        }

        hideLoader() {
            let btn = this.loadMoreBtn;
            btn.children[0].classList.add("hidden");
            btn && btn.classList.remove("loading");
        }

        disconnectedCallback() {
            window.infiniteScrollObserver?.unobserve(this.loadMoreBtn);
            this.loadMoreBtn.removeEventListener("click", this.loadNextPage);
        }
    }

    customElements.define("pagination-load-more", PaginationLoadMore);
}

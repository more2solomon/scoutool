if (!customElements.get("blogs-filter")) {
    class BlogsFiltering extends HTMLElement {
        constructor() {
            super();

            this.tagsContainer = this.querySelector('[data-filter="tags"]');
            this.blogContainer = document.querySelector(
                '[data-blogs="main-blogs"]'
            );
            this.paginationContainer = document.querySelector(
                ".pagination-wrapper"
            );

            if (!this.tagsContainer || !this.blogContainer) return;

            this.activeTagHandle = null;
            this.onTagClick = this.onTagClick.bind(this);
            this.currentTagState();
        }

        connectedCallback() {
            this.tagsContainer.addEventListener("click", this.onTagClick);
            this.blogContainer.addEventListener(
                "click",
                this.onPaginationClick.bind(this)
            );
        }

        currentTagState() {
            const path = window.location.pathname;
            if (!path.includes("/tagged/")) return;

            const splitPath = path.split("/");
            const tag = splitPath[splitPath.length - 1];
            const currentActiveTag = this.tagsContainer.querySelector(
                `li[data-tag="${tag}"]`
            );

            this.activeTagHandle = tag;
            this.setActiveTag(currentActiveTag);
        }

        async onTagClick(e) {
            const item = e.target.closest("li[data-tag]");
            if (!item) return;

            e.preventDefault();

            this.activeTagHandle = item.dataset.tag;
            const url = item.querySelector("a")?.href;

            this.showLoading();
            await this.loadPage(url);

            history.pushState({ tag: this.activeTagHandle }, "", url);
            this.setActiveTag(item);
            this.recallRevealAnimation();
        }

        async loadPage(url) {
            const config = {
                method: "GET",
                headers: { "X-Requested-With": "XMLHttpRequest" },
            };

            try {
                const res = await fetch(url, config);
                if (!res.ok) return;

                const text = await res.text();
                const html = new DOMParser().parseFromString(text, "text/html");

                const newArticles = html.querySelector(
                    '[data-blogs="main-blogs"]'
                );
                const newPagination = html.querySelector(
                    ".pagination, .pagination-load-more"
                );

                if (newArticles) {
                    this.blogContainer.innerHTML = newArticles.innerHTML;
                }

                if (this.paginationContainer && newPagination) {
                    this.paginationContainer.innerHTML =
                        newPagination.innerHTML;
                }

                this.hideLoading();
                this.reinitPreloadImages();
            } catch (err) {
                console.error("Blog filter AJAX error", err);
            }
        }

        onPaginationClick(e) {
            const link = e.target.closest(
                ".pagination a, .pagination-load-more a"
            );
            if (!link) return;

            e.preventDefault();

            const nextUrl = new URL(link.href, window.location.origin);
            const page = nextUrl.searchParams.get("page");
            let basePath = "/blogs/news";

            if (this.activeTagHandle)
                basePath = `${basePath}/tagged/${this.activeTagHandle}`;

            // get the url
            const url = `${basePath}?page=${page}`;

            this.showLoading();
            this.loadPage(url).then(() => {
                history.pushState({}, "", url);
                this.recallRevealAnimation();
            });
        }

        setActiveTag(item) {
            [...this.tagsContainer.children].forEach((li) =>
                li.classList.toggle("active", li === item)
            );
        }

        async recallRevealAnimation() {
            const revealContainer =
                document.querySelectorAll(".reveal-slide-in");
            if (!revealContainer) return;

            typeof onReveal === "function" &&
                (await onReveal?.(revealContainer));
        }

        initLoading() {
            return fetchLoaderHTML().then((html) => {
                if (!this.loader) {
                    this.insertAdjacentHTML("afterbegin", html);
                    this.loader = this.querySelector(".loading-overlay");
                }
            });
        }

        showLoading() {
            this.initLoading().then(() => {
                this.loader && this.loader.classList.remove("hidden");
            });
        }

        hideLoading() {
            this.loader && this.loader.classList.add("hidden");
        }

        async reinitPreloadImages() {
            const list =
                this.blogContainer.querySelectorAll(".media--blur-image");
            list && list.length > 0 && (await _preloadImg?.(list, true));
        }

        disconnectedCallback() {
            this.tagsContainer.removeEventListener("click", this.onTagClick);
        }
    }

    customElements.define("blogs-filter", BlogsFiltering);
}

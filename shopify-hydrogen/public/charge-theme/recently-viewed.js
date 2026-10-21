if (!customElements.get("recently-viewed")) {
    class RecentlyViewed extends HTMLElement {
        constructor() {
            super();

            this.container = this;
            if (!this.container) return;

            this.fetchItems();
        }

        buildFetchUrl() {
            const limit = parseInt(this.dataset.recentlyViewedLimit) || 1;
            const items =
                JSON.parse(localStorage.getItem("argento_recently_viewed")) ||
                [];
            const sectionId = "recently-viewed-products";
            if (!items.length) {
                document
                    .querySelector(".recently-viewed-wrapper")
                    .classList.add("hidden");
                return null;
            }

            return `/search?view=recent&options=product&limit=${limit}&q=${items.join(
                " OR "
            )}&section_id=${sectionId}`;
        }

        fetchItems() {
            const url = this.buildFetchUrl();
            if (!url) return;

            fetch(url)
                .then((res) => res.text())
                .then((text) => {
                    const html = new DOMParser().parseFromString(
                        text,
                        "text/html"
                    );
                    const content = html.querySelector(
                        ".recently-viewed-items"
                    );
                    if (!content || !content.innerHTML.trim()) {
                        this.remove(); // nothing to render
                        return;
                    }

                    this.container.innerHTML = content.innerHTML;
                    this.container.classList.add("loaded");

                    const main = document.querySelector("main");
                    if (!main) return;

                    const sections = main.querySelectorAll("section");
                    const lastSection = sections[sections.length - 1];
                    let wrapper = main.querySelector(
                        ".recently-viewed-wrapper"
                    );
                    if (!wrapper) {
                        wrapper = document.createElement("div");
                        wrapper.className = "recently-viewed-wrapper";
                    }
                    // add recently viewed into wrapper
                    if (!wrapper.contains(this.container))
                        wrapper.append(this.container);

                    // render wrapper as last element in the main content
                    if (sections.length) lastSection.before(wrapper);
                    else main.append(this.container); // fallback if no section wrappers exist

                    this.reinitPreloadImages(this.container);
                })
                .catch((e) => {
                    console.warn("Recently viewed fetch failed - " + e);
                });
        }

        async reinitPreloadImages(container) {
            const list = container.querySelectorAll(".media--blur-image");
            list && list.length > 0 && (await _preloadImg?.(list, true));
        }
    }

    customElements.define("recently-viewed", RecentlyViewed);
}

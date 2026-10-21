if (!customElements.get("collection-icon")) {
    class CollectionIcon extends HTMLElement {
        static observer;
        static cache = new Map(); // fast in-memory cache

        constructor() {
            super();
            // observe element once
            if (!CollectionIcon.observer) {
                CollectionIcon.observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                const el = entry.target;
                                CollectionIcon.observer.unobserve(el);
                                el.loadCollectionIcon();
                            }
                        });
                    },
                    { rootMargin: "0px" }
                );
            }
        }

        connectedCallback() {
            CollectionIcon.observer.observe(this);
        }

        async loadCollectionIcon() {
            const handle = this.dataset?.collectionHandle?.trim();
            if (!handle) return;

            const width = this.dataset?.collectionIconWidth?.trim();

            // check in-memory cache first
            let src = CollectionIcon.cache.get(handle);

            // then check localStorage cache
            // or storage the handles there
            if (!src) {
                try {
                    const stored = localStorage.getItem(
                        `collection_icon_${handle}`
                    );
                    if (stored) {
                        src = stored;
                        CollectionIcon.cache.set(handle, src);
                    }
                } catch {
                    // ignore localStorage errors
                }
            }

            // if cached, render immediately
            if (src) {
                this.renderIcon(src, handle, width);
                return;
            }

            // or fetch it once
            const baseUrl = window.Shopify?.routes?.root || "/";
            const url = `${baseUrl}collections/${encodeURIComponent(
                handle
            )}.json`;
            try {
                const response = await fetch(url, { cache: "force-cache" });
                if (!response.ok) return;

                const text = await response.text();
                if (!text) return;

                const data = JSON.parse(text);
                src = data?.collection?.image?.src;
                if (!src) return;

                // cache it both in memory and localStorage
                CollectionIcon.cache.set(handle, src);
                localStorage.setItem(`collection_icon_${handle}`, src);

                this.renderIcon(src, handle, width);
            } catch (e) {
                // silent fail
                //console.log(`Failed render collection icon ${handle}` + e);
            }
        }

        renderIcon(src, handle, width) {
            this.innerHTML = `
		        <img
		          src="${src}"
		          alt="${handle}"
		          class="collection__icon"
		          style="width:${width}px;margin-right:0.25rem;"
		          loading="lazy">
		      	`;

            const img = this.querySelector("img");
            const markLoaded = () => this.classList.add("loaded");

            if (img.complete && img.naturalWidth !== 0) {
                markLoaded();
            } else {
                img.addEventListener("load", markLoaded, { once: true });
            }
        }
    }

    customElements.define("collection-icon", CollectionIcon);
}

if (!customElements.get("products-complementary")) {
    class ComplementaryProducts extends HTMLElement {
        constructor() {
            super();

            this.complementaryBlock = this;

            if (!this.complementaryBlock) return;
            const observer = new IntersectionObserver(this.handleIntersection, {
                rootMargin: "0px 0px 150px 0px",
            });
            observer.observe(this.complementaryBlock);
        }

        handleIntersection(entries, observer) {
            if (!entries[0].isIntersecting) return;

            entries.forEach((entry) => {
                let url,
                    block = entry.target;

                observer.unobserve(block);

                url = block.dataset.url;

                fetch(url)
                    .then((response) => response.text())
                    .then((text) => {
                        let html = document.createElement("div");
                        if (!text.includes("products-complementary")) {
                            console.warn(
                                "No complementary content returned for:",
                                url
                            );
                        }
                        html.innerHTML = text;

                        const renderedBlock = html.querySelector(
                            "products-complementary"
                        );
                        const items =
                            renderedBlock.querySelector("ul").children;
                        items.length === 0
                            ? renderedBlock
                                  .querySelector(".content-wrapper")
                                  ?.setAttribute("hidden", true)
                            : renderedBlock
                                  .querySelector(".content-wrapper")
                                  ?.removeAttribute("hidden");

                        if (
                            renderedBlock &&
                            renderedBlock.innerHTML.trim().length
                        ) {
                            block.innerHTML = renderedBlock.innerHTML;
                            block.dispatchEvent(
                                new CustomEvent("renderProductGrid", {
                                    bubbles: true,
                                })
                            );
                        }

                        //reinit preload images
                        const blurImages =
                            block.querySelectorAll(".media--blur-image");
                        blurImages.length > 0 &&
                            typeof _preloadImg === "function" &&
                            _preloadImg?.(blurImages);
                    })
                    .catch((e) => {
                        console.error(e);
                    });
            });
        }
    }

    customElements.define("products-complementary", ComplementaryProducts);
}

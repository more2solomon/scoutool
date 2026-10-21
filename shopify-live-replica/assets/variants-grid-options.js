if (!customElements.get("select-color-variants")) {
    class SelectColorVariants extends HTMLElement {
        constructor() {
            super();

            this.swatchOptions = this.querySelectorAll(
                ".swatch-attribute-options"
            );
            this.options = this.swatchOptions.length
                ? [...this.swatchOptions[0].children]
                : [];
        }

        connectedCallback() {
            this.options.forEach((option) => {
                if (window.matchMedia("(hover: hover)").matches) {
                    option.addEventListener("mouseenter", (e) =>
                        this.handleSwatchOption(e)
                    );
                    option.addEventListener("mouseleave", (e) =>
                        this.restoreImageSrc(e)
                    );
                } else {
                    option.addEventListener("click", (e) =>
                        this.handleSwatchOption(e)
                    );
                }
            });
        }

        handleSwatchOption(e) {
            const varianrSrc = e.target.dataset.variantSrc;
            const item = e.target.closest(".grid-item");

            if (!item || varianrSrc === undefined) {
                console.warn(
                    `The variant with the color '${e.target.dataset.color}' does not have any image applied.`
                );
                return;
            }

            const squamaItem = item.querySelector("squama-item");
            const isSecondaryImg = item.querySelector(
                ".item-image__with-secondary"
            );
            const img = isSecondaryImg
                ? squamaItem?.querySelectorAll(".media img")[1]
                : squamaItem?.querySelector(".media img");
            if (!img) return;

            // store original image data only once
            if (!img.dataset.originalSrc) {
                img.dataset.originalSrc = img.src;
                img.dataset.originalSrcset = img.srcset;
            }

            this.swapImage(img, varianrSrc);
        }

        swapImage(img, varianrSrc) {
            img.src = varianrSrc;
            let imageWidth = img?.srcset.split("&")[1];

            if (imageWidth.indexOf(",") !== -1) {
                imageWidth = imageWidth.split(",")[0];
            }
            img.srcset = varianrSrc + "&" + imageWidth;

            // show active image on mobile when second image on hover is enabled
            if (window.innerWidth < 990) img.style.opacity = "1";
        }

        restoreImageSrc(e) {
            const swatchGroup = e.target.closest(".swatch-attribute-options");
            const item = swatchGroup.closest(".grid-item");
            const isSecondaryImg = item.querySelector(
                ".item-image__with-secondary"
            );
            const img = isSecondaryImg
                ? item?.querySelectorAll(".media img")[1]
                : item?.querySelector(".media img");

            if (!img) return;

            if (img.dataset.originalSrc) img.src = img.dataset.originalSrc;
            if (img.dataset.originalSrcset)
                img.srcset = img.dataset.originalSrcset;
        }
    }

    customElements.define("select-color-variants", SelectColorVariants);
}

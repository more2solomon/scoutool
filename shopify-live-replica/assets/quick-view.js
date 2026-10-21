if (!customElements.get("quick-view")) {
    let popup;
    class QuickView extends HTMLElement {
        constructor() {
            super();

            this.quickViewBtn = this;
            if (!this.quickViewBtn) return;
        }

        connectedCallback() {
            this.quickViewBtn.addEventListener(
                "click",
                this.handleBtnClick.bind(this)
            );
        }

        handleBtnClick(e) {
            e.preventDefault();
            popup && this.showLoader();
            // remove item event to prevent redirecting to the product page
            this.quickViewBtn.closest("a.item-link").style.pointerEvents =
                "none";

            // clear popup before updating
            popup && this.updatePopup("");
            Promise.all([
                fetch(this.getUrl())
                    .then((result) => {
                        if (result.ok) return result.text();
                        else throw new Error(result.status);
                    })
                    .then((html) =>
                        [
                            ...new DOMParser()
                                .parseFromString(html, "text/html")
                                .querySelectorAll(this.getElements()),
                        ]
                            .map((el) => el.innerHTML)
                            .join("")
                    ),
                this.showPopup(),
            ])
                .then(([parsedHtml]) => {
                    this.updatePopup(parsedHtml);
                    this.updateRevealAnimation();
                })
                .finally(() => {
                    // revert the event click on the product item
                    this.quickViewBtn.closest(
                        "a.item-link"
                    ).style.pointerEvents = "auto";
                    // remove popup content reveal animation
                    [...popup.querySelectorAll(".reveal-slide-in")].forEach(
                        (el) => el.classList.remove("reveal-slide-in")
                    );

                    popup
                        .querySelector(".product__info-block--buy_buttons")
                        .insertAdjacentHTML(
                            "afterend",
                            this.renderViewDetailsLink()
                        );
                    this.hideLoader();
                });
        }

        getUrl() {
            return this.dataset.href || this.closest("a").href;
        }

        getElements() {
            return this.dataset.elements || ".shopify-section.product-section";
        }

        async getPopup() {
            document.body.insertAdjacentHTML(
                "beforeend",
                await fetchSectionHTML(
                    "quick-view__popup",
                    true,
                    Shopify.routes.root
                )
            );

            popup = document.getElementById("PopupModal-quickView");

            return popup;
        }

        async updatePopup(html) {
            const content = popup.querySelector(".popup-modal__content-info");
            [...content.children]
                .filter((el) => !el.matches(".loading-overlay"))
                .forEach((el) => el.remove());

            content.insertAdjacentHTML("afterbegin", html);
            // disable url update for variant options
            content.querySelectorAll("variant-radios").forEach((el) => {
                el.dataset.updateUrl = "false";
            });
            // product form
            const form = popup.querySelector("form");
            form &&
                form.addEventListener(
                    "submit",
                    this.handleFormOnSubmit.bind(this)
                );

            // init shopify payment buttons
            Shopify?.PaymentButton?.init?.();
        }

        renderViewDetailsLink() {
            return (
                `<div class="product__info-block product__view-details" style="order:21;">` +
                `<a href="${this.getUrl()}" class="button button--tertiary button--small">` +
                `<span>${this.dataset.viewDetails}</span>` +
                `</a>` +
                `</div>`
            );
        }

        async updateRevealAnimation() {
            const revealItems = popup.querySelectorAll(".reveal-slide-in");
            revealItems.length &&
                typeof onReveal === "function" &&
                (await onReveal?.(revealItems));
        }

        async handleFormOnSubmit(e) {
            const productForm = e.target;
            // use parent function onSubmitHandler to fetch response
            // show error message in the popup or close popup on submit
            productForm && (await productForm?.onSubmitHandler?.call(this));
            document.body.removeAttribute("data-modal-opened");
        }

        async showPopup() {
            (await this.getPopup.call(this)).show?.();
        }

        showLoader() {
            popup
                .querySelector(".loading-overlay")
                ?.classList.contains("hidden") &&
                popup
                    .querySelector(".loading-overlay")
                    ?.classList.remove("hidden");
        }

        hideLoader() {
            popup.querySelector(".loading-overlay")?.classList.add("hidden");
        }

        disconnectedCallback() {
            this.quickViewBtn.removeEventListener(
                "click",
                this.handleBtnClick.bind(this)
            );
        }
    }

    customElements.define("quick-view", QuickView);
}

if (!customElements.get("compare-popup")) {
    class ComparePopup extends HTMLElement {
        constructor() {
            super();

            this.popup = this;
            if (!this.popup) return;

            this.popupClose = this.popup.querySelector(".modal__toggle-close");
            this.results = this.popup.querySelector(".compare-popup__results");
        }

        connectedCallback() {
            this.popupClose?.addEventListener("click", this.close.bind(this));
        }

        popupContent() {
            this.initLoading().then(() => {
                this.showLoading();
                const items =
                    CompareUtils.getCompareItems().length > 0
                        ? JSON.parse(CompareUtils.getCompareItems())
                        : [];
                const itemsId = new Array();

                this.showWarning(items);

                if (items) {
                    items.forEach((item) => {
                        itemsId.push(`id:${item}`);
                    });
                }
                const ids = itemsId.join(" OR ");
                fetch(this.getUrl(ids))
                    .then((response) => response.text())
                    .then((text) => {
                        const html = new DOMParser().parseFromString(
                            text,
                            "text/html"
                        );
                        if (this.results) {
                            this.results.innerHTML =
                                html.querySelector(".modal-results").innerHTML;
                            document.querySelector(
                                ".compare-link__products"
                            ).innerHTML = this.results.innerHTML;
                        }
                    })
                    .finally(() => {
                        this.results.classList[
                            items.length > 0 ? "remove" : "add"
                        ]("hidden");
                        this.hideLoading();
                        this.showMessageOnCartBtnClick();
                        if (document.body.hasAttribute("data-compare-opened"))
                            document.body.addEventListener(
                                "click",
                                (e) =>
                                    e.target.nodeName === "BODY" && this.close()
                            );
                    });
            });
        }

        getUrl(ids) {
            return `${window.routes.compare_url}?q=${ids}&${encodeURIComponent(
                "resources[type]"
            )}=product&section_id=${CompareUtils.sectionId}`;
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
            this.loader && this.loader.classList.remove("hidden");
        }

        hideLoading() {
            this.loader && this.loader.classList.add("hidden");
        }

        close() {
            if (this.popup) {
                this.popup.setAttribute("hidden", true);
                this.popup.removeAttribute("open");
                document.body.removeAttribute("data-compare-opened");
            }
        }

        showWarning(items) {
            const warningsContainer = this.popup?.querySelector(
                ".modal__popup-warnings"
            );
            if (items.length >= 2) {
                warningsContainer?.setAttribute("hidden", true);
                return;
            } else warningsContainer?.removeAttribute("hidden");

            let warningText =
                items.length === 0
                    ? warningsContainer?.firstElementChild?.dataset.emptyList // compare list is empty
                    : warningsContainer?.firstElementChild?.dataset.lackList; // only one item in the list

            warningsContainer.firstElementChild.innerText = warningText;
        }

        showMessageOnCartBtnClick() {
            const addToCartBtn = this.results.querySelectorAll(
                'button[type="submit"]'
            );
            if (addToCartBtn.length == 0) return;

            addToCartBtn.forEach((btn) => {
                btn.addEventListener("click", (event) => {
                    let message = event.target.closest(
                        ".item-actions-wrapper"
                    )?.firstElementChild;
                    setTimeout(() => {
                        message.classList.remove("hidden");
                        message.classList.add("active");
                    }, 500);

                    setTimeout(() => {
                        message.classList.add("hidden");
                        message.classList.remove("active");
                    }, 3500);
                });
            });
        }

        removeCompareItems() {
            CompareUtils.setCompareItems(""); // compare-link Remove all items
            document.querySelector("#compare-link").classList.remove("_active");
        }

        disconnectedCallback() {
            this.popupClose?.removeEventListener(
                "click",
                this.close.bind(this)
            );
        }
    }

    customElements.define("compare-popup", ComparePopup);
}

if (!customElements.get("compare-remove-item")) {
    class CompareRemoveItem extends HTMLElement {
        constructor() {
            super();

            this.button = this.querySelector("a");
        }

        connectedCallback() {
            this.button?.addEventListener(
                "click",
                this.onButtonClick.bind(this)
            );
        }

        disconnectedCallback() {
            this.button?.removeEventListener(
                "click",
                this.onButtonClick.bind(this)
            );
        }

        onButtonClick(e) {
            e.preventDefault();

            const popup = this.closest(CompareUtils.comparePopup);
            const compareLink = document.querySelector(
                CompareUtils.addToCompare
            );
            const gridCompareItems = document.querySelectorAll(
                CompareUtils.addToCompare
            );
            const productId = this.button.dataset.productId;

            if (!popup) return;

            const updateCompareList = JSON.parse(
                CompareUtils.getCompareItems()
            ).filter((item) => item !== productId);
            CompareUtils.setCompareItems(updateCompareList);
            popup.popupContent?.();

            // update compare link bubble
            compareLink.updateCompareLink?.();
            // update compare icon in the product grid
            gridCompareItems.forEach((item) => {
                if (item.firstElementChild?.dataset.productId === productId)
                    item.showCompareIcon?.(item.firstElementChild);
            });
        }
    }

    customElements.define("compare-remove-item", CompareRemoveItem);
}

if (!customElements.get("compare-add-button")) {
    class CompareAddButton extends HTMLElement {
        constructor() {
            super();

            this.button = this.querySelector("button");
            this.itemCompared = false;
            this.updateCompareLink();
            this.getCompareStorageData();
        }

        connectedCallback() {
            this.button?.addEventListener(
                "click",
                this.onButtonClick.bind(this)
            );
        }

        onButtonClick(e) {
            e.preventDefault();

            let currentBtn = this.button;
            // remove item event to prevent redirecting to the product page
            if (currentBtn.closest("a.item-link"))
                currentBtn.closest("a.item-link").style.pointerEvents = "none";

            this.updateCompareIcon(currentBtn);
            //let productId = currentBtn.dataset.productId;

            // save compare list between pages
            if (this.getCompareProductsCount() > 0)
                CompareUtils.comparelist = JSON.parse(
                    CompareUtils.getCompareItems()
                );
            else CompareUtils.comparelist = [];

            if (!this.itemCompared)
                CompareUtils.comparelist = this.addToCompareList();
            else CompareUtils.comparelist = this.removeFromCompareList();

            CompareUtils.setCompareItems(CompareUtils.comparelist);

            this.updateCompareLink();

            // revert the event click on the product item
            if (currentBtn.closest("a.item-link")) {
                setTimeout(() => {
                    this.button.closest("a.item-link").style.pointerEvents =
                        "auto";
                }, 250);
            }
        }

        addToCompareList() {
            let productId = this.button.dataset.productId;

            if (productId && !CompareUtils.comparelist.includes(productId)) {
                this.itemCompared = true;
                this.updateCompareIcon(this.button);
                // add item to comparelist
                CompareUtils.comparelist.push(productId);
            } else {
                this.removeFromCompareList();
            }

            return CompareUtils.comparelist;
        }

        removeFromCompareList() {
            this.itemCompared = false;
            this.showCompareIcon(this.button);
            //remove item from comparelist and update local storage data
            CompareUtils.comparelist = this.updateStorageData();

            return CompareUtils.comparelist;
        }

        updateCompareLink() {
            const compareListLength = this.getCompareProductsCount();
            let compareLink = document.getElementById(
                    CompareUtils.compareLinkId
                ),
                count = compareLink.querySelector("span.count");

            // show compare link
            if (compareListLength > 0) compareLink?.classList.add("_active");

            compareLink.dataset.length = compareListLength;
            count.textContent = compareListLength;
        }

        getCompareProductsCount() {
            return CompareUtils.getCompareItems().length > 0
                ? JSON.parse(CompareUtils.getCompareItems()).length
                : 0;
        }

        updateCompareIcon(btn) {
            // show checkmark icon
            btn.querySelector(".compare-checkmark > svg").classList.remove(
                "hidden"
            );
            btn.querySelector(".compare-icon > svg").classList.add("hidden");
        }

        showCompareIcon(btn) {
            // show compare icon
            btn.querySelector(".compare-checkmark > svg").classList.add(
                "hidden"
            );
            btn.querySelector(".compare-icon > svg").classList.remove("hidden");
            this.itemCompared = false;
        }

        updateStorageData() {
            const itemsCached = JSON.parse(CompareUtils.getCompareItems());
            let productId = this.querySelector("button").dataset.productId;

            const filteredData = itemsCached?.filter(
                (item) => item !== productId
            );
            if (!filteredData.length) this.hideCompareLink();

            return filteredData;
        }

        getCompareStorageData() {
            if (this.getCompareProductsCount() === 0) return;

            const itemsCached = JSON.parse(CompareUtils.getCompareItems());
            let productId = this.button.dataset.productId;

            itemsCached.forEach((item) => {
                // show the appropriate icon if a product is added to compare list - compare-checkmark icon
                if (item === productId) this.updateCompareIcon(this.button);
            });
        }

        hideCompareLink() {
            document
                .getElementById(CompareUtils.compareLinkId)
                ?.classList.remove("_active");
        }

        disconnectedCallback() {
            this.button?.removeEventListener(
                "click",
                this.onButtonClick.bind(this)
            );
        }
    }

    customElements.define("compare-add-button", CompareAddButton);
}

if (!customElements.get("compare-products-link")) {
    class CompareProductsLink extends HTMLElement {
        constructor() {
            super();

            this.link = this;
        }

        connectedCallback() {
            this.link?.addEventListener(
                "click",
                this.compareLinkDetails.bind(this)
            );
        }

        compareLinkDetails(e) {
            const popup = document.getElementById(CompareUtils.comparePopup);
            popup?.popupContent?.();
        }

        showComparePopup() {
            const popup = document.getElementById(CompareUtils.comparePopup);
            popup?.removeAttribute("hidden");
            popup?.setAttribute("open", true);
            document.body.setAttribute("data-compare-opened", true);
        }

        disconnectedCallback() {
            this.link?.removeEventListener(
                "click",
                this.compareLinkDetails.bind(this)
            );
        }
    }

    customElements.define("compare-products-link", CompareProductsLink);
}

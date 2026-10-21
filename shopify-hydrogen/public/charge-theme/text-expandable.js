if (!customElements.get("text-expandable")) {
    class TextExpandable extends HTMLElement {
        constructor() {
            super();

            if (this.isSafariBrowser())
                this.classList.add("fallback--max-height");
            new ResizeObserver(this.toggleButton.bind(this)).observe(this);
            this.toggleButton();

            this.expandBtn =
                this.querySelector(".expand") || this.prepareButton();
            this.narrowBtn =
                this.querySelector(".narrow") || this.prepareButton();

            this.expandBtn?.addEventListener("click", (event) => {
                this.toggleDescription(event);
            });

            this.narrowBtn?.addEventListener("click", (event) => {
                this.toggleDescription(event);
            });
        }

        toggleDescription(e) {
            e.preventDefault();

            if (e.target.classList.contains("expand")) {
                this.dataset.expanded = true;
            } else {
                this.dataset.expanded = false;
            }

            this.toggleHiddenAttribute();
        }

        toggleButton() {
            const buttonExpand =
                this.querySelector(".expand") || this.prepareButton();

            if (this.scrollHeight !== this.clientHeight)
                buttonExpand.style.setProperty("visibility", "visible");
            else buttonExpand.style.setProperty("visibility", "hidden");
        }

        toggleHiddenAttribute() {
            const buttonNarrow =
                this.querySelector(".narrow") || this.prepareButton();

            this.smoothScrollToTop();

            if (this.dataset.expanded === "true")
                buttonNarrow.removeAttribute("hidden");
            else buttonNarrow.setAttribute("hidden", true);
        }

        prepareButton() {
            this.insertAdjacentHTML(
                "beforeend",
                `<a href="#" class="expand">${this.dataset.buttonTextExpand}</a>` +
                    `<a href="#" class="narrow" hidden>${this.dataset.buttonTextNarrow}</a>`
            );

            return (
                this.querySelector(".expand") || this.querySelector(".narrow")
            );
        }

        isSafariBrowser() {
            return (
                navigator.userAgent.includes("Instagram") ||
                /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
            );
        }

        smoothScrollToTop() {
            const sectionsPreventFromScrolling = [
                "#PopupModal-quickView",
                ".featured--product",
            ];

            const preventScrolling = sectionsPreventFromScrolling.some(
                (selector) => this.closest(selector)
            );
            if (preventScrolling) return;

            const stickyHeader = document.querySelector("sticky-header");

            window.scroll({
                top: this.offsetTop - (stickyHeader?.clientHeight || 10),
                behavior: "smooth",
            });
        }
    }

    customElements.define("text-expandable", TextExpandable);
}

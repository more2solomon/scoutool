if (!customElements.get("filter-category")) {
    class FilterCategory extends HTMLElement {
        constructor() {
            super();

            this.filter = this;
            this.elements = {
                input: document.querySelector("#filter-category-input"),
                button: this.querySelector("button"),
                list: this.querySelector("ul"),
            };

            if (!this.filter || !this.elements.list || !this.elements.input)
                return;
        }

        connectedCallback() {
            this.elements.button?.addEventListener(
                "click",
                this.openCategoryList.bind(this)
            );
            document.body.addEventListener(
                "click",
                this.handleBodyClick.bind(this)
            );
            this.addEventListener("keyup", this.handleKeyup.bind(this));

            this.querySelectorAll("a").forEach((item) => {
                item.addEventListener("click", this.onItemClick.bind(this));
            });
        }

        openCategoryList() {
            if (this.elements.list.hasAttribute("hidden")) {
                this.elements.list.removeAttribute("hidden");
                this.elements.button.setAttribute("aria-expanded", true);
            } else {
                this.elements.list.setAttribute("hidden", true);
                this.elements.button.setAttribute("aria-expanded", false);
            }
        }

        onItemClick(event) {
            event.preventDefault();
            this.querySelectorAll("a").forEach((item) =>
                item.classList.remove("active")
            );
            this.elements.input.value = event.currentTarget.dataset.value;
            this.elements.button.children[0].innerHTML =
                event.currentTarget.innerText.toLowerCase();
            event.currentTarget.classList.add("active");
            document.querySelector("predictive-search")?.onChange?.();
        }

        handleBodyClick(event) {
            if (!this.elements.button.contains(event.target))
                this.closeSelector(event);
        }

        handleKeyup(event) {
            if (event.code.toUpperCase() === "ESCAPE") {
                this.closeSelector(event);
                event.stopPropagation();
            }
        }

        closeSelector(event) {
            const shouldClose =
                event.relatedTarget &&
                event.relatedTarget.nodeName === "BUTTON";
            if (
                event.relatedTarget === null ||
                typeof event.relatedTarget === "undefined" ||
                shouldClose
            ) {
                this.elements.button.setAttribute("aria-expanded", "false");
                this.elements.list.setAttribute("hidden", true);
            }

            document.body.removeEventListener("click", this.onBodyClick);
        }

        disconnectedCallback() {
            this.elements.button?.removeEventListener(
                "click",
                this.openCategoryList
            );
        }
    }

    customElements.define("filter-category", FilterCategory);
}

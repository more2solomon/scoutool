class MenuDrawer extends HTMLElement {
    constructor() {
        super();

        this.mainDetailsToggle = this.querySelector("details");
        this.overlay = document.querySelector(".header-menu__overlay-element");
        const summaryElements = this.querySelectorAll("summary");
        this.addAccessibilityAttributes(summaryElements);

        if (navigator.platform === "iPhone")
            document.documentElement.style.setProperty(
                "--viewport-height",
                `${window.innerHeight}px`
            );

        this.addEventListener("keyup", this.onKeyUp.bind(this));
        this.addEventListener("focusout", this.onFocusOut.bind(this));
        this.bindEvents();
    }

    bindEvents() {
        this.querySelectorAll("summary").forEach((summary) =>
            summary.addEventListener("click", this.onSummaryClick.bind(this))
        );
        this.querySelectorAll("button:not(.disclosure__button)").forEach(
            (button) =>
                button.addEventListener(
                    "click",
                    this.onCloseButtonClick.bind(this)
                )
        );
    }

    addAccessibilityAttributes(summaryElements) {
        summaryElements.forEach((element) => {
            element.setAttribute("role", "button");
            element.setAttribute("aria-expanded", false);
            element.setAttribute(
                "aria-controls",
                element.nextElementSibling.id
            );
        });
    }

    onKeyUp(event) {
        if (event.code.toUpperCase() !== "ESCAPE") return;

        const openDetailsElement = event.target.closest("details[open]");
        if (!openDetailsElement) return;

        openDetailsElement === this.mainDetailsToggle
            ? this.closeMenuDrawer(
                  this.mainDetailsToggle.querySelector("summary")
              )
            : this.closeSubmenu(openDetailsElement);
    }

    onSummaryClick(event) {
        const summaryElement = event.currentTarget;
        const detailsElement = summaryElement.parentNode;
        const isOpen = detailsElement.hasAttribute("open");

        const details = this.querySelectorAll("details");
        // close all parent details except the current one
        details?.forEach((detail) => {
            if (detail.classList.contains("menu-drawer-container")) return;
            if (
                !isOpen &&
                !!detailsElement.closest(".menu-drawer__top-level-menu") &&
                !!!detailsElement.closest(".menu-drawer__child-menu")
            ) {
                detail.removeAttribute("open");
            }
            // close all child details except the current
            if (
                detail !== detailsElement &&
                detail.closest(".menu-drawer__child-menu")
            ) {
                detail.classList.remove("menu-opening");
                detail.removeAttribute("open");
            }
        });

        if (detailsElement === this.mainDetailsToggle) {
            if (isOpen) event.preventDefault();
            isOpen
                ? this.closeMenuDrawer(summaryElement)
                : this.openMenuDrawer(summaryElement);
            this.showOverlay();
        } else {
            trapFocus(
                summaryElement.nextElementSibling,
                detailsElement.querySelector("button")
            );

            setTimeout(() => {
                detailsElement.classList.add("menu-opening");
            });
        }
    }

    openMenuDrawer(summaryElement) {
        setTimeout(() => {
            this.mainDetailsToggle.classList.add("menu-opening");
        });
        summaryElement.setAttribute("aria-expanded", true);
        trapFocus(this.mainDetailsToggle, summaryElement);
        document.body.classList.add("overflow-hidden-mobile");
    }

    closeMenuDrawer(event, elementToFocus = false) {
        if (event !== undefined) {
            this.mainDetailsToggle.classList.remove("menu-opening");
            this.mainDetailsToggle
                .querySelectorAll("details")
                .forEach((details) => {
                    details.removeAttribute("open");
                    details.classList.remove("menu-opening");
                });
            this.mainDetailsToggle
                .querySelector("summary")
                .setAttribute("aria-expanded", false);
            removeTrapFocus(elementToFocus);
            this.closeAnimation(this.mainDetailsToggle);
        }
    }

    onFocusOut(event) {
        setTimeout(() => {
            if (
                this.mainDetailsToggle.hasAttribute("open") &&
                !this.mainDetailsToggle.contains(document.activeElement)
            )
                this.closeMenuDrawer();
        });
    }

    onCloseButtonClick(event) {
        const detailsElement = event.currentTarget.closest("details");
        this.closeSubmenu(detailsElement);
    }

    closeSubmenu(detailsElement) {
        detailsElement.classList.remove("menu-opening");
        const details = this.querySelectorAll("details");
        details?.forEach((detail) => {
            if (
                detail.classList.contains("mobile-facets__details") ||
                window.innerWidth > 990
            )
                setTimeout(() => detail.removeAttribute("open"), 200);
        });

        removeTrapFocus();
        this.closeAnimation(detailsElement);
    }

    showOverlay() {
        const elToggled = this;
        if (elToggled.nodeName !== "HEADER-DRAWER") return;

        this.overlay.classList.add("shown");
    }

    removeOverlay() {
        this.overlay.classList.remove("shown");
    }

    closeAnimation(detailsElement) {
        let animationStart;

        const handleAnimation = (time) => {
            if (animationStart === undefined) {
                animationStart = time;
            }

            const elapsedTime = time - animationStart;

            if (elapsedTime < 150) {
                window.requestAnimationFrame(handleAnimation);
            } else {
                detailsElement.removeAttribute("open");
                if (detailsElement == this.mainDetailsToggle) {
                    document.body.classList.remove("overflow-hidden-mobile");
                    this.removeOverlay();
                }
                if (detailsElement.closest("details[open]")) {
                    trapFocus(
                        detailsElement.closest("details[open]"),
                        detailsElement.querySelector("summary")
                    );
                }
            }
        };

        window.requestAnimationFrame(handleAnimation);
    }
}

customElements.define("menu-drawer", MenuDrawer);

class HeaderDrawer extends MenuDrawer {
    constructor() {
        super();
    }

    openMenuDrawer(summaryElement) {
        this.header = this.header || this.closest(".shopify-section");
        this.borderOffset =
            this.borderOffset ||
            this.closest(".header-wrapper").classList.contains(
                "header-wrapper--border-bottom"
            )
                ? 1
                : 0;
        document.documentElement.style.setProperty(
            "--header-bottom-position",
            `${parseInt(
                this.header.getBoundingClientRect().bottom - this.borderOffset
            )}px`
        );

        setTimeout(() => {
            this.mainDetailsToggle.classList.add("menu-opening");
        });

        summaryElement.setAttribute("aria-expanded", true);
        trapFocus(this.mainDetailsToggle, summaryElement);
        document.body.classList.add("overflow-hidden-mobile");
    }
}

customElements.define("header-drawer", HeaderDrawer);

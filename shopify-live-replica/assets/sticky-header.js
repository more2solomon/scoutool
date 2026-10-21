if (!customElements.get("sticky-header")) {
    class StickyHeader extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            this.header = document.querySelector("sticky-header").parentElement;
            this.menu = document.querySelector(
                "sticky-header .header__inline-menu"
            );
            this.headerIcons = document.querySelector(
                "sticky-header .header__icons"
            );
            this.predictiveSearch = document.querySelector("predictive-search");

            this.headerBounds = {};
            this.currentScrollTop = 0;

            this.onScrollHandler = {
                scroll: this.onScroll.bind(this),
                resize: this.onResize.bind(this),
            };

            window.addEventListener(
                "scroll",
                this.onScrollHandler.scroll,
                false
            );
            window.addEventListener(
                "resize",
                this.onScrollHandler.resize,
                false
            );

            this.createObserver();
        }

        disconnectedCallback() {
            window.removeEventListener("scroll", this.onScrollHandler.scroll);
            window.removeEventListener("resize", this.onScrollHandler.resize);
        }

        createObserver() {
            let observer = new IntersectionObserver((entries, observer) => {
                this.headerBounds = entries[0].intersectionRect;
                observer.disconnect();
            });

            observer.observe(this.header);
        }

        onResize() {
            return window.innerWidth;
        }

        onScroll() {
            requestAnimationFrame(this.reveal.bind(this));

            const scrollTop =
                window.pageYOffset || document.documentElement.scrollTop;
            const scrollTrigger = 500;

            let updateHeaderHeightOnDesktop =
                    this.header?.offsetHeight - this.menu?.offsetHeight - 13, // minus padding-top
                updateHeaderHeightOnMobile =
                    this.header?.offsetHeight -
                    this.headerIcons?.offsetHeight -
                    24; // minus 1.5rem padding top

            if (this.onResize() > 980 && this.menuHeight < 60)
                updateHeaderHeightOnDesktop = updateHeaderHeightOnMobile;

            if (scrollTop < this.currentScrollTop) {
                this.header.style.top = "0";
            } else {
                // prevent header scroll animation if search uses.
                if (this.predictiveSearch?.hasAttribute("open")) return;

                if (this.onResize() > 980)
                    this.header.style.top =
                        updateHeaderHeightOnDesktop > 0
                            ? "-" + updateHeaderHeightOnDesktop + "px"
                            : "0";
                else
                    this.header.style.top =
                        updateHeaderHeightOnMobile > 0
                            ? "-" + updateHeaderHeightOnMobile + "px"
                            : "0";
            }

            this.currentScrollTop = scrollTop;
        }

        reveal() {
            if (this.header.style.top == "0px") {
                if (
                    document.documentElement.scrollTop >
                    this.header.offsetHeight * 2
                )
                    this.applySticky();
                else this.reset();
            } else this.applySticky();
        }

        applySticky() {
            this.header.classList.add("section-header-sticky");
            this.header.classList.remove("sticky-animation");
        }

        reset() {
            this.header.classList.add("sticky-animation");
            this.header.classList.remove("section-header-sticky");
            this.closeMenuDisclosure();
            this.closeSearchModal();
        }

        closeMenuDisclosure() {
            this.disclosures =
                this.disclosures ||
                this.header.querySelectorAll("details-disclosure");
            this.disclosures.forEach((disclosure) => disclosure.close());
        }

        closeSearchModal() {
            this.searchModal =
                this.searchModal || this.header.querySelector("details-modal");
            this.searchModal && this.searchModal.close(false);
        }
    }

    customElements.define("sticky-header", StickyHeader);
}

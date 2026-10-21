class cartSidebar extends HTMLElement {
    constructor() {
        super();

        this.onBodyClick = this.handleBodyClick.bind(this);
        this.cartButton = document.getElementById("cart-icon-bubble");
        this.cartButton?.addEventListener("click", (event) => {
            event.preventDefault();
            this.toggle(event.target);
        });

        this.bindCartUpdate();
        this.querySelector(".modal__close-button").addEventListener(
            "click",
            this.close.bind(this)
        );
        this.addEventListener("keydown", this.handleKeydown.bind(this));
    }

    handleBodyClick(event) {
        if (
            !this.cartButton.contains(event.target) &&
            !this.contains(event.target)
        ) {
            // unset active element when clicked somewhere on body
            // to prevent page jump back to active element once focus restored
            this.setActiveElement(null);
            this.close();
        }
    }

    handleKeydown(event) {
        if (event.code.toUpperCase() === "ESCAPE") this.close();
    }

    open(openedBy) {
        const focusElement =
            this.querySelector('[name="checkout"]') ||
            this.querySelector(".modal__close-button");

        if (this.dataset.status === "open") return;

        this.dataset.status = "open";
        this.reinitPreloadImages(); // reinit preload images
        document.body.dataset.cartStatus = this.dataset.status;
        if (this.parentNode.tagName === "BODY") {
            document.body.style.width = `${window.visualViewport.width}px`;
            document.body.style.overflow = "hidden";
        }

        document.body.addEventListener("click", this.onBodyClick);

        // add short delay so browser could find element to focus
        // when there is animations it can be tricky for browser
        setTimeout(() => {
            if (openedBy) this.setActiveElement(openedBy);
            trapFocus(this, focusElement);
        }, 100);

        // clean up old messages before output
        this.querySelectorAll(".message-wrapper").forEach((el) => el.remove());
    }

    close() {
        document.body.dataset.cartStatus = this.dataset.status = "close";
        document.body.removeEventListener("click", this.onBodyClick);
        removeTrapFocus(this.activeElement);
        if (!this.closest("header"))
            setTimeout(() => {
                document.body.style.width = "";
                document.body.style.overflow = "";
            }, 200);
    }

    toggle(toggledBy) {
        if (this.dataset.status === "open") this.close();
        else this.open(toggledBy);
    }

    reinitPreloadImages() {
        const cartItems = document.getElementById("cart-sidebar-items");
        const list =
            cartItems && cartItems.querySelectorAll(".media--blur-image");
        if (!list.length) return;

        _preloadImg?.(list, true);
    }

    renderContents(parsedState) {
        this.productId = parsedState.id;
        this.getSectionsToRender().forEach((section) => {
            if (document.getElementById(section.id) !== null) {
                document.getElementById(section.id).innerHTML =
                    this.getSectionInnerHTML(
                        parsedState.sections?.[section.id],
                        section.selector
                    );
            }
        });

        this.classList.remove("updating");
        this.revealStickyHeaderAndOpen() || this.open();
    }

    revealStickyHeaderAndOpen(openedBy) {
        const sticky = this.closest("sticky-header");
        const header = sticky && sticky.header;

        // sticky header already revealed
        if (header && header.classList.contains("section-header-sticky"))
            return false;

        if (sticky && sticky.reveal) {
            let revealDuration =
                header && getComputedStyle(header).transitionDuration;

            if (revealDuration.endsWith("s")) {
                // css value in seconds
                sticky.reveal();
                setTimeout(
                    this.open.bind(this, openedBy),
                    parseFloat(revealDuration) * 1000
                );

                return true;
            }
        }

        return false;
    }

    getSectionsToRender() {
        return [
            {
                id: "cart-icon-bubble",
                section: "cart-icon-bubble",
            },
            {
                id: "cart-sidebar-items",
                section: "cart-sidebar-items",
            },
            {
                id: "cart-sidebar-footer",
                section: "cart-sidebar-footer",
            },
            {
                id: "cart-sidebar-shipping-bar",
                section: "cart-sidebar-shipping-bar",
            },
        ];
    }

    getSectionInnerHTML(html, selector = ".shopify-section") {
        return new DOMParser()
            .parseFromString(html, "text/html")
            .querySelector(selector).innerHTML;
    }

    updateSections(source = {}) {
        this.getSectionsToRender().forEach(({ id, section, selector }) => {
            const target = document.getElementById(id);
            if (!target || !source[section]) return;

            const el = target.querySelector(selector) || target;
            el.innerHTML = this.getSectionInnerHTML(source[section], selector);
        });
    }

    reload() {
        this.classList.add("updating");

        return fetch(
            window.location.pathname +
                "?sections=" +
                this.getSectionsToRender()
                    .map((section) => section.id)
                    .join(",")
        )
            .then((response) => response.text())
            .then((text) => JSON.parse(text))
            .then((json) => {
                this.updateSections(json);
                this.classList.remove("updating");

                return json;
            });
    }

    bindCartUpdate() {
        const debouncedOnChange = debounce((event) => {
            const input = event.target;
            this.updateQuantity(input.dataset.line, input.value);
        }, 500);

        this.addEventListener("click", (event) => {
            const link = event.target.closest("a[href]");
            if (!link) return;

            // event on remove item link
            if (link.href.indexOf(routes.cart_change_url) == -1) {
                this.removeItem(event.target);
                return;
            }

            event.preventDefault();
            // even on btn qty
            this.updateQuantity(
                new URL(link?.href).searchParams.get("line"),
                new URL(link?.href).searchParams.get("quantity")
            );
        });

        // listen qunatity change via input
        this.addEventListener("input", debouncedOnChange);
    }

    removeItem(item) {
        item = item.closest(".cart-item__remove");

        if (!item) return;
        this.classList.add("updating");

        const line = item?.dataset?.line;
        const quantity = 0;
        const body = JSON.stringify({
            line,
            quantity,
            sections: this.getSectionsToRender().map((s) => s.id),
        });

        fetch(`${routes.cart_change_url}`, { ...fetchConfig(), body })
            .then((r) => r.json())
            .then((response) => {
                if (response.errors) {
                    console.error(response.errors);
                    return;
                }
                this.updateSections(response.sections);
            })
            .finally(() => {
                this.classList.remove("updating");
                this.reinitPreloadImages();
            });
    }

    updateQuantity(line, quantity) {
        if (this.classList.contains("updating")) return;
        this.classList.add("updating");

        const rawLine = line;
        const rawQuantity = quantity;

        line = Number(line);
        quantity = Number(quantity);

        const isValidLine = Number.isInteger(line) && line > 0;
        const isValidQuantity = Number.isInteger(quantity) && quantity >= 0;

        // do NOT early return — let Shopify respond so sections stay in sync
        const body = JSON.stringify({
            ...(isValidLine ? { line } : {}),
            ...(isValidQuantity ? { quantity } : {}),
            sections: this.getSectionsToRender().map((s) => s.id),
            sections_url: window.location.pathname,
        });

        fetch(`${routes.cart_change_url}`, { ...fetchConfig(), body })
            .then((r) => r.json())
            .then((response) => {
                // update sections if it's exist
                if (response?.sections) {
                    this.updateSections(response.sections);
                }
                // responce error
                if (response?.errors) {
                    let message = response.errors;
                    if (message === "Cart Error") {
                        message = window.cartStrings.quantityError;
                    }

                    this.renderQtyError(isValidLine ? line : null, message);
                }
                // error on QTY
                if (isValidLine && isValidQuantity && quantity > 0) {
                    const item = response.items?.[line - 1];
                    if (item && item?.quantity !== quantity) {
                        this.renderQtyError(
                            line,
                            window.cartStrings.quantityError
                        );
                    }
                }
            })
            .catch((err) => {
                console.error("Cart-sidebar updateQuantity failed", err);
            })
            .finally(() => {
                this.classList.remove("updating");
                this.reinitPreloadImages();
            });
    }

    renderQtyError(item, error) {
        const cartItems = document.getElementById("cart-sidebar-items");
        const cartItem = cartItems.querySelector(
            `.cart-sidebar__item[data-line="${item}"]`
        );
        let message = this.querySelector(".message-wrapper");
        if (!message) {
            message = createFromTemplate("message-wrapper");
        }

        cartItems.insertBefore(message, cartItem);
        message.querySelector(".error-message").innerHTML = error;
        message.removeAttribute("hidden");
    }

    setActiveElement(element) {
        this.activeElement = element;
    }
}

customElements.define("cart-sidebar", cartSidebar);

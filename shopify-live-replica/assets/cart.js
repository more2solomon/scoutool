class CartRemoveButton extends HTMLElement {
    constructor() {
        super();

        this.addEventListener("click", (event) => {
            event.preventDefault();
            this.closest("cart-items").updateQuantity(this.dataset.index, 0);
            showNotificationOnRemoveItem();
        });
    }
}

customElements.define("cart-remove-button", CartRemoveButton);

class CartItems extends HTMLElement {
    constructor() {
        super();

        this.lineItemStatusElement = document.getElementById(
            "shopping-cart-line-item-status"
        );

        this.currentItemCount = Array.from(
            this.querySelectorAll('[name="updates[]"]')
        ).reduce(
            (total, quantityInput) => total + parseInt(quantityInput.value),
            0
        );

        this.debouncedOnChange = debounce((event) => {
            this.onChange(event);
        }, 300);

        this.addEventListener("change", this.debouncedOnChange.bind(this));
    }

    onChange(event) {
        this.updateQuantity(
            event.target.dataset.index,
            event.target.value,
            document.activeElement.getAttribute("name")
        );
    }

    getSectionsToRender() {
        return [
            {
                id: "main-cart-items",
                section: document.getElementById("main-cart-items").dataset.id,
                selector: "#main-cart-items .js-contents",
            },
            {
                id: "cart-icon-bubble",
                section: "cart-icon-bubble",
                selector: ".shopify-section",
            },
            {
                id: "cart-live-region-text",
                section: "cart-live-region-text",
                selector: ".shopify-section",
            },
            {
                id: "main-cart-footer",
                section: document.getElementById("main-cart-footer").dataset.id,
                selector: "#main-cart-footer .js-contents",
            },
        ];
    }

    async updateRevealAnimation() {
        const revealItems = document.querySelectorAll(".reveal-slide-in");
        typeof onReveal === "function" &&
            revealItems.length &&
            (await onReveal(revealItems));
    }

    async reinitPreloadImages() {
        const cartItems = document.getElementById("main-cart-items");
        const list =
            cartItems && cartItems.querySelectorAll(".media--blur-image");
        list && list.length > 0 && (await _preloadImg?.(list, true));
    }

    updateQuantity(line, quantity, name) {
        this.enableLoading(line);

        if (quantity == 0) showNotificationOnRemoveItem();

        const body = JSON.stringify({
            line,
            quantity,
            sections: this.getSectionsToRender().map(
                (section) => section.section
            ),
            sections_url: window.location.pathname,
        });

        fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
            .then((response) => {
                return response.text();
            })
            .then((state) => {
                const parsedState = JSON.parse(state);
                this.classList.toggle("is-empty", parsedState.item_count === 0);
                document
                    .getElementById("main-cart-footer")
                    ?.classList.toggle(
                        "is-empty",
                        parsedState.item_count === 0
                    );

                this.updateSections(parsedState);

                this.updateLiveRegions(line, parsedState.item_count);
                document
                    .getElementById(`CartItem-${line}`)
                    ?.querySelector(`[name="${name}"]`)
                    ?.focus();
                this.disableLoading(line);
                this.updateRevealAnimation();
                this.reinitPreloadImages(); // reinit preload images
            })
            .catch(() => {
                this.querySelectorAll(".loading-overlay").forEach((overlay) =>
                    overlay.classList.add("hidden")
                );

                this.showQuantityErrorMessage(line);
                this.disableLoading(line);
                this.updateRevealAnimation();
                this.reinitPreloadImages(); // reinit preload images
            });
    }

    updateSections(source = {}) {
        this.getSectionsToRender().forEach((section) => {
            const elementToReplace =
                document
                    .getElementById(section.id)
                    .querySelector(section.selector) ||
                document.getElementById(section.id);

            elementToReplace.innerHTML = this.getSectionInnerHTML(
                source.sections[section.section],
                section.selector
            );
        });

        this.updateRevealAnimation();
    }

    showQuantityErrorMessage(line) {
        if (line === "undefined") return;
        const itemDetails = document.querySelector(
            `#CartItem-${line} .cart-item__details`
        );
        let message = itemDetails?.querySelector(".message-wrapper");
        const itemQty = itemDetails
            ?.closest(".cart-item")
            .querySelector(".cart-item__quantity");
        itemQty?.querySelector("button.plus").setAttribute("disabled", true);

        if (!message && itemDetails) {
            message = createFromTemplate("message-wrapper");
            itemDetails.append(message);
        }

        message.removeAttribute("hidden");
        message.querySelector(".error-message").innerHTML =
            window.cartStrings.quantityError.replace(
                "[quantity]",
                document.getElementById(`Quantity-${line}`).value
            );
    }

    updateLiveRegions(line, itemCount) {
        if (this.currentItemCount === itemCount)
            this.showQuantityErrorMessage(line);

        this.currentItemCount = itemCount;
        this.lineItemStatusElement.setAttribute("aria-hidden", true);

        const cartStatus = document.getElementById("cart-live-region-text");
        cartStatus.setAttribute("aria-hidden", false);

        setTimeout(() => {
            cartStatus.setAttribute("aria-hidden", true);
        }, 1000);
    }

    getSectionInnerHTML(html, selector) {
        return new DOMParser()
            .parseFromString(html, "text/html")
            .querySelector(selector).innerHTML;
    }

    enableLoading(line) {
        const itemTotals = this.querySelectorAll(".cart-item__totals").item(
            line - 1
        );

        if (!itemTotals.querySelector(".loading-overlay")) {
            itemTotals.prepend(createFromTemplate("template-loading-overlay"));
        }
        itemTotals && itemTotals.classList.add("loading");
        document
            .getElementById("main-cart-items")
            .classList.add("cart__items--disabled");
        document.activeElement.blur();
        this.lineItemStatusElement.setAttribute("aria-hidden", false);
    }

    disableLoading(line) {
        const itemTotals = this.querySelectorAll(".cart-item__totals").item(
            line - 1
        );
        itemTotals && itemTotals.classList.remove("loading");
        document
            .getElementById("main-cart-items")
            .classList.remove("cart__items--disabled");
    }
}

customElements.define("cart-items", CartItems);

class CartNote extends HTMLElement {
    constructor() {
        super();

        this.addEventListener(
            "change",
            debounce((event) => {
                const body = JSON.stringify({ note: event.target.value });
                fetch(`${routes.cart_update_url}`, {
                    ...fetchConfig(),
                    ...{ body },
                });
            }, 300)
        );
    }
}

customElements.define("cart-note", CartNote);

//Apply discount code form
class DiscountCode extends HTMLElement {
    constructor() {
        super();
        const discountForm = this.querySelector("#discount-form");

        if (!discountForm) return;

        const input = discountForm[0];
        input.addEventListener("input", this.onInputType.bind(this));

        discountForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const discountInput = this.querySelector("#discount-code");
            const discountCode = discountInput?.value?.trim();

            if (!discountCode) return;

            const body = JSON.stringify({
                quantity: undefined, // will preserve current quantity
                discount: discountCode,
                sections: document
                    .querySelector("cart-items")
                    .getSectionsToRender?.()
                    .map((section) => section.section),
                sections_url: window.location.pathname,
            });

            fetch(`${routes.cart_update_url}`, {
                ...fetchConfig(),
                ...{ body },
            })
                .then((response) => {
                    return response.text();
                })
                .then((cart) => {
                    const jsonCart = JSON.parse(cart);
                    let codes = jsonCart.discount_codes[0];
                    if (!codes.applicable || jsonCart.error) {
                        localStorage.setItem("discountCode", "");
                        const error_message =
                            this.querySelector("#discount-error");
                        error_message?.classList.remove("hidden");
                        setTimeout(() => {
                            error_message?.classList.add("hidden");
                        }, 3500);
                        return;
                    }

                    //console.log('Discount code is applied:', cart);
                    discountInput.value = discountCode;
                    localStorage.setItem("discountCode", discountCode);
                    document
                        .querySelector("cart-items")
                        ?.updateSections?.(jsonCart);
                })
                .catch((err) => {
                    console.error("Failed to apply discount:", err);
                });
        });

        // Retrieve saved value on page load
        const storedValue = localStorage.getItem("discountCode");
        if (storedValue) {
            const discountInput = this.querySelector("#discount-code");
            if (discountInput) {
                discountInput.value = storedValue;
                discountInput.placeholder = storedValue;
            }
        }
    }

    onInputType(e) {
        const { target } = e;
        const button = this.querySelector("button");
        button.disabled = target.value.trim() === "";
    }
}

customElements.define("discount-code", DiscountCode);

function windowScrollToTop() {
    const scrollTrigger = 300;
    let scrollTop = window.scrollY;

    if (scrollTop > scrollTrigger)
        window.scroll({ top: 20, behavior: "smooth" });
}

function showNotificationOnRemoveItem() {
    this.flowNotification = document.getElementById("flow-notification");

    if (this.flowNotification) {
        windowScrollToTop();

        setTimeout(() => {
            this.flowNotification.classList.remove("hidden");
        }, 500);

        setTimeout(() => {
            this.flowNotification.classList.add("hidden");
        }, 3500);
    }
}

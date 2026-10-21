if (!customElements.get("variant-selects")) {
    class VariantSelects extends HTMLElement {
        constructor() {
            super();

            this.addEventListener("change", this.onVariantChange);

            // variants
            this.variants = this.querySelectorAll("[data-product-form]");

            // stock counter block
            this.availableVariants = document.querySelectorAll(
                "input.variant__configurable"
            );
            this.stockCounterContainer = document.querySelectorAll(
                ".stock__counter.configurable"
            );

            /** on page refresh
             * update selected variant stock status label
             * update mark unavailable variants
             */
            this.updateVariantsStockOptions();
        }

        updateVariantsStockOptions() {
            if (!!!this.getVariantData()) return;

            // get the first available variant
            const firstAvailableVariant = this.getVariantData().find(
                (variant) => variant.available
            );
            const variantId =
                new URLSearchParams(window.location.search).get("variant") ??
                firstAvailableVariant?.id ??
                this.getVariantData()[0]?.id;

            this.markUnavailableVariant();

            this.getVariantData().find((variant) => {
                if (variantId && variant.id == variantId) {
                    this.showStockCounterConfigurableProducts(variant);
                }
            });
        }

        onVariantChange(event) {
            const variants = event.target.closest(".variants");
            if (!variants) return;

            const sectionId = variants.dataset.section;
            const oldProductUrl = variants.dataset.url;

            const optionValueElement =
                event.target.closest("[data-product-url]") ||
                event.target.selectedOptions[0];
            const newProductUrl =
                optionValueElement?.dataset.productUrl || this.dataset.url;
            // collect selected radios or selects
            const selectedOptionValues = this.selectedOptions();

            const params = selectedOptionValues.length
                ? `&option_values=${selectedOptionValues.join(",")}`
                : "";
            const url = `${newProductUrl}?section_id=${sectionId}${params}`;

            fetch(url)
                .then((response) => response.text())
                .then((text) => {
                    const html = new DOMParser().parseFromString(
                        text,
                        "text/html"
                    );

                    // if switching products - replace product section
                    // if the option value may be associated with another product
                    if (newProductUrl && oldProductUrl !== newProductUrl) {
                        const newVariants = html.querySelector(".variants");
                        if (newVariants) {
                            variants.replaceWith(newVariants);
                            document
                                .querySelector(`#${event.target.id}`)
                                ?.focus();
                        }
                        return;
                    }

                    // if same product - refresh option picker only
                    const group = event.target.closest("[data-option-index]");
                    if (group) {
                        const idx = group.dataset.optionIndex;
                        const newGroup = html.querySelector(
                            `[data-option-index="${idx}"]`
                        );

                        if (newGroup) {
                            const oldSelect = group.querySelector("select");
                            const newSelect = newGroup.querySelector("select");

                            if (oldSelect && newSelect) {
                                // it's a <select> group - sync options instead of replacing
                                const selectedValue = oldSelect.value;
                                oldSelect.innerHTML = newSelect.innerHTML;
                                if (selectedValue) {
                                    const optionToSelect =
                                        oldSelect.querySelector(
                                            `[value="${CSS.escape(
                                                selectedValue
                                            )}"]`
                                        );
                                    //re-check the previously selected value
                                    if (optionToSelect)
                                        optionToSelect.selected = true;
                                }
                            } else {
                                // it's radios - replace whole group
                                const selectedValue = group.querySelector(
                                    "[type=radio]:checked"
                                )?.value;

                                group.innerHTML = newGroup.innerHTML;

                                if (selectedValue) {
                                    const matchingInput = group.querySelector(
                                        `[value="${CSS.escape(selectedValue)}"]`
                                    );
                                    //re-check the previously selected value
                                    if (matchingInput)
                                        matchingInput.checked = true;
                                }
                            }

                            // focus back on changed element
                            const focusedSelector = `[data-option-value-id="${optionValueElement?.dataset?.optionValueId}"]`;
                            const newFocus =
                                this.querySelector(focusedSelector) ||
                                document.querySelector(focusedSelector);
                            newFocus?.focus();
                        }
                    }

                    this.updateOptions();
                    this.updateMasterId();
                    this.toggleAddButton(true, "", false);
                    this.updatePickupAvailability();
                    this.removeErrorMessage();
                    this.markUnavailableVariant();

                    if (!this.currentVariant) {
                        this.toggleAddButton(true, "", true);
                        this.setUnavailable();
                        this.showStockCounterConfigurableProducts(
                            !this.currentVariant
                        );
                    } else {
                        this.updateMedia();
                        this.updateURL();
                        this.updateVariantInput();
                        this.renderProductInfo();
                        this.showStockCounterConfigurableProducts(
                            this.currentVariant
                        );
                    }
                })
                .catch(console.error);
        }

        markUnavailableVariant() {
            if (this.dataset.markUnavailableVariant == "false") return;

            const findVariant = (options) =>
                this.getVariantData().find(
                    (v) => v.options.join(",") === options.join(",")
                );

            this.variants.forEach((form) => {
                const select = form.querySelector("select");
                const radios = form.querySelectorAll("[type=radio]");

                if (select) {
                    for (let item of select.options) {
                        let variant,
                            options = this.selectedOptions();

                        options[form.dataset.optionIndex] = item.value;
                        variant = findVariant(options);
                        if (variant)
                            if (variant.available)
                                item.removeAttribute("disabled");
                            else item.setAttribute("disabled", true);
                        else item.setAttribute("disabled", true);
                    }
                }

                radios.forEach((radio) => {
                    let variant,
                        options = this.selectedOptions();

                    options[form.dataset.optionIndex] = radio.value;
                    variant = findVariant(options);

                    if (variant)
                        radio.classList[variant.available ? "remove" : "add"](
                            "unavailable-option"
                        );
                    else radio.classList.add("unavailable-option");
                });
            });
        }

        selectedOptions() {
            const options = [];

            this.querySelectorAll("[data-product-form]").forEach((form) => {
                options[form.dataset.optionIndex] = form.querySelector(
                    "[type=radio]:checked, select"
                ).value;

                this.updateLegendLabel(
                    form.querySelector("[type=radio]:checked, select")
                );
            });

            return options;
        }

        setOptionName(name, labelName, input) {
            name.innerHTML =
                labelName +
                ":&nbsp;" +
                '<span class="lighter _capitalize">' +
                input.value +
                "</span>";
        }

        updateLegendLabel(input) {
            const label = input.closest(
                ".product-form__input"
            ).firstElementChild;
            const labelName =
                input.firstElementChild?.dataset.optionName || input.name;

            setTimeout(() => {
                this.setOptionName(label, labelName, input);
            });
        }

        updateOptions() {
            this.options = Array.from(
                this.querySelectorAll("select"),
                (select) => select.value
            );
        }

        updateMasterId() {
            this.currentVariant = this.getVariantData().find((variant) => {
                return !variant.options
                    .map((option, index) => {
                        return this.options[index] === option;
                    })
                    .includes(false);
            });
        }

        updateMedia() {
            if (!this.currentVariant || !this.currentVariant?.featured_media)
                return;
            const gallery = document.getElementById(
                `gallery-${this.dataset.section}`
            );

            if (!gallery) return;
            gallery.sliderItems.forEach((item, index) => {
                if (
                    item.dataset.mediaId ==
                    this.currentVariant.featured_media.id
                ) {
                    gallery.activateSlide(item);
                }
            });
        }

        updateURL() {
            if (!this.currentVariant || this.dataset.updateUrl === "false")
                return;
            window.history.replaceState(
                {},
                "",
                `${this.dataset.url}?variant=${this.currentVariant.id}`
            );
        }

        removeErrorMessage() {
            const section = this.closest("section");
            if (!section) return;

            const productForm = section.querySelector("product-form");
            if (productForm) productForm.handleErrorMessage?.();
        }

        updateVariantInput() {
            const productForms = document.querySelectorAll(
                `#product-form-${this.dataset.section}, #product-form-${this.dataset.section}-${this.dataset.productId}, #product-form-installment, #product-form-add-to-cart-sticky`
            );
            productForms.forEach((productForm) => {
                const input = productForm.querySelector('input[name="id"]');
                input.value = this.currentVariant.id;
                input.dispatchEvent(new Event("change", { bubbles: true }));
            });
        }

        updatePickupAvailability() {
            const pickUpAvailability = document.querySelector(
                "pickup-availability"
            );
            if (!pickUpAvailability) return;

            if (this.currentVariant?.available) {
                pickUpAvailability.fetchAvailability(this.currentVariant.id);
            } else {
                pickUpAvailability.removeAttribute("available");
                pickUpAvailability.innerHTML = "";
            }
        }

        renderProductInfo() {
            const ids = this.getUpdatable();

            fetch(
                `${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`
            )
                .then((response) => response.text())
                .then((responseText) => {
                    const html = new DOMParser().parseFromString(
                        responseText,
                        "text/html"
                    );

                    ids.map((id) => {
                        const destination = document.getElementById(id);
                        const source = html.getElementById(id);

                        if (source && destination)
                            destination.innerHTML = source.innerHTML;
                        destination?.classList.remove("invisible");
                    });

                    this.toggleAddButton(
                        !this.currentVariant?.available,
                        window.variantStrings.soldOut
                    );
                });
        }

        toggleAddButton(disable = true, text, modifyClass = true) {
            const productForm = document.querySelector(
                `#product-form-${this.dataset.section}, #product-form-${this.dataset.section}-${this.dataset.productId}`
            );

            // compatibility with app Tepo Product Option
            const addButton =
                productForm?.querySelector('[name="tcustomizer-add"]') ||
                productForm?.querySelector('[name="add"]');
            if (!addButton) return;

            const stickyAddToCart = document
                .getElementById("product-form-add-to-cart-sticky")
                ?.querySelector('[name="add"]');
            const dynamicPaymentBtn = productForm?.querySelector(
                '[data-shopify="payment-button"]'
            );

            if (disable) {
                addButton.setAttribute("disabled", true);
                stickyAddToCart?.setAttribute("disabled", true);
                dynamicPaymentBtn?.setAttribute("hidden", true);
                if (text) addButton.querySelector(".text").textContent = text;
            } else {
                addButton.removeAttribute("disabled");
                stickyAddToCart?.removeAttribute("disabled", true);
                if (this.setPreorder()) {
                    dynamicPaymentBtn?.setAttribute("hidden", true);
                    addButton.querySelector(".text").textContent =
                        window.variantStrings.preorder;
                } else {
                    dynamicPaymentBtn?.removeAttribute("hidden");
                    addButton.querySelector(".text").textContent =
                        window.variantStrings.addToCart;
                }
            }

            if (!modifyClass) return;
        }

        setUnavailable() {
            const productForm = document.querySelector(
                `#product-form-${this.dataset.section}, #product-form-${this.dataset.section}-${this.dataset.productId}`
            );
            const addButton = productForm?.querySelector('[name="add"]');
            if (!addButton) return;
            addButton.querySelector(".text").textContent =
                window.variantStrings.unavailable;
            document
                .getElementById(`price-${this.dataset.section}`)
                ?.classList.add("invisible");
        }

        setPreorder() {
            const variantId =
                new URLSearchParams(window.location.search).get("variant") ??
                this.getVariantData()[0].id;
            const options = document.querySelectorAll(".options--data");
            let isPreorder = false;

            this.getVariantData().find((variant) => {
                options.forEach((option) => {
                    if (
                        variantId &&
                        variant.id == variantId &&
                        variant.id == option.dataset.variantId
                    ) {
                        if (
                            parseInt(option.dataset.variantQty) <= 0 &&
                            variant.available
                        )
                            isPreorder = true;
                    }
                });
            });

            return isPreorder;
        }

        getVariantData() {
            this.variantData =
                this.variantData ||
                JSON.parse(
                    this.querySelector('[type="application/json"]').textContent
                );
            return this.variantData;
        }

        getUpdatable() {
            var updatable = [];

            document
                .querySelectorAll('[data-updatable="true"]')
                .forEach((el) => {
                    el.id && updatable.push(el.id);
                });

            return updatable;
        }

        resetStockContainerInfo() {
            this.stockCounterContainer[0].dataset.stockQty = "";
            this.stockCounterContainer[0].innerHTML = "";
        }

        showStockCounterConfigurableProducts(currentVariant) {
            if (!this.stockCounterContainer.length) return;

            this.resetStockContainerInfo();

            let title = this.stockCounterContainer[0].dataset.title,
                inStock = this.stockCounterContainer[0].dataset.titleInStock,
                outOfStock =
                    this.stockCounterContainer[0].dataset.titleOutOfStock,
                thresholdQty =
                    this.stockCounterContainer[0].dataset.thresholdQty; // config option thresholdQty

            this.availableVariants.forEach((variant) => {
                /* if variant not available show Out of Stock label */
                if (!currentVariant.available) {
                    this.stockCounterContainer[0].dataset.stockQty =
                        variant.dataset.variantQty;

                    title = title.replace(title, outOfStock);
                    this.stockCounterContainer[0].innerHTML = title;
                }

                if (currentVariant.id == variant.dataset.variantId) {
                    if (
                        parseInt(variant.dataset.variantQty) >
                        parseInt(thresholdQty)
                    ) {
                        this.stockCounterContainer[0].dataset.stockQty =
                            variant.dataset.variantQty;
                        inStock = inStock.replace(
                            "{{ stock_qty }}",
                            variant.dataset.variantQty
                        );

                        title = title.replace(title, inStock); // In Stock X left
                        this.stockCounterContainer[0].innerHTML = title;
                    } else {
                        this.stockCounterContainer[0].dataset.stockQty =
                            variant.dataset.variantQty;

                        title = title.replace("X", variant.dataset.variantQty); // Only X left
                        this.stockCounterContainer[0].innerHTML = title;
                    }
                }
            });
        }
    }

    customElements.define("variant-selects", VariantSelects);

    class VariantRadios extends VariantSelects {
        constructor() {
            super();
        }

        updateOptions() {
            const fieldsets = Array.from(this.querySelectorAll("fieldset"));
            this.options = fieldsets.map((fieldset) => {
                return Array.from(fieldset.querySelectorAll("input")).find(
                    (radio) => radio.checked
                ).value;
            });
        }
    }

    customElements.define("variant-radios", VariantRadios);
}

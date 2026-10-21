if (!customElements.get("product-form")) {
    customElements.define(
        "product-form",
        class ProductForm extends HTMLElement {
            constructor() {
                super();

                this.form = this.querySelector("form");
                this.form
                    .querySelector("[name=id]")
                    ?.removeAttribute?.("disabled");
                this.form.addEventListener(
                    "submit",
                    this.onSubmitHandler.bind(this)
                );

                // gift card product - recipient form
                this.recipientForm = this.querySelector("recipient-form");
            }

            getSubmitButton() {
                var formId = this.form.getAttribute("id");

                return (
                    this.querySelector('[type="submit"]') ||
                    document.querySelector('[form="' + formId + '"]')
                );
            }

            getMessageWrapper() {
                this.messageWrapper =
                    this.messageWrapper ||
                    this.querySelector(".message-wrapper");

                if (this.messageWrapper) {
                    return this.messageWrapper;
                }

                this.messageWrapper = createFromTemplate("message-wrapper");
                this.getSubmitButton()?.after(this.messageWrapper);

                return this.messageWrapper;
            }

            getCartJson() {
                return fetch(window.Shopify.routes.root + "cart.js", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then((response) => response.json());
            }

            async handleSubmitError(response) {
                const cart = document.querySelector("cart-sidebar");
                const itemCount = +cart?.querySelector?.(".cart-sidebar__total")
                    ?.dataset?.itemCount;
                const newCartJson = await this.getCartJson();

                this.handleErrorMessage(response.description);
                if (itemCount === newCartJson.item_count) return;

                await cart.reload();
                let line = 1;
                let variantId = [...this.form.elements].find(
                    (el) => el.name === "id"
                )?.value;
                if (variantId) {
                    newCartJson.items?.forEach?.((item, index) => {
                        if (item.variant_id === +variantId) line = index + 1;
                    });
                }

                cart.revealStickyHeaderAndOpen() || cart.open();
            }

            async onSubmitHandler(evt) {
                const cart = document.querySelector("cart-sidebar");

                if (!cart) {
                    return;
                }

                evt.preventDefault();
                const submitButton = this.getSubmitButton();
                if (submitButton.classList.contains("loading")) return;

                this.handleErrorMessage();

                if (!submitButton.querySelector(".loading-overlay"))
                    submitButton.prepend(
                        createFromTemplate("template-loading-overlay")
                    );

                submitButton.setAttribute("aria-disabled", true);
                submitButton.classList.add("loading");

                const config = fetchConfig("javascript");
                config.headers["X-Requested-With"] = "XMLHttpRequest";
                delete config.headers["Content-Type"];

                const formData = new FormData(this.form);
                cart.setActiveElement &&
                    cart.setActiveElement(document.activeElement);
                formData.append(
                    "sections",
                    cart.getSectionsToRender().map((section) => section.id)
                );

                formData.append("sections_url", window.location.pathname);
                config.body = formData;

                try {
                    const response = await fetch(
                        `${routes.cart_add_url}`,
                        config
                    );
                    const jsonResponse = await response.json();

                    if (!response.ok || jsonResponse.status) {
                        this.handleSubmitError(jsonResponse);
                        return;
                    }

                    if (cart && jsonResponse.sections) {
                        cart.renderContents(jsonResponse);
                    } else {
                        window.location.reload();
                    }

                    // cartSidebar && cartSidebar.triggerCartSidebarOnSubmit(response);
                    // hide gift card recipient form on submit
                    if (this.recipientForm)
                        this.hideRecipientForm(this.recipientForm);

                    // hide quickView popup on submit
                    document
                        .querySelector("#PopupModal-quickView")
                        ?.removeAttribute?.("open");
                } catch (error) {
                    console.error("Error submitting form:", error);
                } finally {
                    submitButton.classList.remove("loading");
                    submitButton.removeAttribute("aria-disabled");
                }
            }

            hideRecipientForm(recipientForm) {
                const input = recipientForm.querySelector("input");
                const fields = recipientForm.querySelector(".recipient-fields");

                if (input.checked) {
                    let animation = fields.animate(
                        { height: [fields.clientHeight + "px", "0"] },
                        { duration: 300, easing: "linear" }
                    );

                    input.checked = false;
                    animation.onfinish = () => {
                        fields.style.height = "0";
                    };
                }
            }

            handleErrorMessage(errorMessage = false) {
                const messageWrapper = this.getMessageWrapper();

                // gift-card recipient form error messages
                if (
                    errorMessage.email ||
                    errorMessage.send_on ||
                    errorMessage.message
                )
                    errorMessage =
                        errorMessage.email ||
                        errorMessage.send_on ||
                        errorMessage.message;

                this.errorMessage =
                    this.errorMessage ||
                    messageWrapper.querySelector(".error-message");
                this.errorMessage.textContent = errorMessage || "";
                if (errorMessage) messageWrapper.removeAttribute("hidden");
                else messageWrapper.setAttribute("hidden", true);
            }
        }
    );
}

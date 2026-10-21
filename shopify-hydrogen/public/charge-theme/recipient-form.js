if (!customElements.get("recipient-form")) {
    class RecipientForm extends HTMLElement {
        constructor() {
            super();

            this.checkboxInput = this.querySelector(
                `#Recipient-checkbox-${this.dataset.sectionId}`
            );
            this.checkboxInput.disabled = false;
            this.recipientFields = this.querySelector(".recipient-fields");
            this.hiddenControlField = this.querySelector(
                `#Recipient-control-${this.dataset.sectionId}`
            );
            this.hiddenControlField.disabled = true;
            this.emailInput = this.querySelector(
                `#Recipient-email-${this.dataset.sectionId}`
            );
            this.nameInput = this.querySelector(
                `#Recipient-name-${this.dataset.sectionId}`
            );
            this.messageInput = this.querySelector(
                `#Recipient-message-${this.dataset.sectionId}`
            );
            this.sendonInput = this.querySelector(
                `#Recipient-send-on-${this.dataset.sectionId}`
            );
            this.offsetProperty = this.querySelector(
                `#Recipient-timezone-offset-${this.dataset.sectionId}`
            );

            if (this.offsetProperty)
                this.offsetProperty.value = new Date().getTimezoneOffset();

            this.currentProductVariantId = this.dataset.productVariantId;
            this.addEventListener("change", this.onChange.bind(this));

            this.checkboxInput.addEventListener("click", (e) => {
                if (this.checkboxInput.checked) {
                    this.show(this.recipientFields);
                } else {
                    this.hide(this.recipientFields);
                }
            });
        }

        cartUpdateUnsubscriber = undefined;
        variantChangeUnsubscriber = undefined;

        connectedCallback() {
            this.cartUpdateUnsubscriber = subscribe(
                PUB_SUB_EVENTS.cartUpdate,
                (event) => {
                    if (
                        event.source === "product-form" &&
                        event.productVariantId.toString() ===
                            this.currentProductVariantId
                    ) {
                        this.resetRecipientForm();
                    }
                }
            );

            this.variantChangeUnsubscriber = subscribe(
                PUB_SUB_EVENTS.variantChange,
                (event) => {
                    if (event.data.sectionId === this.dataset.sectionId) {
                        this.currentProductVariantId =
                            event.data.variant.id.toString();
                    }
                }
            );
        }

        disconnectedCallback() {
            if (this.cartUpdateUnsubscriber) this.cartUpdateUnsubscriber();

            if (this.variantChangeUnsubscriber)
                this.variantChangeUnsubscriber();
        }

        onChange() {
            if (this.checkboxInput.checked) {
                this.enableInputFields();
            } else {
                this.clearInputFields();
                this.disableInputFields();
            }
        }

        show(fields) {
            this.setAttribute("data-form-opened", "true");
            var animation = fields.animate(
                { height: ["0", fields.scrollHeight + "px"] },
                { duration: 300, easing: "linear" }
            );

            animation.onfinish = () => {
                fields.style.height = "initial";
            };
        }

        hide(fields) {
            this.removeAttribute("data-form-opened");
            var animation = fields.animate(
                { height: [fields.clientHeight + "px", "0"] },
                { duration: 300, easing: "linear" }
            );

            animation.onfinish = () => {
                fields.style.height = "0";
            };
        }

        inputFields() {
            return [
                this.emailInput,
                this.nameInput,
                this.messageInput,
                this.sendonInput,
            ];
        }

        disableableFields() {
            return [...this.inputFields(), this.offsetProperty];
        }

        clearInputFields() {
            this.inputFields().forEach((field) => (field.value = ""));
        }

        enableInputFields() {
            this.disableableFields().forEach(
                (field) => (field.disabled = false)
            );
        }

        disableInputFields() {
            this.disableableFields().forEach(
                (field) => (field.disabled = true)
            );
        }

        resetRecipientForm() {
            if (this.checkboxInput.checked) {
                this.checkboxInput.checked = false;
                this.clearInputFields();
            }
        }
    }

    customElements.define("recipient-form", RecipientForm);
}

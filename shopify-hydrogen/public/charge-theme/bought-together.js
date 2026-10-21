class BoughtTogether extends HTMLElement {
    constructor() {
        super();

        const mainPrice = this.getMainPrice();
        const mainForm = this.getMainForm();

        // Update element total price
        this.addEventListener("change", this.updateTotal.bind(this));

        // Listen price change for main product
        this.mainPriceMutation = new MutationObserver(() => {
            const input = this.querySelector('input[name="items[0][id]"]');

            this.updateTotal();

            if (this.isMainSoldout()) input.setAttribute("disabled", true);
            else input.removeAttribute("disabled");
        });

        if (mainPrice) {
            this.mainPriceMutation.observe(
                mainPrice.closest('[data-updatable="true"]'),
                { childList: true, subtree: true }
            );
        }

        // Listen variant ID change for main product
        mainForm?.addEventListener?.("change", () => {
            const variantId = mainForm.querySelector('input[name="id"]').value;

            this.querySelector('input[name="items[0][id]"]').value = variantId;
        });
    }

    collectTotal() {
        let mainProductPrice =
                this.isTotalIncludesMainProductPrice() == "true"
                    ? parseInt(
                          this.getMainPrice()?.dataset.amount.replace(/\D/g, "")
                      )
                    : 0,
            itemsTotal = 0;

        itemsTotal += this.isMainSoldout()
            ? 0 // doesn't add main product price if product is not available
            : mainProductPrice;

        this.querySelectorAll(
            '[type="checkbox"]:checked ~ .item-link .price--final'
        ).forEach((el) => {
            itemsTotal += this.parsePrice(el.dataset.amount);
        });

        return itemsTotal;
    }

    parsePrice(price) {
        const decimalSeparator = this.getPriceDecimalSeparator();

        if (decimalSeparator === ",") {
            // Replace period as thousand separator and comma as decimal separator
            price = price.replace(/\./g, "").replace(",", ".");
        } else {
            // Replace comma as thousand separator
            price = price.replace(/,/g, "");
        }
        return parseFloat(price);
    }

    updateTotal() {
        const decimalsSeparator = this.getPriceDecimalSeparator();
        const template = this.querySelector(
            'template[data-id="price"]'
        ).innerHTML;
        const total = this.collectTotal().toString();

        var int, dec;
        [int, dec] = this.getSamplePrice().split(decimalsSeparator);

        if (this.isLanguageNumberFormatting()) {
            // formats Total according to the Locale: e.g: 123.456,78
            const totalsWithFormat = new Intl.NumberFormat(
                this.getLocalization(),
                {
                    style: "currency",
                    currency: this.getCurrencyCode(),
                }
            ).format(total / 100);

            if (template.includes("<sup")) {
                // if superscript applied
                const totalWithCurrencySymbol = totalsWithFormat.replace(
                    this.getCurrencyCode(),
                    ""
                );
                this.querySelector(".summary .price--final").outerHTML =
                    template
                        .replaceAll(
                            int,
                            totalWithCurrencySymbol.slice(
                                0,
                                totalWithCurrencySymbol.length - dec.length
                            )
                        )
                        .replaceAll(
                            dec,
                            totalWithCurrencySymbol.slice(-dec.length)
                        )
                        .replaceAll(".", "");
            } else {
                const totalWithCurrencySymbol = totalsWithFormat.replace(
                    this.getCurrencyCode(),
                    this.getCurrencySymbol()
                );
                this.querySelector(".summary .price--final").outerHTML =
                    template
                        .replaceAll(
                            this.getCurrencySymbol(),
                            totalWithCurrencySymbol
                        )
                        .replaceAll(this.getSamplePrice(), "");
            }
        } else {
            // collect the Total without formatting the numbers
            const intPart =
                total.length >= dec.length
                    ? total.slice(0, total.length - dec.length)
                    : total.slice(0, dec.length - total.length); // prevent displaying price in the wrong format like ',0' if a main product is soldout

            const decPart = total.slice(-dec.length);

            this.querySelector(".summary .price--final").outerHTML = template
                .replaceAll(int, intPart)
                .replaceAll(dec, decPart);
        }
    }

    getMainPrice() {
        return document.querySelector(".product-section .price--final");
    }

    getMainForm() {
        return document.querySelector(".product-section product-form");
    }

    isMainSoldout() {
        return !!this.getMainPrice().closest(".price--sold-out");
    }

    getLocalization() {
        return `${window.Shopify.locale}-${window.Shopify.country}`; // de-DE, en-US etc;
    }

    getCurrencyCode() {
        return window.Shopify.currency.active; // EUR, USD etc;
    }

    getCurrencySymbol() {
        return this.getMainPrice()?.dataset.currency; // $, €, £ etc;
    }

    isTotalIncludesMainProductPrice() {
        return this.querySelector(".summary")?.dataset.includesMainProductPrice;
    }

    getSamplePrice() {
        return this.querySelector('template[data-id="price"]')?.dataset
            .priceSample;
    }

    isLanguageNumberFormatting() {
        return JSON.parse(
            this.querySelector('template[data-id="price"]')?.dataset
                .numberFormatting
        );
    }

    getPriceDecimalSeparator() {
        if (this.getSamplePrice().indexOf(",") !== -1) return ",";

        return ".";
    }
}

customElements.define("bought-together", BoughtTogether);

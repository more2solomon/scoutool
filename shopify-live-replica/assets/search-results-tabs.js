if (!customElements.get("search-tabs")) {
    class ActivateSearchTabs extends HTMLElement {
        constructor() {
            super();

            this.radios = this.querySelectorAll(
                '[type="radio"][name^="tabs-"]'
            );
            this.handleTabOpen = (event) => {
                this.activateTab(event.target.id, true);
            };
        }

        connectedCallback() {
            if (this.radios.length === 1) {
                this.radios.forEach((radio) =>
                    this.activateTab(radio.id, true)
                );
                return;
            }

            this.radios.forEach((radio) => {
                radio.addEventListener("input", this.handleTabOpen);
            });
        }

        getContent(tabId) {
            return this.querySelector(`#${tabId}--content`);
        }

        getLabel(tabId) {
            return this.querySelector(`[for="${tabId}"]`);
        }

        activateTabLabel(label) {
            label
                .closest('[role="tablist"]')
                ?.querySelectorAll?.("label")
                ?.forEach?.((label) =>
                    label.classList.remove("tab-label__active")
                );
            label.classList.add("tab-label__active");
        }

        activateTabContent(content) {
            this.querySelectorAll?.(".tab-content")?.forEach?.((panel) => {
                panel.setAttribute("hidden", true);
                panel.classList.remove("tab-content__active");
            });

            content.removeAttribute("hidden");
            content.classList.add("tab-content__active");
        }

        activateTab(tabId) {
            const radio = this.querySelector(`#${tabId}`);
            const content = this.getContent(tabId);
            const label = this.getLabel(tabId);

            if (radio) radio.checked = true;
            if (label) this.activateTabLabel(label);
            if (content) this.activateTabContent(content);
        }

        disconnectedCallback() {
            this.radios.forEach((radio) => {
                radio.removeEventListener("input", this.handleTabOpen);
            });
        }
    }

    customElements.define("search-results-tabs", ActivateSearchTabs);
}

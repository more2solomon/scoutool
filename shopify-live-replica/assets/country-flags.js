if (!customElements.get("country-flag")) {
    class CountryFlag extends HTMLElement {
        connectedCallback() {
            if (this._processed) return;
            this._processed = true;

            const code = this.dataset.code?.toLowerCase();
            if (!code || code.length !== 2) return;

            const emojiFlag = code
                .toUpperCase()
                .replace(/./g, (char) =>
                    String.fromCodePoint(char.charCodeAt(0) + 127397)
                );
            const hasFallback = this.dataset.hasFallback === "true";

            // element remains hidden until fully rendered
            this.style.visibility = "hidden";

            if (hasFallback) {
                if (!this.querySelector(".emoji-flag")) {
                    this.insertAdjacentHTML(
                        "beforeend",
                        `<span class="emoji-flag">${emojiFlag}</span>`
                    );
                }
            } else this.textContent = emojiFlag;

            // display once done
            this.style.visibility = "visible";
        }
    }

    customElements.define("country-flag", CountryFlag);
}

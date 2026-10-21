class DeferredMedia extends HTMLElement {
    constructor() {
        super();
        this.nextElementSibling?.removeAttribute("hidden");
        this.querySelector('[id^="Deferred-Poster-"]')?.addEventListener(
            "click",
            this.loadContent.bind(this)
        );
    }

    loadContent() {
        if (!this.getAttribute("loaded")) {
            const content = document.createElement("div");
            content.appendChild(
                this.querySelector(
                    "template"
                ).content.firstElementChild.cloneNode(true)
            );

            this.nextElementSibling?.setAttribute("hidden", true); // hide covered content on video loading
            this.setAttribute("loaded", true);
            window.pauseAllMedia();
            this.appendChild(
                content.querySelector("video, model-viewer, iframe")
            ).focus();
        }
    }
}

customElements.define("deferred-media", DeferredMedia);

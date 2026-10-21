if (!customElements.get("slider-vertical")) {
    class SliderVertical extends HTMLElement {
        constructor() {
            super();
            this.upButton = this.querySelector('button[name="up"]');
            this.downButton = this.querySelector('button[name="down"]');
            this.panel = this.querySelector(".slider-vertical--panel");
            this.mode = this.getThumbsMode();
            this.updateButtons();

            window.addEventListener(
                "resize",
                debounce(this.updateButtons.bind(this), 200)
            );
            this.panel.addEventListener(
                "scroll",
                this.updateButtons.bind(this)
            );

            this.upButton.addEventListener("click", (event) => {
                event.preventDefault();
                this.mode === "slider_left"
                    ? (this.panel.scrollTop -=
                          this.panel.children[0].offsetHeight +
                          this.getPanelGap())
                    : (this.panel.scrollLeft -=
                          this.panel.children[0].offsetHeight +
                          this.getPanelGap());
                setTimeout(this.updateButtons.bind(this), 200);
            });

            this.downButton.addEventListener("click", (event) => {
                event.preventDefault();
                this.mode === "slider_left"
                    ? (this.panel.scrollTop +=
                          this.panel.children[0].offsetHeight +
                          this.getPanelGap())
                    : (this.panel.scrollLeft +=
                          this.panel.children[0].offsetHeight +
                          this.getPanelGap());
                setTimeout(this.updateButtons.bind(this), 200);
            });
        }

        getPanelGap() {
            if ("computedStyleMap" in this.panel)
                return parseFloat(
                    this.panel.computedStyleMap().get("gap").toString()
                );
            else return "";
        }

        updateButtons() {
            const panel = this.panel;
            const isVertical = this.mode === "slider_left";

            const start = isVertical ? panel.scrollTop : panel.scrollLeft;
            const end = isVertical
                ? panel.scrollHeight - panel.clientHeight
                : panel.scrollWidth - panel.clientWidth;

            this.upButton.style.setProperty(
                "display",
                start === 0 ? "none" : "",
                "important"
            );
            this.downButton.style.setProperty(
                "display",
                start >= end ? "none" : "",
                "important"
            );
        }

        getThumbsMode() {
            return this.dataset.thumbsMode || "slider_left";
        }
    }

    customElements.define("slider-vertical", SliderVertical);
}

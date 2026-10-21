if (!customElements.get("product-modal")) {
    class ProductModal extends ModalDialog {
        constructor() {
            super();

            this.bodyOverflowAttribute = "data-modal-opened";
            this.modalInner = this.querySelector(".product-media-modal--inner");
            this.media = [
                ...this.querySelectorAll(".product-media-modal--inner > *"),
            ];
            this.mediaThumbs = [
                ...this.querySelectorAll(".product-media-modal__thumbs > a"),
            ];
            this.mediaModalButtons = [
                ...this.querySelectorAll(".media-modal--button"),
            ];
            this.loader = null;

            window.addEventListener("popstate", () => {
                this.hasAttribute("open") && this.hide();
            });
        }

        connectedCallback() {
            if (!this.media.length || !this.mediaThumbs.length) return;

            this.mediaModalButtons?.forEach((btn) =>
                btn.addEventListener(
                    "click",
                    this.handleThumbsUsingButtons.bind(this)
                )
            );
            this.mediaThumbs?.forEach((thumb) =>
                thumb.addEventListener("click", this.showThumbMedia.bind(this))
            );
        }

        hide() {
            super.hide();
            document.body.removeAttribute(this.bodyOverflowAttribute);
            window?.pauseAllMedia?.();
        }

        show(opener) {
            if (!this.querySelector(".loading-overlay")) this.initLoading();
            window.location.hash = "product-modal";
            super.show(opener);
            document.body.setAttribute(this.bodyOverflowAttribute, true);
            setTimeout(() => {
                this.showActiveMedia();
            }, 150);
        }

        handleThumbsUsingButtons(e) {
            e.preventDefault();

            const isNext = e.currentTarget.classList.contains("next");
            const isPrev = e.currentTarget.classList.contains("prev");

            if (!this.media.length || (!isNext && !isPrev)) return;

            // current active mediaId
            const activeThumb = this.mediaThumbs.find((t) =>
                t.classList.contains("active")
            );
            const currentMediaId = activeThumb?.dataset.mediaId;

            let currentIndex = this.mediaThumbs.findIndex(
                (thumb) => thumb.dataset.mediaId === currentMediaId
            );

            if (currentIndex === -1) currentIndex = 0;

            // move index
            if (isNext) currentIndex++;
            if (isPrev) currentIndex--;

            // infinite loop
            if (currentIndex >= this.mediaThumbs.length) currentIndex = 0;
            if (currentIndex < 0) currentIndex = this.mediaThumbs.length - 1;

            const nextThumb = this.mediaThumbs[currentIndex];
            if (!nextThumb) return;

            // simulate click on next thumb
            nextThumb.click();

            const nextMedia = this.media.find(
                (m) => m.dataset.mediaId === nextThumb.dataset.mediaId
            );

            nextMedia?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }

        showActiveMedia() {
            const activeMediaId = this.openedBy.dataset.mediaId;
            const activeMedia = this.media.find(
                (m) => m.dataset.mediaId === activeMediaId
            );

            if (!activeMedia) return;

            this.media.forEach((m) =>
                m.classList.toggle("active", m === activeMedia)
            );
            this.mediaThumbs.forEach((thumb) =>
                thumb.classList.toggle(
                    "active",
                    thumb.dataset.mediaId === activeMediaId
                )
            );

            activeMedia.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });

            if (activeMedia.nodeName === "IMG") {
                if (activeMedia.complete) this.hideLoading();
                else this.showLoading();
            }

            if (
                activeMedia.nodeName === "DEFERRED-MEDIA" &&
                activeMedia
                    .querySelector("template")
                    ?.content?.querySelector(".js-youtube")
            ) {
                activeMedia.loadContent();
            }
        }

        showThumbMedia(e) {
            e.preventDefault();

            if (!this.querySelector(".loading-overlay")) this.initLoading();

            const target = e.currentTarget.closest("a");
            if (!target) return;

            const currentMediaId = target.dataset.mediaId;
            window?.pauseAllMedia?.();

            this.mediaThumbs.forEach((thumb) =>
                thumb.classList.remove("active")
            );
            target.classList.add("active");

            this.media.forEach((media) => {
                const isActive = media.dataset.mediaId === currentMediaId;
                media.classList.toggle("active", isActive);
                media.removeAttribute("hidden");
                if (isActive) {
                    if (media.nodeName === "IMG" && !media.complete)
                        this.showLoading();
                }
            });
        }

        async initLoading() {
            if (!this.loader) {
                const html = await fetchLoaderHTML();
                this.insertAdjacentHTML("afterbegin", html);
                this.loader = this.querySelector(".loading-overlay");
            }
        }

        showLoading() {
            this.loader?.classList.remove("hidden");
        }

        hideLoading() {
            this.loader?.classList.add("hidden");
        }

        disconnectedCallback() {
            this.mediaModalButtons?.forEach((btn) =>
                btn.removeEventListener(
                    "click",
                    this.handleThumbsUsingButtons.bind(this)
                )
            );
            this.mediaThumbs.forEach((thumb) =>
                thumb.removeEventListener(
                    "click",
                    this.showThumbMedia.bind(this)
                )
            );
        }
    }

    customElements.define("product-modal", ProductModal);
}

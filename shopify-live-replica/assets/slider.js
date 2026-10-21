if (!customElements.get("slider-component")) {
    class SliderComponent extends HTMLElement {
        #play;

        constructor() {
            super();
            this.slider = this.querySelector("ul");
            if (!this.slider) return;

            this.pageCount = this.querySelector(".slider-counter--current");
            this.pageTotal = this.querySelector(".slider-counter--total");
            this.prevButton = this.querySelector('button[name="previous"]');
            this.nextButton = this.querySelector('button[name="next"]');
            this.pagination = this.querySelector(".slider-pagination");
            this.lastPaginationUpdate = 0;

            this.resizeObserver = new ResizeObserver((entries) => {
                this.initPages();
                this.stop();
                this.play();
            });

            this.onScroll = this.update.bind(this);
            this.onPrevClick = this.onButtonClick.bind(this);
            this.onNextClick = this.onButtonClick.bind(this);

            // theme editor integration
            if (Shopify?.designMode) {
                document.addEventListener("shopify:block:select", (event) => {
                    if (this.slider.contains(event.target)) {
                        this.stop();
                        window.requestAnimationFrame(() => {
                            this.slider.scrollTo({
                                left: event.target.offsetLeft,
                            });
                        });
                    }
                });
                document.addEventListener("shopify:block:deselect", (event) => {
                    if (this.slider.contains(event.target)) {
                        this.stop();
                        this.play();
                    }
                });
            }
        }

        collectSlides() {
            const slides = this.querySelectorAll(
                this.dataset?.sliderItem || "li"
            );

            this.sliderItems = Array.from(slides).filter(
                (item) => item.offsetParent
            );
            this.originalItems = Array.from(
                this.querySelectorAll(this.dataset?.sliderItem || "li")
            );

            if (
                this.dataset?.loop === "true" &&
                this.originalItems.length > 1
            ) {
                if (this.dataset?.multipleItems === "false") {
                    // clone items when one slide per view
                    this.cloneItems();
                } else if (this.dataset?.multipleItems === "true") {
                    // clone items if multiple items per view
                    this.cloneMultipleItemsForInfinityScroll();
                }
            }
        }

        connectedCallback() {
            this.collectSlides();

            this.resizeObserver.observe(this.slider);
            this.slider.addEventListener("scroll", this.onScroll);
            this.prevButton?.addEventListener("click", this.onPrevClick);
            this.nextButton?.addEventListener("click", this.onNextClick);
        }

        cloneItems() {
            // remove existing cloned items
            this.slider
                .querySelectorAll("[data-item-cloned]")
                .forEach((clonedItem) => {
                    clonedItem.remove();
                });
            const numClones = Math.min(this.originalItems.length, 2);
            const firstClones = this.originalItems[0].cloneNode(true);
            const lastClones =
                this.originalItems[this.originalItems.length - 1].cloneNode(
                    true
                );
            firstClones.setAttribute("data-item-cloned", true);
            lastClones.setAttribute("data-item-cloned", true);

            this.slider.appendChild(firstClones);
            this.slider.insertBefore(lastClones, this.slider.firstChild);

            // update sliderItems with cloned items
            this.sliderItems = this.querySelectorAll(
                this.dataset?.sliderItem || "li"
            );

            // adjust scroll position to maintain the correct order with defer
            const isRtl = this.getSliderDirection();
            const { offsetWidth } = lastClones;
            requestAnimationFrame(() => {
                this.slider.scrollLeft = isRtl ? offsetWidth * -1 : offsetWidth;
            });
        }

        cloneMultipleItemsForInfinityScroll() {
            this.slider
                .querySelectorAll("[data-multipleitem-cloned]")
                .forEach((clonedItem) => {
                    clonedItem.remove();
                });

            const numClones = Math.min(
                this.originalItems.length,
                parseFloat(this.dataset?.slidesPerView)
            );
            const firstItemsCloned = this.originalItems
                .slice(0, numClones)
                .map((item) => {
                    const cloned = item.cloneNode(true);
                    cloned.setAttribute("data-multipleitem-cloned", true);
                    return cloned;
                });

            const lastItemsCloned = this.originalItems
                .slice(-numClones)
                .map((item) => {
                    const cloned = item.cloneNode(true);
                    cloned.setAttribute("data-multipleitem-cloned", true);
                    return cloned;
                });

            firstItemsCloned.forEach((clone) => this.slider.appendChild(clone));
            lastItemsCloned
                .reverse()
                .forEach((clone) =>
                    this.slider.insertBefore(clone, this.slider.firstChild)
                );

            // update sliderItems with cloned items
            this.sliderItems = this.querySelectorAll(
                this.dataset?.sliderItem || "li"
            );
        }

        initPages() {
            if (!this.sliderItems.length) return;

            if (this.dataset.loop == "true") {
                this.totalPages = this.sliderItems.length;
            } else {
                this.slidesPerPage = Math.round(
                    this.slider.clientWidth / this.sliderItems[0].clientWidth
                );
                this.totalPages =
                    this.slidesPerPage > this.sliderItems.length
                        ? 1
                        : this.sliderItems.length - this.slidesPerPage + 1;
            }

            this.update();
        }

        updateInfinitySlider() {
            const isRtl = this.getSliderDirection();

            if (isRtl) this.updateInfinitySliderForRtl();
            else this.updateInfinitySliderForNoneRtl();
        }

        updateInfinitySliderForRtl() {
            const { scrollLeft } = this.slider;
            const itemWidth = this.sliderItems[0]?.clientWidth;
            const maxScrollLeft =
                this.slider.scrollWidth - this.slider.clientWidth;
            const rtlScrollPosition = maxScrollLeft - scrollLeft;

            if (Math.abs(scrollLeft) <= 0) {
                this.slider.classList.add("scroll--behavior"); // disable smooth scroll temporarily
                this.slider.scrollLeft =
                    (this.slider.scrollWidth - 2 * this.slider.offsetWidth) *
                    -1;
                this.slider.classList.remove("scroll--behavior");
            } else if (
                rtlScrollPosition -
                    itemWidth * (this.originalItems.length + 1) >=
                maxScrollLeft
            ) {
                this.slider.classList.add("scroll--behavior"); // disable smooth scroll temporarily
                this.slider.scrollLeft = this.slider.offsetWidth * -1;
                this.slider.classList.remove("scroll--behavior");
            }

            // update currentPage and current slider index for RTL
            const currentSliderIndex =
                Math.round((scrollLeft / itemWidth) * -1) + 1;

            this.currentPage =
                (Math.round(rtlScrollPosition / itemWidth) %
                    this.originalItems.length) +
                1;
            this.activateCurrentInfinitySlide(currentSliderIndex);
        }

        updateInfinitySliderForNoneRtl() {
            const { scrollLeft } = this.slider;
            const itemWidth = this.sliderItems[0]?.clientWidth;

            if (scrollLeft <= 0) {
                this.slider.classList.add("scroll--behavior"); // disable smooth scroll temporarily
                this.slider.scrollLeft =
                    this.slider.scrollWidth - 2 * this.slider.offsetWidth;
                this.slider.classList.remove("scroll--behavior");
            } else if (
                Math.ceil(scrollLeft) >=
                this.slider.scrollWidth - this.slider.clientWidth
            ) {
                this.slider.classList.add("scroll--behavior"); // disable smooth scroll temporarily
                this.slider.scrollLeft = this.slider.offsetWidth;
                this.slider.classList.remove("scroll--behavior");
            }

            // update currentPage and current slider index
            const currentSliderIndex = Math.round(scrollLeft / itemWidth) + 1;
            this.currentPage =
                (Math.round(scrollLeft / itemWidth) %
                    this.originalItems.length) +
                1;
            this.activateCurrentInfinitySlide(currentSliderIndex);
        }

        activateCurrentInfinitySlide(sliderNumber) {
            const currentSlide = "slide-active";
            const sliders = this.sliderItems;
            let slider;

            // remove active class from sliders
            sliders.forEach((slider) => {
                slider.classList.remove(currentSlide);
            });

            // add active class for current slider
            slider = sliders[sliderNumber - 1];
            slider?.classList.add(currentSlide);
        }

        updateNonInfinitySlider() {
            let direction;
            this.getSliderDirection() ? (direction = -1) : (direction = 1);

            this.width = this.slider.classList.contains("products")
                ? direction * this.slider?.clientWidth
                : direction * this.sliderItems[0]?.clientWidth;

            if (this.slider?.dataset?.slideshowBtnType == "scrollbar")
                this.width = direction * this.sliderItems[0]?.clientWidth;

            this.currentPage =
                Math.round(this.slider.scrollLeft / this.width) + 1;

            if (this.currentPage === 1)
                this.prevButton?.setAttribute("disabled", true);
            else this.prevButton?.removeAttribute("disabled");

            let sliderScrollLeft =
                this.width > 0
                    ? this.slider.scrollLeft + this.width
                    : Math.abs(this.slider.scrollLeft + this.width);

            if (this.slider.classList.contains("swatch-options__slider")) {
                this.slidesPerView =
                    Math.round(
                        this.slider.clientWidth /
                            this.sliderItems[0].clientWidth
                    ) - 2;
                this.totalPages = this.sliderItems.length - this.slidesPerView;
            }

            if (
                this.currentPage === this.totalPages ||
                sliderScrollLeft === this.slider.scrollWidth
            )
                this.nextButton?.setAttribute("disabled", true);
            else this.nextButton?.removeAttribute("disabled");
        }

        update() {
            if (this.dataset.loop == "false") this.updateNonInfinitySlider();
            else this.updateInfinitySlider();

            this.pagination !== null
                ? this.updatePagination()
                : this.activatePage(this.currentPage);

            if (!this.pageCount || !this.pageTotal) return;
            this.pageCount.textContent = this.currentPage;
            this.pageTotal.textContent = this.totalPages;
        }

        onButtonClick(event) {
            const button = event.currentTarget;
            const width = this.sliderItems[0]?.clientWidth;

            let direction;
            this.getSliderDirection() ? (direction = -1) : (direction = 1);

            button.name === "next"
                ? (direction = direction * 1)
                : (direction = direction * -1);

            event.preventDefault();
            this.slider.scrollTo({
                left: this.slider.scrollLeft + direction * width,
                behavior:
                    this.dataset.transitionEffect === "scroll"
                        ? "smooth"
                        : "auto",
            });

            // main gallery media
            if (button.closest(".slideshow.product__media")) {
                setTimeout(() => {
                    this.mainGalleryMedia(this);
                }, 0);
            }
            this.stop();
            this.play();
        }

        updatePagination() {
            const slider = this.slider;
            const pages = this.pagination.children;

            // implement pagination update with throttle
            if (Date.now() - this.lastPaginationUpdate > 100) {
                let index = 0;

                for (let page of pages) {
                    if (index >= this.totalPages)
                        page.setAttribute("hidden", true);
                    else page.removeAttribute("hidden");

                    index++;
                }

                this.activatePage(this.currentPage);
                this.lastPaginationUpdate = Date.now();
            }
        }

        activatePage(pageNumber) {
            if (this.dataset.loop == "false") {
                const currentSlide = "slide-active";
                const sliders = this.slider.children;
                let slider;

                // remove active class from sliders
                [...sliders].forEach((slider) =>
                    slider.classList.remove(currentSlide)
                );

                // add active class for current slider
                slider = sliders[pageNumber - 1];
                slider?.classList.add(currentSlide);
            }

            const pages = this.pagination && this.pagination.children;
            if (!pages) return;

            const activePage = "page-active";
            let page, pageLeft, pageTop;

            // remove active class from all pages
            [...pages].forEach((page) => page.classList.remove(activePage));

            // return null for the gallery thumbs
            const href = pages[pageNumber - 1]?.href;
            page = href === undefined ? pages[pageNumber - 1] : null;
            if (!page) {
                setTimeout(() => {
                    this.mainGalleryMedia(this);
                }, 0);
                return;
            }

            // add active class to specific page
            page.classList.add(activePage);

            // check is page is fully visible
            pageLeft = page.offsetLeft - this.pagination.scrollLeft;
            if (
                pageLeft > this.pagination.clientWidth - page.clientWidth ||
                pageLeft < 0
            ) {
                this.pagination.scrollTo({
                    left: page.offsetLeft,
                });
            }

            pageTop = page.offsetTop - this.pagination.scrollTop;
            if (
                pageTop > this.pagination.clientHeight - page.clientHeight ||
                pageTop < 0
            ) {
                this.pagination.scrollTo({
                    top: page.offsetTop,
                });
            }
        }

        mainGalleryMedia(gallery) {
            const sliders = gallery.querySelectorAll("ul.slider > li");
            let currentActiveSlide;
            sliders.forEach((slide) => {
                if (slide.classList.contains("slide-active"))
                    currentActiveSlide = slide;
            });

            const mediaThumb = document.querySelector(
                `a[href*="${currentActiveSlide?.id}"]`
            );

            mediaThumb && this.highlightThumb(mediaThumb);
            mediaThumb && this.scrollToActiveThumb(mediaThumb);
        }

        highlightThumb(media) {
            setTimeout(() => {
                media.classList.add("page-active");
            }, 50);
        }

        activateSlide(media) {
            let slide;
            const currentMediaId = media.id || media.href.split("#media-")[1];
            this.sliderItems.forEach((slider) => {
                if (
                    slider.id.indexOf(currentMediaId) !== -1 &&
                    !slider?.dataset?.itemCloned
                ) {
                    slide = slider;
                }
            });
            if (!slide) return;

            this.slider.scrollTo({
                left: slide.offsetLeft,
            });

            this.highlightThumb(media);
        }

        scrollToActiveThumb(activeThumb) {
            const s = document.querySelector(".slider-vertical--panel");
            if (s?.dataset?.thumbsPosition == "slider_left") {
                s.scrollTo({
                    top: activeThumb.offsetTop,
                });
            } else {
                s.scrollTo({
                    left: activeThumb.offsetLeft,
                });
            }
        }

        play() {
            const wait = parseFloat(this.dataset.autoplay);

            if (!wait || isNaN(wait)) return;
            if (this.sliderItems.length <= 1) return;

            this.#play = setInterval(() => {
                const slideScrollPosition =
                    this.slider.scrollLeft + this.sliderItems[0].clientWidth;
                const isLastPage =
                    this.dataset.loop == "false"
                        ? this.currentPage === this.totalPages
                        : false;

                if (this.dataset.loop == "false" && isLastPage) {
                    this.stop();
                } else {
                    this.slider.scrollTo({
                        left: isLastPage ? 0 : slideScrollPosition,
                    });
                }
            }, wait * 1000);
        }

        stop() {
            clearInterval(this.#play);
        }

        getSliderDirection() {
            let isRtl = false;
            if (document.dir && document.dir === "rtl") isRtl = true;

            return isRtl;
        }

        disconnectedCallback() {
            if (!this.slider) return;

            this.prevButton &&
                this.prevButton.removeEventListener("click", this.onPrevClick);
            this.nextButton &&
                this.nextButton.removeEventListener("click", this.onNextClick);
            this.slider.removeEventListener("scroll", this.onScroll);
            this.resizeObserver.unobserve(this.slider);
        }
    }

    customElements.define("slider-component", SliderComponent);
}

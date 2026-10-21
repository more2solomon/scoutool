class CollectionFiltersForm extends HTMLElement {
    constructor() {
        super();
        this.filterData = [];
        this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
        this.form = this.querySelector("form");

        this.debouncedOnSubmit = debounce((event) => {
            this.onSubmitHandler(event);
        }, 500);

        window.addEventListener("DOMContentLoaded", () => {
            this.hideEmptyFacets();
        });
        this.form.addEventListener("input", this.debouncedOnSubmit.bind(this));
        this.form.addEventListener(
            "changepage",
            this.onSubmitHandler.bind(this)
        );
        this.bindOuterControlEvnets();
        this.bindActiveFacetButtonEvents();

        if (!window.filtersEvenetOnHistoryChangeInited) {
            window.addEventListener(
                "popstate",
                this.onHistoryChange.bind(this)
            );
            window.filtersEvenetOnHistoryChangeInited = true;
        }

        // Ugly but it works. Fix for button-like facet when it is near the right side.
        if (this.classList.contains("facets__type-buttons"))
            this.querySelectorAll(".facets__disclosure").forEach((details) => {
                details.addEventListener("toggle", () => {
                    const list = details.querySelector(".facets__display");
                    const dX = details.getBoundingClientRect().x;
                    const lW = list ? list.getBoundingClientRect().width : 0;

                    if (list) {
                        if (window.innerWidth < dX + lW) {
                            list.style.left = "auto";
                            list.style.right = "-.5rem";
                        } else {
                            list.style.left = "";
                            list.style.right = "";
                        }
                    }
                });
            });
    }

    getCollectionEl() {
        return document
            .getElementById("CollectionProducts")
            .querySelector(".main-collection");
    }

    onSubmitHandler(event) {
        event.preventDefault();

        const formData = new FormData(this.form);
        const searchParams = new URLSearchParams(formData).toString();
        const revealItems = document.querySelectorAll(".reveal-slide-in");

        // disable on-scroll reveal items animation
        revealItems.length &&
            revealItems.forEach((item) =>
                item.classList.remove("reveal-ready")
            );
        this.renderPage(searchParams, event);
    }

    onActiveFilterClick(event) {
        event.preventDefault();
        this.toggleActiveFacets();
        this.renderPage(
            new URL(event.currentTarget.href).searchParams.toString()
        );
        // show all facets with value more than 0
        setTimeout(() => {
            this.showAllFacets();
        }, 1000);
    }

    onHistoryChange(event) {
        const searchParams = event.state?.searchParams || "";
        this.renderPage(searchParams, null, false);
    }

    toggleActiveFacets(disable = true) {
        document.querySelectorAll(".js-facet-remove").forEach((element) => {
            element.classList.toggle("disabled", disable);
        });
    }

    renderPage(searchParams, event, updateURLHash = true) {
        const sections = this.getSections();
        const viewMode = new URL(window.location).searchParams.get("view");

        if (viewMode && searchParams.indexOf("view=") == -1) {
            searchParams = `view=${viewMode}&${searchParams}`.trim("&");
        }

        this.showLoading();
        sections.forEach((section) => {
            const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
            const filterDataUrl = (element) => element.url === url;

            this.filterData.some(filterDataUrl)
                ? this.renderSectionFromCache(filterDataUrl, section, event)
                : this.renderSectionFromFetch(url, section, event);
        });

        if (updateURLHash) this.updateURLHash(searchParams);
    }

    renderSectionFromFetch(url, section, event) {
        fetch(url)
            .then((response) => response.text())
            .then((responseText) => {
                const html = responseText;
                this.filterData = [...this.filterData, { html, url }];
                this.renderFilters(html, event);
                this.renderProductGrid(html);
            });
    }

    renderSectionFromCache(filterDataUrl, section, event) {
        const html = this.filterData.find(filterDataUrl).html;
        this.renderFilters(html, event);
        this.renderProductGrid(html);
    }

    async renderProductGrid(html) {
        const innerHTML = new DOMParser()
            .parseFromString(html, "text/html")
            .getElementById("CollectionProducts").innerHTML;

        document.getElementById("CollectionProducts").innerHTML = innerHTML;
        document
            .getElementById("CollectionProducts")
            .dispatchEvent(
                new CustomEvent("renderProductGrid", { bubbles: true })
            );
        // reinit preload images
        if (document.querySelectorAll(".media--blur-image").length > 0)
            await _preloadImg?.(
                document.querySelectorAll(".media--blur-image"),
                true
            );

        // reinit on reveal items
        if (document.querySelectorAll(".reveal-slide-in").length > 0) {
            typeof onReveal === "function" &&
                (await onReveal(document.querySelectorAll(".reveal-slide-in")));
            typeof updateItemZIndex === "function" &&
                (await updateItemZIndex?.(
                    document.querySelectorAll(".reveal-slide-in")
                ));
        }
    }

    renderFilters(html, event) {
        const parsedHTML = new DOMParser().parseFromString(html, "text/html");

        const facetDetailsElements = parsedHTML.querySelectorAll(
            "#CollectionFiltersForm .js-filter, #CollectionFiltersFormMobile .js-filter"
        );
        const matchesIndex = (element) =>
            element.dataset.index ===
            event?.target.closest(".js-filter")?.dataset.index;
        const facetsToRender = Array.from(facetDetailsElements).filter(
            (element) => !matchesIndex(element)
        );
        const countsToRender =
            Array.from(facetDetailsElements).find(matchesIndex);

        facetsToRender.forEach((element) => {
            document.querySelector(
                `.js-filter[data-index="${element.dataset.index}"]`
            ).innerHTML = element.innerHTML;
        });

        this.renderActiveFacets(parsedHTML);
        this.renderMobileElements(parsedHTML);

        if (countsToRender)
            this.renderCounts(
                countsToRender,
                event.target.closest(".js-filter")
            );
    }

    renderActiveFacets(html) {
        const activeFacetElementSelectors = [
            ".active-facets-mobile",
            ".active-facets-desktop",
        ];

        activeFacetElementSelectors.forEach((selector) => {
            const activeFacetsElement = html.querySelector(selector);
            if (!activeFacetsElement || !document.querySelector(selector))
                return;
            document.querySelector(selector).innerHTML =
                activeFacetsElement.innerHTML;
        });

        this.bindActiveFacetButtonEvents();
        this.toggleActiveFacets(false);
    }

    renderMobileElements(html) {
        const mobileElementSelectors = [".mobile-facets__count"];

        mobileElementSelectors.forEach((selector) => {
            const newElement = html.querySelector(selector);

            if (newElement)
                document.querySelector(selector).innerHTML =
                    newElement.innerHTML;
        });

        document
            .getElementById("CollectionFiltersFormMobile")
            ?.closest("menu-drawer")
            .bindEvents();
    }

    renderCounts(source, target) {
        const countElementSelectors = [".count-bubble", ".facets__selected"];
        countElementSelectors.forEach((selector) => {
            const targetElement = target.querySelector(selector);
            const sourceElement = source.querySelector(selector);

            if (sourceElement && targetElement) {
                target.querySelector(selector).outerHTML =
                    source.querySelector(selector).outerHTML;
            }
        });
        // hide empty facets
        this.hideEmptyFacets();
    }

    hideEmptyFacets() {
        document.querySelectorAll(".facets__display").forEach((facet) => {
            const details = facet.closest("details");
            if (!details) return;

            details.classList.remove("hidden");
            const ul = details.querySelector("ul");
            const piceRange = details.querySelector("price-range");
            // set delay to update the active facets when connection is too slow
            setTimeout(() => {
                const list = ul ? ul.children : [];
                if (list.length === 0 && !piceRange)
                    details.classList.add("hidden");
            }, 150);
        });
    }

    showAllFacets() {
        document.querySelectorAll(".facets__display").forEach((facet) => {
            const details = facet.closest("details");
            if (!details) return;

            const ul = details.querySelector("ul");
            const list = ul ? ul.children : [];
            if (list.length > 0) details.classList.remove("hidden");
        });
    }

    bindActiveFacetButtonEvents() {
        document.querySelectorAll(".js-facet-remove").forEach((element) => {
            element.addEventListener("click", this.onActiveFilterClick, {
                once: true,
            });
        });
    }

    bindOuterControlEvnets() {
        document.body.addEventListener("input", (event) => {
            const id = this.form.getAttribute("id");
            if (id && event.target.getAttribute("form") == id) {
                this.debouncedOnSubmit(event);
            }
        });
    }

    updateURLHash(searchParams) {
        history.pushState(
            { searchParams },
            "",
            `${window.location.pathname}${
                searchParams && "?".concat(searchParams)
            }`
        );
    }

    showLoading() {
        const collection = this.getCollectionEl() || null;

        if (collection && !collection.querySelector(".loading-overlay"))
            collection.prepend(createFromTemplate("template-loading-overlay"));
        collection && collection.classList.add("loading");
    }

    getSections() {
        return [
            {
                id: "main-collection-products",
                section: document.getElementById("main-collection-products")
                    .dataset.id,
            },
        ];
    }
}

customElements.define("collection-filters-form", CollectionFiltersForm);

class PriceRange extends HTMLElement {
    constructor() {
        super();
        this.querySelectorAll("input[type=number]").forEach((element) =>
            element.addEventListener("change", this.onRangeChange.bind(this))
        );

        this.setMinAndMaxValues();
        this.rangeSlider = this.querySelector("range-slider");
        if (this.rangeSlider) {
            this.rangeSlider.addEventListener(
                "input",
                this.onRangeSliderInput.bind(this)
            );
            this.addRangeSliderStyles();
            this.rangeSlider.insertAdjacentHTML("beforeend", "<div> </div>");
            this.onRangeSliderInput();
        }
    }

    addRangeSliderStyles() {
        if (document.getElementById("price-range-slider-styles")) return;

        const style = document.createElement("style");

        style.id = "price-range-slider-styles";
        style.innerHTML = `
        price-range range-slider {
          --thumb-width: .875rem;
          --thumb-border: 2px solid var(--color-background);
          --thumb-bg: ${getComputedStyle(this)
              .getPropertyValue("--color-base-accent-1-rgb")
              .replaceAll(",", " ")};
        }

        price-range range-slider div {
          background: rgba(var(--thumb-bg) / .9);
          border-radius: var(--track-border-radius);
          height: var(--track-height);
          position: absolute;
          top: calc(50% - var(--track-height) / 2);
        }
      `;

        document.head.append(style);
    }

    onRangeChange(event) {
        this.adjustToValidValues(event.currentTarget);
        this.setMinAndMaxValues();
        this.updateRangeSlider();
    }

    updateRangeSlider() {
        const inputs = this.querySelectorAll("input[type=number]");
        const minInput = inputs[0];
        const maxInput = inputs[1];
        const range = this.querySelector("range-slider");

        if (!range) return;

        range.value = [
            Math.floor(minInput.value || minInput.min),
            Math.ceil(maxInput.value || maxInput.max),
        ];
        this.onRangeSliderInput();
    }

    setMinAndMaxValues() {
        const inputs = this.querySelectorAll("input[type=number]");
        const minInput = inputs[0];
        const maxInput = inputs[1];
        if (maxInput.value) minInput.setAttribute("max", maxInput.value);
        if (minInput.value) maxInput.setAttribute("min", minInput.value);
        if (minInput.value === "") maxInput.setAttribute("min", 0);
        if (maxInput.value === "")
            minInput.setAttribute("max", maxInput.getAttribute("max"));
    }

    adjustToValidValues(input) {
        const value = Number(input.value);
        const min = Number(input.getAttribute("min"));
        const max = Number(input.getAttribute("max"));

        if (value < min) input.value = min;
        if (value > max) input.value = max;
    }

    onRangeSliderInput(event) {
        const range = this.rangeSlider;
        const min = Number(range.getAttribute("min"));
        const max = Number(range.getAttribute("max"));
        const value = range.value || range.getAttribute("value").split("-");
        const between = range.querySelector("div");

        between.style.left = `calc((${value[0]} - ${min})/ (${max} - ${min}) * 100%)`;
        between.style.width = `calc((${value[1]} - ${value[0]}) / (${max} - ${min}) * 100%)`;

        const inputs = this.querySelectorAll("input[type=number]");
        if (value[0] != min) inputs[0].value = value[0];
        else inputs[0].value = "";

        if (value[1] != max) inputs[1].value = value[1];
        else inputs[1].value = "";

        // event?.stopPropagation?.();
    }
}

customElements.define("price-range", PriceRange);

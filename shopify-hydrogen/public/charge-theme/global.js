const trapFocusHandlers = {};
const focusable_elements = [
    "summary",
    "a[href]",
    "button:enabled",
    ".popup-modal__content-info",
    "[tabindex]:not([tabindex^=" - "])",
    "[draggable]",
    "area",
    "input:not([type=hidden]):enabled",
    "select:enabled",
    "textarea:enabled",
    "object",
    "iframe",
].join(",");

function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(focusable_elements));
}

function fetchSectionHTML(
    sectionId,
    useCache = false,
    path = window.location.pathname
) {
    const cacheKey = `${path}::${sectionId}`;

    if (typeof this.fetched === "undefined") this.fetched = {};

    if (useCache && this.fetched[cacheKey])
        return new Promise((resolve, reject) => {
            resolve(this.fetched[cacheKey]);
        });
    else {
        return fetch(
            path +
                (path.indexOf("?") === -1 ? "?" : "&") +
                `section_id=${sectionId}`
        )
            .then((result) => {
                if (result.ok) return result.text();
                else throw new Error(result.status);
            })
            .then((html) => {
                const innerHTML = new DOMParser()
                    .parseFromString(html, "text/html")
                    .querySelector(".shopify-section").innerHTML;

                if (useCache) this.fetched[cacheKey] = innerHTML;

                return innerHTML;
            });
    }
}

function fetchLoaderHTML() {
    return Promise.all([
        document.getElementById("template-loading-overlay")?.innerHTML,
    ]).then((results) => results[0]);
}

function trapFocus(container, elementToFocus = container) {
    var elements = getFocusableElements(container);
    var first = elements[0];
    var last = elements[elements.length - 1];

    removeTrapFocus();

    trapFocusHandlers.focusin = (event) => {
        if (
            event.target !== container &&
            event.target !== last &&
            event.target !== first
        )
            return;

        document.addEventListener("keydown", trapFocusHandlers.keydown);
    };

    trapFocusHandlers.focusout = function () {
        document.removeEventListener("keydown", trapFocusHandlers.keydown);
    };

    trapFocusHandlers.keydown = function (event) {
        if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
        // On the last focusable element and tab forward, focus the first element.
        if (event.target === last && !event.shiftKey) {
            event.preventDefault();
            first.focus();
        }

        //  On the first focusable element and tab backward, focus the last element.
        if (
            (event.target === container || event.target === first) &&
            event.shiftKey
        ) {
            event.preventDefault();
            last.focus();
        }
    };

    document.addEventListener("focusout", trapFocusHandlers.focusout);
    document.addEventListener("focusin", trapFocusHandlers.focusin);

    elementToFocus?.focus();
}

function pauseAllMedia() {
    document.querySelectorAll(".js-youtube").forEach((video) => {
        video.contentWindow.postMessage(
            '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
            "*"
        );
    });
    document.querySelectorAll(".js-vimeo").forEach((video) => {
        video.contentWindow.postMessage('{"method":"pause"}', "*");
    });
    document.querySelectorAll("video").forEach((video) => {
        if (video.closest(".collage-video")) return;
        video.pause();
    });
    document
        .querySelectorAll("product-model")
        .forEach((model) => model.modelViewerUI?.pause());
}

function removeTrapFocus(elementToFocus = null) {
    document.removeEventListener("focusin", trapFocusHandlers.focusin);
    document.removeEventListener("focusout", trapFocusHandlers.focusout);
    document.removeEventListener("keydown", trapFocusHandlers.keydown);

    if (elementToFocus) elementToFocus.focus();
}

const serializeForm = (form) => {
    const obj = {};
    const formData = new FormData(form);
    for (const key of formData.keys()) {
        obj[key] = formData.get(key);
    }
    return JSON.stringify(obj);
};

function fetchConfig(type = "json") {
    return {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: `application/${type}`,
        },
    };
}

function createFromTemplate(templateId) {
    return document
        .getElementById(templateId)
        .content.firstElementChild.cloneNode(true);
}

function publish(eventName, data) {
    if (subscribers[eventName]) {
        subscribers[eventName].forEach((callback) => {
            callback(data);
        });
    }
}
/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == "undefined") {
    window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
    return function () {
        return fn.apply(scope, arguments);
    };
};

Shopify.setSelectorByValue = function (selector, value) {
    for (var i = 0, count = selector.options.length; i < count; i++) {
        var option = selector.options[i];
        if (value == option.value || value == option.innerHTML) {
            selector.selectedIndex = i;
            return i;
        }
    }
};

Shopify.addListener = function (target, eventName, callback) {
    target.addEventListener
        ? target.addEventListener(eventName, callback, false)
        : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
    options = options || {};
    var method = options["method"] || "post";
    var params = options["parameters"] || {};

    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for (var key in params) {
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", params[key]);
        form.appendChild(hiddenField);
    }
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
    country_domid,
    province_domid,
    options
) {
    this.countryEl = document.getElementById(country_domid);
    this.provinceEl = document.getElementById(province_domid);
    this.provinceContainer = document.getElementById(
        options["hideElement"] || province_domid
    );

    Shopify.addListener(
        this.countryEl,
        "change",
        Shopify.bind(this.countryHandler, this)
    );

    this.initCountry();
    this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
    initCountry: function () {
        var value = this.countryEl.getAttribute("data-default");
        Shopify.setSelectorByValue(this.countryEl, value);
        this.countryHandler();
    },

    initProvince: function () {
        var value = this.provinceEl.getAttribute("data-default");
        if (value && this.provinceEl.options.length > 0) {
            Shopify.setSelectorByValue(this.provinceEl, value);
        }
    },

    countryHandler: function (e) {
        var opt = this.countryEl.options[this.countryEl.selectedIndex];
        var raw = opt.getAttribute("data-provinces");
        var provinces = JSON.parse(raw);

        this.clearOptions(this.provinceEl);
        if (provinces && provinces.length == 0) {
            this.provinceContainer.style.display = "none";
        } else {
            for (var i = 0; i < provinces.length; i++) {
                var opt = document.createElement("option");
                opt.value = provinces[i][0];
                opt.innerHTML = provinces[i][1];
                this.provinceEl.appendChild(opt);
            }

            this.provinceContainer.style.display = "";
        }
    },

    clearOptions: function (selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    },

    setOptions: function (selector, values) {
        for (var i = 0, count = values.length; i < values.length; i++) {
            var opt = document.createElement("option");
            opt.value = values[i];
            opt.innerHTML = values[i];
            selector.appendChild(opt);
        }
    },
};

class ModalDialog extends HTMLElement {
    constructor() {
        super();

        this.bodyOverflowAttribute = "data-modal-opened";
        this.querySelector('[id^="ModalClose-"]').addEventListener(
            "click",
            this.hide.bind(this)
        );
        this.addEventListener("click", (event) => {
            if (event.target.nodeName === "MODAL-DIALOG") this.hide();
        });
        this.addEventListener("keyup", () => {
            if (event.code?.toUpperCase() === "ESCAPE") this.hide();
        });
    }

    show(opener) {
        this.openedBy = opener;
        this.setAttribute("open", "");
        document.body.setAttribute(this.bodyOverflowAttribute, true);
        this.querySelector(".template-popup")?.loadContent();
        trapFocus(this, this.querySelector('[role="dialog"]'));
    }

    hide() {
        this.removeAttribute("open");
        document.body.removeAttribute(this.bodyOverflowAttribute);
        removeTrapFocus(this.openedBy);
        window.pauseAllMedia();
    }
}
customElements.define("modal-dialog", ModalDialog);

class ModalOpener extends HTMLElement {
    constructor() {
        super();

        const button = this.querySelector("button");
        button?.addEventListener("click", () => {
            document
                .querySelector(this.getAttribute("data-modal"))
                ?.show(button);
        });
    }
}
customElements.define("modal-opener", ModalOpener);

(() => {
    let innerWidth = window.innerWidth;

    window.addEventListener(
        "resize",
        debounce(() => {
            if (innerWidth !== window.innerWidth) {
                innerWidth = window.innerWidth;
                publish(PUB_SUB_EVENTS.windowResizeX, undefined);
            }
        }, 200)
    );
})();

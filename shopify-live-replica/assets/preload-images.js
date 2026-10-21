const preloadImgOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.5, // half of element height
};

const observer = new IntersectionObserver((entries, ob) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            _detectMedia(entry.target);
            ob.unobserve(entry.target); // stop observing once loaded
        }
    });
}, preloadImgOptions);

const _showLoading = (media) => {
    media.forEach((div) => {
        const loader = div.previousElementSibling;
        if (loader?.classList.contains("loading-overlay"))
            loader.classList.remove("hidden");
    });
};

const _removeLoading = (media) => {
    media.forEach((div) => {
        const loader = div.previousElementSibling;
        if (loader?.classList.contains("loading-overlay"))
            loader.classList.add("hidden");
    });
};

const _loaded = (div) => {
    div.classList.add("loaded");

    const img = div.querySelector("img");
    img.removeEventListener("load", _loaded);
    _removeLoading([div]); // hide loader after delay for relevant items
};

const _detectMedia = (media) => {
    const img = media.querySelector("img");
    if (img && img.complete) {
        _loaded(media);
    } else if (img) {
        img.addEventListener("load", () => _loaded(media), { once: true }); // one-time execution
    }
};

const _preloadImg = (imgBlur, isEnhanced) => {
    if (isEnhanced) {
        imgBlur.forEach((div) => {
            if (div.classList.contains("loaded")) _removeLoading([div]);
            else {
                _showLoading([div]);
                _loaded(div);
            }
        });
    } else {
        imgBlur.forEach((div) => observer.observe(div)); // observe visible meida
    }
};

const _initPreloadImg = async () => {
    const imgBlur = document.querySelectorAll(
        ".media--blur-image:not(.loaded)"
    );
    if (!imgBlur.length) return;
    _showLoading(imgBlur); // show loader immediatelly for relevant items
    await _preloadImg(imgBlur, false);
};

// init function when navigation between pages
document.addEventListener("DOMContentLoaded", () => {
    _initPreloadImg();
});
_initPreloadImg();

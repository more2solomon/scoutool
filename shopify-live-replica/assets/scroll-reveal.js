const onReveal = async (elements) => {
    let delay = 0.075;
    const options = {
        root: null,
        rootMargin: "0px 0px 150px 0px",
        threshold: 0.15,
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("reveal-ready");
                observer.unobserve(entry.target);
            }
        });
    }, options);

    elements.forEach((element) => {
        const childs = element?.querySelectorAll(".reveal-item");
        if (!childs?.length) return;

        // observe element childs and its delay
        let timeToDelay = 0;
        childs.forEach((child, i) => {
            observer.observe(child);
            if (window.visualViewport.width < 750) return; // do not apply animation delay on small screens

            // reduce animation delay when parent element inludes lots of items (e.g. - main-collection)
            if (timeToDelay > 1) delay = 0.035;
            timeToDelay = i * delay;
            child.style.animationDelay = `${timeToDelay}s`;
        });
    });
};

const updateItemZIndex = (elements) => {
    elements.forEach((element) => {
        const childs = element.querySelectorAll(".reveal-item");
        if (!childs.length) return;

        childs.forEach((child) => {
            child.addEventListener(
                "mouseenter",
                () => (child.style.zIndex = "10"),
                { passive: true }
            );
            child.addEventListener(
                "mouseleave",
                () => child.style.removeProperty("z-index"),
                { passive: true }
            );
        });
    });
};

const initOnReveal = async () => {
    const elements = document.querySelectorAll(".reveal-slide-in");
    if (!elements.length) return;

    await onReveal(elements);
    await updateItemZIndex(elements);
};

// init function when navigation between pages
document.addEventListener("DOMContentLoaded", () => {
    initOnReveal();
});
initOnReveal();

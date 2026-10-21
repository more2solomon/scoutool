(() => {
    const offsetTop = 200; // Improve. Calculate stucked header height.
    const smoothScrollToTab = (content) => {
        const labelId = content.id.replace("tab-content-", "tab-label-");
        const label = document.getElementById(labelId);

        window.scroll({
            top: (label || content).offsetTop - offsetTop,
            behavior: "smooth",
        });
    };

    // Scroll to tabbed reviews
    const reviewApps = ["judgeme_product_reviews"];

    reviewApps.forEach((app) => {
        document.querySelectorAll('[href="#' + app + '"]').forEach((el) => {
            if (el.hash.replace("#", "") === "judgeme_product_reviews")
                el = el.firstElementChild;

            el.addEventListener("click", (event) => {
                const reviews = document.querySelectorAll("#" + app);

                var content, radio;

                if (!reviews) return;

                event.preventDefault();

                content = reviews[0].parentElement;
                smoothScrollToTab(content);
                radio =
                    content &&
                    document.getElementById(
                        content.id.replace("tab-content-", "tab-")
                    );
                // radio is not null when tabs layout is collapsed. open tab with reviews
                radio && (radio.checked = true);
            });
        });
    });

    // Scroll to opened tab when its top point is out of viewport.
    // Such behavior occurs at small screens when tabs presented as accordion.
    document
        .querySelector(".product-tabs")
        .addEventListener("change", (event) => {
            const radio = event.target;

            if (radio.id?.indexOf("tab-") === 0) {
                const content = document.getElementById(
                    radio.id.replace("tab-", "tab-content-")
                );
                if (!content) return;
                setTimeout(() => {
                    const rect = content.getBoundingClientRect();

                    if (rect.y < offsetTop) smoothScrollToTab(content);
                }, 100);

                content
                    .querySelectorAll("squama-item")
                    .forEach((squamaItem) => {
                        squamaItem.style.height =
                            squamaItem.firstElementChild.clientHeight + "px";
                    });
            }
        });
})();

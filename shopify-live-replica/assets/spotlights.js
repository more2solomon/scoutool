(() => {
    const _positionTooltip = (spot) => {
        const currentTooltip = spot.querySelector(".spot-tooltip");
        if (currentTooltip == null) return;

        const { left, right } = currentTooltip.getBoundingClientRect?.();
        const offsetRight = right + currentTooltip.offsetWidth;

        if (left < 0) currentTooltip.style.left = "0";
        if (offsetRight >= window.innerWidth) currentTooltip.style.right = "0";
    };

    const _handleOnDocumentClick = (e) => {
        if (e.target && e.target.closest(".spot-tooltip")) return;

        const links = document.querySelectorAll(".spotlight-link.active");
        if (!links.length) return;

        links.forEach((link) => link.classList.remove("active"));
    };

    document.addEventListener("click", (e) => {
        _handleOnDocumentClick(e);
    });

    // prevent tooltip block from being beyond the window width
    document.addEventListener("DOMContentLoaded", () => {
        const spots = document.querySelectorAll(".spotlight-link");

        if (!spots.length) return;
        spots.forEach((spot) => {
            _positionTooltip(spot);

            spot.addEventListener("click", (e) => {
                if (e.target && !e.target.classList.contains("active")) {
                    setTimeout(() => {
                        e.target && e.target.classList.add("active");
                    }, 150);
                }
            });
        });
    });
})();

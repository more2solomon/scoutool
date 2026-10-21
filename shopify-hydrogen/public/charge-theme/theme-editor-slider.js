document.addEventListener("shopify:block:select", function (event) {
    const sliderComponent = event.target.closest("slider-component.slideshow");
    if (!sliderComponent) return;
    sliderComponent.stop();

    window.requestAnimationFrame(() => {
        sliderComponent.slider.scrollTo({ left: event.target.offsetLeft });
    });
});

document.addEventListener("shopify:block:deselect", function (event) {
    const sliderComponent = event.target.closest("slider-component.slideshow");
    if (!sliderComponent) return;

    sliderComponent.stop();
    sliderComponent.play();
});

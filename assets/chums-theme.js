(function () {
    function showSKU(sku) {
        console.log('filtering for sku:', sku);
        if (elements.productSection && elements.productThumbs) {
            elements.productSection.addEventListener('variantChange', handleVariantChange);
            const thumbs = Array.from(elements.productThumbs.querySelectorAll('.product__thumb-item'));
            if (sku) {
                thumbs.forEach(el => {
                    el.tabIndex = -1;
                    el.ariaHidden = 'true';
                    el.classList.toggle('visually-hidden', true);
                })
                thumbs
                    .filter(el => el.dataset.group === 'all' || el.dataset.setName === sku)
                    .forEach(el => {
                        el.removeAttribute('aria-hidden');
                        el.tabIndex = 0;
                        el.classList.toggle('visually-hidden', false);
                    })
            } else {
                thumbs.forEach(el => {
                    el.tabIndex = 0;
                    el.removeAttribute('aria-hidden');
                })
            }
        }
    }

    const elements = {
        productSection: null,
        productThumbs: null,
    }

    const handleVariantChange = (evt) => {
        console.log('chums:handleVariantChange()', evt);
        if (elements.productThumbs) {
            elements.productThumbs.dataset.showSku = evt.detail.variant.sku;
            showSKU(evt.detail.variant.sku);
        }
    }


    elements.productSection = document.querySelector('.product-section');
    elements.productThumbs = document.querySelector('.product-section .product__thumbs');

    if (elements.productSection && elements.productThumbs) {
        // showSKU(elements.productThumbs.dataset.showSku);
        // elements.productSection.addEventListener('variantChange', handleVariantChange);
    }

}());

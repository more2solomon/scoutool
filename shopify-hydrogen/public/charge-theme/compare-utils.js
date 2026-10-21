class CompareStorageUtil {
    static set(key, items) {
        localStorage.setItem(key, JSON.stringify(items));
    }

    static get() {
        return localStorage.getItem(CompareUtils.storageKey);
    }
}

class CompareUtils {
    static init() {
        CompareUtils.comparelist = [];
        CompareUtils.sectionId = "compare-products";
        CompareUtils.storageKey = "argento-compare-products";
        CompareUtils.compareLinkId = "compare-link";
        CompareUtils.comparePopup = "compare-popup";
        CompareUtils.addToCompare = "compare-add-button";
    }

    static setCompareItems(comparelist) {
        CompareStorageUtil.set(CompareUtils.storageKey, comparelist);
    }

    static getCompareItems() {
        return CompareStorageUtil.get(CompareUtils.storageKey, true) || [];
    }
}

CompareUtils.init();

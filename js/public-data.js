import { firebaseConfigured } from "./firebase-config.js";
import { readPublicSiteData, watchPublicSiteData } from "./firebase.js";

const localKeys = {
    products: "shail_admin_products",
    inventory: "shail_aquarium_items",
    gallery: "shail_gallery_items",
    businessSettings: "shail_business_settings",
    shopTimings: "shail_shop_timings"
};

function applyRemoteData(documents, { preserveMissing = true } = {}) {
    try {
        Object.entries(localKeys).forEach(([documentId, storageKey]) => {
            if (!Object.prototype.hasOwnProperty.call(documents, documentId)) {
                if (!preserveMissing) localStorage.removeItem(storageKey);
                return;
            }
            localStorage.setItem(storageKey, JSON.stringify(documents[documentId]));
        });
    } catch (error) {
        console.error("Unable to cache public SHAIL website data in this browser.", error);
        throw error;
    }
}

function notifyPublicSyncError(error) {
    console.error("Unable to sync SHAIL website data from Firebase.", error);
    const notification = document.querySelector(".site-notification");
    const message = document.getElementById("notificationText");
    if (notification && message) {
        message.textContent = "Live website data could not be loaded. Please try again later.";
        notification.classList.add("show");
    }
}

window.__shailPublicDataReady = (async () => {
    if (!firebaseConfigured()) {
        console.warn("SHAIL live data is not connected yet. Follow FIREBASE_NETLIFY_SETUP.md to configure Firebase.");
        return;
    }

    try {
        applyRemoteData(await readPublicSiteData());
        watchPublicSiteData(documents => {
            applyRemoteData(documents);
            window.dispatchEvent(new CustomEvent("shail:data-updated"));
        }, notifyPublicSyncError);
    } catch (error) {
        notifyPublicSyncError(error);
    }
})();

const localKeys = {
    products: "shail_admin_products",
    inventory: "shail_aquarium_items",
    gallery: "shail_gallery_items",
    businessSettings: "shail_business_settings",
    shopTimings: "shail_shop_timings"
};

function applyPublicData(documents) {
    const migrated = localStorage.getItem("shail_content_migrated") === "true";
    Object.entries(localKeys).forEach(([documentId, storageKey]) => {
        if (Object.prototype.hasOwnProperty.call(documents, documentId)) {
            const value = documents[documentId];
            const saved = localStorage.getItem(storageKey);
            const emptyServerValue = Array.isArray(value)
                ? value.length === 0
                : value && typeof value === "object" && Object.keys(value).length === 0;
            if (!migrated && saved !== null && emptyServerValue) return;
            localStorage.setItem(storageKey, JSON.stringify(value));
        }
    });
    window.dispatchEvent(new CustomEvent("shail:data-updated"));
}

async function loadPublicData() {
    const response = await fetch(`./site-data.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Website content could not be loaded (${response.status}).`);
    }
    const data = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("The published site-data.json file has an invalid format.");
    }
    applyPublicData(data);
}

window.__shailPublicDataReady = loadPublicData().catch(error => {
    console.error("Unable to load public SHAIL website content.", error);
    const notification = document.getElementById("siteNotification");
    const message = document.getElementById("notificationText");
    if (notification && message) {
        message.textContent = "Website content could not be loaded. Please try again later.";
        notification.classList.add("show");
    }
});

window.setInterval(() => {
    loadPublicData().catch(error => console.error("Unable to refresh SHAIL website content.", error));
}, 60000);

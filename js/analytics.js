import { API_BASE_URL, recordAnalyticsEvent } from "./api-config.js";

const sessionStorageKey = "shail_analytics_session";
const optOutKey = "shail_analytics_opt_out";
const allowedTargets = new Set([
    "navigation", "whatsapp", "phone", "email", "map", "external", "enquiry", "other"
]);

const optOutButton = document.getElementById("analyticsOptOut");
const optOutStatus = document.getElementById("analyticsOptOutStatus");
const isOptedOut = localStorage.getItem(optOutKey) === "true";
if (optOutButton) {
    optOutButton.textContent = isOptedOut ? "Opt back in" : "Opt out";
    if (isOptedOut && optOutStatus) optOutStatus.textContent = "Analytics are off in this browser.";
    optOutButton.addEventListener("click", () => {
        localStorage.setItem(optOutKey, String(!isOptedOut));
        window.location.reload();
    });
}

if (API_BASE_URL.startsWith("https://") && !API_BASE_URL.includes("REPLACE_WITH") && !isOptedOut) {
    let sessionId;
    try {
        sessionId = sessionStorage.getItem(sessionStorageKey);
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            sessionStorage.setItem(sessionStorageKey, sessionId);
        }
    } catch (error) {
        console.error("Unable to initialize the anonymous SHAIL analytics session.", error);
    }

    if (sessionId) {
        const searchEngine = (() => {
            let host = "";
            try {
                const referrer = new URL(document.referrer);
                if (referrer.origin === window.location.origin) return "direct";
                host = referrer.hostname.toLowerCase();
            } catch {
                return "direct";
            }
            if (/(^|\.)google\./.test(host)) return "google";
            if (/(^|\.)bing\./.test(host)) return "bing";
            if (/(^|\.)yahoo\./.test(host)) return "yahoo";
            if (/(^|\.)duckduckgo\./.test(host)) return "duckduckgo";
            return document.referrer ? "other" : "direct";
        })();

        const record = (type, target = "none") => {
            const event = {
                type,
                sessionId,
                path: `${window.location.pathname}${window.location.hash}`.slice(0, 100),
                source: searchEngine,
                target: allowedTargets.has(target) ? target : "other"
            };
            recordAnalyticsEvent(event).catch(error => {
                console.error("Unable to record SHAIL website analytics.", error);
            });
        };

        const recordPageView = () => record("page_view");
        recordPageView();
        window.addEventListener("hashchange", recordPageView);

        document.addEventListener("click", event => {
            if (!(event.target instanceof Element)) return;
            const anchor = event.target.closest("a[href]");
            if (anchor) {
                const href = anchor.getAttribute("href") || "";
                let target = "other";
                if (href.startsWith("#")) target = "navigation";
                else if (/^(https?:\/\/)?(wa\.me|api\.whatsapp\.com)\//i.test(href)) target = "whatsapp";
                else if (href.startsWith("tel:")) target = "phone";
                else if (href.startsWith("mailto:")) target = "email";
                else if (/google\.[^/]+\/maps/i.test(href)) target = "map";
                else if (/^https?:\/\//i.test(href)) target = "external";
                record("link_click", target);
                return;
            }
            if (event.target.closest(".dynamic-enquire")) record("link_click", "enquiry");
        }, { capture: true });
    }
}

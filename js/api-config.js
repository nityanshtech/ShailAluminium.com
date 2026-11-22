export const API_BASE_URL = "https://shail-admin-api.shail-dashbord.workers.dev";

const sessionKey = "shail_admin_session";
const apiBaseUrl = API_BASE_URL.replace(/\/+$/, "");

export function isApiConfigured() {
    try {
        return new URL(API_BASE_URL).hostname !== "REPLACE_WITH_YOUR_WORKER.workers.dev";
    } catch {
        return false;
    }
}

export function clearAdminSession() {
    sessionStorage.removeItem(sessionKey);
}

async function request(path, { method = "GET", body, authenticated = true } = {}) {
    if (!isApiConfigured()) {
        throw new Error("The dashboard API is not configured. Follow ADMIN_DASHBOARD_SETUP.md.");
    }

    const headers = { "Content-Type": "application/json" };
    if (authenticated) {
        const token = sessionStorage.getItem(sessionKey);
        if (!token) throw new Error("Your admin session has expired. Sign in again.");
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const result = response.status === 204 ? {} : await response.json();
    if (!response.ok) {
        if (response.status === 401 && authenticated) clearAdminSession();
        throw new Error(result.error || `Dashboard request failed (${response.status}).`);
    }
    return result;
}

export async function signInAdmin(password) {
    const result = await request("/api/login", {
        method: "POST",
        body: { password },
        authenticated: false
    });
    if (typeof result.token !== "string" || !result.token) {
        throw new Error("The dashboard server returned an invalid sign-in response.");
    }
    sessionStorage.setItem(sessionKey, result.token);
}

export function hasAdminSession() {
    return Boolean(sessionStorage.getItem(sessionKey));
}

export function signOutAdmin() {
    clearAdminSession();
}

export const readSiteContent = () => request("/api/content");
export const saveSiteContent = content => request("/api/content", { method: "PUT", body: content });
export const readAnalytics = days => request(`/api/analytics?days=${encodeURIComponent(days)}`);
export const generateReport = data => request("/api/report", { method: "POST", body: data });
export const askShail = messages => request("/api/chat", {
    method: "POST",
    body: { messages },
    authenticated: false
});

export async function recordAnalyticsEvent(event) {
    if (!isApiConfigured()) return;
    const response = await fetch(`${apiBaseUrl}/api/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
        keepalive: true
    });
    if (!response.ok) {
        throw new Error(`Analytics request failed (${response.status}).`);
    }
}

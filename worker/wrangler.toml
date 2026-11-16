const encoder = new TextEncoder();
const decoder = new TextDecoder();
const eventTypes = new Set(["page_view", "link_click"]);
const eventTargets = new Set([
    "none", "navigation", "whatsapp", "phone", "email", "map", "external", "enquiry", "other"
]);

function jsonResponse(data, status, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
            ...headers
        }
    });
}

function corsHeaders(request, env) {
    const origin = request.headers.get("Origin");
    const allowed = new Set((env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean));
    if (origin && new URL(request.url).origin === origin) allowed.add(origin);
    if (!origin || !allowed.has(origin)) return {};
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
        "Access-Control-Allow-Headers": "Authorization,Content-Type",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
    };
}

function base64UrlEncode(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(value) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function signToken(payload, secret) {
    const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
    const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
    const unsigned = `${header}.${body}`;
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(unsigned)));
    return `${unsigned}.${base64UrlEncode(signature)}`;
}

async function verifyToken(token, secret) {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const unsigned = `${parts[0]}.${parts[1]}`;
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", key, base64UrlDecode(parts[2]), encoder.encode(unsigned));
    if (!valid) return false;
    const payload = JSON.parse(decoder.decode(base64UrlDecode(parts[1])));
    return payload.exp > Math.floor(Date.now() / 1000) && payload.sub === "shail-admin";
}

async function constantTimeStringMatch(left, right) {
    const hash = async value => new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
    const [a, b] = await Promise.all([hash(left), hash(right)]);
    let difference = 0;
    for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
    return difference === 0;
}

async function loginRateLimitKey(request, env) {
    const clientAddress = request.headers.get("CF-Connecting-IP") || "unknown";
    const digest = new Uint8Array(await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(`${env.ADMIN_TOKEN_SECRET}:${clientAddress}`)
    ));
    return Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function authenticate(request, env) {
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token || !env.ADMIN_TOKEN_SECRET) return false;
    try {
        return await verifyToken(token, env.ADMIN_TOKEN_SECRET);
    } catch {
        return false;
    }
}

function requireConfiguration(env) {
    const required = ["ADMIN_PASSWORD", "ADMIN_TOKEN_SECRET", "GITHUB_TOKEN", "CONTENT_REPO", "CONTENT_BRANCH", "CONTENT_PATH"];
    const missing = required.filter(key => !env[key] || env[key].includes("REPLACE_WITH"));
    if (!env.DB) missing.push("D1 database binding");
    if (!env.ALLOWED_ORIGINS || env.ALLOWED_ORIGINS.includes("REPLACE_WITH")) missing.push("ALLOWED_ORIGINS");
    if (env.ADMIN_PASSWORD && env.ADMIN_PASSWORD.length < 16) missing.push("ADMIN_PASSWORD (minimum 16 characters)");
    if (env.ADMIN_TOKEN_SECRET && encoder.encode(env.ADMIN_TOKEN_SECRET).length < 32) {
        missing.push("ADMIN_TOKEN_SECRET (minimum 32 bytes)");
    }
    return missing;
}

function githubHeaders(env) {
    return {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "SHAIL-admin-dashboard"
    };
}

function encodeBase64(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

async function readGitHubContent(env) {
    const encodedPath = env.CONTENT_PATH.split("/").map(encodeURIComponent).join("/");
    const endpoint = `https://api.github.com/repos/${env.CONTENT_REPO}/contents/${encodedPath}?ref=${encodeURIComponent(env.CONTENT_BRANCH)}`;
    const response = await fetch(endpoint, { headers: githubHeaders(env) });
    if (response.status === 404) return { content: {}, sha: null };
    if (!response.ok) throw new Error(`GitHub content read failed (${response.status}).`);
    const file = await response.json();
    const bytes = Uint8Array.from(atob(file.content.replace(/\s/g, "")), char => char.charCodeAt(0));
    return { content: JSON.parse(decoder.decode(bytes)), sha: file.sha };
}

function validateSiteContent(data) {
    const allowed = ["products", "inventory", "gallery", "businessSettings", "shopTimings"];
    if (!data || typeof data !== "object" || Array.isArray(data)) return false;
    if (Object.keys(data).some(key => !allowed.includes(key))) return false;
    if (!Array.isArray(data.products) || !Array.isArray(data.inventory) || !Array.isArray(data.gallery)) return false;
    if (typeof data.businessSettings !== "object" || Array.isArray(data.businessSettings) || !data.businessSettings
        || typeof data.shopTimings !== "object" || Array.isArray(data.shopTimings) || !data.shopTimings) return false;
    return new TextEncoder().encode(JSON.stringify(data)).length <= 450000;
}

async function handleTrack(request, env, cors) {
    const event = await request.json();
    if (!event || !eventTypes.has(event.type)
        || typeof event.sessionId !== "string"
        || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(event.sessionId)
        || typeof event.path !== "string"
        || event.path.length > 100
        || !/^\/[A-Za-z0-9._~/%-]*(?:#[A-Za-z0-9_-]+)?$/.test(event.path)
        || typeof event.source !== "string"
        || !["direct", "google", "bing", "yahoo", "duckduckgo", "other"].includes(event.source)
        || !eventTargets.has(event.target)) {
        return jsonResponse({ error: "Invalid analytics event." }, 400, cors);
    }
    await env.DB.prepare(
        "INSERT INTO analytics_events (timestamp,type,session_id,path,source,target) VALUES (?,?,?,?,?,?)"
    ).bind(Date.now(), event.type, event.sessionId, event.path, event.source, event.target).run();
    return new Response(null, { status: 204, headers: cors });
}

async function handleAnalytics(url, env) {
    const days = Number(url.searchParams.get("days"));
    const cutoff = Date.now() - days * 86400000;
    const [totals, daily, pages, links, sources] = await Promise.all([
        env.DB.prepare(`SELECT
            COUNT(CASE WHEN type='page_view' THEN 1 END) AS pageViews,
            COUNT(CASE WHEN type='link_click' THEN 1 END) AS linkClicks,
            COUNT(DISTINCT CASE WHEN type='page_view' THEN session_id END) AS sessions,
            COUNT(DISTINCT CASE WHEN type='page_view' AND source IN ('google','bing','yahoo','duckduckgo') THEN session_id END) AS searchReferrals
            FROM analytics_events WHERE timestamp >= ?`).bind(cutoff).first(),
        env.DB.prepare(`SELECT strftime('%Y-%m-%d', timestamp / 1000 + 19800, 'unixepoch') AS date,
            COUNT(CASE WHEN type='page_view' THEN 1 END) AS pageViews,
            COUNT(DISTINCT CASE WHEN type='page_view' THEN session_id END) AS sessions
            FROM analytics_events WHERE timestamp >= ? GROUP BY date ORDER BY date`).bind(cutoff).all(),
        env.DB.prepare(`SELECT path AS key, COUNT(*) AS count FROM analytics_events
            WHERE timestamp >= ? AND type='page_view' GROUP BY path ORDER BY count DESC LIMIT 8`).bind(cutoff).all(),
        env.DB.prepare(`SELECT target AS key, COUNT(*) AS count FROM analytics_events
            WHERE timestamp >= ? AND type='link_click' GROUP BY target ORDER BY count DESC LIMIT 8`).bind(cutoff).all(),
        env.DB.prepare(`SELECT source AS key, COUNT(DISTINCT session_id) AS count FROM analytics_events
            WHERE timestamp >= ? AND type='page_view' GROUP BY source ORDER BY count DESC`).bind(cutoff).all()
    ]);
    return {
        rangeDays: days,
        totals: {
            sessions: totals.sessions || 0,
            pageViews: totals.pageViews || 0,
            linkClicks: totals.linkClicks || 0,
            searchReferrals: totals.searchReferrals || 0
        },
        daily: daily.results || [],
        topPages: pages.results || [],
        topLinks: links.results || [],
        trafficSources: sources.results || []
    };
}

async function handleReport(request, env, cors) {
    if (!env.GEMINI_API_KEY) return jsonResponse({ error: "Gemini is not configured. Add GEMINI_API_KEY as a Worker secret." }, 503, cors);
    const data = await request.json();
    if (!data || ![7, 30, 90].includes(data.rangeDays) || !data.totals || !Array.isArray(data.daily)
        || data.daily.length > 90 || !Array.isArray(data.topPages) || !Array.isArray(data.topLinks)
        || !Array.isArray(data.trafficSources)) {
        return jsonResponse({ error: "Analytics report data is invalid." }, 400, cors);
    }
    const prompt = `You are a careful business analyst for SHAIL, an aluminium, glass, aquarium and live-fish business in Gorakhpur, India.
Analyze only the supplied website analytics for the last ${data.rangeDays} days. Write a concise report with headings: Performance summary, What visitors did, Traffic sources, Practical next steps, Data limitations.
Use only observed counts. Do not invent sales, customer identities, search keywords, impressions, causes, or trends not supported by the data. State that search referrals are not search-keyword counts. If there are no events, say tracking may have just started. Recommend measurable website improvements based on the actual page and link data.
Analytics JSON:
${JSON.stringify(data)}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL || "gemini-2.5-flash")}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!response.ok) {
        console.error("Gemini report request failed.", response.status);
        return jsonResponse({ error: "Gemini could not generate the report. Check the API key, model, quota, and try again." }, 502, cors);
    }
    const result = await response.json();
    const report = result.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("\n").trim();
    if (!report) return jsonResponse({ error: "Gemini returned no report. Please try again." }, 502, cors);
    return jsonResponse({ report }, 200, cors);
}

export default {
    async fetch(request, env) {
        const cors = corsHeaders(request, env);
        const origin = request.headers.get("Origin");
        const allowed = new Set((env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean));
        if (origin && new URL(request.url).origin === origin) allowed.add(origin);
        if (origin && !allowed.has(origin)) return jsonResponse({ error: "This website origin is not allowed." }, 403);
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: cors });
        }

        const url = new URL(request.url);
        const api = (data, status = 200) => jsonResponse(data, status, cors);
        try {
            const contentLength = Number(request.headers.get("Content-Length")) || 0;
            if (contentLength > 500000) return api({ error: "Request body is too large." }, 413);
            const missing = requireConfiguration(env);
            if (missing.length && url.pathname !== "/api/track") {
                return api({ error: `Worker configuration is incomplete: ${missing.join(", ")}.` }, 503);
            }

            if (url.pathname === "/api/login" && request.method === "POST") {
                const body = await request.json();
                const now = Date.now();
                const windowStart = Math.floor(now / 600000) * 600000;
                const clientKey = await loginRateLimitKey(request, env);
                await env.DB.prepare("DELETE FROM login_attempts WHERE window_start < ?").bind(windowStart).run();
                const attempts = await env.DB.prepare(
                    "SELECT failures FROM login_attempts WHERE ip_hash = ? AND window_start = ?"
                ).bind(clientKey, windowStart).first();
                if (Number(attempts?.failures || 0) >= 5) {
                    return api({ error: "Too many sign-in attempts. Wait 10 minutes and try again." }, 429);
                }
                if (typeof body?.password !== "string"
                    || !await constantTimeStringMatch(body.password, env.ADMIN_PASSWORD)) {
                    await env.DB.prepare(`INSERT INTO login_attempts (ip_hash,window_start,failures) VALUES (?,?,1)
                        ON CONFLICT(ip_hash,window_start) DO UPDATE SET failures=failures+1`)
                        .bind(clientKey, windowStart).run();
                    return api({ error: "Incorrect administrator password." }, 401);
                }
                await env.DB.prepare("DELETE FROM login_attempts WHERE ip_hash = ?").bind(clientKey).run();
                const token = await signToken({
                    sub: "shail-admin",
                    exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60
                }, env.ADMIN_TOKEN_SECRET);
                return api({ token });
            }

            if (url.pathname === "/api/track" && request.method === "POST") {
                return handleTrack(request, env, cors);
            }

            if (!await authenticate(request, env)) return api({ error: "Sign in to the administrator dashboard." }, 401);

            if (url.pathname === "/api/content" && request.method === "GET") {
                const { content } = await readGitHubContent(env);
                return api({ content });
            }
            if (url.pathname === "/api/content" && request.method === "PUT") {
                const content = await request.json();
                if (!validateSiteContent(content)) return api({ error: "Website content is invalid or too large." }, 400);
                const { sha } = await readGitHubContent(env);
                const payload = {
                    message: "Update SHAIL website content from admin dashboard",
                    content: encodeBase64(encoder.encode(JSON.stringify(content, null, 2) + "\n")),
                    branch: env.CONTENT_BRANCH,
                    ...(sha ? { sha } : {})
                };
                const endpoint = `https://api.github.com/repos/${env.CONTENT_REPO}/contents/${env.CONTENT_PATH}`;
                const response = await fetch(endpoint, {
                    method: "PUT",
                    headers: { ...githubHeaders(env), "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    console.error("GitHub content update failed.", response.status);
                    return api({ error: "GitHub could not save the content. Verify repository, branch, path, and token permissions." }, 502);
                }
                return api({ saved: true, message: "Saved to GitHub. GitHub Pages will publish the change shortly." });
            }
            if (url.pathname === "/api/analytics" && request.method === "GET") {
                if (![7, 30, 90].includes(Number(url.searchParams.get("days")))) {
                    return api({ error: "Choose an analytics period of 7, 30, or 90 days." }, 400);
                }
                return api(await handleAnalytics(url, env));
            }
            if (url.pathname === "/api/report" && request.method === "POST") {
                return handleReport(request, env, cors);
            }
            return api({ error: "API endpoint not found." }, 404);
        } catch (error) {
            console.error("SHAIL admin API request failed.", error);
            return api({ error: "The dashboard service could not complete this request. Check the Worker logs." }, 500);
        }
    },

    async scheduled(_controller, env) {
        const eventCutoff = Date.now() - 365 * 86400000;
        const attemptCutoff = Date.now() - 86400000;
        await Promise.all([
            env.DB.prepare("DELETE FROM analytics_events WHERE timestamp < ?").bind(eventCutoff).run(),
            env.DB.prepare("DELETE FROM login_attempts WHERE window_start < ?").bind(attemptCutoff).run()
        ]);
    }
};

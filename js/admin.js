import {
    clearAdminSession,
    generateReport,
    hasAdminSession,
    isApiConfigured,
    readAnalytics,
    readSiteContent,
    saveSiteContent,
    signInAdmin,
    signOutAdmin
} from "./api-config.js";

(() => {
const keys = {
        products: "shail_admin_products",
        inventory: "shail_aquarium_items",
        gallery: "shail_gallery_items",
        settings: "shail_business_settings",
        hours: "shail_shop_timings"
    };
    const documentIds = {
        [keys.products]: "products",
        [keys.inventory]: "inventory",
        [keys.gallery]: "gallery",
        [keys.settings]: "businessSettings",
        [keys.hours]: "shopTimings"
    };
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const defaultHours = () => ({
        enabled: true,
        notice: "",
        days: Object.fromEntries(days.map(day => [day, {
            open: day !== "Sunday",
            from: "09:00",
            to: "20:00"
        }]))
    });
    const categories = ["Aluminium", "Glass", "Aquarium", "Live Fish", "Accessories"];
    const $ = (selector, parent = document) => parent.querySelector(selector);
    const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
    const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
    const money = value => new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
    const pageTitle = path => {
        const section = String(path || "").split("#")[1];
        if (!section) return "Home";
        return section.replace(/[-_]/g, " ").replace(/\b\w/g, character => character.toUpperCase());
    };
    const targetTitle = target => ({
        navigation: "Section navigation",
        whatsapp: "WhatsApp",
        phone: "Phone calls",
        email: "Email",
        map: "Map directions",
        external: "External links",
        enquiry: "Product enquiries",
        other: "Other links"
    })[target] || "Other links";
    const sourceTitle = source => ({
        direct: "Direct / unknown",
        google: "Google",
        bing: "Bing",
        yahoo: "Yahoo",
        duckduckgo: "DuckDuckGo",
        other: "Other websites"
    })[source] || "Other websites";

    let toastTimer;
    let currentUser = null;
    let siteContent = {
        products: [],
        inventory: [],
        gallery: [],
        businessSettings: {},
        shopTimings: {}
    };
    let analyticsData = null;
    let analyticsRangeDays = 30;
    const toast = (message, isError = false) => {
        const element = $("#toast");
        element.textContent = message;
        element.classList.toggle("error", isError);
        element.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => element.classList.remove("show"), 3400);
    };

    const readJson = (key, fallback) => {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch (error) {
            console.error(`Unable to read ${key} from browser storage.`, error);
            toast("Saved data could not be read. Check this browser's storage.", true);
            return fallback;
        }
    };

    const readArray = key => {
        const value = readJson(key, []);
        if (!Array.isArray(value)) {
            console.error(`Expected an array for ${key}.`);
            toast("Some saved content has an invalid format and was not changed.", true);
            return [];
        }
        return value;
    };

    const writeLocalJson = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Unable to save ${key} to browser storage.`, error);
            toast("Could not save changes. Browser storage may be full or unavailable.", true);
            return false;
        }
    };

    const includeUnmigratedContent = content => {
        if (localStorage.getItem("shail_content_migrated") === "true") return content;
        const merged = { ...content };
        Object.entries(documentIds).forEach(([storageKey, documentId]) => {
            const saved = localStorage.getItem(storageKey);
            const remoteValue = merged[documentId];
            const remoteIsEmpty = (Array.isArray(remoteValue) && remoteValue.length === 0)
                || (remoteValue && typeof remoteValue === "object" && !Array.isArray(remoteValue)
                    && Object.keys(remoteValue).length === 0);
            if (saved === null || !remoteIsEmpty) return;
            try {
                merged[documentId] = JSON.parse(saved);
            } catch (error) {
                console.error(`Unable to preserve invalid saved browser data for ${storageKey}.`, error);
                toast("A saved browser section is invalid and was not included in this change.", true);
            }
        });
        return merged;
    };

    const writeJson = async (key, value) => {
        const documentId = documentIds[key];
        if (!documentId || !currentUser) {
            toast("Sign in to the SHAIL administrator dashboard before saving.", true);
            return false;
        }
        try {
            const nextContent = includeUnmigratedContent({ ...siteContent, [documentId]: value });
            const result = await saveSiteContent(nextContent);
            siteContent = nextContent;
            if (!writeLocalJson(key, value)) return false;
            localStorage.setItem("shail_content_migrated", "true");
            $("#syncStatus").textContent = result.message || "Changes saved to GitHub.";
            return true;
        } catch (error) {
            console.error(`Unable to save ${documentId} through the admin service.`, error);
            toast(error.message || "Cloud save failed. Check the dashboard service and try again.", true);
            return false;
        }
    };

    const validImage = value => /^(https?:\/\/|\.{0,2}\/|data:image\/(?:png|jpeg|webp|gif|svg\+xml)[^,]*,)/i.test(String(value || "").trim());
    const imageMarkup = (value, className = "") => validImage(value)
        ? `<img class="${className}" src="${escapeHtml(value)}" alt="" loading="lazy">`
        : `<i class="fa-regular fa-image ${className}" aria-hidden="true"></i>`;
    const productItems = () => readArray(keys.products);
    const inventoryItems = () => readArray(keys.inventory);
    const galleryItems = () => readArray(keys.gallery);

    const activeViewName = () => $(".view-panel.active")?.id.replace("view-", "") || "overview";
    const setView = view => {
        $$(".view-panel").forEach(panel => panel.classList.toggle("active", panel.id === `view-${view}`));
        $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === view));
        const title = view === "gallery" ? "Project gallery" : view === "settings" ? "Website settings" : view[0].toUpperCase() + view.slice(1);
        $("#currentSection").textContent = title;
        document.title = `${title} | SHAIL Admin`;
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (view === "analytics") loadAnalytics();
    };

    const renderAnalyticsList = (element, entries, labelFor) => {
        element.innerHTML = entries.length
            ? entries.map(entry => `
                <div class="analytics-list-row">
                    <span>${escapeHtml(labelFor(entry.key))}</span><strong>${Number(entry.count).toLocaleString("en-IN")}</strong>
                </div>`).join("")
            : `<p class="muted-empty">No data recorded in this period yet.</p>`;
    };

    const drawTrafficChart = daily => {
        const canvas = $("#trafficChart");
        const context = canvas.getContext("2d");
        if (!context) return;
        const width = Math.max(300, canvas.clientWidth);
        const height = 260;
        const ratio = window.devicePixelRatio || 1;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        context.scale(ratio, ratio);
        context.clearRect(0, 0, width, height);

        const byDate = new Map(daily.map(day => [day.date, day]));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const data = Array.from({ length: analyticsRangeDays }, (_, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() - analyticsRangeDays + index + 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            const value = byDate.get(key);
            return {
                label: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(date),
                sessions: Number(value?.sessions) || 0,
                pageViews: Number(value?.pageViews) || 0
            };
        });
        const maxValue = Math.max(1, ...data.map(day => Math.max(day.sessions, day.pageViews)));
        const padding = { top: 14, right: 12, bottom: 30, left: 30 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        context.font = "10px DM Sans, sans-serif";
        context.textBaseline = "middle";
        for (let tick = 0; tick <= 4; tick += 1) {
            const y = padding.top + chartHeight * tick / 4;
            context.strokeStyle = "rgba(210,232,245,.08)";
            context.beginPath();
            context.moveTo(padding.left, y);
            context.lineTo(width - padding.right, y);
            context.stroke();
            context.fillStyle = "#8294a1";
            context.textAlign = "right";
            context.fillText(String(Math.round(maxValue * (4 - tick) / 4)), padding.left - 7, y);
        }

        const drawLine = (property, color) => {
            context.strokeStyle = color;
            context.lineWidth = 2;
            context.beginPath();
            data.forEach((day, index) => {
                const x = padding.left + (data.length === 1 ? chartWidth / 2 : chartWidth * index / (data.length - 1));
                const y = padding.top + chartHeight * (1 - day[property] / maxValue);
                if (index === 0) context.moveTo(x, y);
                else context.lineTo(x, y);
            });
            context.stroke();
        };
        drawLine("pageViews", "#bba0ff");
        drawLine("sessions", "#61dff1");
        const labelStep = Math.max(1, Math.ceil(data.length / 7));
        context.fillStyle = "#8294a1";
        context.textAlign = "center";
        data.forEach((day, index) => {
            if (index % labelStep !== 0 && index !== data.length - 1) return;
            const x = padding.left + (data.length === 1 ? chartWidth / 2 : chartWidth * index / (data.length - 1));
            context.fillText(day.label, x, height - 12);
        });
        return data;
    };

    const renderAnalytics = () => {
        const totals = analyticsData.totals;
        $("#analyticsSessions").textContent = Number(totals.sessions || 0).toLocaleString("en-IN");
        $("#analyticsPageViews").textContent = Number(totals.pageViews || 0).toLocaleString("en-IN");
        $("#analyticsClicks").textContent = Number(totals.linkClicks || 0).toLocaleString("en-IN");
        $("#analyticsSearchVisits").textContent = Number(totals.searchReferrals || 0).toLocaleString("en-IN");
        renderAnalyticsList($("#topLinkClicks"), analyticsData.topLinks || [], targetTitle);
        renderAnalyticsList($("#topPages"), analyticsData.topPages || [], pageTitle);
        renderAnalyticsList($("#trafficSources"), analyticsData.trafficSources || [], sourceTitle);
        drawTrafficChart(analyticsData.daily || []);
        $("#analyticsDataStatus").textContent = `Loaded analytics for the last ${analyticsRangeDays} days.`;
    };

    const loadAnalytics = async () => {
        if (!currentUser) return;
        analyticsRangeDays = Number($("#analyticsRange").value);
        $("#analyticsSessions").textContent = "…";
        $("#analyticsPageViews").textContent = "…";
        $("#analyticsClicks").textContent = "…";
        $("#analyticsSearchVisits").textContent = "…";
        $("#analyticsDataStatus").textContent = "Loading analytics...";
        $("#generateReport").disabled = true;
        try {
            analyticsData = await readAnalytics(analyticsRangeDays);
            renderAnalytics();
            $("#generateReport").disabled = false;
        } catch (error) {
            console.error("Unable to load SHAIL analytics from the admin service.", error);
            $("#analyticsDataStatus").textContent = "Analytics could not be loaded. Check the dashboard service and your connection, then retry.";
            ["#analyticsSessions", "#analyticsPageViews", "#analyticsClicks", "#analyticsSearchVisits"].forEach(selector => {
                $(selector).textContent = "—";
            });
            ["#topLinkClicks", "#topPages", "#trafficSources"].forEach(selector => {
                $(selector).innerHTML = `<p class="muted-empty">Analytics data is unavailable.</p>`;
            });
            toast(error.message || "Could not load analytics. Check that the service is configured.", true);
        }
    };

    const generateAnalyticsReport = async () => {
        const button = $("#generateReport");
        const status = $("#reportStatus");
        const output = $("#reportOutput");
        button.disabled = true;
        output.hidden = true;
        status.textContent = "Gemini is reviewing the selected analytics period...";
        try {
            if (!analyticsData) throw new Error("Load analytics before generating a report.");
            const result = await generateReport(analyticsData);
            if (typeof result.report !== "string" || !result.report.trim()) {
                throw new Error("Gemini returned an empty report. Please try again.");
            }
            output.textContent = result.report;
            output.hidden = false;
            status.textContent = "Report generated from the analytics data shown above.";
        } catch (error) {
            console.error("Unable to generate the SHAIL Gemini analytics report.", error);
            status.textContent = error.message || "Gemini report generation failed. Check the Worker settings.";
            toast(status.textContent, true);
        } finally {
            button.disabled = false;
        }
    };

    const renderProductRows = items => {
        $("#productsTable").innerHTML = items.map(item => `
            <tr>
                <td><div class="table-item"><span class="table-thumb">${imageMarkup(item.image)}</span><span><strong>${escapeHtml(item.name || "Unnamed product")}</strong><small>${escapeHtml(item.description || "No description")}</small></span></div></td>
                <td><span class="category-pill">${escapeHtml(item.category || "General")}</span></td>
                <td>${money(item.price)}</td>
                <td><span class="category-pill">Published</span></td>
                <td><span class="row-actions"><button class="icon-button" type="button" aria-label="Edit ${escapeHtml(item.name)}" data-action="edit-product" data-id="${escapeHtml(item.id)}"><i class="fa-solid fa-pen"></i></button><button class="icon-button delete" type="button" aria-label="Delete ${escapeHtml(item.name)}" data-action="delete-product" data-id="${escapeHtml(item.id)}"><i class="fa-regular fa-trash-can"></i></button></span></td>
            </tr>`).join("");
        $("#productsEmpty").hidden = items.length > 0;
    };

    const renderInventoryRows = items => {
        $("#inventoryTable").innerHTML = items.map(item => {
            const stock = Number(item.stock) || 0;
            const stockClass = stock <= 0 ? "out" : stock <= 5 ? "low" : "";
            const stockLabel = stock <= 0 ? "Out of stock" : `${stock} in stock`;
            return `
                <tr>
                    <td><div class="table-item"><span class="table-thumb">${imageMarkup(item.image)}</span><span><strong>${escapeHtml(item.name || "Unnamed item")}</strong><small>${escapeHtml(item.notes || "No notes")}</small></span></div></td>
                    <td><span class="category-pill">${escapeHtml(item.category || "Aquarium")}</span></td>
                    <td>${money(item.price)}</td>
                    <td><span class="stock-number ${stockClass}">${stockLabel}</span></td>
                    <td><span class="row-actions"><button class="icon-button" type="button" aria-label="Edit ${escapeHtml(item.name)}" data-action="edit-inventory" data-id="${escapeHtml(item.id)}"><i class="fa-solid fa-pen"></i></button><button class="icon-button delete" type="button" aria-label="Delete ${escapeHtml(item.name)}" data-action="delete-inventory" data-id="${escapeHtml(item.id)}"><i class="fa-regular fa-trash-can"></i></button></span></td>
                </tr>`;
        }).join("");
        $("#inventoryEmpty").hidden = items.length > 0;
    };

    const renderGallery = items => {
        $("#galleryGrid").innerHTML = items.map(item => `
            <article class="gallery-card">
                <div class="gallery-image">${imageMarkup(item.image)}</div>
                <div class="gallery-caption"><div><h3>${escapeHtml(item.title || "Untitled project")}</h3><span>${escapeHtml(item.category || "Project")}</span></div>
                    <span class="gallery-actions"><button class="icon-button" type="button" aria-label="Edit ${escapeHtml(item.title)}" data-action="edit-gallery" data-id="${escapeHtml(item.id)}"><i class="fa-solid fa-pen"></i></button><button class="icon-button delete" type="button" aria-label="Delete ${escapeHtml(item.title)}" data-action="delete-gallery" data-id="${escapeHtml(item.id)}"><i class="fa-regular fa-trash-can"></i></button></span>
                </div>
            </article>`).join("");
        $("#galleryEmpty").hidden = items.length > 0;
    };

    const renderOverview = (products, inventory, gallery) => {
        const lowStock = inventory.filter(item => Number(item.stock) <= 5);
        $("#overviewProductCount").textContent = products.length;
        $("#overviewInventoryCount").textContent = inventory.length;
        $("#overviewGalleryCount").textContent = gallery.length;
        $("#lowStockCount").textContent = lowStock.length;
        $("#productNavCount").textContent = products.length;
        $("#inventoryNavCount").textContent = inventory.length;
        $("#galleryNavCount").textContent = gallery.length;
        $("#lowStockPreview").innerHTML = lowStock.length
            ? lowStock.slice(0, 5).map(item => {
                const stock = Number(item.stock) || 0;
                return `<div class="low-stock-item"><span><strong>${escapeHtml(item.name || "Unnamed item")}</strong><small>${escapeHtml(item.category || "Aquarium")}</small></span><span class="stock-pill ${stock <= 0 ? "out" : ""}">${stock <= 0 ? "Out of stock" : `${stock} left`}</span></div>`;
            }).join("")
            : `<div class="muted-empty">Everything looks stocked up.</div>`;
    };

    const renderAll = () => {
        const products = productItems();
        const inventory = inventoryItems();
        const gallery = galleryItems();
        renderProductRows(products);
        renderInventoryRows(inventory);
        renderGallery(gallery);
        renderOverview(products, inventory, gallery);
    };

    const buildCategoryOptions = selected => categories.map(category =>
        `<option value="${escapeHtml(category)}" ${category === selected ? "selected" : ""}>${escapeHtml(category)}</option>`
    ).join("");

    const editorDefinitions = {
        product: {
            title: "Product",
            collection: keys.products,
            name: "name",
            fields: item => `
                <label class="editor-field">Product name<input name="name" maxlength="90" required value="${escapeHtml(item.name || "")}" placeholder="e.g. Premium Aluminium Window"></label>
                <label class="editor-field">Category<select name="category">${buildCategoryOptions(item.category || "Aluminium")}</select></label>
                <label class="editor-field">Price (INR)<input name="price" type="number" min="0" step="1" required value="${escapeHtml(item.price ?? "")}" placeholder="0"></label>
                <label class="editor-field">Description<textarea name="description" maxlength="300" placeholder="Short product description">${escapeHtml(item.description || "")}</textarea></label>
                <label class="editor-field">Image URL or website path<input name="image" type="text" value="${escapeHtml(item.image && !item.image.startsWith("data:image/") ? item.image : "")}" placeholder="https://... or ./Images/photo.jpg"><small>Use an image hosted on your website or a trusted image host.</small></label>`
        },
        inventory: {
            title: "Inventory item",
            collection: keys.inventory,
            name: "name",
            fields: item => `
                <label class="editor-field">Item name<input name="name" maxlength="90" required value="${escapeHtml(item.name || "")}" placeholder="e.g. Guppy fish"></label>
                <label class="editor-field">Category<select name="category">${buildCategoryOptions(item.category || "Live Fish")}</select></label>
                <label class="editor-field">Price (INR)<input name="price" type="number" min="0" step="1" required value="${escapeHtml(item.price ?? "")}" placeholder="0"></label>
                <label class="editor-field">Quantity in stock<input name="stock" type="number" min="0" step="1" required value="${escapeHtml(item.stock ?? 0)}"></label>
                <label class="editor-field">Notes<input name="notes" maxlength="160" value="${escapeHtml(item.notes || "")}" placeholder="Optional stock details"></label>
                <label class="editor-field">Image URL or website path<input name="image" type="text" value="${escapeHtml(item.image || "")}" placeholder="https://... or ./Images/photo.jpg"><small>Use an image hosted on your website or a trusted image host.</small></label>`
        },
        gallery: {
            title: "Gallery project",
            collection: keys.gallery,
            name: "title",
            fields: item => `
                <label class="editor-field">Project title<input name="title" maxlength="90" required value="${escapeHtml(item.title || "")}" placeholder="e.g. Modern glass partition"></label>
                <label class="editor-field">Category<input name="category" maxlength="50" value="${escapeHtml(item.category || "Project")}" placeholder="e.g. Aluminium"></label>
                <label class="editor-field">Image URL or website path<input name="image" type="text" value="${escapeHtml(item.image && !item.image.startsWith("data:image/") ? item.image : "")}" placeholder="https://... or ./Images/photo.jpg"><small>Use an image hosted on your website or a trusted image host.</small></label>`
        }
    };

    let editing = null;
    const openEditor = (type, item = null) => {
        const definition = editorDefinitions[type];
        if (!definition) return;
        editing = { type, id: item?.id ?? null, image: item?.image || "" };
        $("#editorEyebrow").textContent = item ? "UPDATE WEBSITE CONTENT" : "ADD WEBSITE CONTENT";
        $("#editorTitle").textContent = `${item ? "Edit" : "Add"} ${definition.title.toLowerCase()}`;
        $("#editorForm").innerHTML = `
            ${definition.fields(item || {})}
            <div class="editor-footer"><button class="button button-secondary" type="button" data-action="close-editor">Cancel</button><button class="button button-primary" type="submit"><i class="fa-solid fa-check"></i> Save ${definition.title.toLowerCase()}</button></div>`;
        $("#editorModal").classList.add("active");
        $("#editorModal").setAttribute("aria-hidden", "false");
        $("input:not([type=file]), select, textarea", $("#editorForm"))?.focus();
    };

    const closeEditor = () => {
        $("#editorModal").classList.remove("active");
        $("#editorModal").setAttribute("aria-hidden", "true");
        editing = null;
    };

    const saveEditor = async form => {
        if (!editing) return;
        const definition = editorDefinitions[editing.type];
        const data = new FormData(form);
        let image = String(data.get("image") || "").trim();
        if (!image && editing.image) {
            image = editing.image;
        }

        if (image && !validImage(image)) {
            toast("Use an https:// image URL or a relative website path such as ./Images/photo.jpg.", true);
            return;
        }

        const item = {
            name: String(data.get("name") || "").trim(),
            category: String(data.get("category") || "General").trim(),
            price: Number(data.get("price")) || 0
        };
        if (editing.type === "product") {
            item.description = String(data.get("description") || "").trim();
            item.image = image;
        } else if (editing.type === "inventory") {
            item.stock = Number(data.get("stock")) || 0;
            item.notes = String(data.get("notes") || "").trim();
            item.image = image;
        } else {
            item.title = String(data.get("title") || "").trim();
            item.category = String(data.get("category") || "Project").trim();
            item.image = image;
            if (!image) {
                toast("Add a project image URL or choose an image file.", true);
                return;
            }
        }

        const list = readArray(definition.collection);
        const index = editing.id === null ? -1 : list.findIndex(entry => String(entry.id) === String(editing.id));
        if (index >= 0) {
            list[index] = { ...list[index], ...item };
        } else {
            item.id = `shail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            item.createdAt = new Date().toISOString();
            list.push(item);
        }
        if (!await writeJson(definition.collection, list)) return;
        closeEditor();
        renderAll();
        toast(`${definition.title} ${index >= 0 ? "updated" : "added"} successfully.`);
    };

    const deleteItem = async (type, id) => {
        const definition = editorDefinitions[type];
        if (!definition) return;
        const list = readArray(definition.collection);
        const item = list.find(entry => String(entry.id) === String(id));
        if (!item || !window.confirm(`Delete "${item[definition.name] || definition.title}"? This cannot be undone.`)) return;
        const next = list.filter(entry => String(entry.id) !== String(id));
        if (!await writeJson(definition.collection, next)) return;
        renderAll();
        toast(`${definition.title} deleted.`);
    };

    const renderSettings = () => {
        const settings = readJson(keys.settings, {});
        const form = $("#settingsForm");
        form.elements.phone.value = settings.phone || "";
        form.elements.whatsapp.value = settings.whatsapp || "";
        form.elements.address.value = settings.address || "";

        const hours = readJson(keys.hours, defaultHours()) || defaultHours();
        form.elements.enabled.checked = hours.enabled !== false;
        form.elements.notice.value = hours.notice || "";
        const savedDays = hours.days || {};
        $("#hoursList").innerHTML = days.map(day => {
            const schedule = savedDays[day] || { open: day !== "Sunday", from: "09:00", to: "20:00" };
            const open = schedule.open !== false;
            return `<div class="hours-row"><strong>${day}</strong><label><input type="checkbox" name="dayOpen_${day}" ${open ? "checked" : ""}> Open</label><input type="time" name="from_${day}" aria-label="${day} opening time" value="${escapeHtml(schedule.from || "09:00")}"><input type="time" name="to_${day}" aria-label="${day} closing time" value="${escapeHtml(schedule.to || "20:00")}"></div>`;
        }).join("");
    };

    $("#settingsForm").addEventListener("submit", async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const settings = {
            phone: String(form.elements.phone.value || "").trim(),
            whatsapp: String(form.elements.whatsapp.value || "").trim(),
            address: String(form.elements.address.value || "").trim()
        };
        const hours = {
            enabled: form.elements.enabled.checked,
            notice: String(form.elements.notice.value || "").trim(),
            days: {}
        };
        days.forEach(day => {
            hours.days[day] = {
                open: form.elements[`dayOpen_${day}`].checked,
                from: form.elements[`from_${day}`].value || "09:00",
                to: form.elements[`to_${day}`].value || "20:00"
            };
        });
        try {
            const nextContent = includeUnmigratedContent({
                ...siteContent,
                businessSettings: settings,
                shopTimings: hours
            });
            const result = await saveSiteContent(nextContent);
            siteContent = nextContent;
            siteContent = nextContent;
            if (!writeLocalJson(keys.settings, settings) || !writeLocalJson(keys.hours, hours)) return;
            localStorage.setItem("shail_content_migrated", "true");
            $("#syncStatus").textContent = result.message || "Changes saved to GitHub.";
        } catch (error) {
            console.error("Unable to save SHAIL settings through the admin service.", error);
            toast(error.message || "Settings could not be saved.", true);
            return;
        }
        toast("Website settings saved.");
    });

    const setLoginError = message => {
        $("#loginError").textContent = message;
    };
    const showLogin = message => {
        $("#loginScreen").hidden = false;
        const shell = $(".admin-shell");
        if (shell.contains(document.activeElement)) $("#loginForm").elements.password.focus();
        shell.hidden = true;
        shell.setAttribute("aria-hidden", "true");
        if (message) setLoginError(message);
    };
    const showDashboard = () => {
        $("#loginScreen").hidden = true;
        const shell = $(".admin-shell");
        shell.hidden = false;
        $(".admin-shell").setAttribute("aria-hidden", "false");
        setLoginError("");
    };

    const updateImportButton = () => {
        const hasLegacyData = Object.keys(documentIds).some(storageKey => {
            const documentId = documentIds[storageKey];
            const saved = localStorage.getItem(storageKey);
            return saved !== null && saved !== JSON.stringify(siteContent[documentId]);
        });
        $("#importLegacyData").hidden = !hasLegacyData;
    };

    const applySiteContent = documents => {
        const migrated = localStorage.getItem("shail_content_migrated") === "true";
        siteContent = {
            products: Array.isArray(documents.products) ? documents.products : [],
            inventory: Array.isArray(documents.inventory) ? documents.inventory : [],
            gallery: Array.isArray(documents.gallery) ? documents.gallery : [],
            businessSettings: documents.businessSettings && typeof documents.businessSettings === "object"
                ? documents.businessSettings : {},
            shopTimings: documents.shopTimings && typeof documents.shopTimings === "object"
                ? documents.shopTimings : {}
        };
        Object.entries(documentIds).forEach(([storageKey, documentId]) => {
            const saved = localStorage.getItem(storageKey);
            const serverValue = siteContent[documentId];
            const hasExistingLocalContent = !migrated && saved !== null
                && ((Array.isArray(serverValue) && serverValue.length === 0)
                    || (serverValue && typeof serverValue === "object" && !Array.isArray(serverValue)
                        && Object.keys(serverValue).length === 0));
            if (!hasExistingLocalContent) writeLocalJson(storageKey, serverValue);
        });
        updateImportButton();
    };

    const importLegacyData = async () => {
        const nextContent = { ...siteContent };
        let importedCount = 0;
        Object.entries(documentIds).forEach(([storageKey, documentId]) => {
            const saved = localStorage.getItem(storageKey);
            if (saved === null) return;
            try {
                nextContent[documentId] = JSON.parse(saved);
                importedCount += 1;
            } catch (error) {
                console.error(`Unable to import invalid browser data for ${storageKey}.`, error);
                toast("An existing browser data item is invalid. It was skipped; correct it before importing.", true);
            }
        });

        if (!importedCount) {
            toast("There is no saved browser content to import.", true);
            updateImportButton();
            return;
        }
        if (!window.confirm(`Import ${importedCount} saved section${importedCount === 1 ? "" : "s"} from this browser and publish them to the live website?`)) return;

        try {
            const result = await saveSiteContent(nextContent);
            applySiteContent(nextContent);
            localStorage.setItem("shail_content_migrated", "true");
            renderAll();
            if (activeViewName() === "settings") renderSettings();
            $("#syncStatus").textContent = result.message || "Changes saved to GitHub.";
            toast("Saved browser content was published.");
        } catch (error) {
            console.error("Unable to import existing browser content.", error);
            toast(error.message || "Import failed. Check the dashboard service and try again.", true);
        }
    };

    const startAdmin = async () => {
        currentUser = true;
        try {
            const { content } = await readSiteContent();
            if (!content || typeof content !== "object" || Array.isArray(content)) {
                throw new Error("The dashboard returned invalid website content.");
            }
            applySiteContent(content);
            renderAll();
            showDashboard();
            $("#syncStatus").textContent = "Connected. Changes publish through GitHub Pages after the commit is deployed.";
        } catch (error) {
            console.error("Unable to load SHAIL website content from the admin service.", error);
            currentUser = null;
            clearAdminSession();
            showLogin(error.message || "Could not load website content. Check the dashboard service.");
        }
    };

    $("#loginForm").addEventListener("submit", async event => {
        event.preventDefault();
        if (!isApiConfigured()) {
            setLoginError("The dashboard service is not configured. Follow ADMIN_DASHBOARD_SETUP.md, then reload.");
            return;
        }
        const form = event.currentTarget;
        const button = $(".login-submit", form);
        button.disabled = true;
        setLoginError("");
        try {
            await signInAdmin(form.elements.password.value);
            form.reset();
            await startAdmin();
        } catch (error) {
            console.error("SHAIL administrator sign-in failed.", error);
            setLoginError(error.message || "Sign-in failed. Check the administrator password and dashboard service.");
        } finally {
            button.disabled = false;
        }
    });

    $("#signOutButton").addEventListener("click", async () => {
        try {
            currentUser = null;
            await signOutAdmin();
            showLogin("");
        } catch (error) {
            console.error("Unable to sign out of SHAIL admin.", error);
            toast("Could not clear the local admin session.", true);
        }
    });
    $("#importLegacyData").addEventListener("click", importLegacyData);
    $("#analyticsRange").addEventListener("change", loadAnalytics);
    $("#generateReport").addEventListener("click", generateAnalyticsReport);

    document.addEventListener("click", event => {
        const nav = event.target.closest("[data-view]");
        if (nav) {
            setView(nav.dataset.view);
            return;
        }
        const goView = event.target.closest("[data-go-view]");
        if (goView) {
            setView(goView.dataset.goView);
            return;
        }
        const actionElement = event.target.closest("[data-action]");
        if (!actionElement) return;
        const { action, id } = actionElement.dataset;
        if (action === "close-editor") closeEditor();
        else if (action === "add-product") openEditor("product");
        else if (action === "add-inventory") openEditor("inventory");
        else if (action === "add-gallery") openEditor("gallery");
        else if (action === "edit-product") openEditor("product", productItems().find(item => String(item.id) === String(id)));
        else if (action === "edit-inventory") openEditor("inventory", inventoryItems().find(item => String(item.id) === String(id)));
        else if (action === "edit-gallery") openEditor("gallery", galleryItems().find(item => String(item.id) === String(id)));
        else if (action === "delete-product") deleteItem("product", id);
        else if (action === "delete-inventory") deleteItem("inventory", id);
        else if (action === "delete-gallery") deleteItem("gallery", id);
    });

    $("#editorForm").addEventListener("submit", event => {
        event.preventDefault();
        if (event.currentTarget.reportValidity()) saveEditor(event.currentTarget);
    });
    $("#closeEditor").addEventListener("click", closeEditor);
    $("#editorModal").addEventListener("click", event => {
        if (event.target === $("#editorModal")) closeEditor();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeEditor();
    });
    $("#todayDate").textContent = new Intl.DateTimeFormat("en-IN", {
        weekday: "short", day: "numeric", month: "short", year: "numeric"
    }).format(new Date());
    $$("[data-view]").forEach(button => button.addEventListener("click", () => {
        if (button.dataset.view === "settings") renderSettings();
    }));
    if (!isApiConfigured()) {
        showLogin("Dashboard service setup is incomplete. Follow ADMIN_DASHBOARD_SETUP.md and reload.");
    } else if (hasAdminSession()) {
        startAdmin();
    } else {
        showLogin("");
    }
})();

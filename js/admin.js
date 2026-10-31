import {
    initializeFirebase,
    isAdminUser,
    isConfigured,
    observeAuth,
    readSiteData,
    resetAdminPassword,
    saveSiteDocuments,
    signIn,
    signOutAdmin,
    watchPublicSiteData
} from "./firebase.js";

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

    let toastTimer;
    let currentUser = null;
    let knownCloudDocuments = new Set();
    let stopWatchingData = null;
    let authNotice = "";
    const toast = (message, isError = false) => {
        const element = $("#toast");
        element.textContent = message;
        element.classList.toggle("error", isError);
        element.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => element.classList.remove("show"), 3400);
    };

    const explainCloudError = error => {
        if (error?.code === "permission-denied") {
            return "Firebase denied this change. Publish firestore.rules to the shail-3997d project and confirm both admin UIDs match.";
        }
        if (error?.code === "unauthenticated") {
            return "Your Firebase session expired. Sign in again, then retry.";
        }
        if (error?.code === "unavailable" || error?.code === "deadline-exceeded") {
            return "Firebase is temporarily unreachable. Check your internet connection and retry.";
        }
        if (error?.code === "invalid-argument") {
            return "Firebase rejected the data format. Refresh the dashboard and try again.";
        }
        return "Cloud save failed. Check the browser console for the Firebase error details.";
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

    const writeJson = async (key, value) => {
        const documentId = documentIds[key];
        if (!documentId || !currentUser) {
            toast("Sign in to an authorized SHAIL administrator account before saving.", true);
            return false;
        }
        try {
            await saveSiteDocuments(currentUser, { [documentId]: value });
            if (!writeLocalJson(key, value)) return false;
            knownCloudDocuments.add(documentId);
            updateImportButton();
            return true;
        } catch (error) {
            console.error(`Unable to save ${documentId} in Firestore.`, error);
            toast(explainCloudError(error), true);
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
            await saveSiteDocuments(currentUser, {
                businessSettings: settings,
                shopTimings: hours
            });
            if (!writeLocalJson(keys.settings, settings) || !writeLocalJson(keys.hours, hours)) return;
            knownCloudDocuments.add("businessSettings");
            knownCloudDocuments.add("shopTimings");
            updateImportButton();
        } catch (error) {
            console.error("Unable to save SHAIL settings in Firestore.", error);
            toast(explainCloudError(error), true);
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
        if (shell.contains(document.activeElement)) $("#loginForm").elements.email.focus();
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
            return !knownCloudDocuments.has(documentId) && localStorage.getItem(storageKey) !== null;
        });
        $("#importLegacyData").hidden = !hasLegacyData;
    };

    const applyCloudDocuments = documents => {
        const latestIds = new Set(Object.keys(documents));
        Object.entries(documentIds).forEach(([storageKey, documentId]) => {
            if (Object.prototype.hasOwnProperty.call(documents, documentId)) {
                writeLocalJson(storageKey, documents[documentId]);
            } else if (knownCloudDocuments.has(documentId)) {
                localStorage.removeItem(storageKey);
            }
        });
        knownCloudDocuments = latestIds;
        updateImportButton();
    };

    const importLegacyData = async () => {
        const documents = {};
        Object.entries(documentIds).forEach(([storageKey, documentId]) => {
            if (knownCloudDocuments.has(documentId)) return;
            const saved = localStorage.getItem(storageKey);
            if (saved === null) return;
            try {
                documents[documentId] = JSON.parse(saved);
            } catch (error) {
                console.error(`Unable to import invalid browser data for ${storageKey}.`, error);
                toast("An existing browser data item is invalid. It was skipped; correct it before importing.", true);
            }
        });

        const names = Object.keys(documents);
        if (!names.length) {
            toast("There is no unimported browser data to migrate.", true);
            updateImportButton();
            return;
        }
        if (!window.confirm(`Import ${names.length} existing data section${names.length === 1 ? "" : "s"} from this browser to Firebase? Existing Firebase sections will not be overwritten.`)) return;

        try {
            await saveSiteDocuments(currentUser, documents);
            applyCloudDocuments(await readSiteData(currentUser));
            renderAll();
            if (activeViewName() === "settings") renderSettings();
            toast("Existing browser data was copied to Firebase.");
        } catch (error) {
            console.error("Unable to import existing browser data to Firebase.", error);
            toast("Data import failed. Check your connection and Firestore security rules.", true);
        }
    };

    const startAdmin = async user => {
        if (!isAdminUser(user)) {
            currentUser = null;
            const message = "This account is not authorized for the SHAIL dashboard.";
            authNotice = message;
            try {
                await signOutAdmin();
            } catch (error) {
                console.error("Unable to sign out the unauthorized Firebase account.", error);
            }
            showLogin(message);
            authNotice = "";
            return;
        }
        currentUser = user;
        try {
            const documents = await readSiteData(user);
            applyCloudDocuments(documents);
            renderAll();
            showDashboard();
            $("#syncStatus").textContent = "Connected. Changes save to Firebase and appear on the public website.";
            if (stopWatchingData) stopWatchingData();
            stopWatchingData = watchPublicSiteData(updated => {
                if (!currentUser || currentUser.uid !== user.uid) return;
                applyCloudDocuments(updated);
                renderAll();
                if (activeViewName() === "settings") renderSettings();
            }, error => {
                console.error("Lost the live Firebase data connection.", error);
                $("#syncStatus").textContent = "Live updates disconnected. Refresh the page to reconnect.";
                $("#syncStatusTitle").textContent = "Connection issue:";
                $(".local-notice").classList.add("error");
                toast("Live Firebase updates disconnected.", true);
            });
        } catch (error) {
            console.error("Unable to load SHAIL data from Firestore.", error);
            currentUser = null;
            const message = "Could not access the shared data. Check that Firestore is created and its security rules contain your admin UID.";
            authNotice = message;
            try {
                await signOutAdmin();
            } catch (signOutError) {
                console.error("Unable to sign out after the Firestore access error.", signOutError);
            }
            showLogin(message);
            authNotice = "";
        }
    };

    $("#loginForm").addEventListener("submit", async event => {
        event.preventDefault();
        if (!isConfigured()) {
            setLoginError("Firebase is not configured. Complete FIREBASE_NETLIFY_SETUP.md, then reload this page.");
            return;
        }
        const form = event.currentTarget;
        const button = $(".login-submit", form);
        button.disabled = true;
        setLoginError("");
        try {
            await signIn(String(form.elements.email.value).trim(), form.elements.password.value);
        } catch (error) {
            console.error("SHAIL administrator sign-in failed.", error);
            setLoginError(error.code === "auth/too-many-requests"
                ? "Too many attempts. Wait a while before trying again."
                : "Sign-in failed. Check your email, password, Firebase Auth settings, and connection.");
        } finally {
            button.disabled = false;
        }
    });

    $("#resetPassword").addEventListener("click", async () => {
        const email = String($("#loginForm").elements.email.value || "").trim();
        if (!email) {
            setLoginError("Enter your administrator email first, then choose Forgot password.");
            $("#loginForm").elements.email.focus();
            return;
        }
        try {
            await resetAdminPassword(email);
            setLoginError("If this email is registered, Firebase will send a password reset link.");
        } catch (error) {
            console.error("Unable to request a Firebase password reset.", error);
            setLoginError("Could not request a password reset. Check Firebase Auth and your connection.");
        }
    });

    $("#signOutButton").addEventListener("click", async () => {
        try {
            if (stopWatchingData) stopWatchingData();
            stopWatchingData = null;
            currentUser = null;
            await signOutAdmin();
        } catch (error) {
            console.error("Unable to sign out of SHAIL admin.", error);
            toast("Sign-out failed. Reload the page and try again.", true);
        }
    });
    $("#importLegacyData").addEventListener("click", importLegacyData);

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
    if (!isConfigured()) {
        showLogin("Firebase setup is incomplete. Follow FIREBASE_NETLIFY_SETUP.md, update js/firebase-config.js, then reload.");
    } else {
        try {
            initializeFirebase();
            observeAuth(user => {
                if (user) {
                    startAdmin(user);
                } else {
                    currentUser = null;
                    if (stopWatchingData) stopWatchingData();
                    stopWatchingData = null;
                    showLogin(authNotice);
                    authNotice = "";
                }
            });
        } catch (error) {
            console.error("Unable to initialize Firebase for the SHAIL dashboard.", error);
            showLogin("Firebase could not start. Check the project configuration and internet connection.");
        }
    }
})();

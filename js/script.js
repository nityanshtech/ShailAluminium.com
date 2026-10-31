/* =========================================================
   SHAIL ALLUMINIUM AND GLASS FABRICANTS
   PROFESSIONAL WEBSITE JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    await window.__shailPublicDataReady;

    "use strict";

    /* =====================================================
       1. BASIC HELPERS
       ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];


    /* =====================================================
       2. PRELOADER
       ===================================================== */

    const preloader = document.getElementById("preloader");

if (preloader) {
    setTimeout(() => {
        preloader.classList.add("hidden");

        setTimeout(() => {
            preloader.style.display = "none";
        }, 800);

    }, 1000);
}


    /* =====================================================
       3. HEADER SCROLL EFFECT
       ===================================================== */

    const header = $("#mainHeader");

    const handleHeaderScroll = () => {

        if (!header) return;

        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    };

    window.addEventListener(
        "scroll",
        handleHeaderScroll,
        { passive: true }
    );

    handleHeaderScroll();


    /* =====================================================
       4. MOBILE NAVIGATION
       ===================================================== */

    const mobileMenuButton = $("#mobileMenuButton");
    const mobileNavigation = $("#mobileNavigation");

    const setMobileNavigationOpen = isOpen => {
        if (!mobileNavigation) return;

        mobileNavigation.classList.toggle("active", isOpen);
        mobileNavigation.style.visibility = isOpen ? "visible" : "hidden";
        mobileNavigation.style.opacity = isOpen ? "1" : "0";
        mobileNavigation.style.transform = isOpen ? "translateY(0)" : "translateY(-15px)";

        if (mobileMenuButton) {
            mobileMenuButton.setAttribute("aria-expanded", String(isOpen));
        }
    };

    if (mobileMenuButton && mobileNavigation) {

        mobileMenuButton.addEventListener("click", () => {
            setMobileNavigationOpen(!mobileNavigation.classList.contains("active"));
        });

    }


    /* =====================================================
       5. CLOSE MOBILE MENU AFTER CLICK
       ===================================================== */

    $$(".mobile-nav-link").forEach(link => {

        link.addEventListener("click", () => {

            if (mobileNavigation) {
                setMobileNavigationOpen(false);
            }
        });

    });


    /* =====================================================
       6. ACTIVE NAVIGATION
       ===================================================== */

    const navLinks = $$(".nav-link");

    const sections = $$("main section[id]");

    const updateActiveNavigation = () => {

        if (!sections.length || !navLinks.length) return;

        const scrollPosition =
            window.scrollY + 180;

        let currentSection = "";

        sections.forEach(section => {

            const top = section.offsetTop;
            const height = section.offsetHeight;

            if (
                scrollPosition >= top &&
                scrollPosition < top + height
            ) {
                currentSection = section.id;
            }

        });

        navLinks.forEach(link => {

            const target =
                link.getAttribute("href");

            link.classList.toggle(
                "active",
                target === `#${currentSection}`
            );

        });
    };

    window.addEventListener(
        "scroll",
        updateActiveNavigation,
        { passive: true }
    );

    updateActiveNavigation();


    /* =====================================================
       7. SMOOTH NAVIGATION
       ===================================================== */

    $$('a[href^="#"]').forEach(link => {

        link.addEventListener("click", event => {

            const targetID =
                link.getAttribute("href");

            if (
                !targetID ||
                targetID === "#"
            ) {
                return;
            }

            const target =
                document.querySelector(targetID);

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    });


    /* =====================================================
       8. SCROLL REVEAL SYSTEM
       ===================================================== */

    const revealElements = $$(
        `
        .section-heading,
        .showcase-card,
        .aquarium-card,
        .gallery-item,
        .about-content,
        .about-visual,
        .contact-card,
        .map-container,
        .experience-item,
        .aquarium-cta
        `
    );

    if ("IntersectionObserver" in window) {

        const revealObserver =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (entry.isIntersecting) {

                            entry.target.classList.add(
                                "visible"
                            );

                            revealObserver.unobserve(
                                entry.target
                            );
                        }

                    });

                },
                {
                    threshold: 0.12
                }
            );

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });

    } else {

        revealElements.forEach(element => {
            element.classList.add("visible");
        });

    }


    /* =====================================================
       9. MOUSE FOLLOWING AMBIENT LIGHT
       ===================================================== */

    document.addEventListener(
        "mousemove",
        event => {

            document.documentElement.style.setProperty(
                "--mouse-x",
                `${event.clientX}px`
            );

            document.documentElement.style.setProperty(
                "--mouse-y",
                `${event.clientY}px`
            );

        },
        { passive: true }
    );


    /* =====================================================
       10. CARD TILT EFFECT
       ===================================================== */

    const tiltCards = $$(
        ".showcase-card, .aquarium-card"
    );

    tiltCards.forEach(card => {

        card.addEventListener(
            "mousemove",
            event => {

                if (window.innerWidth < 800) return;

                const rect =
                    card.getBoundingClientRect();

                const x =
                    event.clientX - rect.left;

                const y =
                    event.clientY - rect.top;

                const centerX =
                    rect.width / 2;

                const centerY =
                    rect.height / 2;

                const rotateX =
                    ((y - centerY) / centerY) * -3;

                const rotateY =
                    ((x - centerX) / centerX) * 3;

                card.style.transform =
                    `
                    perspective(900px)
                    translateY(-10px)
                    rotateX(${rotateX}deg)
                    rotateY(${rotateY}deg)
                    `;

            }
        );

        card.addEventListener(
            "mouseleave",
            () => {

                card.style.transform = "";

            }
        );

    });


    /* =====================================================
       11. IMAGE VIEWER
       ===================================================== */

    const imageViewer = $("#imageViewer");
    const viewerImage = $("#viewerImage");
    const viewerCaption = $("#viewerCaption");
    const closeImageViewer = $("#closeImageViewer");

    const galleryPhotos = [
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.07 AM.jpeg",
            category: "Glass",
            title: "Decorative Glass Railing",
            alt: "Decorative patterned glass panels installed along an interior railing."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.10 AM (1).jpeg",
            category: "Glass",
            title: "Balcony Glass Balustrade",
            alt: "Glass balustrade beneath a timber balcony ceiling."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.11 AM.jpeg",
            category: "Aluminium",
            title: "Aluminium Window Installation",
            alt: "Wide white-framed aluminium windows fitted in a home."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.13 AM.jpeg",
            category: "Doors",
            title: "Decorative Security Door",
            alt: "Decorative metal security door with a patterned finish."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.18 AM.jpeg",
            category: "Glass",
            title: "Residential Balcony Railing",
            alt: "Exterior view of a home with glass balcony railings."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.20 AM.jpeg",
            category: "Glass",
            title: "Modern Balcony Design",
            alt: "Modern house exterior with glass balcony panels."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.26 AM.jpeg",
            category: "Custom Glass",
            title: "Patterned Glass Panels",
            alt: "Custom glass installation with a decorative patterned finish."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.30 AM.jpeg",
            category: "Doors",
            title: "Wood-Finish Door",
            alt: "Warm wood-finish door with a narrow glass insert."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.40 AM.jpeg",
            category: "Interiors",
            title: "Glass-Front Interior Cabinet",
            alt: "Glass-front fitted cabinets in a modern interior."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.41 AM.jpeg",
            category: "Interiors",
            title: "Custom Countertop Cabinetry",
            alt: "Custom fitted cabinetry beneath a dark stone countertop."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.42 AM.jpeg",
            category: "Custom Glass",
            title: "Decorative Privacy Screen",
            alt: "Tall decorative screen with a patterned glass finish."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.47 AM.jpeg",
            category: "Kitchens",
            title: "Modern Modular Kitchen",
            alt: "Bright kitchen with white fitted cabinets and a dark backsplash."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.50 AM.jpeg",
            category: "Doors",
            title: "Wood-Grain Door Design",
            alt: "Close view of a wood-grain door installation."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.51 AM (1).jpeg",
            category: "Glass",
            title: "Balcony Railing Detail",
            alt: "Balcony edge finished with a clear glass railing."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.51 AM.jpeg",
            category: "Railings",
            title: "Stainless Steel Stair Railing",
            alt: "Close view of polished stainless steel stair railing."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.52 AM (1).jpeg",
            category: "Interiors",
            title: "Fitted Wardrobe",
            alt: "Floor-to-ceiling fitted wardrobe in a contemporary room."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.52 AM (2).jpeg",
            category: "Interiors",
            title: "Custom Cabinet Installation",
            alt: "Custom fitted cabinets installed in a modern interior."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.52 AM.jpeg",
            category: "Kitchens",
            title: "Stone-Finish Kitchen Cabinetry",
            alt: "Kitchen cabinets with a dark stone-finish countertop."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.53 AM (1).jpeg",
            category: "Interiors",
            title: "Contemporary Cabinet Finish",
            alt: "Contemporary fitted cabinetry in a light and wood-tone finish."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.42.53 AM (4).jpeg",
            category: "Interiors",
            title: "Custom Storage Cabinets",
            alt: "Custom storage cabinets fitted neatly into an interior space."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.43.08 AM.jpeg",
            category: "Interiors",
            title: "Wood-Finish Storage",
            alt: "Large fitted storage unit with a warm wood finish."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.43.09 AM (1).jpeg",
            category: "Railings",
            title: "Polished Metal Railing",
            alt: "Close detail of a polished metal railing installation."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.43.09 AM.jpeg",
            category: "Doors",
            title: "Glass-Paneled Door",
            alt: "Interior door with glass panels and a clean metal frame."
        },
        {
            file: "WhatsApp Image 2026-10-05 at 10.43.10 AM.jpeg",
            category: "Doors",
            title: "Contemporary Main Door",
            alt: "Contemporary dark wood-finish main door."
        }
    ];

    const galleryGrid = $("#projectGallery");

    if (galleryGrid) {
        galleryPhotos.forEach((photo, index) => {
            const card = document.createElement("article");
            card.className = "gallery-item gallery-photo-card visible";

            if (index % 7 === 0) {
                card.classList.add("gallery-large");
            } else if (index % 7 === 3) {
                card.classList.add("gallery-wide");
            }

            const trigger = document.createElement("button");
            trigger.className = "gallery-photo-open";
            trigger.type = "button";
            trigger.setAttribute("aria-label", `View ${photo.title}`);

            const image = document.createElement("img");
            image.src = `./Images/${encodeURIComponent(photo.file)}`;
            image.alt = photo.alt;
            image.loading = "lazy";
            image.decoding = "async";

            const caption = document.createElement("div");
            caption.className = "gallery-content";

            const category = document.createElement("span");
            category.textContent = photo.category;

            const title = document.createElement("h3");
            title.textContent = photo.title;

            caption.append(category, title);
            trigger.append(image, caption);
            card.appendChild(trigger);
            galleryGrid.appendChild(card);
        });
    }

    const openImageViewer = (image, caption = "") => {

        if (!imageViewer || !viewerImage) return;

        viewerImage.src = image;

        if (viewerCaption) {
            viewerCaption.textContent = caption;
        }

        imageViewer.classList.add("active");

        document.body.style.overflow = "hidden";
    };

    const closeViewer = () => {

        if (!imageViewer) return;

        imageViewer.classList.remove("active");

        document.body.style.overflow = "";

    };

    if (galleryGrid) {
        galleryGrid.addEventListener("click", event => {
            const target = event.target;
            const card = target instanceof Element
                ? target.closest(".gallery-item")
                : null;
            const image = card?.querySelector("img");

            if (!image) return;

            const caption = card.querySelector("h3")?.textContent || "";
            openImageViewer(image.currentSrc || image.src, caption);
        });
    }

    if (closeImageViewer) {
        closeImageViewer.addEventListener(
            "click",
            closeViewer
        );
    }

    if (imageViewer) {

        imageViewer.addEventListener(
            "click",
            event => {

                if (
                    event.target === imageViewer
                ) {
                    closeViewer();
                }

            }
        );

    }


    /* =====================================================
       12. ADMIN NAVIGATION
       ===================================================== */

    const mobileAdminButton = $("#mobileAdminButton");

    if (mobileAdminButton) {
        mobileAdminButton.addEventListener("click", () => {
            setMobileNavigationOpen(false);
        });
    }


    /* =====================================================
       14. WHATSAPP ORDER SYSTEM
       ===================================================== */

    const WHATSAPP_NUMBER =
        "919532475637";

    const sendWhatsAppMessage =
        message => {

            const encoded =
                encodeURIComponent(message);

            const url =
                `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

            window.open(
                url,
                "_blank",
                "noopener,noreferrer"
            );
        };


    /* =====================================================
       15. PRODUCT ENQUIRY BUTTONS
       ===================================================== */

    $$(".card-action, .aquarium-card-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    const card =
                        button.closest(
                            ".showcase-card, .aquarium-card"
                        );

                    const productName =
                        card?.querySelector("h3")
                            ?.textContent
                            ?.trim()
                        || "Product";

                    const message =
                        `
Hello SHAIL ALLUMINIUM AND GLASS FABRICANTS,

I would like to enquire about:

Product: ${productName}

Please provide more details, availability and pricing.

Thank you.
                        `.trim();

                    event.preventDefault();

                    sendWhatsAppMessage(message);

                }
            );

        });


    /* =====================================================
       16. WHATSAPP BUTTONS
       ===================================================== */

    $$(".whatsapp-button, [data-whatsapp]")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const customMessage =
                        button.dataset.whatsapp;

                    const message =
                        customMessage ||
                        "Hello SHAIL ALLUMINIUM AND GLASS FABRICANTS, I would like to make an enquiry.";

                    sendWhatsAppMessage(message);

                }
            );

        });


    /* =====================================================
       17. NOTIFICATION SYSTEM
       ===================================================== */

    const showNotification =
        (message, duration = 3000) => {

            let notification =
                $(".site-notification");

            if (!notification) {

                notification =
                    document.createElement("div");

                notification.className =
                    "site-notification";

                document.body.appendChild(
                    notification
                );
            }

            notification.textContent =
                message;

            notification.classList.add(
                "show"
            );

            clearTimeout(
                notification._timer
            );

            notification._timer =
                setTimeout(() => {

                    notification.classList.remove(
                        "show"
                    );

                }, duration);
        };


    /* =====================================================
       18. ESCAPE KEY
       ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }

            closeViewer();
            if (mobileNavigation) {
                setMobileNavigationOpen(false);
            }

        }
    );


    /* =====================================================
       19. LANGUAGE SWITCHER
       ===================================================== */

    const languageButton =
        $("#languageButton");

    const languageLabel =
        $("#languageLabel");

    let currentLanguage =
        localStorage.getItem(
            "shail_language"
        ) || "EN";

    const translations = {
        EN: {
            navHome: "Home",
            navAluminium: "Aluminium & Glass",
            navAquarium: "Aquarium World",
            navShowcase: "Showcase",
            navAbout: "About",
            navContact: "Contact",
            admin: "Admin",
            adminPanel: "Admin Panel",
            heroEyebrow: "PRECISION • DESIGN • CRAFT",
            heroTitle: `<span class="hero-title-small">BUILDING</span><span class="hero-title-main"><span class="metal-text">BEAUTIFUL</span></span><span class="hero-title-main"><span class="glass-text">SPACES.</span></span>`,
            heroDescription: "Premium aluminium and glass fabrication, custom architectural solutions and a complete aquatic world — designed with precision, creativity and craftsmanship.",
            exploreWork: "Explore Our Work",
            contactUs: "Contact Us",
            showroom: "VISIT OUR SHOWROOM",
            showroomAddress: "Gorakhpur • Medical College Road",
            precision: "Precision",
            craftsmanship: "Craftsmanship",
            customDesign: "Custom Design",
            aquariumWorld: "Aquarium World",
            whatsAppChat: "Chat With Us",
            shopTimings: "SHOP TIMINGS",
            contactLabel: "LET'S TALK",
            viewAccessories: "View Accessories",
            enquire: "Enquire Now",
            order: "Order on WhatsApp",
            notice: "Welcome."
        },
        HI: {
            navHome: "होम",
            navAluminium: "एल्यूमीनियम & गिलास",
            navAquarium: "एक्वैरियम वर्ल्ड",
            navShowcase: "शोकेस",
            navAbout: "हमारे बारे में",
            navContact: "संपर्क",
            admin: "एडमिन",
            adminPanel: "एडमिन पैनल",
            heroEyebrow: "सटीकता • डिज़ाइन • शिल्प",
            heroTitle: `<span class="hero-title-small">इमारतें</span><span class="hero-title-main"><span class="metal-text">सुंदर</span></span><span class="hero-title-main"><span class="glass-text">अंतरिक्ष.</span></span>`,
            heroDescription: "प्रीमियम एल्यूमीनियम और गिलास निर्माण, कस्टम आर्किटेक्चरल समाधान और एक संपूर्ण जलीय दुनिया — सटीकता, रचनात्मकता और शिल्प कौशल के साथ तैयार।",
            exploreWork: "हमारा काम देखें",
            contactUs: "संपर्क करें",
            showroom: "हमारे शो रूम का दौरा करें",
            showroomAddress: "गोरखपुर • मेडिकल कॉलेज रोड",
            precision: "सटीकता",
            craftsmanship: "कौशल",
            customDesign: "कस्टम डिज़ाइन",
            aquariumWorld: "एक्वैरियम वर्ल्ड",
            whatsAppChat: "व्हाट्सऐप से चैट करें",
            shopTimings: "शॉप टाइमिंग",
            contactLabel: "बात करें",
            viewAccessories: "एक्सेसरी देखें",
            enquire: "अभी पूछें",
            order: "व्हाट्सऐप पर ऑर्डर करें",
            notice: "स्वागत है।"
        }
    };

    const updateLanguageButton = () => {

        if (languageLabel) {
            languageLabel.textContent =
                currentLanguage === "EN"
                    ? "हिंदी"
                    : "EN";
        }
    };

    const hindiText = {
        "home": "होम",
        "aluminium & glass": "एल्यूमीनियम और कांच",
        "aquarium world": "एक्वेरियम की दुनिया",
        "showcase": "प्रदर्शनी",
        "about": "हमारे बारे में",
        "contact": "संपर्क",
        "admin": "एडमिन",
        "admin panel": "एडमिन पैनल",
        "precision • design • craft": "सटीकता • डिज़ाइन • शिल्प",
        "building": "निर्माण",
        "beautiful": "सुंदर",
        "spaces.": "स्थान।",
        "premium aluminium and glass fabrication, custom architectural solutions and a complete aquatic world — designed with precision, creativity and craftsmanship.": "प्रीमियम एल्यूमीनियम और कांच का निर्माण, विशेष वास्तु समाधान और एक संपूर्ण जलीय दुनिया — सटीकता, रचनात्मकता और कुशल कारीगरी के साथ तैयार।",
        "explore our work": "हमारा काम देखें",
        "contact us": "संपर्क करें",
        "visit our showroom": "हमारे शोरूम में आएं",
        "gorakhpur • medical college road": "गोरखपुर • मेडिकल कॉलेज रोड",
        "material": "सामग्री",
        "aluminium": "एल्यूमीनियम",
        "finish": "फिनिश",
        "premium glass": "प्रीमियम कांच",
        "aquatic": "जलीय",
        "living beauty": "जीवंत सुंदरता",
        "craftsmanship": "कारीगरी",
        "custom design": "विशेष डिज़ाइन",
        "architectural solutions": "वास्तु समाधान",
        "glass": "कांच",
        "crafted solutions that combine structural strength, clean architecture and modern aesthetics.": "मजबूती, साफ-सुथरी वास्तुकला और आधुनिक सुंदरता को जोड़कर तैयार किए गए समाधान।",
        "01 / architecture": "01 / वास्तुकला",
        "aluminium fabrication": "एल्यूमीनियम निर्माण",
        "precision-made aluminium doors, windows, frames and architectural structures.": "सटीकता से बने एल्यूमीनियम दरवाज़े, खिड़कियां, फ्रेम और वास्तु संरचनाएं।",
        "enquire now": "अभी पूछें",
        "02 / glass": "02 / कांच",
        "architectural glass": "वास्तु कांच",
        "elegant glass installations for homes, offices, interiors and modern spaces.": "घर, कार्यालय और आधुनिक इंटीरियर के लिए सुंदर कांच की फिटिंग।",
        "03 / custom": "03 / विशेष",
        "custom projects": "विशेष परियोजनाएं",
        "bespoke fabrication created according to your space, dimensions and vision.": "आपकी जगह, माप और पसंद के अनुसार तैयार किया गया विशेष निर्माण।",
        "start a project": "परियोजना शुरू करें",
        "aquatic experience": "जलीय अनुभव",
        "aquarium": "एक्वेरियम",
        "world": "दुनिया",
        "bring living colour, movement and calm into your space with our aquarium collection.": "हमारे एक्वेरियम संग्रह से अपनी जगह में रंग, हलचल और सुकून जोड़ें।",
        "live": "लाइव",
        "aquatic life": "जलीय जीवन",
        "live fishes": "जीवित मछलियां",
        "discover colourful and fascinating aquatic life for your aquarium.": "अपने एक्वेरियम के लिए रंग-बिरंगी और आकर्षक मछलियां देखें।",
        "explore fishes": "मछलियां देखें",
        "custom": "विशेष",
        "made for you": "आपके लिए तैयार",
        "custom aquariums": "विशेष एक्वेरियम",
        "beautiful aquarium designs created around your interior and imagination.": "आपके इंटीरियर और कल्पना के अनुसार बनाए गए सुंदर एक्वेरियम।",
        "design aquarium": "एक्वेरियम डिज़ाइन करें",
        "equip": "उपकरण",
        "aquarium essentials": "एक्वेरियम की ज़रूरी चीज़ें",
        "accessories": "सामान",
        "essential equipment and accessories to keep your aquatic world beautiful.": "आपकी जलीय दुनिया को सुंदर रखने के लिए ज़रूरी उपकरण और सामान।",
        "view accessories": "सामान देखें",
        "create your aquatic world": "अपनी जलीय दुनिया बनाएं",
        "imagine it.": "सोचिए।",
        "we build it.": "हम बनाते हैं।",
        "tell us about the aquarium you have in mind and let's turn the idea into a living space.": "अपने मनचाहे एक्वेरियम के बारे में बताएं, हम आपके विचार को जीवंत रूप देंगे।",
        "discuss your aquarium": "अपने एक्वेरियम पर बात करें",
        "our catalogue": "हमारी उत्पाद सूची",
        "explore our products": "हमारे उत्पाद देखें",
        "discover aluminium, glass, aquarium, live fish and accessory products.": "एल्यूमीनियम, कांच, एक्वेरियम, मछलियों और अन्य सामान के उत्पाद देखें।",
        "catalogue coming soon": "उत्पाद सूची जल्द आ रही है",
        "our latest products will appear here.": "हमारे नए उत्पाद यहां दिखाई देंगे।",
        "general": "अन्य",
        "product": "उत्पाद",
        "contact us for more information about this product.": "इस उत्पाद की अधिक जानकारी के लिए हमसे संपर्क करें।",
        "order on whatsapp": "व्हाट्सऐप पर ऑर्डर करें",
        "visual showcase": "चित्र प्रदर्शनी",
        "our": "हमारी",
        "craft": "कारीगरी",
        "a glimpse into the world of aluminium, glass and aquatic design.": "एल्यूमीनियम, कांच और एक्वेरियम डिज़ाइन की दुनिया की एक झलक।",
        "modern architecture": "आधुनिक वास्तुकला",
        "crystal clarity": "क्रिस्टल जैसी स्पष्टता",
        "living colour": "जीवंत रंग",
        "custom design": "विशेष डिज़ाइन",
        "made around your vision": "आपकी पसंद के अनुसार निर्मित",
        "about shail": "शैल के बारे में",
        "where": "जहां",
        "meets imagination.": "कल्पना से मिलता है।",
        "shail alluminium and glass fabricants combines practical fabrication with modern design to create solutions that are made to last and made to stand out.": "शैल एल्यूमीनियम एंड ग्लास फैब्रिकेंट्स आधुनिक डिज़ाइन के साथ उपयोगी निर्माण को जोड़कर टिकाऊ और खास समाधान तैयार करता है।",
        "from architectural aluminium and glass work to custom aquariums, live fishes and accessories, our goal is to make every project feel thoughtfully designed.": "एल्यूमीनियम और कांच के काम से लेकर विशेष एक्वेरियम, मछलियों और सामान तक, हमारा उद्देश्य हर परियोजना को सोच-समझकर डिज़ाइन करना है।",
        "attention to dimensions and detail": "माप और बारीकियों पर ध्यान",
        "solutions shaped around your vision": "आपकी पसंद के अनुसार समाधान",
        "built with care": "सावधानी से निर्मित",
        "quality-focused fabrication": "गुणवत्ता पर केंद्रित निर्माण",
        "strength": "मजबूती",
        "start your": "अपनी",
        "project": "परियोजना शुरू करें",
        "have a requirement, idea or question? get in touch with us.": "कोई ज़रूरत, विचार या सवाल है? हमसे संपर्क करें।",
        "call us": "हमें कॉल करें",
        "whatsapp": "व्हाट्सऐप",
        "quick enquiry": "त्वरित पूछताछ",
        "chat with us": "हमसे चैट करें",
        "find us": "हमारा पता",
        "gorakhpur": "गोरखपुर",
        "medical college road, in front of sethi floor mill, near hanuman mandir.": "मेडिकल कॉलेज रोड, सेठी फ्लोर मिल के सामने, हनुमान मंदिर के पास।",
        "shop timings": "दुकान का समय",
        "contact us for current timings": "आज के समय के लिए संपर्क करें",
        "current timings": "आज का समय",
        "today's hours": "आज का समय",
        "open today": "आज खुला है",
        "closed today": "आज बंद है",
        "closed": "बंद",
        "monday": "सोमवार",
        "tuesday": "मंगलवार",
        "wednesday": "बुधवार",
        "thursday": "गुरुवार",
        "friday": "शुक्रवार",
        "saturday": "शनिवार",
        "sunday": "रविवार",
        "interactive map can be connected when the exact map pin is provided.": "सही स्थान मिलने पर यहां इंटरैक्टिव नक्शा जोड़ा जा सकता है।",
        "aluminium • glass • aquariums • live fish • accessories": "एल्यूमीनियम • कांच • एक्वेरियम • जीवित मछलियां • सामान",
        "gorakhpur, india": "गोरखपुर, भारत",
        "secure access": "सुरक्षित प्रवेश",
        "manage products, timings, invoices and website information.": "उत्पाद, समय, बिल और वेबसाइट की जानकारी प्रबंधित करें।",
        "username": "उपयोगकर्ता नाम",
        "enter username": "उपयोगकर्ता नाम दर्ज करें",
        "password": "पासवर्ड",
        "enter password": "पासवर्ड दर्ज करें",
        "enter admin panel": "एडमिन पैनल खोलें",
        "welcome.": "स्वागत है।",
        "hindi language mode selected.": "हिंदी भाषा चुनी गई।",
        "english language mode selected.": "अंग्रेज़ी भाषा चुनी गई।",
        "preview": "पूर्वावलोकन"
    };

    const originalTextNodes = new WeakMap();
    const originalAttributes = new WeakMap();
    const normalizeText = value => value.replace(/\s+/g, " ").trim().toLowerCase();

    const translatePage = language => {
        document.documentElement.lang = language === "HI" ? "hi" : "en";
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;

        while ((node = walker.nextNode())) {
            if (node.parentElement?.closest("script, style, template, [data-no-translate]")) {
                continue;
            }

            if (!originalTextNodes.has(node)) {
                originalTextNodes.set(node, node.textContent);
            }

            const original = originalTextNodes.get(node);
            if (language === "HI") {
                const translation = hindiText[normalizeText(original)];
                if (translation) {
                    const leading = original.match(/^\s*/)?.[0] || "";
                    const trailing = original.match(/\s*$/)?.[0] || "";
                    const value = `${leading}${translation}${trailing}`;
                    if (node.textContent !== value) {
                        node.textContent = value;
                    }
                }
            } else if (node.textContent !== original) {
                node.textContent = original;
            }
        }

        document.querySelectorAll("[placeholder], [aria-label], [title], img[alt]").forEach(element => {
            ["placeholder", "aria-label", "title", "alt"].forEach(attribute => {
                if (!element.hasAttribute(attribute)) {
                    return;
                }

                let saved = originalAttributes.get(element);
                if (!saved) {
                    saved = {};
                    originalAttributes.set(element, saved);
                }
                if (!(attribute in saved)) {
                    saved[attribute] = element.getAttribute(attribute);
                }

                const original = saved[attribute];
                const translation = hindiText[normalizeText(original)];
                const value = language === "HI" && translation ? translation : original;
                if (element.getAttribute(attribute) !== value) {
                    element.setAttribute(attribute, value);
                }
            });
        });
    };

    let languageObserver;

    const applyLanguageText = () => {
        const lang = currentLanguage === "HI" ? "HI" : "EN";
        const dict = translations[lang];

        translatePage(lang);
        if (!languageObserver && "MutationObserver" in window) {
            languageObserver = new MutationObserver(() => translatePage(currentLanguage));
            languageObserver.observe(document.body, { childList: true, characterData: true, subtree: true });
        }
        return;

        const setElementText = (element, value) => {
            if (!element) {
                return;
            }

            const textNodes = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE);
            const textNode = textNodes[textNodes.length - 1] || null;

            if (textNode) {
                textNode.textContent = value;
                return;
            }

            element.textContent = value;
        };

        const navLinks = [
            { selector: ".desktop-navigation .nav-link[href='#home']", key: "navHome" },
            { selector: ".desktop-navigation .nav-link[href='#aluminium']", key: "navAluminium" },
            { selector: ".desktop-navigation .nav-link[href='#aquarium']", key: "navAquarium" },
            { selector: ".desktop-navigation .nav-link[href='#showcase']", key: "navShowcase" },
            { selector: ".desktop-navigation .nav-link[href='#about']", key: "navAbout" },
            { selector: ".desktop-navigation .nav-link[href='#contact']", key: "navContact" },
            { selector: ".mobile-nav-link[href='#home']", key: "navHome" },
            { selector: ".mobile-nav-link[href='#aluminium']", key: "navAluminium" },
            { selector: ".mobile-nav-link[href='#aquarium']", key: "navAquarium" },
            { selector: ".mobile-nav-link[href='#showcase']", key: "navShowcase" },
            { selector: ".mobile-nav-link[href='#about']", key: "navAbout" },
            { selector: ".mobile-nav-link[href='#contact']", key: "navContact" }
        ];

        navLinks.forEach(({ selector, key }) => {
            const element = document.querySelector(selector);
            if (element) {
                setElementText(element, dict[key]);
            }
        });

        const adminButtonText = document.querySelector(".admin-button span");
        if (adminButtonText) {
            adminButtonText.textContent = dict.admin;
        }

        const mobileAdminButton = document.getElementById("mobileAdminButton");
        if (mobileAdminButton) {
            mobileAdminButton.innerHTML = '<i class="fa-solid fa-user-shield"></i> ' + dict.adminPanel;
        }

        const heroEyebrow = document.querySelector(".hero-eyebrow span:last-child");
        if (heroEyebrow) {
            heroEyebrow.textContent = dict.heroEyebrow;
        }

        const heroTitle = document.querySelector(".hero-title");
        if (heroTitle) {
            heroTitle.innerHTML = dict.heroTitle;
        }

        const heroDescription = document.querySelector(".hero-description");
        if (heroDescription) {
            heroDescription.textContent = dict.heroDescription;
        }

        const heroButtons = document.querySelectorAll(".primary-button, .secondary-button");
        heroButtons.forEach((button) => {
            const textNode = button.querySelector("span");
            if (!textNode) {
                return;
            }

            const text = textNode.textContent.trim();
            if (text === "Explore Our Work" || text === "हमारा काम देखें") {
                textNode.textContent = dict.exploreWork;
            }
            if (text === "Contact Us" || text === "संपर्क करें") {
                textNode.textContent = dict.contactUs;
            }
            if (text === "Discuss Your Aquarium" || text === "अपने एक्वैरियम पर चर्चा करें") {
                textNode.textContent = lang === "HI" ? "अपने एक्वैरियम पर चर्चा करें" : "Discuss Your Aquarium";
            }
        });

        const showroomLabel = document.querySelector(".hero-location span");
        if (showroomLabel) {
            showroomLabel.textContent = dict.showroom;
        }

        const showroomAddress = document.querySelector(".hero-location strong");
        if (showroomAddress) {
            showroomAddress.textContent = dict.showroomAddress;
        }

        const statTexts = {
            "Precision": dict.precision,
            "Craftsmanship": dict.craftsmanship,
            "Custom Design": dict.customDesign,
            "Aquarium World": dict.aquariumWorld
        };

        document.querySelectorAll(".hero-stat span").forEach((el) => {
            const text = el.textContent.trim();
            if (statTexts[text]) {
                el.textContent = statTexts[text];
            }
        });

        const whatsappButton = document.querySelector(".whatsapp-card a");
        if (whatsappButton) {
            whatsappButton.innerHTML = dict.whatsAppChat + ' <i class="fa-solid fa-arrow-up-right-from-square"></i>';
        }

        const timingsLabel = document.getElementById("shopTimingDisplay");
        if (timingsLabel) {
            timingsLabel.textContent = lang === "HI" ? "आज का समय" : "Current timings";
        }

        const timingNotice = document.getElementById("shopTimingNotice");
        if (timingNotice) {
            timingNotice.textContent = dict.notice;
        }

        const sectionEyebrows = document.querySelectorAll(".section-eyebrow");
        sectionEyebrows.forEach((el) => {
            const val = el.textContent.trim();
            if (val === "LET'S TALK") {
                el.textContent = dict.contactLabel;
            }
            if (val === "SHOP TIMINGS") {
                el.textContent = dict.shopTimings;
            }
        });

        const infoButtons = document.querySelectorAll(".card-action, .dynamic-whatsapp, .dynamic-enquire, .aquarium-card-button");
        infoButtons.forEach((button) => {
            if (button.classList.contains("dynamic-whatsapp")) {
                button.innerHTML = '<i class="fa-brands fa-whatsapp"></i> ' + dict.order;
            }
            if (button.classList.contains("dynamic-enquire")) {
                button.textContent = dict.enquire;
            }
            if (button.classList.contains("aquarium-card-button")) {
                const text = button.textContent.trim();
                if (text === "View Accessories" || text === "एक्सेसरी देखें") {
                    button.innerHTML = dict.viewAccessories + ' <i class="fa-solid fa-arrow-right"></i>';
                }
            }
            if (button.classList.contains("card-action")) {
                const text = button.textContent.trim();
                if (text.startsWith("Enquire Now") || text.startsWith("अभी पूछें")) {
                    button.innerHTML = dict.enquire + ' <i class="fa-solid fa-arrow-up-right-from-square"></i>';
                }
            }
        });
    };

    updateLanguageButton();
    applyLanguageText();

    if (languageButton) {

        languageButton.addEventListener(
            "click",
            () => {

                currentLanguage =
                    currentLanguage === "EN"
                        ? "HI"
                        : "EN";

                localStorage.setItem(
                    "shail_language",
                    currentLanguage
                );

                updateLanguageButton();
                applyLanguageText();

                showNotification(
                    currentLanguage === "HI"
                        ? "Hindi language mode selected."
                        : "English language mode selected."
                );

            }
        );

    }


    /* =====================================================
       20. SHOP TIMINGS FOUNDATION
       ===================================================== */

    const shopSettings = {

        monday: "09:00 - 20:00",
        tuesday: "09:00 - 20:00",
        wednesday: "09:00 - 20:00",
        thursday: "09:00 - 20:00",
        friday: "09:00 - 20:00",
        saturday: "09:00 - 20:00",
        sunday: "Closed"

    };

    const getShopTimingsData = () => {
        try {
            const saved = JSON.parse(localStorage.getItem("shail_shop_timings") || "null");
            if (!saved || !saved.days) {
                return {
                    enabled: true,
                    notice: "",
                    days: {
                        Monday: { open: true, from: "09:00", to: "20:00" },
                        Tuesday: { open: true, from: "09:00", to: "20:00" },
                        Wednesday: { open: true, from: "09:00", to: "20:00" },
                        Thursday: { open: true, from: "09:00", to: "20:00" },
                        Friday: { open: true, from: "09:00", to: "20:00" },
                        Saturday: { open: true, from: "09:00", to: "20:00" },
                        Sunday: { open: false, from: "09:00", to: "20:00" }
                    }
                };
            }
            return saved;
        } catch (error) {
            return {
                enabled: true,
                notice: "",
                days: {
                    Monday: { open: true, from: "09:00", to: "20:00" },
                    Tuesday: { open: true, from: "09:00", to: "20:00" },
                    Wednesday: { open: true, from: "09:00", to: "20:00" },
                    Thursday: { open: true, from: "09:00", to: "20:00" },
                    Friday: { open: true, from: "09:00", to: "20:00" },
                    Saturday: { open: true, from: "09:00", to: "20:00" },
                    Sunday: { open: false, from: "09:00", to: "20:00" }
                }
            };
        }
    };

    const renderShopTimings = () => {
        const display = document.getElementById("shopTimingDisplay");
        const schedule = document.getElementById("shopTimingSchedule");
        const notice = document.getElementById("shopTimingNotice");

        if (!display || !schedule) {
            return;
        }

        const timings = getShopTimingsData();
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const today = new Date().getDay();
        const todayName = days[(today + 6) % 7];
        const selectedDay = timings.days?.[todayName] || { open: true, from: "09:00", to: "20:00" };

        const isOpen = timings.enabled !== false && selectedDay.open;
        const label = currentLanguage === "HI" ? (isOpen ? "अभी खुला है" : "अभी बंद है") : (isOpen ? "Open today" : "Closed today");
        display.textContent = label;

        schedule.innerHTML = days.map(day => {
            const entry = timings.days?.[day] || { open: true, from: "09:00", to: "20:00" };
            const value = entry.open ? `${entry.from} - ${entry.to}` : "Closed";
            const dayLabel = currentLanguage === "HI" ? {
                Monday: "सोमवार",
                Tuesday: "मंगलवार",
                Wednesday: "बुधवार",
                Thursday: "गुरुवार",
                Friday: "शुक्रवार",
                Saturday: "शनिवार",
                Sunday: "रविवार"
            }[day] : day;
            return `<div><span>${dayLabel}</span><strong>${value}</strong></div>`;
        }).join("");

        if (notice) {
            notice.textContent = timings.notice || "";
        }
    };

    const setShopHours = settings => {

        Object.assign(
            shopSettings,
            settings
        );

        localStorage.setItem(
            "shail_shop_hours",
            JSON.stringify(shopSettings)
        );
    };


    const savedHours =
        localStorage.getItem(
            "shail_shop_hours"
        );

    if (savedHours) {

        try {

            Object.assign(
                shopSettings,
                JSON.parse(savedHours)
            );

        } catch (error) {

            console.warn(
                "Unable to load saved shop hours."
            );

        }

    }

    const loadBusinessSettings = () => {
        try {
            const settings = JSON.parse(localStorage.getItem("shail_business_settings") || "null") || {};

            const phoneLink = document.querySelector('.contact-card a[href^="tel:"]');
            if (phoneLink && settings.phone) {
                phoneLink.href = `tel:${settings.phone.replace(/\D/g, "")}`;
                phoneLink.textContent = settings.phone;
            }

            const whatsappLink = document.querySelector('.whatsapp-card a');
            if (whatsappLink && settings.whatsapp) {
                whatsappLink.href = `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`;
                whatsappLink.innerHTML = (currentLanguage === "HI" ? "व्हाट्सऐप से चैट करें" : "Chat With Us") + ' <i class="fa-solid fa-arrow-up-right-from-square"></i>';
            }

            const locationCard = document.querySelector('.contact-details .contact-card:nth-child(3) strong');
            if (locationCard && settings.address) {
                locationCard.textContent = settings.address;
            }

            const mapLabelStrong = document.querySelector('.map-label strong');
            if (mapLabelStrong && settings.address) {
                mapLabelStrong.textContent = settings.address.split(',')[0] || "Gorakhpur";
            }

            const mapAddress = [
                settings.address,
                "Medical College Road, in front of Sethi Floor Mill, near Hanuman Mandir, Gorakhpur, Uttar Pradesh"
            ].filter(Boolean).join(", ");
            const mapQuery = encodeURIComponent(mapAddress);
            const mapFrame = document.getElementById("shopMapFrame");
            const directionsLink = document.getElementById("mapDirectionsLink");
            if (mapFrame) {
                mapFrame.src = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
            }
            if (directionsLink) {
                directionsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;
            }

            const footerLocation = document.querySelector('.footer-bottom span:last-child');
            if (footerLocation && settings.address) {
                footerLocation.textContent = settings.address.toUpperCase();
            }

            return settings;
        } catch (error) {
            return {};
        }
    };

    const applyPublicData = () => {
        loadBusinessSettings();
        renderShopTimings();
        applyLanguageText();
    };

    window.addEventListener("storage", event => {
        if (event.key === "shail_language") {
            currentLanguage = event.newValue === "HI" ? "HI" : "EN";
            updateLanguageButton();
            applyLanguageText();
        }

        if (event.key === "shail_business_settings" || event.key === "shail_shop_timings") {
            applyPublicData();
        }
    });

    window.addEventListener("shail:data-updated", applyPublicData);

    applyPublicData();


    /* =====================================================
       21. PRODUCT DATA FOUNDATION
       ===================================================== */

    let products = [];

    const savedProducts =
        localStorage.getItem(
            "shail_products"
        );

    if (savedProducts) {

        try {

            products =
                JSON.parse(savedProducts);

        } catch (error) {

            products = [];

        }

    }


    const saveProducts = () => {

        localStorage.setItem(
            "shail_products",
            JSON.stringify(products)
        );

    };


    const addProduct = product => {

        const newProduct = {

            id:
                Date.now(),

            name:
                product.name || "Unnamed Product",

            category:
                product.category || "General",

            price:
                Number(product.price) || 0,

            description:
                product.description || "",

            image:
                product.image || "",

            createdAt:
                new Date().toISOString()

        };

        products.push(newProduct);

        saveProducts();

        return newProduct;
    };


    const getProducts = () => {

        return [...products];

    };


    const deleteProduct = id => {

        products =
            products.filter(
                product =>
                    product.id !== id
            );

        saveProducts();

    };


    /*
     * Available globally for future admin dashboard.
     */

    window.ShailProducts = {

        addProduct,
        getProducts,
        deleteProduct

    };


    /* =====================================================
       22. BILLING FOUNDATION
       ===================================================== */

    let invoiceCounter =
        Number(
            localStorage.getItem(
                "shail_invoice_counter"
            )
        ) || 1000;


    const generateInvoiceNumber = () => {

        invoiceCounter++;

        localStorage.setItem(
            "shail_invoice_counter",
            invoiceCounter
        );

        const year =
            new Date().getFullYear();

        return `SH-${year}-${invoiceCounter}`;

    };


    const createInvoice = data => {

        const subtotal =
            Number(data.subtotal) || 0;

        const discount =
            Number(data.discount) || 0;

        const tax =
            Number(data.tax) || 0;

        const total =
            subtotal -
            discount +
            tax;

        return {

            invoiceNumber:
                generateInvoiceNumber(),

            date:
                new Date().toISOString(),

            customer:
                data.customer || "",

            phone:
                data.phone || "",

            items:
                data.items || [],

            subtotal,

            discount,

            tax,

            total,

            paymentMethod:
                data.paymentMethod || "Cash",

            paymentStatus:
                data.paymentStatus || "Unpaid"

        };

    };


    window.ShailBilling = {

        createInvoice,
        generateInvoiceNumber

    };


    /* =====================================================
       23. CURRENT YEAR
       ===================================================== */

    const currentYear =
        $("#currentYear");

    if (currentYear) {

        currentYear.textContent =
            new Date().getFullYear();

    }


    /* =====================================================
       24. BACK TO TOP BUTTON
       ===================================================== */

    const backToTop =
        $("#backToTop");

    if (backToTop) {

        window.addEventListener(
            "scroll",
            () => {

                backToTop.classList.toggle(
                    "show",
                    window.scrollY > 600
                );

            },
            { passive: true }
        );

        backToTop.addEventListener(
            "click",
            () => {

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    /* =====================================================
       25. AQUARIUM BUBBLES
       ===================================================== */

    const aquariumVisual =
        $(".aquarium-visual");

    if (aquariumVisual) {

        for (let i = 0; i < 12; i++) {

            const bubble =
                document.createElement("span");

            bubble.className = "bubble";

            bubble.style.left =
                `${Math.random() * 90 + 5}%`;

            bubble.style.animationDelay =
                `${Math.random() * 6}s`;

            bubble.style.animationDuration =
                `${5 + Math.random() * 5}s`;

            const size =
                4 + Math.random() * 10;

            bubble.style.width =
                `${size}px`;

            bubble.style.height =
                `${size}px`;

            aquariumVisual.appendChild(
                bubble
            );

        }

    }


    /* =====================================================
       26. FLOATING PARTICLES
       ===================================================== */

    const environment =
        $(".background-environment");

    if (environment) {

        for (let i = 0; i < 35; i++) {

            const particle =
                document.createElement("span");

            particle.className =
                "particle";

            particle.style.left =
                `${Math.random() * 100}%`;

            particle.style.top =
                `${Math.random() * 100}%`;

            particle.style.animationDelay =
                `${Math.random() * 8}s`;

            particle.style.animationDuration =
                `${5 + Math.random() * 7}s`;

            environment.appendChild(
                particle
            );

        }

    }


    /* =====================================================
       27. CLOSE DROPDOWN / MODAL WHEN CLICKING OUTSIDE
       ===================================================== */

    document.addEventListener(
        "click",
        event => {

            if (
                mobileNavigation &&
                mobileNavigation.classList.contains("active") &&
                !mobileNavigation.contains(event.target) &&
                !mobileMenuButton?.contains(event.target)
            ) {

                setMobileNavigationOpen(false);

            }

        }
    );


    /* =====================================================
       28. PREVENT IMAGE DRAGGING
       ===================================================== */

    $$("img").forEach(image => {

        image.addEventListener(
            "dragstart",
            event => event.preventDefault()
        );

    });


    /* =====================================================
       29. WEBSITE STARTUP MESSAGE
       ===================================================== */

    console.log(
        "%c SHAIL ALLUMINIUM AND GLASS FABRICANTS ",
        "font-size:16px;font-weight:bold;"
    );

    console.log(
        "Professional website interface initialized."
    );

    console.log(
        "Product management foundation initialized."
    );

    console.log(
        "Billing foundation initialized."
    );

});
/* ============================================================
   DYNAMIC PRODUCT CATALOGUE
   Connects Admin Products → Public Website
   ============================================================ */

document.addEventListener("DOMContentLoaded", async function () {

    await window.__shailPublicDataReady;

    const productGrid =
        document.getElementById("dynamicProductsGrid");

    const noProductsMessage =
        document.getElementById("noProductsMessage");

    if (!productGrid) {
        return;
    }

    const storageKey = "shail_admin_products";

    const whatsappNumber = "919532475637";

    function createProductPlaceholder(category = "Product") {

        const palette = {
            Aluminium: ["#0a2330", "#45d4ff"],
            Glass: ["#021b2d", "#79f0d8"],
            Aquarium: ["#061b2d", "#38c5d4"],
            "Live Fish": ["#082b35", "#86e7c3"],
            Accessories: ["#241d39", "#c4b5fd"]
        };

        const [bgStart, accent] = palette[category] || ["#061b2d", "#94f8ff"];
        const label = (category || "Product").toUpperCase().replace(/[&<>"']/g, "");

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
                <defs>
                    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stop-color="${bgStart}" />
                        <stop offset="100%" stop-color="${accent}" stop-opacity="0.6" />
                    </linearGradient>
                </defs>
                <rect width="800" height="520" fill="url(#g)"/>
                <circle cx="680" cy="120" r="110" fill="rgba(255,255,255,0.12)"/>
                <rect x="280" y="130" width="240" height="200" rx="28" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)"/>
                <text x="400" y="270" text-anchor="middle" fill="white" font-size="54" font-family="Arial, Helvetica, sans-serif" font-weight="700">${label}</text>
            </svg>
        `;

        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    function seedStarterProducts() {

        const savedProducts = localStorage.getItem(storageKey);

        if (savedProducts !== null) {

            try {
                const parsed = JSON.parse(savedProducts);

                if (Array.isArray(parsed)) {
                    return parsed;
                }

            } catch (error) {
                console.warn("Unable to parse saved products.", error);
            }
        }

        const starterProducts = [
            {
                id: 1,
                name: "Premium Aluminium Window",
                category: "Aluminium",
                price: 2400,
                description: "Modern sliding window with corrosion-resistant framing and high durability.",
                image: createProductPlaceholder("Aluminium")
            },
            {
                id: 2,
                name: "Tempered Glass Door",
                category: "Glass",
                price: 4200,
                description: "Elegant glass door system designed for homes, offices and premium storefronts.",
                image: createProductPlaceholder("Glass")
            },
            {
                id: 3,
                name: "Aquarium Display Tank",
                category: "Aquarium",
                price: 6800,
                description: "Custom aquarium tank built for attractive display and long-lasting water safety.",
                image: createProductPlaceholder("Aquarium")
            },
            {
                id: 4,
                name: "Live Fish Collection",
                category: "Live Fish",
                price: 320,
                description: "Healthy, colourful live fish stock curated for home aquariums and decorative spaces.",
                image: createProductPlaceholder("Live Fish")
            },
            {
                id: 5,
                name: "Aqua Accessories Kit",
                category: "Accessories",
                price: 950,
                description: "Essential accessories for aquarium care, maintenance and complete setup support.",
                image: createProductPlaceholder("Accessories")
            }
        ];

        localStorage.setItem(storageKey, JSON.stringify(starterProducts));

        return starterProducts;
    }


    function loadProducts() {

        let products = [];

        try {

            const savedProducts =
                localStorage.getItem(storageKey);

            if (savedProducts === null) {
                products = seedStarterProducts();
            } else {
                products = JSON.parse(savedProducts);
            }

            if (!Array.isArray(products)) {
                products = seedStarterProducts();
            }

        } catch (error) {

            console.error(
                "Unable to load products:",
                error
            );

            products = seedStarterProducts();
        }

        if (!Array.isArray(products)) {
            return [];
        }

        let aquariumItems = [];
        try {
            aquariumItems = JSON.parse(localStorage.getItem("shail_aquarium_items") || "[]");
        } catch (error) {
            aquariumItems = [];
        }

        const inventoryProducts = Array.isArray(aquariumItems)
            ? aquariumItems
                .filter(item => Number(item.stock) > 0)
                .map(item => ({
                    id: `inventory-${item.id}`,
                    name: item.name,
                    category: item.category || "Aquarium",
                    price: item.price,
                    description: item.notes || `In stock: ${Number(item.stock)} units`,
                    image: item.image
                }))
            : [];

        return [...products, ...inventoryProducts];
    }


    function renderManagedGallery() {
        const galleryGrid = document.querySelector(".gallery-grid");
        if (!galleryGrid) return;

        let galleryItems = [];
        try {
            galleryItems = JSON.parse(localStorage.getItem("shail_gallery_items") || "[]");
        } catch (error) {
            galleryItems = [];
        }

        if (!Array.isArray(galleryItems)) return;

        galleryGrid
            .querySelectorAll(".gallery-managed-item")
            .forEach(item => item.remove());

        galleryItems.forEach(item => {
            if (!item.image || !item.title) return;

            const card = document.createElement("article");
            card.className = "gallery-item gallery-managed-item visible";

            const image = document.createElement("img");
            image.src = item.image;
            image.alt = item.title;
            image.loading = "lazy";

            const caption = document.createElement("div");
            caption.className = "gallery-content";

            const category = document.createElement("span");
            category.textContent = item.category || "Project";

            const title = document.createElement("h3");
            title.textContent = item.title;

            caption.append(category, title);
            card.append(image, caption);
            galleryGrid.appendChild(card);
        });
    }


    function formatPrice(price) {

        const amount = Number(price) || 0;

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
            }
        ).format(amount);
    }


    function createWhatsAppLink(product) {

        const message = [
            "Hello SHAIL ALLUMINIUM AND GLASS FABRICANTS,",
            "",
            "I am interested in:",
            product.name,
            "",
            `Price: ${formatPrice(product.price)}`,
            "",
            "Please provide more details."
        ].join("\n");

        return (
            "https://wa.me/" +
            whatsappNumber +
            "?text=" +
            encodeURIComponent(message)
        );
    }


    function renderProducts() {

        const products = loadProducts();

        productGrid.innerHTML = "";


        if (products.length === 0) {

            if (noProductsMessage) {
                noProductsMessage.style.display = "block";
            }

            return;
        }


        if (noProductsMessage) {
            noProductsMessage.style.display = "none";
        }


        products.forEach(function (product) {

            const card =
                document.createElement("article");

            card.className =
                "dynamic-product-card";


            const productImage =
                /^(https?:\/\/|\.{0,2}\/|data:image\/(?:png|jpeg|webp|svg\+xml);)/i.test(product.image || "")
                    ? product.image
                    :
                createProductPlaceholder(product.category || "Product");


            card.innerHTML = `

                <div class="dynamic-product-image">

                    <img
                        src="${escapePublicHtml(productImage)}"
                        alt="${escapePublicHtml(product.name)}"
                        loading="lazy"
                    >

                </div>


                <div class="dynamic-product-content">

                    <span class="dynamic-product-category">

                        ${escapePublicHtml(product.category || "General")}

                    </span>


                    <h3>
                        ${escapePublicHtml(product.name)}
                    </h3>


                    <p>

                        ${
                            escapePublicHtml(product.description ||
                            "Contact us for more information about this product."
                            )
                        }

                    </p>


                    <div class="dynamic-product-price">

                        ${formatPrice(product.price)}

                    </div>


                    <div class="dynamic-product-actions">

                        <a
                            href="${createWhatsAppLink(product)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="dynamic-whatsapp"
                        >

                            <i class="fa-brands fa-whatsapp"></i>

                            Order on WhatsApp

                        </a>


                        <button
                            type="button"
                            class="dynamic-enquire"
                            data-product-name="${escapePublicHtml(product.name)}"
                        >

                            Enquire

                        </button>

                    </div>

                </div>

            `;


            productGrid.appendChild(card);

        });


        setupEnquiryButtons();
    }


    function setupEnquiryButtons() {

        const buttons =
            document.querySelectorAll(
                ".dynamic-enquire"
            );


        buttons.forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const productName =
                        button.dataset.productName;

                    const message = [
                        "Hello SHAIL ALLUMINIUM AND GLASS FABRICANTS,",
                        "",
                        "I would like to enquire about:",
                        productName
                    ].join("\n");


                    const whatsappURL =
                        "https://wa.me/" +
                        whatsappNumber +
                        "?text=" +
                        encodeURIComponent(message);


                    window.open(
                        whatsappURL,
                        "_blank"
                    );

                }
            );

        });

    }


    function escapePublicHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    renderProducts();
    renderManagedGallery();


    window.addEventListener(
        "storage",
        function (event) {

            if (event.key === storageKey || event.key === "shail_aquarium_items") {
                renderProducts();
            }

            if (event.key === "shail_gallery_items") renderManagedGallery();

        }
    );

    window.addEventListener("shail:data-updated", renderProducts);
    window.addEventListener("shail:data-updated", renderManagedGallery);

});

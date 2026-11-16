(function () {
    'use strict';

    /**
     * The id of the configuration used in the LocalStorage API
     * NOTE: Change this value with your app name.
     */
    const configurationId = "skyleriearts-website-config";
    /**
     * Load a JSON file as the configuration of the app
     * @param path The file path
     */
    async function loadConfiguration(path) {
        // Revalidate on every load so a cached config never mismatches newly deployed code
        const loadedConfiguration = await fetch(path, { cache: "no-cache" }).then((res) => res.json());
        localStorage[configurationId] = JSON.stringify(loadedConfiguration);
    }
    /**
     * Set a configuration parameter
     * @param id The configuration parameter id
     * @param value The value to set
     */
    function setConfiguration(id, value) {
        const configuration = JSON.parse(localStorage[configurationId] || "{}");
        configuration[id] = value;
        localStorage.setItem(configurationId, JSON.stringify(configuration));
    }
    /**
     * Get configuration value
     * @param id The parameter id
     * @returns The parameter value
     */
    function getConfiguration(id) {
        const configuration = JSON.parse(localStorage[configurationId]);
        return configuration[id];
    }

    const SMALL_DEVICE_WIDTH = 760;
    const MEDIUM_DEVICE_WIDTH = 1024;
    /**
    * Get if the device is a small device
    * @returns True if the device is a small device
    */
    function isSmallDevice() {
        return window.matchMedia(`only screen and (max-width: ${SMALL_DEVICE_WIDTH}px)`).matches;
    }
    /**
    * Get if the device is a medium device
    * @returns True if the device is a medium device
    */
    function isMediumDevice() {
        return window.matchMedia(`only screen and (min-width: ${SMALL_DEVICE_WIDTH}px) and (max-width: ${MEDIUM_DEVICE_WIDTH}px)`).matches;
    }
    /**
    * Get if matches one of the mobile media queries
    * @returns True if the device is a mobile device
    */
    function isMobile() {
        return (navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/iPhone|iPad|iPod/i) ||
            navigator.userAgent.match(/Opera Mini/i) ||
            navigator.userAgent.match(/IEMobile/i));
    }

    /** Create a DOM element */
    function uiComponent(properties) {
        const element = document.createElement(properties.type || "div");
        element.innerHTML = undefined != properties.text ? properties.text : "";
        if (undefined != properties.id)
            element.id = properties.id;
        setDomClasses(element, properties.classes);
        setDomAttributes(element, properties.attributes);
        setDomStyles(element, properties.styles);
        setDomDataset(element, properties.data);
        if (false == properties.selectable) {
            setDomStyles(element, { userSelect: "none" });
        }
        return element;
    }
    /** Set DOM attributes */
    function setDomAttributes(element, attributes) {
        if (undefined == element || undefined == attributes)
            return element;
        for (const key in attributes)
            element.setAttribute(key, attributes[key]);
        return element;
    }
    /** Set DOM classes */
    function setDomClasses(element, classes) {
        if (undefined == element || undefined == classes)
            return element;
        for (const cl of classes) {
            element.classList.add(cl);
        }
        return element;
    }
    /** Set DOM styles */
    function setDomStyles(element, styles) {
        if (undefined == element || undefined == styles)
            return element;
        for (const key in styles)
            element.style[key] = styles[key];
        return element;
    }
    /** Set DOM dataset */
    function setDomDataset(element, dataset) {
        if (undefined == element || undefined == dataset)
            return element;
        for (const key in dataset)
            element.dataset[key] = dataset[key];
        return element;
    }

    class Display {
        static checkType() {
            if (isMobile() || isSmallDevice() || isMediumDevice()) {
                setDomDataset(document.documentElement, {
                    display: "mobile"
                });
                setConfiguration("display", "mobile");
                return;
            }
            setDomDataset(document.documentElement, {
                display: "desktop"
            });
            setConfiguration("display", "desktop");
        }
        static isMobile() {
            return "mobile" == getConfiguration("display");
        }
    }

    const icons = new Map();
    /**
     * Load icon collection from the given path
     * WARNING: Icon collection must be a json file
     * with svg contents for each key.
     *
     * @param id The id to set to the collection
     * @param path The path to search the collection for
     */
    async function loadIcons(id, path) {
        const collection = await fetch(path).then(res => res.json()).catch(console.error);
        icons.set(id, collection);
    }
    /**
     * Get an icon from current bundle
     * @param collectionId The id of the collection to search in
     * @param key The id of the icon to search for
     * @param size (Optional) The size to apply to the icon, applies 24px by default
     * @param fill (Optional) The color to fill the icon, applies #222222 by default
     * @returns HTMLElement with the svg element inside, nothing if the icon or collection does not exist
     */
    function getIcon(collectionId, key, size = "24px", fill = "#222222") {
        const collection = icons.get(collectionId);
        if (undefined == collection)
            return undefined;
        const content = collection[key];
        if (undefined == content)
            return undefined;
        const svg = `<svg height="${size}" width="${size}" viewBox="0 0 24 24" fill="${fill}">${content || ""}</svg>`;
        return uiComponent({ type: "div", text: svg });
    }

    const paths = new Map();
    let homeHandler = async (_p, c) => { c.innerHTML = "Home page."; };
    let notFoundHandler = async (_p, c) => { c.innerHTML = "Page not found."; };
    /**
     * Register a new route.
     * @param path The router path
     * @param handler The route handler
     */
    function setRoute(path, handler) {
        // If the path is empry return 
        if (undefined == path)
            return;
        // If the path is blank or /, register home and return
        path = path.trim();
        // If the path is home
        if ("/" == path || "" == path) {
            homeHandler = handler;
            return;
        }
        // If the path ends with / trim it
        const indexOfSlash = path.indexOf("/");
        if (-1 != indexOfSlash && "/" == path.substring(path.length - 1))
            path = path.substring(0, path.length - 1);
        // Replace all the variables with regex expressions to capture them later
        const regexp = /\/(\$+)/g;
        path = path.replaceAll(regexp, "/([^\/]+)");
        paths.set(path, handler);
        console.debug(`Set route ${path}`);
    }
    /**
     * Register the route to display when route path is not found.
     * @param handler The view handler to call
     */
    function setNotFoundRoute(handler) {
        notFoundHandler = handler;
    }
    /**
     * Show view for the given route.
     * @param path The given path to search for
     * @param container The container to display the views in
     */
    function showRoute(path, container) {
        container.innerHTML = "";
        // If it is the home route, show
        if ("/" == path || "" == path) {
            homeHandler([], container);
            return;
        }
        // Else search matching route
        const keys = Array.from(paths.keys()).sort(compareRouteLength);
        for (const route of keys) {
            // Check if route matches
            const regexp = RegExp(`^${route}$`);
            const params = path.match(regexp);
            if (null != params && 0 != params.length) {
                paths.get(route)(params.slice(1), container);
                return;
            }
        }
        // If no route found, show not found view.
        notFoundHandler([], container);
    }
    /**
     * Compare the length of two routes
     */
    function compareRouteLength(a, b) {
        const aLength = a.split("/").length - 1;
        const bLength = b.split("/").length - 1;
        if (aLength == bLength)
            return 0;
        if (aLength < bLength)
            return 1;
        return -1;
    }

    function uuidv4() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
    }

    const buffer = new Map();
    /**
     * Set a new signal
     */
    function setSignal() {
        const id = uuidv4();
        buffer.set(id, []);
        return id;
    }
    /**
     * Connect a function to a signal
     * @param id The signal id
     * @param handler The signal handler function
     */
    function connectToSignal(id, handler) {
        if (false == buffer.has(id)) {
            console.error(`Error connecting: The signal ${id} does not exist.`);
            return;
        }
        buffer.get(id).push(handler);
    }
    /**
     * Emit a signal with the given dat
     */
    async function emitSignal(id, data) {
        if (false == buffer.has(id))
            return;
        const targets = buffer.get(id);
        for (const target of targets) {
            target(data);
        }
    }

    /** Return a copy of the posts sorted from newest to oldest. */
    function sortPostsByDate(posts) {
        return [...posts].sort((a, b) => b.date.localeCompare(a.date));
    }
    /** Find the post with the given slug. */
    function findPostBySlug(posts, slug) {
        return posts.find(post => post.slug == slug);
    }
    /** Return up to `limit` featured projects, keeping their original order. */
    function takeFeatured(projects, limit) {
        return projects.filter(project => project.featured).slice(0, limit);
    }
    /** Format an ISO date (YYYY-MM-DD) as a short human date in the given locale. */
    function formatPostDate(isoDate, locale) {
        const [year, month, day] = isoDate.split("-").map(Number);
        // Build the date in local time so the day never shifts with the timezone
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
    }

    /** Every available language, in selector order. */
    const LANGUAGES = ["es", "en"];
    /** Language used when neither the stored choice nor the browser match. */
    const DEFAULT_LANGUAGE = "es";
    /** Whether a value is one of the available language codes. */
    function isLanguageCode(value) {
        return LANGUAGES.includes(value);
    }
    /** Pick the language: a valid stored choice, else the first available browser language, else the default. */
    function resolveLanguage(stored, browserLanguages) {
        if (isLanguageCode(stored))
            return stored;
        const browserMatch = browserLanguages
            .map(locale => locale.toLowerCase().split("-")[0])
            .find(isLanguageCode);
        return browserMatch ?? DEFAULT_LANGUAGE;
    }

    const LANGUAGE_CHANGED_SIGNAL = setSignal();
    const LANGUAGE_STORAGE_KEY = "softwareanvil-language";
    /** Holds the current language and remembers the visitor's choice. */
    class LanguageService {
        /** Apply the saved language, or the best match among the browser languages. */
        static init() {
            LanguageService.apply(resolveLanguage(LanguageService.readStored(), navigator.languages));
        }
        /** The current language. */
        static get() {
            return LanguageService.current;
        }
        /** Switch to the given language, remember it and notify listeners. */
        static set(language) {
            if (language == LanguageService.current)
                return;
            LanguageService.apply(language);
            LanguageService.store(language);
            emitSignal(LANGUAGE_CHANGED_SIGNAL, { language });
        }
        /** Set the language as current and on the root element. */
        static apply(language) {
            LanguageService.current = language;
            setDomAttributes(document.documentElement, { lang: language });
        }
        /** Read the saved language, if storage is available. */
        static readStored() {
            try {
                return localStorage.getItem(LANGUAGE_STORAGE_KEY);
            }
            catch {
                // Storage blocked (private mode): fall back to the browser languages
                return null;
            }
        }
        /** Save the language, ignoring storage that is blocked. */
        static store(language) {
            try {
                localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
            }
            catch {
                // Storage blocked (private mode): the choice lasts only for this visit
            }
        }
    }
    LanguageService.current = resolveLanguage(undefined, []);

    /** Loads the site content (profile, projects, posts) in the current language from the content folder. */
    class ContentService {
        /** Load the site owner's profile. */
        static async getProfile() {
            return JSON.parse(await ContentService.fetchText("profile.json"));
        }
        /** Load every project, in the order they appear in projects.json. */
        static async getProjects() {
            return JSON.parse(await ContentService.fetchText("projects.json"));
        }
        /** Load every post entry, newest first. */
        static async getPosts() {
            return sortPostsByDate(JSON.parse(await ContentService.fetchText("posts.json")));
        }
        /** Load the "about me" markdown. */
        static async getAbout() {
            return ContentService.fetchText("about.md");
        }
        /** Load the markdown body of a post. */
        static async getPostBody(post) {
            return ContentService.fetchText(`posts/${post.slug}.md`);
        }
        /** Fetch a content file in the current language as text, caching it for the session. */
        static fetchText(file) {
            const path = `${LanguageService.get()}/${file}`;
            const cached = ContentService.cache.get(path);
            if (cached)
                return cached;
            const request = ContentService.request(path);
            ContentService.cache.set(path, request);
            // Forget failed requests so the next navigation can retry
            request.catch(() => ContentService.cache.delete(path));
            return request;
        }
        /** Request a content file, failing with context on a non-OK response. */
        static async request(path) {
            const url = `${getConfiguration("path")["content"]}/${path}`;
            // Revalidate on every load so content edits show up without waiting for the cache to expire
            const response = await fetch(url, { cache: "no-cache" });
            if (!response.ok)
                throw new Error(`Could not load ${url}: HTTP ${response.status}`);
            return response.text();
        }
    }
    ContentService.cache = new Map();

    const THEME_CHANGED_SIGNAL = setSignal();
    const THEME_STORAGE_KEY = "softwareanvil-theme";
    /** Applies the colour theme and remembers the visitor's choice. */
    class Theme {
        /** Apply the saved theme, or the system preference when nothing is saved. */
        static init() {
            Theme.apply(Theme.readStored() ?? Theme.readSystem());
        }
        /** Switch between light and dark and remember the choice. */
        static toggle() {
            const next = Theme.isDark() ? "light" : "dark";
            Theme.apply(next);
            Theme.store(next);
            emitSignal(THEME_CHANGED_SIGNAL, { theme: next });
        }
        /** Whether the dark theme is active. */
        static isDark() {
            return document.documentElement.dataset["theme"] == "dark";
        }
        /** Set the theme on the root element. */
        static apply(theme) {
            setDomDataset(document.documentElement, { theme });
        }
        /** Read the theme preferred by the operating system. */
        static readSystem() {
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        /** Read the saved theme, if storage is available and holds a valid value. */
        static readStored() {
            try {
                const stored = localStorage.getItem(THEME_STORAGE_KEY);
                return stored == "light" || stored == "dark" ? stored : undefined;
            }
            catch {
                // Storage blocked (private mode): fall back to the system theme
                return undefined;
            }
        }
        /** Save the theme, ignoring storage that is blocked. */
        static store(theme) {
            try {
                localStorage.setItem(THEME_STORAGE_KEY, theme);
            }
            catch {
                // Storage blocked (private mode): the choice lasts only for this visit
            }
        }
    }

    /** Create an element whose text is set as plain text, never parsed as HTML. */
    function createTextElement(type, text, classes = []) {
        const element = document.createElement(type);
        element.textContent = text;
        setDomClasses(element, classes);
        return element;
    }
    /** Create a link; external links open in a new tab. */
    function createLink(text, href, classes = []) {
        const link = document.createElement("a");
        link.textContent = text;
        link.href = href;
        setDomClasses(link, classes);
        if (href.startsWith("http"))
            setDomAttributes(link, { target: "_blank", rel: "noopener noreferrer" });
        return link;
    }
    /** Create the root element of a page view. */
    function createPage(id) {
        const page = document.createElement("section");
        page.id = id;
        setDomClasses(page, ["page"]);
        return page;
    }
    /** Set the browser tab title, suffixed with the site name. */
    function setPageTitle(title) {
        const siteName = getConfiguration("base")["app_name"];
        document.title = title ? `${title} · ${siteName}` : siteName;
    }
    /** Create a page heading with an optional intro line. */
    function createPageHeader(title, intro) {
        const header = createTextElement("header", "", ["page-header"]);
        header.appendChild(createTextElement("h1", title));
        if (intro)
            header.appendChild(createTextElement("p", intro, ["page-intro"]));
        return header;
    }
    /** Create a section heading with an optional "see all" link on the right. */
    function createSectionHeader(title, link) {
        const header = createTextElement("div", "", ["section-header"]);
        header.appendChild(createTextElement("h2", title));
        if (link)
            header.appendChild(createLink(link.text, link.href, ["section-link"]));
        return header;
    }
    /** Create a muted message for empty lists. */
    function createEmptyState(text) {
        return createTextElement("p", text, ["state", "state-empty"]);
    }
    /** Create a visible error message for content that failed to load. */
    function createErrorState(text, error) {
        console.error(error);
        const element = createTextElement("p", text, ["state", "state-error"]);
        element.setAttribute("role", "alert");
        return element;
    }

    const ES = {
        LOCALE: "es-ES",
        NAV_HOME: "Inicio",
        NAV_PROJECTS: "Proyectos",
        NAV_BLOG: "Blog",
        NAV_LABEL: "Principal",
        TOGGLE_THEME: "Cambiar tema",
        LANGUAGE_LABEL: "Idioma",
        ABOUT_TITLE: "Sobre mí",
        PROJECTS_TITLE: "Proyectos",
        PROJECTS_INTRO: "Cosas que he construido o en las que estoy trabajando.",
        BLOG_TITLE: "Blog",
        BLOG_INTRO: "Notas sobre lo que construyo y aprendo.",
        LATEST_POSTS_TITLE: "Últimos posts",
        SEE_ALL: "Ver todos →",
        BACK_TO_BLOG: "← Volver al blog",
        NO_PROJECTS: "Todavía no hay proyectos.",
        NO_POSTS: "Todavía no hay posts.",
        LOAD_ERROR: "No se ha podido cargar el contenido. Prueba a recargar la página.",
        NOT_FOUND_TITLE: "404",
        NOT_FOUND_TEXT: "Esta página no existe.",
        NOT_FOUND_LINK: "← Volver al inicio",
    };
    const EN = {
        LOCALE: "en-US",
        NAV_HOME: "Home",
        NAV_PROJECTS: "Projects",
        NAV_BLOG: "Blog",
        NAV_LABEL: "Main",
        TOGGLE_THEME: "Toggle theme",
        LANGUAGE_LABEL: "Language",
        ABOUT_TITLE: "About me",
        PROJECTS_TITLE: "Projects",
        PROJECTS_INTRO: "Things I have built or am working on.",
        BLOG_TITLE: "Blog",
        BLOG_INTRO: "Notes on what I build and learn.",
        LATEST_POSTS_TITLE: "Latest posts",
        SEE_ALL: "See all →",
        BACK_TO_BLOG: "← Back to the blog",
        NO_PROJECTS: "No projects yet.",
        NO_POSTS: "No posts yet.",
        LOAD_ERROR: "The content could not be loaded. Try reloading the page.",
        NOT_FOUND_TITLE: "404",
        NOT_FOUND_TEXT: "This page does not exist.",
        NOT_FOUND_LINK: "← Back to home",
    };
    const TEXTS_BY_LANGUAGE = { es: ES, en: EN };
    /** The interface texts in the current language. */
    function getTexts() {
        return TEXTS_BY_LANGUAGE[LanguageService.get()];
    }

    /** Create the list of projects, or an empty state when there are none. */
    function createProjectList(projects) {
        if (projects.length == 0)
            return createEmptyState(getTexts().NO_PROJECTS);
        const list = createTextElement("ul", "", ["entry-list"]);
        projects.forEach(project => list.appendChild(createProjectItem(project)));
        return list;
    }
    /** Create the list of posts, or an empty state when there are none. */
    function createPostList(posts) {
        if (posts.length == 0)
            return createEmptyState(getTexts().NO_POSTS);
        const list = createTextElement("ul", "", ["entry-list"]);
        posts.forEach(post => list.appendChild(createPostItem(post)));
        return list;
    }
    /** Create one project row: name and year, description, tags. */
    function createProjectItem(project) {
        const item = createTextElement("li", "", ["entry"]);
        const title = createTextElement("div", "", ["entry-title"]);
        title.appendChild(createLink(project.name, project.url, ["entry-link"]));
        title.appendChild(createTextElement("span", String(project.year), ["entry-meta"]));
        item.appendChild(title);
        item.appendChild(createTextElement("p", project.description, ["entry-description"]));
        const tags = createTextElement("div", "", ["entry-tags"]);
        project.tags.forEach(tag => tags.appendChild(createTextElement("span", tag, ["tag"])));
        item.appendChild(tags);
        return item;
    }
    /** Create one post row: title and date, summary. */
    function createPostItem(post) {
        const item = createTextElement("li", "", ["entry"]);
        const title = createTextElement("div", "", ["entry-title"]);
        title.appendChild(createLink(post.title, `#/blog/${post.slug}`, ["entry-link"]));
        const date = createTextElement("time", formatPostDate(post.date, getTexts().LOCALE), ["entry-meta"]);
        date.setAttribute("datetime", post.date);
        title.appendChild(date);
        item.appendChild(title);
        item.appendChild(createTextElement("p", post.summary, ["entry-description"]));
        return item;
    }

    /** Page listing every post, newest first. */
    class BlogView {
        /** Show the blog view. */
        static async show(_parameters, container) {
            setPageTitle(getTexts().BLOG_TITLE);
            const page = createPage(BlogView.VIEW_ID);
            page.appendChild(createPageHeader(getTexts().BLOG_TITLE, getTexts().BLOG_INTRO));
            container.appendChild(page);
            try {
                page.appendChild(createPostList(await ContentService.getPosts()));
            }
            catch (error) {
                page.appendChild(createErrorState(getTexts().LOAD_ERROR, error));
            }
        }
    }
    BlogView.VIEW_ID = "blog";

    /** Site footer with the copyright line and the social links, which act as contact. */
    class Footer {
        /** Create the footer with the copyright line; socials are added once the profile loads. */
        static create(siteName) {
            const footer = createTextElement("footer", "", ["footer"]);
            const inner = createTextElement("div", "", ["footer-inner"]);
            inner.appendChild(createTextElement("p", `© ${new Date().getFullYear()} ${siteName}`, ["footer-copy"]));
            inner.appendChild(createTextElement("div", "", ["footer-socials"]));
            footer.appendChild(inner);
            return footer;
        }
        /** Fill the footer with one icon link per social. */
        static setSocials(footer, socials) {
            const container = footer.querySelector(".footer-socials");
            if (!container)
                return;
            container.replaceChildren(...socials.map(Footer.createSocialLink));
        }
        /** Create a social link with its icon, or its label when there is no icon for it. */
        static createSocialLink(social) {
            const icon = getIcon("social", social.id, "22px", "currentColor") ?? getIcon("material", social.id, "22px", "currentColor");
            const link = createLink(icon ? "" : social.label, social.url, ["footer-social"]);
            link.setAttribute("aria-label", social.label);
            link.title = social.label;
            if (icon)
                link.appendChild(icon);
            return link;
        }
    }

    /** Each language's name written in that language, for screen readers and tooltips. */
    const LANGUAGE_NAMES = { es: "Español", en: "English" };
    /** Top navigation bar with the site name, section links, language selector and theme toggle. */
    class Navbar {
        /** Create the navigation bar in the current language. */
        static create(siteName) {
            const texts = getTexts();
            const links = [
                { text: texts.NAV_HOME, section: "" },
                { text: texts.NAV_PROJECTS, section: "projects" },
                { text: texts.NAV_BLOG, section: "blog" },
            ];
            const header = createTextElement("header", "", ["navbar"]);
            const inner = createTextElement("div", "", ["navbar-inner"]);
            inner.appendChild(createLink(siteName, "#/", ["navbar-brand"]));
            const nav = createTextElement("nav", "", ["navbar-links"]);
            nav.setAttribute("aria-label", texts.NAV_LABEL);
            links.forEach(link => {
                const anchor = createLink(link.text, `#/${link.section}`, ["navbar-link"]);
                anchor.dataset["section"] = link.section;
                nav.appendChild(anchor);
            });
            inner.appendChild(nav);
            const actions = createTextElement("div", "", ["navbar-actions"]);
            actions.appendChild(Navbar.createLanguageSelector());
            actions.appendChild(Navbar.createThemeToggle());
            inner.appendChild(actions);
            header.appendChild(inner);
            return header;
        }
        /** Mark the link of the section that contains the given path as current. */
        static highlight(navbar, path) {
            const section = path.split("/")[0];
            navbar.querySelectorAll(".navbar-link").forEach(link => {
                if (link.dataset["section"] == section)
                    link.setAttribute("aria-current", "page");
                else
                    link.removeAttribute("aria-current");
            });
        }
        /** Create the ES · EN selector; the active language is marked as pressed. */
        static createLanguageSelector() {
            const selector = createTextElement("div", "", ["language-selector"]);
            selector.setAttribute("role", "group");
            selector.setAttribute("aria-label", getTexts().LANGUAGE_LABEL);
            LANGUAGES.forEach(language => {
                const button = createTextElement("button", language.toUpperCase(), ["language-option"]);
                button.setAttribute("lang", language);
                button.setAttribute("aria-label", LANGUAGE_NAMES[language]);
                button.setAttribute("aria-pressed", String(language == LanguageService.get()));
                button.title = LANGUAGE_NAMES[language];
                button.addEventListener("click", () => LanguageService.set(language));
                selector.appendChild(button);
            });
            return selector;
        }
        /** Create the button that switches between light and dark themes. */
        static createThemeToggle() {
            const button = createTextElement("button", "", ["theme-toggle"]);
            button.setAttribute("aria-label", getTexts().TOGGLE_THEME);
            button.title = getTexts().TOGGLE_THEME;
            Navbar.renderThemeIcon(button);
            button.addEventListener("click", () => {
                Theme.toggle();
                Navbar.renderThemeIcon(button);
            });
            return button;
        }
        /** Show the icon of the theme the button will switch to. */
        static renderThemeIcon(button) {
            const icon = getIcon("material", Theme.isDark() ? "light_mode" : "dark_mode", "20px", "currentColor");
            button.replaceChildren(icon);
        }
    }

    /*
     * @license
     *
     * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/chjj/marked
     *
     * Copyright (c) 2018-2021, Костя Третяк. (MIT Licensed)
     * https://github.com/ts-stack/markdown
     */
    class ExtendRegexp {
        constructor(regex, flags = '') {
            this.source = regex.source;
            this.flags = flags;
        }
        /**
         * Extend regular expression.
         *
         * @param groupName Regular expression for search a group name.
         * @param groupRegexp Regular expression of named group.
         */
        setGroup(groupName, groupRegexp) {
            let newRegexp = typeof groupRegexp == 'string' ? groupRegexp : groupRegexp.source;
            newRegexp = newRegexp.replace(/(^|[^\[])\^/g, '$1');
            // Extend regexp.
            this.source = this.source.replace(groupName, newRegexp);
            return this;
        }
        /**
         * Returns a result of extending a regular expression.
         */
        getRegexp() {
            return new RegExp(this.source, this.flags);
        }
    }

    /**
     * @license
     *
     * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/chjj/marked
     *
     * Copyright (c) 2018-2021, Костя Третяк. (MIT Licensed)
     * https://github.com/ts-stack/markdown
     */
    const escapeTest = /[&<>"']/;
    const escapeReplace = /[&<>"']/g;
    const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        // tslint:disable-next-line:quotemark
        "'": "&#39;",
    };
    const escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
    const escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
    function escape(html, encode) {
        if (encode) {
            if (escapeTest.test(html)) {
                return html.replace(escapeReplace, (ch) => replacements[ch]);
            }
        }
        else {
            if (escapeTestNoEncode.test(html)) {
                return html.replace(escapeReplaceNoEncode, (ch) => replacements[ch]);
            }
        }
        return html;
    }
    function unescape(html) {
        // Explicitly match decimal, hex, and named HTML entities
        return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi, function (_, n) {
            n = n.toLowerCase();
            if (n === "colon") {
                return ":";
            }
            if (n.charAt(0) === "#") {
                return n.charAt(1) === "x"
                    ? String.fromCharCode(parseInt(n.substring(2), 16))
                    : String.fromCharCode(+n.substring(1));
            }
            return "";
        });
    }

    /**
     * @license
     *
     * Copyright (c) 2018-2021, Костя Третяк. (MIT Licensed)
     * https://github.com/ts-stack/markdown
     */
    var TokenType;
    (function (TokenType) {
        TokenType[TokenType["space"] = 1] = "space";
        TokenType[TokenType["text"] = 2] = "text";
        TokenType[TokenType["paragraph"] = 3] = "paragraph";
        TokenType[TokenType["heading"] = 4] = "heading";
        TokenType[TokenType["listStart"] = 5] = "listStart";
        TokenType[TokenType["listEnd"] = 6] = "listEnd";
        TokenType[TokenType["looseItemStart"] = 7] = "looseItemStart";
        TokenType[TokenType["looseItemEnd"] = 8] = "looseItemEnd";
        TokenType[TokenType["listItemStart"] = 9] = "listItemStart";
        TokenType[TokenType["listItemEnd"] = 10] = "listItemEnd";
        TokenType[TokenType["blockquoteStart"] = 11] = "blockquoteStart";
        TokenType[TokenType["blockquoteEnd"] = 12] = "blockquoteEnd";
        TokenType[TokenType["code"] = 13] = "code";
        TokenType[TokenType["table"] = 14] = "table";
        TokenType[TokenType["html"] = 15] = "html";
        TokenType[TokenType["hr"] = 16] = "hr";
    })(TokenType || (TokenType = {}));
    class MarkedOptions {
        constructor() {
            this.gfm = true;
            this.tables = true;
            this.breaks = false;
            this.pedantic = false;
            this.sanitize = false;
            this.mangle = true;
            this.smartLists = false;
            this.silent = false;
            this.langPrefix = "lang-";
            this.smartypants = false;
            this.headerPrefix = "";
            /**
             * Self-close the tags for void elements (&lt;br/&gt;, &lt;img/&gt;, etc.)
             * with a "/" as required by XHTML.
             */
            this.xhtml = false;
            /**
             * The function that will be using to escape HTML entities.
             * By default using inner helper.
             */
            this.escape = escape;
            /**
             * The function that will be using to unescape HTML entities.
             * By default using inner helper.
             */
            this.unescape = unescape;
        }
    }

    /**
     * @license
     *
     * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/chjj/marked
     *
     * Copyright (c) 2018-2021, Костя Третяк. (MIT Licensed)
     * https://github.com/ts-stack/markdown
     */
    class Renderer {
        constructor(options) {
            this.options = options || Marked.options;
        }
        code(code, lang, escaped, meta) {
            if (this.options.highlight) {
                const out = this.options.highlight(code, lang);
                if (out != null && out !== code) {
                    escaped = true;
                    code = out;
                }
            }
            const escapedCode = escaped ? code : this.options.escape(code, true);
            if (!lang) {
                return `\n<pre><code>${escapedCode}\n</code></pre>\n`;
            }
            const className = this.options.langPrefix + this.options.escape(lang, true);
            return `\n<pre><code class="${className}">${escapedCode}\n</code></pre>\n`;
        }
        blockquote(quote) {
            return `<blockquote>\n${quote}</blockquote>\n`;
        }
        html(html) {
            return html;
        }
        heading(text, level, raw) {
            const id = this.options.headerPrefix + raw.toLowerCase().replace(/[^\w]+/g, "-");
            return `<h${level} id="${id}">${text}</h${level}>\n`;
        }
        hr() {
            return this.options.xhtml ? "<hr/>\n" : "<hr>\n";
        }
        list(body, ordered) {
            const type = ordered ? "ol" : "ul";
            return `\n<${type}>\n${body}</${type}>\n`;
        }
        listitem(text) {
            return "<li>" + text + "</li>\n";
        }
        paragraph(text) {
            return "<p>" + text + "</p>\n";
        }
        table(header, body) {
            return `
<table>
<thead>
${header}</thead>
<tbody>
${body}</tbody>
</table>
`;
        }
        tablerow(content) {
            return "<tr>\n" + content + "</tr>\n";
        }
        tablecell(content, flags) {
            const type = flags.header ? "th" : "td";
            const tag = flags.align
                ? "<" + type + ' style="text-align:' + flags.align + '">'
                : "<" + type + ">";
            return tag + content + "</" + type + ">\n";
        }
        // *** Inline level renderer methods. ***
        strong(text) {
            return "<strong>" + text + "</strong>";
        }
        em(text) {
            return "<em>" + text + "</em>";
        }
        codespan(text) {
            return "<code>" + text + "</code>";
        }
        br() {
            return this.options.xhtml ? "<br/>" : "<br>";
        }
        del(text) {
            return "<del>" + text + "</del>";
        }
        link(href, title, text) {
            if (this.options.sanitize) {
                let prot;
                try {
                    prot = decodeURIComponent(this.options.unescape(href))
                        .replace(/[^\w:]/g, "")
                        .toLowerCase();
                }
                catch (e) {
                    return text;
                }
                if (prot.indexOf("javascript:") === 0 ||
                    prot.indexOf("vbscript:") === 0 ||
                    prot.indexOf("data:") === 0) {
                    return text;
                }
            }
            let out = '<a href="' + href + '"';
            if (title) {
                out += ' title="' + title + '"';
            }
            out += ">" + text + "</a>";
            return out;
        }
        image(href, title, text) {
            let out = '<img src="' + href + '" alt="' + text + '"';
            if (title) {
                out += ' title="' + title + '"';
            }
            out += this.options.xhtml ? "/>" : ">";
            return out;
        }
        text(text) {
            return text;
        }
    }

    /**
     * @license
     *
     * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/chjj/marked
     *
     * Copyright (c) 2018-2021, Костя Третяк. (MIT Licensed)
     * https://github.com/ts-stack/markdown
     */
    /**
     * Inline Lexer & Compiler.
     */
    class InlineLexer {
        constructor(staticThis, links, options = Marked.options, renderer) {
            this.staticThis = staticThis;
            this.links = links;
            this.options = options;
            this.renderer =
                renderer || this.options.renderer || new Renderer(this.options);
            if (!this.links) {
                throw new Error("InlineLexer requires 'links' parameter.");
            }
            this.setRules();
        }
        /**
         * Static Lexing/Compiling Method.
         */
        static output(src, links, options) {
            const inlineLexer = new this(this, links, options);
            return inlineLexer.output(src);
        }
        static getRulesBase() {
            if (this.rulesBase) {
                return this.rulesBase;
            }
            /**
             * Inline-Level Grammar.
             */
            const base = {
                escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
                autolink: /^<([^ <>]+(@|:\/)[^ <>]+)>/,
                tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^<'">])*?>/,
                link: /^!?\[(inside)\]\(href\)/,
                reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
                nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
                strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
                em: /^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
                code: /^(`+)([\s\S]*?[^`])\1(?!`)/,
                br: /^ {2,}\n(?!\s*$)/,
                text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/,
                _inside: /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/,
                _href: /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/,
            };
            base.link = new ExtendRegexp(base.link)
                .setGroup("inside", base._inside)
                .setGroup("href", base._href)
                .getRegexp();
            base.reflink = new ExtendRegexp(base.reflink)
                .setGroup("inside", base._inside)
                .getRegexp();
            return (this.rulesBase = base);
        }
        static getRulesPedantic() {
            if (this.rulesPedantic) {
                return this.rulesPedantic;
            }
            return (this.rulesPedantic = {
                ...this.getRulesBase(),
                ...{
                    strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
                    em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
                },
            });
        }
        static getRulesGfm() {
            if (this.rulesGfm) {
                return this.rulesGfm;
            }
            const base = this.getRulesBase();
            const escape = new ExtendRegexp(base.escape)
                .setGroup("])", "~|])")
                .getRegexp();
            const text = new ExtendRegexp(base.text)
                .setGroup("]|", "~]|")
                .setGroup("|", "|https?://|")
                .getRegexp();
            return (this.rulesGfm = {
                ...base,
                ...{
                    escape,
                    url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
                    del: /^~~(?=\S)([\s\S]*?\S)~~/,
                    text,
                },
            });
        }
        static getRulesBreaks() {
            if (this.rulesBreaks) {
                return this.rulesBreaks;
            }
            const inline = this.getRulesGfm();
            const gfm = this.getRulesGfm();
            return (this.rulesBreaks = {
                ...gfm,
                ...{
                    br: new ExtendRegexp(inline.br).setGroup("{2,}", "*").getRegexp(),
                    text: new ExtendRegexp(gfm.text).setGroup("{2,}", "*").getRegexp(),
                },
            });
        }
        setRules() {
            if (this.options.gfm) {
                if (this.options.breaks) {
                    this.rules = this.staticThis.getRulesBreaks();
                }
                else {
                    this.rules = this.staticThis.getRulesGfm();
                }
            }
            else if (this.options.pedantic) {
                this.rules = this.staticThis.getRulesPedantic();
            }
            else {
                this.rules = this.staticThis.getRulesBase();
            }
            this.hasRulesGfm = this.rules.url !== undefined;
        }
        /**
         * Lexing/Compiling.
         */
        output(nextPart) {
            let execArr;
            let out = "";
            while (nextPart) {
                // escape
                if ((execArr = this.rules.escape.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    out += execArr[1];
                    continue;
                }
                // autolink
                if ((execArr = this.rules.autolink.exec(nextPart))) {
                    let text;
                    let href;
                    nextPart = nextPart.substring(execArr[0].length);
                    if (execArr[2] === "@") {
                        text = this.options.escape(execArr[1].charAt(6) === ":"
                            ? this.mangle(execArr[1].substring(7))
                            : this.mangle(execArr[1]));
                        href = this.mangle("mailto:") + text;
                    }
                    else {
                        text = this.options.escape(execArr[1]);
                        href = text;
                    }
                    out += this.renderer.link(href, null, text);
                    continue;
                }
                // url (gfm)
                if (!this.inLink &&
                    this.hasRulesGfm &&
                    (execArr = this.rules.url.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    const text = this.options.escape(execArr[1]);
                    const href = text;
                    out += this.renderer.link(href, null, text);
                    continue;
                }
                // tag
                if ((execArr = this.rules.tag.exec(nextPart))) {
                    if (!this.inLink && /^<a /i.test(execArr[0])) {
                        this.inLink = true;
                    }
                    else if (this.inLink && /^<\/a>/i.test(execArr[0])) {
                        this.inLink = false;
                    }
                    nextPart = nextPart.substring(execArr[0].length);
                    out += this.options.sanitize
                        ? this.options.sanitizer
                            ? this.options.sanitizer(execArr[0])
                            : this.options.escape(execArr[0])
                        : execArr[0];
                    continue;
                }
                // link
                if ((execArr = this.rules.link.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    this.inLink = true;
                    out += this.outputLink(execArr, {
                        href: execArr[2],
                        title: execArr[3],
                    });
                    this.inLink = false;
                    continue;
                }
                // reflink, nolink
                if ((execArr = this.rules.reflink.exec(nextPart)) ||
                    (execArr = this.rules.nolink.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    const keyLink = (execArr[2] || execArr[1]).replace(/\s+/g, " ");
                    const link = this.links[keyLink.toLowerCase()];
                    if (!link || !link.href) {
                        out += execArr[0].charAt(0);
                        nextPart = execArr[0].substring(1) + nextPart;
                        continue;
                    }
                    this.inLink = true;
                    out += this.outputLink(execArr, link);
                    this.inLink = false;
                    continue;
                }
                // strong
                if ((execArr = this.rules.strong.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    out += this.renderer.strong(this.output(execArr[2] || execArr[1]));
                    continue;
                }
                // em
                if ((execArr = this.rules.em.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    out += this.renderer.em(this.output(execArr[2] || execArr[1]));
                    continue;
                }
                // code
                if ((execArr = this.rules.code.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    out += this.renderer.codespan(this.options.escape(execArr[2].trim(), true));
                    continue;
                }
                // br
                if ((execArr = this.rules.br.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    out += this.renderer.br();
                    continue;
                }
                // del (gfm)
                if (this.hasRulesGfm &&
                    (execArr = this.rules.del.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    out += this.renderer.del(this.output(execArr[1]));
                    continue;
                }
                // text
                if ((execArr = this.rules.text.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    out += this.renderer.text(this.options.escape(this.smartypants(execArr[0])));
                    continue;
                }
                if (nextPart) {
                    throw new Error("Infinite loop on byte: " + nextPart.charCodeAt(0));
                }
            }
            return out;
        }
        /**
         * Compile Link.
         */
        outputLink(execArr, link) {
            const href = this.options.escape(link.href);
            const title = link.title ? this.options.escape(link.title) : null;
            return execArr[0].charAt(0) !== "!"
                ? this.renderer.link(href, title, this.output(execArr[1]))
                : this.renderer.image(href, title, this.options.escape(execArr[1]));
        }
        /**
         * Smartypants Transformations.
         */
        smartypants(text) {
            if (!this.options.smartypants) {
                return text;
            }
            return (text
                // em-dashes
                .replace(/---/g, "\u2014")
                // en-dashes
                .replace(/--/g, "\u2013")
                // opening singles
                .replace(/(^|[-\u2014/([{"\s])'/g, "$1\u2018")
                // closing singles & apostrophes
                .replace(/'/g, "\u2019")
                // opening doubles
                .replace(/(^|[-\u2014/([{\u2018\s])"/g, "$1\u201c")
                // closing doubles
                .replace(/"/g, "\u201d")
                // ellipses
                .replace(/\.{3}/g, "\u2026"));
        }
        /**
         * Mangle Links.
         */
        mangle(text) {
            if (!this.options.mangle) {
                return text;
            }
            let out = "";
            const length = text.length;
            for (let i = 0; i < length; i++) {
                let str;
                if (Math.random() > 0.5) {
                    str = "x" + text.charCodeAt(i).toString(16);
                }
                out += "&#" + str + ";";
            }
            return out;
        }
    }
    InlineLexer.rulesBase = null;
    /**
     * Pedantic Inline Grammar.
     */
    InlineLexer.rulesPedantic = null;
    /**
     * GFM Inline Grammar
     */
    InlineLexer.rulesGfm = null;
    /**
     * GFM + Line Breaks Inline Grammar.
     */
    InlineLexer.rulesBreaks = null;

    /**
     * @license
     *
     * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/chjj/marked
     *
     * Copyright (c) 2018-2021, Костя Третяк. (MIT Licensed)
     * https://github.com/ts-stack/markdown
     */
    /**
     * Parsing & Compiling.
     */
    class Parser {
        constructor(options) {
            this.simpleRenderers = [];
            this.line = 0;
            this.tokens = [];
            this.token = null;
            this.options = options || Marked.options;
            this.renderer = this.options.renderer || new Renderer(this.options);
        }
        static parse(tokens, links, options) {
            const parser = new this(options);
            return parser.parse(links, tokens);
        }
        parse(links, tokens) {
            this.inlineLexer = new InlineLexer(InlineLexer, links, this.options, this.renderer);
            this.tokens = tokens.reverse();
            let out = "";
            while (this.next()) {
                out += this.tok();
            }
            return out;
        }
        debug(links, tokens) {
            this.inlineLexer = new InlineLexer(InlineLexer, links, this.options, this.renderer);
            this.tokens = tokens.reverse();
            let out = "";
            while (this.next()) {
                const outToken = this.tok();
                this.token.line = this.line += outToken.split("\n").length - 1;
                out += outToken;
            }
            return out;
        }
        next() {
            return (this.token = this.tokens.pop());
        }
        getNextElement() {
            return this.tokens[this.tokens.length - 1];
        }
        parseText() {
            let body = this.token.text;
            let nextElement;
            while ((nextElement = this.getNextElement()) &&
                nextElement.type == TokenType.text) {
                body += "\n" + this.next().text;
            }
            return this.inlineLexer.output(body);
        }
        tok() {
            switch (this.token.type) {
                case TokenType.space: {
                    return "";
                }
                case TokenType.paragraph: {
                    return this.renderer.paragraph(this.inlineLexer.output(this.token.text));
                }
                case TokenType.text: {
                    if (this.options.isNoP) {
                        return this.parseText();
                    }
                    else {
                        return this.renderer.paragraph(this.parseText());
                    }
                }
                case TokenType.heading: {
                    return this.renderer.heading(this.inlineLexer.output(this.token.text), this.token.depth, this.token.text);
                }
                case TokenType.listStart: {
                    let body = "";
                    const ordered = this.token.ordered;
                    while (this.next().type != TokenType.listEnd) {
                        body += this.tok();
                    }
                    return this.renderer.list(body, ordered);
                }
                case TokenType.listItemStart: {
                    let body = "";
                    while (this.next().type != TokenType.listItemEnd) {
                        body +=
                            this.token.type == TokenType.text
                                ? this.parseText()
                                : this.tok();
                    }
                    return this.renderer.listitem(body);
                }
                case TokenType.looseItemStart: {
                    let body = "";
                    while (this.next().type != TokenType.listItemEnd) {
                        body += this.tok();
                    }
                    return this.renderer.listitem(body);
                }
                case TokenType.code: {
                    return this.renderer.code(this.token.text, this.token.lang, this.token.escaped, this.token.meta);
                }
                case TokenType.table: {
                    let header = "";
                    let body = "";
                    let cell;
                    // header
                    cell = "";
                    for (let i = 0; i < this.token.header.length; i++) {
                        const flags = { header: true, align: this.token.align[i] };
                        const out = this.inlineLexer.output(this.token.header[i]);
                        cell += this.renderer.tablecell(out, flags);
                    }
                    header += this.renderer.tablerow(cell);
                    for (const row of this.token.cells) {
                        cell = "";
                        for (let j = 0; j < row.length; j++) {
                            cell += this.renderer.tablecell(this.inlineLexer.output(row[j]), {
                                header: false,
                                align: this.token.align[j],
                            });
                        }
                        body += this.renderer.tablerow(cell);
                    }
                    return this.renderer.table(header, body);
                }
                case TokenType.blockquoteStart: {
                    let body = "";
                    while (this.next().type != TokenType.blockquoteEnd) {
                        body += this.tok();
                    }
                    return this.renderer.blockquote(body);
                }
                case TokenType.hr: {
                    return this.renderer.hr();
                }
                case TokenType.html: {
                    const html = !this.token.pre && !this.options.pedantic
                        ? this.inlineLexer.output(this.token.text)
                        : this.token.text;
                    return this.renderer.html(html);
                }
                default: {
                    if (this.simpleRenderers.length) {
                        for (let i = 0; i < this.simpleRenderers.length; i++) {
                            if (this.token.type == "simpleRule" + (i + 1)) {
                                return this.simpleRenderers[i].call(this.renderer, this.token.execArr);
                            }
                        }
                    }
                    const errMsg = `Token with "${this.token.type}" type was not found.`;
                    if (this.options.silent) {
                        console.log(errMsg);
                    }
                    else {
                        throw new Error(errMsg);
                    }
                }
            }
        }
    }

    /**
     * @license
     *
     * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/chjj/marked
     *
     * Copyright (c) 2018-2021, Костя Третяк. (MIT Licensed)
     * https://github.com/ts-stack/markdown
     */
    class Marked {
        /**
         * Merges the default options with options that will be set.
         *
         * @param options Hash of options.
         */
        static setOptions(options) {
            Object.assign(this.options, options);
            return this;
        }
        /**
         * Setting simple block rule.
         */
        static setBlockRule(regexp, renderer = () => "") {
            BlockLexer.simpleRules.push(regexp);
            this.simpleRenderers.push(renderer);
            return this;
        }
        /**
         * Accepts Markdown text and returns text in HTML format.
         *
         * @param src String of markdown source to be compiled.
         * @param options Hash of options. They replace, but do not merge with the default options.
         * If you want the merging, you can to do this via `Marked.setOptions()`.
         */
        static parse(src, options) {
            try {
                options = { ...this.options, ...options };
                const { tokens, links } = this.callBlockLexer(src, options);
                return this.callParser(tokens, links, options);
            }
            catch (e) {
                return this.callMe(e);
            }
        }
        /**
         * Accepts Markdown text and returns object with text in HTML format,
         * tokens and links from `BlockLexer.parser()`.
         *
         * @param src String of markdown source to be compiled.
         * @param options Hash of options. They replace, but do not merge with the default options.
         * If you want the merging, you can to do this via `Marked.setOptions()`.
         */
        static debug(src, options = this.options) {
            const { tokens, links } = this.callBlockLexer(src, options);
            let origin = tokens.slice();
            const parser = new Parser(options);
            parser.simpleRenderers = this.simpleRenderers;
            const result = parser.debug(links, tokens);
            /**
             * Translates a token type into a readable form,
             * and moves `line` field to a first place in a token object.
             */
            origin = origin.map((token) => {
                token.type = TokenType[token.type] || token.type;
                const line = token.line;
                delete token.line;
                if (line) {
                    return { ...{ line }, ...token };
                }
                else {
                    return token;
                }
            });
            return { tokens: origin, links, result };
        }
        static callBlockLexer(src = "", options) {
            if (typeof src != "string") {
                throw new Error(`Expected that the 'src' parameter would have a 'string' type, got '${typeof src}'`);
            }
            // Preprocessing.
            src = src
                .replace(/\r\n|\r/g, "\n")
                .replace(/\t/g, "    ")
                .replace(/\u00a0/g, " ")
                .replace(/\u2424/g, "\n")
                .replace(/^ +$/gm, "");
            return BlockLexer.lex(src, options, true);
        }
        static callParser(tokens, links, options) {
            if (this.simpleRenderers.length) {
                const parser = new Parser(options);
                parser.simpleRenderers = this.simpleRenderers;
                return parser.parse(links, tokens);
            }
            else {
                return Parser.parse(tokens, links, options);
            }
        }
        static callMe(err) {
            err.message +=
                "\nPlease report this to https://github.com/ts-stack/markdown";
            if (this.options.silent) {
                return ("<p>An error occured:</p><pre>" +
                    this.options.escape(err.message + "", true) +
                    "</pre>");
            }
            throw err;
        }
    }
    Marked.options = new MarkedOptions();
    Marked.simpleRenderers = [];

    /**
     * @license
     *
     * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/chjj/marked
     *
     * Copyright (c) 2018-2021, Костя Третяк. (MIT Licensed)
     * https://github.com/ts-stack/markdown
     */
    class BlockLexer {
        constructor(staticThis, options) {
            this.staticThis = staticThis;
            this.links = {};
            this.tokens = [];
            this.options = options || Marked.options;
            this.setRules();
        }
        /**
         * Accepts Markdown text and returns object with tokens and links.
         *
         * @param src String of markdown source to be compiled.
         * @param options Hash of options.
         */
        static lex(src, options, top, isBlockQuote) {
            const lexer = new this(this, options);
            return lexer.getTokens(src, top, isBlockQuote);
        }
        static getRulesBase() {
            if (this.rulesBase) {
                return this.rulesBase;
            }
            const base = {
                newline: /^\n+/,
                code: /^( {4}[^\n]+\n*)+/,
                hr: /^( *[-*_]){3,} *(?:\n+|$)/,
                heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
                lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
                blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
                list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
                html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
                def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
                paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
                text: /^[^\n]+/,
                bullet: /(?:[*+-]|\d+\.)/,
                item: /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/,
            };
            base.item = new ExtendRegexp(base.item, "gm")
                .setGroup(/bull/g, base.bullet)
                .getRegexp();
            base.list = new ExtendRegexp(base.list)
                .setGroup(/bull/g, base.bullet)
                .setGroup("hr", "\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))")
                .setGroup("def", "\\n+(?=" + base.def.source + ")")
                .getRegexp();
            const tag = "(?!(?:" +
                "a|em|strong|small|s|cite|q|dfn|abbr|data|time|code" +
                "|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo" +
                "|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b";
            base.html = new ExtendRegexp(base.html)
                .setGroup("comment", /<!--[\s\S]*?-->/)
                .setGroup("closed", /<(tag)[\s\S]+?<\/\1>/)
                .setGroup("closing", /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
                .setGroup(/tag/g, tag)
                .getRegexp();
            base.paragraph = new ExtendRegexp(base.paragraph)
                .setGroup("hr", base.hr)
                .setGroup("heading", base.heading)
                .setGroup("lheading", base.lheading)
                .setGroup("blockquote", base.blockquote)
                .setGroup("tag", "<" + tag)
                .setGroup("def", base.def)
                .getRegexp();
            return (this.rulesBase = base);
        }
        static getRulesGfm() {
            if (this.rulesGfm) {
                return this.rulesGfm;
            }
            const base = this.getRulesBase();
            const gfm = {
                ...base,
                ...{
                    fences: /^ *(`{3,}|~{3,})[ \.]*((\S+)? *[^\n]*)\n([\s\S]*?)\s*\1 *(?:\n+|$)/,
                    paragraph: /^/,
                    heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/,
                },
            };
            const group1 = gfm.fences.source.replace("\\1", "\\2");
            const group2 = base.list.source.replace("\\1", "\\3");
            gfm.paragraph = new ExtendRegexp(base.paragraph)
                .setGroup("(?!", `(?!${group1}|${group2}|`)
                .getRegexp();
            return (this.rulesGfm = gfm);
        }
        static getRulesTable() {
            if (this.rulesTables) {
                return this.rulesTables;
            }
            return (this.rulesTables = {
                ...this.getRulesGfm(),
                ...{
                    nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
                    table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/,
                },
            });
        }
        setRules() {
            if (this.options.gfm) {
                if (this.options.tables) {
                    this.rules = this.staticThis.getRulesTable();
                }
                else {
                    this.rules = this.staticThis.getRulesGfm();
                }
            }
            else {
                this.rules = this.staticThis.getRulesBase();
            }
            this.hasRulesGfm = this.rules.fences !== undefined;
            this.hasRulesTables = this.rules.table !== undefined;
        }
        /**
         * Lexing.
         */
        getTokens(src, top, isBlockQuote) {
            let nextPart = src;
            let execArr;
            mainLoop: while (nextPart) {
                // newline
                if ((execArr = this.rules.newline.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    if (execArr[0].length > 1) {
                        this.tokens.push({ type: TokenType.space });
                    }
                }
                // code
                if ((execArr = this.rules.code.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    const code = execArr[0].replace(/^ {4}/gm, "");
                    this.tokens.push({
                        type: TokenType.code,
                        text: !this.options.pedantic ? code.replace(/\n+$/, "") : code,
                    });
                    continue;
                }
                // fences code (gfm)
                if (this.hasRulesGfm &&
                    (execArr = this.rules.fences.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    this.tokens.push({
                        type: TokenType.code,
                        meta: execArr[2],
                        lang: execArr[3],
                        text: execArr[4] || "",
                    });
                    continue;
                }
                // heading
                if ((execArr = this.rules.heading.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    this.tokens.push({
                        type: TokenType.heading,
                        depth: execArr[1].length,
                        text: execArr[2],
                    });
                    continue;
                }
                // table no leading pipe (gfm)
                if (top &&
                    this.hasRulesTables &&
                    (execArr = this.rules.nptable.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    const item = {
                        type: TokenType.table,
                        header: execArr[1].replace(/^ *| *\| *$/g, "").split(/ *\| */),
                        align: execArr[2]
                            .replace(/^ *|\| *$/g, "")
                            .split(/ *\| */),
                        cells: [],
                    };
                    for (let i = 0; i < item.align.length; i++) {
                        if (/^ *-+: *$/.test(item.align[i])) {
                            item.align[i] = "right";
                        }
                        else if (/^ *:-+: *$/.test(item.align[i])) {
                            item.align[i] = "center";
                        }
                        else if (/^ *:-+ *$/.test(item.align[i])) {
                            item.align[i] = "left";
                        }
                        else {
                            item.align[i] = null;
                        }
                    }
                    const td = execArr[3].replace(/\n$/, "").split("\n");
                    for (let i = 0; i < td.length; i++) {
                        item.cells[i] = td[i].split(/ *\| */);
                    }
                    this.tokens.push(item);
                    continue;
                }
                // lheading
                if ((execArr = this.rules.lheading.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    this.tokens.push({
                        type: TokenType.heading,
                        depth: execArr[2] === "=" ? 1 : 2,
                        text: execArr[1],
                    });
                    continue;
                }
                // hr
                if ((execArr = this.rules.hr.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    this.tokens.push({ type: TokenType.hr });
                    continue;
                }
                // blockquote
                if ((execArr = this.rules.blockquote.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    this.tokens.push({ type: TokenType.blockquoteStart });
                    const str = execArr[0].replace(/^ *> ?/gm, "");
                    // Pass `top` to keep the current
                    // "toplevel" state. This is exactly
                    // how markdown.pl works.
                    this.getTokens(str);
                    this.tokens.push({ type: TokenType.blockquoteEnd });
                    continue;
                }
                // list
                if ((execArr = this.rules.list.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    const bull = execArr[2];
                    this.tokens.push({
                        type: TokenType.listStart,
                        ordered: bull.length > 1,
                    });
                    // Get each top-level item.
                    const str = execArr[0].match(this.rules.item);
                    const length = str.length;
                    let next = false;
                    let space;
                    let blockBullet;
                    let loose;
                    for (let i = 0; i < length; i++) {
                        let item = str[i];
                        // Remove the list item's bullet so it is seen as the next token.
                        space = item.length;
                        item = item.replace(/^ *([*+-]|\d+\.) +/, "");
                        // Outdent whatever the list item contains. Hacky.
                        if (item.indexOf("\n ") !== -1) {
                            space -= item.length;
                            item = !this.options.pedantic
                                ? item.replace(new RegExp("^ {1," + space + "}", "gm"), "")
                                : item.replace(/^ {1,4}/gm, "");
                        }
                        // Determine whether the next list item belongs here.
                        // Backpedal if it does not belong in this list.
                        if (this.options.smartLists && i !== length - 1) {
                            blockBullet = this.staticThis
                                .getRulesBase()
                                .bullet.exec(str[i + 1])[0];
                            if (bull !== blockBullet &&
                                !(bull.length > 1 && blockBullet.length > 1)) {
                                nextPart = str.slice(i + 1).join("\n") + nextPart;
                                i = length - 1;
                            }
                        }
                        // Determine whether item is loose or not.
                        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
                        // for discount behavior.
                        loose = next || /\n\n(?!\s*$)/.test(item);
                        if (i !== length - 1) {
                            next = item.charAt(item.length - 1) === "\n";
                            if (!loose) {
                                loose = next;
                            }
                        }
                        this.tokens.push({
                            type: loose ? TokenType.looseItemStart : TokenType.listItemStart,
                        });
                        // Recurse.
                        this.getTokens(item, false, isBlockQuote);
                        this.tokens.push({ type: TokenType.listItemEnd });
                    }
                    this.tokens.push({ type: TokenType.listEnd });
                    continue;
                }
                // html
                if ((execArr = this.rules.html.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    const attr = execArr[1];
                    const isPre = attr === "pre" || attr === "script" || attr === "style";
                    this.tokens.push({
                        type: this.options.sanitize ? TokenType.paragraph : TokenType.html,
                        pre: !this.options.sanitizer && isPre,
                        text: execArr[0],
                    });
                    continue;
                }
                // def
                if (top && (execArr = this.rules.def.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    this.links[execArr[1].toLowerCase()] = {
                        href: execArr[2],
                        title: execArr[3],
                    };
                    continue;
                }
                // table (gfm)
                if (top &&
                    this.hasRulesTables &&
                    (execArr = this.rules.table.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    const item = {
                        type: TokenType.table,
                        header: execArr[1].replace(/^ *| *\| *$/g, "").split(/ *\| */),
                        align: execArr[2]
                            .replace(/^ *|\| *$/g, "")
                            .split(/ *\| */),
                        cells: [],
                    };
                    for (let i = 0; i < item.align.length; i++) {
                        if (/^ *-+: *$/.test(item.align[i])) {
                            item.align[i] = "right";
                        }
                        else if (/^ *:-+: *$/.test(item.align[i])) {
                            item.align[i] = "center";
                        }
                        else if (/^ *:-+ *$/.test(item.align[i])) {
                            item.align[i] = "left";
                        }
                        else {
                            item.align[i] = null;
                        }
                    }
                    const td = execArr[3].replace(/(?: *\| *)?\n$/, "").split("\n");
                    for (let i = 0; i < td.length; i++) {
                        item.cells[i] = td[i].replace(/^ *\| *| *\| *$/g, "").split(/ *\| */);
                    }
                    this.tokens.push(item);
                    continue;
                }
                // simple rules
                if (this.staticThis.simpleRules.length) {
                    const simpleRules = this.staticThis.simpleRules;
                    for (let i = 0; i < simpleRules.length; i++) {
                        if ((execArr = simpleRules[i].exec(nextPart))) {
                            nextPart = nextPart.substring(execArr[0].length);
                            const type = "simpleRule" + (i + 1);
                            this.tokens.push({ type, execArr });
                            continue mainLoop;
                        }
                    }
                }
                // top-level paragraph
                if (top && (execArr = this.rules.paragraph.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    if (execArr[1].slice(-1) === "\n") {
                        this.tokens.push({
                            type: TokenType.paragraph,
                            text: execArr[1].slice(0, -1),
                        });
                    }
                    else {
                        this.tokens.push({
                            type: this.tokens.length > 0 ? TokenType.paragraph : TokenType.text,
                            text: execArr[1],
                        });
                    }
                    continue;
                }
                // text
                // Top-level should never reach here.
                if ((execArr = this.rules.text.exec(nextPart))) {
                    nextPart = nextPart.substring(execArr[0].length);
                    this.tokens.push({ type: TokenType.text, text: execArr[0] });
                    continue;
                }
                if (nextPart) {
                    throw new Error("Infinite loop on byte: " +
                        nextPart.charCodeAt(0) +
                        `, near text '${nextPart.slice(0, 30)}...'`);
                }
            }
            return { tokens: this.tokens, links: this.links };
        }
    }
    BlockLexer.simpleRules = [];
    BlockLexer.rulesBase = null;
    /**
     * GFM Block Grammar.
     */
    BlockLexer.rulesGfm = null;
    /**
     * GFM + Tables Block Grammar.
     */
    BlockLexer.rulesTables = null;

    class MarkdownService {
        static render(markdown) {
            return Marked.parse(markdown);
        }
    }

    /** Landing page: greeting, about me, featured projects and latest posts. */
    class HomeView {
        /** Show the home view. */
        static async show(_parameters, container) {
            setPageTitle();
            const page = createPage(HomeView.VIEW_ID);
            container.appendChild(page);
            try {
                const [profile, about, projects, posts] = await Promise.all([
                    ContentService.getProfile(),
                    ContentService.getAbout(),
                    ContentService.getProjects(),
                    ContentService.getPosts(),
                ]);
                page.appendChild(HomeView.createHero(profile.headline, profile.tagline));
                page.appendChild(HomeView.createAbout(about));
                page.appendChild(HomeView.createSection(getTexts().PROJECTS_TITLE, "#/projects", createProjectList(takeFeatured(projects, HomeView.PREVIEW_LIMIT))));
                page.appendChild(HomeView.createSection(getTexts().LATEST_POSTS_TITLE, "#/blog", createPostList(posts.slice(0, HomeView.PREVIEW_LIMIT))));
            }
            catch (error) {
                page.appendChild(createErrorState(getTexts().LOAD_ERROR, error));
            }
        }
        /** Create the big greeting at the top of the page. */
        static createHero(headline, tagline) {
            const hero = createTextElement("header", "", ["hero"]);
            hero.appendChild(createTextElement("h1", headline, ["hero-title"]));
            hero.appendChild(createTextElement("p", tagline, ["hero-tagline"]));
            return hero;
        }
        /** Create the "about me" section from its markdown. */
        static createAbout(markdown) {
            const section = createTextElement("section", "", ["home-section"]);
            section.appendChild(createSectionHeader(getTexts().ABOUT_TITLE));
            const body = createTextElement("div", "", ["markdown"]);
            body.innerHTML = MarkdownService.render(markdown);
            section.appendChild(body);
            return section;
        }
        /** Create a preview section with a "see all" link. */
        static createSection(title, href, content) {
            const section = createTextElement("section", "", ["home-section"]);
            section.appendChild(createSectionHeader(title, { text: getTexts().SEE_ALL, href }));
            section.appendChild(content);
            return section;
        }
    }
    HomeView.VIEW_ID = "home";
    HomeView.PREVIEW_LIMIT = 3;

    /** Page shown when no route matches. */
    class NotFoundView {
        /** Show the not found view. */
        static async show(_parameters, container) {
            setPageTitle(getTexts().NOT_FOUND_TITLE);
            const page = createPage(NotFoundView.VIEW_ID);
            page.appendChild(createPageHeader(getTexts().NOT_FOUND_TITLE, getTexts().NOT_FOUND_TEXT));
            page.appendChild(createLink(getTexts().NOT_FOUND_LINK, "#/", ["back-link"]));
            container.appendChild(page);
        }
    }
    NotFoundView.VIEW_ID = "not-found";

    /** Page showing a single post. Expects the post slug as the first route parameter. */
    class PostView {
        /** Show the post view, or the not found view when the slug is unknown. */
        static async show(parameters, container) {
            const page = createPage(PostView.VIEW_ID);
            container.appendChild(page);
            try {
                const post = findPostBySlug(await ContentService.getPosts(), parameters[0] ?? "");
                if (!post) {
                    page.remove();
                    await NotFoundView.show([], container);
                    return;
                }
                setPageTitle(post.title);
                const body = await ContentService.getPostBody(post);
                page.appendChild(createLink(getTexts().BACK_TO_BLOG, "#/blog", ["back-link"]));
                page.appendChild(PostView.createHeader(post.title, post.date));
                const article = createTextElement("article", "", ["markdown"]);
                article.innerHTML = MarkdownService.render(body);
                page.appendChild(article);
            }
            catch (error) {
                page.appendChild(createErrorState(getTexts().LOAD_ERROR, error));
            }
        }
        /** Create the post title and date. */
        static createHeader(title, isoDate) {
            const header = createTextElement("header", "", ["page-header"]);
            header.appendChild(createTextElement("h1", title));
            const date = createTextElement("time", formatPostDate(isoDate, getTexts().LOCALE), ["page-intro"]);
            date.setAttribute("datetime", isoDate);
            header.appendChild(date);
            return header;
        }
    }
    PostView.VIEW_ID = "post";

    /** Page listing every project. */
    class ProjectsView {
        /** Show the projects view. */
        static async show(_parameters, container) {
            setPageTitle(getTexts().PROJECTS_TITLE);
            const page = createPage(ProjectsView.VIEW_ID);
            page.appendChild(createPageHeader(getTexts().PROJECTS_TITLE, getTexts().PROJECTS_INTRO));
            container.appendChild(page);
            try {
                page.appendChild(createProjectList(await ContentService.getProjects()));
            }
            catch (error) {
                page.appendChild(createErrorState(getTexts().LOAD_ERROR, error));
            }
        }
    }
    ProjectsView.VIEW_ID = "projects";

    let layout;
    window.addEventListener("hashchange", renderCurrentRoute);
    window.onresize = () => Display.checkType();
    window.onload = async function () {
        await loadConfiguration("gtdf.config.json");
        Theme.init();
        LanguageService.init();
        Display.checkType();
        const iconsPath = getConfiguration("path")["icons"];
        await Promise.all([
            loadIcons("material", `${iconsPath}/materialicons.json`),
            loadIcons("social", `${iconsPath}/socialicons.json`),
        ]);
        registerRoutes();
        layout = mountLayout(getConfiguration("base")["app_name"]);
        renderCurrentRoute();
        // Rebuild the shell and the current view in the new language, keeping the route
        connectToSignal(LANGUAGE_CHANGED_SIGNAL, async () => {
            layout = mountLayout(getConfiguration("base")["app_name"]);
            renderCurrentRoute();
        });
    };
    /** Register every view with its route. */
    function registerRoutes() {
        setRoute("", HomeView.show);
        setRoute("projects", ProjectsView.show);
        setRoute("blog", BlogView.show);
        setRoute("blog/$", PostView.show);
        setNotFoundRoute(NotFoundView.show);
    }
    /** Build the page shell once; the footer socials fill in when the profile loads. */
    function mountLayout(siteName) {
        const navbar = Navbar.create(siteName);
        const main = document.createElement("main");
        main.classList.add("content");
        const footer = Footer.create(siteName);
        document.body.replaceChildren(navbar, main, footer);
        // Without a profile the footer keeps just the copyright line; views show their own error
        ContentService.getProfile()
            .then(profile => Footer.setSocials(footer, profile.socials))
            .catch(error => console.error(error));
        return { navbar, main };
    }
    /** Show the view for the current URL hash, e.g. "#/blog/my-post" -> "blog/my-post". */
    function renderCurrentRoute() {
        if (!layout)
            return;
        const path = window.location.hash.replace(/^#\/?/, "").replace(/\/$/, "").toLowerCase();
        Navbar.highlight(layout.navbar, path);
        showRoute(path, layout.main);
        window.scrollTo(0, 0);
    }

})();

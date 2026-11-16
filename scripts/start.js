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
    /** Return the setup groups that have at least one item, keeping their order. */
    function filterNonEmptyGroups(groups) {
        return groups.filter(group => group.items.length > 0);
    }
    /** Return the tree branch drawn before a setup row: none for the root (first) row, a corner for the last one. */
    function getTreeBranch(index, count) {
        if (index == 0)
            return "";
        return index == count - 1 ? "└─" : "├─";
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
        /** Load the computer setup groups, skipping the empty ones. */
        static async getSetup() {
            return filterNonEmptyGroups(JSON.parse(await ContentService.fetchText("setup.json")));
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
        NAV_SETUP: "Setup",
        NAV_CURIOSITIES: "Curiosidades",
        NAV_LABEL: "Principal",
        TOGGLE_THEME: "Cambiar tema",
        LANGUAGE_LABEL: "Idioma",
        ABOUT_TITLE: "Sobre mí",
        SETUP_TITLE: "Mi setup",
        SETUP_INTRO: "El ordenador y las herramientas con las que trabajo cada día.",
        SETUP_LINK: "Ver mi setup →",
        CURIOSITIES_TITLE: "Curiosidades",
        CURIOSITIES_INTRO: "Pequeños experimentos con los que jugar directamente en la página.",
        COLLATZ_TITLE: "Conjetura de Collatz",
        COLLATZ_DESCRIPTION: "Elige un número. Si es par, divídelo entre 2; si es impar, multiplícalo por 3 y suma 1. Repite. La conjetura dice que siempre acabarás en 1, pero nadie lo ha demostrado.",
        COLLATZ_NUMBER_LABEL: "Número inicial",
        COLLATZ_RUN: "Calcular",
        COLLATZ_EXAMPLES: "Prueba con:",
        COLLATZ_STEPS: "pasos",
        COLLATZ_PEAK: "valor máximo",
        COLLATZ_CHART_LABEL: "Trayectoria de {n} hasta 1",
        COLLATZ_RANGE_LABEL: "Comprobar todos hasta",
        COLLATZ_VERIFY: "Comprobar",
        COLLATZ_VERIFIED: "✓ Los {checked} números llegan a 1. El que más tarda es el {n}, con {steps} pasos.",
        INPUT_EMPTY: "Escribe un número.",
        INPUT_NOT_INTEGER: "Tiene que ser un número entero.",
        INPUT_OUT_OF_RANGE: "Tiene que estar entre {min} y {max}.",
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
        GAME_OPEN: "Abrir minijuego",
        GAME_TITLE: "forge — terminal",
        GAME_HELP: "Escribe cada comando tal cual. Tienes 30 segundos y el tiempo empieza con la primera tecla.",
        GAME_INPUT_LABEL: "Escribe el comando",
        GAME_CLOSE: "Cerrar",
        GAME_SCORE: "puntos",
        GAME_WPM: "ppm",
        GAME_BEST: "récord",
        GAME_NEXT: "siguiente",
        GAME_OVER: "¡Tiempo!",
        GAME_NEW_BEST: "¡Nuevo récord!",
        GAME_RESTART: "Pulsa Enter para jugar otra vez · Esc para salir",
    };
    const EN = {
        LOCALE: "en-US",
        NAV_HOME: "Home",
        NAV_PROJECTS: "Projects",
        NAV_BLOG: "Blog",
        NAV_SETUP: "Setup",
        NAV_CURIOSITIES: "Curiosities",
        NAV_LABEL: "Main",
        TOGGLE_THEME: "Toggle theme",
        LANGUAGE_LABEL: "Language",
        ABOUT_TITLE: "About me",
        SETUP_TITLE: "My setup",
        SETUP_INTRO: "The computer and tools I work with every day.",
        SETUP_LINK: "See my setup →",
        CURIOSITIES_TITLE: "Curiosities",
        CURIOSITIES_INTRO: "Small experiments to play with right here on the page.",
        COLLATZ_TITLE: "Collatz conjecture",
        COLLATZ_DESCRIPTION: "Pick a number. If it is even, halve it; if it is odd, triple it and add 1. Repeat. The conjecture says you always end up at 1, but nobody has proved it.",
        COLLATZ_NUMBER_LABEL: "Starting number",
        COLLATZ_RUN: "Run",
        COLLATZ_EXAMPLES: "Try:",
        COLLATZ_STEPS: "steps",
        COLLATZ_PEAK: "peak",
        COLLATZ_CHART_LABEL: "Trajectory from {n} down to 1",
        COLLATZ_RANGE_LABEL: "Check every number up to",
        COLLATZ_VERIFY: "Check",
        COLLATZ_VERIFIED: "✓ All {checked} numbers reach 1. The slowest is {n}, with {steps} steps.",
        INPUT_EMPTY: "Type a number.",
        INPUT_NOT_INTEGER: "It must be a whole number.",
        INPUT_OUT_OF_RANGE: "It must be between {min} and {max}.",
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
        GAME_OPEN: "Open minigame",
        GAME_TITLE: "forge — terminal",
        GAME_HELP: "Type each command exactly. You have 30 seconds, and the clock starts with your first keystroke.",
        GAME_INPUT_LABEL: "Type the command",
        GAME_CLOSE: "Close",
        GAME_SCORE: "score",
        GAME_WPM: "wpm",
        GAME_BEST: "best",
        GAME_NEXT: "next",
        GAME_OVER: "Time's up!",
        GAME_NEW_BEST: "New best score!",
        GAME_RESTART: "Press Enter to play again · Esc to quit",
    };
    const TEXTS_BY_LANGUAGE = { es: ES, en: EN };
    /** The interface texts in the current language. */
    function getTexts() {
        return TEXTS_BY_LANGUAGE[LanguageService.get()];
    }
    /** Replace each {key} placeholder of a text with its value. */
    function fillText(text, values) {
        return text.replace(/\{(\w+)\}/g, (placeholder, key) => values[key] ?? placeholder);
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

    /** Shell commands the player has to type. */
    const COMMANDS = [
        "git push",
        "git status",
        "git commit -m \"fix\"",
        "git pull --rebase",
        "npm run build",
        "npm test",
        "npm install",
        "ls -la",
        "cd ~/forge",
        "mkdir anvil",
        "cat README.md",
        "grep -r TODO src",
        "tsc --watch",
        "docker compose up",
        "ssh forge@anvil",
        "chmod +x bin/lit",
        "echo \"hello\"",
        "rm -rf node_modules",
    ];
    /** Compare the typed text with the target command. */
    function compareInput(target, typed) {
        let correct = 0;
        while (correct < typed.length && typed[correct] == target[correct])
            correct++;
        const hasError = correct < typed.length;
        return { correct, hasError, complete: !hasError && typed.length == target.length };
    }
    /** Words per minute, counting five characters as one word. */
    function calculateWpm(correctChars, elapsedMs) {
        if (elapsedMs <= 0)
            return 0;
        return Math.round((correctChars / 5) / (elapsedMs / 60_000));
    }
    /** Pick a random command different from the previous one, when there is more than one. */
    function pickNextCommand(commands, previous, random) {
        if (commands.length == 0)
            throw new Error("pickNextCommand needs at least one command");
        const candidates = commands.length > 1 ? commands.filter(command => command != previous) : commands;
        return candidates[Math.floor(random() * candidates.length)];
    }

    const BEST_STORAGE_KEY = "softwareanvil-typing-best";
    /** Remembers the visitor's best score in the typing game. */
    class GameScoreService {
        /** Read the best score, or 0 when storage is blocked or empty. */
        static readBest() {
            try {
                return Number(localStorage.getItem(BEST_STORAGE_KEY)) || 0;
            }
            catch {
                // Storage blocked (private mode): the best score lasts only for this visit
                return 0;
            }
        }
        /** Save the best score, ignoring storage that is blocked. */
        static storeBest(score) {
            try {
                localStorage.setItem(BEST_STORAGE_KEY, String(score));
            }
            catch {
                // Storage blocked (private mode): the best score lasts only for this visit
            }
        }
    }

    /** Build the terminal-styled game dialog. */
    function buildGameDialog(texts) {
        const dialog = document.createElement("dialog");
        dialog.classList.add("game");
        dialog.setAttribute("aria-label", texts.GAME_TITLE);
        const titlebar = createTextElement("div", "", ["game-titlebar"]);
        titlebar.appendChild(createTextElement("span", texts.GAME_TITLE, ["game-title"]));
        const close = createTextElement("button", "✕", ["game-close"]);
        close.setAttribute("aria-label", texts.GAME_CLOSE);
        titlebar.appendChild(close);
        const body = createTextElement("div", "", ["game-body"]);
        body.appendChild(createTextElement("p", texts.GAME_HELP, ["game-help"]));
        const line = createTextElement("div", "", ["game-line"]);
        line.appendChild(createTextElement("span", "~/forge $", ["game-prompt"]));
        const target = createTextElement("span", "", ["game-target"]);
        target.setAttribute("aria-live", "polite");
        line.appendChild(target);
        body.appendChild(line);
        const input = document.createElement("input");
        input.classList.add("game-input");
        input.setAttribute("aria-label", texts.GAME_INPUT_LABEL);
        for (const [name, value] of Object.entries({ autocomplete: "off", autocapitalize: "off", autocorrect: "off", spellcheck: "false" })) {
            input.setAttribute(name, value);
        }
        body.appendChild(input);
        const timebar = createTextElement("div", "", ["game-timebar"]);
        const timeFill = createTextElement("div", "", ["game-timebar-fill"]);
        timebar.appendChild(timeFill);
        body.appendChild(timebar);
        const stats = createTextElement("p", "", ["game-stats"]);
        const next = createTextElement("p", "", ["game-next"]);
        const result = createTextElement("div", "", ["game-result"]);
        result.setAttribute("role", "status");
        body.append(stats, next, result);
        const frame = createTextElement("div", "", ["game-window"]);
        frame.append(titlebar, body);
        dialog.appendChild(frame);
        return { dialog, input, close, target, timeFill, stats, next, result };
    }
    /** Paint the target command: typed-correct, typed-wrong, pending, and the cursor position. */
    function renderTarget(element, target, typed) {
        const { correct } = compareInput(target, typed);
        const wrongEnd = Math.min(typed.length, target.length);
        const parts = [
            createTextElement("span", target.slice(0, correct), ["game-char-ok"]),
            createTextElement("span", target.slice(correct, wrongEnd), ["game-char-error"]),
            createTextElement("span", target.slice(wrongEnd), ["game-char-pending"]),
        ];
        // The cursor sits before the first pending character
        parts[2].classList.add("game-cursor");
        element.replaceChildren(...parts);
    }
    /** Update the score, words per minute, best score and next command. */
    function renderStats(elements, stats, texts) {
        elements.stats.textContent = `${texts.GAME_SCORE} ${stats.score} · ${texts.GAME_WPM} ${stats.wpm} · ${texts.GAME_BEST} ${stats.best}`;
        elements.next.textContent = `${texts.GAME_NEXT}: ${stats.next}`;
    }
    /** Set how much of the time bar is left, from 1 (full) to 0 (empty). */
    function renderTime(elements, remaining) {
        elements.timeFill.style.transform = `scaleX(${Math.max(0, remaining)})`;
    }
    /** Show the end-of-run summary, or hide it when `summary` is undefined. */
    function renderResult(elements, texts, summary) {
        if (!summary) {
            elements.result.replaceChildren();
            return;
        }
        const title = summary.isNewBest ? texts.GAME_NEW_BEST : texts.GAME_OVER;
        elements.result.replaceChildren(createTextElement("p", title, ["game-result-title"]), createTextElement("p", `${texts.GAME_SCORE} ${summary.score} · ${texts.GAME_WPM} ${summary.wpm}`), createTextElement("p", texts.GAME_RESTART, ["game-result-hint"]));
    }

    const RUN_DURATION_MS = 30_000;
    const TICK_MS = 100;
    // Below this, WPM swings wildly (a few characters over a few milliseconds), so it shows 0
    const MIN_WPM_ELAPSED_MS = 3_000;
    /** Hidden terminal typing game: type as many shell commands as possible in 30 seconds. */
    class TypingGame {
        /** Open the game, unless it is already open. Focus returns to `trigger` on close. */
        static open(trigger) {
            if (TypingGame.active)
                return;
            TypingGame.active = new TypingGame(trigger);
        }
        constructor(trigger) {
            this.trigger = trigger;
            this.texts = getTexts();
            this.elements = buildGameDialog(this.texts);
            this.target = "";
            this.next = "";
            this.score = 0;
            this.correctChars = 0;
            this.best = GameScoreService.readBest();
            this.finished = false;
            const { dialog, input, close } = this.elements;
            input.addEventListener("input", () => this.handleInput());
            input.addEventListener("keydown", event => this.handleKeydown(event));
            close.addEventListener("click", () => dialog.close());
            dialog.addEventListener("click", () => input.focus());
            dialog.addEventListener("close", () => this.destroy());
            document.body.appendChild(dialog);
            dialog.showModal();
            this.reset();
        }
        // ---- Run lifecycle ----
        /** Prepare a fresh run; the clock starts with the first keystroke. */
        reset() {
            this.stopTimer();
            this.score = 0;
            this.correctChars = 0;
            this.startedAt = undefined;
            this.finished = false;
            this.target = pickNextCommand(COMMANDS, undefined, Math.random);
            this.next = pickNextCommand(COMMANDS, this.target, Math.random);
            this.elements.input.value = "";
            renderResult(this.elements, this.texts);
            renderTime(this.elements, 1);
            this.render();
            this.elements.input.focus();
        }
        /** Start the countdown. */
        start() {
            this.startedAt = performance.now();
            this.timer = window.setInterval(() => this.tick(), TICK_MS);
        }
        /** Update the time bar and end the run when time is up. */
        tick() {
            const remaining = 1 - this.elapsed() / RUN_DURATION_MS;
            renderTime(this.elements, remaining);
            this.render();
            if (remaining <= 0)
                this.finish();
        }
        /** Stop the run and show the summary, saving a new best score. */
        finish() {
            this.stopTimer();
            this.finished = true;
            const isNewBest = this.score > this.best;
            if (isNewBest) {
                this.best = this.score;
                GameScoreService.storeBest(this.score);
            }
            renderResult(this.elements, this.texts, { score: this.score, wpm: this.wpm(), isNewBest });
            this.render();
        }
        /** Stop the timer and forget this game, returning focus to the trigger. */
        destroy() {
            this.stopTimer();
            this.elements.dialog.remove();
            TypingGame.active = undefined;
            this.trigger.focus();
        }
        // ---- Input ----
        /** Check the typed text, starting the run on the first keystroke. */
        handleInput() {
            const { input } = this.elements;
            if (this.finished) {
                input.value = "";
                return;
            }
            if (this.startedAt === undefined)
                this.start();
            if (compareInput(this.target, input.value).complete)
                this.advance();
            this.render();
        }
        /** Enter restarts a finished run. Esc is handled by the dialog itself. */
        handleKeydown(event) {
            if (event.key != "Enter" || !this.finished)
                return;
            event.preventDefault();
            this.reset();
        }
        /** Score the completed command and move on to the next one. */
        advance() {
            this.score++;
            this.correctChars += this.target.length;
            this.target = this.next;
            this.next = pickNextCommand(COMMANDS, this.target, Math.random);
            this.elements.input.value = "";
        }
        // ---- Helpers ----
        /** Repaint the target command and stats. */
        render() {
            renderTarget(this.elements.target, this.target, this.elements.input.value);
            renderStats(this.elements, { score: this.score, wpm: this.wpm(), best: this.best, next: this.next }, this.texts);
        }
        /** Words per minute so far, counting completed commands and the current correct prefix. */
        wpm() {
            if (this.elapsed() < MIN_WPM_ELAPSED_MS)
                return 0;
            const current = compareInput(this.target, this.elements.input.value).correct;
            return calculateWpm(this.correctChars + current, this.elapsed());
        }
        /** Milliseconds since the run started, capped at the run length. */
        elapsed() {
            if (this.startedAt === undefined)
                return 0;
            return Math.min(performance.now() - this.startedAt, RUN_DURATION_MS);
        }
        /** Clear the countdown timer, if any. */
        stopTimer() {
            window.clearInterval(this.timer);
            this.timer = undefined;
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
                { text: texts.NAV_SETUP, section: "setup" },
                { text: texts.NAV_CURIOSITIES, section: "curiosities" },
            ];
            const header = createTextElement("header", "", ["navbar"]);
            const inner = createTextElement("div", "", ["navbar-inner"]);
            inner.appendChild(Navbar.createBrand(siteName));
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
        /** Create the site name linking home, followed by the "_" cursor that opens the hidden game. */
        static createBrand(siteName) {
            const brand = createTextElement("div", "", ["navbar-brand"]);
            brand.appendChild(createLink(siteName, "#/", ["navbar-brand-link"]));
            const cursor = createTextElement("button", "_", ["navbar-cursor"]);
            cursor.setAttribute("aria-label", getTexts().GAME_OPEN);
            cursor.title = getTexts().GAME_OPEN;
            cursor.addEventListener("click", () => TypingGame.open(cursor));
            brand.appendChild(cursor);
            return brand;
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
            section.appendChild(createLink(getTexts().SETUP_LINK, "#/setup", ["section-link", "about-setup-link"]));
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

    const ICON_SIZE = "16px";
    /** Create a terminal window that lists the setup groups like fastfetch: logo on the left, boxed trees on the right. */
    function createFetchPanel(groups) {
        const panel = createTextElement("div", "", ["fetch"]);
        panel.appendChild(createTitleBar());
        const body = createTextElement("div", "", ["fetch-body"]);
        body.appendChild(createLogo());
        const boxes = createTextElement("div", "", ["fetch-boxes"]);
        groups.forEach(group => boxes.appendChild(createGroupBox(group)));
        body.appendChild(boxes);
        panel.appendChild(body);
        return panel;
    }
    /** Create the window bar with the command that "produced" the output. */
    function createTitleBar() {
        const bar = createTextElement("div", "", ["fetch-titlebar"]);
        bar.appendChild(createTextElement("span", "~ $ fastfetch", ["fetch-command"]));
        return bar;
    }
    /** Create the site logo shown next to the boxes; decorative, so screen readers skip it. */
    function createLogo() {
        const logo = document.createElement("img");
        logo.src = `${getConfiguration("path")["icons"]}/logo.svg`;
        logo.alt = "";
        logo.classList.add("fetch-logo");
        return logo;
    }
    /** Create one boxed group with its title on the top border and its rows drawn as a tree. */
    function createGroupBox(group) {
        const box = createTextElement("section", "", ["fetch-box"]);
        box.appendChild(createTextElement("h2", group.title, ["fetch-box-title"]));
        const list = createTextElement("ul", "", ["fetch-rows"]);
        group.items.forEach((item, index) => list.appendChild(createRow(item, getTreeBranch(index, group.items.length))));
        box.appendChild(list);
        return box;
    }
    /** Create one row: tree branch, icon, value and what it is in parentheses. */
    function createRow(item, branch) {
        const row = createTextElement("li", "", branch ? ["fetch-row"] : ["fetch-row", "fetch-row-root"]);
        if (branch)
            row.appendChild(createTextElement("span", branch, ["fetch-branch"]));
        const icon = item.icon ? getIcon("material", item.icon, ICON_SIZE, "currentColor") : undefined;
        if (icon) {
            icon.classList.add("fetch-icon");
            row.appendChild(icon);
        }
        const text = createTextElement("span", item.value, ["fetch-value"]);
        text.appendChild(createTextElement("span", ` (${item.label})`, ["fetch-label"]));
        row.appendChild(text);
        return row;
    }

    /** Page showing the computer setup as a fastfetch-style terminal panel. */
    class SetupView {
        /** Show the setup view. */
        static async show(_parameters, container) {
            setPageTitle(getTexts().SETUP_TITLE);
            const page = createPage(SetupView.VIEW_ID);
            page.appendChild(createPageHeader(getTexts().SETUP_TITLE, getTexts().SETUP_INTRO));
            container.appendChild(page);
            try {
                page.appendChild(createFetchPanel(await ContentService.getSetup()));
            }
            catch (error) {
                page.appendChild(createErrorState(getTexts().LOAD_ERROR, error));
            }
        }
    }
    SetupView.VIEW_ID = "setup";

    /** Safety cap: every start below 10^6 reaches 1 in fewer than 600 steps. */
    const DEFAULT_MAX_STEPS = 10_000;
    /** The next Collatz term: half of an even number, 3n + 1 of an odd one. */
    function nextTerm(value) {
        return value % 2 == 0 ? value / 2 : 3 * value + 1;
    }
    /** Every term from n down to 1, both included. */
    function collatzSequence(n, maxSteps = DEFAULT_MAX_STEPS) {
        const sequence = [n];
        let value = n;
        while (value != 1) {
            if (sequence.length > maxSteps)
                throw new Error(`Collatz sequence of ${n} did not reach 1 within ${maxSteps} steps`);
            value = nextTerm(value);
            sequence.push(value);
        }
        return sequence;
    }
    /** Count the steps of a sequence and find its peak. */
    function summarizeSequence(sequence) {
        return { steps: sequence.length - 1, peak: Math.max(...sequence) };
    }
    /** Check every start from 1 to limit, reusing the step counts of smaller numbers already solved. */
    function verifyRange(limit, maxSteps = DEFAULT_MAX_STEPS) {
        const stepsByStart = new Uint16Array(limit + 1);
        const longest = { n: 1, steps: 0 };
        for (let start = 2; start <= limit; start++) {
            let value = start;
            let steps = 0;
            // Walk until falling below the start, where the remaining steps are already known
            while (value >= start) {
                if (steps > maxSteps)
                    throw new Error(`Collatz sequence of ${start} did not reach 1 within ${maxSteps} steps`);
                value = nextTerm(value);
                steps++;
            }
            stepsByStart[start] = steps + stepsByStart[value];
            if (stepsByStart[start] > longest.steps) {
                longest.n = start;
                longest.steps = stepsByStart[start];
            }
        }
        return { checked: limit, longest };
    }
    /** Keep the first and last `edge` terms of a long sequence, with null marking the gap between them. */
    function previewSequence(sequence, edge) {
        if (sequence.length <= edge * 2 + 1)
            return sequence;
        return [...sequence.slice(0, edge), null, ...sequence.slice(-edge)];
    }

    const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
    const WIDTH = 600;
    const HEIGHT = 160;
    const PADDING = 6;
    /** Create a minimal SVG line chart of the values in order: index on X, value on Y, scaled to fit. */
    function createLineChart(values, label) {
        const svg = document.createElementNS(SVG_NAMESPACE, "svg");
        svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", label);
        svg.classList.add("line-chart");
        const line = document.createElementNS(SVG_NAMESPACE, "polyline");
        line.setAttribute("points", toPoints(values).join(" "));
        line.setAttribute("vector-effect", "non-scaling-stroke");
        line.classList.add("line-chart-line");
        svg.appendChild(line);
        return svg;
    }
    /** Map each value to "x,y" inside the padded drawing area; y grows downwards in SVG. */
    function toPoints(values) {
        const min = Math.min(...values);
        const range = Math.max(...values) - min || 1;
        const stepX = (WIDTH - PADDING * 2) / Math.max(values.length - 1, 1);
        return values.map((value, index) => {
            const x = PADDING + index * stepX;
            const y = HEIGHT - PADDING - ((value - min) / range) * (HEIGHT - PADDING * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
    }

    /** Read a whole number written in plain digits that must lie within [min, max]. */
    function parseBoundedInteger(input, min, max) {
        const text = input.trim();
        if (!text)
            return { error: "empty" };
        if (!/^-?\d+$/.test(text))
            return { error: "not-integer" };
        const value = Number(text);
        if (value < min || value > max)
            return { error: "out-of-range" };
        return value;
    }
    /** Tell apart a parsed number from an input error. */
    function isInputError(result) {
        return typeof result != "number";
    }

    /** Create an inline form that validates a bounded integer and reports errors under the field. */
    function createNumberForm(options) {
        const form = document.createElement("form");
        form.classList.add("number-form");
        form.noValidate = true;
        const label = createTextElement("label", options.label, ["number-form-label"]);
        const input = document.createElement("input");
        input.type = "text";
        input.inputMode = "numeric";
        input.value = String(options.initial);
        input.classList.add("number-form-input");
        label.appendChild(input);
        const button = createTextElement("button", options.button, ["number-form-button"]);
        button.setAttribute("type", "submit");
        const error = createTextElement("p", "", ["number-form-error"]);
        error.setAttribute("role", "alert");
        error.hidden = true;
        form.append(label, button, error);
        form.addEventListener("submit", event => {
            event.preventDefault();
            const result = parseBoundedInteger(input.value, options.min, options.max);
            error.hidden = !isInputError(result);
            input.setAttribute("aria-invalid", String(isInputError(result)));
            if (isInputError(result)) {
                error.textContent = describeInputError(result, options.min, options.max);
                return;
            }
            options.onSubmit(result);
        });
        const submitValue = (value) => {
            input.value = String(value);
            form.requestSubmit();
        };
        return { element: form, submitValue };
    }
    /** Turn an input error into a message in the current language. */
    function describeInputError(result, min, max) {
        const texts = getTexts();
        switch (result.error) {
            case "empty": return texts.INPUT_EMPTY;
            case "not-integer": return texts.INPUT_NOT_INTEGER;
            case "out-of-range": return fillText(texts.INPUT_OUT_OF_RANGE, {
                min: min.toLocaleString(texts.LOCALE),
                max: max.toLocaleString(texts.LOCALE),
            });
        }
    }

    const MAX_START = 1_000_000;
    const MAX_RANGE = 100_000;
    const PREVIEW_EDGE = 12;
    const EXAMPLES = [27, 97, 871];
    /** Interactive card that walks a Collatz sequence and checks the conjecture over a range. */
    function createCollatzCard() {
        const texts = getTexts();
        const card = createTextElement("article", "", ["curiosity"]);
        card.appendChild(createTextElement("h2", texts.COLLATZ_TITLE, ["curiosity-title"]));
        card.appendChild(createTextElement("p", texts.COLLATZ_DESCRIPTION, ["curiosity-description"]));
        const sequenceResult = createTextElement("div", "", ["collatz-result"]);
        sequenceResult.setAttribute("aria-live", "polite");
        const sequenceForm = createNumberForm({
            label: texts.COLLATZ_NUMBER_LABEL,
            button: texts.COLLATZ_RUN,
            min: 1,
            max: MAX_START,
            initial: EXAMPLES[0],
            onSubmit: start => sequenceResult.replaceChildren(...createSequenceResult(start)),
        });
        card.append(sequenceForm.element, createExamples(sequenceForm.submitValue), sequenceResult);
        const rangeResult = createTextElement("p", "", ["collatz-range-result"]);
        rangeResult.setAttribute("aria-live", "polite");
        const rangeForm = createNumberForm({
            label: texts.COLLATZ_RANGE_LABEL,
            button: texts.COLLATZ_VERIFY,
            min: 1,
            max: MAX_RANGE,
            initial: 10_000,
            onSubmit: limit => rangeResult.textContent = describeRange(limit),
        });
        card.append(rangeForm.element, rangeResult);
        // The form is still detached here, so render the first example directly instead of submitting it
        sequenceResult.replaceChildren(...createSequenceResult(EXAMPLES[0]));
        return card;
    }
    /** Create the "Try: 27 97 871" row of buttons that run an example start. */
    function createExamples(run) {
        const row = createTextElement("div", "", ["collatz-examples"]);
        row.appendChild(createTextElement("span", getTexts().COLLATZ_EXAMPLES));
        EXAMPLES.forEach(example => {
            const button = createTextElement("button", String(example), ["collatz-example"]);
            button.setAttribute("type", "button");
            button.addEventListener("click", () => run(example));
            row.appendChild(button);
        });
        return row;
    }
    /** Create the stats, the shortened sequence and the trajectory chart for one start. */
    function createSequenceResult(start) {
        const texts = getTexts();
        const sequence = collatzSequence(start);
        const summary = summarizeSequence(sequence);
        const stats = createTextElement("p", "", ["collatz-stats"]);
        stats.append(createStat(summary.steps, texts.COLLATZ_STEPS), createStat(summary.peak, texts.COLLATZ_PEAK));
        const terms = previewSequence(sequence, PREVIEW_EDGE).map(term => term == null ? "…" : formatNumber(term));
        const preview = createTextElement("p", terms.join(" → "), ["collatz-sequence"]);
        const chart = createLineChart(sequence, fillText(texts.COLLATZ_CHART_LABEL, { n: formatNumber(start) }));
        return [stats, preview, chart];
    }
    /** Create one big number with its caption. */
    function createStat(value, caption) {
        const stat = createTextElement("span", "", ["collatz-stat"]);
        stat.append(createTextElement("strong", formatNumber(value), ["collatz-stat-value"]), createTextElement("span", caption, ["collatz-stat-caption"]));
        return stat;
    }
    /** Check every start up to limit and describe the outcome. */
    function describeRange(limit) {
        const result = verifyRange(limit);
        return fillText(getTexts().COLLATZ_VERIFIED, {
            checked: formatNumber(result.checked),
            n: formatNumber(result.longest.n),
            steps: formatNumber(result.longest.steps),
        });
    }
    /** Format a number with the digit grouping of the current language. */
    function formatNumber(value) {
        return value.toLocaleString(getTexts().LOCALE);
    }

    /** Every curiosity card, in the order they appear; add new ones here. */
    const CURIOSITIES = [createCollatzCard];
    /** Page with small interactive experiments embedded in the site. */
    class CuriositiesView {
        /** Show the curiosities view. */
        static async show(_parameters, container) {
            setPageTitle(getTexts().CURIOSITIES_TITLE);
            const page = createPage(CuriositiesView.VIEW_ID);
            page.appendChild(createPageHeader(getTexts().CURIOSITIES_TITLE, getTexts().CURIOSITIES_INTRO));
            CURIOSITIES.forEach(createCard => page.appendChild(createCard()));
            container.appendChild(page);
        }
    }
    CuriositiesView.VIEW_ID = "curiosities";

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
        setRoute("setup", SetupView.show);
        setRoute("curiosities", CuriositiesView.show);
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

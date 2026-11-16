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
        BACK_TO_CURIOSITIES: "← Volver a curiosidades",
        CATEGORY_MATH: "Matemáticas",
        CURIOSITY_TRY: "Probar →",
        CATEGORY_PHYSICS: "Física",
        CATEGORY_PROGRAMMING: "Programación",
        PRIMES_TITLE: "Números primos",
        PRIMES_SUMMARY: "Tacha múltiplos con la criba de Eratóstenes y descubre las diagonales de la espiral de Ulam.",
        PRIMES_DESCRIPTION: "Un primo solo es divisible entre 1 y entre sí mismo. Parecen repartirse al azar, pero esconden patrones que todavía no entendemos del todo.",
        SIEVE_TITLE: "Criba de Eratóstenes",
        SIEVE_INTRO: "Un método de hace más de 2.000 años: cada primo tacha sus múltiplos, y lo que queda sin tachar son primos.",
        SIEVE_NEXT: "Siguiente paso",
        SIEVE_PLAY: "Reproducir",
        SIEVE_PAUSE: "Pausa",
        SIEVE_RESET: "Reiniciar",
        SIEVE_START: "Pulsa «Siguiente paso» o «Reproducir» para empezar.",
        SIEVE_STEP: "El {prime} es primo: tacha {count} múltiplos que quedaban.",
        SIEVE_DONE: "Lo que queda sin tachar son primos: {count} hasta el {limit}.",
        SIEVE_GRID_LABEL: "Números del 1 al {limit}",
        ULAM_TITLE: "Espiral de Ulam",
        ULAM_INTRO: "Escribe los números en espiral desde el centro y marca los primos: aparecen diagonales. Stanisław Ulam lo descubrió en 1963 garabateando en una conferencia aburrida.",
        ULAM_SIZE: "Tamaño",
        ULAM_LABEL: "Espiral de Ulam de {side} × {side} con {count} primos marcados",
        RECT_TITLE: "De alterna a continua",
        RECT_SUMMARY: "Rectifica una onda de corriente alterna paso a paso hasta casi continua.",
        RECT_DESCRIPTION: "Los enchufes dan corriente alterna, pero los aparatos electrónicos necesitan continua. Un rectificador con diodos y un condensador la convierte paso a paso.",
        RECT_STAGES: "Etapa",
        RECT_STAGE_AC: "Alterna",
        RECT_STAGE_HALF: "Media onda",
        RECT_STAGE_FULL: "Onda completa",
        RECT_STAGE_FILTERED: "Filtrada",
        RECT_HINT_AC: "La tensión sube y baja siguiendo un seno: la mitad del tiempo es negativa y su media es cero.",
        RECT_HINT_HALF: "Un diodo solo deja pasar la corriente en un sentido: se queda la mitad positiva y se pierde la otra.",
        RECT_HINT_FULL: "Un puente de cuatro diodos da la vuelta a la mitad negativa: todo es positivo, pero sigue latiendo.",
        RECT_HINT_FILTERED: "Un condensador se carga en cada pico y se descarga despacio entre ellos: queda casi plana, con un pequeño rizado.",
        RECT_AMPLITUDE: "Amplitud",
        RECT_FREQUENCY: "Frecuencia",
        RECT_CAPACITANCE: "Condensador",
        RECT_AVERAGE: "V media",
        RECT_RMS: "V eficaz (rms)",
        RECT_RIPPLE: "rizado pico a pico",
        RECT_CHART_LABEL: "Tensión de la etapa {stage} durante tres periodos",
        RECT_NOTE: "Modelo simplificado: diodos ideales sin caída de tensión y una carga fija de 1 kΩ.",
        COMPILER_TITLE: "Minicompilador",
        COMPILER_SUMMARY: "Mira cómo una expresión pasa por tokens, árbol y bytecode, y por qué 0.1 + 0.2 no da 0.3.",
        COMPILER_DESCRIPTION: "Un compilador de juguete para expresiones aritméticas. Hace lo mismo que uno de verdad: trocea el texto, construye un árbol, lo traduce a instrucciones y una máquina de pila las ejecuta.",
        COMPILER_INPUT_LABEL: "Expresión",
        COMPILER_RUN: "Compilar",
        COMPILER_EXAMPLES: "Curiosidades:",
        COMPILER_TOKENS: "1 · Tokens",
        COMPILER_TREE: "2 · Árbol (AST)",
        COMPILER_BYTECODE: "3 · Bytecode",
        COMPILER_RESULT: "4 · Resultado",
        COMPILER_ERROR_EMPTY: "Escribe una expresión.",
        COMPILER_ERROR_TOO_LONG: "La expresión es demasiado larga.",
        COMPILER_ERROR_UNEXPECTED_CHAR: "Este carácter no forma parte del lenguaje.",
        COMPILER_ERROR_UNEXPECTED_TOKEN: "No esperaba esto aquí.",
        COMPILER_ERROR_UNEXPECTED_END: "La expresión termina antes de tiempo.",
        COMPILER_ERROR_MISSING_PAREN: "Falta cerrar un paréntesis.",
        EXAMPLE_FLOAT: "Los decimales se guardan en binario y 0.1 no tiene representación exacta, igual que 1/3 no la tiene en decimal. El error se arrastra a la suma.",
        EXAMPLE_POWER: "La potencia se agrupa por la derecha: es 2^(3^2) = 2^9, no (2^3)^2 = 64. Fíjate en el árbol.",
        EXAMPLE_NEGATE: "El menos unario tiene menos prioridad que la potencia, así que es -(2^2). Python hace lo mismo; Excel da 4.",
        EXAMPLE_INFINITY: "En coma flotante (IEEE 754) dividir entre cero no es un error: da infinito.",
        EXAMPLE_NAN: "0/0 no tiene un valor razonable, así que da NaN (\"no es un número\"), que curiosamente es de tipo número.",
        EXAMPLE_SAFE_INTEGER: "Por encima de 2^53 los números de 64 bits ya no pueden representar todos los enteros: sumar 1 no cambia nada.",
        EXAMPLE_MODULO: "El resto toma el signo del dividendo en JavaScript, C y Java (da 1). En Python, 7 % -3 da -2.",
        COLLATZ_TITLE: "Conjetura de Collatz",
        COLLATZ_SUMMARY: "Divide entre 2 o multiplica por 3 y suma 1: ¿llegas siempre a 1?",
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
        BACK_TO_CURIOSITIES: "← Back to curiosities",
        CATEGORY_MATH: "Mathematics",
        CURIOSITY_TRY: "Try it →",
        CATEGORY_PHYSICS: "Physics",
        CATEGORY_PROGRAMMING: "Programming",
        PRIMES_TITLE: "Prime numbers",
        PRIMES_SUMMARY: "Cross out multiples with the sieve of Eratosthenes and spot the diagonals of the Ulam spiral.",
        PRIMES_DESCRIPTION: "A prime is only divisible by 1 and by itself. They look randomly scattered, yet they hide patterns we still do not fully understand.",
        SIEVE_TITLE: "Sieve of Eratosthenes",
        SIEVE_INTRO: "A method over 2,000 years old: each prime crosses out its multiples, and whatever is left is prime.",
        SIEVE_NEXT: "Next step",
        SIEVE_PLAY: "Play",
        SIEVE_PAUSE: "Pause",
        SIEVE_RESET: "Reset",
        SIEVE_START: "Press \"Next step\" or \"Play\" to start.",
        SIEVE_STEP: "{prime} is prime: it crosses out {count} remaining multiples.",
        SIEVE_DONE: "Whatever is not crossed out is prime: {count} up to {limit}.",
        SIEVE_GRID_LABEL: "Numbers from 1 to {limit}",
        ULAM_TITLE: "Ulam spiral",
        ULAM_INTRO: "Write the numbers in a spiral from the centre and mark the primes: diagonals show up. Stanisław Ulam found it in 1963 while doodling through a boring talk.",
        ULAM_SIZE: "Size",
        ULAM_LABEL: "Ulam spiral of {side} × {side} with {count} primes marked",
        RECT_TITLE: "From AC to DC",
        RECT_SUMMARY: "Rectify an alternating current wave step by step until it is almost direct.",
        RECT_DESCRIPTION: "Wall sockets give alternating current, but electronics need direct current. A rectifier made of diodes and a capacitor converts it step by step.",
        RECT_STAGES: "Stage",
        RECT_STAGE_AC: "AC",
        RECT_STAGE_HALF: "Half wave",
        RECT_STAGE_FULL: "Full wave",
        RECT_STAGE_FILTERED: "Filtered",
        RECT_HINT_AC: "The voltage rises and falls following a sine: half the time it is negative, and it averages zero.",
        RECT_HINT_HALF: "A diode only lets current through one way: the positive half stays and the other is lost.",
        RECT_HINT_FULL: "A bridge of four diodes flips the negative half: everything is positive, but it still pulses.",
        RECT_HINT_FILTERED: "A capacitor charges at each peak and slowly discharges between them: it is almost flat, with a small ripple.",
        RECT_AMPLITUDE: "Amplitude",
        RECT_FREQUENCY: "Frequency",
        RECT_CAPACITANCE: "Capacitor",
        RECT_AVERAGE: "average V",
        RECT_RMS: "RMS V",
        RECT_RIPPLE: "peak-to-peak ripple",
        RECT_CHART_LABEL: "Voltage of the {stage} stage over three periods",
        RECT_NOTE: "Simplified model: ideal diodes with no voltage drop and a fixed 1 kΩ load.",
        COMPILER_TITLE: "Mini compiler",
        COMPILER_SUMMARY: "Watch an expression go through tokens, tree and bytecode, and see why 0.1 + 0.2 is not 0.3.",
        COMPILER_DESCRIPTION: "A toy compiler for arithmetic expressions. It does what a real one does: it splits the text, builds a tree, translates it into instructions and a stack machine runs them.",
        COMPILER_INPUT_LABEL: "Expression",
        COMPILER_RUN: "Compile",
        COMPILER_EXAMPLES: "Curiosities:",
        COMPILER_TOKENS: "1 · Tokens",
        COMPILER_TREE: "2 · Tree (AST)",
        COMPILER_BYTECODE: "3 · Bytecode",
        COMPILER_RESULT: "4 · Result",
        COMPILER_ERROR_EMPTY: "Type an expression.",
        COMPILER_ERROR_TOO_LONG: "The expression is too long.",
        COMPILER_ERROR_UNEXPECTED_CHAR: "This character is not part of the language.",
        COMPILER_ERROR_UNEXPECTED_TOKEN: "Did not expect this here.",
        COMPILER_ERROR_UNEXPECTED_END: "The expression ends too soon.",
        COMPILER_ERROR_MISSING_PAREN: "A parenthesis is never closed.",
        EXAMPLE_FLOAT: "Decimals are stored in binary and 0.1 has no exact representation, just like 1/3 has none in decimal. The error carries into the sum.",
        EXAMPLE_POWER: "Power groups from the right: it is 2^(3^2) = 2^9, not (2^3)^2 = 64. Look at the tree.",
        EXAMPLE_NEGATE: "Unary minus has lower priority than power, so it is -(2^2). Python agrees; Excel says 4.",
        EXAMPLE_INFINITY: "In floating point (IEEE 754) dividing by zero is not an error: it gives infinity.",
        EXAMPLE_NAN: "0/0 has no sensible value, so it gives NaN (\"not a number\"), which is, funnily, of type number.",
        EXAMPLE_SAFE_INTEGER: "Above 2^53, 64-bit numbers can no longer hold every integer: adding 1 changes nothing.",
        EXAMPLE_MODULO: "The remainder takes the sign of the dividend in JavaScript, C and Java (it gives 1). In Python, 7 % -3 gives -2.",
        COLLATZ_TITLE: "Collatz conjecture",
        COLLATZ_SUMMARY: "Halve it or triple it and add 1: do you always reach 1?",
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

    /** Order in which categories appear on the index. */
    const CATEGORY_ORDER = ["math", "physics", "programming"];
    /** Group items by category following the given order; categories without items are left out. */
    function groupByCategory(items, order) {
        return order
            .map(category => ({ category, items: items.filter(item => item.category == category) }))
            .filter(group => group.items.length > 0);
    }
    /** Find the item with the given slug, if any. */
    function findBySlug(items, slug) {
        return items.find(item => item.slug == slug);
    }

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

    /** Create one big value with its caption underneath. */
    function createStat(value, caption) {
        const stat = createTextElement("span", "", ["curiosity-stat"]);
        stat.append(createTextElement("strong", value, ["curiosity-stat-value"]), createTextElement("span", caption, ["curiosity-stat-caption"]));
        return stat;
    }
    /** Create a row of example buttons after a label; clicking one hands its text to onPick. */
    function createExampleRow(label, examples, onPick) {
        const row = createTextElement("div", "", ["curiosity-examples"]);
        row.appendChild(createTextElement("span", label));
        examples.forEach(example => {
            const button = createTextElement("button", example, ["curiosity-example"]);
            button.setAttribute("type", "button");
            button.addEventListener("click", () => onPick(example));
            row.appendChild(button);
        });
        return row;
    }

    const SVG_NAMESPACE$1 = "http://www.w3.org/2000/svg";
    const WIDTH = 600;
    const HEIGHT = 160;
    const PADDING = 6;
    /** Create a minimal SVG line chart of the values in order: index on X, value on Y, scaled to fit. */
    function createLineChart(values, label, options = {}) {
        const svg = document.createElementNS(SVG_NAMESPACE$1, "svg");
        svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", label);
        svg.classList.add("line-chart");
        const min = options.min ?? Math.min(...values);
        const max = options.max ?? Math.max(...values);
        const toY = (value) => HEIGHT - PADDING - ((value - min) / (max - min || 1)) * (HEIGHT - PADDING * 2);
        if (options.baseline !== undefined) {
            const y = toY(options.baseline).toFixed(1);
            svg.appendChild(createSvgElement("line", { x1: "0", x2: String(WIDTH), y1: y, y2: y, class: "line-chart-baseline" }));
        }
        const stepX = (WIDTH - PADDING * 2) / Math.max(values.length - 1, 1);
        const points = values.map((value, index) => `${(PADDING + index * stepX).toFixed(1)},${toY(value).toFixed(1)}`);
        svg.appendChild(createSvgElement("polyline", { points: points.join(" "), class: "line-chart-line" }));
        return svg;
    }
    /** Create an SVG element whose strokes keep their width when the chart stretches. */
    function createSvgElement(type, attributes) {
        const element = document.createElementNS(SVG_NAMESPACE$1, type);
        Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
        element.setAttribute("vector-effect", "non-scaling-stroke");
        return element;
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
    const EXAMPLES$1 = [27, 97, 871];
    /** Interactive panel that walks a Collatz sequence and checks the conjecture over a range. */
    function createCollatzExplorer() {
        const texts = getTexts();
        const card = createTextElement("div", "", ["curiosity"]);
        const sequenceResult = createTextElement("div", "", ["collatz-result"]);
        sequenceResult.setAttribute("aria-live", "polite");
        const sequenceForm = createNumberForm({
            label: texts.COLLATZ_NUMBER_LABEL,
            button: texts.COLLATZ_RUN,
            min: 1,
            max: MAX_START,
            initial: EXAMPLES$1[0],
            onSubmit: start => sequenceResult.replaceChildren(...createSequenceResult(start)),
        });
        const examples = createExampleRow(texts.COLLATZ_EXAMPLES, EXAMPLES$1.map(String), example => sequenceForm.submitValue(Number(example)));
        card.append(sequenceForm.element, examples, sequenceResult);
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
        sequenceResult.replaceChildren(...createSequenceResult(EXAMPLES$1[0]));
        return card;
    }
    /** Create the stats, the shortened sequence and the trajectory chart for one start. */
    function createSequenceResult(start) {
        const texts = getTexts();
        const sequence = collatzSequence(start);
        const summary = summarizeSequence(sequence);
        const stats = createTextElement("p", "", ["curiosity-stats"]);
        stats.append(createStat(formatNumber(summary.steps), texts.COLLATZ_STEPS), createStat(formatNumber(summary.peak), texts.COLLATZ_PEAK));
        const terms = previewSequence(sequence, PREVIEW_EDGE).map(term => term == null ? "…" : formatNumber(term));
        const preview = createTextElement("p", terms.join(" → "), ["collatz-sequence"]);
        const chart = createLineChart(sequence, fillText(texts.COLLATZ_CHART_LABEL, { n: formatNumber(start) }));
        return [stats, preview, chart];
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

    const OPCODES = { "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV", "%": "MOD", "^": "POW" };
    /** Turn a syntax tree into stack instructions: operands first, then the operation (postfix order). */
    function compile(node) {
        switch (node.type) {
            case "number": return [{ op: "PUSH", value: node.value }];
            case "negate": return [...compile(node.operand), { op: "NEG" }];
            case "binary": return [...compile(node.left), ...compile(node.right), { op: OPCODES[node.operator] }];
        }
    }

    /** A syntax error with the position in the source where it was found. */
    class CompileError extends Error {
        constructor(code, position) {
            super(`${code} at position ${position}`);
            this.name = "CompileError";
            this.code = code;
            this.position = position;
        }
    }

    /** Draw a syntax tree as text lines with box-drawing branches. */
    function formatTree(node) {
        return formatBranch(node, "", "");
    }
    /** Draw one node with the given prefix for its own line and for the lines of its children. */
    function formatBranch(node, linePrefix, childPrefix) {
        const children = getChildren(node);
        const lines = [linePrefix + getLabel(node)];
        children.forEach((child, index) => {
            const isLast = index == children.length - 1;
            lines.push(...formatBranch(child, childPrefix + (isLast ? "└─ " : "├─ "), childPrefix + (isLast ? "   " : "│  ")));
        });
        return lines;
    }
    /** The text shown for a node. */
    function getLabel(node) {
        switch (node.type) {
            case "number": return String(node.value);
            case "negate": return "neg";
            case "binary": return node.operator;
        }
    }
    /** The operands of a node, left to right. */
    function getChildren(node) {
        switch (node.type) {
            case "number": return [];
            case "negate": return [node.operand];
            case "binary": return [node.left, node.right];
        }
    }
    /** Write an instruction like assembly: opcode and optional operand. */
    function formatInstruction(instruction) {
        return instruction.op == "PUSH" ? `PUSH ${instruction.value}` : instruction.op;
    }

    /** Longest source the compiler accepts, to keep the views readable. */
    const MAX_SOURCE_LENGTH = 200;
    const TOKEN_PATTERN = /\s*(?:(\d+(?:\.\d+)?|\.\d+)|([+\-*/%^])|([()]))/y;
    /** Split a source text into tokens, failing on any character that is not part of the language. */
    function tokenize(source) {
        if (source.length > MAX_SOURCE_LENGTH)
            throw new CompileError("too-long", MAX_SOURCE_LENGTH);
        const tokens = [];
        let index = 0;
        while (index < source.trimEnd().length) {
            TOKEN_PATTERN.lastIndex = index;
            const match = TOKEN_PATTERN.exec(source);
            if (!match)
                throw new CompileError("unexpected-char", firstNonSpace(source, index));
            const [whole, number, operator, paren] = match;
            const position = index + whole.length - (number ?? operator ?? paren).length;
            if (number)
                tokens.push({ type: "number", text: number, position });
            else if (operator)
                tokens.push({ type: "operator", text: operator, position });
            else
                tokens.push({ type: "paren", text: paren, position });
            index += whole.length;
        }
        return tokens;
    }
    /** Position of the first non-space character from index on. */
    function firstNonSpace(source, index) {
        while (/\s/.test(source[index] ?? ""))
            index++;
        return index;
    }

    /** How tightly each binary operator holds its operands; higher wins. */
    const BINDING_POWER = { "+": 10, "-": 10, "*": 20, "/": 20, "%": 20, "^": 40 };
    /** Unary minus sits between products and powers, so -2^2 is -(2^2). */
    const NEGATE_POWER = 30;
    /** Build the syntax tree of a token list with a Pratt parser. */
    function parse(tokens) {
        if (tokens.length == 0)
            throw new CompileError("empty", 0);
        const last = tokens[tokens.length - 1];
        const end = last.position + last.text.length;
        let index = 0;
        const peek = () => tokens[index];
        const next = () => {
            const token = tokens[index++];
            if (!token)
                throw new CompileError("unexpected-end", end);
            return token;
        };
        /** Parse an operand: a number, a negation or a parenthesised expression. */
        const parsePrefix = () => {
            const token = next();
            if (token.type == "number")
                return { type: "number", value: Number(token.text) };
            if (token.text == "-")
                return { type: "negate", operand: parseExpression(NEGATE_POWER) };
            if (token.text != "(")
                throw new CompileError("unexpected-token", token.position);
            const inner = parseExpression(0);
            const closing = peek();
            if (!closing)
                throw new CompileError("missing-paren", end);
            if (closing.text != ")")
                throw new CompileError("unexpected-token", closing.position);
            index++;
            return inner;
        };
        /** Parse operators while they bind tighter than minPower. */
        const parseExpression = (minPower) => {
            let left = parsePrefix();
            for (let token = peek(); token && token.text != ")"; token = peek()) {
                if (token.type != "operator")
                    throw new CompileError("unexpected-token", token.position);
                const operator = token.text;
                const power = BINDING_POWER[operator];
                if (power <= minPower)
                    break;
                index++;
                // Power is right associative: 2^3^2 is 2^(3^2)
                const right = parseExpression(operator == "^" ? power - 1 : power);
                left = { type: "binary", operator, left, right };
            }
            return left;
        };
        const tree = parseExpression(0);
        const leftover = peek();
        if (leftover)
            throw new CompileError("unexpected-token", leftover.position);
        return tree;
    }

    const OPERATIONS = {
        ADD: (left, right) => left + right,
        SUB: (left, right) => left - right,
        MUL: (left, right) => left * right,
        DIV: (left, right) => left / right,
        MOD: (left, right) => left % right,
        POW: (left, right) => Math.pow(left, right),
    };
    /** Execute stack instructions and return the single value left on the stack. */
    function run(instructions) {
        const stack = [];
        const pop = () => {
            const value = stack.pop();
            if (value === undefined)
                throw new Error("Stack underflow: the program pops more values than it pushes");
            return value;
        };
        for (const instruction of instructions) {
            if (instruction.op == "PUSH")
                stack.push(instruction.value);
            else if (instruction.op == "NEG")
                stack.push(-pop());
            else {
                const right = pop();
                stack.push(OPERATIONS[instruction.op](pop(), right));
            }
        }
        if (stack.length != 1)
            throw new Error(`Program left ${stack.length} values on the stack instead of 1`);
        return stack[0];
    }

    /** Curious expressions with the text key that explains each one. */
    const EXAMPLES = [
        { source: "0.1 + 0.2", note: "EXAMPLE_FLOAT" },
        { source: "2 ^ 3 ^ 2", note: "EXAMPLE_POWER" },
        { source: "-2 ^ 2", note: "EXAMPLE_NEGATE" },
        { source: "1 / 0", note: "EXAMPLE_INFINITY" },
        { source: "0 / 0", note: "EXAMPLE_NAN" },
        { source: "2 ^ 53 + 1", note: "EXAMPLE_SAFE_INTEGER" },
        { source: "7 % -3", note: "EXAMPLE_MODULO" },
    ];
    const ERROR_TEXTS = {
        "empty": "COMPILER_ERROR_EMPTY",
        "too-long": "COMPILER_ERROR_TOO_LONG",
        "unexpected-char": "COMPILER_ERROR_UNEXPECTED_CHAR",
        "unexpected-token": "COMPILER_ERROR_UNEXPECTED_TOKEN",
        "unexpected-end": "COMPILER_ERROR_UNEXPECTED_END",
        "missing-paren": "COMPILER_ERROR_MISSING_PAREN",
    };
    /** Interactive compiler: type an expression and see every stage from tokens to result. */
    function createCompilerExplorer() {
        const texts = getTexts();
        const panel = createTextElement("div", "", ["curiosity"]);
        const output = createTextElement("div", "", ["compiler-output"]);
        output.setAttribute("aria-live", "polite");
        const form = document.createElement("form");
        form.classList.add("number-form");
        const label = createTextElement("label", texts.COMPILER_INPUT_LABEL, ["number-form-label"]);
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = MAX_SOURCE_LENGTH;
        input.spellcheck = false;
        input.autocomplete = "off";
        input.classList.add("number-form-input", "compiler-input");
        label.appendChild(input);
        const button = createTextElement("button", texts.COMPILER_RUN, ["number-form-button"]);
        button.setAttribute("type", "submit");
        form.append(label, button);
        const show = (source) => {
            input.value = source;
            output.replaceChildren(...renderStages(source));
        };
        form.addEventListener("submit", event => {
            event.preventDefault();
            show(input.value);
        });
        const examples = createExampleRow(texts.COMPILER_EXAMPLES, EXAMPLES.map(example => example.source), show);
        panel.append(form, examples, output);
        show(EXAMPLES[0].source);
        return panel;
    }
    /** Compile a source and render each stage, or the syntax error pointing at its position. */
    function renderStages(source) {
        const texts = getTexts();
        try {
            const tokens = tokenize(source);
            const tree = parse(tokens);
            const program = compile(tree);
            const result = run(program);
            const tokenList = createTextElement("div", "", ["compiler-tokens"]);
            tokens.forEach(token => tokenList.appendChild(createTextElement("span", token.text, ["compiler-token", `is-${token.type}`])));
            const stages = [
                createStage(texts.COMPILER_TOKENS, tokenList),
                createStage(texts.COMPILER_TREE, createTextElement("pre", formatTree(tree).join("\n"), ["compiler-code"])),
                createStage(texts.COMPILER_BYTECODE, createTextElement("pre", program.map(formatInstruction).join("\n"), ["compiler-code"])),
                createStage(texts.COMPILER_RESULT, createTextElement("p", String(result), ["compiler-result"])),
            ];
            const example = EXAMPLES.find(item => item.source == source.trim());
            if (example)
                stages.push(createTextElement("p", `ⓘ ${texts[example.note]}`, ["curiosity-note", "compiler-note"]));
            return stages;
        }
        catch (error) {
            if (!(error instanceof CompileError))
                throw error;
            const message = createTextElement("p", texts[ERROR_TEXTS[error.code]], ["number-form-error"]);
            message.setAttribute("role", "alert");
            const pointer = createTextElement("pre", `${source}\n${" ".repeat(error.position)}^`, ["compiler-code", "compiler-pointer"]);
            return error.code == "empty" || error.code == "too-long" ? [message] : [message, pointer];
        }
    }
    /** Create a titled block for one compiler stage. */
    function createStage(title, content) {
        const stage = createTextElement("section", "", ["compiler-stage"]);
        stage.append(createTextElement("h3", title, ["compiler-stage-title"]), content);
        return stage;
    }

    /** Mark every composite up to limit; index i is true when i is prime. */
    function sieve(limit) {
        const isPrime = Array.from({ length: limit + 1 }, (_, index) => index >= 2);
        for (let p = 2; p * p <= limit; p++) {
            if (!isPrime[p])
                continue;
            for (let multiple = p * p; multiple <= limit; multiple += p)
                isPrime[multiple] = false;
        }
        return isPrime;
    }
    /** Every prime from 2 to limit, in order. */
    function primesUpTo(limit) {
        return sieve(limit).flatMap((isPrime, index) => isPrime ? [index] : []);
    }
    /** The steps of the sieve of Eratosthenes; primes above the square root of limit cross nothing, so they have no step. */
    function sieveSteps(limit) {
        const isCrossed = new Array(limit + 1).fill(false);
        const steps = [];
        for (let p = 2; p * p <= limit; p++) {
            if (isCrossed[p])
                continue;
            const crossed = [];
            for (let multiple = p * p; multiple <= limit; multiple += p) {
                if (isCrossed[multiple])
                    continue;
                isCrossed[multiple] = true;
                crossed.push(multiple);
            }
            steps.push({ prime: p, crossed });
        }
        return steps;
    }
    /** Positions of 1..count on the Ulam spiral: right 1, up 1, left 2, down 2, right 3... */
    function ulamPath(count) {
        const directions = [{ x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }];
        const path = [];
        let point = { x: 0, y: 0 };
        let turn = 0;
        let length = 1;
        while (path.length < count) {
            for (let step = 0; step < length && path.length < count; step++) {
                path.push(point);
                const direction = directions[turn % 4];
                point = { x: point.x + direction.x, y: point.y + direction.y };
            }
            turn++;
            // The side length grows after every second turn
            if (turn % 2 == 0)
                length++;
        }
        return path;
    }

    const LIMIT = 200;
    const PLAY_INTERVAL_MS = 700;
    /** Panel that runs the sieve of Eratosthenes over a grid of 1..200, step by step or animated. */
    function createSieveGrid() {
        const texts = getTexts();
        const steps = sieveSteps(LIMIT);
        const panel = createTextElement("section", "", ["curiosity"]);
        panel.append(createTextElement("h2", texts.SIEVE_TITLE, ["curiosity-subtitle"]), createTextElement("p", texts.SIEVE_INTRO, ["curiosity-text"]));
        const grid = createTextElement("div", "", ["sieve-grid"]);
        grid.setAttribute("role", "img");
        grid.setAttribute("aria-label", fillText(texts.SIEVE_GRID_LABEL, { limit: String(LIMIT) }));
        const cells = Array.from({ length: LIMIT }, (_, index) => createTextElement("span", String(index + 1), ["sieve-cell"]));
        grid.append(...cells);
        const cellOf = (n) => cells[n - 1];
        const status = createTextElement("p", texts.SIEVE_START, ["sieve-status"]);
        status.setAttribute("aria-live", "polite");
        const next = createButton(texts.SIEVE_NEXT);
        const play = createButton(texts.SIEVE_PLAY);
        const reset = createButton(texts.SIEVE_RESET);
        const actions = createTextElement("div", "", ["curiosity-actions"]);
        actions.append(next, play, reset);
        let stepIndex = 0;
        let timer;
        const stopPlaying = () => {
            window.clearInterval(timer);
            timer = undefined;
            play.textContent = texts.SIEVE_PLAY;
        };
        const advance = () => {
            // Stop the animation if the user left the page meanwhile
            if (!panel.isConnected && timer !== undefined)
                return stopPlaying();
            if (stepIndex > steps.length)
                return stopPlaying();
            if (stepIndex == steps.length) {
                const primes = primesUpTo(LIMIT);
                primes.forEach(prime => cellOf(prime).classList.add("is-prime"));
                status.textContent = fillText(texts.SIEVE_DONE, { count: String(primes.length), limit: String(LIMIT) });
            }
            else {
                const step = steps[stepIndex];
                cells.forEach(cell => cell.classList.remove("is-current"));
                cellOf(step.prime).classList.add("is-prime", "is-current");
                step.crossed.forEach(multiple => cellOf(multiple).classList.add("is-crossed"));
                status.textContent = fillText(texts.SIEVE_STEP, { prime: String(step.prime), count: String(step.crossed.length) });
            }
            stepIndex++;
            next.toggleAttribute("disabled", stepIndex > steps.length);
            play.toggleAttribute("disabled", stepIndex > steps.length);
            if (stepIndex > steps.length)
                stopPlaying();
        };
        next.addEventListener("click", advance);
        play.addEventListener("click", () => {
            if (timer !== undefined)
                return stopPlaying();
            play.textContent = texts.SIEVE_PAUSE;
            advance();
            timer = window.setInterval(advance, PLAY_INTERVAL_MS);
        });
        reset.addEventListener("click", () => {
            stopPlaying();
            stepIndex = 0;
            cells.forEach(cell => cell.classList.remove("is-prime", "is-crossed", "is-current"));
            next.removeAttribute("disabled");
            play.removeAttribute("disabled");
            status.textContent = texts.SIEVE_START;
        });
        panel.append(actions, grid, status);
        return panel;
    }
    /** Create a plain action button. */
    function createButton(text) {
        const button = createTextElement("button", text, ["curiosity-button"]);
        button.setAttribute("type", "button");
        return button;
    }

    /** Create a labelled range input that steps through the given values. */
    function createSlider(options) {
        const initialIndex = options.values.indexOf(options.initial);
        if (initialIndex < 0)
            throw new Error(`Slider "${options.label}" has no value ${options.initial}`);
        const wrapper = createTextElement("label", "", ["slider"]);
        const header = createTextElement("span", "", ["slider-header"]);
        const output = createTextElement("output", options.format(options.initial), ["slider-value"]);
        header.append(createTextElement("span", options.label), output);
        const input = document.createElement("input");
        input.type = "range";
        input.min = "0";
        input.max = String(options.values.length - 1);
        input.value = String(initialIndex);
        input.classList.add("slider-input");
        input.addEventListener("input", () => {
            const value = options.values[Number(input.value)];
            output.textContent = options.format(value);
            input.setAttribute("aria-valuetext", options.format(value));
            options.onChange(value);
        });
        input.setAttribute("aria-valuetext", options.format(options.initial));
        wrapper.append(header, input);
        return wrapper;
    }
    /** Create a row of toggle buttons where exactly one is pressed. */
    function createSegmented(label, choices, initial, onSelect) {
        const group = createTextElement("div", "", ["segmented"]);
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", label);
        const buttons = choices.map(choice => {
            const button = createTextElement("button", choice.label, ["segmented-option"]);
            button.setAttribute("type", "button");
            button.setAttribute("aria-pressed", String(choice.value == initial));
            button.addEventListener("click", () => {
                buttons.forEach(other => other.setAttribute("aria-pressed", String(other == button)));
                onSelect(choice.value);
            });
            return button;
        });
        group.append(...buttons);
        return group;
    }

    const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
    const SIDES = [101, 201, 301];
    /** Panel with the Ulam spiral drawn as one SVG path, so the accent colour follows the theme. */
    function createUlamSpiral() {
        const texts = getTexts();
        const panel = createTextElement("section", "", ["curiosity"]);
        panel.append(createTextElement("h2", texts.ULAM_TITLE, ["curiosity-subtitle"]), createTextElement("p", texts.ULAM_INTRO, ["curiosity-text"]));
        const frame = createTextElement("div", "", ["ulam-frame"]);
        const render = (side) => frame.replaceChildren(drawSpiral(side));
        const choices = SIDES.map(side => ({ value: side, label: `${side} × ${side}` }));
        panel.append(createSegmented(texts.ULAM_SIZE, choices, SIDES[0], render), frame);
        render(SIDES[0]);
        return panel;
    }
    /** Draw a side × side spiral with one unit square per prime. */
    function drawSpiral(side) {
        const count = side * side;
        const path = ulamPath(count);
        const center = (side - 1) / 2;
        const primes = primesUpTo(count);
        const squares = primes.map(prime => {
            const point = path[prime - 1];
            return `M${point.x + center} ${point.y + center}h1v1h-1z`;
        });
        const svg = document.createElementNS(SVG_NAMESPACE, "svg");
        svg.setAttribute("viewBox", `0 0 ${side} ${side}`);
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", fillText(getTexts().ULAM_LABEL, { side: String(side), count: String(primes.length) }));
        svg.classList.add("ulam-spiral");
        const shape = document.createElementNS(SVG_NAMESPACE, "path");
        shape.setAttribute("d", squares.join(""));
        shape.setAttribute("shape-rendering", "crispEdges");
        svg.appendChild(shape);
        return svg;
    }

    /** The primes curiosity: the sieve first, then the Ulam spiral. */
    function createPrimesExplorer() {
        const wrapper = createTextElement("div", "", ["curiosity-stack"]);
        wrapper.append(createSieveGrid(), createUlamSpiral());
        return wrapper;
    }

    /** Sample a stage over whole periods, with ideal diodes; one hidden warm-up period lets the capacitor charge first. */
    function sampleWave(stage, params, periods, samplesPerPeriod) {
        const total = (periods + 1) * samplesPerPeriod;
        const dt = 1 / (params.frequency * samplesPerPeriod);
        const timeConstant = params.load * params.capacitance * 1e-6;
        const values = [];
        let capacitor = 0;
        for (let i = 0; i < total; i++) {
            const ac = params.amplitude * Math.sin(2 * Math.PI * params.frequency * i * dt);
            const full = Math.abs(ac);
            // The diodes recharge the capacitor while the input is higher; otherwise it discharges through the load
            capacitor = Math.max(full, capacitor * Math.exp(-dt / timeConstant));
            values.push(pickStage(stage, ac, full, capacitor));
        }
        return values.slice(samplesPerPeriod);
    }
    /** The output of the given stage for one instant. */
    function pickStage(stage, ac, full, capacitor) {
        switch (stage) {
            case "ac": return ac;
            case "half": return Math.max(0, ac);
            case "full": return full;
            case "filtered": return capacitor;
        }
    }
    /** Measure the mean, RMS and ripple of a sampled wave. */
    function measureWave(values) {
        if (values.length == 0)
            throw new Error("Cannot measure a wave without samples");
        const sum = values.reduce((total, value) => total + value, 0);
        const squares = values.reduce((total, value) => total + value * value, 0);
        return {
            average: sum / values.length,
            rms: Math.sqrt(squares / values.length),
            ripple: Math.max(...values) - Math.min(...values),
        };
    }

    const PERIODS = 3;
    const SAMPLES_PER_PERIOD = 200;
    const LOAD_OHMS = 1000;
    const AMPLITUDES = [1, 2, 5, 9, 12, 15, 20, 24, 30];
    const FREQUENCIES = [10, 20, 30, 40, 50, 60, 80, 100];
    const CAPACITANCES = [10, 22, 47, 100, 220, 470, 1000, 2200];
    /** Name and explanation text keys of each stage. */
    const STAGES = [
        { value: "ac", label: "RECT_STAGE_AC", hint: "RECT_HINT_AC" },
        { value: "half", label: "RECT_STAGE_HALF", hint: "RECT_HINT_HALF" },
        { value: "full", label: "RECT_STAGE_FULL", hint: "RECT_HINT_FULL" },
        { value: "filtered", label: "RECT_STAGE_FILTERED", hint: "RECT_HINT_FILTERED" },
    ];
    /** Interactive rectifier: pick a stage and tune the circuit to see the wave and its measures. */
    function createRectifierExplorer() {
        const texts = getTexts();
        const panel = createTextElement("div", "", ["curiosity"]);
        const state = {
            stage: "ac",
            params: { amplitude: 12, frequency: 50, capacitance: 470, load: LOAD_OHMS },
        };
        const hint = createTextElement("p", "", ["curiosity-text", "rectifier-hint"]);
        const chart = createTextElement("div", "", ["rectifier-chart"]);
        const stats = createTextElement("p", "", ["curiosity-stats"]);
        stats.setAttribute("aria-live", "polite");
        const render = () => {
            const stage = STAGES.find(item => item.value == state.stage);
            hint.textContent = texts[stage.hint];
            const values = sampleWave(state.stage, state.params, PERIODS, SAMPLES_PER_PERIOD);
            const limit = state.params.amplitude * 1.1;
            const label = fillText(texts.RECT_CHART_LABEL, { stage: texts[stage.label] });
            chart.replaceChildren(createLineChart(values, label, { min: -limit, max: limit, baseline: 0 }));
            const measure = measureWave(values);
            stats.replaceChildren(createStat(formatVolts(measure.average), texts.RECT_AVERAGE), createStat(formatVolts(measure.rms), texts.RECT_RMS), createStat(formatVolts(measure.ripple), texts.RECT_RIPPLE));
        };
        const update = (change) => {
            state.params = { ...state.params, ...change };
            render();
        };
        const stageChoices = STAGES.map(stage => ({ value: stage.value, label: texts[stage.label] }));
        const sliders = createTextElement("div", "", ["rectifier-sliders"]);
        sliders.append(createSlider({ label: texts.RECT_AMPLITUDE, values: AMPLITUDES, initial: 12, format: value => `${value} V`, onChange: amplitude => update({ amplitude }) }), createSlider({ label: texts.RECT_FREQUENCY, values: FREQUENCIES, initial: 50, format: value => `${value} Hz`, onChange: frequency => update({ frequency }) }), createSlider({ label: texts.RECT_CAPACITANCE, values: CAPACITANCES, initial: 470, format: value => `${value} µF`, onChange: capacitance => update({ capacitance }) }));
        panel.append(createSegmented(texts.RECT_STAGES, stageChoices, state.stage, stage => { state.stage = stage; render(); }), hint, chart, stats, sliders, createTextElement("p", texts.RECT_NOTE, ["curiosity-note"]));
        render();
        return panel;
    }
    /** Format volts with two decimals in the current language. */
    function formatVolts(value) {
        // Avoid showing "-0,00 V" for averages that are zero up to rounding
        const rounded = Math.abs(value) < 0.005 ? 0 : value;
        return `${rounded.toLocaleString(getTexts().LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} V`;
    }

    /** Every curiosity, in the order they are listed inside their category; add new ones here. */
    const CURIOSITIES = [
        {
            slug: "collatz",
            category: "math",
            title: "COLLATZ_TITLE",
            summary: "COLLATZ_SUMMARY",
            description: "COLLATZ_DESCRIPTION",
            createContent: createCollatzExplorer,
        },
        {
            slug: "primes",
            category: "math",
            title: "PRIMES_TITLE",
            summary: "PRIMES_SUMMARY",
            description: "PRIMES_DESCRIPTION",
            createContent: createPrimesExplorer,
        },
        {
            slug: "rectifier",
            category: "physics",
            title: "RECT_TITLE",
            summary: "RECT_SUMMARY",
            description: "RECT_DESCRIPTION",
            createContent: createRectifierExplorer,
        },
        {
            slug: "compiler",
            category: "programming",
            title: "COMPILER_TITLE",
            summary: "COMPILER_SUMMARY",
            description: "COMPILER_DESCRIPTION",
            createContent: createCompilerExplorer,
        },
    ];
    /** Text key of each category heading. */
    const CATEGORY_TITLES = {
        math: "CATEGORY_MATH",
        physics: "CATEGORY_PHYSICS",
        programming: "CATEGORY_PROGRAMMING",
    };
    /** The heading of a category in the current language. */
    function getCategoryTitle(category) {
        return getTexts()[CATEGORY_TITLES[category]];
    }

    /** Index of the curiosities, grouped by category, each linking to its own page. */
    class CuriositiesView {
        /** Show the curiosities index. */
        static async show(_parameters, container) {
            setPageTitle(getTexts().CURIOSITIES_TITLE);
            const page = createPage(CuriositiesView.VIEW_ID);
            page.appendChild(createPageHeader(getTexts().CURIOSITIES_TITLE, getTexts().CURIOSITIES_INTRO));
            groupByCategory(CURIOSITIES, CATEGORY_ORDER)
                .forEach(group => page.appendChild(CuriositiesView.createCategory(group.category, group.items)));
            container.appendChild(page);
        }
        /** Create one category section with the list of its curiosities. */
        static createCategory(category, curiosities) {
            const section = createTextElement("section", "", ["curiosity-category"]);
            section.appendChild(createSectionHeader(getCategoryTitle(category)));
            const list = createTextElement("ul", "", ["curiosity-list"]);
            curiosities.forEach(curiosity => list.appendChild(CuriositiesView.createItem(curiosity)));
            section.appendChild(list);
            return section;
        }
        /** Create one card, entirely clickable, with title, summary and a "Try it" call to action. */
        static createItem(curiosity) {
            const texts = getTexts();
            const item = createTextElement("li", "", ["curiosity-entry"]);
            const link = createLink("", `#/curiosities/${curiosity.slug}`, ["curiosity-entry-link"]);
            const body = createTextElement("span", "", ["curiosity-entry-body"]);
            body.append(createTextElement("strong", texts[curiosity.title], ["curiosity-entry-title"]), createTextElement("span", texts[curiosity.summary], ["curiosity-entry-summary"]));
            const call = createTextElement("span", texts.CURIOSITY_TRY, ["curiosity-entry-try"]);
            call.setAttribute("aria-hidden", "true");
            link.append(body, call);
            item.appendChild(link);
            return item;
        }
    }
    CuriositiesView.VIEW_ID = "curiosities";

    /** Page of a single curiosity. Expects its slug as the first route parameter. */
    class CuriosityView {
        /** Show the curiosity page, or the not found view when the slug is unknown. */
        static async show(parameters, container) {
            const curiosity = findBySlug(CURIOSITIES, parameters[0] ?? "");
            if (!curiosity) {
                await NotFoundView.show([], container);
                return;
            }
            const texts = getTexts();
            setPageTitle(texts[curiosity.title]);
            const page = createPage(CuriosityView.VIEW_ID);
            page.appendChild(createLink(texts.BACK_TO_CURIOSITIES, "#/curiosities", ["back-link"]));
            page.appendChild(createPageHeader(texts[curiosity.title], texts[curiosity.description]));
            page.appendChild(curiosity.createContent());
            container.appendChild(page);
        }
    }
    CuriosityView.VIEW_ID = "curiosity";

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
        setRoute("curiosities/$", CuriosityView.show);
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

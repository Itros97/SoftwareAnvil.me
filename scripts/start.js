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
        const loadedConfiguration = await fetch(path).then((res) => res.json());
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
    /** Set DOM events*/
    function setDomEvents(element, events) {
        if (undefined == element || undefined == events)
            return element;
        for (const key in events)
            element.addEventListener(key, events[key]);
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
            const regexp = RegExp(route);
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

    /**
     * This enum represents the Bubble UI css framework
     */
    var BubbleUI;
    (function (BubbleUI) {
        BubbleUI["BoxColumn"] = "box-column";
        BubbleUI["BoxRow"] = "box-row";
        BubbleUI["boxWrap"] = "box-warp";
        BubbleUI["BoxCenter"] = "box-center";
        BubbleUI["BoxXCenter"] = "box-x-center";
        BubbleUI["BoxYCenter"] = "box-y-center";
        BubbleUI["BoxXStart"] = "box-x-start";
        BubbleUI["BoxXEnd"] = "box-x-end";
        BubbleUI["BoxYStart"] = "box-y-start";
        BubbleUI["BoxXBetween"] = "box-x-between";
        BubbleUI["TextCenter"] = "text-center";
    })(BubbleUI || (BubbleUI = {}));

    /**
     * This enum contains the most common HTML tags
     */
    var Html;
    (function (Html) {
        Html["View"] = "view";
        Html["Div"] = "div";
        Html["Span"] = "span";
        Html["Input"] = "input";
        Html["Button"] = "button";
        Html["Textarea"] = "textarea";
        Html["Select"] = "select";
        Html["Option"] = "option";
        Html["Form"] = "form";
        Html["Label"] = "label";
        Html["Img"] = "img";
        Html["A"] = "a";
        Html["B"] = "b";
        Html["Table"] = "table";
        Html["Thead"] = "thead";
        Html["Tbody"] = "tbody";
        Html["Tr"] = "tr";
        Html["Th"] = "th";
        Html["Td"] = "td";
        Html["I"] = "i";
        Html["Ul"] = "ul";
        Html["Li"] = "li";
        Html["Nav"] = "nav";
        Html["Header"] = "header";
        Html["Footer"] = "footer";
        Html["Section"] = "section";
        Html["Article"] = "article";
        Html["Aside"] = "aside";
        Html["H1"] = "h1";
        Html["H2"] = "h2";
        Html["H3"] = "h3";
        Html["H4"] = "h4";
        Html["H5"] = "h5";
        Html["H6"] = "h6";
        Html["P"] = "p";
        Html["Hr"] = "hr";
        Html["Br"] = "br";
        Html["Canvas"] = "canvas";
        Html["Svg"] = "svg";
        Html["Path"] = "path";
        Html["Polygon"] = "polygon";
        Html["Polyline"] = "polyline";
        Html["Circle"] = "circle";
        Html["Ellipse"] = "ellipse";
        Html["Rect"] = "rect";
        Html["Line"] = "line";
        Html["Text"] = "text";
        Html["Tspan"] = "tspan";
        Html["G"] = "g";
        Html["Mask"] = "mask";
        Html["Pattern"] = "pattern";
        Html["Defs"] = "defs";
        Html["Symbol"] = "symbol";
        Html["Use"] = "use";
        Html["Clippath"] = "clipPath";
        Html["Stop"] = "stop";
        Html["LinearGradient"] = "linearGradient";
        Html["RadialGradient"] = "radialGradient";
        Html["Filter"] = "filter";
    })(Html || (Html = {}));

    /**
     * This enum represents the available HTTP methods
     * @author akrck02
     */
    var HttpMethod;
    (function (HttpMethod) {
        HttpMethod["Get"] = "GET";
        HttpMethod["Post"] = "POST";
        HttpMethod["Put"] = "PUT";
        HttpMethod["Delete"] = "DELETE";
        HttpMethod["Update"] = "UPDATE";
        HttpMethod["Patch"] = "PATCH";
        HttpMethod["Head"] = "HEAD";
        HttpMethod["Options"] = "OPTIONS";
        HttpMethod["Connect"] = "CONNECT";
        HttpMethod["Trace"] = "TRACE";
        HttpMethod["All"] = "ALL";
    })(HttpMethod || (HttpMethod = {}));
    /**
     * This enum represents the available mime types
     * @author akrck02
     */
    var MimeType;
    (function (MimeType) {
        MimeType["Json"] = "application/json";
        MimeType["Xml"] = "application/xml";
        MimeType["Html"] = "text/html";
        MimeType["Text"] = "text/plain";
        MimeType["Form"] = "multipart/form-data";
        MimeType["UrlEncoded"] = "application/x-www-form-urlencoded";
        MimeType["Blob"] = "application/octet-stream";
        MimeType["Pdf"] = "application/pdf";
        MimeType["Zip"] = "application/zip";
        MimeType["Mp3"] = "audio/mpeg";
        MimeType["Mp4"] = "video/mp4";
        MimeType["Png"] = "image/png";
        MimeType["Jpeg"] = "image/jpeg";
        MimeType["Gif"] = "image/gif";
        MimeType["Svg"] = "image/svg+xml";
        MimeType["Ico"] = "image/x-icon";
        MimeType["Csv"] = "text/csv";
        MimeType["Css"] = "text/css";
        MimeType["Javascript"] = "text/javascript";
        MimeType["Typescript"] = "text/typescript";
        MimeType["Webm"] = "video/webm";
        MimeType["Ogg"] = "video/ogg";
        MimeType["Ogv"] = "video/ogv";
        MimeType["Wav"] = "audio/wav";
        MimeType["Webp"] = "image/webp";
        MimeType["Woff"] = "font/woff";
        MimeType["Woff2"] = "font/woff2";
        MimeType["Ttf"] = "font/ttf";
        MimeType["Eot"] = "application/vnd.ms-fontobject";
        MimeType["Otf"] = "font/otf";
        MimeType["Xls"] = "application/vnd.ms-excel";
        MimeType["Xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        MimeType["Doc"] = "application/msword";
        MimeType["Docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        MimeType["Ppt"] = "application/vnd.ms-powerpoint";
        MimeType["Pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        MimeType["Msg"] = "application/vnd.ms-outlook";
        MimeType["Rtf"] = "application/rtf";
        MimeType["Psd"] = "application/photoshop";
        MimeType["Ai"] = "application/postscript";
        MimeType["Eps"] = "application/postscript";
        MimeType["Xps"] = "application/vnd.ms-xpsdocument";
        MimeType["Swf"] = "application/x-shockwave-flash";
        MimeType["Flv"] = "video/x-flv";
        MimeType["Midi"] = "audio/midi";
        MimeType["Wma"] = "audio/x-ms-wma";
        MimeType["Wax"] = "audio/x-ms-wax";
        MimeType["Mka"] = "audio/x-matroska";
        MimeType["Mkv"] = "video/x-matroska";
        MimeType["Avi"] = "video/x-msvideo";
        MimeType["Mov"] = "video/quicktime";
        MimeType["Wmv"] = "video/x-ms-wmv";
        MimeType["M4a"] = "audio/mp4";
        MimeType["M4v"] = "video/mp4";
        MimeType["F4v"] = "video/mp4";
        MimeType["F4a"] = "audio/mp4";
        MimeType["F4b"] = "audio/mp4";
        MimeType["M4b"] = "audio/mp4";
        MimeType["M4r"] = "audio/mp4";
        MimeType["Mpga"] = "audio/mpeg";
        MimeType["Mp2"] = "audio/mpeg";
        MimeType["Mp2A"] = "audio/mpeg";
        MimeType["M2a"] = "audio/mpeg";
        MimeType["M3a"] = "audio/mpeg";
        MimeType["Oga"] = "audio/ogg";
    })(MimeType || (MimeType = {}));
    /**
     * This enum represents the available text encodings
     * @author akrck02
     */
    var TextEncoding;
    (function (TextEncoding) {
        TextEncoding["Utf8"] = "UTF-8";
        TextEncoding["Utf16"] = "UTF-16";
        TextEncoding["Utf16be"] = "UTF-16BE";
        TextEncoding["Utf16le"] = "UTF-16LE";
        TextEncoding["Iso88591"] = "ISO-8859-1";
        TextEncoding["Iso88592"] = "ISO-8859-2";
        TextEncoding["Iso88593"] = "ISO-8859-3";
        TextEncoding["Iso88594"] = "ISO-8859-4";
        TextEncoding["Iso88595"] = "ISO-8859-5";
        TextEncoding["Iso88596"] = "ISO-8859-6";
        TextEncoding["Iso88597"] = "ISO-8859-7";
        TextEncoding["Iso88598"] = "ISO-8859-8";
        TextEncoding["Iso88599"] = "ISO-8859-9";
        TextEncoding["Iso885910"] = "ISO-8859-10";
        TextEncoding["Iso885913"] = "ISO-8859-13";
        TextEncoding["Iso885914"] = "ISO-8859-14";
        TextEncoding["Iso885915"] = "ISO-8859-15";
        TextEncoding["Iso885916"] = "ISO-8859-16";
        TextEncoding["Koi8R"] = "KOI8-R";
        TextEncoding["Koi8U"] = "KOI8-U";
        TextEncoding["Macintosh"] = "macintosh";
        TextEncoding["Windows1250"] = "windows-1250";
        TextEncoding["Windows1251"] = "windows-1251";
        TextEncoding["Windows1252"] = "windows-1252";
        TextEncoding["Windows1253"] = "windows-1253";
        TextEncoding["Windows1254"] = "windows-1254";
        TextEncoding["Windows1255"] = "windows-1255";
        TextEncoding["Windows1256"] = "windows-1256";
        TextEncoding["Windows1257"] = "windows-1257";
        TextEncoding["Windows1258"] = "windows-1258";
        TextEncoding["Xmaccyrillic"] = "x-mac-cyrillic";
        TextEncoding["Gb18030"] = "GB18030";
        TextEncoding["Big5"] = "Big5";
        TextEncoding["Shiftjis"] = "Shift_JIS";
        TextEncoding["Eucjp"] = "EUC-JP";
        TextEncoding["Iso2022jp"] = "ISO-2022-JP";
        TextEncoding["Euckr"] = "EUC-KR";
        TextEncoding["Iso2022kr"] = "ISO-2022-KR";
        TextEncoding["Ibm866"] = "IBM866";
        TextEncoding["Ibm775"] = "IBM775";
        TextEncoding["Iso885911"] = "ISO-8859-11";
        TextEncoding["Windows874"] = "windows-874";
        TextEncoding["Tis620"] = "TIS-620";
    })(TextEncoding || (TextEncoding = {}));
    /**
     * Make a HTTP GET request.
     * @param request The request parameters.
     * @returns The promise of a response.
     */
    async function httpGet(request) {
        request.method = HttpMethod.Get;
        return httpRequest(request);
    }
    /**
     * Make a HTTP request.
     * @param request The request parameters.
     * @returns The promise of a response.
     */
    function httpRequest(request) {
        let options = {
            method: request.method || HttpMethod.Get,
            headers: {
                "Content-type": `${request.contentType || "application/json"};charset=${request.charset || "UTF-8"}`,
                "mode": "cors",
                "Sec-Fetch-Site": "cross-site",
            },
        };
        request.headers && Object.assign(options.headers, request.headers);
        if (HttpMethod.Get !== request.method) {
            if (request.parameters instanceof FormData) {
                options["body"] = request.parameters;
                options.headers["Content-type"] = `multipart/form-data;charset=${request.charset || "UTF-8"}`;
            }
            else {
                options["body"] = JSON.stringify(request.parameters);
            }
        }
        return fetch(request.url, options);
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

    class Theme {
        static toggle() {
            if (document.documentElement.dataset.theme == "dark") {
                setDomDataset(document.documentElement, { theme: "light" });
            }
            else {
                setDomDataset(document.documentElement, { theme: "dark" });
            }
        }
    }

    class HomeView {
        /**
         * Show home view
         */
        static async show(parameters, container) {
            const view = uiComponent({
                type: Html.View,
                id: HomeView.VIEW_ID,
                classes: [BubbleUI.BoxColumn, BubbleUI.BoxCenter],
            });
            const title = uiComponent({
                type: Html.H1,
                text: getConfiguration("base")["app_name"],
                styles: {
                    fontSize: "5rem",
                    marginBottom: "3rem",
                },
                selectable: false,
            });
            // Este hace toggle del tema
            // setDomEvents(view, {
            //   click: (e) => {
            //     Theme.toggle();
            //   },
            // });
            const description = uiComponent({
                type: Html.P,
                text: "my personal website.",
                selectable: false,
            });
            const button = uiComponent({
                type: Html.Button,
                text: "Clicker",
            });
            const gitButton = uiComponent({
                type: Html.Button,
                text: "",
            });
            const githubIcon = getIcon("social", "github", "24px", "var(--accent-color)");
            gitButton.appendChild(githubIcon);
            setDomEvents(button, {
                click: (e) => {
                    Theme.toggle();
                },
            });
            setDomEvents(gitButton, {
                click: (e) => {
                    window.open("https://github.com/Itros97", "_blank");
                },
            });
            const a = await HomeView.getDocumentHTML();
            uiComponent({
                text: MarkdownService.render(a),
            });
            //view.appendChild(doc);
            view.appendChild(title);
            view.appendChild(description);
            view.appendChild(button);
            view.appendChild(gitButton);
            container.appendChild(view);
        }
        static async getDocumentHTML() {
            const response = await httpGet({
                url: `${getConfiguration("path")["markdowns"]}/doc.MD`,
                parameters: {},
            });
            return await response.text();
        }
    }
    // HTML ids and classes
    HomeView.VIEW_ID = "home";

    /**
     * When the dynamic URL changes loads
     * the correspoding view from the URL
     */
    window.addEventListener("hashchange", start);
    /**
     * When the window is loaded load
     * the app state to show
     */
    window.onload = async function () {
        await loadConfiguration("gtdf.config.json");
        document.title = getConfiguration("base")["app_name"];
        Display.checkType();
        await loadIcons("material", `${getConfiguration("path")["icons"]}/materialicons.json`);
        await loadIcons("social", `${getConfiguration("path")["icons"]}/socialicons.json`);
        await start();
    };
    window.onresize = async function () {
        Display.checkType();
    };
    /** Start the web app     */
    async function start() {
        setRoute("", HomeView.show);
        //bsetNotFoundRoute();
        showRoute(window.location.hash.slice(1).toLowerCase(), document.body);
    }

})();

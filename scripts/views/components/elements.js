import { getConfiguration } from "../../lib/configuration.js";
import { setDomAttributes, setDomClasses } from "../../lib/dom.js";
/** Create an element whose text is set as plain text, never parsed as HTML. */
export function createTextElement(type, text, classes = []) {
    const element = document.createElement(type);
    element.textContent = text;
    setDomClasses(element, classes);
    return element;
}
/** Create a link; external links open in a new tab. */
export function createLink(text, href, classes = []) {
    const link = document.createElement("a");
    link.textContent = text;
    link.href = href;
    setDomClasses(link, classes);
    if (href.startsWith("http"))
        setDomAttributes(link, { target: "_blank", rel: "noopener noreferrer" });
    return link;
}
/** Create the root element of a page view. */
export function createPage(id) {
    const page = document.createElement("section");
    page.id = id;
    setDomClasses(page, ["page"]);
    return page;
}
/** Set the browser tab title, suffixed with the site name. */
export function setPageTitle(title) {
    const siteName = getConfiguration("base")["app_name"];
    document.title = title ? `${title} · ${siteName}` : siteName;
}
/** Create a page heading with an optional intro line. */
export function createPageHeader(title, intro) {
    const header = createTextElement("header", "", ["page-header"]);
    header.appendChild(createTextElement("h1", title));
    if (intro)
        header.appendChild(createTextElement("p", intro, ["page-intro"]));
    return header;
}
/** Create a section heading with an optional "see all" link on the right. */
export function createSectionHeader(title, link) {
    const header = createTextElement("div", "", ["section-header"]);
    header.appendChild(createTextElement("h2", title));
    if (link)
        header.appendChild(createLink(link.text, link.href, ["section-link"]));
    return header;
}
/** Create a muted message for empty lists. */
export function createEmptyState(text) {
    return createTextElement("p", text, ["state", "state-empty"]);
}
/** Create a visible error message for content that failed to load. */
export function createErrorState(text, error) {
    console.error(error);
    const element = createTextElement("p", text, ["state", "state-error"]);
    element.setAttribute("role", "alert");
    return element;
}

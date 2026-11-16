import { createLink, createPage, createPageHeader, setPageTitle } from "./components/elements.js";
import { TEXTS } from "./texts.js";
/** Page shown when no route matches. */
class NotFoundView {
    /** Show the not found view. */
    static async show(_parameters, container) {
        setPageTitle(TEXTS.NOT_FOUND_TITLE);
        const page = createPage(NotFoundView.VIEW_ID);
        page.appendChild(createPageHeader(TEXTS.NOT_FOUND_TITLE, TEXTS.NOT_FOUND_TEXT));
        page.appendChild(createLink(TEXTS.NOT_FOUND_LINK, "#/", ["back-link"]));
        container.appendChild(page);
    }
}
NotFoundView.VIEW_ID = "not-found";
export default NotFoundView;

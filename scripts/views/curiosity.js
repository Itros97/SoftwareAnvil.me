import { findBySlug } from "../lib/curiosities.js";
import { createLink, createPage, createPageHeader, setPageTitle } from "./components/elements.js";
import { CURIOSITIES } from "./curiosityregistry.js";
import NotFoundView from "./notfound.js";
import { getTexts } from "./texts.js";
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
export default CuriosityView;

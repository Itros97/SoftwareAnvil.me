import { createCollatzCard } from "./components/collatzcard.js";
import { createPage, createPageHeader, setPageTitle } from "./components/elements.js";
import { getTexts } from "./texts.js";
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
export default CuriositiesView;

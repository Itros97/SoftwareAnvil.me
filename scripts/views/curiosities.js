import { CATEGORY_ORDER, groupByCategory } from "../lib/curiosities.js";
import { createLink, createPage, createPageHeader, createSectionHeader, createTextElement, setPageTitle } from "./components/elements.js";
import { CURIOSITIES, getCategoryTitle } from "./curiosityregistry.js";
import { getTexts } from "./texts.js";
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
        const list = createTextElement("ul", "", ["entry-list"]);
        curiosities.forEach(curiosity => list.appendChild(CuriositiesView.createItem(curiosity)));
        section.appendChild(list);
        return section;
    }
    /** Create one row: title linking to the curiosity page, then its one-line summary. */
    static createItem(curiosity) {
        const texts = getTexts();
        const item = createTextElement("li", "", ["entry"]);
        const title = createTextElement("div", "", ["entry-title"]);
        title.appendChild(createLink(texts[curiosity.title], `#/curiosities/${curiosity.slug}`, ["entry-link"]));
        item.appendChild(title);
        item.appendChild(createTextElement("p", texts[curiosity.summary], ["entry-description"]));
        return item;
    }
}
CuriositiesView.VIEW_ID = "curiosities";
export default CuriositiesView;

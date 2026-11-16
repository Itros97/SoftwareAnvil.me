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
export default CuriositiesView;

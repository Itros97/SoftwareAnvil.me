import { CATEGORY_ORDER, CuriosityCategory, groupByCategory } from "../lib/curiosities.js"
import { createLink, createPage, createPageHeader, createSectionHeader, createTextElement, setPageTitle } from "./components/elements.js"
import { CURIOSITIES, Curiosity, getCategoryTitle } from "./curiosityregistry.js"
import { getTexts } from "./texts.js"

/** Index of the curiosities, grouped by category, each linking to its own page. */
export default class CuriositiesView {
	static readonly VIEW_ID = "curiosities"

	/** Show the curiosities index. */
	static async show(_parameters: string[], container: HTMLElement): Promise<void> {
		setPageTitle(getTexts().CURIOSITIES_TITLE)
		const page = createPage(CuriositiesView.VIEW_ID)
		page.appendChild(createPageHeader(getTexts().CURIOSITIES_TITLE, getTexts().CURIOSITIES_INTRO))
		groupByCategory<CuriosityCategory, Curiosity>(CURIOSITIES, CATEGORY_ORDER)
			.forEach(group => page.appendChild(CuriositiesView.createCategory(group.category, group.items)))
		container.appendChild(page)
	}

	/** Create one category section with the list of its curiosities. */
	private static createCategory(category: CuriosityCategory, curiosities: Curiosity[]): HTMLElement {
		const section = createTextElement("section", "", ["curiosity-category"])
		section.appendChild(createSectionHeader(getCategoryTitle(category)))
		const list = createTextElement("ul", "", ["entry-list"])
		curiosities.forEach(curiosity => list.appendChild(CuriositiesView.createItem(curiosity)))
		section.appendChild(list)
		return section
	}

	/** Create one row: title linking to the curiosity page, then its one-line summary. */
	private static createItem(curiosity: Curiosity): HTMLElement {
		const texts = getTexts()
		const item = createTextElement("li", "", ["entry"])
		const title = createTextElement("div", "", ["entry-title"])
		title.appendChild(createLink(texts[curiosity.title], `#/curiosities/${curiosity.slug}`, ["entry-link"]))
		item.appendChild(title)
		item.appendChild(createTextElement("p", texts[curiosity.summary], ["entry-description"]))
		return item
	}
}

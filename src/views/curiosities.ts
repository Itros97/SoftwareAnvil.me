import { createCollatzCard } from "./components/collatzcard.js"
import { createPage, createPageHeader, setPageTitle } from "./components/elements.js"
import { getTexts } from "./texts.js"

/** Every curiosity card, in the order they appear; add new ones here. */
const CURIOSITIES: Array<() => HTMLElement> = [createCollatzCard]

/** Page with small interactive experiments embedded in the site. */
export default class CuriositiesView {
	static readonly VIEW_ID = "curiosities"

	/** Show the curiosities view. */
	static async show(_parameters: string[], container: HTMLElement): Promise<void> {
		setPageTitle(getTexts().CURIOSITIES_TITLE)
		const page = createPage(CuriositiesView.VIEW_ID)
		page.appendChild(createPageHeader(getTexts().CURIOSITIES_TITLE, getTexts().CURIOSITIES_INTRO))
		CURIOSITIES.forEach(createCard => page.appendChild(createCard()))
		container.appendChild(page)
	}
}

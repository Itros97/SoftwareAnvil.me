import { createLink, createPage, createPageHeader, setPageTitle } from "./components/elements.js"
import { TEXTS } from "./texts.js"

/** Page shown when no route matches. */
export default class NotFoundView {
	static readonly VIEW_ID = "not-found"

	/** Show the not found view. */
	static async show(_parameters: string[], container: HTMLElement): Promise<void> {
		setPageTitle(TEXTS.NOT_FOUND_TITLE)
		const page = createPage(NotFoundView.VIEW_ID)
		page.appendChild(createPageHeader(TEXTS.NOT_FOUND_TITLE, TEXTS.NOT_FOUND_TEXT))
		page.appendChild(createLink(TEXTS.NOT_FOUND_LINK, "#/", ["back-link"]))
		container.appendChild(page)
	}
}

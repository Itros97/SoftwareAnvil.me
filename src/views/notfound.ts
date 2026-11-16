import { createLink, createPage, createPageHeader, setPageTitle } from "./components/elements.js"
import { getTexts } from "./texts.js"

/** Page shown when no route matches. */
export default class NotFoundView {
	static readonly VIEW_ID = "not-found"

	/** Show the not found view. */
	static async show(_parameters: string[], container: HTMLElement): Promise<void> {
		setPageTitle(getTexts().NOT_FOUND_TITLE)
		const page = createPage(NotFoundView.VIEW_ID)
		page.appendChild(createPageHeader(getTexts().NOT_FOUND_TITLE, getTexts().NOT_FOUND_TEXT))
		page.appendChild(createLink(getTexts().NOT_FOUND_LINK, "#/", ["back-link"]))
		container.appendChild(page)
	}
}

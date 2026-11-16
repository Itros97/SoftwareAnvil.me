import ContentService from "../services/contentservice.js"
import { createErrorState, createPage, createPageHeader, setPageTitle } from "./components/elements.js"
import { createFetchPanel } from "./components/fetchpanel.js"
import { getTexts } from "./texts.js"

/** Page showing the computer setup as a fastfetch-style terminal panel. */
export default class SetupView {
	static readonly VIEW_ID = "setup"

	/** Show the setup view. */
	static async show(_parameters: string[], container: HTMLElement): Promise<void> {
		setPageTitle(getTexts().SETUP_TITLE)
		const page = createPage(SetupView.VIEW_ID)
		page.appendChild(createPageHeader(getTexts().SETUP_TITLE, getTexts().SETUP_INTRO))
		container.appendChild(page)

		try {
			page.appendChild(createFetchPanel(await ContentService.getSetup()))
		} catch (error) {
			page.appendChild(createErrorState(getTexts().LOAD_ERROR, error))
		}
	}
}

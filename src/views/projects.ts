import ContentService from "../services/contentservice.js"
import { createErrorState, createPage, createPageHeader, setPageTitle } from "./components/elements.js"
import { createProjectList } from "./components/lists.js"
import { TEXTS } from "./texts.js"

/** Page listing every project. */
export default class ProjectsView {
	static readonly VIEW_ID = "projects"

	/** Show the projects view. */
	static async show(_parameters: string[], container: HTMLElement): Promise<void> {
		setPageTitle(TEXTS.PROJECTS_TITLE)
		const page = createPage(ProjectsView.VIEW_ID)
		page.appendChild(createPageHeader(TEXTS.PROJECTS_TITLE, TEXTS.PROJECTS_INTRO))
		container.appendChild(page)

		try {
			page.appendChild(createProjectList(await ContentService.getProjects()))
		} catch (error) {
			page.appendChild(createErrorState(TEXTS.LOAD_ERROR, error))
		}
	}
}

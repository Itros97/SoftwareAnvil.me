import ContentService from "../services/contentservice.js"
import { createErrorState, createPage, createPageHeader, setPageTitle } from "./components/elements.js"
import { createProjectList } from "./components/lists.js"
import { getTexts } from "./texts.js"

/** Page listing every project. */
export default class ProjectsView {
	static readonly VIEW_ID = "projects"

	/** Show the projects view. */
	static async show(_parameters: string[], container: HTMLElement): Promise<void> {
		setPageTitle(getTexts().PROJECTS_TITLE)
		const page = createPage(ProjectsView.VIEW_ID)
		page.appendChild(createPageHeader(getTexts().PROJECTS_TITLE, getTexts().PROJECTS_INTRO))
		container.appendChild(page)

		try {
			page.appendChild(createProjectList(await ContentService.getProjects()))
		} catch (error) {
			page.appendChild(createErrorState(getTexts().LOAD_ERROR, error))
		}
	}
}

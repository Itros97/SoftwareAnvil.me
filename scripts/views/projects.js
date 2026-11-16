import ContentService from "../services/contentservice.js";
import { createErrorState, createPage, createPageHeader, setPageTitle } from "./components/elements.js";
import { createProjectList } from "./components/lists.js";
import { getTexts } from "./texts.js";
/** Page listing every project. */
class ProjectsView {
    /** Show the projects view. */
    static async show(_parameters, container) {
        setPageTitle(getTexts().PROJECTS_TITLE);
        const page = createPage(ProjectsView.VIEW_ID);
        page.appendChild(createPageHeader(getTexts().PROJECTS_TITLE, getTexts().PROJECTS_INTRO));
        container.appendChild(page);
        try {
            page.appendChild(createProjectList(await ContentService.getProjects()));
        }
        catch (error) {
            page.appendChild(createErrorState(getTexts().LOAD_ERROR, error));
        }
    }
}
ProjectsView.VIEW_ID = "projects";
export default ProjectsView;

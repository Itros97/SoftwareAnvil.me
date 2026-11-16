import ContentService from "../services/contentservice.js";
import { createErrorState, createPage, createPageHeader, setPageTitle } from "./components/elements.js";
import { createPostList } from "./components/lists.js";
import { getTexts } from "./texts.js";
/** Page listing every post, newest first. */
class BlogView {
    /** Show the blog view. */
    static async show(_parameters, container) {
        setPageTitle(getTexts().BLOG_TITLE);
        const page = createPage(BlogView.VIEW_ID);
        page.appendChild(createPageHeader(getTexts().BLOG_TITLE, getTexts().BLOG_INTRO));
        container.appendChild(page);
        try {
            page.appendChild(createPostList(await ContentService.getPosts()));
        }
        catch (error) {
            page.appendChild(createErrorState(getTexts().LOAD_ERROR, error));
        }
    }
}
BlogView.VIEW_ID = "blog";
export default BlogView;

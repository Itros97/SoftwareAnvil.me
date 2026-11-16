import { findPostBySlug, formatPostDate } from "../lib/content.js";
import ContentService from "../services/contentservice.js";
import MarkdownService from "../services/markdownservice.js";
import { createErrorState, createLink, createPage, createTextElement, setPageTitle } from "./components/elements.js";
import NotFoundView from "./notfound.js";
import { TEXTS } from "./texts.js";
/** Page showing a single post. Expects the post slug as the first route parameter. */
class PostView {
    /** Show the post view, or the not found view when the slug is unknown. */
    static async show(parameters, container) {
        const page = createPage(PostView.VIEW_ID);
        container.appendChild(page);
        try {
            const post = findPostBySlug(await ContentService.getPosts(), parameters[0] ?? "");
            if (!post) {
                page.remove();
                await NotFoundView.show([], container);
                return;
            }
            setPageTitle(post.title);
            const body = await ContentService.getPostBody(post);
            page.appendChild(createLink(TEXTS.BACK_TO_BLOG, "#/blog", ["back-link"]));
            page.appendChild(PostView.createHeader(post.title, post.date));
            const article = createTextElement("article", "", ["markdown"]);
            article.innerHTML = MarkdownService.render(body);
            page.appendChild(article);
        }
        catch (error) {
            page.appendChild(createErrorState(TEXTS.LOAD_ERROR, error));
        }
    }
    /** Create the post title and date. */
    static createHeader(title, isoDate) {
        const header = createTextElement("header", "", ["page-header"]);
        header.appendChild(createTextElement("h1", title));
        const date = createTextElement("time", formatPostDate(isoDate, TEXTS.LOCALE), ["page-intro"]);
        date.setAttribute("datetime", isoDate);
        header.appendChild(date);
        return header;
    }
}
PostView.VIEW_ID = "post";
export default PostView;

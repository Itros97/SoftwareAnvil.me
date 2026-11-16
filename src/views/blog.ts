import ContentService from "../services/contentservice.js"
import { createErrorState, createPage, createPageHeader, setPageTitle } from "./components/elements.js"
import { createPostList } from "./components/lists.js"
import { getTexts } from "./texts.js"

/** Page listing every post, newest first. */
export default class BlogView {
	static readonly VIEW_ID = "blog"

	/** Show the blog view. */
	static async show(_parameters: string[], container: HTMLElement): Promise<void> {
		setPageTitle(getTexts().BLOG_TITLE)
		const page = createPage(BlogView.VIEW_ID)
		page.appendChild(createPageHeader(getTexts().BLOG_TITLE, getTexts().BLOG_INTRO))
		container.appendChild(page)

		try {
			page.appendChild(createPostList(await ContentService.getPosts()))
		} catch (error) {
			page.appendChild(createErrorState(getTexts().LOAD_ERROR, error))
		}
	}
}

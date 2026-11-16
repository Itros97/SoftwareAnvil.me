import { takeFeatured } from "../lib/content.js"
import ContentService from "../services/contentservice.js"
import MarkdownService from "../services/markdownservice.js"
import { createErrorState, createPage, createSectionHeader, createTextElement, setPageTitle } from "./components/elements.js"
import { createPostList, createProjectList } from "./components/lists.js"
import { getTexts } from "./texts.js"

/** Landing page: greeting, about me, featured projects and latest posts. */
export default class HomeView {
	static readonly VIEW_ID = "home"
	static readonly PREVIEW_LIMIT = 3

	/** Show the home view. */
	static async show(_parameters: string[], container: HTMLElement): Promise<void> {
		setPageTitle()
		const page = createPage(HomeView.VIEW_ID)
		container.appendChild(page)

		try {
			const [profile, about, projects, posts] = await Promise.all([
				ContentService.getProfile(),
				ContentService.getAbout(),
				ContentService.getProjects(),
				ContentService.getPosts(),
			])

			page.appendChild(HomeView.createHero(profile.headline, profile.tagline))
			page.appendChild(HomeView.createAbout(about))
			page.appendChild(HomeView.createSection(getTexts().PROJECTS_TITLE, "#/projects", createProjectList(takeFeatured(projects, HomeView.PREVIEW_LIMIT))))
			page.appendChild(HomeView.createSection(getTexts().LATEST_POSTS_TITLE, "#/blog", createPostList(posts.slice(0, HomeView.PREVIEW_LIMIT))))
		} catch (error) {
			page.appendChild(createErrorState(getTexts().LOAD_ERROR, error))
		}
	}

	/** Create the big greeting at the top of the page. */
	private static createHero(headline: string, tagline: string): HTMLElement {
		const hero = createTextElement("header", "", ["hero"])
		hero.appendChild(createTextElement("h1", headline, ["hero-title"]))
		hero.appendChild(createTextElement("p", tagline, ["hero-tagline"]))
		return hero
	}

	/** Create the "about me" section from its markdown. */
	private static createAbout(markdown: string): HTMLElement {
		const section = createTextElement("section", "", ["home-section"])
		section.appendChild(createSectionHeader(getTexts().ABOUT_TITLE))
		const body = createTextElement("div", "", ["markdown"])
		body.innerHTML = MarkdownService.render(markdown)
		section.appendChild(body)
		return section
	}

	/** Create a preview section with a "see all" link. */
	private static createSection(title: string, href: string, content: HTMLElement): HTMLElement {
		const section = createTextElement("section", "", ["home-section"])
		section.appendChild(createSectionHeader(title, { text: getTexts().SEE_ALL, href }))
		section.appendChild(content)
		return section
	}
}

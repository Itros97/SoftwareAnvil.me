import { Post, Project, formatPostDate } from "../../lib/content.js"
import { getTexts } from "../texts.js"
import { createEmptyState, createLink, createTextElement } from "./elements.js"

/** Create the list of projects, or an empty state when there are none. */
export function createProjectList(projects: Project[]): HTMLElement {
	if (projects.length == 0) return createEmptyState(getTexts().NO_PROJECTS)

	const list = createTextElement("ul", "", ["entry-list"])
	projects.forEach(project => list.appendChild(createProjectItem(project)))
	return list
}

/** Create the list of posts, or an empty state when there are none. */
export function createPostList(posts: Post[]): HTMLElement {
	if (posts.length == 0) return createEmptyState(getTexts().NO_POSTS)

	const list = createTextElement("ul", "", ["entry-list"])
	posts.forEach(post => list.appendChild(createPostItem(post)))
	return list
}

/** Create one project row: name and year, description, tags. */
function createProjectItem(project: Project): HTMLElement {
	const item = createTextElement("li", "", ["entry"])
	const title = createTextElement("div", "", ["entry-title"])
	title.appendChild(createLink(project.name, project.url, ["entry-link"]))
	title.appendChild(createTextElement("span", String(project.year), ["entry-meta"]))
	item.appendChild(title)
	item.appendChild(createTextElement("p", project.description, ["entry-description"]))

	const tags = createTextElement("div", "", ["entry-tags"])
	project.tags.forEach(tag => tags.appendChild(createTextElement("span", tag, ["tag"])))
	item.appendChild(tags)
	return item
}

/** Create one post row: title and date, summary. */
function createPostItem(post: Post): HTMLElement {
	const item = createTextElement("li", "", ["entry"])
	const title = createTextElement("div", "", ["entry-title"])
	title.appendChild(createLink(post.title, `#/blog/${post.slug}`, ["entry-link"]))
	const date = createTextElement("time", formatPostDate(post.date, getTexts().LOCALE), ["entry-meta"])
	date.setAttribute("datetime", post.date)
	title.appendChild(date)
	item.appendChild(title)
	item.appendChild(createTextElement("p", post.summary, ["entry-description"]))
	return item
}

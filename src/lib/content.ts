/** A project shown in the projects list. */
export interface Project {
	name: string
	description: string
	url: string
	tags: string[]
	year: number
	featured: boolean
}

/** A blog post entry from the posts index. The body lives in posts/<slug>.md. */
export interface Post {
	slug: string
	title: string
	date: string
	summary: string
}

/** A social or contact link shown in the footer. */
export interface Social {
	id: string
	label: string
	url: string
}

/** The site owner's public profile. */
export interface Profile {
	name: string
	headline: string
	tagline: string
	socials: Social[]
}

/** Return a copy of the posts sorted from newest to oldest. */
export function sortPostsByDate(posts: Post[]): Post[] {
	return [...posts].sort((a, b) => b.date.localeCompare(a.date))
}

/** Find the post with the given slug. */
export function findPostBySlug(posts: Post[], slug: string): Post | undefined {
	return posts.find(post => post.slug == slug)
}

/** Return up to `limit` featured projects, keeping their original order. */
export function takeFeatured(projects: Project[], limit: number): Project[] {
	return projects.filter(project => project.featured).slice(0, limit)
}

/** Format an ISO date (YYYY-MM-DD) as a short human date in the given locale. */
export function formatPostDate(isoDate: string, locale: string): string {
	const [year, month, day] = isoDate.split("-").map(Number)

	// Build the date in local time so the day never shifts with the timezone
	const date = new Date(year, month - 1, day)
	return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
}

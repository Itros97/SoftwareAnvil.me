import { CuriosityCategory } from "../lib/curiosities.js"
import { createCollatzExplorer } from "./components/collatzexplorer.js"
import { Texts, getTexts } from "./texts.js"

/** One curiosity: where it is listed, its texts and the interactive content of its page. */
export interface Curiosity {
	slug: string
	category: CuriosityCategory
	title: keyof Texts
	summary: keyof Texts
	description: keyof Texts
	createContent: () => HTMLElement
}

/** Every curiosity, in the order they are listed inside their category; add new ones here. */
export const CURIOSITIES: Curiosity[] = [
	{
		slug: "collatz",
		category: "math",
		title: "COLLATZ_TITLE",
		summary: "COLLATZ_SUMMARY",
		description: "COLLATZ_DESCRIPTION",
		createContent: createCollatzExplorer,
	},
]

/** Text key of each category heading. */
const CATEGORY_TITLES: Record<CuriosityCategory, keyof Texts> = {
	math: "CATEGORY_MATH",
}

/** The heading of a category in the current language. */
export function getCategoryTitle(category: CuriosityCategory): string {
	return getTexts()[CATEGORY_TITLES[category]]
}

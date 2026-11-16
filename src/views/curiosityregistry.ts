import { CuriosityCategory } from "../lib/curiosities.js"
import { createCollatzExplorer } from "./components/collatzexplorer.js"
import { createCompilerExplorer } from "./components/compilerexplorer.js"
import { createPrimesExplorer } from "./components/primesexplorer.js"
import { createRectifierExplorer } from "./components/rectifierexplorer.js"
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
	{
		slug: "primes",
		category: "math",
		title: "PRIMES_TITLE",
		summary: "PRIMES_SUMMARY",
		description: "PRIMES_DESCRIPTION",
		createContent: createPrimesExplorer,
	},
	{
		slug: "rectifier",
		category: "physics",
		title: "RECT_TITLE",
		summary: "RECT_SUMMARY",
		description: "RECT_DESCRIPTION",
		createContent: createRectifierExplorer,
	},
	{
		slug: "compiler",
		category: "programming",
		title: "COMPILER_TITLE",
		summary: "COMPILER_SUMMARY",
		description: "COMPILER_DESCRIPTION",
		createContent: createCompilerExplorer,
	},
]

/** Text key of each category heading. */
const CATEGORY_TITLES: Record<CuriosityCategory, keyof Texts> = {
	math: "CATEGORY_MATH",
	physics: "CATEGORY_PHYSICS",
	programming: "CATEGORY_PROGRAMMING",
}

/** The heading of a category in the current language. */
export function getCategoryTitle(category: CuriosityCategory): string {
	return getTexts()[CATEGORY_TITLES[category]]
}

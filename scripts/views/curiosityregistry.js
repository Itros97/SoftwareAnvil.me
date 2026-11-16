import { createCollatzExplorer } from "./components/collatzexplorer.js";
import { getTexts } from "./texts.js";
/** Every curiosity, in the order they are listed inside their category; add new ones here. */
export const CURIOSITIES = [
    {
        slug: "collatz",
        category: "math",
        title: "COLLATZ_TITLE",
        summary: "COLLATZ_SUMMARY",
        description: "COLLATZ_DESCRIPTION",
        createContent: createCollatzExplorer,
    },
];
/** Text key of each category heading. */
const CATEGORY_TITLES = {
    math: "CATEGORY_MATH",
};
/** The heading of a category in the current language. */
export function getCategoryTitle(category) {
    return getTexts()[CATEGORY_TITLES[category]];
}

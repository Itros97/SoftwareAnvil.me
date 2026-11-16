/** The groups curiosities are listed under. */
export type CuriosityCategory = "math"

/** Order in which categories appear on the index. */
export const CATEGORY_ORDER: CuriosityCategory[] = ["math"]

/** Items that share a category, in their original order. */
export interface CategoryGroup<Category, Item> {
	category: Category
	items: Item[]
}

/** Group items by category following the given order; categories without items are left out. */
export function groupByCategory<Category, Item extends { category: Category }>(items: Item[], order: Category[]): CategoryGroup<Category, Item>[] {
	return order
		.map(category => ({ category, items: items.filter(item => item.category == category) }))
		.filter(group => group.items.length > 0)
}

/** Find the item with the given slug, if any. */
export function findBySlug<Item extends { slug: string }>(items: Item[], slug: string): Item | undefined {
	return items.find(item => item.slug == slug)
}

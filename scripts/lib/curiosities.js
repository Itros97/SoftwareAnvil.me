/** Order in which categories appear on the index. */
export const CATEGORY_ORDER = ["math"];
/** Group items by category following the given order; categories without items are left out. */
export function groupByCategory(items, order) {
    return order
        .map(category => ({ category, items: items.filter(item => item.category == category) }))
        .filter(group => group.items.length > 0);
}
/** Find the item with the given slug, if any. */
export function findBySlug(items, slug) {
    return items.find(item => item.slug == slug);
}

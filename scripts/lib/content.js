/** Return a copy of the posts sorted from newest to oldest. */
export function sortPostsByDate(posts) {
    return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}
/** Find the post with the given slug. */
export function findPostBySlug(posts, slug) {
    return posts.find(post => post.slug == slug);
}
/** Return up to `limit` featured projects, keeping their original order. */
export function takeFeatured(projects, limit) {
    return projects.filter(project => project.featured).slice(0, limit);
}
/** Format an ISO date (YYYY-MM-DD) as a short human date in the given locale. */
export function formatPostDate(isoDate, locale) {
    const [year, month, day] = isoDate.split("-").map(Number);
    // Build the date in local time so the day never shifts with the timezone
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

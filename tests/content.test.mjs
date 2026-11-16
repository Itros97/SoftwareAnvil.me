import { test } from "node:test"
import assert from "node:assert/strict"
import { findPostBySlug, formatPostDate, sortPostsByDate, takeFeatured } from "../scripts/lib/content.js"

const post = (slug, date) => ({ slug, title: slug, date, summary: "" })
const project = (name, featured) => ({ name, description: "", url: "", tags: [], year: 2025, featured })

test("sortPostsByDate puts the most recent post first", () => {
	const sorted = sortPostsByDate([post("old", "2024-01-10"), post("new", "2025-06-01"), post("mid", "2024-12-31")])
	assert.deepEqual(sorted.map(p => p.slug), ["new", "mid", "old"])
})

test("sortPostsByDate does not mutate the original array", () => {
	const posts = [post("old", "2024-01-10"), post("new", "2025-06-01")]
	sortPostsByDate(posts)
	assert.deepEqual(posts.map(p => p.slug), ["old", "new"])
})

test("findPostBySlug returns the matching post", () => {
	assert.equal(findPostBySlug([post("a", "2025-01-01"), post("b", "2025-01-02")], "b")?.slug, "b")
})

test("findPostBySlug returns undefined when the slug does not exist", () => {
	assert.equal(findPostBySlug([post("a", "2025-01-01")], "missing"), undefined)
})

test("takeFeatured returns only featured projects within the limit", () => {
	const projects = [project("a", true), project("b", false), project("c", true), project("d", true)]
	assert.deepEqual(takeFeatured(projects, 2).map(p => p.name), ["a", "c"])
})

test("takeFeatured returns an empty list when nothing is featured", () => {
	assert.deepEqual(takeFeatured([project("a", false)], 3), [])
})

test("formatPostDate keeps the calendar day regardless of timezone", () => {
	assert.match(formatPostDate("2025-03-07", "en-US"), /Mar 7, 2025/)
})

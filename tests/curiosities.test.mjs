import { test } from "node:test"
import assert from "node:assert/strict"
import { findBySlug, groupByCategory } from "../scripts/lib/curiosities.js"

const ITEMS = [
	{ slug: "pendulum", category: "physics" },
	{ slug: "collatz", category: "math" },
	{ slug: "primes", category: "math" },
]

test("groupByCategory follows the category order and keeps item order inside each group", () => {
	assert.deepEqual(groupByCategory(ITEMS, ["math", "physics"]), [
		{ category: "math", items: [ITEMS[1], ITEMS[2]] },
		{ category: "physics", items: [ITEMS[0]] },
	])
})

test("groupByCategory leaves out categories without items", () => {
	assert.deepEqual(groupByCategory(ITEMS.slice(1), ["math", "physics"]), [
		{ category: "math", items: [ITEMS[1], ITEMS[2]] },
	])
})

test("findBySlug returns the item with that slug", () => {
	assert.equal(findBySlug(ITEMS, "primes"), ITEMS[2])
})

test("findBySlug returns undefined for an unknown or empty slug", () => {
	assert.equal(findBySlug(ITEMS, "unknown"), undefined)
	assert.equal(findBySlug(ITEMS, ""), undefined)
})

import { test } from "node:test"
import assert from "node:assert/strict"
import { collatzSequence, previewSequence, summarizeSequence, verifyRange } from "../scripts/lib/collatz.js"
import { parseBoundedInteger } from "../scripts/lib/numberinput.js"

test("collatzSequence of 1 is just 1", () => {
	assert.deepEqual(collatzSequence(1), [1])
})

test("collatzSequence of 6 halves evens and triples odds until 1", () => {
	assert.deepEqual(collatzSequence(6), [6, 3, 10, 5, 16, 8, 4, 2, 1])
})

test("collatzSequence throws with context when the step limit is exceeded", () => {
	assert.throws(() => collatzSequence(27, 10), /27.*10 steps/)
})

test("summarizeSequence reports 111 steps and a peak of 9232 for 27", () => {
	assert.deepEqual(summarizeSequence(collatzSequence(27)), { steps: 111, peak: 9232 })
})

test("verifyRange checks every number and finds the one with most steps", () => {
	assert.deepEqual(verifyRange(10), { checked: 10, longest: { n: 9, steps: 19 } })
})

test("verifyRange finds 77031 as the longest below 100000", () => {
	assert.deepEqual(verifyRange(100_000).longest, { n: 77031, steps: 350 })
})

test("previewSequence keeps short sequences whole", () => {
	assert.deepEqual(previewSequence([6, 3, 10], 2), [6, 3, 10])
})

test("previewSequence keeps both ends of long sequences around a gap", () => {
	assert.deepEqual(previewSequence([1, 2, 3, 4, 5, 6], 2), [1, 2, null, 5, 6])
})

test("parseBoundedInteger accepts integers inside the bounds", () => {
	assert.equal(parseBoundedInteger(" 27 ", 1, 100), 27)
	assert.equal(parseBoundedInteger("1", 1, 100), 1)
	assert.equal(parseBoundedInteger("100", 1, 100), 100)
})

test("parseBoundedInteger rejects empty input", () => {
	assert.deepEqual(parseBoundedInteger("  ", 1, 100), { error: "empty" })
})

test("parseBoundedInteger rejects decimals and text", () => {
	assert.deepEqual(parseBoundedInteger("2.5", 1, 100), { error: "not-integer" })
	assert.deepEqual(parseBoundedInteger("abc", 1, 100), { error: "not-integer" })
	assert.deepEqual(parseBoundedInteger("1e3", 1, 10_000), { error: "not-integer" })
})

test("parseBoundedInteger rejects zero, negatives and values above the maximum", () => {
	assert.deepEqual(parseBoundedInteger("0", 1, 100), { error: "out-of-range" })
	assert.deepEqual(parseBoundedInteger("-4", 1, 100), { error: "out-of-range" })
	assert.deepEqual(parseBoundedInteger("101", 1, 100), { error: "out-of-range" })
})

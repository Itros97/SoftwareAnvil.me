import { test } from "node:test"
import assert from "node:assert/strict"
import { primesUpTo, sieveSteps, ulamPath } from "../scripts/lib/primes.js"

test("primesUpTo lists the primes up to 30", () => {
	assert.deepEqual(primesUpTo(30), [2, 3, 5, 7, 11, 13, 17, 19, 23, 29])
})

test("primesUpTo finds 46 primes up to 200", () => {
	assert.equal(primesUpTo(200).length, 46)
})

test("primesUpTo is empty below 2", () => {
	assert.deepEqual(primesUpTo(1), [])
})

test("sieveSteps crosses only the multiples not crossed before, starting at p squared", () => {
	assert.deepEqual(sieveSteps(30), [
		{ prime: 2, crossed: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30] },
		{ prime: 3, crossed: [9, 15, 21, 27] },
		{ prime: 5, crossed: [25] },
	])
})

test("ulamPath walks right, up, left, down in a growing spiral", () => {
	assert.deepEqual(ulamPath(10), [
		{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: -1 }, { x: -1, y: -1 },
		{ x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
	])
})

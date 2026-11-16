import { test } from "node:test"
import assert from "node:assert/strict"
import { calculateWpm, compareInput, pickNextCommand } from "../scripts/lib/typinggame.js"

test("compareInput counts the correct characters from the start", () => {
	assert.deepEqual(compareInput("git push", "git p"), { correct: 5, hasError: false, complete: false })
})

test("compareInput flags an error as soon as a character does not match", () => {
	assert.deepEqual(compareInput("git push", "gti"), { correct: 1, hasError: true, complete: false })
})

test("compareInput marks complete only when the input equals the target", () => {
	assert.equal(compareInput("ls -la", "ls -la").complete, true)
	assert.equal(compareInput("ls -la", "ls -la ").complete, false)
	assert.equal(compareInput("ls -la", "ls -la ").hasError, true)
})

test("calculateWpm returns 0 when no time has passed", () => {
	assert.equal(calculateWpm(40, 0), 0)
})

test("calculateWpm uses five characters per word", () => {
	assert.equal(calculateWpm(50, 60_000), 10)
})

test("pickNextCommand never repeats the previous command", () => {
	const commands = ["a", "b", "c"]
	for (const value of [0, 0.34, 0.5, 0.67, 0.99]) {
		assert.notEqual(pickNextCommand(commands, "b", () => value), "b")
	}
})

test("pickNextCommand returns the only command when there is just one", () => {
	assert.equal(pickNextCommand(["only"], "only", () => 0.5), "only")
})

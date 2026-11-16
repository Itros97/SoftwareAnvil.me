import { test } from "node:test"
import assert from "node:assert/strict"
import { tokenize } from "../scripts/lib/expression/lexer.js"
import { parse } from "../scripts/lib/expression/parser.js"
import { compile } from "../scripts/lib/expression/compiler.js"
import { run } from "../scripts/lib/expression/vm.js"
import { CompileError } from "../scripts/lib/expression/errors.js"
import { formatInstruction, formatTree } from "../scripts/lib/expression/format.js"

/** Run the whole pipeline on a source text. */
function evaluate(source) {
	return run(compile(parse(tokenize(source))))
}

test("tokenize splits numbers and operators keeping their positions", () => {
	assert.deepEqual(tokenize("0.1+ 0.2"), [
		{ type: "number", text: "0.1", position: 0 },
		{ type: "operator", text: "+", position: 3 },
		{ type: "number", text: "0.2", position: 5 },
	])
})

test("multiplication binds tighter than addition", () => {
	assert.equal(evaluate("1 + 2 * 3"), 7)
	assert.equal(evaluate("(1 + 2) * 3"), 9)
})

test("power is right associative", () => {
	assert.equal(evaluate("2 ^ 3 ^ 2"), 512)
})

test("unary minus binds looser than power", () => {
	assert.equal(evaluate("-2 ^ 2"), -4)
	assert.equal(evaluate("2 ^ -1"), 0.5)
})

test("floating point quirks come through unchanged", () => {
	assert.equal(evaluate("0.1 + 0.2"), 0.30000000000000004)
	assert.equal(evaluate("1 / 0"), Infinity)
	assert.ok(Number.isNaN(evaluate("0 / 0")))
	assert.equal(evaluate("2 ^ 53 + 1"), 9007199254740992)
	assert.equal(evaluate("7 % -3"), 1)
})

test("compile emits stack instructions in postfix order", () => {
	assert.deepEqual(compile(parse(tokenize("1 + 2 * -3"))), [
		{ op: "PUSH", value: 1 },
		{ op: "PUSH", value: 2 },
		{ op: "PUSH", value: 3 },
		{ op: "NEG" },
		{ op: "MUL" },
		{ op: "ADD" },
	])
})

/** Assert that compiling a source fails with the given code at the given position. */
function assertCompileError(source, code, position) {
	assert.throws(() => parse(tokenize(source)), error => {
		assert.ok(error instanceof CompileError)
		assert.equal(error.code, code)
		assert.equal(error.position, position)
		return true
	})
}

test("syntax errors report what went wrong and where", () => {
	assertCompileError("", "empty", 0)
	assertCompileError("1 +", "unexpected-end", 3)
	assertCompileError("(1", "missing-paren", 2)
	assertCompileError("1 $", "unexpected-char", 2)
	assertCompileError("1 2", "unexpected-token", 2)
	assertCompileError("1)", "unexpected-token", 1)
	assertCompileError("1" + "+1".repeat(100), "too-long", 200)
})

test("formatTree draws operators above their operands", () => {
	assert.deepEqual(formatTree(parse(tokenize("1 + -2 * 3"))), [
		"+",
		"├─ 1",
		"└─ *",
		"   ├─ neg",
		"   │  └─ 2",
		"   └─ 3",
	])
})

test("formatInstruction writes the operand only for PUSH", () => {
	assert.equal(formatInstruction({ op: "PUSH", value: 0.5 }), "PUSH 0.5")
	assert.equal(formatInstruction({ op: "ADD" }), "ADD")
})

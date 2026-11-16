import { CompileError } from "./errors.js"

/** Longest source the compiler accepts, to keep the views readable. */
export const MAX_SOURCE_LENGTH = 200

/** A piece of source text: a number, an operator or a parenthesis. */
export interface Token {
	type: "number" | "operator" | "paren"
	text: string
	position: number
}

const TOKEN_PATTERN = /\s*(?:(\d+(?:\.\d+)?|\.\d+)|([+\-*/%^])|([()]))/y

/** Split a source text into tokens, failing on any character that is not part of the language. */
export function tokenize(source: string): Token[] {
	if (source.length > MAX_SOURCE_LENGTH) throw new CompileError("too-long", MAX_SOURCE_LENGTH)

	const tokens: Token[] = []
	let index = 0
	while (index < source.trimEnd().length) {
		TOKEN_PATTERN.lastIndex = index
		const match = TOKEN_PATTERN.exec(source)
		if (!match) throw new CompileError("unexpected-char", firstNonSpace(source, index))

		const [whole, number, operator, paren] = match
		const position = index + whole.length - (number ?? operator ?? paren).length
		if (number) tokens.push({ type: "number", text: number, position })
		else if (operator) tokens.push({ type: "operator", text: operator, position })
		else tokens.push({ type: "paren", text: paren, position })
		index += whole.length
	}
	return tokens
}

/** Position of the first non-space character from index on. */
function firstNonSpace(source: string, index: number): number {
	while (/\s/.test(source[index] ?? "")) index++
	return index
}

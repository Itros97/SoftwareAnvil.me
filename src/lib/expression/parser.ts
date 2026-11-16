import { CompileError } from "./errors.js"
import { Token } from "./lexer.js"

/** Operators that take two operands. */
export type BinaryOperator = "+" | "-" | "*" | "/" | "%" | "^"

/** A node of the syntax tree. */
export type SyntaxNode =
	| { type: "number", value: number }
	| { type: "negate", operand: SyntaxNode }
	| { type: "binary", operator: BinaryOperator, left: SyntaxNode, right: SyntaxNode }

/** How tightly each binary operator holds its operands; higher wins. */
const BINDING_POWER: Record<BinaryOperator, number> = { "+": 10, "-": 10, "*": 20, "/": 20, "%": 20, "^": 40 }

/** Unary minus sits between products and powers, so -2^2 is -(2^2). */
const NEGATE_POWER = 30

/** Build the syntax tree of a token list with a Pratt parser. */
export function parse(tokens: Token[]): SyntaxNode {
	if (tokens.length == 0) throw new CompileError("empty", 0)
	const last = tokens[tokens.length - 1]
	const end = last.position + last.text.length

	let index = 0
	const peek = (): Token | undefined => tokens[index]
	const next = (): Token => {
		const token = tokens[index++]
		if (!token) throw new CompileError("unexpected-end", end)
		return token
	}

	/** Parse an operand: a number, a negation or a parenthesised expression. */
	const parsePrefix = (): SyntaxNode => {
		const token = next()
		if (token.type == "number") return { type: "number", value: Number(token.text) }
		if (token.text == "-") return { type: "negate", operand: parseExpression(NEGATE_POWER) }
		if (token.text != "(") throw new CompileError("unexpected-token", token.position)

		const inner = parseExpression(0)
		const closing = peek()
		if (!closing) throw new CompileError("missing-paren", end)
		if (closing.text != ")") throw new CompileError("unexpected-token", closing.position)
		index++
		return inner
	}

	/** Parse operators while they bind tighter than minPower. */
	const parseExpression = (minPower: number): SyntaxNode => {
		let left = parsePrefix()
		for (let token = peek(); token && token.text != ")"; token = peek()) {
			if (token.type != "operator") throw new CompileError("unexpected-token", token.position)
			const operator = token.text as BinaryOperator
			const power = BINDING_POWER[operator]
			if (power <= minPower) break
			index++
			// Power is right associative: 2^3^2 is 2^(3^2)
			const right = parseExpression(operator == "^" ? power - 1 : power)
			left = { type: "binary", operator, left, right }
		}
		return left
	}

	const tree = parseExpression(0)
	const leftover = peek()
	if (leftover) throw new CompileError("unexpected-token", leftover.position)
	return tree
}

import { BinaryOperator, SyntaxNode } from "./parser.js"

/** Opcodes that pop two values and push the result. */
export type BinaryOpcode = "ADD" | "SUB" | "MUL" | "DIV" | "MOD" | "POW"

/** One instruction of the stack machine. */
export type Instruction =
	| { op: "PUSH", value: number }
	| { op: "NEG" }
	| { op: BinaryOpcode }

const OPCODES: Record<BinaryOperator, BinaryOpcode> = { "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV", "%": "MOD", "^": "POW" }

/** Turn a syntax tree into stack instructions: operands first, then the operation (postfix order). */
export function compile(node: SyntaxNode): Instruction[] {
	switch (node.type) {
		case "number": return [{ op: "PUSH", value: node.value }]
		case "negate": return [...compile(node.operand), { op: "NEG" }]
		case "binary": return [...compile(node.left), ...compile(node.right), { op: OPCODES[node.operator] }]
	}
}

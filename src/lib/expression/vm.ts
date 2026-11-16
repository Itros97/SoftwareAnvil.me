import { BinaryOpcode, Instruction } from "./compiler.js"

const OPERATIONS: Record<BinaryOpcode, (left: number, right: number) => number> = {
	ADD: (left, right) => left + right,
	SUB: (left, right) => left - right,
	MUL: (left, right) => left * right,
	DIV: (left, right) => left / right,
	MOD: (left, right) => left % right,
	POW: (left, right) => Math.pow(left, right),
}

/** Execute stack instructions and return the single value left on the stack. */
export function run(instructions: Instruction[]): number {
	const stack: number[] = []
	const pop = (): number => {
		const value = stack.pop()
		if (value === undefined) throw new Error("Stack underflow: the program pops more values than it pushes")
		return value
	}

	for (const instruction of instructions) {
		if (instruction.op == "PUSH") stack.push(instruction.value)
		else if (instruction.op == "NEG") stack.push(-pop())
		else {
			const right = pop()
			stack.push(OPERATIONS[instruction.op](pop(), right))
		}
	}
	if (stack.length != 1) throw new Error(`Program left ${stack.length} values on the stack instead of 1`)
	return stack[0]
}

/** What kind of mistake the source has. */
export type CompileErrorCode = "empty" | "too-long" | "unexpected-char" | "unexpected-token" | "unexpected-end" | "missing-paren"

/** A syntax error with the position in the source where it was found. */
export class CompileError extends Error {
	readonly code: CompileErrorCode
	readonly position: number

	constructor(code: CompileErrorCode, position: number) {
		super(`${code} at position ${position}`)
		this.name = "CompileError"
		this.code = code
		this.position = position
	}
}

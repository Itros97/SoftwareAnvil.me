/** Why a text input could not be read as a bounded integer. */
export interface InputError {
	error: "empty" | "not-integer" | "out-of-range"
}

/** Read a whole number written in plain digits that must lie within [min, max]. */
export function parseBoundedInteger(input: string, min: number, max: number): number | InputError {
	const text = input.trim()
	if (!text) return { error: "empty" }
	if (!/^-?\d+$/.test(text)) return { error: "not-integer" }

	const value = Number(text)
	if (value < min || value > max) return { error: "out-of-range" }
	return value
}

/** Tell apart a parsed number from an input error. */
export function isInputError(result: number | InputError): result is InputError {
	return typeof result != "number"
}

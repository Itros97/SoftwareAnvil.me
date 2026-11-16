import { InputError, isInputError, parseBoundedInteger } from "../../lib/numberinput.js"
import { fillText, getTexts } from "../texts.js"
import { createTextElement } from "./elements.js"

/** What a number form asks for and what it does with a valid number. */
export interface NumberFormOptions {
	label: string
	button: string
	min: number
	max: number
	initial: number
	onSubmit: (value: number) => void
}

/** A number form plus a way to fill it in and submit it from outside, e.g. from example buttons. */
export interface NumberForm {
	element: HTMLFormElement
	submitValue: (value: number) => void
}

/** Create an inline form that validates a bounded integer and reports errors under the field. */
export function createNumberForm(options: NumberFormOptions): NumberForm {
	const form = document.createElement("form")
	form.classList.add("number-form")
	form.noValidate = true

	const label = createTextElement("label", options.label, ["number-form-label"])
	const input = document.createElement("input")
	input.type = "text"
	input.inputMode = "numeric"
	input.value = String(options.initial)
	input.classList.add("number-form-input")
	label.appendChild(input)

	const button = createTextElement("button", options.button, ["number-form-button"])
	button.setAttribute("type", "submit")

	const error = createTextElement("p", "", ["number-form-error"])
	error.setAttribute("role", "alert")
	error.hidden = true

	form.append(label, button, error)
	form.addEventListener("submit", event => {
		event.preventDefault()
		const result = parseBoundedInteger(input.value, options.min, options.max)
		error.hidden = !isInputError(result)
		input.setAttribute("aria-invalid", String(isInputError(result)))
		if (isInputError(result)) {
			error.textContent = describeInputError(result, options.min, options.max)
			return
		}
		options.onSubmit(result)
	})

	const submitValue = (value: number) => {
		input.value = String(value)
		form.requestSubmit()
	}
	return { element: form, submitValue }
}

/** Turn an input error into a message in the current language. */
function describeInputError(result: InputError, min: number, max: number): string {
	const texts = getTexts()
	switch (result.error) {
		case "empty": return texts.INPUT_EMPTY
		case "not-integer": return texts.INPUT_NOT_INTEGER
		case "out-of-range": return fillText(texts.INPUT_OUT_OF_RANGE, {
			min: min.toLocaleString(texts.LOCALE),
			max: max.toLocaleString(texts.LOCALE),
		})
	}
}

import { collatzSequence, previewSequence, summarizeSequence, verifyRange } from "../../lib/collatz.js"
import { fillText, getTexts } from "../texts.js"
import { createTextElement } from "./elements.js"
import { createLineChart } from "./linechart.js"
import { createNumberForm } from "./numberform.js"

const MAX_START = 1_000_000
const MAX_RANGE = 100_000
const PREVIEW_EDGE = 12
const EXAMPLES = [27, 97, 871]

/** Interactive panel that walks a Collatz sequence and checks the conjecture over a range. */
export function createCollatzExplorer(): HTMLElement {
	const texts = getTexts()
	const card = createTextElement("div", "", ["curiosity"])

	const sequenceResult = createTextElement("div", "", ["collatz-result"])
	sequenceResult.setAttribute("aria-live", "polite")
	const sequenceForm = createNumberForm({
		label: texts.COLLATZ_NUMBER_LABEL,
		button: texts.COLLATZ_RUN,
		min: 1,
		max: MAX_START,
		initial: EXAMPLES[0],
		onSubmit: start => sequenceResult.replaceChildren(...createSequenceResult(start)),
	})
	card.append(sequenceForm.element, createExamples(sequenceForm.submitValue), sequenceResult)

	const rangeResult = createTextElement("p", "", ["collatz-range-result"])
	rangeResult.setAttribute("aria-live", "polite")
	const rangeForm = createNumberForm({
		label: texts.COLLATZ_RANGE_LABEL,
		button: texts.COLLATZ_VERIFY,
		min: 1,
		max: MAX_RANGE,
		initial: 10_000,
		onSubmit: limit => rangeResult.textContent = describeRange(limit),
	})
	card.append(rangeForm.element, rangeResult)

	// The form is still detached here, so render the first example directly instead of submitting it
	sequenceResult.replaceChildren(...createSequenceResult(EXAMPLES[0]))
	return card
}

/** Create the "Try: 27 97 871" row of buttons that run an example start. */
function createExamples(run: (value: number) => void): HTMLElement {
	const row = createTextElement("div", "", ["collatz-examples"])
	row.appendChild(createTextElement("span", getTexts().COLLATZ_EXAMPLES))
	EXAMPLES.forEach(example => {
		const button = createTextElement("button", String(example), ["collatz-example"])
		button.setAttribute("type", "button")
		button.addEventListener("click", () => run(example))
		row.appendChild(button)
	})
	return row
}

/** Create the stats, the shortened sequence and the trajectory chart for one start. */
function createSequenceResult(start: number): Element[] {
	const texts = getTexts()
	const sequence = collatzSequence(start)
	const summary = summarizeSequence(sequence)

	const stats = createTextElement("p", "", ["collatz-stats"])
	stats.append(
		createStat(summary.steps, texts.COLLATZ_STEPS),
		createStat(summary.peak, texts.COLLATZ_PEAK),
	)

	const terms = previewSequence(sequence, PREVIEW_EDGE).map(term => term == null ? "…" : formatNumber(term))
	const preview = createTextElement("p", terms.join(" → "), ["collatz-sequence"])
	const chart = createLineChart(sequence, fillText(texts.COLLATZ_CHART_LABEL, { n: formatNumber(start) }))
	return [stats, preview, chart]
}

/** Create one big number with its caption. */
function createStat(value: number, caption: string): HTMLElement {
	const stat = createTextElement("span", "", ["collatz-stat"])
	stat.append(
		createTextElement("strong", formatNumber(value), ["collatz-stat-value"]),
		createTextElement("span", caption, ["collatz-stat-caption"]),
	)
	return stat
}

/** Check every start up to limit and describe the outcome. */
function describeRange(limit: number): string {
	const result = verifyRange(limit)
	return fillText(getTexts().COLLATZ_VERIFIED, {
		checked: formatNumber(result.checked),
		n: formatNumber(result.longest.n),
		steps: formatNumber(result.longest.steps),
	})
}

/** Format a number with the digit grouping of the current language. */
function formatNumber(value: number): string {
	return value.toLocaleString(getTexts().LOCALE)
}

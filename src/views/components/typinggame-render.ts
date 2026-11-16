import { compareInput } from "../../lib/typinggame.js"
import { Texts } from "../texts.js"
import { createTextElement } from "./elements.js"

/** Live elements of the typing game window. */
export interface GameElements {
	dialog: HTMLDialogElement
	input: HTMLInputElement
	close: HTMLElement
	target: HTMLElement
	timeFill: HTMLElement
	stats: HTMLElement
	next: HTMLElement
	result: HTMLElement
}

/** Values shown in the stats line. */
export interface GameStats {
	score: number
	wpm: number
	best: number
	next: string
}

/** Build the terminal-styled game dialog. */
export function buildGameDialog(texts: Texts): GameElements {
	const dialog = document.createElement("dialog")
	dialog.classList.add("game")
	dialog.setAttribute("aria-label", texts.GAME_TITLE)

	const titlebar = createTextElement("div", "", ["game-titlebar"])
	titlebar.appendChild(createTextElement("span", texts.GAME_TITLE, ["game-title"]))
	const close = createTextElement("button", "✕", ["game-close"])
	close.setAttribute("aria-label", texts.GAME_CLOSE)
	titlebar.appendChild(close)

	const body = createTextElement("div", "", ["game-body"])
	body.appendChild(createTextElement("p", texts.GAME_HELP, ["game-help"]))

	const line = createTextElement("div", "", ["game-line"])
	line.appendChild(createTextElement("span", "~/forge $", ["game-prompt"]))
	const target = createTextElement("span", "", ["game-target"])
	target.setAttribute("aria-live", "polite")
	line.appendChild(target)
	body.appendChild(line)

	const input = document.createElement("input")
	input.classList.add("game-input")
	input.setAttribute("aria-label", texts.GAME_INPUT_LABEL)
	for (const [name, value] of Object.entries({ autocomplete: "off", autocapitalize: "off", autocorrect: "off", spellcheck: "false" })) {
		input.setAttribute(name, value)
	}
	body.appendChild(input)

	const timebar = createTextElement("div", "", ["game-timebar"])
	const timeFill = createTextElement("div", "", ["game-timebar-fill"])
	timebar.appendChild(timeFill)
	body.appendChild(timebar)

	const stats = createTextElement("p", "", ["game-stats"])
	const next = createTextElement("p", "", ["game-next"])
	const result = createTextElement("div", "", ["game-result"])
	result.setAttribute("role", "status")
	body.append(stats, next, result)

	const frame = createTextElement("div", "", ["game-window"])
	frame.append(titlebar, body)
	dialog.appendChild(frame)
	return { dialog, input, close, target, timeFill, stats, next, result }
}

/** Paint the target command: typed-correct, typed-wrong, pending, and the cursor position. */
export function renderTarget(element: HTMLElement, target: string, typed: string): void {
	const { correct } = compareInput(target, typed)
	const wrongEnd = Math.min(typed.length, target.length)
	const parts = [
		createTextElement("span", target.slice(0, correct), ["game-char-ok"]),
		createTextElement("span", target.slice(correct, wrongEnd), ["game-char-error"]),
		createTextElement("span", target.slice(wrongEnd), ["game-char-pending"]),
	]

	// The cursor sits before the first pending character
	parts[2].classList.add("game-cursor")
	element.replaceChildren(...parts)
}

/** Update the score, words per minute, best score and next command. */
export function renderStats(elements: GameElements, stats: GameStats, texts: Texts): void {
	elements.stats.textContent = `${texts.GAME_SCORE} ${stats.score} · ${texts.GAME_WPM} ${stats.wpm} · ${texts.GAME_BEST} ${stats.best}`
	elements.next.textContent = `${texts.GAME_NEXT}: ${stats.next}`
}

/** Set how much of the time bar is left, from 1 (full) to 0 (empty). */
export function renderTime(elements: GameElements, remaining: number): void {
	elements.timeFill.style.transform = `scaleX(${Math.max(0, remaining)})`
}

/** Show the end-of-run summary, or hide it when `summary` is undefined. */
export function renderResult(elements: GameElements, texts: Texts, summary?: { score: number, wpm: number, isNewBest: boolean }): void {
	if (!summary) {
		elements.result.replaceChildren()
		return
	}

	const title = summary.isNewBest ? texts.GAME_NEW_BEST : texts.GAME_OVER
	elements.result.replaceChildren(
		createTextElement("p", title, ["game-result-title"]),
		createTextElement("p", `${texts.GAME_SCORE} ${summary.score} · ${texts.GAME_WPM} ${summary.wpm}`),
		createTextElement("p", texts.GAME_RESTART, ["game-result-hint"]),
	)
}

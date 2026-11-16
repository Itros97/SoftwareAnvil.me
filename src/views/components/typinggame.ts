import { COMMANDS, calculateWpm, compareInput, pickNextCommand } from "../../lib/typinggame.js"
import { GameScoreService } from "../../services/gamescoreservice.js"
import { Texts, getTexts } from "../texts.js"
import { GameElements, buildGameDialog, renderResult, renderStats, renderTarget, renderTime } from "./typinggame-render.js"

const RUN_DURATION_MS = 30_000
const TICK_MS = 100

// Below this, WPM swings wildly (a few characters over a few milliseconds), so it shows 0
const MIN_WPM_ELAPSED_MS = 3_000

/** Hidden terminal typing game: type as many shell commands as possible in 30 seconds. */
export class TypingGame {
	private static active: TypingGame | undefined

	private readonly texts: Texts = getTexts()
	private readonly elements: GameElements = buildGameDialog(this.texts)
	private target = ""
	private next = ""
	private score = 0
	private correctChars = 0
	private best = GameScoreService.readBest()
	private startedAt: number | undefined
	private timer: number | undefined
	private finished = false

	/** Open the game, unless it is already open. Focus returns to `trigger` on close. */
	static open(trigger: HTMLElement): void {
		if (TypingGame.active) return
		TypingGame.active = new TypingGame(trigger)
	}

	private constructor(private readonly trigger: HTMLElement) {
		const { dialog, input, close } = this.elements
		input.addEventListener("input", () => this.handleInput())
		input.addEventListener("keydown", event => this.handleKeydown(event))
		close.addEventListener("click", () => dialog.close())
		dialog.addEventListener("click", () => input.focus())
		dialog.addEventListener("close", () => this.destroy())

		document.body.appendChild(dialog)
		dialog.showModal()
		this.reset()
	}

	// ---- Run lifecycle ----

	/** Prepare a fresh run; the clock starts with the first keystroke. */
	private reset(): void {
		this.stopTimer()
		this.score = 0
		this.correctChars = 0
		this.startedAt = undefined
		this.finished = false
		this.target = pickNextCommand(COMMANDS, undefined, Math.random)
		this.next = pickNextCommand(COMMANDS, this.target, Math.random)
		this.elements.input.value = ""
		renderResult(this.elements, this.texts)
		renderTime(this.elements, 1)
		this.render()
		this.elements.input.focus()
	}

	/** Start the countdown. */
	private start(): void {
		this.startedAt = performance.now()
		this.timer = window.setInterval(() => this.tick(), TICK_MS)
	}

	/** Update the time bar and end the run when time is up. */
	private tick(): void {
		const remaining = 1 - this.elapsed() / RUN_DURATION_MS
		renderTime(this.elements, remaining)
		this.render()
		if (remaining <= 0) this.finish()
	}

	/** Stop the run and show the summary, saving a new best score. */
	private finish(): void {
		this.stopTimer()
		this.finished = true
		const isNewBest = this.score > this.best
		if (isNewBest) {
			this.best = this.score
			GameScoreService.storeBest(this.score)
		}
		renderResult(this.elements, this.texts, { score: this.score, wpm: this.wpm(), isNewBest })
		this.render()
	}

	/** Stop the timer and forget this game, returning focus to the trigger. */
	private destroy(): void {
		this.stopTimer()
		this.elements.dialog.remove()
		TypingGame.active = undefined
		this.trigger.focus()
	}

	// ---- Input ----

	/** Check the typed text, starting the run on the first keystroke. */
	private handleInput(): void {
		const { input } = this.elements
		if (this.finished) {
			input.value = ""
			return
		}
		if (this.startedAt === undefined) this.start()

		if (compareInput(this.target, input.value).complete) this.advance()
		this.render()
	}

	/** Enter restarts a finished run. Esc is handled by the dialog itself. */
	private handleKeydown(event: KeyboardEvent): void {
		if (event.key != "Enter" || !this.finished) return
		event.preventDefault()
		this.reset()
	}

	/** Score the completed command and move on to the next one. */
	private advance(): void {
		this.score++
		this.correctChars += this.target.length
		this.target = this.next
		this.next = pickNextCommand(COMMANDS, this.target, Math.random)
		this.elements.input.value = ""
	}

	// ---- Helpers ----

	/** Repaint the target command and stats. */
	private render(): void {
		renderTarget(this.elements.target, this.target, this.elements.input.value)
		renderStats(this.elements, { score: this.score, wpm: this.wpm(), best: this.best, next: this.next }, this.texts)
	}

	/** Words per minute so far, counting completed commands and the current correct prefix. */
	private wpm(): number {
		if (this.elapsed() < MIN_WPM_ELAPSED_MS) return 0
		const current = compareInput(this.target, this.elements.input.value).correct
		return calculateWpm(this.correctChars + current, this.elapsed())
	}

	/** Milliseconds since the run started, capped at the run length. */
	private elapsed(): number {
		if (this.startedAt === undefined) return 0
		return Math.min(performance.now() - this.startedAt, RUN_DURATION_MS)
	}

	/** Clear the countdown timer, if any. */
	private stopTimer(): void {
		window.clearInterval(this.timer)
		this.timer = undefined
	}
}

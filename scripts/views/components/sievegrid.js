import { primesUpTo, sieveSteps } from "../../lib/primes.js";
import { fillText, getTexts } from "../texts.js";
import { createTextElement } from "./elements.js";
const LIMIT = 200;
const PLAY_INTERVAL_MS = 700;
/** Panel that runs the sieve of Eratosthenes over a grid of 1..200, step by step or animated. */
export function createSieveGrid() {
    const texts = getTexts();
    const steps = sieveSteps(LIMIT);
    const panel = createTextElement("section", "", ["curiosity"]);
    panel.append(createTextElement("h2", texts.SIEVE_TITLE, ["curiosity-subtitle"]), createTextElement("p", texts.SIEVE_INTRO, ["curiosity-text"]));
    const grid = createTextElement("div", "", ["sieve-grid"]);
    grid.setAttribute("role", "img");
    grid.setAttribute("aria-label", fillText(texts.SIEVE_GRID_LABEL, { limit: String(LIMIT) }));
    const cells = Array.from({ length: LIMIT }, (_, index) => createTextElement("span", String(index + 1), ["sieve-cell"]));
    grid.append(...cells);
    const cellOf = (n) => cells[n - 1];
    const status = createTextElement("p", texts.SIEVE_START, ["sieve-status"]);
    status.setAttribute("aria-live", "polite");
    const next = createButton(texts.SIEVE_NEXT);
    const play = createButton(texts.SIEVE_PLAY);
    const reset = createButton(texts.SIEVE_RESET);
    const actions = createTextElement("div", "", ["curiosity-actions"]);
    actions.append(next, play, reset);
    let stepIndex = 0;
    let timer;
    const stopPlaying = () => {
        window.clearInterval(timer);
        timer = undefined;
        play.textContent = texts.SIEVE_PLAY;
    };
    const advance = () => {
        // Stop the animation if the user left the page meanwhile
        if (!panel.isConnected && timer !== undefined)
            return stopPlaying();
        if (stepIndex > steps.length)
            return stopPlaying();
        if (stepIndex == steps.length) {
            const primes = primesUpTo(LIMIT);
            primes.forEach(prime => cellOf(prime).classList.add("is-prime"));
            status.textContent = fillText(texts.SIEVE_DONE, { count: String(primes.length), limit: String(LIMIT) });
        }
        else {
            const step = steps[stepIndex];
            cells.forEach(cell => cell.classList.remove("is-current"));
            cellOf(step.prime).classList.add("is-prime", "is-current");
            step.crossed.forEach(multiple => cellOf(multiple).classList.add("is-crossed"));
            status.textContent = fillText(texts.SIEVE_STEP, { prime: String(step.prime), count: String(step.crossed.length) });
        }
        stepIndex++;
        next.toggleAttribute("disabled", stepIndex > steps.length);
        play.toggleAttribute("disabled", stepIndex > steps.length);
        if (stepIndex > steps.length)
            stopPlaying();
    };
    next.addEventListener("click", advance);
    play.addEventListener("click", () => {
        if (timer !== undefined)
            return stopPlaying();
        play.textContent = texts.SIEVE_PAUSE;
        advance();
        timer = window.setInterval(advance, PLAY_INTERVAL_MS);
    });
    reset.addEventListener("click", () => {
        stopPlaying();
        stepIndex = 0;
        cells.forEach(cell => cell.classList.remove("is-prime", "is-crossed", "is-current"));
        next.removeAttribute("disabled");
        play.removeAttribute("disabled");
        status.textContent = texts.SIEVE_START;
    });
    panel.append(actions, grid, status);
    return panel;
}
/** Create a plain action button. */
function createButton(text) {
    const button = createTextElement("button", text, ["curiosity-button"]);
    button.setAttribute("type", "button");
    return button;
}

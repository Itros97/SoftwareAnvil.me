import { primesUpTo, ulamPath } from "../../lib/primes.js"
import { fillText, getTexts } from "../texts.js"
import { createSegmented } from "./controls.js"
import { createTextElement } from "./elements.js"

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"
const SIDES = [101, 201, 301]

/** Panel with the Ulam spiral drawn as one SVG path, so the accent colour follows the theme. */
export function createUlamSpiral(): HTMLElement {
	const texts = getTexts()
	const panel = createTextElement("section", "", ["curiosity"])
	panel.append(
		createTextElement("h2", texts.ULAM_TITLE, ["curiosity-subtitle"]),
		createTextElement("p", texts.ULAM_INTRO, ["curiosity-text"]),
	)

	const frame = createTextElement("div", "", ["ulam-frame"])
	const render = (side: number) => frame.replaceChildren(drawSpiral(side))
	const choices = SIDES.map(side => ({ value: side, label: `${side} × ${side}` }))
	panel.append(createSegmented(texts.ULAM_SIZE, choices, SIDES[0], render), frame)
	render(SIDES[0])
	return panel
}

/** Draw a side × side spiral with one unit square per prime. */
function drawSpiral(side: number): SVGSVGElement {
	const count = side * side
	const path = ulamPath(count)
	const center = (side - 1) / 2
	const primes = primesUpTo(count)
	const squares = primes.map(prime => {
		const point = path[prime - 1]
		return `M${point.x + center} ${point.y + center}h1v1h-1z`
	})

	const svg = document.createElementNS(SVG_NAMESPACE, "svg")
	svg.setAttribute("viewBox", `0 0 ${side} ${side}`)
	svg.setAttribute("role", "img")
	svg.setAttribute("aria-label", fillText(getTexts().ULAM_LABEL, { side: String(side), count: String(primes.length) }))
	svg.classList.add("ulam-spiral")

	const shape = document.createElementNS(SVG_NAMESPACE, "path")
	shape.setAttribute("d", squares.join(""))
	shape.setAttribute("shape-rendering", "crispEdges")
	svg.appendChild(shape)
	return svg
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"
const WIDTH = 600
const HEIGHT = 160
const PADDING = 6

/** Optional fixed vertical range and a horizontal reference line, e.g. 0 V. */
export interface LineChartOptions {
	min?: number
	max?: number
	baseline?: number
}

/** Create a minimal SVG line chart of the values in order: index on X, value on Y, scaled to fit. */
export function createLineChart(values: number[], label: string, options: LineChartOptions = {}): SVGSVGElement {
	const svg = document.createElementNS(SVG_NAMESPACE, "svg")
	svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
	svg.setAttribute("preserveAspectRatio", "none")
	svg.setAttribute("role", "img")
	svg.setAttribute("aria-label", label)
	svg.classList.add("line-chart")

	const min = options.min ?? Math.min(...values)
	const max = options.max ?? Math.max(...values)
	const toY = (value: number) => HEIGHT - PADDING - ((value - min) / (max - min || 1)) * (HEIGHT - PADDING * 2)

	if (options.baseline !== undefined) {
		const y = toY(options.baseline).toFixed(1)
		svg.appendChild(createSvgElement("line", { x1: "0", x2: String(WIDTH), y1: y, y2: y, class: "line-chart-baseline" }))
	}

	const stepX = (WIDTH - PADDING * 2) / Math.max(values.length - 1, 1)
	const points = values.map((value, index) => `${(PADDING + index * stepX).toFixed(1)},${toY(value).toFixed(1)}`)
	svg.appendChild(createSvgElement("polyline", { points: points.join(" "), class: "line-chart-line" }))
	return svg
}

/** Create an SVG element whose strokes keep their width when the chart stretches. */
function createSvgElement(type: string, attributes: Record<string, string>): SVGElement {
	const element = document.createElementNS(SVG_NAMESPACE, type)
	Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value))
	element.setAttribute("vector-effect", "non-scaling-stroke")
	return element
}

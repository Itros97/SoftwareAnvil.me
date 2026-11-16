const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const WIDTH = 600;
const HEIGHT = 160;
const PADDING = 6;
/** Create a minimal SVG line chart of the values in order: index on X, value on Y, scaled to fit. */
export function createLineChart(values, label) {
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", label);
    svg.classList.add("line-chart");
    const line = document.createElementNS(SVG_NAMESPACE, "polyline");
    line.setAttribute("points", toPoints(values).join(" "));
    line.setAttribute("vector-effect", "non-scaling-stroke");
    line.classList.add("line-chart-line");
    svg.appendChild(line);
    return svg;
}
/** Map each value to "x,y" inside the padded drawing area; y grows downwards in SVG. */
function toPoints(values) {
    const min = Math.min(...values);
    const range = Math.max(...values) - min || 1;
    const stepX = (WIDTH - PADDING * 2) / Math.max(values.length - 1, 1);
    return values.map((value, index) => {
        const x = PADDING + index * stepX;
        const y = HEIGHT - PADDING - ((value - min) / range) * (HEIGHT - PADDING * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
}

import { createTextElement } from "./elements.js";
/** Create one big value with its caption underneath. */
export function createStat(value, caption) {
    const stat = createTextElement("span", "", ["curiosity-stat"]);
    stat.append(createTextElement("strong", value, ["curiosity-stat-value"]), createTextElement("span", caption, ["curiosity-stat-caption"]));
    return stat;
}
/** Create a row of example buttons after a label; clicking one hands its text to onPick. */
export function createExampleRow(label, examples, onPick) {
    const row = createTextElement("div", "", ["curiosity-examples"]);
    row.appendChild(createTextElement("span", label));
    examples.forEach(example => {
        const button = createTextElement("button", example, ["curiosity-example"]);
        button.setAttribute("type", "button");
        button.addEventListener("click", () => onPick(example));
        row.appendChild(button);
    });
    return row;
}

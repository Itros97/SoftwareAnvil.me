import { createTextElement } from "./elements.js";
/** Create a labelled range input that steps through the given values. */
export function createSlider(options) {
    const initialIndex = options.values.indexOf(options.initial);
    if (initialIndex < 0)
        throw new Error(`Slider "${options.label}" has no value ${options.initial}`);
    const wrapper = createTextElement("label", "", ["slider"]);
    const header = createTextElement("span", "", ["slider-header"]);
    const output = createTextElement("output", options.format(options.initial), ["slider-value"]);
    header.append(createTextElement("span", options.label), output);
    const input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = String(options.values.length - 1);
    input.value = String(initialIndex);
    input.classList.add("slider-input");
    input.addEventListener("input", () => {
        const value = options.values[Number(input.value)];
        output.textContent = options.format(value);
        input.setAttribute("aria-valuetext", options.format(value));
        options.onChange(value);
    });
    input.setAttribute("aria-valuetext", options.format(options.initial));
    wrapper.append(header, input);
    return wrapper;
}
/** Create a row of toggle buttons where exactly one is pressed. */
export function createSegmented(label, choices, initial, onSelect) {
    const group = createTextElement("div", "", ["segmented"]);
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", label);
    const buttons = choices.map(choice => {
        const button = createTextElement("button", choice.label, ["segmented-option"]);
        button.setAttribute("type", "button");
        button.setAttribute("aria-pressed", String(choice.value == initial));
        button.addEventListener("click", () => {
            buttons.forEach(other => other.setAttribute("aria-pressed", String(other == button)));
            onSelect(choice.value);
        });
        return button;
    });
    group.append(...buttons);
    return group;
}

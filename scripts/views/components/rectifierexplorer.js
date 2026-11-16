import { measureWave, sampleWave } from "../../lib/rectifier.js";
import { fillText, getTexts } from "../texts.js";
import { createSegmented, createSlider } from "./controls.js";
import { createStat } from "./curiosityparts.js";
import { createTextElement } from "./elements.js";
import { createLineChart } from "./linechart.js";
const PERIODS = 3;
const SAMPLES_PER_PERIOD = 200;
const LOAD_OHMS = 1000;
const AMPLITUDES = [1, 2, 5, 9, 12, 15, 20, 24, 30];
const FREQUENCIES = [10, 20, 30, 40, 50, 60, 80, 100];
const CAPACITANCES = [10, 22, 47, 100, 220, 470, 1000, 2200];
/** Name and explanation text keys of each stage. */
const STAGES = [
    { value: "ac", label: "RECT_STAGE_AC", hint: "RECT_HINT_AC" },
    { value: "half", label: "RECT_STAGE_HALF", hint: "RECT_HINT_HALF" },
    { value: "full", label: "RECT_STAGE_FULL", hint: "RECT_HINT_FULL" },
    { value: "filtered", label: "RECT_STAGE_FILTERED", hint: "RECT_HINT_FILTERED" },
];
/** Interactive rectifier: pick a stage and tune the circuit to see the wave and its measures. */
export function createRectifierExplorer() {
    const texts = getTexts();
    const panel = createTextElement("div", "", ["curiosity"]);
    const state = {
        stage: "ac",
        params: { amplitude: 12, frequency: 50, capacitance: 470, load: LOAD_OHMS },
    };
    const hint = createTextElement("p", "", ["curiosity-text", "rectifier-hint"]);
    const chart = createTextElement("div", "", ["rectifier-chart"]);
    const stats = createTextElement("p", "", ["curiosity-stats"]);
    stats.setAttribute("aria-live", "polite");
    const render = () => {
        const stage = STAGES.find(item => item.value == state.stage);
        hint.textContent = texts[stage.hint];
        const values = sampleWave(state.stage, state.params, PERIODS, SAMPLES_PER_PERIOD);
        const limit = state.params.amplitude * 1.1;
        const label = fillText(texts.RECT_CHART_LABEL, { stage: texts[stage.label] });
        chart.replaceChildren(createLineChart(values, label, { min: -limit, max: limit, baseline: 0 }));
        const measure = measureWave(values);
        stats.replaceChildren(createStat(formatVolts(measure.average), texts.RECT_AVERAGE), createStat(formatVolts(measure.rms), texts.RECT_RMS), createStat(formatVolts(measure.ripple), texts.RECT_RIPPLE));
    };
    const update = (change) => {
        state.params = { ...state.params, ...change };
        render();
    };
    const stageChoices = STAGES.map(stage => ({ value: stage.value, label: texts[stage.label] }));
    const sliders = createTextElement("div", "", ["rectifier-sliders"]);
    sliders.append(createSlider({ label: texts.RECT_AMPLITUDE, values: AMPLITUDES, initial: 12, format: value => `${value} V`, onChange: amplitude => update({ amplitude }) }), createSlider({ label: texts.RECT_FREQUENCY, values: FREQUENCIES, initial: 50, format: value => `${value} Hz`, onChange: frequency => update({ frequency }) }), createSlider({ label: texts.RECT_CAPACITANCE, values: CAPACITANCES, initial: 470, format: value => `${value} µF`, onChange: capacitance => update({ capacitance }) }));
    panel.append(createSegmented(texts.RECT_STAGES, stageChoices, state.stage, stage => { state.stage = stage; render(); }), hint, chart, stats, sliders, createTextElement("p", texts.RECT_NOTE, ["curiosity-note"]));
    render();
    return panel;
}
/** Format volts with two decimals in the current language. */
function formatVolts(value) {
    // Avoid showing "-0,00 V" for averages that are zero up to rounding
    const rounded = Math.abs(value) < 0.005 ? 0 : value;
    return `${rounded.toLocaleString(getTexts().LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} V`;
}

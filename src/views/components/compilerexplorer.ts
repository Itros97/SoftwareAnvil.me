import { compile } from "../../lib/expression/compiler.js"
import { CompileError, CompileErrorCode } from "../../lib/expression/errors.js"
import { formatInstruction, formatTree } from "../../lib/expression/format.js"
import { MAX_SOURCE_LENGTH, tokenize } from "../../lib/expression/lexer.js"
import { parse } from "../../lib/expression/parser.js"
import { run } from "../../lib/expression/vm.js"
import { Texts, getTexts } from "../texts.js"
import { createExampleRow } from "./curiosityparts.js"
import { createTextElement } from "./elements.js"

/** Curious expressions with the text key that explains each one. */
const EXAMPLES: Array<{ source: string, note: keyof Texts }> = [
	{ source: "0.1 + 0.2", note: "EXAMPLE_FLOAT" },
	{ source: "2 ^ 3 ^ 2", note: "EXAMPLE_POWER" },
	{ source: "-2 ^ 2", note: "EXAMPLE_NEGATE" },
	{ source: "1 / 0", note: "EXAMPLE_INFINITY" },
	{ source: "0 / 0", note: "EXAMPLE_NAN" },
	{ source: "2 ^ 53 + 1", note: "EXAMPLE_SAFE_INTEGER" },
	{ source: "7 % -3", note: "EXAMPLE_MODULO" },
]

const ERROR_TEXTS: Record<CompileErrorCode, keyof Texts> = {
	"empty": "COMPILER_ERROR_EMPTY",
	"too-long": "COMPILER_ERROR_TOO_LONG",
	"unexpected-char": "COMPILER_ERROR_UNEXPECTED_CHAR",
	"unexpected-token": "COMPILER_ERROR_UNEXPECTED_TOKEN",
	"unexpected-end": "COMPILER_ERROR_UNEXPECTED_END",
	"missing-paren": "COMPILER_ERROR_MISSING_PAREN",
}

/** Interactive compiler: type an expression and see every stage from tokens to result. */
export function createCompilerExplorer(): HTMLElement {
	const texts = getTexts()
	const panel = createTextElement("div", "", ["curiosity"])
	const output = createTextElement("div", "", ["compiler-output"])
	output.setAttribute("aria-live", "polite")

	const form = document.createElement("form")
	form.classList.add("number-form")
	const label = createTextElement("label", texts.COMPILER_INPUT_LABEL, ["number-form-label"])
	const input = document.createElement("input")
	input.type = "text"
	input.maxLength = MAX_SOURCE_LENGTH
	input.spellcheck = false
	input.autocomplete = "off"
	input.classList.add("number-form-input", "compiler-input")
	label.appendChild(input)
	const button = createTextElement("button", texts.COMPILER_RUN, ["number-form-button"])
	button.setAttribute("type", "submit")
	form.append(label, button)

	const show = (source: string) => {
		input.value = source
		output.replaceChildren(...renderStages(source))
	}
	form.addEventListener("submit", event => {
		event.preventDefault()
		show(input.value)
	})

	const examples = createExampleRow(texts.COMPILER_EXAMPLES, EXAMPLES.map(example => example.source), show)

	panel.append(form, examples, output)
	show(EXAMPLES[0].source)
	return panel
}

/** Compile a source and render each stage, or the syntax error pointing at its position. */
function renderStages(source: string): HTMLElement[] {
	const texts = getTexts()
	try {
		const tokens = tokenize(source)
		const tree = parse(tokens)
		const program = compile(tree)
		const result = run(program)

		const tokenList = createTextElement("div", "", ["compiler-tokens"])
		tokens.forEach(token => tokenList.appendChild(createTextElement("span", token.text, ["compiler-token", `is-${token.type}`])))
		const stages = [
			createStage(texts.COMPILER_TOKENS, tokenList),
			createStage(texts.COMPILER_TREE, createTextElement("pre", formatTree(tree).join("\n"), ["compiler-code"])),
			createStage(texts.COMPILER_BYTECODE, createTextElement("pre", program.map(formatInstruction).join("\n"), ["compiler-code"])),
			createStage(texts.COMPILER_RESULT, createTextElement("p", String(result), ["compiler-result"])),
		]
		const example = EXAMPLES.find(item => item.source == source.trim())
		if (example) stages.push(createTextElement("p", `ⓘ ${texts[example.note]}`, ["curiosity-note", "compiler-note"]))
		return stages
	} catch (error) {
		if (!(error instanceof CompileError)) throw error
		const message = createTextElement("p", texts[ERROR_TEXTS[error.code]], ["number-form-error"])
		message.setAttribute("role", "alert")
		const pointer = createTextElement("pre", `${source}\n${" ".repeat(error.position)}^`, ["compiler-code", "compiler-pointer"])
		return error.code == "empty" || error.code == "too-long" ? [message] : [message, pointer]
	}
}

/** Create a titled block for one compiler stage. */
function createStage(title: string, content: HTMLElement): HTMLElement {
	const stage = createTextElement("section", "", ["compiler-stage"])
	stage.append(createTextElement("h3", title, ["compiler-stage-title"]), content)
	return stage
}

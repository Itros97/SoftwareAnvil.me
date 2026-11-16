import { getConfiguration } from "../../lib/configuration.js"
import { SetupGroup, SetupItem, getTreeBranch } from "../../lib/content.js"
import { getIcon } from "../../lib/icons.js"
import { createTextElement } from "./elements.js"

const ICON_SIZE = "16px"

/** Create a terminal window that lists the setup groups like fastfetch: logo on the left, boxed trees on the right. */
export function createFetchPanel(groups: SetupGroup[]): HTMLElement {
	const panel = createTextElement("div", "", ["fetch"])
	panel.appendChild(createTitleBar())

	const body = createTextElement("div", "", ["fetch-body"])
	body.appendChild(createLogo())

	const boxes = createTextElement("div", "", ["fetch-boxes"])
	groups.forEach(group => boxes.appendChild(createGroupBox(group)))
	body.appendChild(boxes)

	panel.appendChild(body)
	return panel
}

/** Create the window bar with the command that "produced" the output. */
function createTitleBar(): HTMLElement {
	const bar = createTextElement("div", "", ["fetch-titlebar"])
	bar.appendChild(createTextElement("span", "~ $ fastfetch", ["fetch-command"]))
	return bar
}

/** Create the site logo shown next to the boxes; decorative, so screen readers skip it. */
function createLogo(): HTMLElement {
	const logo = document.createElement("img")
	logo.src = `${getConfiguration("path")["icons"]}/logo.svg`
	logo.alt = ""
	logo.classList.add("fetch-logo")
	return logo
}

/** Create one boxed group with its title on the top border and its rows drawn as a tree. */
function createGroupBox(group: SetupGroup): HTMLElement {
	const box = createTextElement("section", "", ["fetch-box"])
	box.appendChild(createTextElement("h2", group.title, ["fetch-box-title"]))

	const list = createTextElement("ul", "", ["fetch-rows"])
	group.items.forEach((item, index) => list.appendChild(createRow(item, getTreeBranch(index, group.items.length))))
	box.appendChild(list)
	return box
}

/** Create one row: tree branch, icon, value and what it is in parentheses. */
function createRow(item: SetupItem, branch: string): HTMLElement {
	const row = createTextElement("li", "", branch ? ["fetch-row"] : ["fetch-row", "fetch-row-root"])
	if (branch) row.appendChild(createTextElement("span", branch, ["fetch-branch"]))

	const icon = item.icon ? getIcon("material", item.icon, ICON_SIZE, "currentColor") : undefined
	if (icon) {
		icon.classList.add("fetch-icon")
		row.appendChild(icon)
	}

	const text = createTextElement("span", item.value, ["fetch-value"])
	text.appendChild(createTextElement("span", ` (${item.label})`, ["fetch-label"]))
	row.appendChild(text)
	return row
}

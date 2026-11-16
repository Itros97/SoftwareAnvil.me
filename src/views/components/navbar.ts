import { getIcon } from "../../lib/icons.js"
import { LANGUAGES, LanguageCode } from "../../lib/language.js"
import { LanguageService } from "../../services/languageservice.js"
import { Theme } from "../../services/theme.js"
import { getTexts } from "../texts.js"
import { createLink, createTextElement } from "./elements.js"

/** Each language's name written in that language, for screen readers and tooltips. */
const LANGUAGE_NAMES: Record<LanguageCode, string> = { es: "Español", en: "English" }

/** Top navigation bar with the site name, section links, language selector and theme toggle. */
export class Navbar {
	/** Create the navigation bar in the current language. */
	static create(siteName: string): HTMLElement {
		const texts = getTexts()
		const links = [
			{ text: texts.NAV_HOME, section: "" },
			{ text: texts.NAV_PROJECTS, section: "projects" },
			{ text: texts.NAV_BLOG, section: "blog" },
		]

		const header = createTextElement("header", "", ["navbar"])
		const inner = createTextElement("div", "", ["navbar-inner"])
		inner.appendChild(createLink(siteName, "#/", ["navbar-brand"]))

		const nav = createTextElement("nav", "", ["navbar-links"])
		nav.setAttribute("aria-label", texts.NAV_LABEL)
		links.forEach(link => {
			const anchor = createLink(link.text, `#/${link.section}`, ["navbar-link"])
			anchor.dataset["section"] = link.section
			nav.appendChild(anchor)
		})
		inner.appendChild(nav)

		const actions = createTextElement("div", "", ["navbar-actions"])
		actions.appendChild(Navbar.createLanguageSelector())
		actions.appendChild(Navbar.createThemeToggle())
		inner.appendChild(actions)

		header.appendChild(inner)
		return header
	}

	/** Mark the link of the section that contains the given path as current. */
	static highlight(navbar: HTMLElement, path: string): void {
		const section = path.split("/")[0]
		navbar.querySelectorAll<HTMLAnchorElement>(".navbar-link").forEach(link => {
			if (link.dataset["section"] == section) link.setAttribute("aria-current", "page")
			else link.removeAttribute("aria-current")
		})
	}

	/** Create the ES · EN selector; the active language is marked as pressed. */
	private static createLanguageSelector(): HTMLElement {
		const selector = createTextElement("div", "", ["language-selector"])
		selector.setAttribute("role", "group")
		selector.setAttribute("aria-label", getTexts().LANGUAGE_LABEL)

		LANGUAGES.forEach(language => {
			const button = createTextElement("button", language.toUpperCase(), ["language-option"])
			button.setAttribute("lang", language)
			button.setAttribute("aria-label", LANGUAGE_NAMES[language])
			button.setAttribute("aria-pressed", String(language == LanguageService.get()))
			button.title = LANGUAGE_NAMES[language]
			button.addEventListener("click", () => LanguageService.set(language))
			selector.appendChild(button)
		})
		return selector
	}

	/** Create the button that switches between light and dark themes. */
	private static createThemeToggle(): HTMLElement {
		const button = createTextElement("button", "", ["theme-toggle"])
		button.setAttribute("aria-label", getTexts().TOGGLE_THEME)
		button.title = getTexts().TOGGLE_THEME
		Navbar.renderThemeIcon(button)

		button.addEventListener("click", () => {
			Theme.toggle()
			Navbar.renderThemeIcon(button)
		})
		return button
	}

	/** Show the icon of the theme the button will switch to. */
	private static renderThemeIcon(button: HTMLElement): void {
		const icon = getIcon("material", Theme.isDark() ? "light_mode" : "dark_mode", "20px", "currentColor")
		button.replaceChildren(icon)
	}
}

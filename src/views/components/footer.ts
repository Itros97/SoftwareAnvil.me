import { Social } from "../../lib/content.js"
import { getIcon } from "../../lib/icons.js"
import { createLink, createTextElement } from "./elements.js"

/** Site footer with the copyright line and the social links, which act as contact. */
export class Footer {
	/** Create the footer with the copyright line; socials are added once the profile loads. */
	static create(siteName: string): HTMLElement {
		const footer = createTextElement("footer", "", ["footer"])
		const inner = createTextElement("div", "", ["footer-inner"])
		inner.appendChild(createTextElement("p", `© ${new Date().getFullYear()} ${siteName}`, ["footer-copy"]))
		inner.appendChild(createTextElement("div", "", ["footer-socials"]))
		footer.appendChild(inner)
		return footer
	}

	/** Fill the footer with one icon link per social. */
	static setSocials(footer: HTMLElement, socials: Social[]): void {
		const container = footer.querySelector(".footer-socials")
		if (!container) return

		container.replaceChildren(...socials.map(Footer.createSocialLink))
	}

	/** Create a social link with its icon, or its label when there is no icon for it. */
	private static createSocialLink(social: Social): HTMLElement {
		const icon = getIcon("social", social.id, "22px", "currentColor") ?? getIcon("material", social.id, "22px", "currentColor")
		const link = createLink(icon ? "" : social.label, social.url, ["footer-social"])
		link.setAttribute("aria-label", social.label)
		link.title = social.label
		if (icon) link.appendChild(icon)
		return link
	}
}

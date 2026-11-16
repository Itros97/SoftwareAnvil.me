import { getIcon } from "../../lib/icons.js";
import { Theme } from "../../services/theme.js";
import { TEXTS } from "../texts.js";
import { createLink, createTextElement } from "./elements.js";
/** Top navigation bar with the site name, section links and theme toggle. */
export class Navbar {
    /** Create the navigation bar. */
    static create(siteName) {
        const header = createTextElement("header", "", ["navbar"]);
        const inner = createTextElement("div", "", ["navbar-inner"]);
        inner.appendChild(createLink(siteName, "#/", ["navbar-brand"]));
        const nav = createTextElement("nav", "", ["navbar-links"]);
        nav.setAttribute("aria-label", "Main");
        Navbar.LINKS.forEach(link => {
            const anchor = createLink(link.text, `#/${link.section}`, ["navbar-link"]);
            anchor.dataset["section"] = link.section;
            nav.appendChild(anchor);
        });
        nav.appendChild(Navbar.createThemeToggle());
        inner.appendChild(nav);
        header.appendChild(inner);
        return header;
    }
    /** Mark the link of the section that contains the given path as current. */
    static highlight(navbar, path) {
        const section = path.split("/")[0];
        navbar.querySelectorAll(".navbar-link").forEach(link => {
            if (link.dataset["section"] == section)
                link.setAttribute("aria-current", "page");
            else
                link.removeAttribute("aria-current");
        });
    }
    /** Create the button that switches between light and dark themes. */
    static createThemeToggle() {
        const button = createTextElement("button", "", ["theme-toggle"]);
        button.setAttribute("aria-label", TEXTS.TOGGLE_THEME);
        button.title = TEXTS.TOGGLE_THEME;
        Navbar.renderThemeIcon(button);
        button.addEventListener("click", () => {
            Theme.toggle();
            Navbar.renderThemeIcon(button);
        });
        return button;
    }
    /** Show the icon of the theme the button will switch to. */
    static renderThemeIcon(button) {
        const icon = getIcon("material", Theme.isDark() ? "light_mode" : "dark_mode", "20px", "currentColor");
        button.replaceChildren(icon);
    }
}
Navbar.LINKS = [
    { text: TEXTS.NAV_HOME, section: "" },
    { text: TEXTS.NAV_PROJECTS, section: "projects" },
    { text: TEXTS.NAV_BLOG, section: "blog" },
];

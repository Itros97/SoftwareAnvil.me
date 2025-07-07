import { BubbleUI } from "../lib/bubble.js";
import { getConfiguration } from "../lib/configuration.js";
import { setDomEvents, uiComponent, } from "../lib/dom.js";
import { Html } from "../lib/html.js";
import { httpGet } from "../lib/http.js";
import { getIcon } from "../lib/icons.js";
import MarkdownService from "../services/markdownservice.js";
import { Theme } from "../services/theme.js";
class HomeView {
    /**
     * Show home view
     */
    static async show(parameters, container) {
        const view = uiComponent({
            type: Html.View,
            id: HomeView.VIEW_ID,
            classes: [BubbleUI.BoxColumn, BubbleUI.BoxCenter],
        });
        const topBar = HomeView.topBar();
        view.appendChild(topBar);
        // const title = uiComponent({
        //   type: Html.H1,
        //   text: getConfiguration("base")["app_name"],
        //   styles: {
        //     fontSize: "5rem",
        //     marginBottom: "3rem",
        //   },
        //   selectable: false,
        // });
        // Este hace toggle del tema
        const description = uiComponent({
            type: Html.P,
            text: "my personal website.",
            selectable: false,
        });
        const button = uiComponent({
            type: Html.Button,
            text: "Clicker",
        });
        const gitButton = uiComponent({
            type: Html.Button,
            text: "",
        });
        const githubIcon = getIcon("social", "github", "24px", "var(--on-surface-1)");
        gitButton.appendChild(githubIcon);
        setDomEvents(button, {
            click: (e) => {
                Theme.toggle();
            },
        });
        setDomEvents(gitButton, {
            click: (e) => {
                window.open("https://github.com/Itros97", "_blank");
            },
        });
        const a = await HomeView.getDocumentHTML();
        const doc = uiComponent({
            classes: ["markdown"],
            text: MarkdownService.render(a),
        });
        //view.appendChild(title);
        view.appendChild(description);
        view.appendChild(button);
        view.appendChild(gitButton);
        view.appendChild(doc);
        container.appendChild(view);
    }
    static async getDocumentHTML() {
        const response = await httpGet({
            url: `${getConfiguration("path")["markdowns"]}/doc.MD`,
            parameters: {},
        });
        return await response.text();
    }
    static topBar() {
        const topBar = uiComponent({
            type: Html.Div,
            classes: [BubbleUI.BoxRow, BubbleUI.BoxXBetween],
            styles: {
                padding: ".5rem 1rem ",
                width: "100%",
                background: "var(--surface-1)",
                marginBottom: "2rem",
            },
        });
        const navTitle = uiComponent({
            type: Html.P,
            text: getConfiguration("base")["app_name"],
        });
        topBar.appendChild(navTitle);
        const iconBar = uiComponent({
            type: Html.Div,
            classes: [BubbleUI.BoxRow, BubbleUI.BoxXEnd],
        });
        topBar.appendChild(iconBar);
        const themeIconButton = uiComponent({
            styles: { cursor: "pointer" },
        });
        const themeIcon = getIcon("material", Theme.isDark() ? "light_theme" : "dark_mode", "24px", "var(--on-surface-1)");
        themeIcon.id = "theme-icon";
        themeIconButton.appendChild(themeIcon);
        iconBar.appendChild(themeIconButton);
        setDomEvents(themeIcon, {
            click: (e) => Theme.toggle(),
        });
        return topBar;
    }
}
// HTML ids and classes
HomeView.VIEW_ID = "home";
export default HomeView;

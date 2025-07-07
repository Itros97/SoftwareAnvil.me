import { BubbleUI } from "../lib/bubble.js";
import { getConfiguration } from "../lib/configuration.js";
import { setDomEvents, uiComponent } from "../lib/dom.js";
import { Html } from "../lib/html.js";
import { httpGet } from "../lib/http.js";
import { getIcon } from "../lib/icons.js";
import MarkdownService from "../services/markdownservice.js";
import { Theme } from "../services/theme.js";

export default class HomeView {
  // HTML ids and classes
  static readonly VIEW_ID = "home";

  /**
   * Show home view
   */
  static async show(parameters: string[], container: HTMLElement) {
    const view = uiComponent({
      type: Html.View,
      id: HomeView.VIEW_ID,
      classes: [BubbleUI.BoxColumn, BubbleUI.BoxCenter],
    });

    const title = uiComponent({
      type: Html.H1,
      text: getConfiguration("base")["app_name"],
      styles: {
        fontSize: "5rem",
        marginBottom: "3rem",
      },
      selectable: false,
    });

    // Este hace toggle del tema
    // setDomEvents(view, {
    //   click: (e) => {
    //     Theme.toggle();
    //   },
    // });

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
    const githubIcon = getIcon(
      "social",
      "github",
      "24px",
      "var(--on-surface-1)",
    );
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

    view.appendChild(title);
    view.appendChild(description);
    view.appendChild(button);
    view.appendChild(gitButton);
    view.appendChild(doc);
    container.appendChild(view);
  }

  static async getDocumentHTML(): Promise<string> {
    const response = await httpGet({
      url: `${getConfiguration("path")["markdowns"]}/doc.MD`,
      parameters: {},
    });
    return await response.text();
  }
}

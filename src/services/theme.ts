import { setDomDataset } from "../lib/dom.js";
import { emitSignal, setSignal } from "../lib/signals.js";

export const THEME_CHANGED_SIGNAL = setSignal();
export class Theme {
  static toggle() {
    if (document.documentElement.dataset.theme == "dark") {
      setDomDataset(document.documentElement, { theme: "light" });
    } else {
      setDomDataset(document.documentElement, { theme: "dark" });
    }
    emitSignal(THEME_CHANGED_SIGNAL, {});
  }

  static isDark(): boolean {
    return document.documentElement.dataset["theme"] == "dark";
  }
}

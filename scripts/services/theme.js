import { setDomDataset } from "../lib/dom.js";
import { emitSignal, setSignal } from "../lib/signals.js";
export const THEME_CHANGED_SIGNAL = setSignal();
const THEME_STORAGE_KEY = "softwareanvil-theme";
/** Applies the colour theme and remembers the visitor's choice. */
export class Theme {
    /** Apply the saved theme, or the system preference when nothing is saved. */
    static init() {
        Theme.apply(Theme.readStored() ?? Theme.readSystem());
    }
    /** Switch between light and dark and remember the choice. */
    static toggle() {
        const next = Theme.isDark() ? "light" : "dark";
        Theme.apply(next);
        Theme.store(next);
        emitSignal(THEME_CHANGED_SIGNAL, { theme: next });
    }
    /** Whether the dark theme is active. */
    static isDark() {
        return document.documentElement.dataset["theme"] == "dark";
    }
    /** Set the theme on the root element. */
    static apply(theme) {
        setDomDataset(document.documentElement, { theme });
    }
    /** Read the theme preferred by the operating system. */
    static readSystem() {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    /** Read the saved theme, if storage is available and holds a valid value. */
    static readStored() {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            return stored == "light" || stored == "dark" ? stored : undefined;
        }
        catch {
            // Storage blocked (private mode): fall back to the system theme
            return undefined;
        }
    }
    /** Save the theme, ignoring storage that is blocked. */
    static store(theme) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        }
        catch {
            // Storage blocked (private mode): the choice lasts only for this visit
        }
    }
}

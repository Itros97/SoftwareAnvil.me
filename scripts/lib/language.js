/** Every available language, in selector order. */
export const LANGUAGES = ["es", "en"];
/** Language used when neither the stored choice nor the browser match. */
export const DEFAULT_LANGUAGE = "es";
/** Whether a value is one of the available language codes. */
export function isLanguageCode(value) {
    return LANGUAGES.includes(value);
}
/** Pick the language: a valid stored choice, else the first available browser language, else the default. */
export function resolveLanguage(stored, browserLanguages) {
    if (isLanguageCode(stored))
        return stored;
    const browserMatch = browserLanguages
        .map(locale => locale.toLowerCase().split("-")[0])
        .find(isLanguageCode);
    return browserMatch ?? DEFAULT_LANGUAGE;
}

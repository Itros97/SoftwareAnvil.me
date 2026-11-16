/** The languages the site is available in. */
export type LanguageCode = "es" | "en"

/** Every available language, in selector order. */
export const LANGUAGES: readonly LanguageCode[] = ["es", "en"]

/** Language used when neither the stored choice nor the browser match. */
export const DEFAULT_LANGUAGE: LanguageCode = "es"

/** Whether a value is one of the available language codes. */
export function isLanguageCode(value: unknown): value is LanguageCode {
	return LANGUAGES.includes(value as LanguageCode)
}

/** Pick the language: a valid stored choice, else the first available browser language, else the default. */
export function resolveLanguage(stored: string | null | undefined, browserLanguages: readonly string[]): LanguageCode {
	if (isLanguageCode(stored)) return stored

	const browserMatch = browserLanguages
		.map(locale => locale.toLowerCase().split("-")[0])
		.find(isLanguageCode)

	return browserMatch ?? DEFAULT_LANGUAGE
}

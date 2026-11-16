import { setDomAttributes } from "../lib/dom.js"
import { LanguageCode, resolveLanguage } from "../lib/language.js"
import { emitSignal, setSignal } from "../lib/signals.js"

export const LANGUAGE_CHANGED_SIGNAL = setSignal()
const LANGUAGE_STORAGE_KEY = "softwareanvil-language"

/** Holds the current language and remembers the visitor's choice. */
export class LanguageService {
	private static current: LanguageCode = resolveLanguage(undefined, [])

	/** Apply the saved language, or the best match among the browser languages. */
	static init(): void {
		LanguageService.apply(resolveLanguage(LanguageService.readStored(), navigator.languages))
	}

	/** The current language. */
	static get(): LanguageCode {
		return LanguageService.current
	}

	/** Switch to the given language, remember it and notify listeners. */
	static set(language: LanguageCode): void {
		if (language == LanguageService.current) return

		LanguageService.apply(language)
		LanguageService.store(language)
		emitSignal(LANGUAGE_CHANGED_SIGNAL, { language })
	}

	/** Set the language as current and on the root element. */
	private static apply(language: LanguageCode): void {
		LanguageService.current = language
		setDomAttributes(document.documentElement, { lang: language })
	}

	/** Read the saved language, if storage is available. */
	private static readStored(): string | null {
		try {
			return localStorage.getItem(LANGUAGE_STORAGE_KEY)
		} catch {
			// Storage blocked (private mode): fall back to the browser languages
			return null
		}
	}

	/** Save the language, ignoring storage that is blocked. */
	private static store(language: LanguageCode): void {
		try {
			localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
		} catch {
			// Storage blocked (private mode): the choice lasts only for this visit
		}
	}
}

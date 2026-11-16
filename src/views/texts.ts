import { LanguageCode } from "../lib/language.js"
import { LanguageService } from "../services/languageservice.js"

const ES = {
	LOCALE: "es-ES",
	NAV_HOME: "Inicio",
	NAV_PROJECTS: "Proyectos",
	NAV_BLOG: "Blog",
	NAV_SETUP: "Setup",
	NAV_LABEL: "Principal",
	TOGGLE_THEME: "Cambiar tema",
	LANGUAGE_LABEL: "Idioma",
	ABOUT_TITLE: "Sobre mí",
	SETUP_TITLE: "Mi setup",
	SETUP_INTRO: "El ordenador y las herramientas con las que trabajo cada día.",
	SETUP_LINK: "Ver mi setup →",
	PROJECTS_TITLE: "Proyectos",
	PROJECTS_INTRO: "Cosas que he construido o en las que estoy trabajando.",
	BLOG_TITLE: "Blog",
	BLOG_INTRO: "Notas sobre lo que construyo y aprendo.",
	LATEST_POSTS_TITLE: "Últimos posts",
	SEE_ALL: "Ver todos →",
	BACK_TO_BLOG: "← Volver al blog",
	NO_PROJECTS: "Todavía no hay proyectos.",
	NO_POSTS: "Todavía no hay posts.",
	LOAD_ERROR: "No se ha podido cargar el contenido. Prueba a recargar la página.",
	NOT_FOUND_TITLE: "404",
	NOT_FOUND_TEXT: "Esta página no existe.",
	NOT_FOUND_LINK: "← Volver al inicio",
	GAME_OPEN: "Abrir minijuego",
	GAME_TITLE: "forge — terminal",
	GAME_HELP: "Escribe cada comando tal cual. Tienes 30 segundos y el tiempo empieza con la primera tecla.",
	GAME_INPUT_LABEL: "Escribe el comando",
	GAME_CLOSE: "Cerrar",
	GAME_SCORE: "puntos",
	GAME_WPM: "ppm",
	GAME_BEST: "récord",
	GAME_NEXT: "siguiente",
	GAME_OVER: "¡Tiempo!",
	GAME_NEW_BEST: "¡Nuevo récord!",
	GAME_RESTART: "Pulsa Enter para jugar otra vez · Esc para salir",
}

/** Every interface text; each language must define all of them. */
export type Texts = { readonly [Key in keyof typeof ES]: string }

const EN: Texts = {
	LOCALE: "en-US",
	NAV_HOME: "Home",
	NAV_PROJECTS: "Projects",
	NAV_BLOG: "Blog",
	NAV_SETUP: "Setup",
	NAV_LABEL: "Main",
	TOGGLE_THEME: "Toggle theme",
	LANGUAGE_LABEL: "Language",
	ABOUT_TITLE: "About me",
	SETUP_TITLE: "My setup",
	SETUP_INTRO: "The computer and tools I work with every day.",
	SETUP_LINK: "See my setup →",
	PROJECTS_TITLE: "Projects",
	PROJECTS_INTRO: "Things I have built or am working on.",
	BLOG_TITLE: "Blog",
	BLOG_INTRO: "Notes on what I build and learn.",
	LATEST_POSTS_TITLE: "Latest posts",
	SEE_ALL: "See all →",
	BACK_TO_BLOG: "← Back to the blog",
	NO_PROJECTS: "No projects yet.",
	NO_POSTS: "No posts yet.",
	LOAD_ERROR: "The content could not be loaded. Try reloading the page.",
	NOT_FOUND_TITLE: "404",
	NOT_FOUND_TEXT: "This page does not exist.",
	NOT_FOUND_LINK: "← Back to home",
	GAME_OPEN: "Open minigame",
	GAME_TITLE: "forge — terminal",
	GAME_HELP: "Type each command exactly. You have 30 seconds, and the clock starts with your first keystroke.",
	GAME_INPUT_LABEL: "Type the command",
	GAME_CLOSE: "Close",
	GAME_SCORE: "score",
	GAME_WPM: "wpm",
	GAME_BEST: "best",
	GAME_NEXT: "next",
	GAME_OVER: "Time's up!",
	GAME_NEW_BEST: "New best score!",
	GAME_RESTART: "Press Enter to play again · Esc to quit",
}

const TEXTS_BY_LANGUAGE: Record<LanguageCode, Texts> = { es: ES, en: EN }

/** The interface texts in the current language. */
export function getTexts(): Texts {
	return TEXTS_BY_LANGUAGE[LanguageService.get()]
}

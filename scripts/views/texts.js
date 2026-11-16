import { LanguageService } from "../services/languageservice.js";
const ES = {
    LOCALE: "es-ES",
    NAV_HOME: "Inicio",
    NAV_PROJECTS: "Proyectos",
    NAV_BLOG: "Blog",
    NAV_LABEL: "Principal",
    TOGGLE_THEME: "Cambiar tema",
    LANGUAGE_LABEL: "Idioma",
    ABOUT_TITLE: "Sobre mí",
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
};
const EN = {
    LOCALE: "en-US",
    NAV_HOME: "Home",
    NAV_PROJECTS: "Projects",
    NAV_BLOG: "Blog",
    NAV_LABEL: "Main",
    TOGGLE_THEME: "Toggle theme",
    LANGUAGE_LABEL: "Language",
    ABOUT_TITLE: "About me",
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
};
const TEXTS_BY_LANGUAGE = { es: ES, en: EN };
/** The interface texts in the current language. */
export function getTexts() {
    return TEXTS_BY_LANGUAGE[LanguageService.get()];
}

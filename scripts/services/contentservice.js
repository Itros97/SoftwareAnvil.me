import { getConfiguration } from "../lib/configuration.js";
import { filterNonEmptyGroups, sortPostsByDate } from "../lib/content.js";
import { LanguageService } from "./languageservice.js";
/** Loads the site content (profile, projects, posts) in the current language from the content folder. */
class ContentService {
    /** Load the site owner's profile. */
    static async getProfile() {
        return JSON.parse(await ContentService.fetchText("profile.json"));
    }
    /** Load every project, in the order they appear in projects.json. */
    static async getProjects() {
        return JSON.parse(await ContentService.fetchText("projects.json"));
    }
    /** Load every post entry, newest first. */
    static async getPosts() {
        return sortPostsByDate(JSON.parse(await ContentService.fetchText("posts.json")));
    }
    /** Load the "about me" markdown. */
    static async getAbout() {
        return ContentService.fetchText("about.md");
    }
    /** Load the computer setup groups, skipping the empty ones. */
    static async getSetup() {
        return filterNonEmptyGroups(JSON.parse(await ContentService.fetchText("setup.json")));
    }
    /** Load the markdown body of a post. */
    static async getPostBody(post) {
        return ContentService.fetchText(`posts/${post.slug}.md`);
    }
    /** Fetch a content file in the current language as text, caching it for the session. */
    static fetchText(file) {
        const path = `${LanguageService.get()}/${file}`;
        const cached = ContentService.cache.get(path);
        if (cached)
            return cached;
        const request = ContentService.request(path);
        ContentService.cache.set(path, request);
        // Forget failed requests so the next navigation can retry
        request.catch(() => ContentService.cache.delete(path));
        return request;
    }
    /** Request a content file, failing with context on a non-OK response. */
    static async request(path) {
        const url = `${getConfiguration("path")["content"]}/${path}`;
        // Revalidate on every load so content edits show up without waiting for the cache to expire
        const response = await fetch(url, { cache: "no-cache" });
        if (!response.ok)
            throw new Error(`Could not load ${url}: HTTP ${response.status}`);
        return response.text();
    }
}
ContentService.cache = new Map();
export default ContentService;

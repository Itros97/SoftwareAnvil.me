import { getConfiguration } from "../lib/configuration.js";
import { sortPostsByDate } from "../lib/content.js";
/** Loads the site content (profile, projects, posts) from the content folder. */
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
    /** Load the markdown body of a post. */
    static async getPostBody(post) {
        return ContentService.fetchText(`posts/${post.slug}.md`);
    }
    /** Fetch a content file as text, caching it for the session. */
    static fetchText(file) {
        const cached = ContentService.cache.get(file);
        if (cached)
            return cached;
        const request = ContentService.request(file);
        ContentService.cache.set(file, request);
        // Forget failed requests so the next navigation can retry
        request.catch(() => ContentService.cache.delete(file));
        return request;
    }
    /** Request a content file, failing with context on a non-OK response. */
    static async request(file) {
        const url = `${getConfiguration("path")["content"]}/${file}`;
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`Could not load ${url}: HTTP ${response.status}`);
        return response.text();
    }
}
ContentService.cache = new Map();
export default ContentService;

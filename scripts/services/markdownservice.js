import { Marked } from "../lib/markdown/markdown.js";
export default class MarkdownService {
    static render(markdown) {
        return Marked.parse(markdown);
    }
}

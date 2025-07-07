import { Marked } from "../lib/markdown/markdown.js";

export default class MarkdownService {
  static render(markdown: string): string {
    return Marked.parse(markdown);
  }
}

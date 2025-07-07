/**
 * @license
 *
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 *
 * Copyright (c) 2018-2021, Костя Третяк. (MIT Licensed)
 * https://github.com/ts-stack/markdown
 */
import { Marked } from "./marked.js";
export class Renderer {
    constructor(options) {
        this.options = options || Marked.options;
    }
    code(code, lang, escaped, meta) {
        if (this.options.highlight) {
            const out = this.options.highlight(code, lang);
            if (out != null && out !== code) {
                escaped = true;
                code = out;
            }
        }
        const escapedCode = escaped ? code : this.options.escape(code, true);
        if (!lang) {
            return `\n<pre><code>${escapedCode}\n</code></pre>\n`;
        }
        const className = this.options.langPrefix + this.options.escape(lang, true);
        return `\n<pre><code class="${className}">${escapedCode}\n</code></pre>\n`;
    }
    blockquote(quote) {
        return `<blockquote>\n${quote}</blockquote>\n`;
    }
    html(html) {
        return html;
    }
    heading(text, level, raw) {
        const id = this.options.headerPrefix + raw.toLowerCase().replace(/[^\w]+/g, "-");
        return `<h${level} id="${id}">${text}</h${level}>\n`;
    }
    hr() {
        return this.options.xhtml ? "<hr/>\n" : "<hr>\n";
    }
    list(body, ordered) {
        const type = ordered ? "ol" : "ul";
        return `\n<${type}>\n${body}</${type}>\n`;
    }
    listitem(text) {
        return "<li>" + text + "</li>\n";
    }
    paragraph(text) {
        return "<p>" + text + "</p>\n";
    }
    table(header, body) {
        return `
<table>
<thead>
${header}</thead>
<tbody>
${body}</tbody>
</table>
`;
    }
    tablerow(content) {
        return "<tr>\n" + content + "</tr>\n";
    }
    tablecell(content, flags) {
        const type = flags.header ? "th" : "td";
        const tag = flags.align
            ? "<" + type + ' style="text-align:' + flags.align + '">'
            : "<" + type + ">";
        return tag + content + "</" + type + ">\n";
    }
    // *** Inline level renderer methods. ***
    strong(text) {
        return "<strong>" + text + "</strong>";
    }
    em(text) {
        return "<em>" + text + "</em>";
    }
    codespan(text) {
        return "<code>" + text + "</code>";
    }
    br() {
        return this.options.xhtml ? "<br/>" : "<br>";
    }
    del(text) {
        return "<del>" + text + "</del>";
    }
    link(href, title, text) {
        if (this.options.sanitize) {
            let prot;
            try {
                prot = decodeURIComponent(this.options.unescape(href))
                    .replace(/[^\w:]/g, "")
                    .toLowerCase();
            }
            catch (e) {
                return text;
            }
            if (prot.indexOf("javascript:") === 0 ||
                prot.indexOf("vbscript:") === 0 ||
                prot.indexOf("data:") === 0) {
                return text;
            }
        }
        let out = '<a href="' + href + '"';
        if (title) {
            out += ' title="' + title + '"';
        }
        out += ">" + text + "</a>";
        return out;
    }
    image(href, title, text) {
        let out = '<img src="' + href + '" alt="' + text + '"';
        if (title) {
            out += ' title="' + title + '"';
        }
        out += this.options.xhtml ? "/>" : ">";
        return out;
    }
    text(text) {
        return text;
    }
}

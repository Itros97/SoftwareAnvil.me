/**
 * @license
 *
 * Copyright (c) 2018-2021, Костя Третяк. (MIT Licensed)
 * https://github.com/ts-stack/markdown
 */
import { escape, unescape } from "./helpers.js";
export var TokenType;
(function (TokenType) {
    TokenType[TokenType["space"] = 1] = "space";
    TokenType[TokenType["text"] = 2] = "text";
    TokenType[TokenType["paragraph"] = 3] = "paragraph";
    TokenType[TokenType["heading"] = 4] = "heading";
    TokenType[TokenType["listStart"] = 5] = "listStart";
    TokenType[TokenType["listEnd"] = 6] = "listEnd";
    TokenType[TokenType["looseItemStart"] = 7] = "looseItemStart";
    TokenType[TokenType["looseItemEnd"] = 8] = "looseItemEnd";
    TokenType[TokenType["listItemStart"] = 9] = "listItemStart";
    TokenType[TokenType["listItemEnd"] = 10] = "listItemEnd";
    TokenType[TokenType["blockquoteStart"] = 11] = "blockquoteStart";
    TokenType[TokenType["blockquoteEnd"] = 12] = "blockquoteEnd";
    TokenType[TokenType["code"] = 13] = "code";
    TokenType[TokenType["table"] = 14] = "table";
    TokenType[TokenType["html"] = 15] = "html";
    TokenType[TokenType["hr"] = 16] = "hr";
})(TokenType || (TokenType = {}));
export class MarkedOptions {
    constructor() {
        this.gfm = true;
        this.tables = true;
        this.breaks = false;
        this.pedantic = false;
        this.sanitize = false;
        this.mangle = true;
        this.smartLists = false;
        this.silent = false;
        this.langPrefix = "lang-";
        this.smartypants = false;
        this.headerPrefix = "";
        /**
         * Self-close the tags for void elements (&lt;br/&gt;, &lt;img/&gt;, etc.)
         * with a "/" as required by XHTML.
         */
        this.xhtml = false;
        /**
         * The function that will be using to escape HTML entities.
         * By default using inner helper.
         */
        this.escape = escape;
        /**
         * The function that will be using to unescape HTML entities.
         * By default using inner helper.
         */
        this.unescape = unescape;
    }
}

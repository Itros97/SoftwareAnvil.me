/** A syntax error with the position in the source where it was found. */
export class CompileError extends Error {
    constructor(code, position) {
        super(`${code} at position ${position}`);
        this.name = "CompileError";
        this.code = code;
        this.position = position;
    }
}

const OPCODES = { "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV", "%": "MOD", "^": "POW" };
/** Turn a syntax tree into stack instructions: operands first, then the operation (postfix order). */
export function compile(node) {
    switch (node.type) {
        case "number": return [{ op: "PUSH", value: node.value }];
        case "negate": return [...compile(node.operand), { op: "NEG" }];
        case "binary": return [...compile(node.left), ...compile(node.right), { op: OPCODES[node.operator] }];
    }
}

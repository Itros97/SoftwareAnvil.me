/** Draw a syntax tree as text lines with box-drawing branches. */
export function formatTree(node) {
    return formatBranch(node, "", "");
}
/** Draw one node with the given prefix for its own line and for the lines of its children. */
function formatBranch(node, linePrefix, childPrefix) {
    const children = getChildren(node);
    const lines = [linePrefix + getLabel(node)];
    children.forEach((child, index) => {
        const isLast = index == children.length - 1;
        lines.push(...formatBranch(child, childPrefix + (isLast ? "└─ " : "├─ "), childPrefix + (isLast ? "   " : "│  ")));
    });
    return lines;
}
/** The text shown for a node. */
function getLabel(node) {
    switch (node.type) {
        case "number": return String(node.value);
        case "negate": return "neg";
        case "binary": return node.operator;
    }
}
/** The operands of a node, left to right. */
function getChildren(node) {
    switch (node.type) {
        case "number": return [];
        case "negate": return [node.operand];
        case "binary": return [node.left, node.right];
    }
}
/** Write an instruction like assembly: opcode and optional operand. */
export function formatInstruction(instruction) {
    return instruction.op == "PUSH" ? `PUSH ${instruction.value}` : instruction.op;
}

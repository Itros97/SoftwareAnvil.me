/** Safety cap: every start below 10^6 reaches 1 in fewer than 600 steps. */
export const DEFAULT_MAX_STEPS = 10_000;
/** The next Collatz term: half of an even number, 3n + 1 of an odd one. */
function nextTerm(value) {
    return value % 2 == 0 ? value / 2 : 3 * value + 1;
}
/** Every term from n down to 1, both included. */
export function collatzSequence(n, maxSteps = DEFAULT_MAX_STEPS) {
    const sequence = [n];
    let value = n;
    while (value != 1) {
        if (sequence.length > maxSteps)
            throw new Error(`Collatz sequence of ${n} did not reach 1 within ${maxSteps} steps`);
        value = nextTerm(value);
        sequence.push(value);
    }
    return sequence;
}
/** Count the steps of a sequence and find its peak. */
export function summarizeSequence(sequence) {
    return { steps: sequence.length - 1, peak: Math.max(...sequence) };
}
/** Check every start from 1 to limit, reusing the step counts of smaller numbers already solved. */
export function verifyRange(limit, maxSteps = DEFAULT_MAX_STEPS) {
    const stepsByStart = new Uint16Array(limit + 1);
    const longest = { n: 1, steps: 0 };
    for (let start = 2; start <= limit; start++) {
        let value = start;
        let steps = 0;
        // Walk until falling below the start, where the remaining steps are already known
        while (value >= start) {
            if (steps > maxSteps)
                throw new Error(`Collatz sequence of ${start} did not reach 1 within ${maxSteps} steps`);
            value = nextTerm(value);
            steps++;
        }
        stepsByStart[start] = steps + stepsByStart[value];
        if (stepsByStart[start] > longest.steps) {
            longest.n = start;
            longest.steps = stepsByStart[start];
        }
    }
    return { checked: limit, longest };
}
/** Keep the first and last `edge` terms of a long sequence, with null marking the gap between them. */
export function previewSequence(sequence, edge) {
    if (sequence.length <= edge * 2 + 1)
        return sequence;
    return [...sequence.slice(0, edge), null, ...sequence.slice(-edge)];
}

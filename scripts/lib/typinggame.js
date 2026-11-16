/** Shell commands the player has to type. */
export const COMMANDS = [
    "git push",
    "git status",
    "git commit -m \"fix\"",
    "git pull --rebase",
    "npm run build",
    "npm test",
    "npm install",
    "ls -la",
    "cd ~/forge",
    "mkdir anvil",
    "cat README.md",
    "grep -r TODO src",
    "tsc --watch",
    "docker compose up",
    "ssh forge@anvil",
    "chmod +x bin/lit",
    "echo \"hello\"",
    "rm -rf node_modules",
];
/** Compare the typed text with the target command. */
export function compareInput(target, typed) {
    let correct = 0;
    while (correct < typed.length && typed[correct] == target[correct])
        correct++;
    const hasError = correct < typed.length;
    return { correct, hasError, complete: !hasError && typed.length == target.length };
}
/** Words per minute, counting five characters as one word. */
export function calculateWpm(correctChars, elapsedMs) {
    if (elapsedMs <= 0)
        return 0;
    return Math.round((correctChars / 5) / (elapsedMs / 60_000));
}
/** Pick a random command different from the previous one, when there is more than one. */
export function pickNextCommand(commands, previous, random) {
    if (commands.length == 0)
        throw new Error("pickNextCommand needs at least one command");
    const candidates = commands.length > 1 ? commands.filter(command => command != previous) : commands;
    return candidates[Math.floor(random() * candidates.length)];
}

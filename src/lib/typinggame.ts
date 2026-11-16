/** Shell commands the player has to type. */
export const COMMANDS: readonly string[] = [
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
]

/** How the typed text compares with the target command. */
export interface InputCheck {
	/** Characters that match the target from the start. */
	correct: number
	/** Whether the typed text diverges from the target. */
	hasError: boolean
	/** Whether the typed text is exactly the target. */
	complete: boolean
}

/** Compare the typed text with the target command. */
export function compareInput(target: string, typed: string): InputCheck {
	let correct = 0
	while (correct < typed.length && typed[correct] == target[correct]) correct++

	const hasError = correct < typed.length
	return { correct, hasError, complete: !hasError && typed.length == target.length }
}

/** Words per minute, counting five characters as one word. */
export function calculateWpm(correctChars: number, elapsedMs: number): number {
	if (elapsedMs <= 0) return 0
	return Math.round((correctChars / 5) / (elapsedMs / 60_000))
}

/** Pick a random command different from the previous one, when there is more than one. */
export function pickNextCommand(commands: readonly string[], previous: string | undefined, random: () => number): string {
	if (commands.length == 0) throw new Error("pickNextCommand needs at least one command")

	const candidates = commands.length > 1 ? commands.filter(command => command != previous) : commands
	return candidates[Math.floor(random() * candidates.length)]
}

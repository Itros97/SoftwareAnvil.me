/** One step of the sieve: a prime and the multiples it crosses out for the first time. */
export interface SieveStep {
	prime: number
	crossed: number[]
}

/** A cell of the Ulam spiral; y grows downwards, like screen coordinates. */
export interface GridPoint {
	x: number
	y: number
}

/** Mark every composite up to limit; index i is true when i is prime. */
function sieve(limit: number): boolean[] {
	const isPrime = Array.from({ length: limit + 1 }, (_, index) => index >= 2)
	for (let p = 2; p * p <= limit; p++) {
		if (!isPrime[p]) continue
		for (let multiple = p * p; multiple <= limit; multiple += p) isPrime[multiple] = false
	}
	return isPrime
}

/** Every prime from 2 to limit, in order. */
export function primesUpTo(limit: number): number[] {
	return sieve(limit).flatMap((isPrime, index) => isPrime ? [index] : [])
}

/** The steps of the sieve of Eratosthenes; primes above the square root of limit cross nothing, so they have no step. */
export function sieveSteps(limit: number): SieveStep[] {
	const isCrossed = new Array<boolean>(limit + 1).fill(false)
	const steps: SieveStep[] = []
	for (let p = 2; p * p <= limit; p++) {
		if (isCrossed[p]) continue
		const crossed: number[] = []
		for (let multiple = p * p; multiple <= limit; multiple += p) {
			if (isCrossed[multiple]) continue
			isCrossed[multiple] = true
			crossed.push(multiple)
		}
		steps.push({ prime: p, crossed })
	}
	return steps
}

/** Positions of 1..count on the Ulam spiral: right 1, up 1, left 2, down 2, right 3... */
export function ulamPath(count: number): GridPoint[] {
	const directions = [{ x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }]
	const path: GridPoint[] = []
	let point = { x: 0, y: 0 }
	let turn = 0
	let length = 1
	while (path.length < count) {
		for (let step = 0; step < length && path.length < count; step++) {
			path.push(point)
			const direction = directions[turn % 4]
			point = { x: point.x + direction.x, y: point.y + direction.y }
		}
		turn++
		// The side length grows after every second turn
		if (turn % 2 == 0) length++
	}
	return path
}

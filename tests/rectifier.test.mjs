import { test } from "node:test"
import assert from "node:assert/strict"
import { measureWave, sampleWave } from "../scripts/lib/rectifier.js"

const PARAMS = { amplitude: 10, frequency: 50, capacitance: 470, load: 1000 }

/** Assert two numbers match within a tolerance. */
function assertClose(actual, expected, tolerance) {
	assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`)
}

test("sampleWave returns periods times samples per period values", () => {
	assert.equal(sampleWave("ac", PARAMS, 3, 100).length, 300)
})

test("AC averages zero and has an RMS of amplitude over root two", () => {
	const measure = measureWave(sampleWave("ac", PARAMS, 3, 400))
	assertClose(measure.average, 0, 0.01)
	assertClose(measure.rms, 10 / Math.SQRT2, 0.01)
	assertClose(measure.ripple, 20, 0.01)
})

test("half wave never goes negative and averages amplitude over pi", () => {
	const values = sampleWave("half", PARAMS, 3, 400)
	assert.ok(values.every(value => value >= 0))
	assertClose(measureWave(values).average, 10 / Math.PI, 0.02)
})

test("full wave is the absolute value of AC and averages twice the half wave", () => {
	const ac = sampleWave("ac", PARAMS, 3, 400)
	const full = sampleWave("full", PARAMS, 3, 400)
	full.forEach((value, index) => assertClose(value, Math.abs(ac[index]), 1e-9))
	assertClose(measureWave(full).average, 20 / Math.PI, 0.02)
})

test("filtered wave stays near the peak and ripples less with a bigger capacitor", () => {
	const small = measureWave(sampleWave("filtered", { ...PARAMS, capacitance: 100 }, 3, 400))
	const big = measureWave(sampleWave("filtered", { ...PARAMS, capacitance: 2200 }, 3, 400))
	assert.ok(big.ripple < small.ripple)
	assert.ok(big.average > 9)
})

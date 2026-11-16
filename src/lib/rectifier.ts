/** Each stage of turning alternating current into direct current. */
export type RectifierStage = "ac" | "half" | "full" | "filtered"

/** Circuit values: volts, hertz, microfarads and ohms. */
export interface CircuitParams {
	amplitude: number
	frequency: number
	capacitance: number
	load: number
}

/** Summary of a wave: mean value, root mean square and peak-to-peak ripple, in volts. */
export interface WaveMeasure {
	average: number
	rms: number
	ripple: number
}

/** Sample a stage over whole periods, with ideal diodes; one hidden warm-up period lets the capacitor charge first. */
export function sampleWave(stage: RectifierStage, params: CircuitParams, periods: number, samplesPerPeriod: number): number[] {
	const total = (periods + 1) * samplesPerPeriod
	const dt = 1 / (params.frequency * samplesPerPeriod)
	const timeConstant = params.load * params.capacitance * 1e-6
	const values: number[] = []
	let capacitor = 0

	for (let i = 0; i < total; i++) {
		const ac = params.amplitude * Math.sin(2 * Math.PI * params.frequency * i * dt)
		const full = Math.abs(ac)
		// The diodes recharge the capacitor while the input is higher; otherwise it discharges through the load
		capacitor = Math.max(full, capacitor * Math.exp(-dt / timeConstant))
		values.push(pickStage(stage, ac, full, capacitor))
	}
	return values.slice(samplesPerPeriod)
}

/** The output of the given stage for one instant. */
function pickStage(stage: RectifierStage, ac: number, full: number, capacitor: number): number {
	switch (stage) {
		case "ac": return ac
		case "half": return Math.max(0, ac)
		case "full": return full
		case "filtered": return capacitor
	}
}

/** Measure the mean, RMS and ripple of a sampled wave. */
export function measureWave(values: number[]): WaveMeasure {
	if (values.length == 0) throw new Error("Cannot measure a wave without samples")
	const sum = values.reduce((total, value) => total + value, 0)
	const squares = values.reduce((total, value) => total + value * value, 0)
	return {
		average: sum / values.length,
		rms: Math.sqrt(squares / values.length),
		ripple: Math.max(...values) - Math.min(...values),
	}
}

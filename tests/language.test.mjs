import { test } from "node:test"
import assert from "node:assert/strict"
import { resolveLanguage } from "../scripts/lib/language.js"

test("resolveLanguage uses the stored language when it is valid", () => {
	assert.equal(resolveLanguage("en", ["es-ES"]), "en")
})

test("resolveLanguage ignores an invalid stored value and uses the browser language", () => {
	assert.equal(resolveLanguage("fr", ["en-US"]), "en")
})

test("resolveLanguage matches the browser language by prefix", () => {
	assert.equal(resolveLanguage(null, ["en-GB"]), "en")
})

test("resolveLanguage picks the first available browser language", () => {
	assert.equal(resolveLanguage(undefined, ["fr-FR", "de", "en", "es"]), "en")
})

test("resolveLanguage falls back to Spanish when nothing matches", () => {
	assert.equal(resolveLanguage(null, ["fr", "de"]), "es")
	assert.equal(resolveLanguage(null, []), "es")
})

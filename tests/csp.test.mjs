import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const INDEX = readFileSync(new URL("../index.html", import.meta.url), "utf8")

/** Read the Content-Security-Policy meta tag of index.html as a map of directive -> sources. */
function readPolicy() {
	const match = INDEX.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)
	assert.ok(match, "index.html must declare a Content-Security-Policy meta tag")
	return new Map(match[1].split(";").map(part => part.trim().split(/\s+/)).map(([name, ...sources]) => [name, sources]))
}

test("CSP is declared before any stylesheet or script is loaded", () => {
	const policyAt = INDEX.indexOf("Content-Security-Policy")
	assert.ok(policyAt < INDEX.indexOf("<link"))
	assert.ok(policyAt < INDEX.indexOf("<script"))
})

test("CSP only runs scripts from the site itself", () => {
	assert.deepEqual(readPolicy().get("script-src"), ["'self'"])
})

test("CSP never allows inline scripts or eval", () => {
	const policy = readPolicy()
	for (const directive of ["script-src", "default-src"]) {
		assert.ok(!policy.get(directive).includes("'unsafe-inline'"), `${directive} allows inline scripts`)
		assert.ok(!policy.get(directive).includes("'unsafe-eval'"), `${directive} allows eval`)
	}
})

test("CSP blocks plugins and base tag hijacking", () => {
	const policy = readPolicy()
	assert.deepEqual(policy.get("object-src"), ["'none'"])
	assert.deepEqual(policy.get("base-uri"), ["'self'"])
})

test("index.html has no inline scripts that the CSP would block", () => {
	const scripts = INDEX.match(/<script\b[^>]*>/g) ?? []
	assert.ok(scripts.length > 0)
	scripts.forEach(tag => assert.match(tag, /\bsrc="/, `inline script found: ${tag}`))
})

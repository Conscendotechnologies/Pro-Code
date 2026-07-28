import { describe, it, expect } from "vitest"

import { FORGE_FEATURES, getForgeFeature, validateForgeArgs, type ForgeFeature } from "../forgeFeatureRegistry"

describe("forgeFeatureRegistry", () => {
	it("exposes a non-empty, uniquely-named feature set", () => {
		expect(FORGE_FEATURES.length).toBeGreaterThan(0)
		const names = FORGE_FEATURES.map((f) => f.name)
		expect(new Set(names).size).toBe(names.length) // no duplicates
	})

	it("has both read and mutating features, all with a run() and summary", () => {
		expect(FORGE_FEATURES.some((f) => !f.mutating)).toBe(true)
		expect(FORGE_FEATURES.some((f) => f.mutating)).toBe(true)
		for (const f of FORGE_FEATURES) {
			expect(typeof f.run).toBe("function")
			expect(f.summary.length).toBeGreaterThan(0)
		}
	})

	it("flags known write/credential features as mutating", () => {
		for (const name of ["sfRun", "updateRecords", "authorizeOrg", "retrieveTypes", "generateApexTest"]) {
			expect(getForgeFeature(name)?.mutating).toBe(true)
		}
	})

	it("flags known read features as non-mutating", () => {
		for (const name of ["query", "describeObject", "listObjects", "runApexTests", "listOrgs"]) {
			expect(getForgeFeature(name)?.mutating).toBe(false)
		}
	})

	it("getForgeFeature returns undefined for unknown names", () => {
		expect(getForgeFeature("definitely_not_a_feature")).toBeUndefined()
	})

	describe("validateForgeArgs", () => {
		const query = getForgeFeature("query") as ForgeFeature

		it("passes with the required arg present and correct type", () => {
			expect(validateForgeArgs(query, { soql: "SELECT Id FROM Account" })).toBeUndefined()
		})

		it("rejects a missing required arg", () => {
			expect(validateForgeArgs(query, {})).toMatch(/missing required arg "soql"/i)
		})

		it("rejects a wrong-typed required arg", () => {
			expect(validateForgeArgs(query, { soql: 123 })).toMatch(/must be string/i)
		})

		it("allows optional args to be absent", () => {
			// query's projectRoot is optional
			expect(validateForgeArgs(query, { soql: "SELECT Id FROM Account" })).toBeUndefined()
		})

		it("validates string[] args (sfRun.args)", () => {
			const sfRun = getForgeFeature("sfRun") as ForgeFeature
			expect(validateForgeArgs(sfRun, { args: ["org", "list"] })).toBeUndefined()
			expect(validateForgeArgs(sfRun, { args: "org list" })).toMatch(/must be string\[\]/i)
			expect(validateForgeArgs(sfRun, {})).toMatch(/missing required arg "args"/i)
		})
	})
})

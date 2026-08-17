import { describe, it, expect } from "vitest"

import { getLeanOutputSection } from "../lean-output"

describe("getLeanOutputSection", () => {
	it("always includes the ponytail/efficiency block", () => {
		for (const mode of ["code", "salesforce-agent", "orchestrator"]) {
			expect(getLeanOutputSection(mode)).toContain("EFFICIENCY")
		}
	})

	it("withholds terse-prose (caveman) in code mode, which emits full artifacts", () => {
		expect(getLeanOutputSection("code")).not.toContain("terse")
	})

	it("includes terse-prose in non-code modes", () => {
		expect(getLeanOutputSection("salesforce-agent")).toContain("terse")
		expect(getLeanOutputSection("orchestrator")).toContain("terse")
	})

	it("returns nothing when SIID_LEAN_OFF=1 (A/B off side)", () => {
		const prev = process.env.SIID_LEAN_OFF
		process.env.SIID_LEAN_OFF = "1"
		try {
			for (const mode of ["code", "salesforce-agent", "orchestrator"]) {
				expect(getLeanOutputSection(mode)).toBe("")
			}
		} finally {
			process.env.SIID_LEAN_OFF = prev
		}
	})
})

import { describe, it, expect, afterEach } from "vitest"

import { getLeanOutputSection } from "../lean-output"

describe("getLeanOutputSection", () => {
	const ORIGINAL_LEAN_OFF = process.env.SIID_LEAN_OFF

	afterEach(() => {
		if (ORIGINAL_LEAN_OFF === undefined) {
			delete process.env.SIID_LEAN_OFF
		} else {
			process.env.SIID_LEAN_OFF = ORIGINAL_LEAN_OFF
		}
	})

	describe("the SIID_LEAN_OFF kill switch", () => {
		it("returns nothing when set to 1 (A/B off side)", () => {
			process.env.SIID_LEAN_OFF = "1"
			for (const mode of ["code", "salesforce-agent", "orchestrator"]) {
				expect(getLeanOutputSection(mode)).toBe("")
			}
		})

		it("stays ON for any other value — only an explicit '1' disables it", () => {
			process.env.SIID_LEAN_OFF = "0"
			expect(getLeanOutputSection("code")).not.toBe("")
			process.env.SIID_LEAN_OFF = "true"
			expect(getLeanOutputSection("code")).not.toBe("")
		})
	})

	describe("the efficiency block", () => {
		it("is injected in every mode, including custom ones", () => {
			for (const mode of ["code", "salesforce-agent", "orchestrator", "some-custom-mode"]) {
				expect(getLeanOutputSection(mode)).toContain("EFFICIENCY")
			}
		})

		it("never tells the model to drop validation, error handling, or security", () => {
			const section = getLeanOutputSection("code")
			expect(section).toContain("Never simplify away input validation")
			expect(section).toContain("security")
		})
	})

	describe("the artifact guarantee", () => {
		// A correctness rule, not a style preference. The modes that most need it are exactly the
		// ones that do NOT receive the terseness block, so it must not ride along with that block.
		it("is present in EVERY mode, artifact-producing or not", () => {
			for (const mode of ["code", "salesforce-agent", "orchestrator", "some-custom-mode"]) {
				const section = getLeanOutputSection(mode)
				expect(section).toContain("Artifacts must be complete")
				expect(section).toContain("must be emitted in full")
			}
		})

		it("explicitly forbids the common truncation shortcuts", () => {
			const section = getLeanOutputSection("code")
			expect(section).toContain("rest unchanged")
			expect(section).toContain("ellipsis")
		})
	})

	describe("terseness scoping", () => {
		it("is withheld from modes whose primary output is a deployable artifact", () => {
			// A terseness instruction sitting beside a .cls is a standing risk of a clipped file.
			// salesforce-agent carries the `edit` group and emits Apex/LWC/metadata too, so it is
			// treated the same as `code` — the previous mode==="code" check missed it.
			expect(getLeanOutputSection("code")).not.toContain("Keep prose replies terse")
			expect(getLeanOutputSection("salesforce-agent")).not.toContain("Keep prose replies terse")
		})

		it("applies to orchestrator, whose own output is coordination prose", () => {
			expect(getLeanOutputSection("orchestrator")).toContain("Keep prose replies terse")
		})

		it("applies to unknown/custom modes, which the artifact guarantee still protects", () => {
			const section = getLeanOutputSection("my-custom-mode")
			expect(section).toContain("Keep prose replies terse")
			expect(section).toContain("Artifacts must be complete")
		})

		it("scopes brevity to prose so it can never be read as license to shorten code", () => {
			expect(getLeanOutputSection("orchestrator")).toContain("PROSE ONLY")
		})
	})
})

import { describe, it, expect } from "vitest"

import { MODE_TO_MODELS, getModelsForMode, getDefaultModelForMode, isModelAvailableForMode } from "../mode-models"

describe("mode-models", () => {
	describe("getModelsForMode", () => {
		it("returns the model list for each known mode", () => {
			for (const mode of ["salesforce-agent", "code", "orchestrator"]) {
				expect(getModelsForMode(mode).length).toBeGreaterThan(0)
			}
		})

		// Unknown modes must stay empty: model-fallback skips fallback on an empty
		// chain and ModelSelector renders nothing, so leaking the full list here
		// would silently give every mode a model picker.
		it("returns an empty array for an unknown mode", () => {
			expect(getModelsForMode("no-such-mode")).toEqual([])
		})

		it("does not fall back to a wildcard entry", () => {
			expect(MODE_TO_MODELS["*"]).toBeUndefined()
		})
	})

	describe("list integrity", () => {
		it("has no duplicate model ids within a mode", () => {
			for (const mode of Object.keys(MODE_TO_MODELS)) {
				const ids = MODE_TO_MODELS[mode].map((m) => m.modelId)
				expect(new Set(ids).size).toBe(ids.length)
			}
		})

		it("gives every model a non-empty id and display name", () => {
			for (const mode of Object.keys(MODE_TO_MODELS)) {
				for (const model of MODE_TO_MODELS[mode]) {
					expect(model.modelId).toBeTruthy()
					expect(model.displayName).toBeTruthy()
				}
			}
		})

		it("keeps at least one free model so the fallback chain is never empty", () => {
			for (const mode of Object.keys(MODE_TO_MODELS)) {
				expect(MODE_TO_MODELS[mode].some((m) => m.tier === "Free")).toBe(true)
			}
		})
	})

	describe("getDefaultModelForMode", () => {
		it("returns the first model in list order", () => {
			const models = getModelsForMode("code")
			expect(getDefaultModelForMode("code")).toEqual(models[0])
		})

		it("returns undefined for an unknown mode", () => {
			expect(getDefaultModelForMode("no-such-mode")).toBeUndefined()
		})
	})

	describe("isModelAvailableForMode", () => {
		it("is true for a model in the list", () => {
			const first = getModelsForMode("code")[0]
			expect(isModelAvailableForMode("code", first.modelId)).toBe(true)
		})

		it("is false for a model that is not in the list", () => {
			expect(isModelAvailableForMode("code", "vendor/removed-model")).toBe(false)
		})

		it("is false for an unknown mode", () => {
			const first = getModelsForMode("code")[0]
			expect(isModelAvailableForMode("no-such-mode", first.modelId)).toBe(false)
		})
	})
})

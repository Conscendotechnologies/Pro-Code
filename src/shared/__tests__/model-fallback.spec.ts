import { describe, it, expect, beforeEach } from "vitest"

import { getModelsForMode } from "../mode-models"
import {
	is429Error,
	getNextModelOnError,
	getFallbackChain,
	getPrimaryModel,
	isFallbackEligible,
	clearTracking,
} from "../model-fallback"

const freeChain = () =>
	getModelsForMode("code")
		.filter((m) => m.tier === "Free")
		.map((m) => m.modelId)

describe("model-fallback", () => {
	beforeEach(() => clearTracking())

	describe("getFallbackChain", () => {
		it("contains only free models, in list order", () => {
			expect(getFallbackChain("code")).toEqual(freeChain())
		})

		it("is empty for an unknown mode", () => {
			expect(getFallbackChain("no-such-mode")).toEqual([])
		})

		it("reports the first free model as primary", () => {
			expect(getPrimaryModel("code")).toBe(freeChain()[0])
		})

		it("has no primary for an unknown mode", () => {
			expect(getPrimaryModel("no-such-mode")).toBeNull()
		})
	})

	describe("is429Error", () => {
		it.each([
			["top-level status", { status: 429 }],
			["top-level code", { code: 429 }],
			["nested code", { error: { code: 429 } }],
			["openrouter raw payload", { error: { metadata: { raw: '{"code":429,"message":"rate limit"}' } } }],
			["message with rate context", { message: "Request failed with 429 rate limit exceeded" }],
		])("detects a 429 from %s", (_label, error) => {
			expect(is429Error(error)).toBe(true)
		})

		it.each([
			["a 500", { status: 500 }],
			["an unrelated message", { message: "socket hang up" }],
			["null", null],
			["undefined", undefined],
		])("does not treat %s as a 429", (_label, error) => {
			expect(is429Error(error)).toBe(false)
		})
	})

	describe("getNextModelOnError", () => {
		it("advances from primary to the next free model", () => {
			const chain = freeChain()
			const result = getNextModelOnError("code", chain[0])
			expect(result.model).toBe(chain[1])
			expect(result.isFallback).toBe(true)
		})

		it("walks the whole chain then cycles back to primary", () => {
			const chain = freeChain()
			for (let i = 0; i < chain.length - 1; i++) {
				expect(getNextModelOnError("code", chain[i]).model).toBe(chain[i + 1])
			}
			const wrapped = getNextModelOnError("code", chain[chain.length - 1])
			expect(wrapped.model).toBe(chain[0])
			expect(wrapped.isFallback).toBe(false)
		})

		// A paid model must not be swapped out from under the user on a 429.
		it("does not switch when the current model is not in the free chain", () => {
			const paid = getModelsForMode("code").find((m) => m.tier === "Premium")!
			const result = getNextModelOnError("code", paid.modelId)
			expect(result.model).toBeNull()
			expect(result.isFallback).toBe(false)
		})

		// This is the delisted-model case: once a model leaves the list, it is no
		// longer in the chain, so no automatic switching happens for it.
		it("does not switch for a model that is no longer in the list", () => {
			const result = getNextModelOnError("code", "vendor/removed-model")
			expect(result.model).toBeNull()
		})

		it("does not switch for an unknown mode", () => {
			expect(getNextModelOnError("no-such-mode", "anything").model).toBeNull()
		})
	})

	describe("isFallbackEligible", () => {
		it("is true for a free model and false for a delisted one", () => {
			expect(isFallbackEligible("code", freeChain()[0])).toBe(true)
			expect(isFallbackEligible("code", "vendor/removed-model")).toBe(false)
		})
	})
})

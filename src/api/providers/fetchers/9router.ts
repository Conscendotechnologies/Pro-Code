import axios from "axios"
import { ModelInfo, nineRouterDefaultModelInfo } from "@siid-code/types"
import type { ModelRecord } from "../../../shared/api"
import { DEFAULT_HEADERS } from "../constants"

/**
 * Fetches available models from a 9Router server
 *
 * @param apiKey Optional API key for the 9Router server
 * @param baseUrl The base URL of the 9Router server (defaults to http://localhost:20128/v1)
 * @returns A promise that resolves to a record of model IDs to model info
 */
export async function getNineRouterModels(
	apiKey?: string,
	baseUrl = "http://localhost:20128/v1",
): Promise<ModelRecord> {
	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...DEFAULT_HEADERS,
		}

		if (apiKey) {
			headers["Authorization"] = `Bearer ${apiKey}`
		}

		const cleanBaseUrl = baseUrl ? baseUrl.trim().replace(/\/+$/, "") : "http://localhost:20128/v1"
		const modelsEndpoint = cleanBaseUrl.endsWith("/models") ? cleanBaseUrl : `${cleanBaseUrl}/models`

		const response = await axios.get(modelsEndpoint, { headers, timeout: 5000 })
		const models: ModelRecord = {}

		const parseModelInfo = (modelObj: any, modelId: string): ModelInfo => {
			const contextWindow =
				typeof modelObj?.context_window === "number"
					? modelObj.context_window
					: typeof modelObj?.context_length === "number"
						? modelObj.context_length
						: typeof modelObj?.max_context_length === "number"
							? modelObj.max_context_length
							: nineRouterDefaultModelInfo.contextWindow

			const maxTokens =
				typeof modelObj?.max_tokens === "number"
					? modelObj.max_tokens
					: typeof modelObj?.max_completion_tokens === "number"
						? modelObj.max_completion_tokens
						: typeof modelObj?.max_output_tokens === "number"
							? modelObj.max_output_tokens
							: nineRouterDefaultModelInfo.maxTokens

			const supportsImages =
				typeof modelObj?.supports_images === "boolean"
					? modelObj.supports_images
					: typeof modelObj?.supports_vision === "boolean"
						? modelObj.supports_vision
						: typeof modelObj?.multimodal === "boolean"
							? modelObj.multimodal
							: nineRouterDefaultModelInfo.supportsImages

			const supportsComputerUse =
				typeof modelObj?.supports_computer_use === "boolean"
					? modelObj.supports_computer_use
					: nineRouterDefaultModelInfo.supportsComputerUse

			const supportsPromptCache =
				typeof modelObj?.supports_prompt_cache === "boolean"
					? modelObj.supports_prompt_cache
					: typeof modelObj?.supports_caching === "boolean"
						? modelObj.supports_caching
						: nineRouterDefaultModelInfo.supportsPromptCache

			const description = modelObj?.description || `${modelId} via 9Router`

			return {
				maxTokens,
				contextWindow,
				supportsImages,
				supportsComputerUse,
				supportsPromptCache,
				description,
			}
		}

		if (response.data && Array.isArray(response.data.data)) {
			for (const model of response.data.data) {
				const modelId = model.id || model.name
				if (!modelId) continue

				models[modelId] = parseModelInfo(model, modelId)
			}
		} else if (response.data && Array.isArray(response.data)) {
			for (const model of response.data) {
				const modelId = typeof model === "string" ? model : model.id || model.name
				if (!modelId) continue

				models[modelId] = parseModelInfo(typeof model === "object" ? model : {}, modelId)
			}
		}

		return models
	} catch (error: any) {
		console.error("Error fetching 9Router models:", error.message ? error.message : error)
		if (axios.isAxiosError(error) && error.response) {
			throw new Error(`Failed to fetch 9Router models: ${error.response.status} ${error.response.statusText}.`)
		} else if (axios.isAxiosError(error) && error.request) {
			throw new Error(
				"Failed to fetch 9Router models: No response from 9Router server. Check server status and base URL.",
			)
		} else {
			throw new Error(`Failed to fetch 9Router models: ${error.message || "An unknown error occurred."}`)
		}
	}
}

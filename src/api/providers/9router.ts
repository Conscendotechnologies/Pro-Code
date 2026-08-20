import { nineRouterDefaultBaseUrl, nineRouterDefaultModelId, nineRouterDefaultModelInfo } from "@siid-code/types"

import type { ApiHandlerOptions, ModelRecord } from "../../shared/api"

import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider"
import { getModels } from "./fetchers/modelCache"
import { inferModelInfoFromId } from "./fetchers/9router"

export class NineRouterHandler extends BaseOpenAiCompatibleProvider<string> {
	private modelsCache: ModelRecord = {}

	constructor(options: ApiHandlerOptions) {
		const modelId = options.nineRouterModelId || nineRouterDefaultModelId
		const initialModelInfo = inferModelInfoFromId(modelId)
		super({
			...options,
			providerName: "9Router",
			baseURL: options.nineRouterBaseUrl || nineRouterDefaultBaseUrl,
			apiKey: options.nineRouterApiKey || "9router",
			defaultProviderModelId: modelId,
			providerModels: {
				[modelId]: initialModelInfo,
			},
			defaultTemperature: 0,
		})
	}

	public async fetchModel() {
		try {
			this.modelsCache = await getModels({
				provider: "9router",
				apiKey: this.options.nineRouterApiKey,
				baseUrl: this.options.nineRouterBaseUrl || nineRouterDefaultBaseUrl,
			})
		} catch (err) {
			console.warn("[NineRouterHandler] Failed to fetch models cache:", err)
		}
		return this.getModel()
	}

	override getModel() {
		const id = this.options.nineRouterModelId || nineRouterDefaultModelId
		if (this.modelsCache[id]) {
			return { id, info: this.modelsCache[id] }
		}
		return { id, info: inferModelInfoFromId(id) }
	}
}

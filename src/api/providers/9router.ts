import { nineRouterDefaultBaseUrl, nineRouterDefaultModelId, nineRouterDefaultModelInfo } from "@siid-code/types"

import type { ApiHandlerOptions } from "../../shared/api"

import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider"

export class NineRouterHandler extends BaseOpenAiCompatibleProvider<string> {
	constructor(options: ApiHandlerOptions) {
		const modelId = options.nineRouterModelId || nineRouterDefaultModelId
		super({
			...options,
			providerName: "9Router",
			baseURL: options.nineRouterBaseUrl || nineRouterDefaultBaseUrl,
			apiKey: options.nineRouterApiKey || "9router",
			defaultProviderModelId: nineRouterDefaultModelId,
			providerModels: {
				[modelId]: nineRouterDefaultModelInfo,
			},
			defaultTemperature: 0,
		})
	}
}

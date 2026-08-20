import type { ModelInfo } from "../model.js"

export const nineRouterDefaultBaseUrl = "http://localhost:20128/v1"
export const nineRouterDefaultModelId = "claude-3-7-sonnet"

export const nineRouterDefaultModelInfo: ModelInfo = {
	maxTokens: 8192,
	contextWindow: 200_000,
	supportsImages: true,
	supportsComputerUse: true,
	supportsPromptCache: true,
}

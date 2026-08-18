/**
 * Mode-to-Models mapping
 * Defines which models are available for each mode
 */

export interface ModeModelInfo {
	modelId: string
	displayName: string
	provider?: "openrouter" | "anthropic" | "openai" | "other"
	tier?: "Free" | "Basic" | "Medium" | "Advanced" | "Premium"
}

/**
 * The curated model list, in priority order: the first entry is the default and
 * the free-tier entries form the 429 fallback chain (see `model-fallback.ts`).
 * Array order IS the priority — there is no separate priority field to keep in sync.
 */
const MODELS: ModeModelInfo[] = [
	{ modelId: "z-ai/glm-4.5-air:free", displayName: "GLM 4.5 Air (Free)", provider: "openrouter", tier: "Free" },
	{ modelId: "qwen/qwen3-coder:free", displayName: "Qwen3 Coder (Free)", provider: "openrouter", tier: "Free" },
	{
		modelId: "openai/gpt-oss-120b:free",
		displayName: "OpenAI: gpt-oss-120b (Free)",
		provider: "openrouter",
		tier: "Free",
	},
	{
		modelId: "openai/gpt-oss-20b:free",
		displayName: "OpenAI: gpt-oss-20b (Free)",
		provider: "openrouter",
		tier: "Free",
	},
	{ modelId: "openai/gpt-5.4-nano", displayName: "GPT-5.4 Nano", provider: "openrouter", tier: "Medium" },
	{ modelId: "moonshotai/kimi-k2.5", displayName: "Kimi K2.5", provider: "openrouter", tier: "Medium" },
	{ modelId: "qwen/qwen3-32b:nitro", displayName: "Qwen3 32B (nitro)", provider: "openrouter", tier: "Medium" },
	{
		modelId: "meta-llama/llama-3.3-70b-instruct:nitro",
		displayName: "Llama 3.3 70B Instruct (nitro)",
		provider: "openrouter",
		tier: "Medium",
	},
	{ modelId: "deepseek/deepseek-v3.2", displayName: "DeepSeek V3.2", provider: "openrouter", tier: "Medium" },
	{ modelId: "openai/gpt-5-mini", displayName: "GPT-5 Mini", provider: "openrouter", tier: "Advanced" },
	{ modelId: "openai/gpt-5.4-mini", displayName: "GPT-5.4 Mini", provider: "openrouter", tier: "Advanced" },
	{
		modelId: "google/gemini-3-flash-preview",
		displayName: "Gemini 3 Flash Preview",
		provider: "openrouter",
		tier: "Advanced",
	},
	{
		modelId: "anthropic/claude-sonnet-4.5",
		displayName: "Claude Sonnet 4.5",
		provider: "openrouter",
		tier: "Premium",
	},
	{ modelId: "anthropic/claude-haiku-4.5", displayName: "Claude Haiku 4.5", provider: "openrouter", tier: "Premium" },
	{ modelId: "openai/gpt-5.1", displayName: "GPT-5.1", provider: "openrouter", tier: "Premium" },
	{ modelId: "openai/gpt-5.4", displayName: "GPT-5.4", provider: "openrouter", tier: "Premium" },
	{ modelId: "openai/gpt-5.2-codex", displayName: "GPT-5.2 Codex", provider: "openrouter", tier: "Premium" },
]

/**
 * Maps mode slugs to available models.
 * All modes currently share one list; keys stay explicit so an unknown mode
 * still resolves to an empty list rather than inheriting every model.
 */
export const MODE_TO_MODELS: Record<string, ModeModelInfo[]> = {
	"salesforce-agent": MODELS,
	code: MODELS,
	orchestrator: MODELS,
}

/**
 * The model each mode recommends. Kept out of the shared list because it is
 * per-mode presentation: the UI appends the suffix.
 */
const MODE_RECOMMENDED_MODEL: Record<string, string> = {
	"salesforce-agent": "qwen/qwen3-coder:free",
	code: "qwen/qwen3-coder:free",
	orchestrator: "qwen/qwen3-coder:free",
}

/**
 * Get the model id a mode recommends, if any
 */
export function getRecommendedModelForMode(modeSlug: string): string | undefined {
	return MODE_RECOMMENDED_MODEL[modeSlug]
}

/**
 * Get available models for a mode
 * Returns empty array if mode not found
 */
export function getModelsForMode(modeSlug: string): ModeModelInfo[] {
	return MODE_TO_MODELS[modeSlug] || []
}

/**
 * Get the default (first) model for a mode
 * Returns undefined if mode not found or no models available
 */
export function getDefaultModelForMode(modeSlug: string): ModeModelInfo | undefined {
	const models = getModelsForMode(modeSlug)
	return models[0]
}

/**
 * Check if a model is available for a mode
 */
export function isModelAvailableForMode(modeSlug: string, modelId: string): boolean {
	const models = getModelsForMode(modeSlug)
	return models.some((m) => m.modelId === modelId)
}

import { CodeIndexManager } from "../../../services/code-index/manager"
import { experiments, EXPERIMENT_IDS } from "../../../shared/experiments"

export function getToolUseGuidelinesSection(
	codeIndexManager?: CodeIndexManager,
	experimentFlags?: Record<string, boolean>,
): string {
	const isMultipleToolCallsEnabled = experiments.isEnabled(experimentFlags ?? {}, EXPERIMENT_IDS.MULTIPLE_TOOL_CALLS)
	const isCodebaseSearchAvailable =
		codeIndexManager &&
		codeIndexManager.isFeatureEnabled &&
		codeIndexManager.isFeatureConfigured &&
		codeIndexManager.isInitialized

	const multipleGuidance = isMultipleToolCallsEnabled
		? "You may use multiple tools per message when independent; if actions depend on each other, use sequentially."
		: "Use one tool at a time per message."

	return `# Tool Use Guidelines

1. Assess what information you already have and what you need before choosing a tool.
${isCodebaseSearchAvailable ? `2. For exploration of code you haven't examined yet, use \`codebase_search\` first — it uses semantic search for better results than regex.\n` : `2. Choose the most appropriate tool for each step.\n`}3. Formulate tool use using the XML format specified for each tool.
4. After each tool use, ALWAYS wait for user confirmation before proceeding. Never assume success without explicit confirmation.
5. ${multipleGuidance}

Wait for and review each tool result before the next action. This lets you confirm success, fix errors, and adapt your approach.`
}

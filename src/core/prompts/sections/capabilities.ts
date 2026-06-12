import { DiffStrategy } from "../../../shared/tools"
import { McpHub } from "../../../services/mcp/McpHub"
import { CodeIndexManager } from "../../../services/code-index/manager"

export function getCapabilitiesSection(
	cwd: string,
	supportsComputerUse: boolean,
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
	codeIndexManager?: CodeIndexManager,
): string {
	const hasCodebaseSearch =
		codeIndexManager &&
		codeIndexManager.isFeatureEnabled &&
		codeIndexManager.isFeatureConfigured &&
		codeIndexManager.isInitialized

	return `====

CAPABILITIES

- You can run CLI commands, read/write files, search files with regex, list files and definitions, and ask follow-up questions.
- When a task starts, the current workspace directory ('${cwd}') file list is included in environment_details.${
		hasCodebaseSearch
			? `\n- Use \`codebase_search\` for semantic search across the codebase to find relevant code by meaning, not just keywords.`
			: ""
	}
- Use \`search_files\` for regex patterns across files with surrounding context.
- Use \`list_code_definition_names\` to get a structural overview of a directory.
- Use \`execute_command\` for SF CLI commands (sf apex run, sf project deploy, etc.).${
		mcpHub ? `\n- MCP servers are connected and provide additional tools and resources.` : ""
	}`
}

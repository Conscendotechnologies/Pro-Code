/**
 * search_salesforce_symbols tool — searches the Salesforce Symbol & Metadata Index.
 * Returns exact SObject field schemas, relationship definitions, or Apex method signatures
 * in < 200 tokens without needing to load full files into the LLM context.
 */

import { Task } from "../task/Task"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { SalesforceMetadataIndexer } from "../../services/code-index/processors/salesforce-indexer"

export async function searchSalesforceSymbolsTool(
	task: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	const query: string | undefined = block.params.query
	const category: string | undefined = (block.params as Record<string, string | undefined>).category || "all"

	try {
		if (block.partial) {
			const askContent = JSON.stringify({
				tool: "search_salesforce_symbols",
				query: query || "...",
				category,
			})
			await task.ask("tool", askContent, block.partial).catch(() => {})
			return
		}

		if (!query) {
			task.consecutiveMistakeCount++
			task.recordToolError("search_salesforce_symbols" as any)
			pushToolResult(await task.sayAndCreateMissingParamError("search_salesforce_symbols" as any, "query"))
			return
		}

		task.consecutiveMistakeCount = 0
		const indexer = SalesforceMetadataIndexer.getInstance(task.cwd || "default")

		let results = ""
		if (category === "sobject" || category === "OBJECT" || category === "FIELD") {
			results = indexer.searchSchema(query)
		} else if (category === "apex" || category === "APEX_CLASS" || category === "APEX_TRIGGER") {
			results = indexer.searchApexSymbols(query)
		} else {
			const schemaRes = indexer.searchSchema(query)
			const apexRes = indexer.searchApexSymbols(query)
			results = `=== SObject & Field Symbols ===\n${schemaRes}\n\n=== Apex Method Symbols ===\n${apexRes}`
		}

		pushToolResult(results)
	} catch (error: any) {
		await handleError("searching Salesforce symbols", error)
	}
}

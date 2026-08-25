/**
 * search_salesforce_graph tool — GraphRAG Blast-Radius & Order of Execution Search.
 * Allows the AI Agent to query the 2-way Salesforce Metadata Graph to find all dependent
 * Apex classes, Triggers, Flows, LWCs, and Security constraints before writing or modifying code.
 */

import { Task } from "../task/Task"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { SalesforceGraphEngine, DmlEvent } from "../../services/code-index/processors/salesforce-graph"
import {
	getTransactionTimeline,
	renderTransactionTimelineMarkdown,
	detectFieldConflicts,
	renderFieldConflictsMarkdown,
	traceFieldLifecycle,
	renderFieldLifecycleMarkdown,
	detectRecursion,
	renderRecursionMarkdown,
	getGovernorSurface,
	renderGovernorSurfaceMarkdown,
} from "../../services/code-index/processors/salesforce-transaction"

export async function searchSalesforceGraphTool(
	task: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	const params = block.params as Record<string, string | undefined>
	const symbolId: string | undefined = params.symbolId || params.query || params.objectApiName
	const fieldName: string | undefined = params.fieldName
	const mode: string = params.mode || "blast_radius"
	const rawEvent = (params.dmlEvent || "update").toLowerCase()
	const validEvents: DmlEvent[] = ["insert", "update", "delete", "undelete"]
	const dmlEvent: DmlEvent = validEvents.includes(rawEvent as DmlEvent) ? (rawEvent as DmlEvent) : "update"

	const validModes = new Set([
		"blast_radius",
		"upstream",
		"downstream",
		"transaction",
		"conflicts",
		"field_lifecycle",
		"recursion",
		"governor",
	])

	try {
		if (block.partial) {
			const askContent = JSON.stringify({
				tool: "search_salesforce_graph",
				symbolId: symbolId || "...",
				mode,
			})
			await task.ask("tool", askContent, block.partial).catch(() => {})
			return
		}

		if (!symbolId) {
			task.consecutiveMistakeCount++
			task.recordToolError("search_salesforce_graph" as any)
			pushToolResult(await task.sayAndCreateMissingParamError("search_salesforce_graph" as any, "symbolId"))
			return
		}

		if (!validModes.has(mode)) {
			task.consecutiveMistakeCount++
			task.recordToolError("search_salesforce_graph" as any)
			pushToolResult(`Error: Unrecognized mode [${mode}]. Valid modes are: ${Array.from(validModes).join(", ")}.`)
			return
		}

		task.consecutiveMistakeCount = 0
		const graphEngine = SalesforceGraphEngine.getInstance(task.cwd || "default")

		let output = ""

		if (mode === "transaction") {
			const timeline = getTransactionTimeline(graphEngine, symbolId, dmlEvent)
			output = renderTransactionTimelineMarkdown(timeline)
		} else if (mode === "conflicts") {
			const findings = detectFieldConflicts(graphEngine, symbolId, dmlEvent)
			output = renderFieldConflictsMarkdown(findings, symbolId)
		} else if (mode === "field_lifecycle") {
			if (!fieldName) {
				pushToolResult(
					`Error: Mode field_lifecycle requires a fieldName parameter (e.g. fieldName: "Amount__c").`,
				)
				return
			}
			const trace = traceFieldLifecycle(graphEngine, symbolId, fieldName, dmlEvent)
			output = renderFieldLifecycleMarkdown(trace)
		} else if (mode === "recursion") {
			const recursion = detectRecursion(graphEngine, symbolId, dmlEvent)
			output = renderRecursionMarkdown(recursion, symbolId)
		} else if (mode === "governor") {
			const governor = getGovernorSurface(graphEngine, symbolId, dmlEvent)
			output = renderGovernorSurfaceMarkdown(governor)
		} else {
			const blast = graphEngine.getBlastRadius(symbolId, mode)
			output = `=== 🕸️ GraphRAG Analysis for [${blast.targetNode.name}] (Mode: ${mode}) ===\n`
			output += `${blast.summary}\n\n`

			if (blast.upstreamDependents.length > 0) {
				output += `🔼 Upstream Dependents (Will be impacted if this changes):\n`
				for (const dep of blast.upstreamDependents) {
					output += `   - [${dep.type}] ${dep.name} (${dep.filePath})\n`
				}
			}

			if (blast.downstreamDependencies.length > 0) {
				output += `\n🔽 Downstream Dependencies:\n`
				for (const dep of blast.downstreamDependencies) {
					output += `   - [${dep.type}] ${dep.name} (${dep.filePath})\n`
				}
			}
		}

		// Cap output to 150 lines maximum (M4)
		const lines = output.split("\n")
		if (lines.length > 150) {
			output = lines.slice(0, 150).join("\n") + `\n\n...[Truncated: ${lines.length - 150} additional lines]`
		}

		pushToolResult(output)
	} catch (error: any) {
		await handleError("querying Salesforce Graph Engine", error)
	}
}

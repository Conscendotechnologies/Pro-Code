import * as vscode from "vscode"

import type { SiidForgeApi } from "@conscendotech/siid-forge-api"

import { Task } from "../task/Task"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { formatResponse } from "../prompts/responses"
import { getForgeFeature, validateForgeArgs, REQUIRED_FORGE_VERSION, FORGE_FEATURES } from "./forgeFeatureRegistry"

const FORGE_EXT_ID = "ConscendoTechInc.siid-forge"

/** Bind the SIID Forge public API at runtime, or return undefined if unavailable. Never throws. */
async function resolveForge(): Promise<SiidForgeApi | undefined> {
	try {
		const ext = vscode.extensions.getExtension(FORGE_EXT_ID)
		if (!ext) {
			return undefined
		}
		const api = (ext.isActive ? ext.exports : await ext.activate()) as SiidForgeApi | undefined
		return api ?? undefined
	} catch {
		return undefined
	}
}

/** Compare dotted semver strings a >= b (numeric, no pre-release handling — sufficient here). */
function versionGte(a: string, b: string): boolean {
	const pa = a.split(".").map((n) => parseInt(n, 10) || 0)
	const pb = b.split(".").map((n) => parseInt(n, 10) || 0)
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		const d = (pa[i] ?? 0) - (pb[i] ?? 0)
		if (d !== 0) {
			return d > 0
		}
	}
	return true
}

/**
 * The single `siid_forge` tool. The model picks a `feature` and passes `args`; we dispatch to the
 * headless SIID Forge API. Mutating features are gated behind the user-approval flow. Read features
 * run directly. Everything fails soft with a clear tool error — no crash if forge is absent.
 */
export async function siidForgeTool(
	task: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	const featureName: string | undefined = block.params.feature
	const rawArgs: string | undefined = block.params.args

	try {
		if (block.partial) {
			// Nothing to stream meaningfully; show the feature being requested.
			await task.ask("tool", removeClosingTag("feature", featureName ?? ""), block.partial).catch(() => {})
			return
		}

		if (!featureName) {
			task.consecutiveMistakeCount++
			task.recordToolError("siid_forge")
			pushToolResult(await task.sayAndCreateMissingParamError("siid_forge", "feature"))
			return
		}

		const feature = getForgeFeature(featureName)
		if (!feature) {
			task.consecutiveMistakeCount++
			task.recordToolError("siid_forge")
			const names = FORGE_FEATURES.map((f) => f.name).join(", ")
			pushToolResult(formatResponse.toolError(`Unknown siid_forge feature "${featureName}". Valid: ${names}.`))
			return
		}

		// Parse args JSON (default to {}).
		let args: Record<string, unknown> = {}
		if (rawArgs && rawArgs.trim().length > 0) {
			try {
				const parsed = JSON.parse(rawArgs)
				if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
					args = parsed as Record<string, unknown>
				} else {
					pushToolResult(formatResponse.toolError(`siid_forge "args" must be a JSON object.`))
					return
				}
			} catch (e) {
				pushToolResult(formatResponse.toolError(`siid_forge "args" is not valid JSON: ${(e as Error).message}`))
				return
			}
		}

		const argError = validateForgeArgs(feature, args)
		if (argError) {
			task.consecutiveMistakeCount++
			task.recordToolError("siid_forge")
			pushToolResult(formatResponse.toolError(argError))
			return
		}

		task.consecutiveMistakeCount = 0

		// Bind forge.
		const forge = await resolveForge()
		if (!forge) {
			pushToolResult(
				formatResponse.toolError(
					`SIID Forge extension (${FORGE_EXT_ID}) is not installed or not available. This tool requires it.`,
				),
			)
			return
		}
		if (!versionGte(forge.version, REQUIRED_FORGE_VERSION)) {
			pushToolResult(
				formatResponse.toolError(
					`SIID Forge ${forge.version} is too old; this tool needs ${REQUIRED_FORGE_VERSION}+. Please update SIID Forge.`,
				),
			)
			return
		}

		// Approval gate for mutating features.
		if (feature.mutating) {
			const didApprove = await askApproval(
				"tool",
				JSON.stringify({ tool: "siid_forge", feature: feature.name, mutating: true, args }),
			)
			if (!didApprove) {
				return
			}
		}

		// Dispatch.
		const result = await feature.run(forge, args)
		const text = typeof result === "string" ? result : JSON.stringify(result ?? null, null, 2)
		pushToolResult(`siid_forge(${feature.name}) result:\n${text}`)
	} catch (error) {
		await handleError(`running siid_forge feature "${featureName ?? "?"}"`, error as Error)
	}
}

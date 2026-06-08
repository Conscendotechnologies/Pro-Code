/**
 * validate_sf_metadata tool — validates Salesforce metadata XML before deployment.
 *
 * This is a READ-ONLY tool. It reads XML from disk and runs validators to
 * catch errors before they reach Salesforce. No deployment happens.
 */

import * as path from "path"
import * as fs from "fs/promises"

import { Task } from "../task/Task"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { validateMetadataPath } from "../sf-metadata/validators/validateAll"
import { getWorkspacePath } from "../../utils/path"

export async function validateSfMetadataTool(
	task: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	const metadataPath: string | undefined = block.params.metadata_path
	const metadataType: string | undefined = block.params.metadata_type

	try {
		// Handle partial streaming
		if (block.partial) {
			await task
				.ask("tool", `Validating Salesforce metadata at ${metadataPath || "..."}`, block.partial)
				.catch(() => {})
			return
		}

		if (!metadataPath) {
			task.consecutiveMistakeCount++
			task.recordToolError("validate_sf_metadata")
			pushToolResult(await task.sayAndCreateMissingParamError("validate_sf_metadata", "metadata_path"))
			return
		}

		task.consecutiveMistakeCount = 0

		// Resolve the path — handle both relative and absolute
		const workspaceRoot = getWorkspacePath(task.cwd)
		const resolvedPath = path.isAbsolute(metadataPath) ? metadataPath : path.resolve(workspaceRoot, metadataPath)

		// No approval needed for validation (it's read-only)
		await task.say("tool", `Validating Salesforce metadata at: ${metadataPath}`)

		const report = await validateMetadataPath(resolvedPath)

		// Build a human-readable and structured result
		const lines: string[] = []

		lines.push(`📋 Validation Report for: ${metadataPath}`)
		lines.push(`   Files checked: ${report.totalFiles}`)
		lines.push(`   ✅ Passed: ${report.passed}`)
		lines.push(`   ❌ Failed: ${report.failed}`)
		lines.push("")

		for (const result of report.results) {
			const icon = result.valid ? "✅" : "❌"
			lines.push(`${icon} ${result.type}: ${path.basename(result.filePath)}`)

			for (const err of result.errors) {
				lines.push(`   ❌ ERROR: ${err}`)
			}

			for (const warn of result.warnings) {
				lines.push(`   ⚠️  WARNING: ${warn}`)
			}

			if (result.valid && result.errors.length === 0 && result.warnings.length === 0) {
				lines.push(`   ✓ No issues found`)
			}

			lines.push("")
		}

		// Structured JSON for debugging
		lines.push("---")
		lines.push("```json")
		lines.push(JSON.stringify(report, null, 2))
		lines.push("```")

		// If there are errors, include guidance
		if (report.failed > 0) {
			lines.push("")
			lines.push("⚠️  Errors were found. Fix them BEFORE deploying with sf_deploy_metadata.")
			lines.push("   Common fixes:")
			lines.push("   - Double underscores (__c_): Remove __c from custom names when combining")
			lines.push("   - Missing metadata companions: Every .cls needs .cls-meta.xml")
			lines.push("   - Unescaped ampersands: Use &amp; instead of &")
			lines.push("   - Missing required elements: Check the schema above for what's needed")
			lines.push("   - SOQL/DML in loops: Move queries outside loops")
		} else if (report.totalFiles === 0) {
			lines.push("⚠️  No metadata files were found at this path. Check the path and try again.")
		} else {
			lines.push("✅ All files passed validation. Ready for deployment with sf_deploy_metadata.")
		}

		pushToolResult(lines.join("\n"))
	} catch (error: any) {
		await handleError("validating Salesforce metadata", error)
		pushToolResult(`❌ Validation failed with error: ${error.message}`)
	}
}

/**
 * generate_apex_class tool — creates an Apex class (.cls + .cls-meta.xml).
 * Validates naming, detects anti-patterns (SOQL/DML in loops), checks
 * security patterns. The LLM provides the Apex code — the generator
 * handles naming validation and metadata companion creation.
 */

import * as path from "path"
import * as fs from "fs/promises"

import { Task } from "../task/Task"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import {
	validateApexClass,
	generateApexClassMetaXml,
	apexClassFilePath,
	apexClassMetaFilePath,
} from "../sf-metadata/generators/apexClass"
import { getWorkspacePath } from "../../utils/path"

export async function generateApexClassTool(
	task: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	const name: string | undefined = block.params.name
	const body: string | undefined = block.params.content

	try {
		if (block.partial) {
			await task.ask("tool", `Generating Apex class: ${name || "..."}`, block.partial).catch(() => {})
			return
		}

		if (!name) {
			task.consecutiveMistakeCount++
			pushToolResult(await task.sayAndCreateMissingParamError("generate_apex_class", "name"))
			return
		}

		if (!body) {
			task.consecutiveMistakeCount++
			pushToolResult(await task.sayAndCreateMissingParamError("generate_apex_class", "content"))
			return
		}

		const input = {
			name,
			body,
			sharing: (block.params.sharing as any) || undefined,
			isTest: block.params.is_test === "true",
			apiVersion: block.params.api_version || undefined,
		}

		// Validate
		const validation = validateApexClass(input)
		if (!validation.valid) {
			pushToolResult(
				`❌ Validation failed for "${name}":\n${validation.errors.map((e) => `  - ${e}`).join("\n")}\n` +
					(validation.warnings.length > 0
						? `\nWarnings:\n${validation.warnings.map((w) => `  - ${w}`).join("\n")}\n`
						: "") +
					"\nFix these issues and call generate_apex_class again.",
			)
			return
		}

		task.consecutiveMistakeCount = 0
		const didApprove = await askApproval(
			"tool",
			`Generate Apex class "${name}" with ${body.split("\n").length} lines` +
				(input.sharing ? ` (${input.sharing} sharing)` : "") +
				(input.isTest ? " (test class)" : "") +
				"?",
		)

		if (!didApprove) return

		// Write .cls and .cls-meta.xml
		const workspaceRoot = getWorkspacePath(task.cwd)
		const files = [
			{ p: apexClassFilePath(name), c: body },
			{ p: apexClassMetaFilePath(name), c: generateApexClassMetaXml(input) },
		]

		for (const f of files) {
			const fullPath = path.resolve(workspaceRoot, f.p)
			await fs.mkdir(path.dirname(fullPath), { recursive: true })
			await fs.writeFile(fullPath, f.c, "utf-8")
		}

		const warns =
			validation.warnings.length > 0
				? `\n\n⚠️  Warnings:\n${validation.warnings.map((w) => `  - ${w}`).join("\n")}`
				: ""

		pushToolResult(
			`✅ Apex class "${name}" generated.\n\n` +
				`📁 Files:\n   ${files.map((f) => f.p).join("\n   ")}\n` +
				warns +
				"\n\n📋 Next steps:\n" +
				"   1. Run validate_sf_metadata to verify XSD compliance\n" +
				"   2. Deploy with sf_deploy_metadata",
		)
	} catch (error: any) {
		await handleError("generating Apex class", error)
		pushToolResult(`❌ Failed: ${error.message}`)
	}
}

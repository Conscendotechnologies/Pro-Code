/**
 * generate_apex_trigger tool — creates an Apex trigger (.trigger + .trigger-meta.xml).
 * Same validation as generate_apex_class: naming, anti-patterns, security checks.
 */

import * as path from "path"
import * as fs from "fs/promises"

import { Task } from "../task/Task"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import {
	validateApexClass,
	generateApexTriggerMetaXml,
	apexTriggerFilePath,
	apexTriggerMetaFilePath,
	ApexTriggerInput,
} from "../sf-metadata/generators/apexClass"
import { getWorkspacePath } from "../../utils/path"

export async function generateApexTriggerTool(
	task: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	const name: string | undefined = block.params.name
	const body: string | undefined = block.params.content
	const objectName: string | undefined = block.params.object_name

	try {
		if (block.partial) {
			await task.ask("tool", `Generating trigger: ${name || "..."}`, block.partial).catch(() => {})
			return
		}

		if (!name) {
			task.consecutiveMistakeCount++
			pushToolResult(await task.sayAndCreateMissingParamError("generate_apex_trigger", "name"))
			return
		}

		if (!body) {
			task.consecutiveMistakeCount++
			pushToolResult(await task.sayAndCreateMissingParamError("generate_apex_trigger", "content"))
			return
		}

		if (!objectName) {
			task.consecutiveMistakeCount++
			pushToolResult(await task.sayAndCreateMissingParamError("generate_apex_trigger", "object_name"))
			return
		}

		// Reuse ApexClass validation (same logic applies to trigger body)
		const input = { name, body, apiVersion: block.params.api_version || undefined }

		const validation = validateApexClass(input)
		if (!validation.valid) {
			pushToolResult(
				`❌ Validation failed for "${name}":\n${validation.errors.map((e) => `  - ${e}`).join("\n")}\n` +
					"Fix these issues and call generate_apex_trigger again.",
			)
			return
		}

		task.consecutiveMistakeCount = 0
		const didApprove = await askApproval(
			"tool",
			`Generate Apex trigger "${name}" on ${objectName} (${body.split("\n").length} lines)?`,
		)

		if (!didApprove) return

		const triggerInput: ApexTriggerInput = {
			name,
			body,
			objectName,
			apiVersion: block.params.api_version || undefined,
		}

		const workspaceRoot = getWorkspacePath(task.cwd)
		const files = [
			{ p: apexTriggerFilePath(name), c: body },
			{ p: apexTriggerMetaFilePath(name), c: generateApexTriggerMetaXml(triggerInput) },
		]

		for (const f of files) {
			const fullPath = path.resolve(workspaceRoot, f.p)
			await fs.mkdir(path.dirname(fullPath), { recursive: true })
			await fs.writeFile(fullPath, f.c, "utf-8")
		}

		pushToolResult(
			`✅ Apex trigger "${name}" on ${objectName} generated.\n\n` +
				`📁 Files:\n   ${files.map((f) => f.p).join("\n   ")}\n\n` +
				"📋 Next steps:\n" +
				"   1. Run validate_sf_metadata to verify XSD compliance\n" +
				"   2. Deploy with sf_deploy_metadata",
		)
	} catch (error: any) {
		await handleError("generating Apex trigger", error)
		pushToolResult(`❌ Failed: ${error.message}`)
	}
}

/**
 * generate_custom_object tool — creates a Salesforce CustomObject with
 * correct XML, tab, and optional fields. Validation is built-in — the
 * generator rejects invalid input before any files are written.
 */

import * as path from "path"
import * as fs from "fs/promises"

import { Task } from "../task/Task"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { generateCustomObject, validateObjectInput, CustomObjectInput } from "../sf-metadata/generators/customObject"
import { CustomFieldInput } from "../sf-metadata/generators/customField"
import { getWorkspacePath } from "../../utils/path"

function parseFieldInput(params: Record<string, string>, prefix: string): CustomFieldInput | null {
	const label = params[`${prefix}_label`]
	if (!label) {
		// Try JSON field format
		const json = params[`${prefix}_json`]
		if (json) {
			try {
				return JSON.parse(json) as CustomFieldInput
			} catch {
				return null
			}
		}
		return null
	}

	return {
		label,
		apiName: params[`${prefix}_apiName`],
		type: (params[`${prefix}_type`] || "Text") as any,
		length: params[`${prefix}_length`] ? parseInt(params[`${prefix}_length`]) : undefined,
		precision: params[`${prefix}_precision`] ? parseInt(params[`${prefix}_precision`]) : undefined,
		scale: params[`${prefix}_scale`] ? parseInt(params[`${prefix}_scale`]) : undefined,
		picklistValues: params[`${prefix}_picklistValues`]
			? params[`${prefix}_picklistValues`].split(",").map((v) => ({ label: v.trim() }))
			: undefined,
		referenceTo: params[`${prefix}_referenceTo`],
		deleteConstraint: params[`${prefix}_deleteConstraint`] as any,
		required: params[`${prefix}_required`] === "true",
	}
}

export async function generateCustomObjectTool(
	task: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	const label: string | undefined = block.params.label

	try {
		if (block.partial) {
			await task.ask("tool", `Generating custom object: ${label || "..."}`, block.partial).catch(() => {})
			return
		}

		if (!label) {
			task.consecutiveMistakeCount++
			pushToolResult(await task.sayAndCreateMissingParamError("generate_custom_object", "label"))
			return
		}

		// Build input from params
		const input: CustomObjectInput = {
			label,
			apiName: block.params.api_name,
			pluralLabel: block.params.plural_label,
			enableReports: block.params.enable_reports !== "false",
			enableActivities: block.params.enable_activities !== "false",
			enableFeeds: block.params.enable_feeds !== "false",
			enableHistory: block.params.enable_history !== "false",
			sharingModel: (block.params.sharing_model as any) || "ReadWrite",
			nameFieldLabel: block.params.name_field_label,
			createTab: block.params.create_tab !== "false",
		}

		// Parse nested fields from params (field_1_label, field_1_type, etc.)
		const fields: CustomFieldInput[] = []
		for (let i = 1; i <= 50; i++) {
			const field = parseFieldInput(block.params as any, `field_${i}`)
			if (field) fields.push(field)
		}
		// Also check JSON fields array
		if (block.params.fields_json) {
			try {
				const parsed = JSON.parse(block.params.fields_json)
				if (Array.isArray(parsed)) fields.push(...parsed)
			} catch {
				// Invalid JSON — skip
			}
		}
		if (fields.length > 0) {
			input.fields = fields
		}

		// Validate before generating
		const validationErrors = validateObjectInput(input)
		if (validationErrors.length > 0) {
			pushToolResult(
				`❌ Validation failed — fixes needed:\n${validationErrors.map((e) => `  - ${e}`).join("\n")}\n\n` +
					"Fix these issues and call generate_custom_object again.",
			)
			return
		}

		// Ask approval (generation creates multiple files)
		task.consecutiveMistakeCount = 0
		const fieldCount = input.fields?.length || 0
		const didApprove = await askApproval(
			"tool",
			`Generate custom object "${input.label}" with ${fieldCount} field(s) and ${input.createTab ? "tab" : "no tab"}?`,
		)

		if (!didApprove) return

		// Generate
		const result = generateCustomObject(input)

		// Write files to disk
		const workspaceRoot = getWorkspacePath(task.cwd)
		const writtenFiles: string[] = []

		for (const file of result.files) {
			const fullPath = path.resolve(workspaceRoot, file.path)
			const dir = path.dirname(fullPath)
			await fs.mkdir(dir, { recursive: true })
			await fs.writeFile(fullPath, file.content, "utf-8")
			writtenFiles.push(file.path)
		}

		// Build response
		const lines: string[] = []
		lines.push(`✅ Custom object "${result.objectLabel}" generated successfully.`)
		lines.push("")
		lines.push(`📁 Files created (${writtenFiles.length}):`)
		for (const f of writtenFiles) {
			lines.push(`   ${f}`)
		}
		lines.push("")
		lines.push("📋 Next steps:")
		lines.push("   1. Review the generated files")
		lines.push("   2. Run validate_sf_metadata to verify XSD compliance")
		lines.push("   3. Deploy with sf_deploy_metadata")

		pushToolResult(lines.join("\n"))
	} catch (error: any) {
		await handleError("generating custom object", error)
		pushToolResult(`❌ Generation failed: ${error.message}`)
	}
}

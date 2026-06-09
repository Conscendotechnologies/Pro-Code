/**
 * generate_custom_field tool — creates a Salesforce CustomField XML on an
 * existing object. Built-in validation catches naming errors, type constraints,
 * and lookup rule violations before any file is written.
 */

import * as path from "path"
import * as fs from "fs/promises"

import { Task } from "../task/Task"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { generateCustomFieldXml, validateFieldInput, CustomFieldInput } from "../sf-metadata/generators/customField"
import { labelToApiName } from "../sf-metadata/generators/shared"
import { getWorkspacePath } from "../../utils/path"

export async function generateCustomFieldTool(
	task: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	const objectName: string | undefined = block.params.object_name
	const label: string | undefined = block.params.label

	try {
		if (block.partial) {
			await task
				.ask("tool", `Generating field "${label || "..."}" on ${objectName || "..."}`, block.partial)
				.catch(() => {})
			return
		}

		if (!objectName) {
			task.consecutiveMistakeCount++
			pushToolResult(await task.sayAndCreateMissingParamError("generate_custom_field", "object_name"))
			return
		}

		if (!label) {
			task.consecutiveMistakeCount++
			pushToolResult(await task.sayAndCreateMissingParamError("generate_custom_field", "label"))
			return
		}

		// Build field input from params
		const input: CustomFieldInput = {
			label,
			apiName: block.params.api_name,
			type: (block.params.type as any) || "Text",
			length: block.params.length ? parseInt(block.params.length) : undefined,
			precision: block.params.precision ? parseInt(block.params.precision) : undefined,
			scale: block.params.scale ? parseInt(block.params.scale) : undefined,
			picklistValues: block.params.picklist_values
				? block.params.picklist_values.split(",").map((v) => ({ label: v.trim() }))
				: undefined,
			referenceTo: block.params.reference_to,
			deleteConstraint: block.params.delete_constraint as any,
			relationshipLabel: block.params.relationship_label,
			relationshipName: block.params.relationship_name,
			formula: block.params.formula,
			required: block.params.required === "true",
			unique: block.params.unique === "true",
			externalId: block.params.external_id === "true",
		}

		// Validate
		const errors = validateFieldInput(input)
		if (errors.length > 0) {
			pushToolResult(
				`❌ Validation failed for field "${label}":\n${errors.map((e) => `  - ${e}`).join("\n")}\n\n` +
					"Fix these issues and call generate_custom_field again.",
			)
			return
		}

		task.consecutiveMistakeCount = 0
		const didApprove = await askApproval(
			"tool",
			`Generate custom field "${input.label}" (${input.type}) on object "${objectName}"?`,
		)

		if (!didApprove) return

		// Generate XML
		const xml = generateCustomFieldXml(input, objectName)
		const apiName = input.apiName || objectName // need to compute same as generator
		const fieldApiName = input.apiName || labelToApiName(input.label, true)

		// Compute file path
		const relativePath = `force-app/main/default/objects/${objectName}/fields/${fieldApiName}.field-meta.xml`
		const workspaceRoot = getWorkspacePath(task.cwd)
		const fullPath = path.resolve(workspaceRoot, relativePath)

		await fs.mkdir(path.dirname(fullPath), { recursive: true })
		await fs.writeFile(fullPath, xml, "utf-8")

		const lines: string[] = []
		lines.push(`✅ Custom field "${input.label}" (${input.type}) generated on ${objectName}.`)
		lines.push("")
		lines.push(`📁 File: ${relativePath}`)
		lines.push("")
		lines.push("📋 Next steps:")
		lines.push("   1. Run validate_sf_metadata to verify XSD compliance")
		lines.push("   2. Deploy with sf_deploy_metadata")

		pushToolResult(lines.join("\n"))
	} catch (error: any) {
		await handleError("generating custom field", error)
		pushToolResult(`❌ Generation failed: ${error.message}`)
	}
}

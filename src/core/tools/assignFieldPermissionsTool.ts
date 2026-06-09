/**
 * assign_field_permissions tool — adds field-level read/edit permissions
 * to a Salesforce Profile. Validates dependency rules (editable → readable)
 * before writing.
 */

import * as path from "path"
import * as fs from "fs/promises"

import { Task } from "../task/Task"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { validateFieldPermission, generateFieldPermissionXml } from "../sf-metadata/generators/profilePermissions"
import { escapeXml } from "../sf-metadata/generators/shared"
import { getWorkspacePath } from "../../utils/path"

export async function assignFieldPermissionsTool(
	task: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	const profileName: string | undefined = block.params.profile_name
	const fieldsJson: string | undefined = block.params.fields_json

	try {
		if (block.partial) {
			await task
				.ask("tool", `Assigning field permissions for ${profileName || "..."}`, block.partial)
				.catch(() => {})
			return
		}

		if (!profileName) {
			task.consecutiveMistakeCount++
			pushToolResult(await task.sayAndCreateMissingParamError("assign_field_permissions", "profile_name"))
			return
		}

		if (!fieldsJson) {
			task.consecutiveMistakeCount++
			pushToolResult(await task.sayAndCreateMissingParamError("assign_field_permissions", "fields_json"))
			return
		}

		// Parse field permissions from JSON
		let permissions: Array<{ field: string; readable: boolean; editable: boolean }>
		try {
			permissions = JSON.parse(fieldsJson)
		} catch {
			pushToolResult(
				'❌ Invalid JSON for fields_json. Expected: [{"field":"Account.Phone","readable":true,"editable":true}]',
			)
			return
		}

		if (!Array.isArray(permissions) || permissions.length === 0) {
			pushToolResult("❌ fields_json must be a non-empty array of field permissions")
			return
		}

		// Validate each permission
		const errors: string[] = []
		for (const perm of permissions) {
			const permErrors = validateFieldPermission({
				field: perm.field,
				readable: perm.readable,
				editable: perm.editable,
			})
			errors.push(...permErrors.map((e) => e.message))
		}

		if (errors.length > 0) {
			pushToolResult(
				`❌ Permission validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}\n\n` +
					"Fix these issues and call assign_field_permissions again.",
			)
			return
		}

		task.consecutiveMistakeCount = 0
		const didApprove = await askApproval(
			"tool",
			`Assign ${permissions.length} field permission(s) to profile "${profileName}"?`,
		)

		if (!didApprove) return

		// Generate the XML block
		const xmlBlocks = permissions.map((p) =>
			generateFieldPermissionXml({ field: p.field, readable: p.readable, editable: p.editable }),
		)

		// Build a minimal profile XML with just the permissions
		// The actual profile merge happens via deploy — SF handles merging
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Profile xmlns="http://soap.sforce.com/2006/04/metadata">
${xmlBlocks.join("\n")}
</Profile>`

		// Write to disk
		const relativePath = `force-app/main/default/profiles/${escapeXml(profileName)}.profile-meta.xml`
		const workspaceRoot = getWorkspacePath(task.cwd)
		const fullPath = path.resolve(workspaceRoot, relativePath)

		await fs.mkdir(path.dirname(fullPath), { recursive: true })
		await fs.writeFile(fullPath, xml, "utf-8")

		const lines: string[] = []
		lines.push(`✅ Field permissions assigned to profile "${profileName}".`)
		lines.push("")
		lines.push(`📁 File: ${relativePath}`)
		lines.push(`   Fields: ${permissions.map((p) => p.field).join(", ")}`)
		lines.push("")
		lines.push("📋 Note: If the profile file already exists, use retrieve_sf_metadata to get")
		lines.push("   the current version, merge these permissions, then redeploy.")
		lines.push("📋 Next steps:")
		lines.push("   1. Run validate_sf_metadata to verify XSD compliance")
		lines.push("   2. Deploy with sf_deploy_metadata")

		pushToolResult(lines.join("\n"))
	} catch (error: any) {
		await handleError("assigning field permissions", error)
		pushToolResult(`❌ Failed: ${error.message}`)
	}
}

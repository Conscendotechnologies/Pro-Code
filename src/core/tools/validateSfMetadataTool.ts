/**
 * validate_sf_metadata tool — validates Salesforce metadata XML against
 * the official Metadata API XSD schema (bundled, no network calls).
 *
 * Uses the XSD engine (XsdSchema + XsdValidator) to validate XML structure
 * against the actual Salesforce schema, plus business-rule checks for domain
 * rules that XSD can't express (e.g., SetNull + required conflict).
 */

import * as path from "path"
import * as fs from "fs/promises"

import { Task } from "../task/Task"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { loadSchema, validateXmlFileWithBusinessRules, detectMetadataType } from "../sf-metadata/xsd/XsdValidator"
import { getWorkspacePath } from "../../utils/path"

let schemaLoaded = false

async function ensureSchemaLoaded(): Promise<void> {
	if (schemaLoaded) return

	// Locate the XSD file bundled with the extension
	const possiblePaths = [
		path.join(__dirname, "..", "..", "Validator_Xsds", "MedataXsd.xml"), // from dist/src/core/tools → ../../Validator_Xsds
		path.join(__dirname, "..", "..", "..", "Validator_Xsds", "MedataXsd.xml"), // from src/core/tools → ../../Validator_Xsds
	]

	for (const schemaPath of possiblePaths) {
		try {
			await fs.access(schemaPath)
			await loadSchema(schemaPath)
			schemaLoaded = true
			return
		} catch {
			// Try next path
		}
	}

	throw new Error("XSD schema file not found. Expected MedataXsd.xml in Validator_Xsds/ directory.")
}

export async function validateSfMetadataTool(
	task: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	const metadataPath: string | undefined = block.params.metadata_path

	try {
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

		// Resolve path — handle relative and absolute
		const workspaceRoot = getWorkspacePath(task.cwd)
		const resolvedPath = path.isAbsolute(metadataPath) ? metadataPath : path.resolve(workspaceRoot, metadataPath)

		await task.say("tool", `Validating Salesforce metadata at: ${metadataPath}`)

		// Load XSD schema (cached after first load)
		await ensureSchemaLoaded()

		// Check if it's a file or directory
		const stat = await fs.stat(resolvedPath)

		const filesToValidate: string[] = []

		if (stat.isDirectory()) {
			// Walk directory for known metadata files
			const entries = await fs.readdir(resolvedPath, { recursive: true, withFileTypes: true })
			for (const entry of entries) {
				if (entry.isFile()) {
					const fullPath = path.join(entry.path || resolvedPath, entry.name)
					if (detectMetadataType(fullPath)) {
						filesToValidate.push(fullPath)
					}
				}
			}
		} else {
			filesToValidate.push(resolvedPath)
		}

		if (filesToValidate.length === 0) {
			pushToolResult(
				`⚠️  No recognized Salesforce metadata files found at: ${metadataPath}\n\n` +
					"Supported file types: .object-meta.xml, .field-meta.xml, .tab-meta.xml, .cls, .trigger,\n" +
					".cls-meta.xml, .trigger-meta.xml, .profile-meta.xml, .layout-meta.xml, .recordType-meta.xml,\n" +
					".validationRule-meta.xml, .assignmentRules-meta.xml, .pathAssistant-meta.xml, .queue-meta.xml, .role-meta.xml",
			)
			return
		}

		// Validate each file
		const lines: string[] = []
		lines.push(`📋 Validation Report for: ${metadataPath}`)
		lines.push(`   Files to check: ${filesToValidate.length}`)
		lines.push("")

		let totalErrors = 0
		let totalWarnings = 0
		const allResults: any[] = []

		for (const filePath of filesToValidate) {
			const relative = path.relative(workspaceRoot, filePath)
			const result = await validateXmlFileWithBusinessRules(filePath)

			allResults.push({
				file: relative,
				type: result.metadataType,
				valid: result.valid,
				errors: result.errors,
				warnings: result.warnings,
			})

			const icon = result.valid ? "✅" : "❌"
			lines.push(`${icon} ${result.metadataType}: ${relative}`)

			for (const err of result.errors) {
				lines.push(`   ❌ ERROR: [${err.element}] ${err.message}`)
				totalErrors++
			}

			for (const warn of result.warnings) {
				lines.push(`   ⚠️  WARNING: [${warn.element}] ${warn.message}`)
				totalWarnings++
			}

			if (result.errors.length === 0 && result.warnings.length === 0) {
				lines.push(`   ✓ Passed XSD validation — no issues found`)
			}

			lines.push("")
		}

		// Summary
		lines.push("---")
		lines.push(`Total: ${allResults.length} file(s)`)
		lines.push(`✅ Passed: ${allResults.filter((r) => r.valid).length}`)
		lines.push(`❌ Failed: ${allResults.filter((r) => !r.valid).length}`)
		lines.push(`Errors: ${totalErrors}`)
		lines.push(`Warnings: ${totalWarnings}`)

		if (totalErrors > 0) {
			lines.push("")
			lines.push("⚠️  Errors found against Salesforce Metadata API XSD (v66.0).")
			lines.push("   Fix these before deploying with sf_deploy_metadata.")
			lines.push("   Common root causes:")
			lines.push("   • Missing required elements — check the <element> listed in error messages")
			lines.push("   • Invalid enum values — use one of the allowed values shown")
			lines.push("   • Double underscores (__c_): remove __c from custom names before combining")
			lines.push("   • Missing metadata companion: every .cls needs .cls-meta.xml")
		} else if (totalWarnings > 0) {
			lines.push("")
			lines.push("✅ XSD validation passed. Warnings noted above — address if relevant, then deploy.")
		} else {
			lines.push("")
			lines.push("✅ All files passed XSD validation against Salesforce Metadata API v66.0.")
			lines.push("   Ready for deployment with sf_deploy_metadata.")
		}

		// Structured JSON
		lines.push("")
		lines.push("```json")
		lines.push(JSON.stringify(allResults, null, 2))
		lines.push("```")

		pushToolResult(lines.join("\n"))
	} catch (error: any) {
		await handleError("validating Salesforce metadata", error)
		pushToolResult(`❌ Validation failed with error: ${error.message}`)
	}
}

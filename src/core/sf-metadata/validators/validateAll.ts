/**
 * Bulk validator — runs all metadata validators against a directory.
 *
 * Auto-detects metadata types and runs the appropriate validator.
 */

import * as path from "path"
import fs from "fs/promises"
import { validateCustomObject } from "./validateCustomObject"
import { validateCustomField, validateAllCustomFields } from "./validateCustomField"
import { validateApexFile } from "./validateApexClass"
import { validateProfile } from "./validateProfile"

export interface ValidationReport {
	totalFiles: number
	passed: number
	failed: number
	results: FileValidationResult[]
	summary: string
}

export interface FileValidationResult {
	filePath: string
	type: string
	valid: boolean
	errors: string[]
	warnings: string[]
}

/**
 * Run all validators on a metadata path. Auto-detects the type.
 */
export async function validateMetadataPath(metadataPath: string): Promise<ValidationReport> {
	const results: FileValidationResult[] = []

	const stat = await fs.stat(metadataPath)

	if (stat.isDirectory()) {
		const folderName = path.basename(metadataPath)

		// Detect type by folder structure
		// Object folder: contains .object-meta.xml
		// Classes folder: contains .cls files
		// Profiles folder: contains .profile-meta.xml
		// Fields folder: contains .field-meta.xml

		const objectFile = path.join(metadataPath, `${folderName}.object-meta.xml`)
		try {
			await fs.access(objectFile)
			// It's a CustomObject folder
			const objResult = await validateCustomObject(metadataPath)
			results.push({
				filePath: objectFile,
				type: "CustomObject",
				valid: objResult.valid,
				errors: objResult.errors,
				warnings: objResult.warnings,
			})

			// Also validate fields in this object
			const fieldResults = await validateAllCustomFields(metadataPath, folderName)
			for (const fr of fieldResults) {
				const fieldFile = path.join(metadataPath, "fields", `${fr.fieldName}.field-meta.xml`)
				results.push({
					filePath: fieldFile,
					type: "CustomField",
					valid: fr.valid,
					errors: fr.errors,
					warnings: fr.warnings,
				})
			}
		} catch {
			// Not an object folder — try other types
		}

		// Check for Apex files
		try {
			const entries = await fs.readdir(metadataPath)
			for (const entry of entries) {
				if (entry.endsWith(".cls") || entry.endsWith(".trigger")) {
					const fullPath = path.join(metadataPath, entry)
					const apexResult = await validateApexFile(fullPath)
					results.push({
						filePath: fullPath,
						type: apexResult.type === "trigger" ? "ApexTrigger" : "ApexClass",
						valid: apexResult.valid,
						errors: apexResult.errors,
						warnings: apexResult.warnings,
					})
				}
			}
		} catch {
			// No Apex files in directory
		}

		// Check for Profile files
		try {
			const entries = await fs.readdir(metadataPath)
			for (const entry of entries) {
				if (entry.endsWith(".profile-meta.xml")) {
					const fullPath = path.join(metadataPath, entry)
					const profileResult = await validateProfile(fullPath)
					results.push({
						filePath: fullPath,
						type: "Profile",
						valid: profileResult.valid,
						errors: profileResult.errors,
						warnings: profileResult.warnings,
					})
				}
			}
		} catch {
			// No profile files
		}
	} else if (stat.isFile()) {
		// Single file — detect by extension
		const fileName = path.basename(metadataPath)

		if (fileName.endsWith(".object-meta.xml")) {
			const objDir = path.dirname(metadataPath)
			const objResult = await validateCustomObject(objDir)
			results.push({
				filePath: metadataPath,
				type: "CustomObject",
				valid: objResult.valid,
				errors: objResult.errors,
				warnings: objResult.warnings,
			})
		} else if (fileName.endsWith(".field-meta.xml")) {
			const parentObj = path.basename(path.dirname(path.dirname(metadataPath)))
			const fieldResult = await validateCustomField(metadataPath, parentObj)
			results.push({
				filePath: metadataPath,
				type: "CustomField",
				valid: fieldResult.valid,
				errors: fieldResult.errors,
				warnings: fieldResult.warnings,
			})
		} else if (fileName.endsWith(".cls") || fileName.endsWith(".trigger")) {
			const apexResult = await validateApexFile(metadataPath)
			results.push({
				filePath: metadataPath,
				type: apexResult.type === "trigger" ? "ApexTrigger" : "ApexClass",
				valid: apexResult.valid,
				errors: apexResult.errors,
				warnings: apexResult.warnings,
			})
		} else if (fileName.endsWith(".profile-meta.xml")) {
			const profileResult = await validateProfile(metadataPath)
			results.push({
				filePath: metadataPath,
				type: "Profile",
				valid: profileResult.valid,
				errors: profileResult.errors,
				warnings: profileResult.warnings,
			})
		} else {
			results.push({
				filePath: metadataPath,
				type: "unknown",
				valid: false,
				errors: [`Could not determine metadata type for: ${fileName}`],
				warnings: [],
			})
		}
	}

	const passed = results.filter((r) => r.valid).length
	const failed = results.length - passed

	const summaryLines: string[] = []
	if (passed > 0) {
		summaryLines.push(`✅ ${passed} file(s) passed validation`)
	}
	if (failed > 0) {
		summaryLines.push(`❌ ${failed} file(s) have errors`)
	}

	return {
		totalFiles: results.length,
		passed,
		failed,
		results,
		summary: summaryLines.join("\n") || "No files found to validate",
	}
}

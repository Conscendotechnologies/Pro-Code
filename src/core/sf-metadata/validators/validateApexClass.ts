/**
 * Validator for Apex classes and triggers.
 *
 * Checks .cls + .cls-meta.xml pairing, basic syntax, and common anti-patterns.
 */

import * as path from "path"
import fs from "fs/promises"

export interface ValidateApexResult {
	valid: boolean
	name: string
	type: "class" | "trigger"
	errors: string[]
	warnings: string[]
}

/**
 * Validate an Apex class (.cls + .cls-meta.xml) or trigger (.trigger + .trigger-meta.xml).
 *
 * @param sourceFilePath — absolute path to .cls or .trigger file
 */
export async function validateApexFile(sourceFilePath: string): Promise<ValidateApexResult> {
	const errors: string[] = []
	const warnings: string[] = []

	const ext = path.extname(sourceFilePath)
	const isTrigger = ext === ".trigger"
	const isClass = ext === ".cls"

	if (!isTrigger && !isClass) {
		errors.push(`Unrecognized Apex file extension: "${ext}". Expected .cls or .trigger.`)
		return { valid: false, name: path.basename(sourceFilePath), type: "class", errors, warnings }
	}

	const fileName = path.basename(sourceFilePath, ext)
	const metaExt = isTrigger ? ".trigger-meta.xml" : ".cls-meta.xml"
	const metaFilePath = sourceFilePath.replace(ext, metaExt)

	// Check metadata companion exists
	try {
		await fs.access(metaFilePath)
	} catch {
		errors.push(
			`Missing metadata companion file: "${path.basename(metaFilePath)}". Every Apex ${isTrigger ? "trigger" : "class"} requires a matching *-meta.xml file.`,
		)
	}

	// Validate metadata companion content
	try {
		const metaXml = await fs.readFile(metaFilePath, "utf-8")
		const expectedTag = isTrigger ? "ApexTrigger" : "ApexClass"
		if (!new RegExp(`<${expectedTag}[^>]*xmlns="http://soap.sforce.com/2006/04/metadata"`).test(metaXml)) {
			errors.push(
				`${path.basename(metaFilePath)} has incorrect namespace or root element. Expected <${expectedTag}>.`,
			)
		}
		if (!/<apiVersion>/.test(metaXml)) {
			errors.push(`${path.basename(metaFilePath)} is missing <apiVersion>.`)
		}
		if (!/<status>/.test(metaXml)) {
			errors.push(`${path.basename(metaFilePath)} is missing <status>.`)
		}
	} catch (err: any) {
		if (err.code !== "ENOENT") {
			warnings.push(`Could not read metadata file: ${err.message}`)
		}
	}

	// Validate source file content
	try {
		const body = await fs.readFile(sourceFilePath, "utf-8")

		// Balanced braces
		const openBraces = (body.match(/\{/g) || []).length
		const closeBraces = (body.match(/\}/g) || []).length
		if (openBraces !== closeBraces) {
			errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing.`)
		}

		// SOQL in loop check
		const lines = body.split("\n")
		let braceCount = 0
		let inLoop = false
		for (const line of lines) {
			const trimmed = line.trim()
			const opens = (trimmed.match(/\{/g) || []).length
			const closes = (trimmed.match(/\}/g) || []).length

			if (/(for|while)\s*\(/.test(trimmed)) {
				inLoop = true
			}
			if (inLoop && /\bSELECT\b/i.test(trimmed) && trimmed.includes("[")) {
				errors.push(`SOQL query inside loop: "${trimmed.trim().slice(0, 80)}..." — move query outside loop.`)
			}
			if (inLoop && /\b(insert|update|delete|upsert|merge)\b\s+\w/i.test(trimmed)) {
				errors.push(
					`DML statement inside loop: "${trimmed.trim().slice(0, 80)}..." — collect records and DML once.`,
				)
			}

			braceCount += opens - closes
			if (braceCount <= 0) {
				inLoop = false
			}
		}
	} catch (err: any) {
		if (err.code === "ENOENT") {
			errors.push(`Apex source file not found: ${sourceFilePath}`)
		}
	}

	return {
		valid: errors.length === 0,
		name: fileName,
		type: isTrigger ? "trigger" : "class",
		errors,
		warnings,
	}
}

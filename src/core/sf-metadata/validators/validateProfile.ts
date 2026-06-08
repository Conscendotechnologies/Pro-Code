/**
 * Validator for Profile XML field/object/tab permissions.
 *
 * Validates permission XML blocks against Salesforce dependency rules.
 */

import * as path from "path"
import fs from "fs/promises"

export interface ValidateProfileResult {
	valid: boolean
	errors: string[]
	warnings: string[]
}

/**
 * Validate a Profile XML file for correct permission structures.
 *
 * @param profileFilePath — absolute path to .profile-meta.xml file
 */
export async function validateProfile(profileFilePath: string): Promise<ValidateProfileResult> {
	const errors: string[] = []
	const warnings: string[] = []

	try {
		const xml = await fs.readFile(profileFilePath, "utf-8")

		// Check namespace
		if (!/<Profile[^>]*xmlns="http:\/\/soap.sforce.com\/2006\/04\/metadata"/.test(xml)) {
			errors.push(`Missing or incorrect Profile namespace`)
		}

		// Parse fieldPermissions blocks
		const fieldPermRegex = /<fieldPermissions>([\s\S]*?)<\/fieldPermissions>/g
		let match
		while ((match = fieldPermRegex.exec(xml)) !== null) {
			const block = match[1]
			const fieldMatch = block.match(/<field>([^<]*)<\/field>/)
			const editableMatch = block.match(/<editable>(true|false)<\/editable>/)
			const readableMatch = block.match(/<readable>(true|false)<\/readable>/)

			const fieldName = fieldMatch ? fieldMatch[1] : "(unknown)"
			const editable = editableMatch ? editableMatch[1] === "true" : false
			const readable = readableMatch ? readableMatch[1] === "true" : false

			// Rule: editable requires readable
			if (editable && !readable) {
				errors.push(`Field "${fieldName}": editable=true requires readable=true`)
			}

			// Rule: field format must be Object.Field
			if (!fieldName.includes(".")) {
				errors.push(`Field "${fieldName}": must be in format "ObjectApiName.FieldApiName"`)
			}

			// Check for missing readable/editable tags
			if (!editableMatch) {
				errors.push(`Field "${fieldName}": missing <editable> tag`)
			}
			if (!readableMatch) {
				errors.push(`Field "${fieldName}": missing <readable> tag`)
			}
		}

		// Check for empty fieldPermissions blocks
		const emptyPermMatch = /<fieldPermissions>\s*<\/fieldPermissions>/g
		if (emptyPermMatch.test(xml)) {
			warnings.push(`Profile contains empty <fieldPermissions> blocks — remove them.`)
		}

		// Warn if no field permissions found
		if (!/<fieldPermissions>/.test(xml)) {
			warnings.push(`Profile has no <fieldPermissions> entries. This is fine if intentionally empty.`)
		}

		// Check for raw ampersands
		const cleaned = xml.replace(/&(?:amp|lt|gt|quot|apos|#\d+);/g, "")
		const rawAmp = cleaned.match(/&[^&\s]/)
		if (rawAmp) {
			errors.push(`Unescaped ampersand found: '${rawAmp[0]}'. Use &amp;.`)
		}
	} catch (err: any) {
		if (err.code === "ENOENT") {
			errors.push(`Profile XML file not found: ${profileFilePath}`)
		} else {
			errors.push(`Error reading profile XML: ${err.message}`)
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	}
}

/**
 * Validator for CustomField metadata.
 *
 * Validates field XML files on disk against schema rules.
 */

import * as path from "path"
import fs from "fs/promises"
import { validateApiName } from "../schemas/shared"

export interface ValidateFieldResult {
	valid: boolean
	fieldName: string
	errors: string[]
	warnings: string[]
}

/**
 * Validate a single CustomField XML file on disk.
 *
 * @param fieldFilePath — absolute path to .field-meta.xml file
 * @param objectApiName — the parent object API name (for field reference checks)
 */
export async function validateCustomField(fieldFilePath: string, objectApiName?: string): Promise<ValidateFieldResult> {
	const errors: string[] = []
	const warnings: string[] = []

	const fileName = path.basename(fieldFilePath, ".field-meta.xml")
	const nameValidation = validateApiName(fileName, fileName)

	if (!nameValidation.valid) {
		errors.push(...nameValidation.errors)
		return { valid: false, fieldName: fileName, errors, warnings }
	}

	if (!fileName.endsWith("__c")) {
		warnings.push(
			`Field "${fileName}" does not end with __c. This may be a standard field (unusual for custom fields).`,
		)
	}

	try {
		const xml = await fs.readFile(fieldFilePath, "utf-8")

		// Check namespace
		if (!/<CustomField[^>]*xmlns="http:\/\/soap.sforce.com\/2006\/04\/metadata"/.test(xml)) {
			errors.push(`Missing or incorrect CustomField namespace`)
		}

		// Check required elements
		if (!/<fullName>/.test(xml)) {
			errors.push(`Missing <fullName> element`)
		}

		if (!/<label>/.test(xml)) {
			errors.push(`Missing <label> element`)
		}

		if (!/<type>/.test(xml)) {
			errors.push(`Missing <type> element`)
		}

		// Check double underscores
		if (/__c_/.test(xml)) {
			errors.push(`XML contains consecutive double underscores — will fail Salesforce validation`)
		}

		// Lookup field: check deleteConstraint consistency with required
		const isLookup = /<type>Lookup<\/type>/.test(xml)
		if (isLookup) {
			const hasDeleteConstraint = /<deleteConstraint>/.test(xml)
			if (!hasDeleteConstraint) {
				warnings.push(`Lookup field is missing <deleteConstraint>. Default in Salesforce is Restrict.`)
			}

			// SetNull + required = error
			const isRequired = /<required>true<\/required>/.test(xml)
			const isSetNull = /<deleteConstraint>SetNull<\/deleteConstraint>/.test(xml)
			if (isRequired && isSetNull) {
				errors.push(
					`Lookup field has required=true and deleteConstraint=SetNull. SetNull cannot be used with required lookups. Use Restrict or Cascade.`,
				)
			}
		}

		// Formula field: check for unescaped XML entities in formula
		if (/<type>Formula<\/type>/.test(xml)) {
			const formulaMatch = xml.match(/<formula>([\s\S]*?)<\/formula>/)
			if (formulaMatch) {
				const formula = formulaMatch[1]
				// Check for raw < > & (common errors)
				if (/[<>]/.test(formula)) {
					errors.push(`Formula contains unescaped < or > characters. Use &lt; and &gt;.`)
				}
			}
		}

		// Check for raw ampersands
		const cleaned = xml.replace(/&(?:amp|lt|gt|quot|apos|#\d+);/g, "")
		const rawAmp = cleaned.match(/&[^&\s]/)
		if (rawAmp) {
			errors.push(`Unescaped ampersand: '${rawAmp[0]}'. Use &amp;.`)
		}
	} catch (err: any) {
		if (err.code === "ENOENT") {
			errors.push(`Field XML file not found at: ${fieldFilePath}`)
		} else {
			errors.push(`Error reading field XML: ${err.message}`)
		}
	}

	return {
		valid: errors.length === 0,
		fieldName: fileName,
		errors,
		warnings,
	}
}

/**
 * Validate all custom fields in an object's fields/ directory.
 */
export async function validateAllCustomFields(
	objectDirPath: string,
	objectApiName?: string,
): Promise<ValidateFieldResult[]> {
	const fieldsDir = path.join(objectDirPath, "fields")
	const results: ValidateFieldResult[] = []

	try {
		const entries = await fs.readdir(fieldsDir, { withFileTypes: true })
		for (const entry of entries) {
			if (entry.isFile() && entry.name.endsWith(".field-meta.xml")) {
				const result = await validateCustomField(path.join(fieldsDir, entry.name), objectApiName)
				results.push(result)
			}
		}
	} catch (err: any) {
		if (err.code === "ENOENT") {
			// No fields directory — that's fine, not every object has fields
			return results
		}
		throw err
	}

	return results
}

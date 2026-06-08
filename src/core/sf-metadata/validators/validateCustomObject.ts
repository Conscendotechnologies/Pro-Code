/**
 * Validator for CustomObject metadata.
 *
 * Validates an existing CustomObject folder on disk against the schema rules.
 * Works on already-generated XML files — catches errors before deployment.
 */

import * as path from "path"
import fs from "fs/promises"
import { validateApiName, stripCustomSuffix, pluralize, escapeXml } from "../schemas/shared"

export interface ValidateObjectResult {
	valid: boolean
	objectName: string
	errors: string[]
	warnings: string[]
	filesChecked: string[]
}

/**
 * Validate a CustomObject folder on disk.
 *
 * @param objectDirPath — absolute path to the object folder, e.g. `force-app/main/default/objects/Invoice__c/`
 */
export async function validateCustomObject(objectDirPath: string): Promise<ValidateObjectResult> {
	const errors: string[] = []
	const warnings: string[] = []
	const filesChecked: string[] = []

	const folderName = path.basename(objectDirPath)
	const objValidation = validateApiName(folderName, folderName)

	if (!objValidation.valid) {
		errors.push(...objValidation.errors)
		return { valid: false, objectName: folderName, errors, warnings, filesChecked }
	}

	if (!folderName.endsWith("__c")) {
		warnings.push(
			`Object folder "${folderName}" does not end with __c. Standard objects should not be in this directory.`,
		)
	}

	// Check object XML file
	const objectFile = path.join(objectDirPath, `${folderName}.object-meta.xml`)
	filesChecked.push(objectFile)

	try {
		const xml = await fs.readFile(objectFile, "utf-8")

		// Check required XML elements
		if (!/<CustomObject[^>]*xmlns="http:\/\/soap.sforce.com\/2006\/04\/metadata"/.test(xml)) {
			errors.push(`Missing or incorrect CustomObject namespace in "${folderName}.object-meta.xml"`)
		}

		if (!/<label>/.test(xml)) {
			errors.push(`Missing <label> in object XML`)
		}

		if (!/<pluralLabel>/.test(xml)) {
			warnings.push(`Missing <pluralLabel> in object XML`)
		}

		if (!/<enableReports>true<\/enableReports>/.test(xml)) {
			warnings.push(`enableReports is not set to true`)
		}

		if (!/<enableActivities>true<\/enableActivities>/.test(xml)) {
			warnings.push(`enableActivities is not set to true`)
		}

		// Check for double underscores in XML content (common LLM mistake)
		if (/__c_/.test(xml)) {
			errors.push(`XML contains consecutive double underscores (__c_) — this will fail Salesforce validation`)
		}

		// Check for unescaped ampersands in XML
		if (/&\S+;/.test(xml) === false) {
			// Only check for raw ampersands that aren't part of entities
			const rawAmpersands = xml.replace(/&(?:amp|lt|gt|quot|apos|#\d+);/g, "").match(/&[^&\s]/)
			if (rawAmpersands) {
				errors.push(`Unescaped ampersand found in XML: '${rawAmpersands[0]}'. Use &amp; instead.`)
			}
		}
	} catch (err: any) {
		if (err.code === "ENOENT") {
			errors.push(`Object XML file not found: ${folderName}.object-meta.xml. Expected at ${objectFile}`)
		} else {
			errors.push(`Error reading object XML: ${err.message}`)
		}
	}

	// Check for tab XML
	const tabFile = path.join(path.dirname(objectDirPath), "..", "..", "tabs", `${folderName}.tab-meta.xml`)
	filesChecked.push(tabFile)

	try {
		await fs.access(tabFile)
	} catch {
		warnings.push(`No tab XML found for object "${folderName}". Create at: tabs/${folderName}.tab-meta.xml`)
	}

	return {
		valid: errors.length === 0,
		objectName: folderName,
		errors,
		warnings,
		filesChecked,
	}
}

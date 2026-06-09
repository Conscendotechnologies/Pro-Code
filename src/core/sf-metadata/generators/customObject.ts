/**
 * CustomObject generator — produces valid .object-meta.xml, tab XML,
 * and optional field XML from typed input.
 *
 * The LLM provides a typed input object, not raw XML. The generator
 * handles all naming conventions, XML encoding, and file paths.
 */

import { escapeXml, validateApiName, labelToApiName, pluralize, GeneratedFile } from "./shared"
import { generateCustomFieldXml, CustomFieldInput, fieldFilePath } from "./customField"

// ── Input Types ───────────────────────────────────────────────────────────

export interface CustomObjectInput {
	/** Display name — "Invoice", "Payment Record" */
	label: string
	/** API name — auto-generated from label if not provided (ends with __c) */
	apiName?: string
	/** Plural label — auto-generated if not provided */
	pluralLabel?: string
	/** Description for the object (optional) */
	description?: string
	enableReports?: boolean
	enableActivities?: boolean
	enableFeeds?: boolean
	enableHistory?: boolean
	sharingModel?: "Private" | "ReadOnly" | "ReadWrite"
	/** Name field label — defaults to "{Label} Name" */
	nameFieldLabel?: string
	/** Whether to generate a custom tab XML file */
	createTab?: boolean
	/** Fields to create alongside the object */
	fields?: CustomFieldInput[]
}

export interface CustomObjectResult {
	objectApiName: string
	objectLabel: string
	files: GeneratedFile[]
}

// ── Validation ────────────────────────────────────────────────────────────

export function validateObjectInput(input: CustomObjectInput): string[] {
	const errors: string[] = []

	if (!input.label?.trim()) {
		errors.push("Label is required")
	}

	const label = input.label?.trim() || ""
	const apiName = input.apiName || labelToApiName(label, true)

	const nameCheck = validateApiName(apiName)
	if (!nameCheck.valid) {
		errors.push(...nameCheck.errors)
	}

	if (!apiName.endsWith("__c")) {
		errors.push(`Custom object "${apiName}" must end with __c`)
	}

	if (label.length > 40) {
		errors.push(`Label "${label}" exceeds 40 characters`)
	}

	return errors
}

// ── XML Generation ────────────────────────────────────────────────────────

export function generateObjectXml(input: CustomObjectInput): string {
	const apiName = input.apiName || labelToApiName(input.label, true)
	const pluralLabel = input.pluralLabel || pluralize(input.label)
	const nameFieldLabel = input.nameFieldLabel || `${input.label} Name`

	return `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <enableActivities>${input.enableActivities ?? true}</enableActivities>
    <enableFeeds>${input.enableFeeds ?? true}</enableFeeds>
    <enableHistory>${input.enableHistory ?? true}</enableHistory>
    <enableReports>${input.enableReports ?? true}</enableReports>
    <label>${escapeXml(input.label)}</label>
    <pluralLabel>${escapeXml(pluralLabel)}</pluralLabel>
    <nameField>
        <label>${escapeXml(nameFieldLabel)}</label>
        <type>Text</type>
    </nameField>
    <sharingModel>${input.sharingModel ?? "ReadWrite"}</sharingModel>
</CustomObject>`
}

export function generateTabXml(objectApiName: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <customObject>true</customObject>
    <motif>Custom53: Bell</motif>
</CustomTab>`
}

// ── Main Generator ────────────────────────────────────────────────────────

export function generateCustomObject(input: CustomObjectInput): CustomObjectResult {
	const errors = validateObjectInput(input)
	if (errors.length > 0) {
		throw new Error(`CustomObject validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`)
	}

	const apiName = input.apiName || labelToApiName(input.label, true)
	const files: GeneratedFile[] = []

	// 1. Object XML
	files.push({
		path: `force-app/main/default/objects/${apiName}/${apiName}.object-meta.xml`,
		content: generateObjectXml(input),
	})

	// 2. Tab XML
	if (input.createTab) {
		files.push({
			path: `force-app/main/default/tabs/${apiName}.tab-meta.xml`,
			content: generateTabXml(apiName),
		})
	}

	// 3. Field XMLs
	if (input.fields && input.fields.length > 0) {
		for (const field of input.fields) {
			const fieldApiName = field.apiName || labelToApiName(field.label, true)
			files.push({
				path: fieldFilePath(apiName, fieldApiName),
				content: generateCustomFieldXml(field, apiName),
			})
		}
	}

	return { objectApiName: apiName, objectLabel: input.label, files }
}

/**
 * CustomObject XML schema and validation.
 *
 * Encodes rules from:
 * - .roo/rules-Salesforce_Agent/custom-object.md (230 lines)
 * - .roo/rules-Salesforce_Agent/tab-creation.md (114 lines)
 * - src/.roo/rules/rules-salesforce/00-critical-salesforce-rules.md
 * - src/.roo/rules/00-global-salesforce-critical.md
 */

import { z } from "zod"
import { validateApiName, pluralize, escapeXml, labelToApiName, ValidationError, ValidationWarning } from "./shared"

// ── XML Element Schemas ───────────────────────────────────────────────────

export const nameFieldSchema = z.object({
	label: z.string().min(1, "Name field label is required"),
	type: z.enum(["Text", "AutoNumber"]).default("Text"),
})

export const customObjectXmlSchema = z.object({
	// Salesforce namespace: xmlns="http://soap.sforce.com/2006/04/metadata"
	deploymentStatus: z.enum(["Deployed", "InDevelopment"]).default("Deployed"),
	enableActivities: z.boolean().default(true),
	enableFeeds: z.boolean().default(true),
	enableHistory: z.boolean().default(true),
	enableReports: z.boolean().default(true),
	label: z.string().min(1, "Object label is required"),
	pluralLabel: z.string().optional(),
	nameField: nameFieldSchema.default({ label: "Name", type: "Text" }),
	sharingModel: z.enum(["Private", "ReadOnly", "ReadWrite"]).default("ReadWrite"),
})

// ── Input Types (what the LLM/tool provides) ──────────────────────────────

export interface CustomObjectInput {
	label: string
	apiName?: string // Auto-generated from label if not provided
	pluralLabel?: string // Auto-generated from label if not provided
	description?: string
	enableReports?: boolean
	enableActivities?: boolean
	enableFeeds?: boolean
	enableHistory?: boolean
	sharingModel?: "Private" | "ReadOnly" | "ReadWrite"
	nameFieldLabel?: string // Defaults to "{Label} Name"
	createTab?: boolean // Auto-create custom tab
}

export interface CustomObjectValidation {
	valid: boolean
	apiName: string
	label: string
	pluralLabel: string
	errors: ValidationError[]
	warnings: ValidationWarning[]
}

// ── Validation ────────────────────────────────────────────────────────────

export function validateCustomObjectInput(input: CustomObjectInput): CustomObjectValidation {
	const errors: ValidationError[] = []
	const warnings: ValidationWarning[] = []

	// Label
	if (!input.label || !input.label.trim()) {
		errors.push({ field: "label", message: "Object label is required" })
	}

	const label = input.label?.trim() || ""

	// API Name
	const apiName = input.apiName || labelToApiName(label, true)
	const nameValidation = validateApiName(apiName, apiName)
	for (const err of nameValidation.errors) {
		errors.push({ field: "apiName", message: err })
	}

	if (!apiName.endsWith("__c")) {
		errors.push({ field: "apiName", message: `Custom object "${apiName}" must end with __c` })
	}

	// Plural Label
	const pluralLabel = input.pluralLabel || pluralize(label)
	if (pluralLabel === label) {
		warnings.push({
			field: "pluralLabel",
			message: `Label and pluralLabel are the same ("${label}"). This may be intentional for non-pluralizable words.`,
		})
	}

	// Name Field Label
	const nameFieldLabel = input.nameFieldLabel || `${label} Name`
	if (nameFieldLabel.length > 40) {
		warnings.push({
			field: "nameFieldLabel",
			message: `Name field label "${nameFieldLabel}" exceeds 40 characters`,
		})
	}

	return {
		valid: errors.length === 0,
		apiName,
		label,
		pluralLabel,
		errors,
		warnings,
	}
}

// ── XML Generation ────────────────────────────────────────────────────────

export function generateCustomObjectXml(input: CustomObjectInput): string {
	const validation = validateCustomObjectInput(input)
	if (!validation.valid) {
		const errMsgs = validation.errors.map((e) => e.message).join("; ")
		throw new Error(`CustomObject validation failed: ${errMsgs}`)
	}

	const apiVersion = "60.0"
	const sharingModel = input.sharingModel || "ReadWrite"
	const nameFieldLabel = input.nameFieldLabel || `${validation.label} Name`

	return `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <enableActivities>${input.enableActivities ?? true}</enableActivities>
    <enableFeeds>${input.enableFeeds ?? true}</enableFeeds>
    <enableHistory>${input.enableHistory ?? true}</enableHistory>
    <enableReports>${input.enableReports ?? true}</enableReports>
    <label>${escapeXml(validation.label)}</label>
    <pluralLabel>${escapeXml(validation.pluralLabel)}</pluralLabel>
    <nameField>
        <label>${escapeXml(nameFieldLabel)}</label>
        <type>Text</type>
    </nameField>
    <sharingModel>${sharingModel}</sharingModel>
</CustomObject>`
}

// ── Tab XML Generation ────────────────────────────────────────────────────

export function generateCustomTabXml(objectApiName: string): string {
	// Validate the object name before generating
	validateApiName(objectApiName, objectApiName)
	const motif = "Custom53: Bell"

	return `<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <customObject>true</customObject>
    <motif>${escapeXml(motif)}</motif>
</CustomTab>`
}

// ── File Path Helpers ─────────────────────────────────────────────────────

export function objectFilePath(objectApiName: string): string {
	return `force-app/main/default/objects/${objectApiName}/${objectApiName}.object-meta.xml`
}

export function tabFilePath(objectApiName: string): string {
	return `force-app/main/default/tabs/${objectApiName}.tab-meta.xml`
}

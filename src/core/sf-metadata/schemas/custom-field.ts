/**
 * CustomField XML schema and validation.
 *
 * Encodes rules from:
 * - .roo/rules-Salesforce_Agent/custom-field.md (341 lines)
 * - Various lookup constraint rules from instruction files
 */

import { z } from "zod"
import { validateApiName, escapeXml, labelToApiName, ValidationError, ValidationWarning } from "./shared"

// ── Field Types ───────────────────────────────────────────────────────────

export const FIELD_TYPES = [
	"Text",
	"Number",
	"Checkbox",
	"Date",
	"DateTime",
	"Currency",
	"Picklist",
	"MultiselectPicklist",
	"Lookup",
	"Formula",
	"AutoNumber",
	"TextArea",
	"LongTextArea",
	"RichTextArea",
	"Email",
	"Phone",
	"Url",
	"Percent",
	"Location",
] as const

export type FieldType = (typeof FIELD_TYPES)[number]

// ── Input Types ───────────────────────────────────────────────────────────

export interface PicklistValue {
	label: string
	apiName?: string // Auto-generated from label if not provided
	isDefault?: boolean
}

export interface CustomFieldInput {
	label: string
	apiName?: string // Auto-generated if not provided
	type: FieldType
	// Text / TextArea
	length?: number
	// Number / Currency / Percent
	precision?: number
	scale?: number
	// Picklist
	picklistValues?: PicklistValue[]
	restrictedPicklist?: boolean
	// Lookup
	referenceTo?: string
	deleteConstraint?: "SetNull" | "Restrict" | "Cascade"
	relationshipLabel?: string
	relationshipName?: string
	// Formula
	formula?: string
	formulaReturnType?: FieldType
	// General
	required?: boolean
	defaultValue?: string
	unique?: boolean
	externalId?: boolean
}

export interface CustomFieldValidation {
	valid: boolean
	apiName: string
	label: string
	errors: ValidationError[]
	warnings: ValidationWarning[]
}

// ── Validation ────────────────────────────────────────────────────────────

export function validateCustomFieldInput(input: CustomFieldInput): CustomFieldValidation {
	const errors: ValidationError[] = []
	const warnings: ValidationWarning[] = []

	if (!input.label?.trim()) {
		errors.push({ field: "label", message: "Field label is required" })
	}

	const label = input.label?.trim() || ""
	const apiName = input.apiName || labelToApiName(label, true)

	const nameValidation = validateApiName(apiName, apiName)
	for (const err of nameValidation.errors) {
		errors.push({ field: "apiName", message: err })
	}

	if (!apiName.endsWith("__c")) {
		errors.push({ field: "apiName", message: `Custom field "${apiName}" must end with __c` })
	}

	// Type-specific validation
	switch (input.type) {
		case "Text":
		case "TextArea":
			if (input.length !== undefined && (input.length < 1 || input.length > 255)) {
				errors.push({ field: "length", message: "Text field length must be 1-255" })
			}
			break

		case "Number":
		case "Currency":
		case "Percent":
			if (!input.precision && input.scale !== undefined) {
				errors.push({ field: "precision", message: "Number field requires precision" })
			}
			if (input.precision !== undefined && (input.precision < 1 || input.precision > 18)) {
				errors.push({ field: "precision", message: "Precision must be 1-18" })
			}
			if (input.scale !== undefined && (input.scale < 0 || input.scale > input.precision!)) {
				errors.push({ field: "scale", message: "Scale must be 0 to precision" })
			}
			break

		case "Picklist":
		case "MultiselectPicklist":
			if (!input.picklistValues || input.picklistValues.length === 0) {
				errors.push({ field: "picklistValues", message: "Picklist requires at least one value" })
			}
			break

		case "Lookup":
			if (!input.referenceTo) {
				errors.push({ field: "referenceTo", message: "Lookup field requires a referenceTo (target object)" })
			}
			if (input.required && input.deleteConstraint === "SetNull") {
				errors.push({
					field: "deleteConstraint",
					message:
						"SetNull cannot be used with required=true. Use Restrict or Cascade instead. Required lookups cannot accept null values.",
				})
			}
			break

		case "Formula":
			if (!input.formula) {
				errors.push({ field: "formula", message: "Formula field requires a formula expression" })
			}
			if (!input.formulaReturnType) {
				errors.push({ field: "formulaReturnType", message: "Formula field requires a return type" })
			}
			break
	}

	return { valid: errors.length === 0, apiName, label, errors, warnings }
}

// ── XML Generation ────────────────────────────────────────────────────────

export function generateCustomFieldXml(input: CustomFieldInput, objectApiName: string): string {
	const validation = validateCustomFieldInput(input)
	if (!validation.valid) {
		const errMsgs = validation.errors.map((e) => e.message).join("; ")
		throw new Error(`CustomField validation failed: ${errMsgs}`)
	}

	validateApiName(objectApiName, objectApiName)

	let xml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>${escapeXml(validation.apiName)}</fullName>
    <label>${escapeXml(validation.label)}</label>
    <type>${input.type}</type>
`

	// Type-specific elements
	switch (input.type) {
		case "Text":
		case "TextArea":
			if (input.length) {
				xml += `    <length>${input.length}</length>\n`
			}
			break

		case "Number":
		case "Currency":
		case "Percent":
			if (input.precision) {
				xml += `    <precision>${input.precision}</precision>\n`
			}
			if (input.scale !== undefined) {
				xml += `    <scale>${input.scale}</scale>\n`
			}
			break

		case "Picklist":
		case "MultiselectPicklist":
			if (input.picklistValues && input.picklistValues.length > 0) {
				xml += `    <valueSet>\n      <valueSetDefinition>\n        <sorted>false</sorted>\n`
				for (const pv of input.picklistValues) {
					const name = pv.apiName || pv.label
					xml += `        <value>\n          <fullName>${escapeXml(name)}</fullName>\n          <default>${pv.isDefault ?? false}</default>\n          <label>${escapeXml(pv.label)}</label>\n        </value>\n`
				}
				xml += `      </valueSetDefinition>\n      <restricted>${input.restrictedPicklist ?? true}</restricted>\n    </valueSet>\n`
			}
			break

		case "Lookup":
			if (input.referenceTo) {
				xml += `    <referenceTo>${escapeXml(input.referenceTo)}</referenceTo>\n`
			}
			if (input.relationshipLabel) {
				xml += `    <relationshipLabel>${escapeXml(input.relationshipLabel)}</relationshipLabel>\n`
			}
			if (input.relationshipName) {
				xml += `    <relationshipName>${escapeXml(input.relationshipName)}</relationshipName>\n`
			}
			if (input.deleteConstraint) {
				xml += `    <deleteConstraint>${input.deleteConstraint}</deleteConstraint>\n`
			}
			break

		case "Formula":
			if (input.formula) {
				xml += `    <formula>${escapeXml(input.formula)}</formula>\n`
			}
			if (input.formulaReturnType) {
				xml += `    <formulaTreatBlankAs>BlankAsZero</formulaTreatBlankAs>\n`
			}
			break

		case "AutoNumber":
			xml += `    <displayFormat>A-{0000}</displayFormat>\n`
			if (input.defaultValue) {
				xml += `    <startingNumber>${input.defaultValue}</startingNumber>\n`
			}
			break
	}

	if (input.required) {
		xml += `    <required>true</required>\n`
	}

	if (input.unique) {
		xml += `    <unique>true</unique>\n`
	}

	if (input.externalId) {
		xml += `    <externalId>true</externalId>\n`
	}

	xml += `</CustomField>`
	return xml
}

// ── File Path Helpers ─────────────────────────────────────────────────────

export function fieldFilePath(objectApiName: string, fieldApiName: string): string {
	return `force-app/main/default/objects/${objectApiName}/fields/${fieldApiName}.field-meta.xml`
}

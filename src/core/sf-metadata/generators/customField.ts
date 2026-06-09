/**
 * CustomField generator — produces valid .field-meta.xml from typed input.
 *
 * Handles all 19 Salesforce field types with type-specific XML generation.
 * XML escaping, naming conventions, and lookup constraints are all handled
 * by the generator — the LLM never writes raw field XML.
 */

import { escapeXml, validateApiName, labelToApiName } from "./shared"

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
	apiName?: string
	isDefault?: boolean
}

export interface CustomFieldInput {
	label: string
	apiName?: string
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

// ── Validation ────────────────────────────────────────────────────────────

export function validateFieldInput(input: CustomFieldInput): string[] {
	const errors: string[] = []

	if (!input.label?.trim()) {
		errors.push("Field label is required")
		return errors
	}

	const apiName = input.apiName || labelToApiName(input.label, true)
	const nameCheck = validateApiName(apiName)
	if (!nameCheck.valid) errors.push(...nameCheck.errors)
	if (!apiName.endsWith("__c")) errors.push(`Custom field "${apiName}" must end with __c`)

	switch (input.type) {
		case "Text":
		case "TextArea":
			if (input.length !== undefined && (input.length < 1 || input.length > 255)) {
				errors.push("Text field length must be 1-255")
			}
			break
		case "Number":
		case "Currency":
		case "Percent":
			if (input.precision !== undefined && (input.precision < 1 || input.precision > 18)) {
				errors.push("Precision must be 1-18")
			}
			break
		case "Picklist":
		case "MultiselectPicklist":
			if (!input.picklistValues || input.picklistValues.length === 0) {
				errors.push("Picklist requires at least one value")
			}
			break
		case "Lookup":
			if (!input.referenceTo) errors.push("Lookup field requires referenceTo (target object)")
			if (input.required && input.deleteConstraint === "SetNull") {
				errors.push("SetNull cannot be used with required=true. Use Restrict or Cascade.")
			}
			break
		case "Formula":
			if (!input.formula) errors.push("Formula field requires a formula expression")
			break
	}

	return errors
}

// ── XML Generation ────────────────────────────────────────────────────────

export function generateCustomFieldXml(input: CustomFieldInput, objectApiName: string): string {
	const errors = validateFieldInput(input)
	if (errors.length > 0) {
		throw new Error(`CustomField validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`)
	}

	const apiName = input.apiName || labelToApiName(input.label, true)

	let xml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>${escapeXml(apiName)}</fullName>
    <label>${escapeXml(input.label)}</label>
    <type>${input.type}</type>
`

	switch (input.type) {
		case "Text":
		case "TextArea":
		case "LongTextArea":
		case "RichTextArea":
			if (input.length) xml += `    <length>${input.length}</length>\n`
			if (input.type === "LongTextArea") xml += `    <visibleLines>5</visibleLines>\n`
			if (input.type === "RichTextArea") xml += `    <visibleLines>25</visibleLines>\n`
			break

		case "Number":
		case "Currency":
		case "Percent":
			if (input.precision) xml += `    <precision>${input.precision}</precision>\n`
			if (input.scale !== undefined) xml += `    <scale>${input.scale}</scale>\n`
			break

		case "Picklist":
		case "MultiselectPicklist":
			if (input.picklistValues?.length) {
				xml += `    <valueSet>\n      <valueSetDefinition>\n        <sorted>false</sorted>\n`
				for (const pv of input.picklistValues) {
					const name = pv.apiName || pv.label
					xml += `        <value>\n          <fullName>${escapeXml(name)}</fullName>\n`
					xml += `          <default>${pv.isDefault ?? false}</default>\n`
					xml += `          <label>${escapeXml(pv.label)}</label>\n        </value>\n`
				}
				xml += `      </valueSetDefinition>\n`
				xml += `      <restricted>${input.restrictedPicklist ?? true}</restricted>\n    </valueSet>\n`
			}
			break

		case "Lookup":
			if (input.referenceTo) xml += `    <referenceTo>${escapeXml(input.referenceTo)}</referenceTo>\n`
			if (input.relationshipLabel)
				xml += `    <relationshipLabel>${escapeXml(input.relationshipLabel)}</relationshipLabel>\n`
			if (input.relationshipName)
				xml += `    <relationshipName>${escapeXml(input.relationshipName)}</relationshipName>\n`
			if (input.deleteConstraint) xml += `    <deleteConstraint>${input.deleteConstraint}</deleteConstraint>\n`
			break

		case "Formula":
			if (input.formula) xml += `    <formula>${escapeXml(input.formula)}</formula>\n`
			if (input.formulaReturnType) xml += `    <formulaTreatBlankAs>BlankAsZero</formulaTreatBlankAs>\n`
			break

		case "AutoNumber":
			xml += `    <displayFormat>A-{0000}</displayFormat>\n`
			if (input.defaultValue) xml += `    <startingNumber>${input.defaultValue}</startingNumber>\n`
			break

		case "Email":
		case "Phone":
		case "Url":
			if (input.unique) xml += `    <unique>true</unique>\n`
			break

		case "Checkbox":
			if (input.defaultValue) xml += `    <defaultValue>${input.defaultValue}</defaultValue>\n`
			break

		case "Date":
		case "DateTime":
			// No extra config for basic date types
			break

		case "Location":
			// Compound field — no extra config needed
			break
	}

	if (input.required) xml += `    <required>true</required>\n`
	if (input.unique) xml += `    <unique>true</unique>\n`
	if (input.externalId) xml += `    <externalId>true</externalId>\n`

	xml += `</CustomField>`
	return xml
}

// ── File Path ─────────────────────────────────────────────────────────────

export function fieldFilePath(objectApiName: string, fieldApiName: string): string {
	return `force-app/main/default/objects/${objectApiName}/fields/${fieldApiName}.field-meta.xml`
}

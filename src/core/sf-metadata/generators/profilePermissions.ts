/**
 * Profile permissions generator — produces valid field permission XML.
 *
 * Handles the permission dependency rules:
 * - editable requires readable
 * - field format must be ObjectApiName.FieldApiName
 * - Both editable and readable tags must be present
 */

import { escapeXml } from "./shared"

// ── Types ─────────────────────────────────────────────────────────────────

export interface FieldPermissionInput {
	field: string // "Account.Phone" or "Invoice__c.Customer_Type__c"
	readable: boolean
	editable: boolean
}

export interface FieldPermissionError {
	field: string
	message: string
}

export interface ObjectPermissionInput {
	object: string
	allowCreate?: boolean
	allowRead?: boolean
	allowEdit?: boolean
	allowDelete?: boolean
	viewAllRecords?: boolean
	modifyAllRecords?: boolean
}

export interface TabVisibilityInput {
	tab: string
	visibility: "DefaultOn" | "DefaultOff" | "Hidden"
}

// ── Validation ────────────────────────────────────────────────────────────

export function validateFieldPermission(input: FieldPermissionInput): FieldPermissionError[] {
	const errors: FieldPermissionError[] = []

	if (!input.field || !input.field.includes(".")) {
		errors.push({ field: input.field || "(empty)", message: "Must be in format ObjectApiName.FieldApiName" })
		return errors
	}

	if (input.editable && !input.readable) {
		errors.push({ field: input.field, message: "editable=true requires readable=true" })
	}

	return errors
}

// Object permission dependency rules (from object-permission.md):
//   Create needs Read
//   Edit needs Read
//   Delete needs Read + Edit
//   ViewAll needs Read
//   ModifyAll needs Read + Edit + Delete + ViewAll
const OBJECT_PERMISSION_RULES: Array<{
	target: keyof ObjectPermissionInput
	requires: Array<keyof ObjectPermissionInput>
}> = [
	{ target: "allowCreate", requires: ["allowRead"] },
	{ target: "allowEdit", requires: ["allowRead"] },
	{ target: "allowDelete", requires: ["allowRead", "allowEdit"] },
	{ target: "viewAllRecords", requires: ["allowRead"] },
	{ target: "modifyAllRecords", requires: ["allowRead", "allowEdit", "allowDelete", "viewAllRecords"] },
]

export function validateObjectPermission(input: ObjectPermissionInput): FieldPermissionError[] {
	const errors: FieldPermissionError[] = []

	if (!input.object?.trim()) {
		errors.push({ field: "object", message: "Object API name is required" })
		return errors
	}

	for (const rule of OBJECT_PERMISSION_RULES) {
		if (input[rule.target]) {
			for (const required of rule.requires) {
				if (!input[required]) {
					errors.push({
						field: input.object,
						message: `${rule.target} requires ${required} to also be true`,
					})
				}
			}
		}
	}

	return errors
}

// ── XML Generation ────────────────────────────────────────────────────────

export function generateFieldPermissionXml(permission: FieldPermissionInput): string {
	return `<fieldPermissions>
        <editable>${permission.editable}</editable>
        <field>${escapeXml(permission.field)}</field>
        <readable>${permission.readable}</readable>
    </fieldPermissions>`
}

export function generateObjectPermissionXml(permission: ObjectPermissionInput): string {
	const parts: string[] = []
	if (permission.allowCreate !== undefined) parts.push(`<allowCreate>${permission.allowCreate}</allowCreate>`)
	if (permission.allowRead !== undefined) parts.push(`<allowRead>${permission.allowRead}</allowRead>`)
	if (permission.allowEdit !== undefined) parts.push(`<allowEdit>${permission.allowEdit}</allowEdit>`)
	if (permission.allowDelete !== undefined) parts.push(`<allowDelete>${permission.allowDelete}</allowDelete>`)
	if (permission.viewAllRecords !== undefined)
		parts.push(`<viewAllRecords>${permission.viewAllRecords}</viewAllRecords>`)
	if (permission.modifyAllRecords !== undefined)
		parts.push(`<modifyAllRecords>${permission.modifyAllRecords}</modifyAllRecords>`)

	return `<objectPermissions>
        ${parts.join("\n        ")}
        <object>${escapeXml(permission.object)}</object>
    </objectPermissions>`
}

export function generateTabVisibilityXml(tab: TabVisibilityInput): string {
	return `<tabVisibilities>
        <tab>${escapeXml(tab.tab)}</tab>
        <visibility>${escapeXml(tab.visibility)}</visibility>
    </tabVisibilities>`
}

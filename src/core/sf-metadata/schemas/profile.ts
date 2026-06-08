/**
 * Profile XML schema for field-level and object-level permissions.
 *
 * Encodes rules from:
 * - .roo/rules-Salesforce_Agent/field-permissions.md (194 lines)
 * - .roo/rules-Salesforce_Agent/object-permission.md (61 lines)
 * - .roo/rules-Salesforce_Agent/tab-creation.md → tab visibility rules
 * - src/.roo/rules/rules-salesforce/06-security-and-fls.md
 * - Various permission dependency rules (readable required for editable, etc.)
 */

import { escapeXml } from "./shared"

// ── Types ─────────────────────────────────────────────────────────────────

export interface FieldPermissionInput {
	field: string // "ObjectApiName.FieldApiName" e.g., "Account.Phone" or "Invoice__c.Customer_Type__c"
	readable: boolean
	editable: boolean
}

export interface ObjectPermissionInput {
	object: string // "Account" or "Invoice__c"
	allowCreate?: boolean
	allowRead?: boolean
	allowEdit?: boolean
	allowDelete?: boolean
	viewAllRecords?: boolean
	modifyAllRecords?: boolean
}

export interface TabVisibilityInput {
	tab: string // "Invoice__c"
	visibility: "DefaultOn" | "DefaultOff" | "Hidden"
}

export interface ProfilePermissionValidation {
	valid: boolean
	errors: FieldPermissionError[]
}

export interface FieldPermissionError {
	field: string
	message: string
}

// ── Permission Dependency Rules ───────────────────────────────────────────

/**
 * Ordered dependency rules for object permissions.
 * From object-permission.md and field-permissions.md:
 * 1. Read is required for Create
 * 2. Read is required for Edit
 * 3. Read AND Edit are required for Delete
 * 4. Read is required for ViewAllRecords
 * 5. Read, Edit, Delete, ViewAll are required for ModifyAll
 */
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

// ── Validation ────────────────────────────────────────────────────────────

export function validateFieldPermission(input: FieldPermissionInput): FieldPermissionError[] {
	const errors: FieldPermissionError[] = []

	if (!input.field || !input.field.includes(".")) {
		errors.push({
			field: input.field || "(empty)",
			message: 'Field permission must be in format "ObjectApiName.FieldApiName"',
		})
		return errors
	}

	// Dependency rule: editable requires readable (from field-permissions.md)
	if (input.editable && !input.readable) {
		errors.push({
			field: input.field,
			message: `"${input.field}" has editable=true but readable=false. Editable requires readable.`,
		})
	}

	return errors
}

export function validateObjectPermission(input: ObjectPermissionInput): FieldPermissionError[] {
	const errors: FieldPermissionError[] = []

	if (!input.object?.trim()) {
		errors.push({ field: "object", message: "Object API name is required" })
		return errors
	}

	for (const rule of OBJECT_PERMISSION_RULES) {
		const targetValue = input[rule.target]
		if (targetValue) {
			for (const required of rule.requires) {
				if (!input[required]) {
					errors.push({
						field: input.object,
						message: `"${rule.target}" requires "${required}" to also be true on ${input.object}`,
					})
				}
			}
		}
	}

	return errors
}

export function validateFieldPermissions(permissions: FieldPermissionInput[]): ProfilePermissionValidation {
	const errors: FieldPermissionError[] = []
	const seen = new Set<string>()

	for (const perm of permissions) {
		if (seen.has(perm.field)) {
			errors.push({ field: perm.field, message: `Duplicate permission entry for "${perm.field}"` })
			continue
		}
		seen.add(perm.field)
		errors.push(...validateFieldPermission(perm))
	}

	return { valid: errors.length === 0, errors }
}

// ── XML Generation ────────────────────────────────────────────────────────

export function generateFieldPermissionXml(permission: FieldPermissionInput): string {
	return `<fieldPermissions>
        <editable>${permission.editable}</editable>
        <field>${escapeXml(permission.field)}</field>
        <readable>${permission.readable}</readable>
    </fieldPermissions>`
}

export function generateFieldPermissionsXml(permissions: FieldPermissionInput[]): string {
	return permissions.map((p) => generateFieldPermissionXml(p)).join("\n    ")
}

export function generateObjectPermissionXml(permission: ObjectPermissionInput): string {
	const parts: string[] = []

	if (permission.allowCreate !== undefined) {
		parts.push(`<allowCreate>${permission.allowCreate}</allowCreate>`)
	}
	if (permission.allowRead !== undefined) {
		parts.push(`<allowRead>${permission.allowRead}</allowRead>`)
	}
	if (permission.allowEdit !== undefined) {
		parts.push(`<allowEdit>${permission.allowEdit}</allowEdit>`)
	}
	if (permission.allowDelete !== undefined) {
		parts.push(`<allowDelete>${permission.allowDelete}</allowDelete>`)
	}
	if (permission.viewAllRecords !== undefined) {
		parts.push(`<viewAllRecords>${permission.viewAllRecords}</viewAllRecords>`)
	}
	if (permission.modifyAllRecords !== undefined) {
		parts.push(`<modifyAllRecords>${permission.modifyAllRecords}</modifyAllRecords>`)
	}

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

/**
 * Shared Salesforce metadata naming rules and utilities.
 *
 * These encode the naming conventions currently spread across 15+ instruction files:
 * - apiNameRules: starts with letter, no double underscores, ends with __c for custom
 * - XML entity encoding: &amp;, &lt;, &gt;, &quot;, &apos;
 * - File path / fullName conventions per metadata type
 */

// ── XML Encoding ──────────────────────────────────────────────────────────

const XML_ENTITIES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&apos;",
}

/**
 * Escape XML special characters. Order matters: `&` must be escaped first.
 */
export function escapeXml(value: string): string {
	return value.replace(/[&<>"']/g, (ch) => XML_ENTITIES[ch] || ch)
}

/**
 * Escape XML but skip values that are already XML-safe.
 * Used for formula fields where the user provides the raw formula and we encode it.
 */
export function escapeXmlFormula(formula: string): string {
	return escapeXml(formula)
}

// ── API Name Validation ───────────────────────────────────────────────────

/**
 * Salesforce API name constraints (from Salesforce Metadata API docs):
 * - Only letters, numbers, and underscores
 * - Must start with a letter
 * - Cannot end with an underscore
 * - Cannot contain consecutive underscores
 */
export const API_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/

export interface ApiNameValidation {
	valid: boolean
	errors: string[]
}

export function validateApiName(name: string, context?: string): ApiNameValidation {
	const errors: string[] = []
	const prefix = context ? `${context}: ` : ""

	if (!name) {
		errors.push(`${prefix}API name is required`)
		return { valid: false, errors }
	}

	if (/^\d/.test(name)) {
		errors.push(`${prefix}"${name}" must start with a letter`)
	}

	if (/[^A-Za-z0-9_]/.test(name)) {
		errors.push(`${prefix}"${name}" can only contain letters, numbers, and underscores`)
	}

	if (name.endsWith("_")) {
		errors.push(`${prefix}"${name}" cannot end with an underscore`)
	}

	if (/__/.test(name)) {
		errors.push(`${prefix}"${name}" cannot contain consecutive underscores`)
	}

	return { valid: errors.length === 0, errors }
}

/**
 * Check if a name is a custom Salesforce field/object.
 * Custom metadata names end with `__c`.
 */
export function isCustom(name: string): boolean {
	return name.endsWith("__c")
}

/**
 * Strip the `__c` suffix from a custom metadata name.
 * Used for path assistant file names and API name derivation.
 * Example: `Invoice__c` → `Invoice`, `Custom_Object__c` → `Custom_Object`
 */
export function stripCustomSuffix(name: string): string {
	return name.endsWith("__c") ? name.slice(0, -3) : name
}

/**
 * Normalize a label into an API name:
 * - Replace spaces with underscores
 * - Append `__c` for custom objects/fields
 * - Ensure starts with letter
 */
export function labelToApiName(label: string, custom: boolean = false): string {
	let name = label
		.trim()
		.replace(/\s+/g, "_")
		.replace(/[^A-Za-z0-9_]/g, "")
	if (custom && !name.endsWith("__c")) {
		name += "__c"
	}
	return name
}

// ── Pluralization ─────────────────────────────────────────────────────────

/**
 * Words that should not be pluralized.
 * From instruction files: Country, City, Person, Name, Data
 */
const NON_PLURALIZABLE = new Set(["country", "city", "person", "name", "data", "equipment", "information", "weather"])

/**
 * Simple English pluralizer. Handles common cases.
 * Returns the original label if the word should not be pluralized.
 */
export function pluralize(word: string): string {
	if (NON_PLURALIZABLE.has(word.toLowerCase())) {
		return word
	}
	if (word.endsWith("y") && !/[aeiou]y$/.test(word)) {
		return word.slice(0, -1) + "ies" // Category → Categories
	}
	if (word.endsWith("s") || word.endsWith("x") || word.endsWith("z")) {
		return word + "es" // Box → Boxes
	}
	if (word.endsWith("ch") || word.endsWith("sh")) {
		return word + "es" // Church → Churches
	}
	return word + "s"
}

// ── FullName Generation ───────────────────────────────────────────────────

/**
 * Generate the fullName value for RecordType metadata.
 * Format: `ObjectApiName.RecordTypeDeveloperName`
 * Example: `Account.Enterprise_Account`
 */
export function recordTypeFullName(objectApiName: string, developerName: string): string {
	return `${objectApiName}.${developerName}`
}

/**
 * Generate a clean file name for PathAssistant metadata.
 * Strips `__c` from custom names to avoid double underscores.
 * Example: `Nineteen__c` + `Mic_Color__c` → `Nineteen_Mic_Color.pathAssistant-meta.xml`
 */
export function pathAssistantFileName(objectApiName: string, fieldApiName: string): string {
	return `${stripCustomSuffix(objectApiName)}_${stripCustomSuffix(fieldApiName)}.pathAssistant-meta.xml`
}

// ── API Version ───────────────────────────────────────────────────────────

/**
 * Default API version. Should be derived from sfdx-project.json if available.
 */
export const DEFAULT_API_VERSION = "60.0"

// ── Common Validation Types ───────────────────────────────────────────────

export interface ValidationError {
	field: string
	message: string
}

export interface ValidationWarning {
	field: string
	message: string
}

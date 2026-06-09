/**
 * Shared utilities for Salesforce metadata generators.
 *
 * These produce correctly-formatted XML by construction — no instruction
 * files needed. The XSD validates the output; these functions ensure the
 * output is valid before validation.
 */

// ── XML Encoding ──────────────────────────────────────────────────────────

const XML_ENTITIES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&apos;",
}

export function escapeXml(value: string): string {
	return value.replace(/[&<>"']/g, (ch) => XML_ENTITIES[ch] || ch)
}

// ── API Name Utilities ────────────────────────────────────────────────────

export interface ApiNameResult {
	valid: boolean
	errors: string[]
}

export function validateApiName(name: string): ApiNameResult {
	const errors: string[] = []
	if (!name) {
		errors.push("API name is required")
		return { valid: false, errors }
	}
	if (/^\d/.test(name)) errors.push(`"${name}" must start with a letter`)
	if (/[^A-Za-z0-9_]/.test(name)) errors.push(`"${name}" can only contain letters, numbers, and underscores`)
	if (name.endsWith("_")) errors.push(`"${name}" cannot end with an underscore`)
	if (/__/.test(name) && !name.endsWith("__c")) errors.push(`"${name}" cannot contain consecutive underscores`)
	return { valid: errors.length === 0, errors }
}

export function isCustom(name: string): boolean {
	return name.endsWith("__c")
}

export function stripCustomSuffix(name: string): string {
	return name.endsWith("__c") ? name.slice(0, -3) : name
}

export function labelToApiName(label: string, custom: boolean = false): string {
	let name = label
		.trim()
		.replace(/\s+/g, "_")
		.replace(/[^A-Za-z0-9_]/g, "")
	if (custom && !name.endsWith("__c")) name += "__c"
	return name
}

// ── Pluralization ─────────────────────────────────────────────────────────

const NON_PLURALIZABLE = new Set(["country", "city", "person", "name", "data", "equipment", "information", "weather"])

export function pluralize(word: string): string {
	if (NON_PLURALIZABLE.has(word.toLowerCase())) return word
	if (word.endsWith("y") && !/[aeiou]y$/.test(word)) return word.slice(0, -1) + "ies"
	if (word.endsWith("s") || word.endsWith("x") || word.endsWith("z")) return word + "es"
	if (word.endsWith("ch") || word.endsWith("sh")) return word + "es"
	return word + "s"
}

// ── Generated File Result ─────────────────────────────────────────────────

export interface GeneratedFile {
	path: string // Relative to workspace root
	content: string
}

export const DEFAULT_API_VERSION = "60.0"

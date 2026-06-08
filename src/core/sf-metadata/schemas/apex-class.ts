/**
 * ApexClass .cls + .cls-meta.xml schema and validation.
 *
 * Encodes rules from:
 * - .roo/rules-code/apex-guide.md (~2400 lines)
 * - .roo/rules-Salesforce_Agent/use-safeWriteJson.md
 * - src/.roo/rules/rules-salesforce/01-apex-file-structure.md
 * - src/.roo/rules/rules-salesforce/02-metadata-companions.md
 * - Various naming convention rules across instruction files
 */

import { validateApiName, escapeXml, DEFAULT_API_VERSION, ValidationError, ValidationWarning } from "./shared"

// ── Input Types ───────────────────────────────────────────────────────────

export interface ApexClassInput {
	name: string // "InvoiceService" → file name "InvoiceService.cls"
	body: string // The Apex source code
	sharing?: "with" | "without" | "inherited"
	isTest?: boolean // Auto-sets .cls-meta.xml status
	apiVersion?: string // Defaults to 60.0
}

export interface ApexTriggerInput {
	name: string // "AccountTrigger" -> "AccountTrigger.trigger"
	body: string // The Apex trigger code
	objectName: string // "Account" — the SObject
	events?: string[] // ["before insert", "after update"] → defaults from trigger body
	apiVersion?: string // Defaults to 60.0
}

export interface ApexClassValidation {
	valid: boolean
	name: string
	errors: ValidationError[]
	warnings: ValidationWarning[]
}

// ── Naming helpers ────────────────────────────────────────────────────────

/**
 * Ensure class name is PascalCase, no spaces, valid Apex identifier.
 */
function isValidApexClassName(name: string): boolean {
	return /^[A-Z][A-Za-z0-9_]*$/.test(name)
}

/**
 * Check SOQL anti-patterns: queries inside for/while loops.
 * Simple regex-based detection — not a full compiler.
 */
function detectQueryInLoop(body: string): string | null {
	const lines = body.split("\n")
	let braceDepth = 0
	let insideForOrWhile = false

	for (const line of lines) {
		const trimmed = line.trim()

		// Track brace depth
		const openBraces = (trimmed.match(/\{/g) || []).length
		const closeBraces = (trimmed.match(/\}/g) || []).length

		// Detect for/while loop start
		if (/\b(for|while)\s*\(/.test(trimmed)) {
			insideForOrWhile = true
		}

		// Detect SOQL query inside a loop
		if (insideForOrWhile && /\bSELECT\b/i.test(trimmed) && /\[/.test(trimmed)) {
			return `Potential SOQL query inside for/while loop at: "${trimmed.trim().slice(0, 80)}..."`
		}

		braceDepth += openBraces - closeBraces
		if (braceDepth <= 0) {
			insideForOrWhile = false
		}
	}

	return null
}

/**
 * Check for DML inside loops (anti-pattern).
 */
function detectDmlInLoop(body: string): string | null {
	const dmlPattern = /\b(insert|update|delete|upsert|merge)\b/i
	const lines = body.split("\n")
	let braceDepth = 0
	let insideLoop = false

	for (const line of lines) {
		const trimmed = line.trim()
		const openBraces = (trimmed.match(/\{/g) || []).length
		const closeBraces = (trimmed.match(/\}/g) || []).length

		if (/\b(for|while)\s*\(/.test(trimmed)) {
			insideLoop = true
		}

		if (insideLoop && dmlPattern.test(trimmed) && trimmed.length < 120) {
			return `Potential DML inside loop at: "${trimmed.slice(0, 80)}..."`
		}

		braceDepth += openBraces - closeBraces
		if (braceDepth <= 0) {
			insideLoop = false
		}
	}

	return null
}

/**
 * Check for basic missing security: no 'with sharing', no 'WITH USER_MODE'.
 */
function detectMissingSecurity(body: string): string[] {
	const warnings: string[] = []

	if (!/\bwith sharing\b/.test(body) && !/\binherited sharing\b/.test(body)) {
		warnings.push("Class is missing 'with sharing' keyword. Add unless 'without sharing' is explicitly needed.")
	}

	// Only warn if there are SOQL queries without WITH USER_MODE
	if (/\[.*SELECT/i.test(body) && !/\bWITH USER_MODE\b/i.test(body) && !/\bWITH SECURITY_ENFORCED\b/i.test(body)) {
		warnings.push(
			"SOQL queries are missing 'WITH USER_MODE' or 'WITH SECURITY_ENFORCED'. Add for proper FLS enforcement.",
		)
	}

	return warnings
}

// ── Validation ────────────────────────────────────────────────────────────

export function validateApexClassInput(input: ApexClassInput): ApexClassValidation {
	const errors: ValidationError[] = []
	const warnings: ValidationWarning[] = []

	if (!input.name?.trim()) {
		errors.push({ field: "name", message: "Apex class name is required" })
		return { valid: false, name: "", errors, warnings }
	}

	const name = input.name.trim()

	if (!isValidApexClassName(name)) {
		errors.push({
			field: "name",
			message: `"${name}" is not a valid Apex class name. Must be PascalCase (e.g., InvoiceService)`,
		})
	}

	if (name.length > 40) {
		warnings.push({ field: "name", message: `Class name "${name}" exceeds 40 characters (Salesforce limit)` })
	}

	if (!input.body?.trim()) {
		errors.push({ field: "body", message: "Apex class body is required" })
	}

	// SOQL/DML anti-pattern checks
	const queryInLoop = detectQueryInLoop(input.body)
	if (queryInLoop) {
		errors.push({ field: "body", message: queryInLoop })
	}

	const dmlInLoop = detectDmlInLoop(input.body)
	if (dmlInLoop) {
		errors.push({ field: "body", message: dmlInLoop })
	}

	// Security warnings
	if (input.sharing !== "without") {
		const secWarnings = detectMissingSecurity(input.body)
		for (const w of secWarnings) {
			warnings.push({ field: "body", message: w })
		}
	}

	// Balanced braces check
	const openBraces = (input.body.match(/\{/g) || []).length
	const closeBraces = (input.body.match(/\}/g) || []).length
	if (openBraces !== closeBraces) {
		errors.push({
			field: "body",
			message: `Unbalanced braces: ${openBraces} opening vs ${closeBraces} closing`,
		})
	}

	return { valid: errors.length === 0, name, errors, warnings }
}

// ── XML / File Generation ─────────────────────────────────────────────────

export function generateApexClassMetaXml(input: ApexClassInput): string {
	const apiVersion = input.apiVersion || DEFAULT_API_VERSION

	return `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVersion}</apiVersion>
    <status>Active</status>
</ApexClass>`
}

export function generateApexTriggerMetaXml(input: ApexTriggerInput): string {
	const apiVersion = input.apiVersion || DEFAULT_API_VERSION

	return `<?xml version="1.0" encoding="UTF-8"?>
<ApexTrigger xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVersion}</apiVersion>
    <status>Active</status>
</ApexTrigger>`
}

// ── File Path Helpers ─────────────────────────────────────────────────────

export function apexClassFilePath(name: string): string {
	return `force-app/main/default/classes/${name}.cls`
}

export function apexClassMetaFilePath(name: string): string {
	return `force-app/main/default/classes/${name}.cls-meta.xml`
}

export function apexTriggerFilePath(name: string): string {
	return `force-app/main/default/triggers/${name}.trigger`
}

export function apexTriggerMetaFilePath(name: string): string {
	return `force-app/main/default/triggers/${name}.trigger-meta.xml`
}

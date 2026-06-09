/**
 * Apex class/trigger generator — validates naming conventions, detects
 * anti-patterns (SOQL/DML in loops, missing security), and generates
 * correct .cls-meta.xml and .trigger-meta.xml companion files.
 *
 * The LLM provides the Apex CODE body. The generator handles all the
 * XML plumbing and validation that used to live in 4+ instruction files.
 */

import { escapeXml, DEFAULT_API_VERSION } from "./shared"

// ── Input Types ───────────────────────────────────────────────────────────

export interface ApexClassInput {
	name: string // "InvoiceService" → file "InvoiceService.cls"
	body: string // The Apex source code
	sharing?: "with" | "without" | "inherited"
	isTest?: boolean
	apiVersion?: string
}

export interface ApexTriggerInput {
	name: string // "AccountTrigger" → file "AccountTrigger.trigger"
	body: string
	objectName: string // Target SObject, e.g., "Account"
	apiVersion?: string
}

export interface ApexValidation {
	valid: boolean
	name: string
	errors: string[]
	warnings: string[]
}

// ── Naming Validation ─────────────────────────────────────────────────────

function isValidApexClassName(name: string): boolean {
	return /^[A-Z][A-Za-z0-9_]*$/.test(name)
}

// ── Anti-pattern Detection ────────────────────────────────────────────────

function detectSoqlInLoop(body: string): string | null {
	const lines = body.split("\n")
	let depth = 0
	let inLoop = false

	for (const line of lines) {
		const t = line.trim()
		const opens = (t.match(/\{/g) || []).length
		const closes = (t.match(/\}/g) || []).length

		if (/\b(for|while)\s*\(/.test(t)) inLoop = true
		if (inLoop && /\bSELECT\b/i.test(t) && /\[/.test(t)) return `SOQL inside loop at: "${t.slice(0, 80)}..."`
		if (inLoop && /\b(insert|update|delete|upsert|merge)\b\s+\w/i.test(t))
			return `DML inside loop at: "${t.slice(0, 80)}..."`

		depth += opens - closes
		if (depth <= 0) inLoop = false
	}
	return null
}

function detectMissingSecurity(body: string): string[] {
	const w: string[] = []
	if (!/\bwith sharing\b/.test(body) && !/\binherited sharing\b/.test(body))
		w.push("Class is missing 'with sharing' — add unless 'without sharing' is intentional")
	if (/\[.*SELECT/i.test(body) && !/\bWITH USER_MODE\b/i.test(body) && !/\bWITH SECURITY_ENFORCED\b/i.test(body))
		w.push("SOQL missing 'WITH USER_MODE' — required for FLS enforcement")
	return w
}

// ── Validation ────────────────────────────────────────────────────────────

export function validateApexClass(input: ApexClassInput): ApexValidation {
	const errors: string[] = []
	const warnings: string[] = []

	if (!input.name?.trim()) {
		errors.push("Apex class name is required")
		return { valid: false, name: "", errors, warnings }
	}

	const name = input.name.trim()

	if (!isValidApexClassName(name))
		errors.push(`"${name}" is not a valid Apex class name. Must be PascalCase (e.g., InvoiceService)`)

	if (name.length > 40) warnings.push(`Name "${name}" exceeds 40 chars (Salesforce limit)`)

	if (!input.body?.trim()) {
		errors.push("Apex class body is required")
	} else {
		const soqlIssue = detectSoqlInLoop(input.body)
		if (soqlIssue) errors.push(soqlIssue)

		if (input.sharing !== "without") {
			const sec = detectMissingSecurity(input.body)
			warnings.push(...sec)
		}

		const openB = (input.body.match(/\{/g) || []).length
		const closeB = (input.body.match(/\}/g) || []).length
		if (openB !== closeB) errors.push(`Unbalanced braces: ${openB} opening vs ${closeB} closing`)
	}

	return { valid: errors.length === 0, name, errors, warnings }
}

// ── Meta XML Generation ───────────────────────────────────────────────────

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

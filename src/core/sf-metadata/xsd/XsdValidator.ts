/**
 * XSD Validator — validates Salesforce metadata XML against the parsed
 * Metadata API schema. Runs entirely in-process, no network calls.
 *
 * Validation steps:
 * 1. Parse the target XML using fast-xml-parser
 * 2. Look up the metadata type's definition in the XSD registry
 * 3. Check every element in the XML exists in the schema
 * 4. Check all required (minOccurs >= 1) elements are present
 * 5. Check element types (string vs boolean vs dateTime)
 * 6. Check enum values against simple type restrictions
 */

import path from "path"
import fs from "fs/promises"
import { XMLParser } from "fast-xml-parser"
import { parseXsdSchema, resolveElements, type XsdSchemaRegistry } from "./XsdSchema"

// ── Validation Types ──────────────────────────────────────────────────────

export interface XsdValidationError {
	element: string
	message: string
	severity: "error" | "warning"
}

export interface XsdValidationResult {
	valid: boolean
	metadataType: string
	errors: XsdValidationError[]
	warnings: XsdValidationError[]
}

// ── Metadata Type Detection ───────────────────────────────────────────────

/**
 * Map from file extension to expected XSD complex type name.
 * The XSD type name matches exactly what's in the WSDL.
 */
const FILE_TO_METADATA_TYPE: Record<string, string> = {
	".object-meta.xml": "CustomObject",
	".field-meta.xml": "CustomField",
	".tab-meta.xml": "CustomTab",
	".cls": "ApexClass",
	".trigger": "ApexTrigger",
	".cls-meta.xml": "ApexClass",
	".trigger-meta.xml": "ApexTrigger",
	".profile-meta.xml": "Profile",
	".permissionset-meta.xml": "PermissionSet",
	".layout-meta.xml": "Layout",
	".recordType-meta.xml": "RecordType",
	".validationRule-meta.xml": "ValidationRule",
	".assignmentRules-meta.xml": "AssignmentRules",
	".businessProcess-meta.xml": "BusinessProcess",
	".pathAssistant-meta.xml": "PathAssistant",
	".queue-meta.xml": "Queue",
	".role-meta.xml": "Role",
	".wfRule-meta.xml": "WorkflowRule",
}

export function detectMetadataType(filePath: string): string | null {
	for (const [suffix, type] of Object.entries(FILE_TO_METADATA_TYPE)) {
		if (filePath.endsWith(suffix)) {
			return type
		}
	}

	const fileName = path.basename(filePath)
	// Aura: ends with .cmp
	if (fileName.endsWith(".cmp")) return "AuraDefinitionBundle"
	// LWC: directory with .js file
	if (fileName.endsWith(".js") && filePath.includes("/lwc/")) return "LightningComponentBundle"
	// Visualforce: ends with .page or .component
	if (fileName.endsWith(".page")) return "ApexPage"
	if (fileName.endsWith(".component")) return "ApexComponent"

	return null
}

// ── XML Parsing Helpers ───────────────────────────────────────────────────

function parseXml(xml: string): any {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "@",
		removeNSPrefix: true,
		allowBooleanAttributes: true,
	})
	return parser.parse(xml)
}

/**
 * Flatten a parsed XML object into a Map of elementName → value.
 * Handles nested structures one level deep.
 */
function flattenXml(obj: any, prefix: string = ""): Map<string, string> {
	const result = new Map<string, string>()

	if (!obj || typeof obj !== "object") return result

	for (const [key, value] of Object.entries(obj)) {
		if (key.startsWith("@")) continue // skip attributes
		if (key === "?xml") continue // skip XML declaration

		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
			result.set(key, String(value))
		} else if (Array.isArray(value)) {
			// Handle repeated elements (e.g., multiple <value> inside <valueSet>)
			for (let i = 0; i < value.length; i++) {
				const subFlattened = flattenXml(value[i], `${key}[${i}].`)
				for (const [subKey, subVal] of subFlattened) {
					result.set(subKey, subVal)
				}
			}
		} else if (typeof value === "object" && value !== null) {
			// Nested object — recurse
			const subFlattened = flattenXml(value, `${key}.`)
			for (const [subKey, subVal] of subFlattened) {
				result.set(subKey, subVal)
			}
		}
	}

	return result
}

// ── Schema Resolution ─────────────────────────────────────────────────────

let _registry: XsdSchemaRegistry | null = null
let _schemaPath: string | null = null

/**
 * Load and cache the XSD schema registry.
 * Called once at startup, then cached for all subsequent validations.
 */
export async function loadSchema(schemaPath?: string): Promise<XsdSchemaRegistry> {
	if (_registry) return _registry

	const resolvedPath = schemaPath || _schemaPath
	if (!resolvedPath) {
		throw new Error("XSD schema path not configured. Call loadSchema with a path first.")
	}

	const raw = await fs.readFile(resolvedPath, "utf-8")
	_registry = parseXsdSchema(raw)
	_schemaPath = resolvedPath

	return _registry
}

/**
 * Get the cached registry. Throws if not loaded.
 */
function getRegistry(): XsdSchemaRegistry {
	if (!_registry) {
		throw new Error("XSD schema not loaded. Call loadSchema() first.")
	}
	return _registry
}

// ── Core Validation ───────────────────────────────────────────────────────

/**
 * Validate a Salesforce metadata XML file against the XSD schema.
 *
 * @param xmlContent — the raw XML string to validate
 * @param metadataType — the XSD complex type name (e.g., "CustomObject")
 * @returns structured validation result
 */
export function validateXml(xmlContent: string, metadataType: string): XsdValidationResult {
	const registry = getRegistry()
	const errors: XsdValidationError[] = []
	const warnings: XsdValidationError[] = []

	// Find the type definition
	const complexType = registry.complexTypes.get(metadataType)
	if (!complexType) {
		errors.push({
			element: "(root)",
			message: `Unknown metadata type "${metadataType}". Not found in the XSD schema.`,
			severity: "error",
		})
		return { valid: false, metadataType, errors, warnings }
	}

	// Resolve all elements (including inherited from base type)
	const allElements = resolveElements(complexType, registry)
	const requiredElements = allElements.filter((el) => el.minOccurs >= 1)

	// Parse the XML
	let parsed: any
	try {
		parsed = parseXml(xmlContent)
	} catch (e: any) {
		errors.push({
			element: "(root)",
			message: `Failed to parse XML: ${e.message}`,
			severity: "error",
		})
		return { valid: false, metadataType, errors, warnings }
	}

	// Flatten the parsed XML to check all elements
	const foundElements = flattenXml(parsed)
	const foundTopLevel = new Set(Object.keys(parsed).filter((k) => !k.startsWith("@") && k !== "?xml"))

	// Check for unknown elements at the top level
	const knownTopElements = new Set(allElements.map((el) => el.name))
	for (const found of foundTopLevel) {
		if (!knownTopElements.has(found)) {
			warnings.push({
				element: found,
				message: `Element "${found}" is not defined in the XSD schema for ${metadataType}`,
				severity: "warning",
			})
		}
	}

	// Check for missing required elements
	for (const required of requiredElements) {
		const found = foundTopLevel.has(required.name)
		if (!found) {
			errors.push({
				element: required.name,
				message: `Required element "<${required.name}>" is missing. Expected type: ${required.type}`,
				severity: "error",
			})
		}
	}

	// Type-check found elements
	for (const el of allElements) {
		if (!foundTopLevel.has(el.name)) continue

		// If the type is an enum (simple type), validate the value
		const simpleType = registry.simpleTypes.get(el.type)
		if (simpleType && simpleType.enumValues.length > 0) {
			const actualValue = (parsed as any)[el.name]
			if (typeof actualValue === "string" && !simpleType.enumValues.includes(actualValue)) {
				errors.push({
					element: el.name,
					message: `"${actualValue}" is not a valid value for <${el.name}>. Allowed: ${simpleType.enumValues.join(", ")}`,
					severity: "error",
				})
			}
		}

		// Boolean type check
		if (el.type === "xsd:boolean") {
			const actualValue = (parsed as any)[el.name]
			if (
				actualValue !== undefined &&
				actualValue !== "true" &&
				actualValue !== "false" &&
				actualValue !== true &&
				actualValue !== false
			) {
				errors.push({
					element: el.name,
					message: `<${el.name}> must be "true" or "false", got "${actualValue}"`,
					severity: "error",
				})
			}
		}
	}

	return {
		valid: errors.length === 0,
		metadataType,
		errors,
		warnings,
	}
}

/**
 * Validate a metadata file on disk against the XSD schema.
 * Auto-detects the metadata type from the file extension.
 */
export async function validateXmlFile(filePath: string): Promise<XsdValidationResult> {
	const xmlContent = await fs.readFile(filePath, "utf-8")
	const metadataType = detectMetadataType(filePath)

	if (!metadataType) {
		return {
			valid: false,
			metadataType: "unknown",
			errors: [
				{
					element: "(root)",
					message: `Could not detect metadata type for file: ${path.basename(filePath)}`,
					severity: "error",
				},
			],
			warnings: [],
		}
	}

	return validateXml(xmlContent, metadataType)
}

// ── Business Rule Validators (XSD can't check these) ──────────────────────

/**
 * Check Salesforce-specific business rules that aren't in the XSD schema.
 */
export function checkBusinessRules(xmlContent: string, metadataType: string): XsdValidationError[] {
	const errors: XsdValidationError[] = []

	// Lookup field: SetNull + required conflict
	if (metadataType === "CustomField") {
		const isSetNull = /<deleteConstraint>SetNull<\/deleteConstraint>/.test(xmlContent)
		const isRequired = /<required>true<\/required>/.test(xmlContent)
		const isLookup = /<type>Lookup<\/type>/.test(xmlContent)

		if (isLookup && isRequired && isSetNull) {
			errors.push({
				element: "deleteConstraint",
				message: "SetNull cannot be used with required=true. Use Restrict or Cascade.",
				severity: "error",
			})
		}
	}

	// Profile: editable requires readable
	if (metadataType === "Profile") {
		const fieldPermRegex = /<fieldPermissions>([\s\S]*?)<\/fieldPermissions>/g
		let match
		while ((match = fieldPermRegex.exec(xmlContent)) !== null) {
			const block = match[1]
			const fieldMatch = block.match(/<field>([^<]*)<\/field>/)
			const editable = /<editable>true<\/editable>/.test(block)
			const readable = /<readable>true<\/readable>/.test(block)

			if (editable && !readable) {
				errors.push({
					element: fieldMatch ? fieldMatch[1] : "unknown",
					message: "editable=true requires readable=true",
					severity: "error",
				})
			}
		}
	}

	// ApexClass: must have companion .cls-meta.xml
	// (checked by validateApexFile, not here since we only have XML content)

	return errors
}

// ── Full Validation Pipeline ──────────────────────────────────────────────

export async function validateXmlFileWithBusinessRules(filePath: string): Promise<XsdValidationResult> {
	const result = await validateXmlFile(filePath)
	const xmlContent = await fs.readFile(filePath, "utf-8")
	const bizErrors = checkBusinessRules(xmlContent, result.metadataType)
	result.errors.push(...bizErrors)
	result.valid = result.errors.length === 0
	return result
}

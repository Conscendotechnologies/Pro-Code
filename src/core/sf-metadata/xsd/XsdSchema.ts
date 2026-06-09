/**
 * XSD Schema Parser — reads the Salesforce Metadata API WSDL/XSD and builds
 * an in-memory registry of all metadata type definitions.
 *
 * This replaces hand-written Zod schemas with the actual Salesforce schema.
 * No network calls, no CLI — validation runs entirely in-process.
 */

import { XMLParser } from "fast-xml-parser"

// ── Schema Types ──────────────────────────────────────────────────────────

export interface XsdElementDef {
	name: string
	type: string // e.g., "xsd:string", "tns:DeploymentStatus", "xsd:boolean"
	minOccurs: number
	maxOccurs: number | "unbounded"
}

export interface XsdComplexType {
	name: string
	baseType?: string // e.g., "tns:Metadata", "tns:MetadataWithContent"
	elements: XsdElementDef[]
}

export interface XsdSimpleType {
	name: string
	base: string // e.g., "xsd:string"
	enumValues: string[] // if restrictions with enumerations exist
}

export interface XsdSchemaRegistry {
	complexTypes: Map<string, XsdComplexType>
	simpleTypes: Map<string, XsdSimpleType>
}

// ── Parser Implementation ─────────────────────────────────────────────────

/**
 * Parse the Salesforce Metadata API WSDL file and extract all XSD type definitions.
 *
 * @param wsdlContent — raw WSDL/XML string (the MedataXsd.xml content)
 * @returns A registry of all complex/simple types with their element definitions
 */
export function parseXsdSchema(wsdlContent: string): XsdSchemaRegistry {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "@",
		removeNSPrefix: false,
		isArray: (name) => ["xsd:element", "xsd:enumeration", "xsd:complexType", "xsd:simpleType"].includes(name),
	})

	const parsed = parser.parse(wsdlContent)

	const complexTypes = new Map<string, XsdComplexType>()
	const simpleTypes = new Map<string, XsdSimpleType>()

	// Navigate to the schema section
	const definitions = parsed["definitions"]
	if (!definitions) {
		return { complexTypes, simpleTypes }
	}

	const types = definitions["types"]
	if (!types) {
		return { complexTypes, simpleTypes }
	}

	const schema = types["xsd:schema"]
	if (!schema) {
		return { complexTypes, simpleTypes }
	}

	// Parse complex types
	const rawComplexTypes = schema["xsd:complexType"]
	if (Array.isArray(rawComplexTypes)) {
		for (const ct of rawComplexTypes) {
			const parsed = parseComplexType(ct)
			if (parsed) {
				complexTypes.set(parsed.name, parsed)
			}
		}
	}

	// Parse simple types (enums, restrictions)
	const rawSimpleTypes = schema["xsd:simpleType"]
	if (Array.isArray(rawSimpleTypes)) {
		for (const st of rawSimpleTypes) {
			const parsed = parseSimpleType(st)
			if (parsed) {
				simpleTypes.set(parsed.name, parsed)
			}
		}
	}

	return { complexTypes, simpleTypes }
}

function parseComplexType(ct: any): XsdComplexType | null {
	const name = ct["@name"]
	if (!name) return null

	const elements: XsdElementDef[] = []

	// Handle extension with base type
	const complexContent = ct["xsd:complexContent"]
	let baseType: string | undefined

	if (complexContent) {
		const extension = complexContent["xsd:extension"]
		if (extension) {
			baseType = extension["@base"]
			collectElements(extension, elements)
		}
	} else {
		// Direct sequence
		collectElements(ct, elements)
	}

	return { name, baseType, elements }
}

function collectElements(parent: any, elements: XsdElementDef[]) {
	// Direct elements on the parent
	pushElements(parent["xsd:element"], elements)

	// Elements inside a sequence
	const sequence = parent["xsd:sequence"]
	if (sequence) {
		pushElements(sequence["xsd:element"], elements)

		// Nested choices inside sequence
		const choice = sequence["xsd:choice"]
		if (choice) {
			pushElements(choice["xsd:element"], elements)
		}
	}
}

function pushElements(raw: any, elements: XsdElementDef[]) {
	if (!raw) return
	const list = Array.isArray(raw) ? raw : [raw]
	for (const el of list) {
		elements.push({
			name: el["@name"] || "",
			type: el["@type"] || "xsd:string",
			minOccurs: parseOccurs(el["@minOccurs"], 0),
			maxOccurs: parseMaxOccurs(el["@maxOccurs"], "1"),
		})
	}
}

function parseOccurs(val: string | undefined, defaultVal: number): number {
	if (val === undefined) return defaultVal
	return parseInt(val, 10)
}

function parseMaxOccurs(val: string | undefined, defaultVal: string): number | "unbounded" {
	if (val === undefined) return defaultVal as any
	return val === "unbounded" ? "unbounded" : parseInt(val, 10)
}

function parseSimpleType(st: any): XsdSimpleType | null {
	const name = st["@name"]
	if (!name) return null

	let base = "xsd:string"
	let enumValues: string[] = []

	const restriction = st["xsd:restriction"]
	if (restriction) {
		base = restriction["@base"] || "xsd:string"

		const enumerations = restriction["xsd:enumeration"]
		if (Array.isArray(enumerations)) {
			enumValues = enumerations.map((e: any) => e["@value"]).filter(Boolean)
		}
	}

	return { name, base, enumValues }
}

// ── Utilities for Consumers ───────────────────────────────────────────────

/**
 * Resolve a type's full element list by walking inheritance chain.
 * Example: CustomObject extends Metadata → get elements from both.
 */
export function resolveElements(type: XsdComplexType, registry: XsdSchemaRegistry): XsdElementDef[] {
	const elements: XsdElementDef[] = [...type.elements]

	if (type.baseType) {
		const baseType = registry.complexTypes.get(type.baseType)
		if (baseType) {
			elements.push(...resolveElements(baseType, registry))
		}
	}

	return elements
}

/**
 * Find all metadata types in the registry that extend a specific base type.
 * Useful for discovering what types support what features.
 */
export function findTypesExtending(baseType: string, registry: XsdSchemaRegistry): string[] {
	const result: string[] = []
	for (const [name, type] of registry.complexTypes) {
		if (type.baseType === baseType) {
			result.push(name)
		}
	}
	return result
}

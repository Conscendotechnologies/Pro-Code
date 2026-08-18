/**
 * Salesforce Metadata & Symbol Indexer — builds an in-memory, queryable symbol graph
 * for Salesforce SObjects, CustomFields, Apex Classes, Apex Triggers, and Flows.
 *
 * Allows the AI Agent to query symbol locations, field definitions, and Apex signatures
 * in < 200 tokens without loading full multi-thousand line files into LLM context.
 */

import * as path from "path"
import * as fs from "fs/promises"
import { XMLParser } from "fast-xml-parser"

export interface SFieldSymbol {
	name: string
	label?: string
	type: string
	required: boolean
	unique?: boolean
	referenceTo?: string
	picklistValues?: string[]
	filePath: string
}

export interface SObjectSymbol {
	apiName: string
	label?: string
	sharingModel?: string
	fields: Map<string, SFieldSymbol>
	filePath: string
}

export interface ApexMethodSymbol {
	name: string
	signature: string
	returnType: string
	isAuraEnabled: boolean
	isInvocable: boolean
	isTest: boolean
	line: number
}

export interface ApexClassSymbol {
	name: string
	sharing: "with" | "without" | "inherited" | "none"
	isTest: boolean
	methods: ApexMethodSymbol[]
	filePath: string
}

export interface SalesforceIndexRegistry {
	objects: Map<string, SObjectSymbol>
	apexClasses: Map<string, ApexClassSymbol>
	lastUpdated: number
}

export class SalesforceMetadataIndexer {
	private static instances: Map<string, SalesforceMetadataIndexer> = new Map()

	private registry: SalesforceIndexRegistry = {
		objects: new Map(),
		apexClasses: new Map(),
		lastUpdated: Date.now(),
	}

	private xmlParser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "@",
		removeNSPrefix: true,
	})

	private constructor() {}

	public static getInstance(workspaceRoot = "default"): SalesforceMetadataIndexer {
		const key = workspaceRoot.replace(/\\/g, "/").toLowerCase()
		if (!SalesforceMetadataIndexer.instances.has(key)) {
			SalesforceMetadataIndexer.instances.set(key, new SalesforceMetadataIndexer())
		}
		return SalesforceMetadataIndexer.instances.get(key)!
	}

	public getRegistry(): SalesforceIndexRegistry {
		return this.registry
	}

	public removeFile(filePath: string): void {
		const normalized = filePath.replace(/\\/g, "/").toLowerCase()

		for (const [key, obj] of this.registry.objects.entries()) {
			if (obj.filePath.replace(/\\/g, "/").toLowerCase() === normalized) {
				this.registry.objects.delete(key)
			}
		}

		for (const [key, cls] of this.registry.apexClasses.entries()) {
			if (cls.filePath.replace(/\\/g, "/").toLowerCase() === normalized) {
				this.registry.apexClasses.delete(key)
			}
		}
	}

	/**
	 * Index a single Salesforce file on disk.
	 */
	public async indexFile(filePath: string, content?: string): Promise<void> {
		const ext = path.extname(filePath).toLowerCase()
		const fileName = path.basename(filePath)

		if (fileName.endsWith(".object-meta.xml")) {
			await this.indexObjectMeta(filePath, content)
		} else if (fileName.endsWith(".field-meta.xml")) {
			await this.indexFieldMeta(filePath, content)
		} else if (ext === ".cls" || ext === ".trigger") {
			await this.indexApexClass(filePath, content, ext === ".trigger")
		} else if (fileName.endsWith(".flow-meta.xml")) {
			await this.indexFlowMeta(filePath, content)
		}
	}

	/**
	 * Parse and index CustomObject XML.
	 */
	private async indexObjectMeta(filePath: string, content?: string): Promise<void> {
		try {
			const xml = content || (await fs.readFile(filePath, "utf-8"))
			const parsed = this.xmlParser.parse(xml)
			const objRoot = parsed.CustomObject
			if (!objRoot) return

			const apiName = path.basename(filePath, ".object-meta.xml")
			const existingObj = this.registry.objects.get(apiName)
			const fieldsMap = existingObj ? existingObj.fields : new Map<string, SFieldSymbol>()

			const objSymbol: SObjectSymbol = {
				apiName,
				label: objRoot.label || apiName,
				sharingModel: objRoot.sharingModel || "ReadWrite",
				fields: fieldsMap,
				filePath,
			}

			// Parse inline fields if present
			if (objRoot.fields) {
				const fieldList = Array.isArray(objRoot.fields) ? objRoot.fields : [objRoot.fields]
				for (const f of fieldList) {
					if (!f.fullName) continue
					objSymbol.fields.set(f.fullName, {
						name: f.fullName,
						label: f.label,
						type: f.type || "Unknown",
						required: f.required === "true" || f.required === true,
						unique: f.unique === "true" || f.unique === true,
						referenceTo: f.referenceTo,
						filePath,
					})
				}
			}

			this.registry.objects.set(apiName, objSymbol)
			this.registry.lastUpdated = Date.now()
		} catch (err) {
			console.error(`[SalesforceMetadataIndexer] Error indexing object ${filePath}:`, err)
		}
	}

	/**
	 * Parse and index CustomField XML.
	 */
	private async indexFieldMeta(filePath: string, content?: string): Promise<void> {
		try {
			const xml = content || (await fs.readFile(filePath, "utf-8"))
			const parsed = this.xmlParser.parse(xml)
			const fieldRoot = parsed.CustomField
			if (!fieldRoot || !fieldRoot.fullName) return

			const parts = filePath.replace(/\\/g, "/").split("/")
			const objIdx = parts.lastIndexOf("objects")
			const objName = objIdx !== -1 && parts[objIdx + 1] ? parts[objIdx + 1] : "Unknown"

			let parentObj = this.registry.objects.get(objName)
			if (!parentObj) {
				parentObj = {
					apiName: objName,
					label: objName,
					sharingModel: "ReadWrite",
					fields: new Map(),
					filePath: "(Implicit)",
				}
				this.registry.objects.set(objName, parentObj)
			}

			const fieldSymbol: SFieldSymbol = {
				name: fieldRoot.fullName,
				label: fieldRoot.label,
				type: fieldRoot.type || "Unknown",
				required: fieldRoot.required === "true" || fieldRoot.required === true,
				unique: fieldRoot.unique === "true" || fieldRoot.unique === true,
				referenceTo: fieldRoot.referenceTo,
				filePath,
			}

			if (fieldRoot.valueSet && fieldRoot.valueSet.valueSetDefinition) {
				const values = fieldRoot.valueSet.valueSetDefinition.value
				if (values) {
					const valList = Array.isArray(values) ? values : [values]
					fieldSymbol.picklistValues = valList.map((v: any) => String(v.fullName || v.label || v))
				}
			}

			parentObj.fields.set(fieldRoot.fullName, fieldSymbol)
			this.registry.lastUpdated = Date.now()
		} catch (err) {
			console.error(`[SalesforceMetadataIndexer] Error indexing field ${filePath}:`, err)
		}
	}

	/**
	 * Parse and index Flow XML.
	 */
	private async indexFlowMeta(filePath: string, content?: string): Promise<void> {
		try {
			const xml = content || (await fs.readFile(filePath, "utf-8"))
			const parsed = this.xmlParser.parse(xml)
			const flowRoot = parsed.Flow
			if (!flowRoot) return

			const flowName = path.basename(filePath, ".flow-meta.xml")
			this.registry.apexClasses.set(`Flow:${flowName}`, {
				name: flowName,
				sharing: "inherited",
				isTest: false,
				methods: [],
				filePath,
			})
			this.registry.lastUpdated = Date.now()
		} catch (err) {
			// Silent fallback
		}
	}

	/**
	 * Parse Apex class / trigger method signatures.
	 */
	private async indexApexClass(filePath: string, content?: string, isTrigger = false): Promise<void> {
		try {
			const code = content || (await fs.readFile(filePath, "utf-8"))
			const className = path.basename(filePath, isTrigger ? ".trigger" : ".cls")

			let sharing: "with" | "without" | "inherited" | "none" = "none"
			if (/with\s+sharing\s+class/i.test(code)) sharing = "with"
			else if (/without\s+sharing\s+class/i.test(code)) sharing = "without"
			else if (/inherited\s+sharing\s+class/i.test(code)) sharing = "inherited"

			const isTest = /@IsTest\b/i.test(code)
			const methods: ApexMethodSymbol[] = []

			const lines = code.split("\n")
			let currentAuraEnabled = false
			let currentInvocable = false
			let currentIsTest = false

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i].trim()

				if (/@AuraEnabled\b/i.test(line)) {
					currentAuraEnabled = true
					continue
				}
				if (/@InvocableMethod\b/i.test(line)) {
					currentInvocable = true
					continue
				}
				if (/@IsTest\b/i.test(line)) {
					currentIsTest = true
					continue
				}

				// Enhanced Apex method signature matching supporting optional visibility modifiers, static, virtual, override, abstract, and generic return types
				const methodMatch = line.match(
					/^(?:(?:public|global|private|protected|static|virtual|override|abstract|transient)\s+)*([\w<>,_\s]+?)\s+([A-Za-z0-9_]+)\s*\(([\s\S]*?)\)/,
				)

				if (methodMatch) {
					const [fullMatch, retType, methodName, params] = methodMatch
					const lowerRet = retType.trim().toLowerCase()
					const lowerName = methodName.trim().toLowerCase()
					const retTokens = lowerRet.split(/\s+/)
					const badRet = [
						"return",
						"new",
						"throw",
						"insert",
						"update",
						"delete",
						"upsert",
						"undelete",
						"else",
						"try",
						"catch",
						"finally",
					]

					if (
						methodName !== className &&
						!retTokens.some((t) => badRet.includes(t)) &&
						!["if", "for", "while", "switch", "system"].includes(lowerName)
					) {
						methods.push({
							name: methodName,
							signature: `${retType.trim()} ${methodName}(${params.trim()})`,
							returnType: retType.trim(),
							isAuraEnabled: currentAuraEnabled,
							isInvocable: currentInvocable,
							isTest: currentIsTest || isTest,
							line: i + 1,
						})
					}
					currentAuraEnabled = false
					currentInvocable = false
					currentIsTest = false
				} else if (
					line.length > 0 &&
					!line.startsWith("//") &&
					!line.startsWith("/*") &&
					!line.startsWith("*")
				) {
					// Clear annotation flags if non-method code statement encountered
					currentAuraEnabled = false
					currentInvocable = false
					currentIsTest = false
				}
			}

			this.registry.apexClasses.set(className, {
				name: className,
				sharing,
				isTest,
				methods,
				filePath,
			})
			this.registry.lastUpdated = Date.now()
		} catch (err) {
			console.error(`[SalesforceMetadataIndexer] Error indexing Apex class ${filePath}:`, err)
		}
	}

	/**
	 * Search for SObject schema definitions in the registry (capped at maxResults).
	 */
	public searchSchema(query: string, maxResults = 50): string {
		const results: string[] = []
		const q = query.toLowerCase()
		let count = 0

		for (const [objName, obj] of this.registry.objects) {
			if (count >= maxResults) break

			if (objName.toLowerCase().includes(q) || (obj.label && obj.label.toLowerCase().includes(q))) {
				results.push(`📦 SObject: ${objName} (${obj.label || ""}) [${obj.fields.size} fields]`)
				for (const [fieldName, field] of obj.fields) {
					results.push(
						`   - ${field.name} (${field.type}) ${field.required ? "[Required]" : ""} ${field.referenceTo ? `-> ${field.referenceTo}` : ""}`,
					)
				}
				count++
			} else {
				// Search matching fields inside the object
				const matchingFields: SFieldSymbol[] = []
				for (const [fieldName, field] of obj.fields) {
					if (fieldName.toLowerCase().includes(q) || (field.label && field.label.toLowerCase().includes(q))) {
						matchingFields.push(field)
					}
				}
				if (matchingFields.length > 0) {
					results.push(`📦 SObject: ${objName} (Matched ${matchingFields.length} field(s))`)
					for (const field of matchingFields) {
						results.push(
							`   - ${field.name} (${field.type}) ${field.required ? "[Required]" : ""} ${field.referenceTo ? `-> ${field.referenceTo}` : ""}`,
						)
					}
					count++
				}
			}
		}

		return results.length > 0
			? results.join("\n")
			: `No Salesforce SObject or Field matching "${query}" found in index.`
	}

	/**
	 * Search for Apex class method signatures in the registry (capped at maxResults).
	 */
	public searchApexSymbols(query: string, maxResults = 50): string {
		const results: string[] = []
		const q = query.toLowerCase()
		let count = 0

		for (const [clsName, cls] of this.registry.apexClasses) {
			if (count >= maxResults) break

			if (clsName.toLowerCase().includes(q)) {
				results.push(`⚡ ApexClass: ${cls.name} (${cls.sharing} sharing)`)
				for (const m of cls.methods) {
					results.push(`   L${m.line}: ${m.signature} ${m.isAuraEnabled ? "[@AuraEnabled]" : ""}`)
				}
				count++
			} else {
				const matchingMethods = cls.methods.filter((m) => m.name.toLowerCase().includes(q))
				if (matchingMethods.length > 0) {
					results.push(`⚡ ApexClass: ${cls.name} (Matched ${matchingMethods.length} method(s))`)
					for (const m of matchingMethods) {
						results.push(`   L${m.line}: ${m.signature} ${m.isAuraEnabled ? "[@AuraEnabled]" : ""}`)
					}
					count++
				}
			}
		}

		return results.length > 0 ? results.join("\n") : `No Apex class or method matching "${query}" found in index.`
	}

	public async exportTreeIndex(targetDir?: string): Promise<string> {
		const lines: string[] = ["# Salesforce Metadata Symbol Index", ""]

		lines.push("## Objects & Fields")
		for (const [objName, obj] of this.registry.objects) {
			lines.push(`- **${objName}** (${obj.label || ""}) - ${obj.fields.size} fields`)
			for (const [fieldName, f] of obj.fields) {
				lines.push(`  - \`${f.name}\` (${f.type})`)
			}
		}

		lines.push("")
		lines.push("## Apex Classes & Methods")
		for (const [clsName, cls] of this.registry.apexClasses) {
			lines.push(`- **${cls.name}** (${cls.sharing} sharing)`)
			for (const m of cls.methods) {
				lines.push(`  - \`${m.signature}\` (L${m.line})`)
			}
		}

		const output = lines.join("\n")

		if (targetDir) {
			try {
				const siidDir = path.join(targetDir, ".siid-code")
				await fs.mkdir(siidDir, { recursive: true })
				await fs.writeFile(path.join(siidDir, "SALESFORCE_INDEX.md"), output, "utf-8")
			} catch (e) {
				// Fallback
			}
		}

		return output
	}
}

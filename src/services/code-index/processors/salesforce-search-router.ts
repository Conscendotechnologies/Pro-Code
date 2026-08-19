/**
 * SalesforceSearchRouter — Unified intent-based search router across Salesforce Index Engines.
 *
 * Classifies search query intent (Symbol API match, Vector TF-IDF, Graph Blast Radius, or Transaction Timelines),
 * ranks cross-engine search hits into addressable pointers (filePath:line), and inlines code snippets for top hits.
 */

import * as fs from "fs/promises"
import { SalesforceMetadataIndexer, SearchHit } from "./salesforce-indexer"
import { SalesforceGraphEngine, DmlEvent } from "./salesforce-graph"
import { SalesforceVectorIndexer } from "./salesforce-vector-indexer"
import { getTransactionTimeline } from "./salesforce-transaction"
import * as fs from "fs/promises"
import { SalesforceMetadataIndexer, SearchHit } from "./salesforce-indexer"
import { SalesforceGraphEngine, DmlEvent } from "./salesforce-graph"
import { SalesforceVectorIndexer } from "./salesforce-vector-indexer"
import { getTransactionTimeline } from "./salesforce-transaction"

export interface SearchOptions {
	category?: string
	includeSnippets?: boolean
	maxResults?: number
	isIndexing?: boolean
}

export class SalesforceSearchRouter {
	private static instances: Map<string, SalesforceSearchRouter> = new Map()

	private constructor(private workspaceRoot: string) {}

	public static getInstance(workspaceRoot = "default"): SalesforceSearchRouter {
		const key = workspaceRoot.replace(/\\/g, "/").toLowerCase()
		if (!SalesforceSearchRouter.instances.has(key)) {
			SalesforceSearchRouter.instances.set(key, new SalesforceSearchRouter(workspaceRoot))
		}
		return SalesforceSearchRouter.instances.get(key)!
	}

	public async search(query: string, options: SearchOptions = {}): Promise<string> {
		const { includeSnippets = true, maxResults = 10, isIndexing = false } = options
		const categoryInput = (options.category || "ALL").toUpperCase()
		const trimmedQuery = query.trim()
		if (!trimmedQuery) return "Please provide a non-empty search query."

		const symbolIndexer = SalesforceMetadataIndexer.getInstance(this.workspaceRoot)
		const graphEngine = SalesforceGraphEngine.getInstance(this.workspaceRoot)
		const vectorIndexer = SalesforceVectorIndexer.getInstance(this.workspaceRoot)

		const headerLines: string[] = []

		// 1. Check if indexer is currently building
		if (isIndexing) {
			headerLines.push(
				"[Notice: Salesforce Index is actively building in the background. Results below represent partial index state.]\n",
			)
		}

		const hits: SearchHit[] = []
		const qLower = trimmedQuery.toLowerCase()

		// 2. Intent Classification
		const isTransactionIntent =
			/what\s+runs|order\s+of\s+execution|before\s+insert|after\s+insert|before\s+update|after\s+update|before\s+delete|after\s+delete|trigger\s+execution|lifecycle/i.test(
				trimmedQuery,
			)

		const isGraphIntent =
			/\bwhat\s+breaks\b|\bdepends\s+on\b|\bblast\s+radius\b|\bimpact\s+of\b|\bused\s+by\b|\bwho\s+calls\b|\bcalls\s+into\b/i.test(
				trimmedQuery,
			)

		// 3. Routing Ladder
		if (categoryInput === "OBJECT" || categoryInput === "SOBJECT" || categoryInput === "FIELD") {
			hits.push(...symbolIndexer.getSchemaSearchHits(trimmedQuery, maxResults))
		} else if (categoryInput === "APEX" || categoryInput === "CLASS" || categoryInput === "METHOD") {
			hits.push(...symbolIndexer.getApexSymbolHits(trimmedQuery, maxResults))
		} else if (isTransactionIntent || categoryInput === "TRANSACTION") {
			const targetObj = this.resolveTargetObject(trimmedQuery, symbolIndexer, graphEngine)
			if (targetObj) {
				const evtMatch =
					(["insert", "update", "delete"] as DmlEvent[]).find((e) => qLower.includes(e)) || "update"
				const timeline = getTransactionTimeline(graphEngine, targetObj, evtMatch)

				for (const entry of timeline.entries) {
					hits.push({
						kind: entry.node.type === "APEX_TRIGGER" ? "AUTOMATION" : "APEX_CLASS",
						name: entry.node.name,
						qualifiedName: `${targetObj} [${evtMatch.toUpperCase()}] Step ${entry.step}: ${entry.node.name}`,
						filePath: entry.node.filePath,
						detail: entry.stageLabel,
						score: 90,
					})
				}
			}
		}

		if (hits.length === 0 && (isGraphIntent || categoryInput === "GRAPH")) {
			// Blast radius graph routing
			const nodes = graphEngine.findNodes(trimmedQuery)
			for (const n of nodes) {
				const blast = graphEngine.getBlastRadius(n.id)
				hits.push({
					kind: n.type === "APEX_CLASS" ? "APEX_CLASS" : n.type === "APEX_TRIGGER" ? "AUTOMATION" : "OBJECT",
					name: n.name,
					qualifiedName: n.name,
					filePath: n.filePath,
					detail: blast.summary,
					score: 85,
				})
			}
		}

		// Fallthrough: If intent search yielded no hits, execute general symbol & vector search
		if (hits.length === 0) {
			const schemaHits = symbolIndexer.getSchemaSearchHits(trimmedQuery, maxResults)
			const apexHits = symbolIndexer.getApexSymbolHits(trimmedQuery, maxResults)
			hits.push(...schemaHits, ...apexHits)

			if (hits.length < maxResults) {
				const scoredVecs = vectorIndexer.searchVectorScored(trimmedQuery, maxResults - hits.length)
				for (const s of scoredVecs) {
					if (!hits.some((h) => h.filePath === s.doc.filePath)) {
						hits.push({
							kind: s.doc.type === "APEX" ? "APEX_CLASS" : s.doc.type === "FLOW" ? "FLOW" : "OBJECT",
							name: s.doc.title,
							qualifiedName: s.doc.title,
							filePath: s.doc.filePath,
							detail: `TF-IDF Vector Relevance Score: ${Math.round(s.score * 100)}%`,
							score: Math.round(s.score * 50),
						})
					}
				}
			}
		}

		if (hits.length === 0) {
			return `${headerLines.join("")}No Salesforce symbols, metadata, or execution timelines matching "${query}" found in index.`
		}

		// Sort hits by score
		hits.sort((a, b) => b.score - a.score)
		const topHits = hits.slice(0, maxResults)

		// 4. Format Addressable Pointers with optional snippet inlining for top <= 3 hits
		const resultLines: string[] = [...headerLines]

		for (let i = 0; i < topHits.length; i++) {
			if (resultLines.length >= 140) break // Hard total output line cap
			const hit = topHits[i]
			const lineStr = hit.line ? `:${hit.line}` : ""
			resultLines.push(`[${hit.kind}] ${hit.qualifiedName}`)
			resultLines.push(`  ${hit.filePath}${lineStr}`)
			resultLines.push(`  detail: ${hit.detail}`)

			// Inline snippet for top 3 hits if requested
			if (includeSnippets && i < 3 && hit.filePath) {
				const snippet = await this.readSnippet(hit.filePath, hit.line || 1)
				if (snippet) {
					resultLines.push("  ```")
					resultLines.push(
						snippet
							.split("\n")
							.map((l) => `  ${l}`)
							.join("\n"),
					)
					resultLines.push("  ```")
				}
			}

			resultLines.push("")
		}

		return resultLines.join("\n").trim()
	}

	private resolveTargetObject(
		query: string,
		symbolIndexer: SalesforceMetadataIndexer,
		graphEngine: SalesforceGraphEngine,
	): string | null {
		const rawTokens = query
			.split(/\s+/)
			.map((t) => t.replace(/[^a-zA-Z0-9_]/g, ""))
			.filter(Boolean)

		// 1. Custom SObject suffix check (__c, __e, __mdt, __x, __b)
		const customMatch = rawTokens.find((t) => /__(c|e|mdt|x|b)$/i.test(t))
		if (customMatch) return customMatch

		// 2. Known SObject names in registry or graph nodes
		const knownObjects = new Set<string>()
		for (const objKey of symbolIndexer.getRegistry().objects.keys()) {
			knownObjects.add(objKey.toLowerCase())
		}
		for (const node of graphEngine.getNodes().values()) {
			if (node.txn?.objectApiName) {
				knownObjects.add(node.txn.objectApiName.toLowerCase())
			}
		}

		const knownMatch = rawTokens.find((t) => knownObjects.has(t.toLowerCase()))
		if (knownMatch) return knownMatch

		// 3. PascalCase token (excluding common question/control words)
		const stopWords = new Set([
			"what",
			"when",
			"order",
			"execution",
			"trigger",
			"before",
			"after",
			"insert",
			"update",
			"delete",
			"upsert",
			"which",
			"how",
			"show",
			"for",
			"on",
			"in",
			"is",
		])
		const pascalMatch = rawTokens.find((t) => /^[A-Z][a-zA-Z0-9_]+$/.test(t) && !stopWords.has(t.toLowerCase()))
		if (pascalMatch) return pascalMatch

		return null
	}

	private async readSnippet(filePath: string, targetLine: number, windowSize = 15): Promise<string | null> {
		try {
			const content = await fs.readFile(filePath, "utf-8")
			const lines = content.split("\n")
			const start = Math.max(0, targetLine - 1 - Math.floor(windowSize / 2))
			const end = Math.min(lines.length, start + windowSize)

			return lines
				.slice(start, end)
				.map((lineText, idx) => `${start + idx + 1}: ${lineText}`)
				.join("\n")
		} catch (e) {
			return null
		}
	}
}

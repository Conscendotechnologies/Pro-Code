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
import { SalesforceStandaloneIndexer } from "./salesforce-standalone-indexer"

export interface SearchOptions {
	category?: string
	includeSnippets?: boolean
	maxResults?: number
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
		const { category = "all", includeSnippets = true, maxResults = 10 } = options
		const trimmedQuery = query.trim()
		if (!trimmedQuery) return "Please provide a non-empty search query."

		const symbolIndexer = SalesforceMetadataIndexer.getInstance(this.workspaceRoot)
		const graphEngine = SalesforceGraphEngine.getInstance(this.workspaceRoot)
		const vectorIndexer = SalesforceVectorIndexer.getInstance(this.workspaceRoot)
		const standaloneIndexer = SalesforceStandaloneIndexer.getInstance(this.workspaceRoot)

		const headerLines: string[] = []

		// 1. Check if indexer is currently building
		if (standaloneIndexer.getIsIndexing()) {
			headerLines.push(
				"[Notice: Salesforce Index is actively building in the background. Results below represent partial index state.]\n",
			)
		}

		const hits: SearchHit[] = []
		const qLower = trimmedQuery.toLowerCase()

		// 2. Classify intent
		const isTransactionIntent =
			/what\s+runs|order\s+of\s+execution|before\s+insert|after\s+insert|before\s+update|after\s+update|before\s+delete|after\s+delete|trigger\s+execution|lifecycle/i.test(
				trimmedQuery,
			)

		const isGraphIntent = /what\s+breaks|depends\s+on|blast\s+radius|impact\s+of|used\s+by|calls/i.test(
			trimmedQuery,
		)

		// 3. Route according to category & intent ladder
		if (category === "sobject" || category === "FIELD" || category === "OBJECT") {
			hits.push(...symbolIndexer.getSchemaSearchHits(trimmedQuery, maxResults))
		} else if (category === "apex" || category === "APEX_CLASS" || category === "APEX_METHOD") {
			hits.push(...symbolIndexer.getApexSymbolHits(trimmedQuery, maxResults))
		} else if (isTransactionIntent) {
			// Transaction timeline routing
			const targetObj = trimmedQuery.split(/\s+/).find((w) => w.length > 2) || "Account"
			const evtMatch = (["insert", "update", "delete"] as DmlEvent[]).find((e) => qLower.includes(e)) || "update"
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
		} else if (isGraphIntent) {
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
		} else {
			// General ladder: Symbol registry -> Graph -> Vector TF-IDF
			const schemaHits = symbolIndexer.getSchemaSearchHits(trimmedQuery, maxResults)
			const apexHits = symbolIndexer.getApexSymbolHits(trimmedQuery, maxResults)
			hits.push(...schemaHits, ...apexHits)

			// If symbol hits are sparse, supplement with TF-IDF Vector Search
			if (hits.length < maxResults) {
				const scoredVecs = vectorIndexer.searchVectorScored(trimmedQuery, maxResults - hits.length)
				for (const s of scoredVecs) {
					// Avoid duplicates
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

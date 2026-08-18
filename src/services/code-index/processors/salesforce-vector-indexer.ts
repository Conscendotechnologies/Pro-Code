/**
 * SalesforceVectorIndexer — Lightweight local in-process term frequency-idf vector engine.
 * Computes AST token term frequency and query-time corpus IDF embeddings for SObjects, Apex methods, Fields, and Flows,
 * enabling 100% offline semantic vector search without external vector databases or API keys.
 */

export interface VectorDocument {
	id: string
	title: string
	content: string
	type: "OBJECT" | "FIELD" | "APEX" | "FLOW"
	termFreq: Map<string, number>
	filePath: string
}

export class SalesforceVectorIndexer {
	private static instances: Map<string, SalesforceVectorIndexer> = new Map()
	private documents: Map<string, VectorDocument> = new Map()
	private dfMap: Map<string, number> = new Map()
	private totalDocs = 0

	private constructor() {}

	public static getInstance(workspaceRoot = "default"): SalesforceVectorIndexer {
		const key = workspaceRoot.replace(/\\/g, "/").toLowerCase()
		if (!SalesforceVectorIndexer.instances.has(key)) {
			SalesforceVectorIndexer.instances.set(key, new SalesforceVectorIndexer())
		}
		return SalesforceVectorIndexer.instances.get(key)!
	}

	public clear(): void {
		this.documents.clear()
		this.dfMap.clear()
		this.totalDocs = 0
	}

	public removeFile(filePath: string): void {
		const normalized = filePath.replace(/\\/g, "/").toLowerCase()
		const toRemove: string[] = []
		for (const [id, doc] of this.documents.entries()) {
			if (doc.filePath.replace(/\\/g, "/").toLowerCase() === normalized) {
				toRemove.push(id)
			}
		}
		for (const id of toRemove) {
			const doc = this.documents.get(id)
			if (doc) {
				for (const token of doc.termFreq.keys()) {
					const count = this.dfMap.get(token) || 1
					if (count <= 1) this.dfMap.delete(token)
					else this.dfMap.set(token, count - 1)
				}
				this.documents.delete(id)
				this.totalDocs = Math.max(0, this.totalDocs - 1)
			}
		}
	}

	public indexDocument(
		id: string,
		title: string,
		content: string,
		type: "OBJECT" | "FIELD" | "APEX" | "FLOW",
		filePath = "",
	): void {
		const tokens = this.tokenize(`${title} ${content}`)
		const termFreq = new Map<string, number>()

		for (const token of tokens) {
			termFreq.set(token, (termFreq.get(token) || 0) + 1)
		}

		if (!this.documents.has(id)) {
			this.totalDocs++
			for (const token of termFreq.keys()) {
				this.dfMap.set(token, (this.dfMap.get(token) || 0) + 1)
			}
		}

		this.documents.set(id, { id, title, content, type, termFreq, filePath })
	}

	/**
	 * Search document corpus using query-time IDF normalization
	 */
	public searchVector(query: string, limit = 10): VectorDocument[] {
		if (this.totalDocs === 0) return []
		const queryTokens = this.tokenize(query)
		const queryVector = new Map<string, number>()

		for (const token of queryTokens) {
			const df = this.dfMap.get(token) || 0
			const idf = Math.log((1 + this.totalDocs) / (1 + df)) + 1
			queryVector.set(token, idf)
		}

		const scored: { doc: VectorDocument; score: number }[] = []

		for (const doc of this.documents.values()) {
			const docVector = new Map<string, number>()
			for (const [token, tf] of doc.termFreq.entries()) {
				const df = this.dfMap.get(token) || 1
				const idf = Math.log((1 + this.totalDocs) / (1 + df)) + 1
				docVector.set(token, tf * idf)
			}

			const score = this.cosineSimilarity(queryVector, docVector)
			if (score > 0.02) {
				scored.push({ doc, score })
			}
		}

		scored.sort((a, b) => b.score - a.score)
		return scored.slice(0, limit).map((s) => s.doc)
	}

	private cosineSimilarity(v1: Map<string, number>, v2: Map<string, number>): number {
		let dotProduct = 0
		let norm1 = 0
		let norm2 = 0

		for (const [token, weight1] of v1.entries()) {
			norm1 += weight1 * weight1
			const weight2 = v2.get(token)
			if (weight2) {
				dotProduct += weight1 * weight2
			}
		}

		for (const weight2 of v2.values()) {
			norm2 += weight2 * weight2
		}

		if (norm1 === 0 || norm2 === 0) return 0
		return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
	}

	private tokenize(text: string): string[] {
		return text
			.toLowerCase()
			.replace(/[^a-z0-9_]/g, " ")
			.split(/\s+/)
			.filter((t) => t.length > 1)
	}
}

import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import { SalesforceMetadataIndexer } from "./salesforce-indexer"
import { SalesforceGraphEngine } from "./salesforce-graph"
import { SalesforceVectorIndexer } from "./salesforce-vector-indexer"
import { exportTransactionIndex } from "./salesforce-transaction"

export const SF_INDEXED_SUFFIXES = [
	".cls",
	".trigger",
	".cmp",
	".page",
	".object-meta.xml",
	".field-meta.xml",
	".flow-meta.xml",
	".validationRule-meta.xml",
	".workflow-meta.xml",
	".duplicateRule-meta.xml",
	".assignmentRules-meta.xml",
	".autoResponseRules-meta.xml",
	".escalationRules-meta.xml",
	".sharingRules-meta.xml",
	".entitlementProcess-meta.xml",
] as const

export interface SalesforceIndexingProgress {
	phase: "DISCOVERING" | "RETRIEVING_METADATA" | "BUILDING_TRANSACTIONS" | "BUILDING_GRAPH" | "COMPLETE" | "ERROR"
	currentStep: number
	totalSteps: number
	currentFile?: string
	docType?: "APEX" | "TRIGGER" | "OBJECT" | "FLOW" | "VALIDATION" | "OTHER"
	itemsProcessed: number
	totalItems: number
	nodeCount?: number
	edgeCount?: number
	timelineCount?: number
	durationMs?: number
	error?: string
}

/**
 * Standalone Local Salesforce Codebase Indexer & File Watcher.
 * Operates 100% offline with zero reliance on CodeIndexManager, Qdrant, or external vector APIs.
 */
export class SalesforceStandaloneIndexer implements vscode.Disposable {
	private static instances: Map<string, SalesforceStandaloneIndexer> = new Map()

	private workspaceRoot: string
	private indexer: SalesforceMetadataIndexer
	private graphEngine: SalesforceGraphEngine
	private vectorIndexer: SalesforceVectorIndexer
	private isIndexing = false
	private watchers: vscode.FileSystemWatcher[] = []
	private debounceTimer: NodeJS.Timeout | null = null
	private progressListeners: ((progress: SalesforceIndexingProgress) => void)[] = []

	private static debugMode = process.env.SIID_SALESFORCE_DEBUG === "true"

	private constructor(workspaceRoot: string) {
		this.workspaceRoot = workspaceRoot
		this.indexer = SalesforceMetadataIndexer.getInstance(workspaceRoot)
		this.graphEngine = SalesforceGraphEngine.getInstance(workspaceRoot)
		this.vectorIndexer = SalesforceVectorIndexer.getInstance(workspaceRoot)
	}

	public onProgress(listener: (progress: SalesforceIndexingProgress) => void): vscode.Disposable {
		this.progressListeners.push(listener)
		return {
			dispose: () => {
				this.progressListeners = this.progressListeners.filter((l) => l !== listener)
			},
		}
	}

	private emitProgress(progress: SalesforceIndexingProgress): void {
		for (const listener of this.progressListeners) {
			try {
				listener(progress)
			} catch (e) {
				// Prevent listener crash
			}
		}
	}

	public static setDebugMode(enabled: boolean): void {
		this.debugMode = enabled
	}

	public static isDebugMode(): boolean {
		return this.debugMode || process.env.SIID_SALESFORCE_DEBUG === "true"
	}

	public static getInstance(workspaceRoot: string): SalesforceStandaloneIndexer {
		const key = workspaceRoot.replace(/\\/g, "/").toLowerCase()
		if (!this.instances.has(key)) {
			this.instances.set(key, new SalesforceStandaloneIndexer(workspaceRoot))
		}
		return this.instances.get(key)!
	}

	/**
	 * Scans the workspace and indexes all Salesforce files asynchronously (non-blocking)
	 */
	public async initialize(): Promise<void> {
		if (this.isIndexing) return
		this.isIndexing = true
		const startTime = Date.now()
		try {
			if (SalesforceStandaloneIndexer.isDebugMode()) {
				console.log(`[SalesforceDebug] Initializing Salesforce Indexer for workspace: ${this.workspaceRoot}`)
			}
			await this.scanWorkspace()
			this.setupFileWatcher()

			// Auto-export transaction index on initialize
			const { exportTransactionIndex } = await import("./salesforce-transaction")
			await exportTransactionIndex(this.graphEngine, this.workspaceRoot)

			if (SalesforceStandaloneIndexer.isDebugMode()) {
				const duration = Date.now() - startTime
				const nodeCount = this.graphEngine.getNodes().size
				const edgeCount = this.graphEngine.getEdges().length
				console.log(
					`[SalesforceDebug] Indexing complete in ${duration}ms. Nodes: ${nodeCount}, Edges: ${edgeCount}. Exported .siid-code/SALESFORCE_TRANSACTIONS.md`,
				)
			}
		} catch (error) {
			console.error(
				`[SalesforceStandaloneIndexer] Failed to initialize indexer for ${this.workspaceRoot}:`,
				error,
			)
		} finally {
			this.isIndexing = false
		}
	}

	/**
	 * Full Scratch Re-index: Clears all memory/disk graph caches, retrieves all Salesforce metadata from scratch,
	 * parses ASTs, maps execution timelines, and emits real-time progress callbacks to the UI.
	 */
	public async indexFromScratch(): Promise<void> {
		if (this.isIndexing) return
		this.isIndexing = true
		const startTime = Date.now()

		try {
			// Phase 1: Reset & Discover
			this.indexer.clear()
			this.graphEngine.clear()
			this.vectorIndexer.clear()

			this.emitProgress({
				phase: "DISCOVERING",
				currentStep: 1,
				totalSteps: 4,
				itemsProcessed: 0,
				totalItems: 0,
			})

			const files = await this.findSalesforceFiles(this.workspaceRoot)
			const totalItems = files.length

			// Phase 2: Retrieve & Parse Metadata
			this.emitProgress({
				phase: "RETRIEVING_METADATA",
				currentStep: 2,
				totalSteps: 4,
				itemsProcessed: 0,
				totalItems,
			})

			let processedCount = 0
			for (const filePath of files) {
				try {
					const content = await fs.readFile(filePath, "utf-8")
					await this.indexer.indexFile(filePath, content)
					await this.graphEngine.indexFileForGraph(filePath, content)

					const baseName = path.basename(filePath)
					const docType: "APEX" | "TRIGGER" | "OBJECT" | "FLOW" | "VALIDATION" | "OTHER" = baseName.endsWith(
						".cls",
					)
						? "APEX"
						: baseName.endsWith(".trigger")
							? "TRIGGER"
							: baseName.endsWith(".flow-meta.xml")
								? "FLOW"
								: baseName.endsWith(".validationRule-meta.xml")
									? "VALIDATION"
									: baseName.includes("object-meta") || baseName.includes("field-meta")
										? "OBJECT"
										: "OTHER"

					const vectorDocType: "APEX" | "FLOW" | "OBJECT" =
						baseName.endsWith(".cls") || baseName.endsWith(".trigger")
							? "APEX"
							: baseName.endsWith(".flow-meta.xml")
								? "FLOW"
								: "OBJECT"

					this.vectorIndexer.indexDocument(filePath, baseName, content, vectorDocType, filePath)

					processedCount++
					this.emitProgress({
						phase: "RETRIEVING_METADATA",
						currentStep: 2,
						totalSteps: 4,
						currentFile: baseName,
						docType,
						itemsProcessed: processedCount,
						totalItems,
					})
				} catch (e) {
					// Continue processing next file
				}
			}

			// Phase 3: Building Transaction Timelines
			this.emitProgress({
				phase: "BUILDING_TRANSACTIONS",
				currentStep: 3,
				totalSteps: 4,
				itemsProcessed: processedCount,
				totalItems,
			})

			this.graphEngine.resolveApexCallEdges()
			this.graphEngine.aggregateCallChainMetrics()

			// Phase 4: Exporting Graph & Transaction Reports
			this.emitProgress({
				phase: "BUILDING_GRAPH",
				currentStep: 4,
				totalSteps: 4,
				itemsProcessed: processedCount,
				totalItems,
			})

			await this.indexer.exportTreeIndex(this.workspaceRoot)
			await this.graphEngine.exportGraphNetwork(this.workspaceRoot)
			await exportTransactionIndex(this.graphEngine, this.workspaceRoot)

			const durationMs = Date.now() - startTime
			const nodeCount = this.graphEngine.getNodes().size
			const edgeCount = this.graphEngine.getEdges().length
			const timelineCount = Array.from(this.graphEngine.getNodes().values()).filter(
				(n) => n.type === "APEX_TRIGGER" && (n.txn?.dmlCount || n.txn?.soqlCount),
			).length

			this.emitProgress({
				phase: "COMPLETE",
				currentStep: 4,
				totalSteps: 4,
				itemsProcessed: processedCount,
				totalItems,
				nodeCount,
				edgeCount,
				timelineCount,
				durationMs,
			})
		} catch (error: any) {
			this.emitProgress({
				phase: "ERROR",
				currentStep: 4,
				totalSteps: 4,
				itemsProcessed: 0,
				totalItems: 0,
				error: error?.message || "Unknown indexer error",
			})
		} finally {
			this.isIndexing = false
		}
	}

	/**
	 * Incremental Refresh: Scans workspace, updates graph deltas, and re-exports reports.
	 */
	public async refreshIndex(): Promise<void> {
		return this.indexFromScratch()
	}

	/**
	 * Scans the workspace directory recursively in concurrent chunks of 50
	 */
	private async scanWorkspace(): Promise<void> {
		const files = await this.findSalesforceFiles(this.workspaceRoot)

		// Batch process files in chunks of 50 for fast non-blocking execution
		const chunkSize = 50
		for (let i = 0; i < files.length; i += chunkSize) {
			const chunk = files.slice(i, i + chunkSize)
			await Promise.all(
				chunk.map(async (filePath) => {
					try {
						const content = await fs.readFile(filePath, "utf-8")
						await this.indexer.indexFile(filePath, content)
						await this.graphEngine.indexFileForGraph(filePath, content)

						const baseName = path.basename(filePath)
						const docType =
							baseName.endsWith(".cls") || baseName.endsWith(".trigger")
								? "APEX"
								: baseName.endsWith(".flow-meta.xml")
									? "FLOW"
									: "OBJECT"
						this.vectorIndexer.indexDocument(filePath, baseName, content, docType, filePath)
					} catch (e) {
						// Ignore read error
					}
				}),
			)
		}

		// Resolve CALLS_APEX edges and aggregate handler metrics onto triggers (B1 & B3)
		this.graphEngine.resolveApexCallEdges()
		this.graphEngine.aggregateCallChainMetrics()

		this.scheduleDebouncedExport()
	}

	/**
	 * Recursive file search for Salesforce metadata files
	 */
	private async findSalesforceFiles(dirPath: string): Promise<string[]> {
		const results: string[] = []
		try {
			const entries = await fs.readdir(dirPath, { withFileTypes: true })
			for (const entry of entries) {
				const fullPath = path.join(dirPath, entry.name)
				const lowerName = entry.name.toLowerCase()

				if (entry.isDirectory()) {
					if (
						!lowerName.startsWith(".") &&
						lowerName !== "node_modules" &&
						lowerName !== "dist" &&
						lowerName !== "out"
					) {
						const subFiles = await this.findSalesforceFiles(fullPath)
						results.push(...subFiles)
					}
				} else if (entry.isFile()) {
					if (SF_INDEXED_SUFFIXES.some((s) => lowerName.endsWith(s.toLowerCase()))) {
						results.push(fullPath)
					}
				}
			}
		} catch (e) {
			// Fallback on read error
		}
		return results
	}

	/**
	 * Sets up VS Code FileSystemWatcher for real-time invalidation using dynamic case-exact suffix glob (H1)
	 */
	private setupFileWatcher(): void {
		const rawExtensions = SF_INDEXED_SUFFIXES.map((s) => s.replace(/^\./, "")).join(",")
		const pattern = new vscode.RelativePattern(this.workspaceRoot, `**/*.{${rawExtensions}}`)
		const watcher = vscode.workspace.createFileSystemWatcher(pattern)

		watcher.onDidCreate(async (uri) => this.handleFileChange(uri.fsPath))
		watcher.onDidChange(async (uri) => this.handleFileChange(uri.fsPath))
		watcher.onDidDelete((uri) => this.handleFileDelete(uri.fsPath))

		this.watchers.push(watcher)
	}

	private async handleFileChange(filePath: string): Promise<void> {
		try {
			const content = await fs.readFile(filePath, "utf-8")
			const baseName = path.basename(filePath)
			const docType =
				baseName.endsWith(".cls") || baseName.endsWith(".trigger")
					? "APEX"
					: baseName.endsWith(".flow-meta.xml")
						? "FLOW"
						: "OBJECT"

			// Prevent stale node/edge accumulation by removing file from all stores before re-indexing (H2)
			this.indexer.removeFile(filePath)
			this.graphEngine.removeFile(filePath)
			this.vectorIndexer.removeFile(filePath)

			await this.indexer.indexFile(filePath, content)
			await this.graphEngine.indexFileForGraph(filePath, content)
			this.vectorIndexer.indexDocument(filePath, baseName, content, docType, filePath)

			this.graphEngine.resolveApexCallEdges()
			this.graphEngine.aggregateCallChainMetrics()

			this.scheduleDebouncedExport()
		} catch (e) {
			// Handle write race
		}
	}

	private handleFileDelete(filePath: string): void {
		this.indexer.removeFile(filePath)
		this.graphEngine.removeFile(filePath)
		this.vectorIndexer.removeFile(filePath)
		this.scheduleDebouncedExport()
	}

	/**
	 * Trailing debounce timer (3s) for full index re-exports
	 */
	private scheduleDebouncedExport(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
		}
		this.debounceTimer = setTimeout(async () => {
			try {
				await this.indexer.exportTreeIndex(this.workspaceRoot)
				await this.graphEngine.exportGraphNetwork(this.workspaceRoot)
				await exportTransactionIndex(this.graphEngine, this.workspaceRoot)
			} catch (e) {
				// Handle export error silently
			}
		}, 3000)
	}

	public dispose(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
			this.debounceTimer = null
		}
		for (const watcher of this.watchers) {
			watcher.dispose()
		}
		this.watchers = []
	}
}

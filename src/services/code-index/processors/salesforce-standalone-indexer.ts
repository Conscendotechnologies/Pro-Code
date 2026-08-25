import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import { SalesforceMetadataIndexer } from "./salesforce-indexer"
import { SalesforceGraphEngine } from "./salesforce-graph"
import { SalesforceVectorIndexer } from "./salesforce-vector-indexer"
import { exportTransactionIndex, countGeneratedTimelines } from "./salesforce-transaction"

export const SF_INDEXED_SUFFIXES = [
	".cls",
	".trigger",
	".cmp",
	".page",
	".js",
	".html",
	".object-meta.xml",
	".field-meta.xml",
	".flow-meta.xml",
	".validationRule-meta.xml",
	".workflow-meta.xml",
	".flexipage-meta.xml",
	".layout-meta.xml",
	".labels-meta.xml",
	".permissionset-meta.xml",
	".permissionsetgroup-meta.xml",
	".tab-meta.xml",
	".pathAssistant-meta.xml",
	".app-meta.xml",
	".duplicateRule-meta.xml",
	".matchingRule-meta.xml",
	".assignmentRules-meta.xml",
	".autoResponseRules-meta.xml",
	".escalationRules-meta.xml",
	".sharingRules-meta.xml",
	".entitlementProcess-meta.xml",
	".resource-meta.xml",
	".genAiPlanner-meta.xml",
	".genAiAgent-meta.xml",
	".bot-meta.xml",
] as const

export interface SalesforceIndexingProgress {
	phase: "DISCOVERING" | "RETRIEVING_METADATA" | "BUILDING_TRANSACTIONS" | "BUILDING_GRAPH" | "COMPLETE" | "ERROR"
	currentStep: number
	totalSteps: number
	currentFile?: string
	docType?: "APEX" | "TRIGGER" | "OBJECT" | "FLOW" | "VALIDATION" | "LWC" | "AURA" | "FLEXIPAGE" | "LAYOUT" | "OTHER"
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
 * Operates 100% offline with zero reliance on external vector database APIs.
 */
export class SalesforceStandaloneIndexer implements vscode.Disposable {
	private static instances: Map<string, SalesforceStandaloneIndexer> = new Map()

	private workspaceRoot: string
	private indexer: SalesforceMetadataIndexer
	private graphEngine: SalesforceGraphEngine
	private vectorIndexer: SalesforceVectorIndexer
	private isIndexing = false
	private lastIndexTimestamp = 0
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

	public getIsIndexing(): boolean {
		return this.isIndexing
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
			// Load saved JSON sidecar for fast cold start
			await this.indexer.loadJsonIndex(this.workspaceRoot)
			await this.scanWorkspace()
			this.setupFileWatcher()
			this.lastIndexTimestamp = Date.now()

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
	 * Full Scratch Re-index: Clears all memory/disk graph caches, parses workspace files,
	 * maps execution timelines, and emits real-time progress callbacks to the UI.
	 * @param retrieveFromOrg - Only executes `sf project retrieve start` if user explicitly confirmed.
	 */
	public async indexFromScratch(retrieveFromOrg: boolean = false): Promise<void> {
		if (this.isIndexing) return
		this.isIndexing = true
		const startTime = Date.now()

		try {
			// Phase 1: Reset & Discover Org Metadata
			this.indexer.clear()
			this.graphEngine.clear()
			this.vectorIndexer.clear()

			this.emitProgress({
				phase: "DISCOVERING",
				currentStep: 1,
				totalSteps: 4,
				currentFile: retrieveFromOrg
					? "Retrieving metadata from connected Salesforce Org..."
					: "Discovering workspace Salesforce files...",
				itemsProcessed: 0,
				totalItems: 0,
			})

			// Only execute CLI retrieve if user explicitly confirmed in modal dialog
			if (retrieveFromOrg) {
				try {
					const sfdxProjectPath = path.join(this.workspaceRoot, "sfdx-project.json")
					const manifestPath = path.join(this.workspaceRoot, "manifest", "package.xml")
					const hasSfdxProject = await fs
						.stat(sfdxProjectPath)
						.then(() => true)
						.catch(() => false)

					if (hasSfdxProject) {
						const hasManifest = await fs
							.stat(manifestPath)
							.then(() => true)
							.catch(() => false)

						const metadataList = [
							"ApexClass",
							"ApexTrigger",
							"CustomObject",
							"CustomField",
							"LightningComponentBundle",
							"AuraDefinitionBundle",
							"Flow",
							"ValidationRule",
							"Workflow",
							"DuplicateRule",
							"MatchingRule",
							"AssignmentRules",
							"AutoResponseRules",
							"EscalationRules",
							"SharingRules",
							"EntitlementProcess",
							"FlexiPage",
							"Layout",
							"PermissionSet",
							"PermissionSetGroup",
							"CustomTab",
							"PathAssistant",
							"ApexPage",
							"StaticResource",
							"CustomLabel",
							"GenAiPlanner",
							"GenAiAgent",
							"Bot",
						].join(",")

						const cmd = hasManifest
							? "sf project retrieve start --manifest manifest/package.xml --json"
							: `sf project retrieve start --metadata "${metadataList}" --json`

						this.emitProgress({
							phase: "DISCOVERING",
							currentStep: 1,
							totalSteps: 4,
							currentFile: `Executing SF CLI retrieval (${hasManifest ? "manifest/package.xml" : "28 metadata types"})...`,
							itemsProcessed: 0,
							totalItems: 0,
						})

						const { exec } = await import("child_process")
						const { promisify } = await import("util")
						const execAsync = promisify(exec)
						await execAsync(cmd, {
							cwd: this.workspaceRoot,
							timeout: 180000, // 3 minutes timeout
						}).catch(() => {
							this.emitProgress({
								phase: "DISCOVERING",
								currentStep: 1,
								totalSteps: 4,
								currentFile: "Org retrieval skipped or timed out; indexing local files...",
								itemsProcessed: 0,
								totalItems: 0,
							})
						})
					}
				} catch (e) {
					// Fallback to local files
				}
			}

			const files = await this.findSalesforceFiles(this.workspaceRoot)
			const totalItems = files.length

			// Phase 2: Batch Retrieve & Parse Metadata in Chunks of 50
			this.emitProgress({
				phase: "RETRIEVING_METADATA",
				currentStep: 2,
				totalSteps: 4,
				itemsProcessed: 0,
				totalItems,
			})

			let processedCount = 0
			let lastEmitTime = 0
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
							const isVectorTarget =
								baseName.endsWith(".cls") ||
								baseName.endsWith(".trigger") ||
								baseName.endsWith(".object-meta.xml") ||
								baseName.endsWith(".field-meta.xml") ||
								baseName.endsWith(".flow-meta.xml") ||
								baseName.endsWith(".validationRule-meta.xml")

							if (isVectorTarget) {
								const vectorDocType =
									baseName.endsWith(".cls") || baseName.endsWith(".trigger")
										? "APEX"
										: baseName.endsWith(".flow-meta.xml")
											? "FLOW"
											: "OBJECT"
								this.vectorIndexer.indexDocument(filePath, baseName, content, vectorDocType, filePath)
							}

							processedCount++
						} catch (e) {
							processedCount++
						}
					}),
				)

				// Throttle UI progress emission to at most once per 100ms
				const now = Date.now()
				if (now - lastEmitTime > 100 || processedCount === totalItems) {
					lastEmitTime = now
					const sampleFile = path.basename(chunk[chunk.length - 1] || "")
					this.emitProgress({
						phase: "RETRIEVING_METADATA",
						currentStep: 2,
						totalSteps: 4,
						currentFile: sampleFile,
						itemsProcessed: Math.min(processedCount, totalItems),
						totalItems,
					})
				}
			}

			// Phase 3: Building Transaction Timelines & Resolving Edges
			this.emitProgress({
				phase: "BUILDING_TRANSACTIONS",
				currentStep: 3,
				totalSteps: 4,
				itemsProcessed: totalItems,
				totalItems,
			})

			this.graphEngine.resolveApexCallEdges()
			this.graphEngine.aggregateCallChainMetrics()

			// Phase 4: Exporting Reports
			this.emitProgress({
				phase: "BUILDING_GRAPH",
				currentStep: 4,
				totalSteps: 4,
				itemsProcessed: totalItems,
				totalItems,
			})

			await this.indexer.exportTreeIndex(this.workspaceRoot)
			await this.graphEngine.exportGraphNetwork(this.workspaceRoot)
			await exportTransactionIndex(this.graphEngine, this.workspaceRoot)

			const durationMs = Date.now() - startTime
			const nodeCount = this.graphEngine.getNodes().size
			const edgeCount = this.graphEngine.getEdges().length

			const timelineCount = countGeneratedTimelines(this.graphEngine)

			this.lastIndexTimestamp = Date.now()

			this.emitProgress({
				phase: "COMPLETE",
				currentStep: 4,
				totalSteps: 4,
				itemsProcessed: totalItems,
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
	 * Incremental Refresh: Scans workspace for modified files since lastIndexTimestamp,
	 * updates graph & vector deltas, and re-exports reports without wiping indices or running CLI retrieve.
	 */
	public async refreshIndex(): Promise<void> {
		if (this.isIndexing) return
		this.isIndexing = true
		const startTime = Date.now()

		try {
			this.emitProgress({
				phase: "DISCOVERING",
				currentStep: 1,
				totalSteps: 4,
				currentFile: "Scanning workspace for modified Salesforce files...",
				itemsProcessed: 0,
				totalItems: 0,
			})

			const files = await this.findSalesforceFiles(this.workspaceRoot)
			const modifiedFiles: string[] = []

			for (const filePath of files) {
				try {
					const stat = await fs.stat(filePath)
					if (stat.mtimeMs > this.lastIndexTimestamp) {
						modifiedFiles.push(filePath)
					}
				} catch (e) {
					// Ignore stat error
				}
			}

			// If no files modified, return early as a clean no-op
			if (modifiedFiles.length === 0) {
				const durationMs = Date.now() - startTime
				const nodeCount = this.graphEngine.getNodes().size
				const edgeCount = this.graphEngine.getEdges().length
				const timelineCount = countGeneratedTimelines(this.graphEngine)

				this.emitProgress({
					phase: "COMPLETE",
					currentStep: 4,
					totalSteps: 4,
					itemsProcessed: 0,
					totalItems: 0,
					currentFile: "No modified files detected.",
					nodeCount,
					edgeCount,
					timelineCount,
					durationMs,
				})
				return
			}

			const targetFiles = modifiedFiles
			const totalItems = targetFiles.length

			this.emitProgress({
				phase: "RETRIEVING_METADATA",
				currentStep: 2,
				totalSteps: 4,
				currentFile: `Refreshing ${modifiedFiles.length} modified file(s)...`,
				itemsProcessed: 0,
				totalItems,
			})

			let processedCount = 0
			const chunkSize = 50
			for (let i = 0; i < targetFiles.length; i += chunkSize) {
				const chunk = targetFiles.slice(i, i + chunkSize)
				await Promise.all(
					chunk.map(async (filePath) => {
						try {
							// Remove stale symbol, graph, and vector state before re-indexing (Fix R1 / vector drift)
							this.indexer.removeFile(filePath)
							this.graphEngine.removeFile(filePath)
							this.vectorIndexer.removeFile(filePath)

							const content = await fs.readFile(filePath, "utf-8")
							await this.indexer.indexFile(filePath, content)
							await this.graphEngine.indexFileForGraph(filePath, content)

							const baseName = path.basename(filePath)
							const isVectorTarget =
								baseName.endsWith(".cls") ||
								baseName.endsWith(".trigger") ||
								baseName.endsWith(".object-meta.xml") ||
								baseName.endsWith(".field-meta.xml") ||
								baseName.endsWith(".flow-meta.xml") ||
								baseName.endsWith(".validationRule-meta.xml")

							if (isVectorTarget) {
								const vectorDocType =
									baseName.endsWith(".cls") || baseName.endsWith(".trigger")
										? "APEX"
										: baseName.endsWith(".flow-meta.xml")
											? "FLOW"
											: "OBJECT"
								this.vectorIndexer.indexDocument(filePath, baseName, content, vectorDocType, filePath)
							}

							processedCount++
						} catch (e) {
							processedCount++
						}
					}),
				)
			}

			this.emitProgress({
				phase: "BUILDING_TRANSACTIONS",
				currentStep: 3,
				totalSteps: 4,
				itemsProcessed: totalItems,
				totalItems,
			})

			this.graphEngine.resolveApexCallEdges()
			this.graphEngine.aggregateCallChainMetrics()

			this.emitProgress({
				phase: "BUILDING_GRAPH",
				currentStep: 4,
				totalSteps: 4,
				itemsProcessed: totalItems,
				totalItems,
			})

			await this.indexer.exportTreeIndex(this.workspaceRoot)
			await this.graphEngine.exportGraphNetwork(this.workspaceRoot)
			await exportTransactionIndex(this.graphEngine, this.workspaceRoot)

			const durationMs = Date.now() - startTime
			const nodeCount = this.graphEngine.getNodes().size
			const edgeCount = this.graphEngine.getEdges().length
			const timelineCount = countGeneratedTimelines(this.graphEngine)

			this.lastIndexTimestamp = Date.now()

			this.emitProgress({
				phase: "COMPLETE",
				currentStep: 4,
				totalSteps: 4,
				itemsProcessed: totalItems,
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
				error: error?.message || "Refresh error",
			})
		} finally {
			this.isIndexing = false
		}
	}

	/**
	 * Async workspace scan in chunks of 50
	 */
	private async scanWorkspace(): Promise<void> {
		const files = await this.findSalesforceFiles(this.workspaceRoot)
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
						const isVectorTarget =
							baseName.endsWith(".cls") ||
							baseName.endsWith(".trigger") ||
							baseName.endsWith(".object-meta.xml") ||
							baseName.endsWith(".field-meta.xml") ||
							baseName.endsWith(".flow-meta.xml") ||
							baseName.endsWith(".validationRule-meta.xml")

						if (isVectorTarget) {
							const vectorDocType =
								baseName.endsWith(".cls") || baseName.endsWith(".trigger")
									? "APEX"
									: baseName.endsWith(".flow-meta.xml")
										? "FLOW"
										: "OBJECT"
							this.vectorIndexer.indexDocument(filePath, baseName, content, vectorDocType, filePath)
						}
					} catch (e) {
						// Ignore read error
					}
				}),
			)
		}

		this.graphEngine.resolveApexCallEdges()
		this.graphEngine.aggregateCallChainMetrics()
		this.scheduleDebouncedExport()
	}

	/**
	 * Recursive file search for Salesforce metadata files matching SF_INDEXED_SUFFIXES
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
	 * Sets up VS Code FileSystemWatcher for real-time invalidation matching SF_INDEXED_SUFFIXES
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
			// Purge stale symbol, graph, and vector state before re-indexing (Fix R1 / vector drift)
			this.indexer.removeFile(filePath)
			this.graphEngine.removeFile(filePath)
			this.vectorIndexer.removeFile(filePath)

			const content = await fs.readFile(filePath, "utf-8")
			await this.indexer.indexFile(filePath, content)
			await this.graphEngine.indexFileForGraph(filePath, content)

			const baseName = path.basename(filePath)
			const isVectorTarget =
				baseName.endsWith(".cls") ||
				baseName.endsWith(".trigger") ||
				baseName.endsWith(".object-meta.xml") ||
				baseName.endsWith(".field-meta.xml") ||
				baseName.endsWith(".flow-meta.xml") ||
				baseName.endsWith(".validationRule-meta.xml")

			if (isVectorTarget) {
				const vectorDocType =
					baseName.endsWith(".cls") || baseName.endsWith(".trigger")
						? "APEX"
						: baseName.endsWith(".flow-meta.xml")
							? "FLOW"
							: "OBJECT"
				this.vectorIndexer.indexDocument(filePath, baseName, content, vectorDocType, filePath)
			}

			this.scheduleDebouncedExport()
		} catch (e) {
			// File read error
		}
	}

	private handleFileDelete(filePath: string): void {
		// Purge deleted file from symbol indexer, graph engine, and vector indexer (Fix R2)
		this.indexer.removeFile(filePath)
		this.graphEngine.removeFile(filePath)
		this.vectorIndexer.removeFile(filePath)
		this.scheduleDebouncedExport()
	}

	private scheduleDebouncedExport(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
		}
		this.debounceTimer = setTimeout(async () => {
			try {
				this.graphEngine.resolveApexCallEdges()
				this.graphEngine.aggregateCallChainMetrics()
				await this.indexer.exportTreeIndex(this.workspaceRoot)
				await this.graphEngine.exportGraphNetwork(this.workspaceRoot)
				await exportTransactionIndex(this.graphEngine, this.workspaceRoot)
			} catch (e) {
				// Ignore background export error
			}
		}, 3000)
	}

	public dispose(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
		}
		for (const watcher of this.watchers) {
			watcher.dispose()
		}
		this.watchers = []
		this.progressListeners = []
	}
}

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

	private constructor(workspaceRoot: string) {
		this.workspaceRoot = workspaceRoot
		this.indexer = SalesforceMetadataIndexer.getInstance(workspaceRoot)
		this.graphEngine = SalesforceGraphEngine.getInstance(workspaceRoot)
		this.vectorIndexer = SalesforceVectorIndexer.getInstance(workspaceRoot)
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
		try {
			await this.scanWorkspace()
			this.setupFileWatcher()
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

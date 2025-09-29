import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from "vscode"

import { getGlobalRooDirectory, directoryExists, fileExists } from "../services/roo-config"

/**
 * Instruction item structure for the searchable index
 */
export interface InstructionItem {
	id: string
	mode: string
	taskType: string
	keywords: string[]
	filePath: string
	priority: "high" | "medium" | "low"
	description: string
}

/**
 * Index structure for bundled instructions
 */
export interface InstructionIndex {
	version: string
	lastUpdated: string
	instructions: InstructionItem[]
}

/**
 * Version and extraction metadata
 */
export interface VersionInfo {
	version: string
	extractedAt: string
	extensionVersion: string
	bundleHash?: string
}

/**
 * Manages bundled instruction files from the VSIX package
 * Handles copying bundled instructions to global storage with proper indexing
 */
export class BundledInstructionsManager {
	private readonly globalStoragePath: string
	private readonly instructionsPath: string
	private readonly bundledPath: string
	private readonly context: vscode.ExtensionContext

	constructor(context: vscode.ExtensionContext) {
		vscode.window.showInformationMessage(`[CHECKPOINT 1] BundledInstructionsManager constructor called.`)
		this.context = context
		this.globalStoragePath = path.join(context.globalStorageUri.fsPath, "instructions")
		this.instructionsPath = this.globalStoragePath
		// Path to bundled instructions in the extension directory
		this.bundledPath = path.join(context.extensionPath, "dist", "bundled", ".roo")
		vscode.window.showInformationMessage(
			`[CHECKPOINT 2] Paths initialized - globalStoragePath: ${this.globalStoragePath} bundledPath: ${this.bundledPath}`,
		)
	}

	/**
	 * Initialize bundled instructions - copy from extension to global storage with proper structure
	 */
	async initializeBundledInstructions(): Promise<void> {
		try {
			vscode.window.showInformationMessage(`[CHECKPOINT 3] initializeBundledInstructions called.`)
			// Check if bundled instructions exist in extension
			if (!(await directoryExists(this.bundledPath))) {
				vscode.window.showWarningMessage("[CHECKPOINT 4] Bundled instructions not found in extension package")
				console.warn("Bundled instructions not found in extension package")
				return
			}
			vscode.window.showInformationMessage(
				`[CHECKPOINT 5] Directory exists - bundledPath: ${this.bundledPath} instructionsPath: ${this.instructionsPath}`,
			)
			console.log("bundledPath:", this.bundledPath)
			console.log("instructionsPath:", this.instructionsPath)

			// Create the proper directory structure
			vscode.window.showInformationMessage("[CHECKPOINT 6] Creating directory structure...")
			await this.createDirectoryStructure()

			// Check if we need to copy/update bundled instructions
			vscode.window.showInformationMessage("[CHECKPOINT 7] Checking for updates...")
			const shouldCopy = await this.checkForUpdates()
			vscode.window.showInformationMessage(`[CHECKPOINT 8] Should copy: ${shouldCopy}`)
			if (shouldCopy) {
				vscode.window.showInformationMessage("[CHECKPOINT 9] Extracting and indexing instructions...")
				await this.extractAndIndexInstructions()
			}
			vscode.window.showInformationMessage("[CHECKPOINT 10] Bundled instructions initialized successfully.")
		} catch (error) {
			vscode.window.showErrorMessage(
				`[CHECKPOINT ERROR] Failed to initialize bundled instructions: ${error.message}`,
			)
			console.error("Failed to initialize bundled instructions:", error)
			// Don't throw - extension should continue to work even if bundled instructions fail
		}
	}

	/**
	 * Create the proper directory structure for instructions
	 */
	private async createDirectoryStructure(): Promise<void> {
		vscode.window.showInformationMessage("[CHECKPOINT 11] Creating main directories...")
		// Create main directories
		await fs.mkdir(this.instructionsPath, { recursive: true })
		await fs.mkdir(path.join(this.instructionsPath, "modes"), { recursive: true })
		await fs.mkdir(path.join(this.instructionsPath, "meta"), { recursive: true })

		vscode.window.showInformationMessage("[CHECKPOINT 12] Discovering available modes from bundled instructions...")
		// Dynamically discover and create mode-specific directories
		try {
			const bundledItems = await fs.readdir(this.bundledPath)
			const ruleFolders = bundledItems.filter((item) => item.startsWith("rules-"))
			const discoveredModes = ruleFolders.map((folder) => folder.replace("rules-", ""))

			// Always ensure "general" mode exists for standalone files
			const allModes = [...new Set([...discoveredModes, "general"])]

			vscode.window.showInformationMessage(
				`[CHECKPOINT 13] Creating directories for modes: ${allModes.join(", ")}`,
			)
			for (const mode of allModes) {
				await fs.mkdir(path.join(this.instructionsPath, "modes", mode), { recursive: true })
			}
		} catch (error) {
			vscode.window.showWarningMessage(
				`[CHECKPOINT WARNING] Could not discover modes, creating default structure: ${error.message}`,
			)
			// Fallback to default modes if discovery fails
			const defaultModes = ["code", "ask", "architect", "test", "general"]
			for (const mode of defaultModes) {
				await fs.mkdir(path.join(this.instructionsPath, "modes", mode), { recursive: true })
			}
		}

		vscode.window.showInformationMessage("[CHECKPOINT 14] Directory structure created successfully.")
	}

	/**
	 * Extract bundled instructions and create searchable index
	 */
	private async extractAndIndexInstructions(): Promise<void> {
		try {
			vscode.window.showInformationMessage(
				"[CHECKPOINT 15] Extracting bundled instructions and creating index...",
			)
			console.log("Extracting bundled instructions and creating index...")

			const instructions: InstructionItem[] = []

			vscode.window.showInformationMessage("[CHECKPOINT 16] Discovering available rule folders...")
			// Dynamically discover all available rule folders and files
			const bundledItems = await fs.readdir(this.bundledPath)

			// Process rule folders (rules-*)
			const ruleFolders = bundledItems.filter((item) => item.startsWith("rules-"))
			vscode.window.showInformationMessage(
				`[CHECKPOINT 17] Found ${ruleFolders.length} rule folders: ${ruleFolders.join(", ")}`,
			)

			for (const ruleFolder of ruleFolders) {
				const sourcePath = path.join(this.bundledPath, ruleFolder)
				if (await directoryExists(sourcePath)) {
					vscode.window.showInformationMessage(`[CHECKPOINT 18] Processing rule folder: ${ruleFolder}`)
					const mode = ruleFolder.replace("rules-", "") // Extract mode from folder name
					const modeInstructions = await this.processMode(mode, sourcePath)
					instructions.push(...modeInstructions)
					vscode.window.showInformationMessage(
						`[CHECKPOINT 19] Added ${modeInstructions.length} instructions for ${ruleFolder}`,
					)
				}
			}

			// Process standalone files in root .roo directory
			const standaloneFiles = bundledItems.filter(
				(item) =>
					item.endsWith(".md") || item.endsWith(".xml") || item.endsWith(".yml") || item.endsWith(".yaml"),
			)
			vscode.window.showInformationMessage(
				`[CHECKPOINT 20] Found ${standaloneFiles.length} standalone files: ${standaloneFiles.join(", ")}`,
			)

			if (standaloneFiles.length > 0) {
				const standaloneInstructions = await this.processStandaloneFiles(standaloneFiles)
				instructions.push(...standaloneInstructions)
				vscode.window.showInformationMessage(
					`[CHECKPOINT 21] Added ${standaloneInstructions.length} standalone instructions`,
				)
			}

			vscode.window.showInformationMessage(
				`[CHECKPOINT 22] Creating searchable index with ${instructions.length} instructions...`,
			)
			// Create the searchable index
			const index: InstructionIndex = {
				version: this.context.extension.packageJSON.version,
				lastUpdated: new Date().toISOString(),
				instructions,
			}

			vscode.window.showInformationMessage("[CHECKPOINT 23] Saving index to file...")
			// Save the index
			await fs.writeFile(path.join(this.instructionsPath, "index.json"), JSON.stringify(index, null, 2), "utf-8")

			vscode.window.showInformationMessage("[CHECKPOINT 24] Saving extraction metadata...")
			// Save extraction metadata
			await this.saveExtractionInfo()

			vscode.window.showInformationMessage(
				`[CHECKPOINT 25] Successfully indexed ${instructions.length} instructions`,
			)
			console.log(`Successfully indexed ${instructions.length} instructions`)
		} catch (error) {
			vscode.window.showErrorMessage(
				`[CHECKPOINT ERROR] Failed to extract and index instructions: ${error.message}`,
			)
			console.error("Failed to extract and index instructions:", error)
			throw error
		}
	}

	/**
	 * Process instructions for a specific mode
	 */
	private async processMode(mode: string, sourcePath: string): Promise<InstructionItem[]> {
		vscode.window.showInformationMessage(`[CHECKPOINT 26] Processing mode: ${mode} from ${sourcePath}`)
		const instructions: InstructionItem[] = []
		const destinationPath = path.join(this.instructionsPath, "modes", mode)

		// Ensure destination directory exists
		await fs.mkdir(destinationPath, { recursive: true })

		try {
			const files = await fs.readdir(sourcePath)
			// Process all supported instruction files: .md, .xml, .yml, .yaml
			const instructionFiles = files.filter(
				(file) =>
					file.endsWith(".md") || file.endsWith(".xml") || file.endsWith(".yml") || file.endsWith(".yaml"),
			)
			vscode.window.showInformationMessage(
				`[CHECKPOINT 27] Found ${instructionFiles.length} instruction files in mode: ${mode}`,
			)

			for (const file of instructionFiles) {
				const sourceFile = path.join(sourcePath, file)
				const destFile = path.join(destinationPath, file)

				vscode.window.showInformationMessage(
					`[CHECKPOINT 28] Copying file: ${file} from ${sourceFile} to ${destFile}`,
				)
				// Copy the file
				await fs.copyFile(sourceFile, destFile)

				vscode.window.showInformationMessage(`[CHECKPOINT 29] Creating instruction item for: ${file}`)
				// Create index entry
				const instruction = await this.createInstructionItem(mode, file, destFile)
				instructions.push(instruction)
			}
			vscode.window.showInformationMessage(
				`[CHECKPOINT 30] Completed processing mode: ${mode} with ${instructions.length} instructions`,
			)
		} catch (error) {
			vscode.window.showErrorMessage(`[CHECKPOINT ERROR] Error processing mode ${mode}: ${error.message}`)
			console.error(`Error processing mode ${mode}:`, error)
		}

		return instructions
	}

	/**
	 * Process standalone instruction files in the root .roo directory
	 */
	private async processStandaloneFiles(files: string[]): Promise<InstructionItem[]> {
		vscode.window.showInformationMessage(`[CHECKPOINT 31] Processing ${files.length} standalone files`)
		const instructions: InstructionItem[] = []
		const destinationPath = path.join(this.instructionsPath, "modes", "general")

		// Ensure destination directory exists
		await fs.mkdir(destinationPath, { recursive: true })

		try {
			for (const file of files) {
				const sourceFile = path.join(this.bundledPath, file)
				const destFile = path.join(destinationPath, file)

				vscode.window.showInformationMessage(`[CHECKPOINT 32] Copying standalone file: ${file}`)
				// Copy the file
				await fs.copyFile(sourceFile, destFile)

				vscode.window.showInformationMessage(
					`[CHECKPOINT 33] Creating instruction item for standalone: ${file}`,
				)
				// Create index entry with "general" mode for standalone files
				const instruction = await this.createInstructionItem("general", file, destFile)
				instructions.push(instruction)
			}
			vscode.window.showInformationMessage(
				`[CHECKPOINT 34] Completed processing standalone files: ${instructions.length} instructions`,
			)
		} catch (error) {
			vscode.window.showErrorMessage(`[CHECKPOINT ERROR] Error processing standalone files: ${error.message}`)
			console.error("Error processing standalone files:", error)
		}

		return instructions
	}

	/**
	 * Create an instruction item for the index
	 */
	private async createInstructionItem(mode: string, fileName: string, filePath: string): Promise<InstructionItem> {
		vscode.window.showInformationMessage(
			`[CHECKPOINT 35] Creating instruction item for: ${fileName} in mode: ${mode}`,
		)

		// Get file extension and base name
		const ext = path.extname(fileName)
		const baseName = path.basename(fileName, ext)
		const relativePath = path.relative(this.instructionsPath, filePath).replace(/\\/g, "/")

		// Try to extract metadata from file content
		let description = `${mode} instructions for ${baseName}`
		let keywords: string[] = [mode, baseName]
		let priority: "high" | "medium" | "low" = "medium"

		try {
			vscode.window.showInformationMessage(`[CHECKPOINT 35] Reading file content for: ${fileName}`)
			const content = await fs.readFile(filePath, "utf-8")
			const lines = content.split("\n").slice(0, 15) // Read first 15 lines for metadata

			// Extract metadata based on file type
			if (ext === ".md") {
				// Markdown files - look for title and description
				for (const line of lines) {
					if (line.startsWith("# ")) {
						description = line.substring(2).trim()
					} else if (line.startsWith("## ")) {
						const subtitle = line.substring(3).trim()
						if (subtitle.toLowerCase().includes("description")) {
							const nextLineIndex = lines.indexOf(line) + 1
							if (nextLineIndex < lines.length) {
								description = lines[nextLineIndex].trim()
							}
						}
					}
				}
			} else if (ext === ".xml") {
				// XML files - look for description tags or comments
				const descriptionMatch = content.match(/<description[^>]*>(.*?)<\/description>/i)
				if (descriptionMatch) {
					description = descriptionMatch[1].trim()
				} else {
					// Look for XML comments with description
					const commentMatch = content.match(/<!--\s*(.*?)\s*-->/s)
					if (commentMatch) {
						description = commentMatch[1].trim().substring(0, 200) // Limit length
					}
				}
			} else if (ext === ".yml" || ext === ".yaml") {
				// YAML files - look for description field
				const descriptionMatch = content.match(/^description:\s*(.+)$/m)
				if (descriptionMatch) {
					description = descriptionMatch[1].trim()
				}
			}

			// Extract keywords from content (enhanced approach)
			const contentLower = content.toLowerCase()
			const commonKeywords = [
				"debug",
				"test",
				"error",
				"fix",
				"optimize",
				"refactor",
				"architecture",
				"design",
				"pattern",
				"best-practice",
				"javascript",
				"typescript",
				"react",
				"node",
				"python",
				"salesforce",
				"apex",
				"workflow",
				"integration",
				"issue",
				"merge",
				"pr",
				"pull-request",
				"review",
				"translate",
			]

			keywords = [mode, baseName, ...commonKeywords.filter((kw) => contentLower.includes(kw))]

			// Add file type as keyword
			keywords.push(ext.substring(1)) // Remove the dot from extension

			// Determine priority based on file size, keywords, or filename
			const criticalKeywords = ["error", "debug", "critical", "urgent", "important"]
			const highPriorityNames = ["global", "critical", "rules", "workflow"]

			if (
				content.length > 3000 ||
				criticalKeywords.some((kw) => contentLower.includes(kw)) ||
				highPriorityNames.some((name) => baseName.toLowerCase().includes(name))
			) {
				priority = "high"
			} else if (content.length < 800 || baseName.toLowerCase().includes("example")) {
				priority = "low"
			}

			vscode.window.showInformationMessage(
				`[CHECKPOINT 36] Analyzed content for ${fileName}: priority=${priority}, keywords=${keywords.length}`,
			)
		} catch (error) {
			vscode.window.showWarningMessage(
				`[CHECKPOINT WARNING] Could not analyze content for ${fileName}: ${error.message}`,
			)
			console.warn(`Could not analyze content for ${fileName}:`, error)
		}

		const instructionItem = {
			id: `${mode}-${baseName}-${Date.now()}`,
			mode,
			taskType: this.inferTaskType(baseName, keywords),
			keywords: [...new Set(keywords)], // Remove duplicates
			filePath: relativePath,
			priority,
			description,
		}
		vscode.window.showInformationMessage(`[CHECKPOINT 37] Created instruction item: ${instructionItem.id}`)
		return instructionItem
	}

	/**
	 * Infer task type from filename and keywords
	 */
	private inferTaskType(baseName: string, keywords: string[]): string {
		const basenameLower = baseName.toLowerCase()
		const keywordsLower = keywords.map((k) => k.toLowerCase())

		// Debugging and testing
		if (basenameLower.includes("debug") || keywordsLower.includes("debug")) return "debugging"
		if (basenameLower.includes("test") || keywordsLower.includes("test")) return "testing"

		// Architecture and design
		if (basenameLower.includes("architect") || keywordsLower.includes("architecture")) return "architecture"
		if (basenameLower.includes("design") || keywordsLower.includes("design")) return "architecture"

		// Code quality and maintenance
		if (basenameLower.includes("refactor") || keywordsLower.includes("refactor")) return "refactoring"
		if (basenameLower.includes("optimize") || keywordsLower.includes("optimize")) return "optimization"
		if (basenameLower.includes("review") || keywordsLower.includes("review")) return "code-review"

		// Issue handling
		if (basenameLower.includes("issue") || keywordsLower.includes("issue")) return "issue-management"
		if (basenameLower.includes("fixer") || basenameLower.includes("fix")) return "issue-fixing"
		if (basenameLower.includes("investigator") || basenameLower.includes("investigate")) return "investigation"

		// Pull requests and merging
		if (basenameLower.includes("pr") || basenameLower.includes("pull-request")) return "pull-request"
		if (basenameLower.includes("merge") || keywordsLower.includes("merge")) return "merging"

		// Documentation and writing
		if (basenameLower.includes("docs") || basenameLower.includes("documentation")) return "documentation"
		if (basenameLower.includes("writer") || basenameLower.includes("write")) return "writing"
		if (basenameLower.includes("extractor") || basenameLower.includes("extract")) return "extraction"

		// Integration and workflow
		if (basenameLower.includes("integration") || keywordsLower.includes("integration")) return "integration"
		if (basenameLower.includes("workflow") || keywordsLower.includes("workflow")) return "workflow"

		// Translation and localization
		if (basenameLower.includes("translate") || keywordsLower.includes("translate")) return "translation"

		// Salesforce specific
		if (basenameLower.includes("salesforce") || keywordsLower.includes("salesforce")) return "salesforce"
		if (basenameLower.includes("apex") || keywordsLower.includes("apex")) return "salesforce"

		// Mode creation and configuration
		if (basenameLower.includes("mode") || basenameLower.includes("config")) return "configuration"

		return "general"
	}

	/**
	 * Save extraction and version information
	 */
	private async saveExtractionInfo(): Promise<void> {
		vscode.window.showInformationMessage("[CHECKPOINT 33] Saving extraction info...")
		const versionInfo: VersionInfo = {
			version: this.context.extension.packageJSON.version,
			extractedAt: new Date().toISOString(),
			extensionVersion: this.context.extension.packageJSON.version,
		}

		const totalFiles = await this.countTotalFiles()
		const availableModes = await this.getAvailableModes()

		const extractionInfo = {
			extractedAt: new Date().toISOString(),
			sourcePath: this.bundledPath,
			totalFiles,
			modes: availableModes,
		}

		vscode.window.showInformationMessage(
			`[CHECKPOINT 34] Saving version info: ${versionInfo.version}, totalFiles: ${totalFiles}`,
		)
		// Save version info
		await fs.writeFile(
			path.join(this.instructionsPath, "meta", "version-info.json"),
			JSON.stringify(versionInfo, null, 2),
			"utf-8",
		)

		vscode.window.showInformationMessage(
			`[CHECKPOINT 35] Saving extraction info with modes: ${availableModes.join(", ")}`,
		)
		// Save extraction info
		await fs.writeFile(
			path.join(this.instructionsPath, "meta", "extraction-info.json"),
			JSON.stringify(extractionInfo, null, 2),
			"utf-8",
		)
		vscode.window.showInformationMessage("[CHECKPOINT 36] Extraction info saved successfully.")
	}

	/**
	 * Check if bundled instructions need to be updated
	 */
	private async checkForUpdates(): Promise<boolean> {
		try {
			vscode.window.showInformationMessage("[CHECKPOINT 37] Checking for updates...")
			const versionInfoPath = path.join(this.instructionsPath, "meta", "version-info.json")

			// If version info doesn't exist, need to extract
			if (!(await fileExists(versionInfoPath))) {
				vscode.window.showInformationMessage("[CHECKPOINT 38] Version info not found, need to extract")
				return true
			}

			const versionInfo = JSON.parse(await fs.readFile(versionInfoPath, "utf-8")) as VersionInfo
			const currentVersion = this.context.extension.packageJSON.version
			const needsUpdate = versionInfo.version !== currentVersion

			vscode.window.showInformationMessage(
				`[CHECKPOINT 39] Version check - current: ${currentVersion}, stored: ${versionInfo.version}, needsUpdate: ${needsUpdate}`,
			)
			return needsUpdate
		} catch (error) {
			vscode.window.showErrorMessage(`[CHECKPOINT ERROR] Error checking for updates: ${error.message}`)
			console.error("Error checking for updates:", error)
			return true
		}
	}

	/**
	 * Count total instruction files
	 */
	private async countTotalFiles(): Promise<number> {
		let count = 0

		try {
			const bundledItems = await fs.readdir(this.bundledPath)

			// Count files in rule folders
			const ruleFolders = bundledItems.filter((item) => item.startsWith("rules-"))
			for (const ruleFolder of ruleFolders) {
				const sourcePath = path.join(this.bundledPath, ruleFolder)
				if (await directoryExists(sourcePath)) {
					const files = await fs.readdir(sourcePath)
					count += files.filter(
						(file) =>
							file.endsWith(".md") ||
							file.endsWith(".xml") ||
							file.endsWith(".yml") ||
							file.endsWith(".yaml"),
					).length
				}
			}

			// Count standalone files
			const standaloneFiles = bundledItems.filter(
				(item) =>
					item.endsWith(".md") || item.endsWith(".xml") || item.endsWith(".yml") || item.endsWith(".yaml"),
			)
			count += standaloneFiles.length
		} catch (error) {
			console.warn("Error counting files:", error)
		}

		return count
	}

	/**
	 * Get available modes from bundled instructions
	 */
	private async getAvailableModes(): Promise<string[]> {
		const modes: string[] = []

		try {
			const bundledItems = await fs.readdir(this.bundledPath)

			// Get modes from rule folders
			const ruleFolders = bundledItems.filter((item) => item.startsWith("rules-"))
			for (const ruleFolder of ruleFolders) {
				const sourcePath = path.join(this.bundledPath, ruleFolder)
				if (await directoryExists(sourcePath)) {
					const mode = ruleFolder.replace("rules-", "")
					modes.push(mode)
				}
			}

			// Check if there are standalone files (add "general" mode)
			const standaloneFiles = bundledItems.filter(
				(item) =>
					item.endsWith(".md") || item.endsWith(".xml") || item.endsWith(".yml") || item.endsWith(".yaml"),
			)
			if (standaloneFiles.length > 0) {
				modes.push("general")
			}
		} catch (error) {
			console.warn("Error getting available modes:", error)
		}

		return [...new Set(modes)].sort() // Remove duplicates and sort
	}

	// Public API Methods

	/**
	 * Get the instruction index
	 */
	async getInstructionIndex(): Promise<InstructionIndex | null> {
		try {
			vscode.window.showInformationMessage("[CHECKPOINT 40] Getting instruction index...")
			const indexPath = path.join(this.instructionsPath, "index.json")
			if (!(await fileExists(indexPath))) {
				vscode.window.showWarningMessage("[CHECKPOINT 41] Index file not found")
				return null
			}

			const indexContent = await fs.readFile(indexPath, "utf-8")
			const index = JSON.parse(indexContent) as InstructionIndex
			vscode.window.showInformationMessage(
				`[CHECKPOINT 42] Index loaded with ${index.instructions.length} instructions`,
			)
			return index
		} catch (error) {
			vscode.window.showErrorMessage(`[CHECKPOINT ERROR] Failed to get instruction index: ${error.message}`)
			console.error("Failed to get instruction index:", error)
			return null
		}
	}

	/**
	 * Search instructions by keywords
	 */
	async searchInstructions(keywords: string[], mode?: string): Promise<InstructionItem[]> {
		try {
			vscode.window.showInformationMessage(
				`[CHECKPOINT 43] Searching instructions with keywords: ${keywords.join(", ")} ${mode ? `in mode: ${mode}` : ""}`,
			)
			const index = await this.getInstructionIndex()
			if (!index) {
				vscode.window.showWarningMessage("[CHECKPOINT 44] No index available for search")
				return []
			}

			const keywordsLower = keywords.map((k) => k.toLowerCase())

			const results = index.instructions
				.filter((instruction) => {
					// Filter by mode if specified
					if (mode && instruction.mode !== mode) {
						return false
					}

					// Check if any keyword matches
					return keywordsLower.some(
						(keyword) =>
							instruction.keywords.some((instKeyword) => instKeyword.toLowerCase().includes(keyword)) ||
							instruction.description.toLowerCase().includes(keyword) ||
							instruction.taskType.toLowerCase().includes(keyword),
					)
				})
				.sort((a, b) => {
					// Sort by priority: high -> medium -> low
					const priorityOrder = { high: 3, medium: 2, low: 1 }
					return priorityOrder[b.priority] - priorityOrder[a.priority]
				})

			vscode.window.showInformationMessage(
				`[CHECKPOINT 45] Search completed, found ${results.length} matching instructions`,
			)
			return results
		} catch (error) {
			vscode.window.showErrorMessage(`[CHECKPOINT ERROR] Failed to search instructions: ${error.message}`)
			console.error("Failed to search instructions:", error)
			return []
		}
	}

	/**
	 * Get instructions for a specific mode
	 */
	async getInstructionsByMode(mode: string): Promise<InstructionItem[]> {
		try {
			const index = await this.getInstructionIndex()
			if (!index) return []

			return index.instructions
				.filter((instruction) => instruction.mode === mode)
				.sort((a, b) => {
					const priorityOrder = { high: 3, medium: 2, low: 1 }
					return priorityOrder[b.priority] - priorityOrder[a.priority]
				})
		} catch (error) {
			console.error(`Failed to get instructions for mode ${mode}:`, error)
			return []
		}
	}

	/**
	 * Get instruction content by ID
	 */
	async getInstructionContent(instructionId: string): Promise<string | null> {
		try {
			const index = await this.getInstructionIndex()
			if (!index) return null

			const instruction = index.instructions.find((inst) => inst.id === instructionId)
			if (!instruction) return null

			const fullPath = path.join(this.instructionsPath, instruction.filePath)
			if (!(await fileExists(fullPath))) return null

			return await fs.readFile(fullPath, "utf-8")
		} catch (error) {
			console.error(`Failed to get content for instruction ${instructionId}:`, error)
			return null
		}
	}

	/**
	 * Get instruction content by file path
	 */
	async getInstructionContentByPath(mode: string, fileName: string): Promise<string | null> {
		try {
			const filePath = path.join(this.instructionsPath, "modes", mode, fileName)
			if (!(await fileExists(filePath))) return null

			return await fs.readFile(filePath, "utf-8")
		} catch (error) {
			console.error(`Failed to get content for ${mode}/${fileName}:`, error)
			return null
		}
	}

	/**
	 * Get available modes
	 */
	async getAvailableModesFromIndex(): Promise<string[]> {
		try {
			const index = await this.getInstructionIndex()
			if (!index) return []

			const modes = [...new Set(index.instructions.map((inst) => inst.mode))]
			return modes.sort()
		} catch (error) {
			console.error("Failed to get available modes:", error)
			return []
		}
	}

	/**
	 * Get version information
	 */
	async getVersionInfo(): Promise<VersionInfo | null> {
		try {
			const versionPath = path.join(this.instructionsPath, "meta", "version-info.json")
			if (!(await fileExists(versionPath))) return null

			const content = await fs.readFile(versionPath, "utf-8")
			return JSON.parse(content) as VersionInfo
		} catch (error) {
			console.error("Failed to get version info:", error)
			return null
		}
	}

	/**
	 * Check if instructions are properly initialized
	 */
	async isInitialized(): Promise<boolean> {
		try {
			vscode.window.showInformationMessage("[CHECKPOINT 46] Checking initialization status...")
			const indexExists = await fileExists(path.join(this.instructionsPath, "index.json"))
			const versionExists = await fileExists(path.join(this.instructionsPath, "meta", "version-info.json"))
			const modesExist = await directoryExists(path.join(this.instructionsPath, "modes"))

			const isInitialized = indexExists && versionExists && modesExist
			vscode.window.showInformationMessage(
				`[CHECKPOINT 47] Initialization check - index: ${indexExists}, version: ${versionExists}, modes: ${modesExist}, initialized: ${isInitialized}`,
			)
			return isInitialized
		} catch (error) {
			vscode.window.showErrorMessage(`[CHECKPOINT ERROR] Failed to check initialization status: ${error.message}`)
			console.error("Failed to check initialization status:", error)
			return false
		}
	}

	/**
	 * Get statistics about the instruction collection
	 */
	async getStatistics(): Promise<{
		totalInstructions: number
		instructionsByMode: Record<string, number>
		instructionsByPriority: Record<string, number>
		lastUpdated: string | null
	}> {
		try {
			const index = await this.getInstructionIndex()
			if (!index) {
				return {
					totalInstructions: 0,
					instructionsByMode: {},
					instructionsByPriority: {},
					lastUpdated: null,
				}
			}

			const instructionsByMode: Record<string, number> = {}
			const instructionsByPriority: Record<string, number> = {}

			for (const instruction of index.instructions) {
				instructionsByMode[instruction.mode] = (instructionsByMode[instruction.mode] || 0) + 1
				instructionsByPriority[instruction.priority] = (instructionsByPriority[instruction.priority] || 0) + 1
			}

			return {
				totalInstructions: index.instructions.length,
				instructionsByMode,
				instructionsByPriority,
				lastUpdated: index.lastUpdated,
			}
		} catch (error) {
			console.error("Failed to get statistics:", error)
			return {
				totalInstructions: 0,
				instructionsByMode: {},
				instructionsByPriority: {},
				lastUpdated: null,
			}
		}
	}
}

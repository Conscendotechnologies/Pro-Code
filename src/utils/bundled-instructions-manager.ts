import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from "vscode"

import { getGlobalRooDirectory, directoryExists, fileExists } from "../services/roo-config"

/**
 * Manages bundled instruction files from the VSIX package
 * Handles copying bundled instructions to global storage and providing access to them
 */
export class BundledInstructionsManager {
	private readonly globalStoragePath: string
	private readonly bundledPath: string
	private readonly context: vscode.ExtensionContext

	constructor(context: vscode.ExtensionContext) {
		this.context = context
		this.globalStoragePath = getGlobalRooDirectory()
		// Path to bundled instructions in the extension directory
		this.bundledPath = path.join(context.extensionPath, "dist", "bundled", ".roo")
	}

	/**
	 * Initialize bundled instructions - copy from extension to global storage if needed
	 */
	async initializeBundledInstructions(): Promise<void> {
		try {
			// Check if bundled instructions exist in extension
			if (!(await directoryExists(this.bundledPath))) {
				console.warn("Bundled instructions not found in extension package")
				return
			}

			// Create global storage directory if it doesn't exist
			await fs.mkdir(this.globalStoragePath, { recursive: true })

			// Check if we need to copy/update bundled instructions
			const shouldCopy = await this.checkForUpdates()
			if (shouldCopy) {
				await this.copyBundledToGlobal()
			}
		} catch (error) {
			console.error("Failed to initialize bundled instructions:", error)
			// Don't throw - extension should continue to work even if bundled instructions fail
		}
	}

	/**
	 * Copy bundled instructions from extension to global storage
	 */
	private async copyBundledToGlobal(): Promise<void> {
		try {
			// Remove existing bundled instructions if they exist
			const bundledInGlobal = path.join(this.globalStoragePath, "bundled")
			if (await directoryExists(bundledInGlobal)) {
				await fs.rm(bundledInGlobal, { recursive: true, force: true })
			}

			// Create bundled directory in global storage
			await fs.mkdir(bundledInGlobal, { recursive: true })

			// Copy all files from bundled path to global storage
			await this.copyDirectory(this.bundledPath, bundledInGlobal)

			// Update version marker
			await this.updateVersionMarker()

			console.log("Successfully copied bundled instructions to global storage")
		} catch (error) {
			console.error("Failed to copy bundled instructions:", error)
			throw error
		}
	}

	/**
	 * Check if bundled instructions need to be updated
	 */
	private async checkForUpdates(): Promise<boolean> {
		try {
			const bundledInGlobal = path.join(this.globalStoragePath, "bundled")

			// If bundled directory doesn't exist in global storage, need to copy
			if (!(await directoryExists(bundledInGlobal))) {
				return true
			}

			// Check version marker
			const versionFile = path.join(this.globalStoragePath, ".bundled-version")
			const currentVersion = this.context.extension.packageJSON.version

			if (!(await fileExists(versionFile))) {
				return true
			}

			const storedVersion = await fs.readFile(versionFile, "utf-8")
			return storedVersion.trim() !== currentVersion
		} catch (error) {
			console.error("Error checking for updates:", error)
			// On error, assume we should copy to be safe
			return true
		}
	}

	/**
	 * Update the version marker file
	 */
	private async updateVersionMarker(): Promise<void> {
		try {
			const versionFile = path.join(this.globalStoragePath, ".bundled-version")
			const currentVersion = this.context.extension.packageJSON.version
			await fs.writeFile(versionFile, currentVersion, "utf-8")
		} catch (error) {
			console.error("Failed to update version marker:", error)
		}
	}

	/**
	 * Get the path to bundled instructions for a specific mode
	 */
	async getBundledInstructionPath(mode: string): Promise<string> {
		const bundledInGlobal = path.join(this.globalStoragePath, "bundled")
		return path.join(bundledInGlobal, `rules-${mode}`)
	}

	/**
	 * Get the path to generic bundled instructions (rules directory)
	 */
	async getBundledGenericInstructionPath(): Promise<string> {
		const bundledInGlobal = path.join(this.globalStoragePath, "bundled")
		return path.join(bundledInGlobal, "rules")
	}

	/**
	 * Get list of instruction files for a specific mode
	 */
	async getInstructionFiles(mode: string): Promise<string[]> {
		try {
			const modePath = await this.getBundledInstructionPath(mode)
			if (!(await directoryExists(modePath))) {
				return []
			}

			const files = await fs.readdir(modePath)
			return files.filter((file) => file.endsWith(".md") || file.endsWith(".xml"))
		} catch (error) {
			console.error(`Failed to get instruction files for mode ${mode}:`, error)
			return []
		}
	}

	/**
	 * Copy a directory recursively
	 */
	private async copyDirectory(src: string, dest: string): Promise<void> {
		const entries = await fs.readdir(src, { withFileTypes: true })

		for (const entry of entries) {
			const srcPath = path.join(src, entry.name)
			const destPath = path.join(dest, entry.name)

			if (entry.isDirectory()) {
				await fs.mkdir(destPath, { recursive: true })
				await this.copyDirectory(srcPath, destPath)
			} else {
				await fs.copyFile(srcPath, destPath)
			}
		}
	}

	/**
	 * Check if bundled instructions are available
	 */
	async isBundledInstructionsAvailable(): Promise<boolean> {
		try {
			const bundledInGlobal = path.join(this.globalStoragePath, "bundled")
			return await directoryExists(bundledInGlobal)
		} catch (error) {
			console.error("Error checking bundled instructions availability:", error)
			return false
		}
	}
}

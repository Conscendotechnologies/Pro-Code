import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from "vscode"

import { BundledInstructionsManager } from "../bundled-instructions-manager"

// Mock vscode module
vi.mock("vscode", () => ({
	default: {},
}))

// Mock fs/promises
vi.mock("fs/promises", () => ({
	mkdir: vi.fn(),
	readFile: vi.fn(),
	writeFile: vi.fn(),
	copyFile: vi.fn(),
	readdir: vi.fn(),
	rm: vi.fn(),
}))

// Mock roo-config service
vi.mock("../../services/roo-config", () => ({
	getGlobalRooDirectory: vi.fn(() => "/mock/home/.roo"),
	directoryExists: vi.fn(),
	fileExists: vi.fn(),
}))

const mockFs = vi.mocked(fs)
const mockContext = {
	extensionPath: "/mock/extension",
	extension: {
		packageJSON: {
			version: "1.0.0",
		},
	},
} as any as vscode.ExtensionContext

describe("BundledInstructionsManager", () => {
	let manager: BundledInstructionsManager

	beforeEach(() => {
		vi.clearAllMocks()
		manager = new BundledInstructionsManager(mockContext)
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe("constructor", () => {
		it("should initialize with correct paths", () => {
			expect(manager).toBeDefined()
			// Internal paths are private, but we can test the constructor doesn't throw
		})
	})

	describe("initializeBundledInstructions", () => {
		it("should handle missing bundled instructions gracefully", async () => {
			const { directoryExists } = await import("../../services/roo-config")
			vi.mocked(directoryExists).mockResolvedValue(false)

			// Should not throw even when bundled instructions are missing
			await expect(manager.initializeBundledInstructions()).resolves.not.toThrow()
		})

		it("should initialize when bundled instructions exist", async () => {
			const { directoryExists, fileExists } = await import("../../services/roo-config")
			vi.mocked(directoryExists).mockResolvedValue(true)
			vi.mocked(fileExists).mockResolvedValue(false) // No version file exists

			mockFs.mkdir.mockResolvedValue(undefined)
			mockFs.readdir.mockResolvedValue([])
			mockFs.writeFile.mockResolvedValue(undefined)

			await expect(manager.initializeBundledInstructions()).resolves.not.toThrow()
			expect(mockFs.mkdir).toHaveBeenCalled()
		})
	})

	describe("getBundledInstructionPath", () => {
		it("should return correct path for mode", async () => {
			const result = await manager.getBundledInstructionPath("code")
			expect(result).toBe(path.join("/mock/home/.roo", "bundled", "rules-code"))
		})
	})

	describe("getBundledGenericInstructionPath", () => {
		it("should return correct path for generic rules", async () => {
			const result = await manager.getBundledGenericInstructionPath()
			expect(result).toBe(path.join("/mock/home/.roo", "bundled", "rules"))
		})
	})

	describe("getInstructionFiles", () => {
		it("should return empty array when directory doesn't exist", async () => {
			const { directoryExists } = await import("../../services/roo-config")
			vi.mocked(directoryExists).mockResolvedValue(false)

			const result = await manager.getInstructionFiles("code")
			expect(result).toEqual([])
		})

		it("should return filtered file list when directory exists", async () => {
			const { directoryExists } = await import("../../services/roo-config")
			vi.mocked(directoryExists).mockResolvedValue(true)
			mockFs.readdir.mockResolvedValue(["rule1.md", "rule2.xml", "ignore.txt", "rule3.md"] as any)

			const result = await manager.getInstructionFiles("code")
			expect(result).toEqual(["rule1.md", "rule2.xml", "rule3.md"])
		})
	})

	describe("isBundledInstructionsAvailable", () => {
		it("should return true when bundled instructions are available", async () => {
			const { directoryExists } = await import("../../services/roo-config")
			vi.mocked(directoryExists).mockResolvedValue(true)

			const result = await manager.isBundledInstructionsAvailable()
			expect(result).toBe(true)
		})

		it("should return false when bundled instructions are not available", async () => {
			const { directoryExists } = await import("../../services/roo-config")
			vi.mocked(directoryExists).mockResolvedValue(false)

			const result = await manager.isBundledInstructionsAvailable()
			expect(result).toBe(false)
		})

		it("should return false on error", async () => {
			const { directoryExists } = await import("../../services/roo-config")
			vi.mocked(directoryExists).mockRejectedValue(new Error("Test error"))

			const result = await manager.isBundledInstructionsAvailable()
			expect(result).toBe(false)
		})
	})
})

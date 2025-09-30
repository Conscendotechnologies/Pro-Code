import fs from "fs/promises"
import path from "path"
import { Mode } from "../../../shared/modes"
import { fileExistsAtPath } from "../../../utils/fs"

export type PromptVariables = {
	workspace?: string
	extensionPath?: string
	globalStoragePath?: string
	mode?: string
	language?: string
	shell?: string
	operatingSystem?: string
}

function interpolatePromptContent(content: string, variables: PromptVariables): string {
	let interpolatedContent = content
	for (const key in variables) {
		if (
			Object.prototype.hasOwnProperty.call(variables, key) &&
			variables[key as keyof PromptVariables] !== undefined
		) {
			const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g")
			interpolatedContent = interpolatedContent.replace(placeholder, variables[key as keyof PromptVariables]!)
		}
	}
	return interpolatedContent
}

/**
 * Safely reads a file, returning an empty string if the file doesn't exist
 */
async function safeReadFile(filePath: string): Promise<string> {
	try {
		const fileExists = await fileExistsAtPath(filePath)
		console.log("File exists at path:", fileExists)
		const content = await fs.readFile(filePath, "utf-8")
		// When reading with "utf-8" encoding, content should be a string
		return content.trim()
	} catch (err) {
		console.error("Error reading file:", err)
		const errorCode = (err as NodeJS.ErrnoException).code
		if (!errorCode || !["ENOENT", "EISDIR"].includes(errorCode)) {
			throw err
		}
		return ""
	}
}

/**
 * Get the path to a system prompt file for a specific mode
 */
export function getSystemPromptFilePath(indexPath: string): string {
	return path.join(indexPath, "..", ".roo-index", `index.txt`)
}

/**
 * Loads custom system prompt from a file at .roo/system-prompt-[mode slug]
 * If the file doesn't exist, returns an empty string
 */
export async function loadCustomPromptIndexFile(cwd: string, variables: PromptVariables): Promise<string> {
	const filePath = getSystemPromptFilePath(variables.extensionPath || "")
	console.log("Looking for custom prompt index file at:", filePath)
	console.log("With variables:", variables)

	const rawContent = await safeReadFile(filePath)
	if (!rawContent) {
		console.log("No custom prompt index file found.")
		return ""
	}
	console.log("Custom prompt index file content loaded:", rawContent)
	const interpolatedContent = interpolatePromptContent(rawContent, variables)
	console.log("Loaded custom prompt index content:", interpolatedContent)

	return `**IMPORTANT: This is index information to help you complete your tasks.
	**Rules for using instructions:**  
	1. When a user makes a request, first identify the task type
	 Must use the 'read_file' tool to access the instruction to complete the task.\n\n
	 Do **not** attempt to complete the task without first reading the related instruction file.  
	 Always follow the steps and format provided in the instruction file to complete the task.  
	NOTE: Pass the globalStoragePath(${variables.globalStoragePath}) in the read_file tool to access the instruction files. \n\n
	Instruction are located in this location: ${variables.globalStoragePath}/instructions. \n\n
	NOTE: To complete the task from code mode you have to read the instruction file using the read_file tool.
	this is the example file structure inside instructions folder: \n\n
	instructions/\n
	├── meta/\n
	│   ├── extraction-info.json\n
	│   ├── version-info.json\n
	├── modes/\n
	│   ├── code/\n
	│   │   ├── code-assistant.md\n
	|___index.json\n
	|___index.txt\n

	Custom Prompts Index:\n
	${interpolatedContent}`
}

/**
 * Ensures the .roo directory exists, creating it if necessary
 */
export async function ensureRooDirectory(cwd: string): Promise<void> {
	const rooDir = path.join(cwd, ".roo--index")

	// Check if directory already exists
	if (await fileExistsAtPath(rooDir)) {
		return
	}

	// Create the directory
	try {
		await fs.mkdir(rooDir, { recursive: true })
	} catch (err) {
		// If directory already exists (race condition), ignore the error
		const errorCode = (err as NodeJS.ErrnoException).code
		if (errorCode !== "EEXIST") {
			throw err
		}
	}
}

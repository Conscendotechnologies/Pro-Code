import path from "path"
import os from "os"

import * as vscode from "vscode"

export async function getPreTaskDetails(globalStorageUri: vscode.Uri | undefined, includeFileDetails: boolean = false) {
	console.log("Getting pre-task details...")
	console.log(`Global Storage URI: ${globalStorageUri}`)

	let preTask = "<pre-task>"
	if (globalStorageUri) {
		preTask += `\n\n# Root Path: ${globalStorageUri.fsPath}/instructions\n\n`
		preTask += `Note: check the environment details for more information about the root path and folder structure.\n\n`
		preTask += `Note: use absolute paths when referencing files.\n\n`
		const preTaskFilePath = path.join(globalStorageUri.fsPath, "instructions", "index.txt")
		try {
			preTask += `Use the below indexs to find relevant instructions file location for your task. and read the instructions to complete the task.\n\n`
			preTask += `# Custom Instructions Indexs: \n\n`
			const preTaskFileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(preTaskFilePath))
			preTask += Buffer.from(preTaskFileContent).toString("utf-8").trim()
		} catch (error) {
			// If the file doesn't exist or can't be read, we simply return an empty string
			console.warn(`Could not read pre-task file at ${preTaskFilePath}:`, error)
		}
	}
	preTask += `</pre-task>`
	return preTask
}

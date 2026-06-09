import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import { GlobalFileNames } from "../../../shared/globalFileNames"

async function loadPmdInstruction(
	context: vscode.ExtensionContext | undefined,
	instructionFilePath: string,
): Promise<string> {
	if (!context) return ""
	const p = path.join(context.globalStorageUri.fsPath, "instructions/modes/", instructionFilePath)
	try {
		const c = await fs.readFile(p, "utf-8")
		return c.trim() || ""
	} catch {
		return ""
	}
}
export async function pmdApexInstructions(c: vscode.ExtensionContext | undefined) {
	return loadPmdInstruction(c, GlobalFileNames.pmdApexInstructions)
}
export async function pmdHtmlInstructions(c: vscode.ExtensionContext | undefined) {
	return loadPmdInstruction(c, GlobalFileNames.pmdHtmlInstructions)
}
export async function pmdJavaScriptInstructions(c: vscode.ExtensionContext | undefined) {
	return loadPmdInstruction(c, GlobalFileNames.pmdJavaScriptInstructions)
}
export async function pmdVisualforceInstructions(c: vscode.ExtensionContext | undefined) {
	return loadPmdInstruction(c, GlobalFileNames.pmdVisualforceInstructions)
}
export async function pmdXmlInstructions(c: vscode.ExtensionContext | undefined) {
	return loadPmdInstruction(c, GlobalFileNames.pmdXmlInstructions)
}

import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import { GlobalFileNames } from "../../../shared/globalFileNames"

async function loadSalesforceInstruction(
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
export async function assignmentRulesInstructions(c: vscode.ExtensionContext | undefined) {
	return loadSalesforceInstruction(c, GlobalFileNames.assignmentRulesInstructions)
}
export async function customFieldInstructions(c: vscode.ExtensionContext | undefined) {
	return loadSalesforceInstruction(c, GlobalFileNames.customFieldInstructions)
}
export async function customObjectInstructions(c: vscode.ExtensionContext | undefined) {
	return loadSalesforceInstruction(c, GlobalFileNames.customObjectInstructions)
}
export async function fieldPermissionsInstructions(c: vscode.ExtensionContext | undefined) {
	return loadSalesforceInstruction(c, GlobalFileNames.fieldPermissionsInstructions)
}
export async function objectPermissionsInstructions(c: vscode.ExtensionContext | undefined) {
	return loadSalesforceInstruction(c, GlobalFileNames.objectPermissionsInstructions)
}
export async function pathCreationInstructions(c: vscode.ExtensionContext | undefined) {
	return loadSalesforceInstruction(c, GlobalFileNames.pathCreationInstructions)
}
export async function profileInstructions(c: vscode.ExtensionContext | undefined) {
	return loadSalesforceInstruction(c, GlobalFileNames.profileInstructions)
}
export async function recordTypesInstructions(c: vscode.ExtensionContext | undefined) {
	return loadSalesforceInstruction(c, GlobalFileNames.recordTypesInstructions)
}
export async function roleCreationInstructions(c: vscode.ExtensionContext | undefined) {
	return loadSalesforceInstruction(c, GlobalFileNames.roleCreationInstructions)
}
export async function validationRulesInstructions(c: vscode.ExtensionContext | undefined) {
	return loadSalesforceInstruction(c, GlobalFileNames.validationRulesInstructions)
}

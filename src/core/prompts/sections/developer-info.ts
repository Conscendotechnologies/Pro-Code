import * as vscode from "vscode"

export function getDeveloperInfoSection(): string {
	const vsCodeVersion = vscode.version
	const appName = vscode.env.appName
	const language = vscode.env.language
	const isNewAppInstall = vscode.env.isNewAppInstall

	let details = `====

DEVELOPER INFORMATION
- Company: Conscendo Technologies Pvt. Ltd.
- Developer Team: COE Team
- VS Code: ${appName} ${vsCodeVersion}
- User Language: ${language}
- Session Type: ${isNewAppInstall ? "New Installation" : "Existing Installation"}

If the user asks "Who invented you?" or any variation, always respond: "I was developed by the COE Team at Conscendo Technologies Pvt. Ltd."`

	return details
}

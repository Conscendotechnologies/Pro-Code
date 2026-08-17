import React, { useMemo } from "react"
import { ClineMessage } from "@siid-code/types"
import { ClineSayTool } from "@roo/ExtensionMessage"
import { vscode } from "../../utils/vscode"
import { StandardTooltip } from "../ui"

interface ActiveFileIndicatorProps {
	messages: ClineMessage[]
	isStreaming: boolean
}

function safeJsonParse<T>(text?: string): T | null {
	if (!text) return null
	try {
		return JSON.parse(text) as T
	} catch {
		return null
	}
}

export const ActiveFileIndicator: React.FC<ActiveFileIndicatorProps> = ({ messages, isStreaming }) => {
	const activeFile = useMemo(() => {
		if (!isStreaming || messages.length === 0) return null

		// Look backwards for the most recent tool operation
		for (let i = messages.length - 1; i >= 0; i--) {
			const message = messages[i]

			if (message.ask === "tool" || message.say === "tool") {
				const tool = safeJsonParse<ClineSayTool>(message.text)
				if (!tool) continue

				// Handle file-specific tools
				let filePath = ""
				let action = ""

				switch (tool.tool) {
					case "readFile":
						filePath = tool.path || ""
						action = "Reading"
						break
					case "appliedDiff":
					case "editedExistingFile":
					case "insertContent":
					case "searchAndReplace":
					case "newFileCreated":
						filePath = tool.path || ""
						action = tool.diff ? "Modifying" : "Editing"
						if (tool.tool === "newFileCreated") {
							action = "Writing to"
						}
						break
					case "listCodeDefinitionNames":
					case "searchFiles":
					case "codebaseSearch":
					case "listFilesTopLevel":
					case "listFilesRecursive":
						filePath = tool.path || (tool as any).directory || ""
						action = "Searching in"
						break
					default:
						continue
				}

				if (filePath) {
					// Extract filename cross-platform
					const parts = filePath.split("/")
					const backslashParts = (parts[parts.length - 1] || "").split("\\")
					const fileName = backslashParts[backslashParts.length - 1] || filePath
					return { path: filePath, fileName, action }
				}
			}
		}

		return null
	}, [messages, isStreaming])

	if (!activeFile) return null

	const handleOpenFile = () => {
		vscode.postMessage({ type: "openFile", text: activeFile.path })
	}

	const fileExt = activeFile.fileName.includes(".") ? activeFile.fileName.split(".").pop() || "" : ""

	let iconClass = "codicon-file"
	if (fileExt === "ts" || fileExt === "tsx") iconClass = "codicon-symbol-misc"
	else if (fileExt === "js" || fileExt === "jsx") iconClass = "codicon-symbol-misc"
	else if (fileExt === "json") iconClass = "codicon-json"
	else if (fileExt === "md") iconClass = "codicon-markdown"
	else if (fileExt === "css" || fileExt === "scss") iconClass = "codicon-symbol-color"

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				position: "absolute",
				top: "-36px",
				left: 0,
				right: 0,
				zIndex: 10,
				pointerEvents: "none",
			}}>
			<StandardTooltip content={`${activeFile.action} ${activeFile.path}\nClick to open`}>
				<div
					onClick={handleOpenFile}
					style={{
						display: "flex",
						alignItems: "center",
						gap: "6px",
						padding: "4px 10px",
						backgroundColor: "var(--vscode-badge-background)",
						color: "var(--vscode-badge-foreground)",
						borderRadius: "12px",
						fontSize: "11px",
						boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
						cursor: "pointer",
						pointerEvents: "auto",
						border: "1px solid var(--vscode-contrastBorder, transparent)",
						transition: "all 0.2s ease",
						animation: "fadeIn 0.3s ease",
					}}
					className="active-file-indicator hover:opacity-80">
					<span
						className={`codicon codicon-sync codicon-modifier-spin`}
						style={{ fontSize: "12px", opacity: 0.8 }}
					/>
					<span className={`codicon ${iconClass}`} style={{ fontSize: "12px" }} />
					<span
						style={{
							fontFamily: "var(--vscode-editor-font-family)",
							maxWidth: "200px",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}>
						{activeFile.action} <strong>{activeFile.fileName}</strong>
					</span>
				</div>
			</StandardTooltip>
			<style>
				{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}
			</style>
		</div>
	)
}

export default ActiveFileIndicator

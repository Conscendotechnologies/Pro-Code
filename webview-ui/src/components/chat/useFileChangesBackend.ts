/**
 * File changes for the current task, sourced from the extension's shadow git
 * repo. The extension pushes an update whenever a checkpoint is saved, so this
 * only needs to request an initial list when the task changes.
 */

import { useState, useEffect } from "react"
import { vscode } from "@src/utils/vscode"
import type { FileChange } from "./FileChanges"

export const useFileChangesBackend = (taskId?: string): { files: FileChange[] } => {
	const [files, setFiles] = useState<FileChange[]>([])

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === "fileChanges") {
				const next = event.data.fileChanges ?? []
				// The panel is hidden entirely when this is empty, so an empty
				// push and a missing push look identical on screen.
				console.debug(`[fileChanges] received ${next.length} file(s)`, next)
				setFiles(next)
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [])

	useEffect(() => {
		// Clear immediately so the previous task's files don't linger while the
		// new list is in flight.
		setFiles([])

		if (taskId) {
			console.debug(`[fileChanges] requesting for task ${taskId}`)
			vscode.postMessage({ type: "getFileChanges", text: taskId })
		} else {
			console.debug("[fileChanges] no taskId - panel will stay hidden")
		}
	}, [taskId])

	return { files }
}

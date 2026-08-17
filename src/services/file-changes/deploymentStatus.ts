export type DeploymentStatus = "local" | "dry-run" | "deploying" | "deployed" | "failed"

export type DeploymentState = { status: DeploymentStatus; error?: string }

/**
 * Per-task deployment status for files pushed to a Salesforce org.
 *
 * This is the one piece of file-change state git cannot derive: whether a file
 * reached the org is org state, not workspace state. Everything else (which
 * files changed, +/- counts) comes from the shadow git repo.
 *
 * ponytail: in-memory only, so status is lost on window reload - the file list
 * and line counts still come from git, only the badge disappears. Persist to
 * <globalStorage>/tasks/<taskId>/deploy-status.json if that turns out to matter.
 */
const byTask = new Map<string, Map<string, DeploymentState>>()

const forTask = (taskId: string) => {
	let files = byTask.get(taskId)

	if (!files) {
		files = new Map()
		byTask.set(taskId, files)
	}

	return files
}

export const setDeploymentStatus = (
	taskId: string,
	filePaths: string[],
	status: DeploymentStatus,
	error?: string,
): void => {
	const files = forTask(taskId)

	for (const filePath of filePaths) {
		files.set(filePath, { status, error })
	}
}

export const getDeploymentStatuses = (taskId: string): Map<string, DeploymentState> => byTask.get(taskId) ?? new Map()

/** Paths currently in the given status - used to advance dry-run -> deploying -> failed. */
export const getPathsWithStatus = (taskId: string, status: DeploymentStatus): string[] =>
	Array.from(forTask(taskId).entries())
		.filter(([, state]) => state.status === status)
		.map(([filePath]) => filePath)

export const clearDeploymentStatuses = (taskId: string): void => {
	byTask.delete(taskId)
}

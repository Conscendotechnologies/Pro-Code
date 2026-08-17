import * as diff from "diff"

/**
 * Calculate the number of lines added and removed in a diff
 * @param diff - The diff content (unified diff format)
 * @returns Object with linesAdded and linesRemoved counts
 */
export function calculateDiffStats(diff: string | undefined): { linesAdded: number; linesRemoved: number } {
	if (!diff) {
		return { linesAdded: 0, linesRemoved: 0 }
	}

	let linesAdded = 0
	let linesRemoved = 0

	// Split diff into lines
	const lines = diff.split("\n")

	for (const line of lines) {
		// Lines starting with '+' (but not '+++') are additions
		if (line.startsWith("+") && !line.startsWith("+++")) {
			linesAdded++
		}
		// Lines starting with '-' (but not '---') are deletions
		else if (line.startsWith("-") && !line.startsWith("---")) {
			linesRemoved++
		}
	}

	return { linesAdded, linesRemoved }
}

/**
 * Count added/removed lines between two versions of a file.
 *
 * Use this when you have the before/after content rather than a unified diff.
 * calculateDiffStats can't be used on a SEARCH/REPLACE block - those have no
 * +/- prefixes, so every count comes back zero.
 */
export function countContentChanges(before: string, after: string): { linesAdded: number; linesRemoved: number } {
	let linesAdded = 0
	let linesRemoved = 0

	for (const part of diff.diffLines(before, after)) {
		if (part.added) {
			linesAdded += part.count || 0
		} else if (part.removed) {
			linesRemoved += part.count || 0
		}
	}

	return { linesAdded, linesRemoved }
}

/**
 * Format diff stats as a string like "+23 -45"
 * @param linesAdded - Number of lines added
 * @param linesRemoved - Number of lines removed
 * @returns Formatted string
 */
export function formatDiffStats(linesAdded: number, linesRemoved: number): string {
	return `+${linesAdded} -${linesRemoved}`
}

/**
 * Get formatted diff stats from diff content
 * @param diff - The diff content
 * @returns Formatted string like "+23 -45"
 */
export function getDiffStats(diff: string | undefined): string {
	const { linesAdded, linesRemoved } = calculateDiffStats(diff)
	return formatDiffStats(linesAdded, linesRemoved)
}

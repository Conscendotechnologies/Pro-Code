import * as path from "path"
import * as fs from "fs/promises"
import { SalesforceGraphEngine, DmlEvent, GraphNode } from "./salesforce-graph"

export const OOE_STEPS = [
	{ step: 3, label: "System validation (required, format, length)", phase: "sync" },
	{ step: 4, label: "Before-save record-triggered flows", phase: "sync" },
	{ step: 5, label: "Before triggers", phase: "sync" },
	{ step: 6, label: "System validation again + custom validation rules", phase: "sync" },
	{ step: 7, label: "Duplicate rules", phase: "sync" },
	{ step: 8, label: "Save to database (uncommitted)", phase: "sync" },
	{ step: 9, label: "After triggers", phase: "sync" },
	{ step: 10, label: "Assignment rules", phase: "sync" },
	{ step: 11, label: "Auto-response rules", phase: "sync" },
	{ step: 12, label: "Workflow rules & Process Builder", phase: "sync" },
	{ step: 13, label: "Workflow field-update re-entry (before/after triggers re-run once)", phase: "sync" },
	{ step: 14, label: "After-save record-triggered flows", phase: "sync" },
	{ step: 15, label: "Escalation rules", phase: "sync" },
	{ step: 16, label: "Entitlement rules", phase: "sync" },
	{ step: 17, label: "Roll-up summary recalculation", phase: "sync" },
	{ step: 19, label: "Criteria-based sharing evaluation", phase: "sync" },
	{ step: 20, label: "COMMIT (Transaction boundary)", phase: "commit" },
	{ step: 21, label: "Post-commit async jobs & platform events", phase: "post-commit" },
] as const

export interface TimelineEntry {
	step: number
	stageLabel: string
	node: GraphNode
	isUnorderedPeer?: boolean
	order?: number
}

export interface TimelineResult {
	objectApiName: string
	event: DmlEvent
	entries: TimelineEntry[]
	summary: string
}

export interface ConflictFinding {
	objectApiName: string
	event: DmlEvent
	fieldName: string
	nodeA: GraphNode
	stepA: number
	nodeB: GraphNode
	stepB: number
	stepDistance: number
	description: string
}

export interface LifecycleStep {
	step: number
	stageLabel: string
	action: "WRITE" | "READ"
	node: GraphNode
}

export interface FieldLifecycleResult {
	objectApiName: string
	fieldName: string
	event: DmlEvent
	steps: LifecycleStep[]
	summary: string
}

export interface RecursionFinding {
	objectApiName: string
	node: GraphNode
	step: number
	isUnbounded: boolean
	reason: string
}

export interface GovernorSurfaceResult {
	objectApiName: string
	event: DmlEvent
	totalSoqlCount: number
	totalDmlCount: number
	hasLoopedQueries: boolean
	nodesWithLoopedQueries: string[]
	summary: string
}

/**
 * Calculates the canonical Order of Execution timeline for an SObject and DML event.
 */
export function getTransactionTimeline(
	graph: SalesforceGraphEngine,
	objectApiName: string,
	event: DmlEvent = "update",
	candidateNodes?: GraphNode[],
): TimelineResult {
	const targetObj = objectApiName.toLowerCase()
	const sourceNodes = candidateNodes || Array.from(graph.getNodes().values())
	const matchingNodes: GraphNode[] = []

	for (const node of sourceNodes) {
		if (!node.txn) continue
		if (node.txn.objectApiName.toLowerCase() !== targetObj) continue

		if (node.txn.dmlEvents.length === 0 || node.txn.dmlEvents.includes(event)) {
			matchingNodes.push(node)
		}
	}

	const entries: TimelineEntry[] = []

	for (const node of matchingNodes) {
		const steps = node.txn?.executionSteps || []
		for (const stepNum of steps) {
			const ooe = OOE_STEPS.find((s) => s.step === stepNum)
			const stageLabel = ooe ? ooe.label : `Step ${stepNum}`

			entries.push({
				step: stepNum,
				stageLabel,
				node,
				order: node.txn?.triggerOrder,
			})
		}
	}

	// Sort timeline entries by step number, then triggerOrder, then node name
	entries.sort((a, b) => {
		if (a.step !== b.step) return a.step - b.step
		if (a.order !== undefined && b.order !== undefined) return a.order - b.order
		return a.node.name.localeCompare(b.node.name)
	})

	// Detect peer Apex triggers in the same step (which are explicitly unordered by Salesforce)
	for (let i = 0; i < entries.length; i++) {
		const current = entries[i]
		if (current.node.type === "APEX_TRIGGER") {
			const peers = entries.filter((e) => e.step === current.step && e.node.type === "APEX_TRIGGER")
			if (peers.length > 1) {
				current.isUnorderedPeer = true
			}
		}
	}

	const summary = `Transaction Timeline for [${objectApiName}] on [${event.toUpperCase()}]: ${entries.length} automation steps firing.`

	return {
		objectApiName,
		event,
		entries,
		summary,
	}
}

/**
 * Detects automation field mutation conflicts across the save transaction (M10: widened distance window).
 */
export function detectFieldConflicts(
	graph: SalesforceGraphEngine,
	objectApiName: string,
	event: DmlEvent = "update",
): ConflictFinding[] {
	const timeline = getTransactionTimeline(graph, objectApiName, event)
	const findings: ConflictFinding[] = []

	const fieldMutationsMap = new Map<string, Array<{ node: GraphNode; step: number }>>()

	for (const entry of timeline.entries) {
		const mutates = entry.node.txn?.mutatesFields || []
		for (const f of mutates) {
			const normField = f.toLowerCase()
			if (!fieldMutationsMap.has(normField)) {
				fieldMutationsMap.set(normField, [])
			}
			fieldMutationsMap.get(normField)!.push({ node: entry.node, step: entry.step })
		}
	}

	for (const [field, mutators] of fieldMutationsMap.entries()) {
		if (mutators.length > 1) {
			for (let i = 0; i < mutators.length; i++) {
				for (let j = i + 1; j < mutators.length; j++) {
					const m1 = mutators[i]
					const m2 = mutators[j]
					if (m1.node.id === m2.node.id) continue // Exclude a trigger from conflicting with itself (B2/M10)

					const dist = Math.abs(m1.step - m2.step)
					findings.push({
						objectApiName,
						event,
						fieldName: field,
						nodeA: m1.node,
						stepA: m1.step,
						nodeB: m2.node,
						stepB: m2.step,
						stepDistance: dist,
						description: `Field Conflict on [${field}]: [${m1.node.name}] (Step ${m1.step}) and [${m2.node.name}] (Step ${m2.step}) both mutate this field (Step distance: ${dist}).`,
					})
				}
			}
		}
	}

	return findings
}

/**
 * Traces the lifecycle (ordered reads & writes) of a specific field across the save pipeline (M5).
 */
export function traceFieldLifecycle(
	graph: SalesforceGraphEngine,
	objectApiName: string,
	fieldName: string,
	event: DmlEvent = "update",
): FieldLifecycleResult {
	const fullField = fieldName.includes(".") ? fieldName.toLowerCase() : `${objectApiName}.${fieldName}`.toLowerCase()
	const timeline = getTransactionTimeline(graph, objectApiName, event)
	const steps: LifecycleStep[] = []

	for (const entry of timeline.entries) {
		const mutates = (entry.node.txn?.mutatesFields || []).map((f) => f.toLowerCase())
		const reads = (entry.node.txn?.readsFields || []).map((f) => f.toLowerCase())

		if (mutates.includes(fullField)) {
			steps.push({ step: entry.step, stageLabel: entry.stageLabel, action: "WRITE", node: entry.node })
		}
		if (reads.includes(fullField)) {
			steps.push({ step: entry.step, stageLabel: entry.stageLabel, action: "READ", node: entry.node })
		}
	}

	return {
		objectApiName,
		fieldName,
		event,
		steps,
		summary: `Lifecycle trace for field [${fieldName}] on [${objectApiName}] (${event.toUpperCase()}): ${steps.length} operation(s) found across save pipeline.`,
	}
}

/**
 * Detects re-entry recursion risk (bounded vs unbounded) for an object (B4: fixed && logic).
 */
export function detectRecursion(
	graph: SalesforceGraphEngine,
	objectApiName: string,
	event: DmlEvent = "update",
): RecursionFinding[] {
	const timeline = getTransactionTimeline(graph, objectApiName, event)
	const findings: RecursionFinding[] = []

	for (const entry of timeline.entries) {
		const mutates = entry.node.txn?.mutatesFields || []
		const targetsSelfObject = mutates.some((f) => f.toLowerCase().startsWith(`${objectApiName.toLowerCase()}.`))

		// Fix B4: Must target self-object AND be in a re-entry step (Step 13 or 14)
		if (targetsSelfObject && (entry.step === 13 || entry.step === 14)) {
			const hasGuard =
				entry.node.txn?.recursionGuard === true || entry.node.txn?.requiresChangeToMeetCriteria === true
			const isUnbounded = !hasGuard

			findings.push({
				objectApiName,
				node: entry.node,
				step: entry.step,
				isUnbounded,
				reason: isUnbounded
					? `Unbounded re-entry risk: [${entry.node.name}] (Step ${entry.step}) mutates self-object fields without a static recursion guard or record change criteria.`
					: `Bounded re-entry loop: [${entry.node.name}] (Step ${entry.step}) mutates self-object fields but is protected by a static recursion guard or record change criteria.`,
			})
		}
	}

	return findings
}

/**
 * Calculates synchronous governor limit budgets (SOQL/DML) and detects loop violations across steps 3-19.
 */
export function getGovernorSurface(
	graph: SalesforceGraphEngine,
	objectApiName: string,
	event: DmlEvent = "update",
): GovernorSurfaceResult {
	const timeline = getTransactionTimeline(graph, objectApiName, event)
	let totalSoqlCount = 0
	let totalDmlCount = 0
	const loopedNodes = new Set<string>()
	const processedNodes = new Set<string>()

	for (const entry of timeline.entries) {
		if (entry.step <= 19 && !processedNodes.has(entry.node.id)) {
			processedNodes.add(entry.node.id)
			totalSoqlCount += entry.node.txn?.soqlCount || 0
			totalDmlCount += entry.node.txn?.dmlCount || 0
			if (entry.node.txn?.hasLoopedQuery) {
				loopedNodes.add(entry.node.name)
			}
		}
	}

	return {
		objectApiName,
		event,
		totalSoqlCount,
		totalDmlCount,
		hasLoopedQueries: loopedNodes.size > 0,
		nodesWithLoopedQueries: Array.from(loopedNodes),
		summary: `Governor Limit Budget for [${objectApiName}] on [${event.toUpperCase()}]: ${totalSoqlCount} SOQL queries, ${totalDmlCount} DML statements across synchronous save pipeline (Steps 3-19).`,
	}
}

/**
 * Renders markdown format for timeline results with M11 warning rendering.
 */
export function renderTransactionTimelineMarkdown(result: TimelineResult): string {
	let out = `=== ⏱️ Salesforce Order of Execution Timeline: [${result.objectApiName}] (${result.event.toUpperCase()}) ===\n`
	out += `${result.summary}\n\n`

	if (result.entries.length === 0) {
		out += `No automation registered for [${result.objectApiName}] on ${result.event}.\n`
	} else {
		let currentStep = -1
		for (const entry of result.entries) {
			if (entry.step !== currentStep) {
				currentStep = entry.step
				out += `\n📍 **Step ${entry.step} — ${entry.stageLabel}**\n`
			}

			const activeStr = entry.node.txn?.active === false ? " [INACTIVE/DRAFT]" : ""
			const peerStr = entry.isUnorderedPeer ? " ⚠️ [UNORDERED PEER TRIGGER]" : ""
			const invalidConfigStr = entry.node.metadata?.isInvalidConfig
				? ` ⚠️ [INVALID CONFIG: ${entry.node.metadata.configWarning}]`
				: ""
			const mutStr =
				entry.node.txn?.mutatesFields && entry.node.txn.mutatesFields.length > 0
					? ` (Mutates: ${entry.node.txn.mutatesFields.join(", ")})`
					: ""

			out += `   - [${entry.node.type}] **${entry.node.name}**${activeStr}${peerStr}${invalidConfigStr}${mutStr} (${entry.node.filePath})\n`
		}
	}

	out += `\n*Source: local SFDX metadata only. Managed-package automation, org-only automation, and inactive-version drift are not represented.*\n`
	return out
}

/**
 * Renders markdown format for conflict findings.
 */
export function renderFieldConflictsMarkdown(findings: ConflictFinding[], objectApiName: string): string {
	let out = `=== ⚠️ Field Mutation Conflicts: [${objectApiName}] ===\n`
	if (findings.length === 0) {
		out += `No field mutation conflicts detected for [${objectApiName}].\n`
	} else {
		out += `Found ${findings.length} field mutation conflict(s):\n\n`
		for (const f of findings) {
			out += `- **${f.fieldName}** (Step distance: ${f.stepDistance})\n`
			out += `  - Step ${f.stepA}: [${f.nodeA.type}] ${f.nodeA.name}\n`
			out += `  - Step ${f.stepB}: [${f.nodeB.type}] ${f.nodeB.name}\n`
			out += `  - Details: ${f.description}\n\n`
		}
	}
	return out
}

/**
 * Renders markdown format for field lifecycle traces.
 */
export function renderFieldLifecycleMarkdown(result: FieldLifecycleResult): string {
	let out = `=== 🔄 Field Lifecycle Trace: [${result.objectApiName}.${result.fieldName}] (${result.event.toUpperCase()}) ===\n`
	out += `${result.summary}\n\n`

	if (result.steps.length === 0) {
		out += `No read/write operations recorded for field [${result.fieldName}].\n`
	} else {
		for (const s of result.steps) {
			const actionBadge = s.action === "WRITE" ? "✏️ WRITE" : "📖 READ"
			out += `- Step ${s.step} (${s.stageLabel}) — ${actionBadge}: [${s.node.type}] **${s.node.name}** (${s.node.filePath})\n`
		}
	}

	return out
}

/**
 * Renders markdown format for recursion findings.
 */
export function renderRecursionMarkdown(findings: RecursionFinding[], objectApiName: string): string {
	let out = `=== 🔁 Save Pipeline Recursion Analysis: [${objectApiName}] ===\n`
	if (findings.length === 0) {
		out += `No re-entry recursion loops detected for [${objectApiName}].\n`
	} else {
		for (const f of findings) {
			const badge = f.isUnbounded ? "🚨 UNBOUNDED RECURSION RISK" : "✅ BOUNDED RE-ENTRY"
			out += `- **${badge}** at Step ${f.step}: [${f.node.type}] **${f.node.name}**\n`
			out += `  - ${f.reason}\n\n`
		}
	}
	return out
}

/**
 * Renders markdown format for governor surface results.
 */
export function renderGovernorSurfaceMarkdown(result: GovernorSurfaceResult): string {
	let out = `=== ⚖️ Synchronous Governor Limit Surface: [${result.objectApiName}] (${result.event.toUpperCase()}) ===\n`
	out += `${result.summary}\n\n`
	out += `📊 **Synchronous Totals (Steps 1-19)**:\n`
	out += `   - Cumulative SOQL Queries: **${result.totalSoqlCount}** / 100 limit\n`
	out += `   - Cumulative DML Statements: **${result.totalDmlCount}** / 150 limit\n`

	if (result.hasLoopedQueries) {
		out += `\n🚨 **GOVERNOR VIOLATION DETECTED**: SOQL/DML inside loops found in:\n`
		for (const n of result.nodesWithLoopedQueries) {
			out += `   - ⚠️ \`${n}\` contains SOQL or DML inside a for/while loop!\n`
		}
	} else {
		out += `\n✅ No SOQL/DML statement loop violations detected.\n`
	}

	return out
}

/**
 * Exports .siid-code/SALESFORCE_TRANSACTIONS.md artifact to disk with O(N) pre-grouped map iteration (H4).
 */
export async function exportTransactionIndex(graph: SalesforceGraphEngine, targetDir?: string): Promise<string> {
	const lines: string[] = ["# Salesforce Transaction Index & Order of Execution", ""]

	const objectNodesMap = new Map<string, GraphNode[]>()
	for (const node of graph.getNodes().values()) {
		if (node.txn?.objectApiName) {
			// Skip bare helper classes that don't belong to a real SObject timeline (H4)
			if (node.type === "APEX_CLASS" && (!node.txn.executionSteps || node.txn.executionSteps.length === 0)) {
				continue
			}

			const objKey = node.txn.objectApiName
			if (!objectNodesMap.has(objKey)) {
				objectNodesMap.set(objKey, [])
			}
			objectNodesMap.get(objKey)!.push(node)
		}
	}

	for (const objName of Array.from(objectNodesMap.keys()).sort()) {
		let hasEntriesForObject = false
		const objectSection: string[] = [`## SObject: ${objName}`]
		const candidates = objectNodesMap.get(objName)

		for (const evt of ["insert", "update", "delete"] as DmlEvent[]) {
			const timeline = getTransactionTimeline(graph, objName, evt, candidates)
			if (timeline.entries.length > 0) {
				hasEntriesForObject = true
				objectSection.push(`### Event: ${evt.toUpperCase()}`)
				for (const entry of timeline.entries) {
					const activeStr = entry.node.txn?.active === false ? " (Inactive)" : ""
					objectSection.push(
						`- **Step ${entry.step}** [${entry.node.type}] \`${entry.node.name}\`${activeStr}`,
					)
				}
				objectSection.push("")
			}
		}

		if (hasEntriesForObject) {
			lines.push(...objectSection)
		}
	}

	const output = lines.join("\n")

	if (targetDir) {
		try {
			const siidDir = path.join(targetDir, ".siid-code")
			await fs.mkdir(siidDir, { recursive: true })
			await fs.writeFile(path.join(siidDir, "SALESFORCE_TRANSACTIONS.md"), output, "utf-8")
		} catch (e) {
			// Fallback
		}
	}

	return output
}

/**
 * SalesforceGraphEngine — Object-Centric Interlinked Metadata Graph Engine.
 *
 * Constructs a 2-way graph network linking Objects <-> Fields <-> Apex <-> Triggers <-> Flows <-> LWCs <-> Security.
 * Enables GraphRAG traversal, blast-radius calculation, and governor-limit validation for the AI Agent.
 */

import * as path from "path"
import * as fs from "fs/promises"
import { XMLParser } from "fast-xml-parser"
import { indexAutomationFile } from "./salesforce-automation"

export type DmlEvent = "insert" | "update" | "delete" | "undelete"

export type NodeType =
	| "OBJECT"
	| "FIELD"
	| "APEX_CLASS"
	| "APEX_TRIGGER"
	| "FLOW"
	| "LWC"
	| "PERMISSION_SET"
	| "AGENTFORCE_TOPIC"
	| "VALIDATION_RULE"
	| "WORKFLOW_RULE"
	| "WORKFLOW_FIELD_UPDATE"
	| "DUPLICATE_RULE"
	| "ASSIGNMENT_RULE"
	| "AUTO_RESPONSE_RULE"
	| "ESCALATION_RULE"
	| "ENTITLEMENT_PROCESS"
	| "SHARING_RULE"
	| "ROLLUP_SUMMARY"
	| "ASYNC_JOB"
	| "PLATFORM_EVENT"

export interface TransactionAttrs {
	objectApiName: string
	dmlEvents: DmlEvent[]
	executionSteps: number[] // array — a trigger can be both before AND after
	isAsync?: boolean
	active?: boolean
	triggerOrder?: number
	requiresChangeToMeetCriteria?: boolean
	recursionGuard?: boolean
	mutatesFields?: string[]
	readsFields?: string[]
	soqlCount?: number
	dmlCount?: number
	hasLoopedQuery?: boolean
}

export interface GraphNode {
	id: string // Unique Key e.g. "Invoice__c" or "Invoice__c.Amount__c"
	type: NodeType
	name: string
	filePath: string
	metadata?: Record<string, any>
	txn?: TransactionAttrs
}

export interface GraphEdge {
	sourceId: string
	targetId: string
	relationship:
		| "HAS_FIELD"
		| "REFERENCES_OBJECT"
		| "QUERIES_OBJECT"
		| "UPDATES_OBJECT"
		| "CALLS_APEX"
		| "RUNS_ON_OBJECT"
		| "MUTATES_FIELD"
		| "READS_FIELD"
		| "ENQUEUES_ASYNC"
		| "PUBLISHES_EVENT"
		| "REENTERS"
}

export interface BlastRadiusResult {
	targetNode: GraphNode
	upstreamDependents: GraphNode[]
	downstreamDependencies: GraphNode[]
	summary: string
}

export class SalesforceGraphEngine {
	private static instances: Map<string, SalesforceGraphEngine> = new Map()

	private nodes: Map<string, GraphNode> = new Map()
	private edges: GraphEdge[] = []
	private edgeKeys: Set<string> = new Set()
	private outgoingAdjacency: Map<string, Set<GraphEdge>> = new Map()
	private incomingAdjacency: Map<string, Set<GraphEdge>> = new Map()
	private pendingApexCalls: Map<string, Set<string>> = new Map()
	private xmlParser: XMLParser

	private constructor() {
		this.xmlParser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: "@_",
		})
	}

	public static getInstance(workspaceRoot = "default"): SalesforceGraphEngine {
		const key = workspaceRoot.replace(/\\/g, "/").toLowerCase()
		if (!SalesforceGraphEngine.instances.has(key)) {
			SalesforceGraphEngine.instances.set(key, new SalesforceGraphEngine())
		}
		return SalesforceGraphEngine.instances.get(key)!
	}

	public clear(): void {
		this.nodes.clear()
		this.edges = []
		this.edgeKeys.clear()
		this.outgoingAdjacency.clear()
		this.incomingAdjacency.clear()
		this.pendingApexCalls.clear()
	}

	/**
	 * Second-pass resolution of CALLS_APEX edges for verified Apex classes
	 */
	public resolveApexCallEdges(): void {
		const knownClasses = new Set<string>()
		for (const node of this.nodes.values()) {
			if (node.type === "APEX_CLASS") {
				knownClasses.add(node.name.toLowerCase())
			}
		}

		for (const [caller, candidateCallees] of this.pendingApexCalls.entries()) {
			for (const callee of candidateCallees) {
				if (knownClasses.has(callee.toLowerCase())) {
					this.addEdge({ sourceId: caller, targetId: callee, relationship: "CALLS_APEX" })
				}
			}
		}
	}

	private rebuildAdjacencyAndEdgeKeys(): void {
		this.edgeKeys.clear()
		this.outgoingAdjacency.clear()
		this.incomingAdjacency.clear()

		for (const edge of this.edges) {
			const srcKey = edge.sourceId.toLowerCase()
			const tgtKey = edge.targetId.toLowerCase()
			const key = `${srcKey}:${tgtKey}:${edge.relationship}`
			this.edgeKeys.add(key)

			if (!this.outgoingAdjacency.has(srcKey)) this.outgoingAdjacency.set(srcKey, new Set())
			this.outgoingAdjacency.get(srcKey)!.add(edge)

			if (!this.incomingAdjacency.has(tgtKey)) this.incomingAdjacency.set(tgtKey, new Set())
			this.incomingAdjacency.get(tgtKey)!.add(edge)
		}
	}

	public deleteNodeAndEdges(nodeId: string): void {
		const key = nodeId.toLowerCase()
		this.nodes.delete(key)
		this.edges = this.edges.filter((e) => e.sourceId.toLowerCase() !== key && e.targetId.toLowerCase() !== key)
		this.rebuildAdjacencyAndEdgeKeys()
	}

	/**
	 * Aggregates call-chain metrics (SOQL/DML counts, looped queries, field mutations/reads) from Apex handlers onto Trigger entrypoints
	 */
	public aggregateCallChainMetrics(): void {
		for (const node of this.nodes.values()) {
			if (node.type !== "APEX_TRIGGER" || !node.txn) continue

			const triggerObj = node.txn.objectApiName
			const visited = new Set<string>()
			const queue: Array<{ id: string; depth: number }> = [{ id: node.id, depth: 0 }]
			visited.add(node.id.toLowerCase())

			let accumulatedSoql = node.txn.soqlCount || 0
			let accumulatedDml = node.txn.dmlCount || 0
			let hasLooped = node.txn.hasLoopedQuery || false
			let hasGuard = node.txn.recursionGuard || false
			const mutatesSet = new Set<string>(node.txn.mutatesFields || [])
			const readsSet = new Set<string>(node.txn.readsFields || [])

			while (queue.length > 0) {
				const current = queue.shift()!
				if (current.depth >= 5) continue

				const outgoing = this.outgoingAdjacency.get(current.id.toLowerCase())
				if (!outgoing) continue

				for (const edge of outgoing) {
					if (edge.relationship === "CALLS_APEX") {
						const calleeId = edge.targetId.toLowerCase()
						if (!visited.has(calleeId)) {
							visited.add(calleeId)
							const calleeNode = this.nodes.get(calleeId)
							if (calleeNode && calleeNode.txn) {
								accumulatedSoql += calleeNode.txn.soqlCount || 0
								accumulatedDml += calleeNode.txn.dmlCount || 0
								if (calleeNode.txn.hasLoopedQuery) hasLooped = true
								if (calleeNode.txn.recursionGuard) hasGuard = true

								if (calleeNode.txn.mutatesFields) {
									for (const m of calleeNode.txn.mutatesFields) {
										const qualified = m.includes(".") ? m : `${triggerObj}.${m}`
										mutatesSet.add(qualified)
									}
								}
								if (calleeNode.txn.readsFields) {
									for (const r of calleeNode.txn.readsFields) {
										const qualified = r.includes(".") ? r : `${triggerObj}.${r}`
										readsSet.add(qualified)
									}
								}

								// B5 Fix: Re-home AsyncJob / PlatformEvent nodes created by handler classes to the trigger's target object and clean edges (Items 4 & 5)
								const asyncKey = `AsyncJob:${calleeNode.name}`.toLowerCase()
								const eventKey = `PlatformEvent:${calleeNode.name}`.toLowerCase()

								if (this.nodes.has(asyncKey)) {
									const rehomedId = `AsyncJob:${triggerObj}.${calleeNode.name}`
									this.addNode({
										id: rehomedId,
										type: "ASYNC_JOB",
										name: `AsyncJob (${calleeNode.name})`,
										filePath: calleeNode.filePath,
										txn: {
											objectApiName: triggerObj,
											dmlEvents: ["insert", "update", "delete"],
											executionSteps: [21],
											isAsync: true,
										},
									})
									this.addEdge({
										sourceId: rehomedId,
										targetId: triggerObj,
										relationship: "RUNS_ON_OBJECT",
									})
									this.addEdge({
										sourceId: node.id,
										targetId: rehomedId,
										relationship: "ENQUEUES_ASYNC",
									})
									this.deleteNodeAndEdges(asyncKey)
								}

								if (this.nodes.has(eventKey)) {
									const rehomedId = `PlatformEvent:${triggerObj}.${calleeNode.name}`
									this.addNode({
										id: rehomedId,
										type: "PLATFORM_EVENT",
										name: `PlatformEvent (${calleeNode.name})`,
										filePath: calleeNode.filePath,
										txn: {
											objectApiName: triggerObj,
											dmlEvents: ["insert", "update", "delete"],
											executionSteps: [21],
											isAsync: true,
										},
									})
									this.addEdge({
										sourceId: rehomedId,
										targetId: triggerObj,
										relationship: "RUNS_ON_OBJECT",
									})
									this.addEdge({
										sourceId: node.id,
										targetId: rehomedId,
										relationship: "PUBLISHES_EVENT",
									})
									this.deleteNodeAndEdges(eventKey)
								}
							}
							queue.push({ id: edge.targetId, depth: current.depth + 1 })
						}
					}
				}
			}

			node.txn.soqlCount = accumulatedSoql
			node.txn.dmlCount = accumulatedDml
			node.txn.hasLoopedQuery = hasLooped
			node.txn.recursionGuard = hasGuard
			node.txn.mutatesFields = Array.from(mutatesSet)
			node.txn.readsFields = Array.from(readsSet)
		}
	}

	public addNode(node: GraphNode): void {
		this.nodes.set(node.id.toLowerCase(), node)
	}

	public hasNode(id: string): boolean {
		return this.nodes.has(id.toLowerCase())
	}

	public getNode(id: string): GraphNode | undefined {
		return this.nodes.get(id.toLowerCase())
	}

	public getNodes(): Map<string, GraphNode> {
		return this.nodes
	}

	public getEdges(): GraphEdge[] {
		return this.edges
	}

	public addEdge(edge: GraphEdge): void {
		const key = `${edge.sourceId.toLowerCase()}:${edge.targetId.toLowerCase()}:${edge.relationship}`
		if (this.edgeKeys.has(key)) return
		this.edgeKeys.add(key)
		this.edges.push(edge)

		const srcKey = edge.sourceId.toLowerCase()
		const tgtKey = edge.targetId.toLowerCase()

		if (!this.outgoingAdjacency.has(srcKey)) this.outgoingAdjacency.set(srcKey, new Set())
		this.outgoingAdjacency.get(srcKey)!.add(edge)

		if (!this.incomingAdjacency.has(tgtKey)) this.incomingAdjacency.set(tgtKey, new Set())
		this.incomingAdjacency.get(tgtKey)!.add(edge)

		// Implicit node creation: check case-insensitively using hasNode
		if (!this.hasNode(edge.targetId)) {
			this.addNode({
				id: edge.targetId,
				type: "OBJECT",
				name: edge.targetId,
				filePath: "(Implicit / External Object)",
			})
		}
	}

	public removeFile(filePath: string): void {
		const normalized = filePath.replace(/\\/g, "/").toLowerCase()
		const nodesToRemove: string[] = []

		for (const [key, node] of this.nodes.entries()) {
			if (node.filePath.replace(/\\/g, "/").toLowerCase() === normalized) {
				nodesToRemove.push(key)
			}
		}

		for (const key of nodesToRemove) {
			this.nodes.delete(key)
			this.outgoingAdjacency.delete(key)
			this.incomingAdjacency.delete(key)
		}

		this.edges = this.edges.filter(
			(e) =>
				!nodesToRemove.includes(e.sourceId.toLowerCase()) && !nodesToRemove.includes(e.targetId.toLowerCase()),
		)
		this.rebuildAdjacencyAndEdgeKeys()
	}

	/**
	 * Index a file into the Graph Engine
	 */
	public async indexFileForGraph(filePath: string, content: string): Promise<void> {
		const rawPath = filePath.replace(/\\/g, "/")
		const normalizedPath = rawPath.toLowerCase()

		if (normalizedPath.endsWith(".object-meta.xml")) {
			this.indexObjectXml(rawPath, content)
		} else if (normalizedPath.endsWith(".field-meta.xml")) {
			this.indexFieldXml(rawPath, content)
		} else if (normalizedPath.endsWith(".cls") || normalizedPath.endsWith(".trigger")) {
			this.indexApexCode(rawPath, content, normalizedPath.endsWith(".trigger"))
		} else if (normalizedPath.endsWith(".flow-meta.xml")) {
			this.indexFlowXml(rawPath, content)
		} else {
			indexAutomationFile(this, rawPath, content, this.xmlParser)
		}
	}

	private indexObjectXml(filePath: string, content: string): void {
		try {
			const parsed = this.xmlParser.parse(content)
			const root = parsed.CustomObject
			if (!root) return

			const objName = path.basename(filePath, ".object-meta.xml")
			const node: GraphNode = {
				id: objName,
				type: "OBJECT",
				name: objName,
				filePath,
				metadata: { label: root.label, sharingModel: root.sharingModel },
			}
			this.addNode(node)
		} catch (e) {
			// Fallback
		}
	}

	private indexFieldXml(filePath: string, content: string): void {
		try {
			const parsed = this.xmlParser.parse(content)
			const root = parsed.CustomField
			if (!root || !root.fullName) return

			const parts = filePath.replace(/\\/g, "/").split("/")
			const objIdx = parts.lastIndexOf("objects")
			const objName = objIdx !== -1 && parts[objIdx + 1] ? parts[objIdx + 1] : "Unknown"

			// Ensure object node exists
			if (!this.hasNode(objName)) {
				this.addNode({ id: objName, type: "OBJECT", name: objName, filePath: "(Implicit)" })
			}

			const fieldId = `${objName}.${root.fullName}`
			this.addNode({
				id: fieldId,
				type: "FIELD",
				name: root.fullName,
				filePath,
				metadata: { type: root.type, required: root.required === "true", referenceTo: root.referenceTo },
			})

			// Edge: Object HAS_FIELD Field
			this.addEdge({ sourceId: objName, targetId: fieldId, relationship: "HAS_FIELD" })
			// Edge: Field REFERENCES_OBJECT TargetObject
			if (root.referenceTo) {
				const targetObj = String(root.referenceTo)
				this.addEdge({ sourceId: fieldId, targetId: targetObj, relationship: "REFERENCES_OBJECT" })
			}

			// Roll-Up Summary Field (Step 17 in OOE) — recalculation fires on child object DML (Item 3)
			if (String(root.type) === "Summary") {
				const childObj = root.summaryForeignKey
					? String(root.summaryForeignKey).split(".")[0]
					: root.summaryTable
						? String(root.summaryTable)
						: objName

				const rollupNodeId = `Rollup:${childObj}.${root.fullName}`
				this.addNode({
					id: rollupNodeId,
					type: "ROLLUP_SUMMARY",
					name: `${root.fullName} (Rollup on ${objName})`,
					filePath,
					metadata: { parentObject: objName, childObject: childObj, summaryOperation: root.summaryOperation },
					txn: {
						objectApiName: childObj,
						dmlEvents: ["insert", "update", "delete", "undelete"],
						executionSteps: [17],
						active: true,
					},
				})
				this.addEdge({ sourceId: rollupNodeId, targetId: childObj, relationship: "RUNS_ON_OBJECT" })
			}
		} catch (e) {
			// Silent fallback
		}
	}

	private indexApexCode(filePath: string, content: string, isTrigger: boolean): void {
		const normalizedPath = filePath.replace(/\\/g, "/")
		const baseName = normalizedPath.split("/").pop() || filePath
		const className = baseName.replace(/\.(cls|trigger)$/i, "")
		const type: NodeType = isTrigger ? "APEX_TRIGGER" : "APEX_CLASS"

		const node: GraphNode = { id: className, type, name: className, filePath }

		// Strip block comments and inline comments
		const cleanCode = content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "")

		if (isTrigger) {
			const hdr = cleanCode.match(/^\s*trigger\s+(\w+)\s+on\s+(\w+)\s*\(([^)]*)\)/im)
			if (hdr) {
				const objectApiName = hdr[2]
				const steps = new Set<number>()
				const events = new Set<DmlEvent>()

				for (const ctx of hdr[3].split(",")) {
					const parts = ctx.trim().toLowerCase().split(/\s+/)
					const timing = parts[0]
					const evt = parts[1]

					if (timing === "before") steps.add(5)
					if (timing === "after") steps.add(9)
					if (evt) events.add(evt as DmlEvent)
				}

				node.txn = {
					objectApiName,
					dmlEvents: [...events],
					executionSteps: [...steps],
					active: true,
				}
				this.addEdge({ sourceId: className, targetId: objectApiName, relationship: "RUNS_ON_OBJECT" })
			}
		}

		if (!node.txn) {
			node.txn = {
				objectApiName: className,
				dmlEvents: ["insert", "update", "delete", "undelete"],
				executionSteps: [],
				active: true,
			}
		}

		this.addNode(node)

		// Extract SOQL query references with standard/custom/platform SObject validation and keyword exclusion (Item 1)
		const soqlRegex = /\bfrom\s+([a-zA-Z0-9_]+)\b/gi
		let match: RegExpExecArray | null
		while ((match = soqlRegex.exec(cleanCode)) !== null) {
			const targetObj = match[1]
			if (targetObj) {
				const lowerTgt = targetObj.toLowerCase()
				const isCustomOrPlatformObj =
					lowerTgt.endsWith("__c") ||
					lowerTgt.endsWith("__mdt") ||
					lowerTgt.endsWith("__e") ||
					lowerTgt.endsWith("__kav") ||
					lowerTgt.endsWith("__share") ||
					lowerTgt.endsWith("__history") ||
					lowerTgt.endsWith("__feed") ||
					lowerTgt.endsWith("__b") ||
					lowerTgt.endsWith("__tag") ||
					lowerTgt.endsWith("__changeevent") ||
					lowerTgt.endsWith("__x")
				const isStandardObj = [
					"account",
					"contact",
					"opportunity",
					"lead",
					"case",
					"user",
					"task",
					"event",
					"asset",
					"campaign",
					"contract",
					"order",
					"product2",
					"pricebook2",
					"quote",
				].includes(lowerTgt)

				if (
					lowerTgt !== "select" &&
					lowerTgt !== "where" &&
					lowerTgt !== "from" &&
					lowerTgt !== className.toLowerCase() &&
					(isCustomOrPlatformObj || isStandardObj)
				) {
					this.addEdge({ sourceId: className, targetId: targetObj, relationship: "QUERIES_OBJECT" })
				}
			}
		}

		// Extract shallow Apex field mutations (e.g. inv.Amount__c = 100)
		const mutatesFields = new Set<string>()
		const assignRe = /\b[a-zA-Z0-9_]+\.([a-zA-Z0-9_]+__c)\s*=/g
		let assignMatch: RegExpExecArray | null
		while ((assignMatch = assignRe.exec(cleanCode)) !== null) {
			const fieldName = assignMatch[1]
			if (isTrigger && node.txn?.objectApiName) {
				mutatesFields.add(`${node.txn.objectApiName}.${fieldName}`)
			} else {
				mutatesFields.add(fieldName)
			}
		}
		if (mutatesFields.size > 0 && node.txn) {
			node.txn.mutatesFields = Array.from(new Set([...(node.txn.mutatesFields || []), ...mutatesFields]))
		}

		// Collect candidate Apex class invocation targets for second-pass CALLS_APEX resolution
		const callRe = /\b([A-Z]\w*)\s*(?:\.\s*\w+\s*\(|\()/g
		let callMatch: RegExpExecArray | null
		const candidateCallees = new Set<string>()
		while ((callMatch = callRe.exec(cleanCode)) !== null) {
			const target = callMatch[1]
			if (
				target !== className &&
				target !== "System" &&
				target !== "Database" &&
				target !== "Math" &&
				target !== "String" &&
				target !== "Date" &&
				target !== "Datetime"
			) {
				candidateCallees.add(target)
			}
		}
		if (candidateCallees.size > 0) {
			this.pendingApexCalls.set(className, candidateCallees)
		}

		// Count SOQL queries & DML statements
		const soqlCount =
			(cleanCode.match(/\[\s*SELECT\b/gi) || []).length + (cleanCode.match(/Database\.query\s*\(/gi) || []).length
		const dmlCount =
			(cleanCode.match(/\b(insert|update|delete|upsert|undelete)\s+[a-zA-Z0-9_]+/gi) || []).length +
			(cleanCode.match(/Database\.(insert|update|delete|upsert|undelete)\s*\(/gi) || []).length

		// Detect loop-nested queries/DML (supporting K&R, Allman, single-line, and single statement loops) (Item 2)
		let hasLoopedQuery = false
		const lines = cleanCode.split("\n")
		let inLoop = false
		let loopBraceCount = 0
		let lookingForBrace = false

		for (const line of lines) {
			const trimmed = line.trim()
			if (!trimmed) continue

			if (/\b(for|while)\s*\(/.test(trimmed)) {
				inLoop = true
				if (trimmed.includes("{")) {
					loopBraceCount += (trimmed.match(/\{/g) || []).length
					lookingForBrace = false
				} else {
					lookingForBrace = true
				}
			} else if (lookingForBrace && inLoop) {
				if (trimmed.startsWith("{")) {
					loopBraceCount += (trimmed.match(/\{/g) || []).length
					lookingForBrace = false
				} else {
					// Single-statement loop without braces
					lookingForBrace = false
				}
			} else if (inLoop) {
				if (!lookingForBrace && trimmed.includes("{") && !/\b(for|while)\s*\(/.test(trimmed)) {
					loopBraceCount += (trimmed.match(/\{/g) || []).length
				}
				if (trimmed.includes("}")) {
					loopBraceCount -= (trimmed.match(/\}/g) || []).length
				}
			}

			// Hoist DML/SOQL regex test so it runs on every line unconditionally while inLoop (Item 2)
			if (
				inLoop &&
				/\[\s*SELECT\b|Database\.query|Database\.(insert|update|delete|upsert|undelete)|\b(insert|update|delete|upsert|undelete)\b/i.test(
					trimmed,
				)
			) {
				hasLoopedQuery = true
			}

			if (inLoop && !lookingForBrace && loopBraceCount <= 0) {
				inLoop = false
				loopBraceCount = 0
			}
		}

		// Detect static recursion guard
		const hasRecursionGuard = /\bstatic\s+Boolean\s+\w*(?:hasRun|alreadyRan|isFirstRun|runOnce)\b/i.test(cleanCode)

		if (node.txn) {
			node.txn.soqlCount = soqlCount
			node.txn.dmlCount = dmlCount
			node.txn.hasLoopedQuery = hasLoopedQuery
			node.txn.recursionGuard = hasRecursionGuard
		}

		// Step 21 Post-Commit Async Jobs & Platform Events
		if (
			/\bSystem\.enqueueJob\s*\(|\bDatabase\.executeBatch\s*\(|\bSystem\.schedule\s*\(|@future\b/i.test(cleanCode)
		) {
			const asyncNodeId = `AsyncJob:${className}`
			this.addNode({
				id: asyncNodeId,
				type: "ASYNC_JOB",
				name: `${className} (Async)`,
				filePath,
				txn: {
					objectApiName: node.txn?.objectApiName || "Unknown",
					dmlEvents: node.txn?.dmlEvents || ["insert", "update"],
					executionSteps: [21],
					isAsync: true,
					active: true,
				},
			})
			this.addEdge({ sourceId: className, targetId: asyncNodeId, relationship: "ENQUEUES_ASYNC" })
		}

		if (/\bEventBus\.publish\s*\(/i.test(cleanCode)) {
			const eventNodeId = `PlatformEvent:${className}`
			this.addNode({
				id: eventNodeId,
				type: "PLATFORM_EVENT",
				name: `${className} (Event)`,
				filePath,
				txn: {
					objectApiName: node.txn?.objectApiName || "Unknown",
					dmlEvents: node.txn?.dmlEvents || ["insert", "update"],
					executionSteps: [21],
					isAsync: true,
					active: true,
				},
			})
			this.addEdge({ sourceId: className, targetId: eventNodeId, relationship: "PUBLISHES_EVENT" })
		}
	}

	private indexFlowXml(filePath: string, content: string): void {
		try {
			const parsed = this.xmlParser.parse(content)
			const root = parsed.Flow
			if (!root) return

			const fileName = path.basename(filePath, ".flow-meta.xml")
			const flowName = fileName
			const processType = String(root.processType || "")

			// Screen flows do not participate in save transaction
			if (processType === "Flow") {
				this.addNode({
					id: flowName,
					type: "FLOW",
					name: flowName,
					filePath,
					metadata: { processType: root.processType, status: root.status },
				})
				return
			}

			const start = root.start || {}
			const triggerType = String(start.triggerType || "")
			const step =
				triggerType === "RecordBeforeSave"
					? 4
					: triggerType === "RecordAfterSave"
						? 14
						: processType === "Workflow"
							? 12
							: undefined

			const rtt = String(start.recordTriggerType || "")
			const dmlEvents: DmlEvent[] =
				rtt === "Create"
					? ["insert"]
					: rtt === "Update"
						? ["update"]
						: rtt === "CreateAndUpdate"
							? ["insert", "update"]
							: rtt === "Delete"
								? ["delete"]
								: []

			const node: GraphNode = {
				id: flowName,
				type: "FLOW",
				name: flowName,
				filePath,
				metadata: { processType: root.processType, status: root.status },
			}

			if (step !== undefined && start.object) {
				const objectApiName = String(start.object)
				const mutatesFields = new Set<string>()
				const readsFields = new Set<string>()

				const recordUpdates = Array.isArray(root.recordUpdates)
					? root.recordUpdates
					: root.recordUpdates
						? [root.recordUpdates]
						: []
				for (const ru of recordUpdates) {
					const assignments = Array.isArray(ru?.inputAssignments)
						? ru.inputAssignments
						: ru?.inputAssignments
							? [ru.inputAssignments]
							: []
					for (const assign of assignments) {
						if (assign && assign.field) {
							mutatesFields.add(`${objectApiName}.${assign.field}`)
						}
					}
				}

				const assignments = Array.isArray(root.assignments)
					? root.assignments
					: root.assignments
						? [root.assignments]
						: []
				for (const asgn of assignments) {
					const items = Array.isArray(asgn?.assignmentItems)
						? asgn.assignmentItems
						: asgn?.assignmentItems
							? [asgn.assignmentItems]
							: []
					for (const item of items) {
						const ref = String(item?.assignToReference || "")
						if (ref.startsWith("$Record.")) {
							const fName = ref.replace("$Record.", "")
							mutatesFields.add(`${objectApiName}.${fName}`)
						}
					}
				}

				node.txn = {
					objectApiName,
					dmlEvents,
					executionSteps: [step],
					active: String(root.status || "") === "Active",
					triggerOrder: Number(start.triggerOrder ?? root.triggerOrder) || undefined,
					requiresChangeToMeetCriteria: String(start.doesRequireRecordChangedToMeetCriteria ?? "") === "true",
					mutatesFields: Array.from(mutatesFields),
					readsFields: Array.from(readsFields),
				}
				this.addEdge({ sourceId: flowName, targetId: objectApiName, relationship: "RUNS_ON_OBJECT" })
			}

			this.addNode(node)
		} catch (e) {
			// Silent fallback
		}
	}

	/**
	 * Calculate Transitive Graph Blast Radius using O(1) Adjacency Map traversal
	 */
	public getBlastRadius(symbolId: string, mode = "blast_radius", maxDepth = 5): BlastRadiusResult {
		const lowerSymbol = symbolId.toLowerCase()
		const node = this.getNode(lowerSymbol) || {
			id: symbolId,
			type: "OBJECT",
			name: symbolId,
			filePath: "(Implicit / External)",
		}

		const upstreamDependents: GraphNode[] = []
		const downstreamDependencies: GraphNode[] = []

		if (mode === "blast_radius" || mode === "upstream") {
			// Transitive Upstream BFS using incomingAdjacency map
			const upstreamQueue: { id: string; depth: number }[] = [{ id: lowerSymbol, depth: 0 }]
			const upstreamVisited = new Set<string>([lowerSymbol])

			while (upstreamQueue.length > 0) {
				const { id: currId, depth } = upstreamQueue.shift()!
				if (depth >= maxDepth) continue

				const incomingEdges = this.incomingAdjacency.get(currId)
				if (incomingEdges) {
					for (const edge of incomingEdges) {
						const srcId = edge.sourceId.toLowerCase()
						if (!upstreamVisited.has(srcId)) {
							upstreamVisited.add(srcId)
							const srcNode = this.getNode(srcId)
							if (srcNode) {
								upstreamDependents.push(srcNode)
								upstreamQueue.push({ id: srcId, depth: depth + 1 })
							}
						}
					}
				}
			}
		}

		if (mode === "blast_radius" || mode === "downstream") {
			// Transitive Downstream BFS using outgoingAdjacency map
			const downstreamQueue: { id: string; depth: number }[] = [{ id: lowerSymbol, depth: 0 }]
			const downstreamVisited = new Set<string>([lowerSymbol])

			while (downstreamQueue.length > 0) {
				const { id: currId, depth } = downstreamQueue.shift()!
				if (depth >= maxDepth) continue

				const outgoingEdges = this.outgoingAdjacency.get(currId)
				if (outgoingEdges) {
					for (const edge of outgoingEdges) {
						const tgtId = edge.targetId.toLowerCase()
						if (!downstreamVisited.has(tgtId)) {
							downstreamVisited.add(tgtId)
							const tgtNode = this.getNode(tgtId)
							if (tgtNode) {
								downstreamDependencies.push(tgtNode)
								downstreamQueue.push({ id: tgtId, depth: depth + 1 })
							}
						}
					}
				}
			}
		}

		const summary = `Graph Search for [${symbolId}] (Mode: ${mode}): ${upstreamDependents.length} Upstream Dependents, ${downstreamDependencies.length} Downstream Dependencies.`

		return {
			targetNode: node,
			upstreamDependents,
			downstreamDependencies,
			summary,
		}
	}

	/**
	 * Find graph nodes matching a query string in ID, name, or metadata.
	 */
	public findNodes(query: string): GraphNode[] {
		const q = query.toLowerCase()
		const matches: GraphNode[] = []

		for (const node of this.nodes.values()) {
			if (
				node.id.toLowerCase().includes(q) ||
				node.name.toLowerCase().includes(q) ||
				(node.txn?.objectApiName && node.txn.objectApiName.toLowerCase().includes(q))
			) {
				matches.push(node)
			}
		}

		return matches
	}

	public async exportGraphNetwork(targetDir?: string): Promise<string> {
		const lines: string[] = ["# Salesforce Interlinked Graph Network", ""]
		lines.push(`Total Nodes: ${this.nodes.size}`)
		lines.push(`Total Edges: ${this.edges.length}`)
		lines.push("")

		lines.push("## Nodes")
		for (const node of this.nodes.values()) {
			lines.push(`- **[${node.type}]** ${node.id} (${node.filePath})`)
		}

		lines.push("")
		lines.push("## Edges")
		for (const edge of this.edges) {
			lines.push(`- ${edge.sourceId} --[${edge.relationship}]--> ${edge.targetId}`)
		}

		const output = lines.join("\n")

		if (targetDir) {
			try {
				const siidDir = path.join(targetDir, ".siid-code")
				await fs.mkdir(siidDir, { recursive: true })
				await fs.writeFile(path.join(siidDir, "SALESFORCE_GRAPH.md"), output, "utf-8")
			} catch (e) {
				// Fallback
			}
		}

		return output
	}
}

import * as path from "path"
import { XMLParser } from "fast-xml-parser"
import { DmlEvent, GraphNode, GraphEdge } from "./salesforce-graph"

export interface ISalesforceGraphEngine {
	addNode(node: GraphNode): void
	addEdge(edge: GraphEdge): void
	hasNode?(id: string): boolean
}

export const toArray = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v])

const FORMULA_KEYWORDS = new Set([
	"and",
	"or",
	"not",
	"isblank",
	"ischanged",
	"priorvalue",
	"text",
	"value",
	"if",
	"case",
	"true",
	"false",
	"null",
	"len",
	"upper",
	"lower",
	"trim",
	"addmonths",
	"date",
	"today",
	"now",
	"year",
	"month",
	"day",
	"contains",
])

/**
 * Index additional Salesforce automation metadata XML files into the Graph Engine.
 */
export function indexAutomationFile(
	graph: ISalesforceGraphEngine,
	filePath: string,
	content: string,
	xmlParser: XMLParser,
): boolean {
	const rawPath = filePath.replace(/\\/g, "/")
	const lowerPath = rawPath.toLowerCase()

	if (lowerPath.endsWith(".validationrule-meta.xml")) {
		parseValidationRule(graph, rawPath, content, xmlParser)
		return true
	}
	if (lowerPath.endsWith(".workflow-meta.xml")) {
		parseWorkflow(graph, rawPath, content, xmlParser)
		return true
	}
	if (lowerPath.endsWith(".duplicaterule-meta.xml")) {
		parseDuplicateRule(graph, rawPath, content, xmlParser)
		return true
	}
	if (lowerPath.endsWith(".assignmentrules-meta.xml")) {
		parseAssignmentRules(graph, rawPath, content, xmlParser)
		return true
	}
	if (lowerPath.endsWith(".autoresponserules-meta.xml")) {
		parseAutoResponseRules(graph, rawPath, content, xmlParser)
		return true
	}
	if (lowerPath.endsWith(".escalationrules-meta.xml")) {
		parseEscalationRules(graph, rawPath, content, xmlParser)
		return true
	}
	if (lowerPath.endsWith(".sharingrules-meta.xml")) {
		parseSharingRules(graph, rawPath, content, xmlParser)
		return true
	}
	if (lowerPath.endsWith(".entitlementprocess-meta.xml")) {
		parseEntitlementProcess(graph, rawPath, content, xmlParser)
		return true
	}

	return false
}

function getObjectNameFromPath(filePath: string): string {
	const parts = filePath.split("/")
	const objIdx = parts.lastIndexOf("objects")
	if (objIdx !== -1 && parts[objIdx + 1]) {
		return parts[objIdx + 1]
	}
	const base = path.basename(filePath)
	return base.split(".")[0] || "Unknown"
}

function parseValidationRule(
	graph: ISalesforceGraphEngine,
	filePath: string,
	content: string,
	xmlParser: XMLParser,
): void {
	try {
		const parsed = xmlParser.parse(content)
		const root = parsed.ValidationRule
		if (!root || !root.fullName) return

		const objectApiName = getObjectNameFromPath(filePath)
		const ruleName = String(root.fullName)
		const nodeId = `ValidationRule:${objectApiName}.${ruleName}`
		const active = String(root.active ?? "") === "true"

		const formula = String(root.errorConditionFormula || "")
		// Strip string literals ('...' and "..."), function calls FUNC(...), and cross-object dotted field references (Account__r.Name) to isolate fields on objectApiName itself (H5)
		const cleanFormula = formula
			.replace(/'[^']*'/g, "")
			.replace(/"[^"]*"/g, "")
			.replace(/\b[a-zA-Z0-9_]+\s*\(/g, "(")
			.replace(/\b[a-zA-Z0-9_]+\.[a-zA-Z0-9_.]+\b/g, "")

		const readsFields = new Set<string>()
		const fieldTokens = cleanFormula.match(/\b([a-zA-Z0-9_]+)\b/gi) || []
		for (const token of fieldTokens) {
			const lowerToken = token.toLowerCase()
			if (!FORMULA_KEYWORDS.has(lowerToken) && isNaN(Number(token))) {
				const fieldId = `${objectApiName}.${token}`
				const isCustomOrRef = lowerToken.endsWith("__c") || lowerToken.endsWith("__r")
				const isStandardField = [
					"amount",
					"status",
					"stagename",
					"closedate",
					"type",
					"name",
					"accountid",
					"contactid",
					"ownerid",
					"createddate",
					"lastmodifieddate",
					"isclosed",
					"iswon",
				].includes(lowerToken)

				if (isCustomOrRef || isStandardField || Boolean(graph.hasNode?.(fieldId))) {
					readsFields.add(fieldId)
				}
			}
		}

		const node: GraphNode = {
			id: nodeId,
			type: "VALIDATION_RULE",
			name: ruleName,
			filePath,
			metadata: { active, errorMessage: root.errorMessage },
			txn: {
				objectApiName,
				dmlEvents: ["insert", "update"],
				executionSteps: [6],
				active,
				readsFields: Array.from(readsFields),
			},
		}

		graph.addNode(node)
		graph.addEdge({ sourceId: nodeId, targetId: objectApiName, relationship: "RUNS_ON_OBJECT" })
	} catch (e) {
		// Fallback
	}
}

function parseWorkflow(graph: ISalesforceGraphEngine, filePath: string, content: string, xmlParser: XMLParser): void {
	try {
		const parsed = xmlParser.parse(content)
		const root = parsed.Workflow
		if (!root) return

		const objectApiName = getObjectNameFromPath(filePath)

		const rules = toArray(root.rules)
		for (const rule of rules) {
			if (!rule || !rule.fullName) continue
			const ruleName = String(rule.fullName)
			const nodeId = `WorkflowRule:${objectApiName}.${ruleName}`
			const active = String(rule.active ?? "") === "true"

			const tt = String(rule.triggerType || "")
			const dmlEvents: DmlEvent[] = tt === "onCreateOnly" ? ["insert"] : ["insert", "update"]

			const node: GraphNode = {
				id: nodeId,
				type: "WORKFLOW_RULE",
				name: ruleName,
				filePath,
				metadata: { active, triggerType: rule.triggerType },
				txn: {
					objectApiName,
					dmlEvents,
					executionSteps: [12],
					active,
				},
			}

			graph.addNode(node)
			graph.addEdge({ sourceId: nodeId, targetId: objectApiName, relationship: "RUNS_ON_OBJECT" })
		}

		const fieldUpdates = toArray(root.fieldUpdates)
		for (const fu of fieldUpdates) {
			if (!fu || !fu.fullName) continue
			const fuName = String(fu.fullName)
			const nodeId = `WorkflowFieldUpdate:${objectApiName}.${fuName}`
			const targetField = String(fu.field || "")
			// M3 Fix: Honor <targetObject> for cross-object workflow field updates
			const targetObj = fu.targetObject ? String(fu.targetObject) : objectApiName

			const node: GraphNode = {
				id: nodeId,
				type: "WORKFLOW_FIELD_UPDATE",
				name: fuName,
				filePath,
				metadata: { targetField, targetObject: targetObj, reevaluateOnChange: fu.reevaluateOnChange },
				txn: {
					objectApiName: targetObj,
					dmlEvents: ["insert", "update"],
					executionSteps: [13],
					active: true,
					requiresChangeToMeetCriteria: String(fu.reevaluateOnChange || "").toLowerCase() !== "true",
					mutatesFields: targetField ? [`${targetObj}.${targetField}`] : [],
				},
			}

			graph.addNode(node)
			graph.addEdge({ sourceId: nodeId, targetId: targetObj, relationship: "RUNS_ON_OBJECT" })
		}
	} catch (e) {
		// Fallback
	}
}

function parseDuplicateRule(
	graph: ISalesforceGraphEngine,
	filePath: string,
	content: string,
	xmlParser: XMLParser,
): void {
	try {
		const parsed = xmlParser.parse(content)
		const root = parsed.DuplicateRule
		if (!root) return

		const objectApiName = getObjectNameFromPath(filePath)
		const ruleName = path.basename(filePath, ".duplicateRule-meta.xml")
		const nodeId = `DuplicateRule:${objectApiName}.${ruleName}`
		const active = String(root.isActive ?? "") === "true"

		const node: GraphNode = {
			id: nodeId,
			type: "DUPLICATE_RULE",
			name: ruleName,
			filePath,
			metadata: { active },
			txn: {
				objectApiName,
				dmlEvents: ["insert", "update"],
				executionSteps: [7],
				active,
			},
		}

		graph.addNode(node)
		graph.addEdge({ sourceId: nodeId, targetId: objectApiName, relationship: "RUNS_ON_OBJECT" })
	} catch (e) {
		// Fallback
	}
}

function parseAssignmentRules(
	graph: ISalesforceGraphEngine,
	filePath: string,
	content: string,
	xmlParser: XMLParser,
): void {
	try {
		const parsed = xmlParser.parse(content)
		const root = parsed.AssignmentRules
		if (!root) return

		const objectApiName = getObjectNameFromPath(filePath)
		const lowerObj = objectApiName.toLowerCase()
		const isLeadOrCase = lowerObj === "lead" || lowerObj === "case"
		const rules = toArray(root.assignmentRule)

		for (const rule of rules) {
			if (!rule || !rule.fullName) continue
			const ruleName = String(rule.fullName)
			const nodeId = `AssignmentRule:${objectApiName}.${ruleName}`
			const active = String(rule.active ?? "") === "true"

			const node: GraphNode = {
				id: nodeId,
				type: "ASSIGNMENT_RULE",
				name: ruleName,
				filePath,
				metadata: {
					active,
					isInvalidConfig: !isLeadOrCase,
					configWarning: isLeadOrCase
						? undefined
						: "Assignment rules only exist for Lead and Case objects in Salesforce",
				},
				txn: {
					objectApiName,
					dmlEvents: ["insert", "update"],
					executionSteps: [10],
					active,
				},
			}

			graph.addNode(node)
			graph.addEdge({ sourceId: nodeId, targetId: objectApiName, relationship: "RUNS_ON_OBJECT" })
		}
	} catch (e) {
		// Fallback
	}
}

function parseAutoResponseRules(
	graph: ISalesforceGraphEngine,
	filePath: string,
	content: string,
	xmlParser: XMLParser,
): void {
	try {
		const parsed = xmlParser.parse(content)
		const root = parsed.AutoResponseRules
		if (!root) return

		const objectApiName = getObjectNameFromPath(filePath)
		const rules = toArray(root.autoResponseRule)

		for (const rule of rules) {
			if (!rule || !rule.fullName) continue
			const ruleName = String(rule.fullName)
			const nodeId = `AutoResponseRule:${objectApiName}.${ruleName}`
			const active = String(rule.active ?? "") === "true"

			const node: GraphNode = {
				id: nodeId,
				type: "AUTO_RESPONSE_RULE",
				name: ruleName,
				filePath,
				metadata: { active },
				txn: {
					objectApiName,
					dmlEvents: ["insert"],
					executionSteps: [11],
					active,
				},
			}

			graph.addNode(node)
			graph.addEdge({ sourceId: nodeId, targetId: objectApiName, relationship: "RUNS_ON_OBJECT" })
		}
	} catch (e) {
		// Fallback
	}
}

function parseEscalationRules(
	graph: ISalesforceGraphEngine,
	filePath: string,
	content: string,
	xmlParser: XMLParser,
): void {
	try {
		const parsed = xmlParser.parse(content)
		const root = parsed.EscalationRules
		if (!root) return

		const objectApiName = getObjectNameFromPath(filePath)
		const rules = toArray(root.escalationRule)

		for (const rule of rules) {
			if (!rule || !rule.fullName) continue
			const ruleName = String(rule.fullName)
			const nodeId = `EscalationRule:${objectApiName}.${ruleName}`
			const active = String(rule.active ?? "") === "true"

			const node: GraphNode = {
				id: nodeId,
				type: "ESCALATION_RULE",
				name: ruleName,
				filePath,
				metadata: { active },
				txn: {
					objectApiName,
					dmlEvents: ["insert", "update"],
					executionSteps: [15],
					active,
				},
			}

			graph.addNode(node)
			graph.addEdge({ sourceId: nodeId, targetId: objectApiName, relationship: "RUNS_ON_OBJECT" })
		}
	} catch (e) {
		// Fallback
	}
}

function parseSharingRules(
	graph: ISalesforceGraphEngine,
	filePath: string,
	content: string,
	xmlParser: XMLParser,
): void {
	try {
		const parsed = xmlParser.parse(content)
		const root = parsed.SharingRules
		if (!root) return

		const objectApiName = getObjectNameFromPath(filePath)
		const criteriaRules = toArray(root.sharingCriteriaRules)
		const ownerRules = toArray(root.sharingOwnerRules)
		const allRules = [...criteriaRules, ...ownerRules]

		for (const rule of allRules) {
			if (!rule || !rule.fullName) continue
			const ruleName = String(rule.fullName)
			const nodeId = `SharingRule:${objectApiName}.${ruleName}`

			const node: GraphNode = {
				id: nodeId,
				type: "SHARING_RULE",
				name: ruleName,
				filePath,
				txn: {
					objectApiName,
					dmlEvents: ["insert", "update"],
					executionSteps: [19],
					active: true,
				},
			}

			graph.addNode(node)
			graph.addEdge({ sourceId: nodeId, targetId: objectApiName, relationship: "RUNS_ON_OBJECT" })
		}
	} catch (e) {
		// Fallback
	}
}

function parseEntitlementProcess(
	graph: ISalesforceGraphEngine,
	filePath: string,
	content: string,
	xmlParser: XMLParser,
): void {
	try {
		const parsed = xmlParser.parse(content)
		const root = parsed.EntitlementProcess
		if (!root) return

		const objectApiName = getObjectNameFromPath(filePath)
		const ruleName = path.basename(filePath, ".entitlementProcess-meta.xml")
		const nodeId = `EntitlementProcess:${objectApiName}.${ruleName}`
		const active = String(root.isActive ?? "") === "true"

		const node: GraphNode = {
			id: nodeId,
			type: "ENTITLEMENT_PROCESS",
			name: ruleName,
			filePath,
			metadata: { active },
			txn: {
				objectApiName,
				dmlEvents: ["insert", "update"],
				executionSteps: [16],
				active,
			},
		}

		graph.addNode(node)
		graph.addEdge({ sourceId: nodeId, targetId: objectApiName, relationship: "RUNS_ON_OBJECT" })
	} catch (e) {
		// Fallback
	}
}

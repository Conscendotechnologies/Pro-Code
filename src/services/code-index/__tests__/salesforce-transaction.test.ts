import { describe, it, expect, beforeEach, afterEach } from "vitest"
import * as os from "os"
import * as fs from "fs/promises"
import * as path from "path"
import { SalesforceGraphEngine } from "../processors/salesforce-graph"
import {
	getTransactionTimeline,
	renderTransactionTimelineMarkdown,
	exportTransactionIndex,
	detectFieldConflicts,
	traceFieldLifecycle,
	detectRecursion,
	getGovernorSurface,
} from "../processors/salesforce-transaction"
import { indexAutomationFile } from "../processors/salesforce-automation"

describe("Salesforce Transaction Index", () => {
	let graph: SalesforceGraphEngine
	const tmpDir = os.tmpdir()

	beforeEach(() => {
		graph = SalesforceGraphEngine.getInstance("test-tx-workspace")
		graph.clear()
	})

	afterEach(async () => {
		await fs.rm(path.join(tmpDir, ".siid-code"), { recursive: true, force: true }).catch(() => {})
	})

	it("indexes trigger execution steps and calculates canonical timeline order", async () => {
		const sampleTrigger = `
trigger InvoiceTrigger on Invoice__c (before insert, before update, after insert, after update) {
    System.debug('Trigger running');
}
`
		await graph.indexFileForGraph("force-app/main/default/triggers/InvoiceTrigger.trigger", sampleTrigger)

		const timeline = getTransactionTimeline(graph, "Invoice__c", "update")
		expect(timeline.entries.length).toBe(2)
		expect(timeline.entries[0].step).toBe(5) // Before trigger
		expect(timeline.entries[1].step).toBe(9) // After trigger
	})

	it("indexes flow timing and orders before-save flow (step 4) before before-trigger (step 5)", async () => {
		const flowXml = `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <processType>AutoLaunchedFlow</processType>
    <status>Active</status>
    <start>
        <object>Invoice__c</object>
        <triggerType>RecordBeforeSave</triggerType>
        <recordTriggerType>CreateAndUpdate</recordTriggerType>
    </start>
</Flow>`

		const triggerApex = `
trigger InvoiceBeforeTrigger on Invoice__c (before insert, before update) {}
`

		await graph.indexFileForGraph("force-app/main/default/flows/InvoiceBeforeFlow.flow-meta.xml", flowXml)
		await graph.indexFileForGraph("force-app/main/default/triggers/InvoiceBeforeTrigger.trigger", triggerApex)

		const timeline = getTransactionTimeline(graph, "Invoice__c", "update")
		expect(timeline.entries.length).toBe(2)
		expect(timeline.entries[0].step).toBe(4) // RecordBeforeSave flow
		expect(timeline.entries[0].node.name).toBe("InvoiceBeforeFlow")
		expect(timeline.entries[1].step).toBe(5) // Before trigger
		expect(timeline.entries[1].node.name).toBe("InvoiceBeforeTrigger")
	})

	it("indexes ValidationRules and WorkflowFieldUpdates at steps 6 and 13", async () => {
		const vrXml = `<?xml version="1.0" encoding="UTF-8"?>
<ValidationRule xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Check_Amount</fullName>
    <active>true</active>
    <errorConditionFormula>Amount__c &lt; 0</errorConditionFormula>
</ValidationRule>`

		const wfXml = `<?xml version="1.0" encoding="UTF-8"?>
<Workflow xmlns="http://soap.sforce.com/2006/04/metadata">
    <fieldUpdates>
        <fullName>Set_Status_Paid</fullName>
        <field>Status__c</field>
    </fieldUpdates>
</Workflow>`

		indexAutomationFile(
			graph,
			"force-app/main/default/objects/Invoice__c/validationRules/Check_Amount.validationRule-meta.xml",
			vrXml,
			(graph as any).xmlParser,
		)
		indexAutomationFile(
			graph,
			"force-app/main/default/workflows/Invoice__c.workflow-meta.xml",
			wfXml,
			(graph as any).xmlParser,
		)

		const timeline = getTransactionTimeline(graph, "Invoice__c", "update")
		expect(timeline.entries.some((e) => e.step === 6 && e.node.name === "Check_Amount")).toBe(true)
		expect(timeline.entries.some((e) => e.step === 13 && e.node.name === "Set_Status_Paid")).toBe(true)
	})

	it("resolves second-pass CALLS_APEX edges for verified Apex classes", async () => {
		const callerCode = `
public class InvoiceService {
    public void processInvoice() {
        InvoiceHelper.calculateTotal();
    }
}
`
		const calleeCode = `
public class InvoiceHelper {
    public static void calculateTotal() {}
}
`

		await graph.indexFileForGraph("force-app/main/default/classes/InvoiceService.cls", callerCode)
		await graph.indexFileForGraph("force-app/main/default/classes/InvoiceHelper.cls", calleeCode)

		graph.resolveApexCallEdges()

		const blast = graph.getBlastRadius("InvoiceHelper", "upstream")
		expect(blast.upstreamDependents.some((d) => d.name === "InvoiceService")).toBe(true)
	})

	it("detects field mutation conflicts between Before-Save Flow (Step 4) and Before Trigger (Step 5)", async () => {
		const flowXml = `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <processType>AutoLaunchedFlow</processType>
    <status>Active</status>
    <start>
        <object>Invoice__c</object>
        <triggerType>RecordBeforeSave</triggerType>
        <recordTriggerType>CreateAndUpdate</recordTriggerType>
    </start>
    <recordUpdates>
        <inputAssignments>
            <field>Amount__c</field>
        </inputAssignments>
    </recordUpdates>
</Flow>`

		const triggerApex = `
trigger InvoiceBeforeTrigger on Invoice__c (before update) {
    inv.Amount__c = 500;
}
`

		await graph.indexFileForGraph("force-app/main/default/flows/InvoiceBeforeFlow.flow-meta.xml", flowXml)
		await graph.indexFileForGraph("force-app/main/default/triggers/InvoiceBeforeTrigger.trigger", triggerApex)

		const conflicts = detectFieldConflicts(graph, "Invoice__c", "update")
		expect(conflicts.length).toBeGreaterThan(0)
		expect(conflicts[0].fieldName).toBe("invoice__c.amount__c")
	})

	it("traces field lifecycle across write and read operations", async () => {
		const flowXml = `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <processType>AutoLaunchedFlow</processType>
    <status>Active</status>
    <start>
        <object>Invoice__c</object>
        <triggerType>RecordBeforeSave</triggerType>
        <recordTriggerType>CreateAndUpdate</recordTriggerType>
    </start>
    <recordUpdates>
        <inputAssignments>
            <field>Amount__c</field>
        </inputAssignments>
    </recordUpdates>
</Flow>`

		const vrXml = `<?xml version="1.0" encoding="UTF-8"?>
<ValidationRule xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Check_Amount</fullName>
    <active>true</active>
    <errorConditionFormula>Amount__c &lt; 0</errorConditionFormula>
</ValidationRule>`

		await graph.indexFileForGraph("force-app/main/default/flows/InvoiceBeforeFlow.flow-meta.xml", flowXml)
		indexAutomationFile(
			graph,
			"force-app/main/default/objects/Invoice__c/validationRules/Check_Amount.validationRule-meta.xml",
			vrXml,
			(graph as any).xmlParser,
		)

		const trace = traceFieldLifecycle(graph, "Invoice__c", "Amount__c")
		expect(trace.steps.length).toBe(2)
		expect(trace.steps[0].action).toBe("WRITE")
		expect(trace.steps[0].step).toBe(4) // Step 4 RecordBeforeSave flow
		expect(trace.steps[1].action).toBe("READ")
		expect(trace.steps[1].step).toBe(6) // Step 6 Validation rule
	})

	it("detects bounded vs unbounded recursion risks and static guards", async () => {
		const wfXml = `<?xml version="1.0" encoding="UTF-8"?>
<Workflow xmlns="http://soap.sforce.com/2006/04/metadata">
    <fieldUpdates>
        <fullName>Set_Status_Processing</fullName>
        <field>Status__c</field>
        <reevaluateOnChange>false</reevaluateOnChange>
    </fieldUpdates>
</Workflow>`

		indexAutomationFile(
			graph,
			"force-app/main/default/workflows/Invoice__c.workflow-meta.xml",
			wfXml,
			(graph as any).xmlParser,
		)

		const recursion = detectRecursion(graph, "Invoice__c")
		expect(recursion.length).toBe(1)
		expect(recursion[0].isUnbounded).toBe(false)
	})

	it("calculates governor surface SOQL/DML totals and flags loop-nested queries", async () => {
		const loopedApex = `
trigger InvoiceLoopTrigger on Invoice__c (before update) {
    for (Invoice__c inv : [SELECT Id FROM Invoice__c]) {
        update inv;
    }
}
`
		await graph.indexFileForGraph("force-app/main/default/triggers/InvoiceLoopTrigger.trigger", loopedApex)

		const gov = getGovernorSurface(graph, "Invoice__c", "update")
		expect(gov.totalSoqlCount).toBe(1)
		expect(gov.totalDmlCount).toBe(1)
		expect(gov.hasLoopedQueries).toBe(true)
		expect(gov.nodesWithLoopedQueries).toContain("InvoiceLoopTrigger")
	})

	it("indexes async call sites and platform events at Step 21", async () => {
		const asyncApex = `
public class InvoiceProcessor {
    public static void run() {
        System.enqueueJob(new InvoiceQueueable());
        EventBus.publish(new InvoiceEvent__e());
    }
}
`
		await graph.indexFileForGraph("force-app/main/default/classes/InvoiceProcessor.cls", asyncApex)

		const asyncNode = graph.getNode("AsyncJob:InvoiceProcessor")
		const eventNode = graph.getNode("PlatformEvent:InvoiceProcessor")

		expect(asyncNode).toBeDefined()
		expect(asyncNode?.txn?.executionSteps).toContain(21)
		expect(eventNode).toBeDefined()
		expect(eventNode?.txn?.executionSteps).toContain(21)
	})

	it("exports SALESFORCE_TRANSACTIONS.md artifact to disk", async () => {
		const triggerApex = `trigger InvoiceTrigger on Invoice__c (before insert) {}`
		await graph.indexFileForGraph("force-app/main/default/triggers/InvoiceTrigger.trigger", triggerApex)

		const output = await exportTransactionIndex(graph, tmpDir)
		expect(output).toContain("Invoice__c")
		expect(output).toContain("Step 5")

		const mdPath = path.join(tmpDir, ".siid-code", "SALESFORCE_TRANSACTIONS.md")
		const exists = await fs
			.stat(mdPath)
			.then(() => true)
			.catch(() => false)
		expect(exists).toBe(true)
	})

	it("folds handler class SOQL, DML, and loop metrics into delegating Apex trigger (B1, B2, B3)", async () => {
		const triggerCode = `
trigger InvoiceTrigger on Invoice__c (before insert, before update, after update) {
    InvoiceHandler.run();
}
`
		const handlerCode = `
public with sharing class InvoiceHandler {
    public static void run() {
        for (Invoice__c inv : Trigger.new) {
            List<Line__c> lines = [SELECT Id FROM Line__c WHERE Invoice__c = :inv.Id];
            inv.Total__c = 0;
            inv.Status__c = 'Calculated';
            update lines;
        }
        System.enqueueJob(new FraudCheckQueueable());
    }
}
`
		await graph.indexFileForGraph("force-app/main/default/triggers/InvoiceTrigger.trigger", triggerCode)
		await graph.indexFileForGraph("force-app/main/default/classes/InvoiceHandler.cls", handlerCode)

		graph.resolveApexCallEdges()
		graph.aggregateCallChainMetrics()

		const gov = getGovernorSurface(graph, "Invoice__c", "update")
		expect(gov.totalSoqlCount).toBe(1)
		expect(gov.totalDmlCount).toBe(1)
		expect(gov.hasLoopedQueries).toBe(true)
		expect(gov.nodesWithLoopedQueries).toContain("InvoiceTrigger")
	})

	it("flags peer Apex triggers on the same step as unordered peers", async () => {
		const trig1 = `trigger InvoiceTrig1 on Invoice__c (before update) {}`
		const trig2 = `trigger InvoiceTrig2 on Invoice__c (before update) {}`

		await graph.indexFileForGraph("force-app/main/default/triggers/InvoiceTrig1.trigger", trig1)
		await graph.indexFileForGraph("force-app/main/default/triggers/InvoiceTrig2.trigger", trig2)

		const timeline = getTransactionTimeline(graph, "Invoice__c", "update")
		const step5Entries = timeline.entries.filter((e) => e.step === 5)
		expect(step5Entries.length).toBe(2)
		expect(step5Entries[0].isUnorderedPeer).toBe(true)
		expect(step5Entries[1].isUnorderedPeer).toBe(true)
	})

	it("excludes non-record-triggered screen flows (processType Flow) from transaction timeline", async () => {
		const screenFlowXml = `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <processType>Flow</processType>
    <status>Active</status>
</Flow>`

		await graph.indexFileForGraph("force-app/main/default/flows/InvoiceWizard.flow-meta.xml", screenFlowXml)

		const timeline = getTransactionTimeline(graph, "Invoice__c", "update")
		expect(timeline.entries.some((e) => e.node.name === "InvoiceWizard")).toBe(false)
	})

	it("flags inactive validation rules in timeline rather than dropping them", async () => {
		const inactiveVrXml = `<?xml version="1.0" encoding="UTF-8"?>
<ValidationRule xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Inactive_Rule</fullName>
    <active>false</active>
    <errorConditionFormula>Amount__c &lt; 0</errorConditionFormula>
</ValidationRule>`

		indexAutomationFile(
			graph,
			"force-app/main/default/objects/Invoice__c/validationRules/Inactive_Rule.validationRule-meta.xml",
			inactiveVrXml,
			(graph as any).xmlParser,
		)

		const timeline = getTransactionTimeline(graph, "Invoice__c", "update")
		const entry = timeline.entries.find((e) => e.node.name === "Inactive_Rule")
		expect(entry).toBeDefined()
		expect(entry?.node.txn?.active).toBe(false)

		const markdown = renderTransactionTimelineMarkdown(timeline)
		expect(markdown).toContain("[INACTIVE/DRAFT]")
	})

	it("removes all nodes and edges registered by a multi-node bundle file on removeFile (H2)", async () => {
		const wfXml = `<?xml version="1.0" encoding="UTF-8"?>
<Workflow xmlns="http://soap.sforce.com/2006/04/metadata">
    <rules>
        <fullName>Rule1</fullName>
        <active>true</active>
    </rules>
    <rules>
        <fullName>Rule2</fullName>
        <active>true</active>
    </rules>
</Workflow>`

		const file = "force-app/main/default/workflows/Invoice__c.workflow-meta.xml"
		indexAutomationFile(graph, file, wfXml, (graph as any).xmlParser)

		expect(graph.getNode("WorkflowRule:Invoice__c.Rule1")).toBeDefined()
		expect(graph.getNode("WorkflowRule:Invoice__c.Rule2")).toBeDefined()

		graph.removeFile(file)

		expect(graph.getNode("WorkflowRule:Invoice__c.Rule1")).toBeUndefined()
		expect(graph.getNode("WorkflowRule:Invoice__c.Rule2")).toBeUndefined()
	})

	it("qualifies bare Apex handler field mutations under trigger objectApiName and re-homes async nodes (B5 & Round 2)", async () => {
		const triggerCode = `
trigger InvoiceTrigger on Invoice__c (before update) {
    InvoiceHandler.run();
}
`
		const handlerCode = `
public class InvoiceHandler {
    public static void run() {
        inv.Total__c = 100;
        System.enqueueJob(new AsyncFraudCheck());
    }
}
`
		await graph.indexFileForGraph("force-app/main/default/triggers/InvoiceTrigger.trigger", triggerCode)
		await graph.indexFileForGraph("force-app/main/default/classes/InvoiceHandler.cls", handlerCode)

		graph.resolveApexCallEdges()
		graph.aggregateCallChainMetrics()

		const trace = traceFieldLifecycle(graph, "Invoice__c", "Total__c")
		expect(trace.steps.length).toBe(1)
		expect(trace.steps[0].action).toBe("WRITE")

		const rehomedAsync = graph.getNode("AsyncJob:Invoice__c.InvoiceHandler")
		expect(rehomedAsync).toBeDefined()
		expect(rehomedAsync?.txn?.objectApiName).toBe("Invoice__c")
	})

	it("excludes a trigger with both before and after steps from conflicting with itself", async () => {
		const dualTrigger = `
trigger InvoiceDualTrigger on Invoice__c (before update, after update) {
    inv.Status__c = 'Updated';
}
`
		await graph.indexFileForGraph("force-app/main/default/triggers/InvoiceDualTrigger.trigger", dualTrigger)

		const conflicts = detectFieldConflicts(graph, "Invoice__c", "update")
		expect(conflicts.length).toBe(0)
	})

	it("parses cross-object workflow field updates targeting parent object (M3)", async () => {
		const crossWfXml = `<?xml version="1.0" encoding="UTF-8"?>
<Workflow xmlns="http://soap.sforce.com/2006/04/metadata">
    <fieldUpdates>
        <fullName>Update_Account_Status</fullName>
        <field>Status__c</field>
        <targetObject>Account</targetObject>
    </fieldUpdates>
</Workflow>`

		indexAutomationFile(
			graph,
			"force-app/main/default/workflows/Invoice__c.workflow-meta.xml",
			crossWfXml,
			(graph as any).xmlParser,
		)

		const fuNode = graph.getNode("WorkflowFieldUpdate:Invoice__c.Update_Account_Status")
		expect(fuNode).toBeDefined()
		expect(fuNode?.txn?.objectApiName).toBe("Account")
		expect(fuNode?.txn?.mutatesFields).toContain("Account.Status__c")
	})

	it("strips formula string literals and function calls to avoid false field matches (H5)", async () => {
		const vrXml = `<?xml version="1.0" encoding="UTF-8"?>
<ValidationRule xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Complex_Rule</fullName>
    <active>true</active>
    <errorConditionFormula>AND(ISPICKVAL(Status__c, 'Closed Won'), ISBLANK(Amount__c), NOT(ISNEW()))</errorConditionFormula>
</ValidationRule>`

		indexAutomationFile(
			graph,
			"force-app/main/default/objects/Invoice__c/validationRules/Complex_Rule.validationRule-meta.xml",
			vrXml,
			(graph as any).xmlParser,
		)

		const vrNode = graph.getNode("ValidationRule:Invoice__c.Complex_Rule")
		expect(vrNode?.txn?.readsFields).toContain("Invoice__c.Status__c")
		expect(vrNode?.txn?.readsFields).toContain("Invoice__c.Amount__c")
		expect(vrNode?.txn?.readsFields).not.toContain("Invoice__c.ISPICKVAL")
		expect(vrNode?.txn?.readsFields).not.toContain("Invoice__c.Closed")
	})

	it("detects loop-nested queries formatted in Allman style (H3)", async () => {
		const allmanCode = `
trigger InvoiceAllmanTrigger on Invoice__c (before update) {
    for (Invoice__c inv : Trigger.new)
    {
        List<Line__c> lines = [SELECT Id FROM Line__c];
    }
}
`
		await graph.indexFileForGraph("force-app/main/default/triggers/InvoiceAllmanTrigger.trigger", allmanCode)

		const gov = getGovernorSurface(graph, "Invoice__c", "update")
		expect(gov.hasLoopedQueries).toBe(true)
	})

	it("filters string literals and child relationships out of SOQL QUERIES_OBJECT targets (Item 1)", async () => {
		const noisyCode = `
public class NoisyClass {
    public static void run() {
        String msg = 'Order from Acme Corporation';
        List<Account> a = [SELECT Id, (SELECT Id FROM Contacts) FROM Account];
    }
}
`
		await graph.indexFileForGraph("force-app/main/default/classes/NoisyClass.cls", noisyCode)

		expect(graph.getNode("Acme")).toBeUndefined()
		expect(graph.getNode("Contacts")).toBeUndefined()
		expect(graph.getNode("Account")).toBeDefined()
	})

	it("detects single-line loop bodies (Item 2)", async () => {
		const singleLineCode = `
trigger SingleLineTrigger on Account (before update) {
    for (Account a : accs) { insert a; }
}
`
		await graph.indexFileForGraph("force-app/main/default/triggers/SingleLineTrigger.trigger", singleLineCode)

		const gov = getGovernorSurface(graph, "Account", "update")
		expect(gov.hasLoopedQueries).toBe(true)
	})

	it("extracts rollup child object from summaryForeignKey (Item 3)", async () => {
		const rollupXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Total_Amount__c</fullName>
    <type>Summary</type>
    <summaryForeignKey>Line__c.Invoice__c</summaryForeignKey>
    <summaryOperation>sum</summaryOperation>
</CustomField>`

		await graph.indexFileForGraph(
			"force-app/main/default/objects/Invoice__c/fields/Total_Amount__c.field-meta.xml",
			rollupXml,
		)

		const rollupNode = graph.getNode("Rollup:Line__c.Total_Amount__c")
		expect(rollupNode).toBeDefined()
		expect(rollupNode?.txn?.objectApiName).toBe("Line__c")
	})

	it("deletes PlatformEvent orphan nodes and cleans up orphan edges (Items 4 & 5)", async () => {
		const triggerCode = `
trigger EventTrigger on Invoice__c (before update) {
    EventHandler.run();
}
`
		const handlerCode = `
public class EventHandler {
    public static void run() {
        EventBus.publish(new InvoiceEvent__e());
    }
}
`
		await graph.indexFileForGraph("force-app/main/default/triggers/EventTrigger.trigger", triggerCode)
		await graph.indexFileForGraph("force-app/main/default/classes/EventHandler.cls", handlerCode)

		graph.resolveApexCallEdges()
		graph.aggregateCallChainMetrics()

		expect(graph.getNode("PlatformEvent:EventHandler")).toBeUndefined()
		expect(graph.getNode("PlatformEvent:Invoice__c.EventHandler")).toBeDefined()

		const orphanEdges = graph.getEdges().filter((e) => e.targetId.toLowerCase() === "platformevent:eventhandler")
		expect(orphanEdges.length).toBe(0)
	})

	it("rebuilds edgeKeys and adjacency on removeFile and prevents edge duplication across multiple file saves", async () => {
		const triggerFile = "force-app/main/default/triggers/DedupeTrigger.trigger"
		const handlerFile = "force-app/main/default/classes/DedupeHandler.cls"

		const triggerCode = `
trigger DedupeTrigger on Invoice__c (before update) {
    DedupeHandler.run();
}
`
		const handlerCode = `
public class DedupeHandler {
    public static void run() {
        inv.Total__c = 100;
    }
}
`
		await graph.indexFileForGraph(triggerFile, triggerCode)
		await graph.indexFileForGraph(handlerFile, handlerCode)

		graph.resolveApexCallEdges()
		graph.aggregateCallChainMetrics()

		const initialEdgeCount = graph.getEdges().length

		// Simulate 3 edits on an unrelated file
		for (let i = 0; i < 3; i++) {
			graph.removeFile(triggerFile)
			await graph.indexFileForGraph(triggerFile, triggerCode)
			graph.resolveApexCallEdges()
			graph.aggregateCallChainMetrics()
		}

		expect(graph.getEdges().length).toBe(initialEdgeCount)
	})
})

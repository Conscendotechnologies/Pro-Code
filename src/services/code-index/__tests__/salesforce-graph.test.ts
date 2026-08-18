import { describe, it, expect, beforeEach } from "vitest"
import { SalesforceGraphEngine } from "../processors/salesforce-graph"

describe("SalesforceGraphEngine", () => {
	let graph: SalesforceGraphEngine

	beforeEach(() => {
		graph = SalesforceGraphEngine.getInstance()
		graph.clear()
	})

	it("indexes SObject and CustomField relationships into graph", async () => {
		const sampleFieldXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Amount__c</fullName>
    <label>Amount</label>
    <type>Currency</type>
    <required>true</required>
</CustomField>`

		await graph.indexFileForGraph(
			"force-app/main/default/objects/Invoice__c/fields/Amount__c.field-meta.xml",
			sampleFieldXml,
		)

		expect(graph.hasNode("Invoice__c")).toBe(true)
		expect(graph.hasNode("Invoice__c.Amount__c")).toBe(true)

		const edges = graph.getEdges()
		expect(edges.some((e) => e.sourceId === "Invoice__c" && e.targetId === "Invoice__c.Amount__c")).toBe(true)
	})

	it("indexes Apex SOQL queries and calculates blast radius with O(1) adjacency map", async () => {
		const sampleApex = `
public with sharing class InvoiceService {
    public static List<Invoice__c> getInvoices() {
        return [SELECT Id, Amount__c FROM Invoice__c];
    }
}
`
		await graph.indexFileForGraph("force-app/main/default/classes/InvoiceService.cls", sampleApex)
		const blast = graph.getBlastRadius("Invoice__c", "upstream")
		expect(blast.upstreamDependents.some((n) => n.id === "InvoiceService")).toBe(true)
	})

	it("exports graph markdown network string", async () => {
		await graph.indexFileForGraph("force-app/main/default/classes/TestService.cls", "public class TestService {}")
		const network = await graph.exportGraphNetwork()
		expect(network.includes("TestService")).toBe(true)
	})
})

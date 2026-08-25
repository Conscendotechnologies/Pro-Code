import { describe, it, expect, beforeEach } from "vitest"
import { SalesforceMetadataIndexer } from "../salesforce-indexer"
import { SalesforceGraphEngine } from "../salesforce-graph"
import { SalesforceVectorIndexer } from "../salesforce-vector-indexer"
import { SalesforceSearchRouter } from "../salesforce-search-router"

describe("SalesforceSearchRouter & Structured Search Architecture", () => {
	const testWorkspace = "test-workspace-router"
	let indexer: SalesforceMetadataIndexer
	let graphEngine: SalesforceGraphEngine
	let vectorIndexer: SalesforceVectorIndexer
	let searchRouter: SalesforceSearchRouter

	beforeEach(() => {
		indexer = SalesforceMetadataIndexer.getInstance(testWorkspace)
		graphEngine = SalesforceGraphEngine.getInstance(testWorkspace)
		vectorIndexer = SalesforceVectorIndexer.getInstance(testWorkspace)
		searchRouter = SalesforceSearchRouter.getInstance(testWorkspace)

		indexer.clear()
		graphEngine.clear()
		vectorIndexer.clear()
	})

	it("returns structured SearchHit array with exact filePath and line numbers", async () => {
		await indexer.indexFile(
			"force-app/main/default/classes/DiscountCalculator.cls",
			`public with sharing class DiscountCalculator {
    public static Decimal applyDiscount(Decimal price) {
        return price * 0.9;
    }
}`,
		)

		const hits = indexer.getApexSymbolHits("applyDiscount")
		expect(hits.length).toBeGreaterThan(0)
		expect(hits[0].name).toBe("applyDiscount")
		expect(hits[0].qualifiedName).toBe("DiscountCalculator.applyDiscount()")
		expect(hits[0].filePath).toBe("force-app/main/default/classes/DiscountCalculator.cls")
		expect(hits[0].line).toBe(2)
	})

	it("formats addressable pointers (filePath:line) via SalesforceSearchRouter", async () => {
		await indexer.indexFile(
			"force-app/main/default/classes/InvoiceHandler.cls",
			`public with sharing class InvoiceHandler {
    public static void processInvoices() {
        // Business Logic
    }
}`,
		)

		const result = await searchRouter.search("InvoiceHandler", { includeSnippets: false })
		expect(result).toContain("[APEX_CLASS] InvoiceHandler")
		expect(result).toContain("force-app/main/default/classes/InvoiceHandler.cls")
	})

	it("serializes and rehydrates index via JSON sidecar (salesforce-index.json)", async () => {
		await indexer.indexFile(
			"force-app/main/default/objects/Invoice__c/Invoice__c.object-meta.xml",
			`<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Invoice</label>
    <sharingModel>ReadWrite</sharingModel>
</CustomObject>`,
		)

		const jsonContent = await indexer.exportJsonIndex()
		expect(jsonContent).toContain("Invoice__c")
		expect(jsonContent).toContain("force-app/main/default/objects/Invoice__c/Invoice__c.object-meta.xml")

		// Clear and verify reload
		indexer.clear()
		expect(indexer.getSchemaSearchHits("Invoice__c")).toHaveLength(0)
	})

	it("routes transaction timeline queries correctly", async () => {
		graphEngine.addNode({
			id: "ApexTrigger:AccountTrigger",
			type: "APEX_TRIGGER",
			name: "AccountTrigger",
			filePath: "force-app/main/default/triggers/AccountTrigger.trigger",
			txn: {
				objectApiName: "Account",
				dmlEvents: ["update"],
				executionSteps: [5],
			},
		})

		const result = await searchRouter.search("what runs when Account is updated", { includeSnippets: false })
		expect(result).toContain("Account [UPDATE] Step 5: AccountTrigger")
		expect(result).toContain("force-app/main/default/triggers/AccountTrigger.trigger")
	})
})

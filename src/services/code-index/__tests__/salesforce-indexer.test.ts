import { describe, it, expect, beforeEach, afterEach } from "vitest"
import * as os from "os"
import * as fs from "fs/promises"
import * as path from "path"
import { SalesforceMetadataIndexer } from "../processors/salesforce-indexer"

describe("SalesforceMetadataIndexer", () => {
	let indexer: SalesforceMetadataIndexer
	const tmpDir = os.tmpdir()

	beforeEach(() => {
		indexer = SalesforceMetadataIndexer.getInstance()
	})

	afterEach(async () => {
		await fs.rm(path.join(tmpDir, ".siid-code"), { recursive: true, force: true }).catch(() => {})
	})

	it("indexes Apex class methods correctly", async () => {
		const sampleApex = `
public with sharing class InvoiceService {
    @AuraEnabled
    public static List<Invoice__c> getInvoices(Id accountId) {
        return [SELECT Id FROM Invoice__c];
    }

    @IsTest
    static void testGetInvoices() {
        System.assert(true);
    }
}
`
		await indexer.indexFile("force-app/main/default/classes/InvoiceService.cls", sampleApex)

		const results = indexer.searchApexSymbols("InvoiceService")
		expect(results).toContain("InvoiceService")
		expect(results).toContain("getInvoices")
		expect(results).toContain("[@AuraEnabled]")
	})

	it("indexes CustomField XML correctly", async () => {
		const sampleFieldXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Amount__c</fullName>
    <label>Amount</label>
    <type>Currency</type>
    <precision>16</precision>
    <scale>2</scale>
    <required>true</required>
</CustomField>`

		await indexer.indexFile(
			"force-app/main/default/objects/Invoice__c/fields/Amount__c.field-meta.xml",
			sampleFieldXml,
		)

		const results = indexer.searchSchema("Amount__c")
		expect(results).toContain("Invoice__c")
		expect(results).toContain("Amount__c")
		expect(results).toContain("Currency")
		expect(results).toContain("[Required]")
	})

	it("exports tree index files to disk deterministically", async () => {
		await indexer.exportTreeIndex(tmpDir)
		const mdPath = path.join(tmpDir, ".siid-code", "SALESFORCE_INDEX.md")
		const exists = await fs
			.stat(mdPath)
			.then(() => true)
			.catch(() => false)
		expect(exists).toBe(true)
	})
})

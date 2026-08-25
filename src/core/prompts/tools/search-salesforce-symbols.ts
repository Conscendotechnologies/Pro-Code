export function getSearchSalesforceSymbolsDescription(): string {
	return `## search_salesforce_symbols
Description: Unified fast local search across Salesforce metadata symbols, Apex classes, triggers, execution timelines, dependency graphs, and offline TF-IDF vector embeddings.
Usage:
<search_salesforce_symbols>
<query>Invoice__c</query>
<category>ALL</category>
</search_salesforce_symbols>
Parameters:
- query: (required) Symbol API name (e.g. Invoice__c), execution timeline question (e.g. "what runs when Account is updated"), dependency query (e.g. "what breaks if Amount__c changes"), or natural language concept.
- category: (optional) Filter scope: ALL (auto intent routing), OBJECT, FIELD, APEX, TRANSACTION, GRAPH.
Note: Results return addressable pointers (filePath:line) with top inline snippets (Hop 1). Use read_file for deeper inspection (Hop 2). For non-Salesforce workspace files (package.json, jest tests, scripts), use search_files.
`
}

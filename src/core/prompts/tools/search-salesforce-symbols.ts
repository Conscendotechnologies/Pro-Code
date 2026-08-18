export function getSearchSalesforceSymbolsDescription(): string {
	return `## search_salesforce_symbols
Description: Fast local in-memory search across indexed Salesforce metadata symbols (Objects, Fields, Picklists, Apex Classes, Triggers, Flows, LWCs).
Usage:
<search_salesforce_symbols>
<query>Invoice__c</query>
<category>OBJECT</category>
</search_salesforce_symbols>
Parameters:
- query: (required) Search string or symbol name
- category: (optional) Filter category: OBJECT, FIELD, APEX_CLASS, APEX_TRIGGER, FLOW, LWC
`
}

export function getSearchSalesforceGraphDescription(): string {
	return `## search_salesforce_graph
Description: Calculate blast radius, interlinked metadata dependency graph, 21-Step Order of Execution Transaction Timelines, Field Mutation Conflicts, Field Lifecycles, Save Pipeline Recursion Loops, or Governor Limit Budgets for any Salesforce symbol.
Usage:
<search_salesforce_graph>
<symbolId>Invoice__c</symbolId>
<mode>governor</mode>
<dmlEvent>update</dmlEvent>
</search_salesforce_graph>
Parameters:
- symbolId: (required) Name of the target SObject, Field, Apex Class, Trigger, or Flow
- mode: (optional) Mode: "blast_radius" (default), "upstream", "downstream", "transaction", "conflicts", "field_lifecycle", "recursion", "governor"
- dmlEvent: (optional) For mode="transaction", "conflicts", or "governor": "insert", "update" (default), "delete", "undelete"
- fieldName: (optional) For mode="field_lifecycle": Target field API name (e.g. "Amount__c")
`
}

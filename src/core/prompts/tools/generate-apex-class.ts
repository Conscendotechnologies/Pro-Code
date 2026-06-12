import { ToolArgs } from "./types"

export function getGenerateApexClassDescription(args: ToolArgs): string {
	return `## generate_apex_class
Description: Generate an Apex class (.cls + .cls-meta.xml) with built-in validation. The tool validates naming conventions, detects SOQL/DML inside loops, checks for missing 'with sharing', and verifies balanced braces. The LLM provides the Apex code body — the tool handles the metadata companion file.

Parameters:
- name: (required) Apex class name in PascalCase, e.g., "InvoiceService", "AccountTriggerHandler"
- content: (required) The complete Apex class source code
- sharing: (optional) "with", "without", or "inherited". Defaults to no explicit modifier
- is_test: (optional) "true" if this is a test class
- api_version: (optional) Salesforce API version. Defaults to 60.0

What it validates:
- PascalCase naming (starts with uppercase letter)
- Name <= 40 characters (Salesforce limit)
- No SOQL queries inside for/while loops
- No DML operations inside for/while loops
- Unbalanced braces
- Missing 'with sharing' on non-test classes
- Missing 'WITH USER_MODE' on SOQL queries

The tool generates both the .cls file AND its .cls-meta.xml companion automatically. Use sf_deploy_metadata to deploy.

Usage:
<generate_apex_class>
<name>InvoiceService</name>
<content><![CDATA[
public with sharing class InvoiceService {
    public static List<Invoice__c> getInvoices(Id accountId) {
        return [SELECT Id, Name, Amount__c FROM Invoice__c WHERE Account__c = :accountId WITH USER_MODE];
    }
}
]]></content>
<sharing>with</sharing>
</generate_apex_class>`
}

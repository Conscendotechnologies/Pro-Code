import { ToolArgs } from "./types"

export function getGenerateApexTriggerDescription(args: ToolArgs): string {
	return `## generate_apex_trigger
Description: Generate an Apex trigger (.trigger + .trigger-meta.xml) with built-in validation. Validates naming, detects anti-patterns, and generates the companion metadata file.

Parameters:
- name: (required) Trigger name, e.g., "AccountTrigger"
- content: (required) The complete Apex trigger source code
- object_name: (required) The SObject API name the trigger is on, e.g., "Account", "Invoice__c"
- api_version: (optional) Salesforce API version. Defaults to 60.0

What it validates:
- PascalCase naming
- No SOQL queries inside loops
- No DML operations inside loops
- Balanced braces

The tool generates both the .trigger file AND its .trigger-meta.xml companion automatically.

Usage:
<generate_apex_trigger>
<name>AccountTrigger</name>
<object_name>Account</object_name>
<content><![CDATA[
trigger AccountTrigger on Account (before insert, before update) {
    for (Account acc : Trigger.new) {
        if (String.isBlank(acc.Industry)) {
            acc.Industry = 'Other';
        }
    }
}
]]></content>
</generate_apex_trigger>`
}

import { ToolArgs } from "./types"

export function getGenerateCustomFieldDescription(args: ToolArgs): string {
	return `## generate_custom_field
Description: Generate a Salesforce CustomField XML on an existing object. All naming conventions, type constraints, XML encoding, and lookup rules are handled automatically.

Parameters:
- object_name: (required) API name of the target object, e.g., "Account", "Invoice__c"
- label: (required) Display name for the field, e.g., "Customer Type"
- api_name: (optional) API name — auto-generated from label (appends __c, replaces spaces)
- type: (optional) Field type. Defaults to "Text". Supported: Text, Number, Currency, Picklist, MultiselectPicklist, Lookup, Formula, AutoNumber, Checkbox, Date, DateTime, Email, Phone, Url, Percent, TextArea, LongTextArea, RichTextArea, Location
- length: (optional) Max length for text fields (1-255)
- precision: (optional) Total digits for Number/Currency (1-18)
- scale: (optional) Decimal places for Number/Currency
- picklist_values: (optional) Comma-separated picklist values, e.g., "Pending,Paid,Cancelled"
- reference_to: (optional) Target object for Lookup fields
- delete_constraint: (optional) "SetNull", "Restrict", or "Cascade" for Lookup fields
- relationship_label: (optional) Related list display name for Lookup fields
- relationship_name: (optional) API name for the relationship
- formula: (optional) Formula expression (XML entities escaped automatically)
- required: (optional) "true" or "false"
- unique: (optional) "true" or "false"
- external_id: (optional) "true" or "false"

XML is generated and XSD-validated automatically. Use sf_deploy_metadata to deploy.

Usage:
<generate_custom_field>
<object_name>Invoice__c</object_name>
<label>Amount</label>
<type>Currency</type>
<precision>16</precision>
<scale>2</scale>
<required>true</required>
</generate_custom_field>`
}

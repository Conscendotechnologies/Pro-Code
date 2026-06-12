import { ToolArgs } from "./types"

export function getGenerateCustomObjectDescription(args: ToolArgs): string {
	return `## generate_custom_object
Description: Generate a complete Salesforce CustomObject with correct XML, custom tab, and optional custom fields. All naming conventions, XML encoding, and Salesforce constraints are handled automatically — you provide typed parameters, the generator produces deployment-ready files.

Parameters:
- label: (required) Display name for the object, e.g., "Invoice", "Payment Record"
- api_name: (optional) API name for the object. Auto-generated from label if not provided (appends __c, replaces spaces with underscores)
- plural_label: (optional) Plural label. Auto-generated from label (handles Country → Country, Category → Categories, etc.)
- enable_reports: (optional) Defaults to "true"
- enable_activities: (optional) Defaults to "true"
- enable_feeds: (optional) Defaults to "true"
- enable_history: (optional) Defaults to "true"
- sharing_model: (optional) "Private", "ReadOnly", or "ReadWrite". Defaults to "ReadWrite"
- name_field_label: (optional) Label for the Name field. Defaults to "{Label} Name"
- create_tab: (optional) Whether to generate a custom tab. Defaults to "true"
- fields_json: (optional) JSON array of custom field definitions. Each field has: label, type, length, precision, scale, picklistValues, referenceTo, deleteConstraint, required, unique. See field types below.

Supported field types (for fields_json): Text, Number, Currency, Picklist, MultiselectPicklist, Lookup, Formula, AutoNumber, Checkbox, Date, DateTime, Email, Phone, Url, Percent, TextArea, LongTextArea, RichTextArea, Location

XML is generated and XSD-validated automatically. Use sf_deploy_metadata to deploy.

Usage:
<generate_custom_object>
<label>Invoice</label>
<api_name>Invoice__c</api_name>
<sharing_model>ReadWrite</sharing_model>
<fields_json>[{"label": "Amount", "type": "Currency", "precision": 16, "scale": 2, "required": true}, {"label": "Status", "type": "Picklist", "picklistValues": [{"label": "Pending"}, {"label": "Paid", "isDefault": true}]}]</fields_json>
</generate_custom_object>`
}

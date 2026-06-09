import { ToolArgs } from "./types"

export function getValidateSfMetadataDescription(args: ToolArgs): string {
	return `## validate_sf_metadata
Description: Validate Salesforce metadata XML against the official Metadata API XSD schema (v66.0). Runs entirely in-process — no network calls, no "sf" CLI. Catches missing required elements, invalid enum values, type mismatches, and business rule violations before deployment.

Parameters:
- metadata_path: (required) Path to the metadata file or folder to validate. Examples: "force-app/main/default/objects/Invoice__c" (validates entire object + all fields within), "force-app/main/default/classes/InvoiceService.cls" (validates the .cls file)

When to use this tool:
- After writing any Salesforce metadata XML with write_to_file
- Before calling sf_deploy_metadata
- When unsure if XML is correctly structured

What it validates:
- XSD structure: every element exists in the schema, required elements present, enum values valid, boolean types correct
- Business rules: lookup SetNull+required conflict, profile editable-requires-readable
- Auto-detects metadata type from file extension (.object-meta.xml → CustomObject, .field-meta.xml → CustomField, etc.)

Note: This validates XML STRUCTURE against the real Salesforce schema. It does NOT validate cross-references (like whether Account.MyField__c actually exists on Account). Use retrieve_sf_metadata to verify cross-references.

Usage:
<validate_sf_metadata>
<metadata_path>force-app/main/default/objects/Invoice__c</metadata_path>
</validate_sf_metadata>`
}

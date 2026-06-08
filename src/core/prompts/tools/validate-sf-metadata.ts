import { ToolArgs } from "./types"

export function getValidateSfMetadataDescription(args: ToolArgs): string {
	const cwd = args.cwd || "."
	return `## validate_sf_metadata
Description: Validate Salesforce metadata XML files against naming conventions, schema rules, and Salesforce API constraints. Catches errors BEFORE deployment — use after writing metadata files and before deploying.

Parameters:
- metadata_path: (required) Absolute or relative path to the metadata file or folder to validate. Examples: "force-app/main/default/objects/Invoice__c" (validates entire object + fields + tab), "force-app/main/default/classes/InvoiceService.cls" (validates Apex + metadata companion)
- metadata_type: (optional) Specify the metadata type to avoid auto-detection. One of: CustomObject, CustomField, ApexClass, ApexTrigger, Profile

When to use this tool:
- After generating any Salesforce metadata XML with write_to_file
- Before running sf_deploy_metadata
- When you want to self-check your work for correctness

What it validates:
- CustomObject: namespace, required elements, double-underscore violations, tab file existence
- CustomField: namespace, type-specific rules (lookup deleteConstraint, formula entity encoding), naming
- ApexClass/ApexTrigger: metadata companion existence, balanced braces, SOQL/DML in loops
- Profile: field permission dependency rules (editable requires readable), Object.Field format

Usage:
<validate_sf_metadata>
<metadata_path>force-app/main/default/objects/Invoice__c</metadata_path>
</validate_sf_metadata>`
}

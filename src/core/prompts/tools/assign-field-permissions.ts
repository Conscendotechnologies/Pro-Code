import { ToolArgs } from "./types"

export function getAssignFieldPermissionsDescription(args: ToolArgs): string {
	return `## assign_field_permissions
Description: Assign field-level permissions (read/edit) to a Salesforce Profile. Validates dependency rules (editable requires readable) before writing. Generates the correct <fieldPermissions> XML blocks.

Parameters:
- profile_name: (required) Profile name, e.g., "Admin", "System Administrator"
- fields_json: (required) JSON array of field permissions. Each entry has: field, readable, editable.
  Format: [{"field":"Account.Phone","readable":true,"editable":true}]
  Field format must be ObjectApiName.FieldApiName, e.g., "Invoice__c.Customer_Type__c"

After generation, use validate_sf_metadata to verify, then sf_deploy_metadata to deploy.

Usage:
<assign_field_permissions>
<profile_name>Admin</profile_name>
<fields_json>[{"field":"Invoice__c.Amount__c","readable":true,"editable":true},{"field":"Invoice__c.Status__c","readable":true,"editable":false}]</fields_json>
</assign_field_permissions>`
}

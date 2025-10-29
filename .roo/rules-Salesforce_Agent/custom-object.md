**Salesforce Object Creation**

# Mode Overview

This mode assists the AI model in creating Salesforce objects by generating the necessary XML files in the objects directory. It ensures that object names follow Salesforce conventions. The generated XML is compliant with Salesforce Metadata API standards and ready for deployment.

**Instructions(IMPORTANT!!)**

# Strict Rules for Salesforce Object Creation

## Check Existing Object

- Before creating a new object, check if the object already exists in the objects directory.
- If the object already exists:
    - Inform the user that the object is already present.
    - Ask: “Do you want to create new fields for this object or create a completely new object?”
- If the object does not exist, continue with the rules below.

## Folder Creation

Always create a folder in the objects directory with the same name as the object.
Example: For object Invoice_Item**c, create folder objects/Invoice_Item**c.

## File Creation

Inside the folder, create the object XML file with this format:
<ObjectApiName>.object-meta.xml
Example: Invoice_Item**c/Invoice_Item**c.object-meta.xml.

## Naming Conventions

- Replace spaces with underscores in object and file names.
    ### objectApiName rules:
    - Only letters, numbers, and underscores allowed.
    - Must start with a letter.
    - Must be unique.
    - Cannot end with an underscore.
    - Cannot contain consecutive underscores.

## Labels and Pluralization

- The label must always be the singular form of the object name.
- The pluralLabel must always be the plural form, unless the word should never be pluralized (e.g., Country, City, Person, Name, Data).
- Examples:
    - Flower → Label: Flower | PluralLabel: Flowers
    - Invoice → Label: Invoice | PluralLabel: Invoices
    - Country → Label: Country | PluralLabel: Country (no pluralization applied)

## Enable Features

- Always set the following to true in the XML definition:
    - enableReports
    - enableActivities
    - enableFeeds
    - enableHistory

## Tab Creation (MANDATORY)

- When creating a custom object you MUST also create a corresponding custom tab. Tab creation is required and cannot be skipped.
- Create the tab file at:

```
force-app/main/default/tabs/<ObjectApiName>.tab-meta.xml
```

- Example minimal Tab XML (replace placeholders):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <customObject>true</customObject>
    <motif>Custom53: Bell</motif>
</CustomTab>

```

- Ensure the tab file name and the object API name match the custom object. The tab file must be staged and deployed together with the object and any related metadata.

## Dry Run and deployment for objects(Mandatory)

- Before deploying the created objects and tabs into the org do the dry run first using below command
- Do dry run for all objects at once.
  `sf project deploy start --dry-run --source-dir force-app/main/default/objects/<ObjectApiName>`
- If got any errors after dry run solve them.
- After successful dry run then proceed with deloyment process.
- Do deploy all objects at once.
  `sf project deploy start --source-dir force-app/main/default/objects/<ObjectApiNames>`
- Replace <ObjectApiName> with the actual object API name (e.g., Invoice_Item\_\_c).

## Dry Run and deployment for tabs(Mandatory)

- After creating all objects and tabs, automatically deploy it to the default Salesforce org using the Salesforce CLI.
- Run the deployment command after creating all objects and tabs creation
- Do dry run for all tabs at once.
  `sf project deploy start --dry-run --source-dir force-app/main/default/tabs/<ObjectApiName>.tab-meta.xml`
- If got any errors after dry run solve them.
- After successful dry run then proceed with deloyment process.
- Do deploy all tabs at once.
  `sf project deploy start --source-dir force-app/main/default/tabs/<ObjectApiName>.tab-meta.xml`
- Replace <ObjectApiNames> with the all objects that are created comma separated.

## Compliance

- The XML must follow Salesforce Metadata API standards.
- The XML must be deployable via:
    - Salesforce Change Sets
    - VS Code Salesforce Extensions
    - Salesforce CLI (sfdx)

## Session Behavior

- When the session starts:
  -Immediately initialize the workflow.
  -Begin the object creation process without asking what the user wants.

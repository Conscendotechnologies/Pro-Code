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

## Automatic Deployment

- After creating each object, automatically deploy it to the default Salesforce org using the Salesforce CLI.
- Run the deployment command immediately after object creation: `sf project deploy start --source-dir force-app/main/default/objects/<ObjectApiName>`
- Replace <ObjectApiName> with the actual object API name (e.g., Invoice_Item\_\_c).

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

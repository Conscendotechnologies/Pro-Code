# **Salesforce Object Creation**

## Mode Overview

This mode assists AI model in creating Salesforce objects by generating the necessary XML files in the objects directory. It ensures that object names follow Salesforce conventions. The generated XML is compliant with Salesforce Metadata API standards and ready for deployment.

## Instructions

### Salesforce Object Creation

- Whenever a user requests the creation of a Salesforce object, always create a file in objects directory and write the xml in it.
- Salesforce object file names must use underscores instead of spaces, and objectApiName can only contain letters, numbers, and underscores, must start with a letter, be unique, not end with an underscore, and not have consecutive underscores.  
  **Example:** `Invoice_Item__c.object-meta.xml` with `objectApiName="Invoice_Item__c"`.
- The generated XML must follow Salesforce Metadata API standards and be deployable via change sets, VS Code Salesforce extensions, or sfdx CLI.

### When the session starts, immediately:

1. Initialize the workflow by using the update_todo_list tool
2. Begin the object creation process without asking what they want to do

---

## Update Todo List

- [ ] Check if requested object already exists in the objects directory or not.
- [ ] Create a file in the objects directory with the appropriate name format (underscores instead of spaces).
- [ ] Write the Salesforce object metadata XML in the created file.
- [ ] Ensure the objectApiName follows Salesforce naming conventions (letters, numbers, underscores, starts with a letter, unique, no ending underscore, no consecutive underscores).
- [ ] Confirm the XML is compliant with Salesforce Metadata API standards.
- [ ] Verify that the XML file is deployable via change sets, VS Code Salesforce extensions, or sfdx CLI.

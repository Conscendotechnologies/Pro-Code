1. **Salesforce Object Creation**:
    - Whenever a user requests the creation of a Salesforce object, always create a file in objects directory and write the xml in it.
    - Salesforce object file names must use underscores instead of spaces, and objectApiName can only contain letters, numbers, and underscores, must start with a letter, be unique, not end with an underscore, and not have consecutive underscores.
      Example: Invoice_Item**c.object-meta.xml with objectApiName="Invoice_Item**c".
    - The generated XML must follow Salesforce Metadata API standards and be deployable via change sets, VS Code Salesforce extensions, or sfdx CLI.
2. Follow Lightning Web Component best practices in all code examples.
3. Explain how to properly use the Lightning Data Service for data operations.
4. Demonstrate proper component communication techniques (events, pubsub, etc.).
5. Provide guidance on Lightning Design System usage for consistent UI.
6. Show how to implement responsive design in Lightning components.
7. Explain performance optimization techniques for Lightning Web Components.
8. Guide users on proper error handling and user feedback mechanisms.
9. Demonstrate how to integrate with Salesforce APIs from Lightning components.

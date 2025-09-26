# Metadata Companion Rules

When creating a new Apex class or trigger:

1. Create BOTH source file and `*-meta.xml` in the same tool invocation.
2. Template (class):
    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
        <apiVersion>59.0</apiVersion>
        <status>Active</status>
    </ApexClass>
    ```
3. Template (trigger):
    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <ApexTrigger xmlns="http://soap.sforce.com/2006/04/metadata">
        <apiVersion>59.0</apiVersion>
        <status>Active</status>
    </ApexTrigger>
    ```
4. Do not omit or defer metadata companions.

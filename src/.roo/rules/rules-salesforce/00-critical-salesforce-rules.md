# Salesforce Mode Critical Rule Block

Priority order for the `salesforce` mode:

1. ALWAYS generate required companion metadata files:
    - `MyClass.cls` + `MyClass.cls-meta.xml`
    - `MyTrigger.trigger` + `MyTrigger.trigger-meta.xml`
    - LWC: folder + `component.js/meta.xml`
2. If creating a test class, also supply its `*-meta.xml`.
3. Use the same `<apiVersion>` across new metadata (derive from existing highest version or sfdx-project.json if present).
4. If a referenced field (e.g. `Account.SomeField__c`) is not found in `force-app/main/default/objects`, ask before adding it.
5. NEVER silently add schema changes; require confirmation.
6. Provide a summary of governor limit considerations and security posture at the end of a change set.

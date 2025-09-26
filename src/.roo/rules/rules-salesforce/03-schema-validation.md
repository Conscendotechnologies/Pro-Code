# Schema Validation Procedure

Before referencing `Object__c.Field__c`:

1. Search `force-app/main/default/objects` for its definition.
2. If not present, ASK user if it should be created.
3. If yes, create or extend the appropriate `.object-meta.xml` with proper `<fields>` block.
4. Never fabricate field datatypes or relationships; confirm or clarify first.

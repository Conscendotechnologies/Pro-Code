# Global Salesforce Instructions

These apply to ALL modes:

1. **Use generators for metadata**: Always use the generate\_\* tools (generate_custom_object, generate_custom_field, generate_apex_class, etc.) for creating Salesforce metadata. Never generate raw XML manually.

2. **Validate before deploy**: Run validate_sf_metadata before sf_deploy_metadata. Fix errors before deploying.

3. **Governor Limits**: Bulkify all Apex logic; no SOQL or DML inside loops.

4. **Security**: Use `with sharing` on Apex classes. Use `WITH USER_MODE` in SOQL. Apply CRUD/FLS checks.

5. **Tests**: For any production Apex change, create/update a test class targeting >=85% coverage.

6. **Clarify ambiguity**: Ask before inventing fields, objects, or schema.

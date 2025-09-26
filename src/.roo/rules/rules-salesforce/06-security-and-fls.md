# Security & Sharing

- Use `with sharing` unless exception is justified.
- For service/controller logic that exposes or processes user data, verify CRUD/FLS:
  Example:
    ```apex
    if (!Schema.sObjectType.Account.fields.Name.isAccessible()) {
        throw new AuthorizationException('No access to Account.Name');
    }
    ```
- Only use `without sharing` with a documented reason.

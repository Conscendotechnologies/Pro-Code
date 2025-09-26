# Testing & Coverage

- Target ≥85% coverage for modified/new classes.
- Use `@IsTest` test classes named `<ProdClassName>Test`.
- Exercise:
    - Bulk operations (insert/update lists)
    - Positive & negative paths
    - Security / FLS scenarios where relevant
    - Async / Queueable / Batch flows (use Test.startTest()/stopTest())
- Assertions: Validate functional outcomes, not just non-null results.

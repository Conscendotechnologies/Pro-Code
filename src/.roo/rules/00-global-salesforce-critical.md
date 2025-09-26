# Global Critical Salesforce Instructions

These global instructions apply to ALL modes, but are especially critical in `salesforce` mode:

1. Metadata Pairing (CRITICAL): Any new Apex class, trigger, or LWC MUST include its companion `*-meta.xml` (correct `<apiVersion>` & `<status>`).
2. Schema Verification: NEVER invent fields or objects. Search the workspace first. If not found, ask before creating metadata.
3. Tests & Coverage: For any changed production class, create/update a corresponding test class targeting ≥85% coverage with bulk, positive, negative cases.
4. Governor Limits: Bulkify logic; no SOQL or DML inside loops; minimize heap and query counts.
5. Security: Apply CRUD/FLS checks in service/controller layers; default to `with sharing`.
6. Minimal Diff Principle: Change only necessary lines. Do not reformat entire files unless explicitly requested.
7. Clarify Ambiguity: If any specification (field name, object, behavior) is ambiguous, ask before proceeding.

Always follow these prior to finalizing tool usage (apply_diff/write_to_file).

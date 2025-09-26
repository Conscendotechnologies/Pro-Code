# Governor Limits & Bulkification

- No SOQL/DML inside loops.
- Accumulate records in lists; perform single DML per logical operation set.
- Minimize queries; combine field sets in one query where appropriate.
- Avoid unselective WHERE clauses for large data volumes.
- Document any potential limit risk after implementing logic.

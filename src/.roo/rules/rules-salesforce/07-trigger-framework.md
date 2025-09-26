# Trigger Framework Guidelines

- One trigger per object.
- Delegate logic to handler classes (e.g. `AccountTriggerHandler`).
- Bulk-safe: handlers process `Trigger.new` collections.
- Guard recursion if needed (static set / recursion flags).

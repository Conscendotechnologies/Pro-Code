# Apex File Structure & Conventions

- Apex Class: `classes/ClassName.cls` + `classes/ClassName.cls-meta.xml`
- Apex Trigger: `triggers/TriggerName.trigger` + `triggers/TriggerName.trigger-meta.xml`
- Test Classes end with `Test` or `Tests`.
- Batchable, Queueable, Schedulable classes explicitly implement required interfaces.
- Keep helper/service classes cohesive; avoid god classes.

import { ToolArgs } from "./types"

export function getUpdateTodoListDescription(args?: ToolArgs): string {
	return `## update_todo_list
Description: Replace the entire TODO list with an updated checklist. Always provide the full list — the system overwrites the previous one. Use for multi-step tasks to track progress.

Format: single-level markdown checklist, in execution order.
- [ ] pending  - [-] in_progress  - [x] completed

Rules:
- Only ONE item in_progress at a time. Work top-to-bottom; do not skip ahead.
- Mark completed only when fully done. Add new items as they're discovered.
- Do not remove unfinished todos unless explicitly told to.

Usage:
<update_todo_list>
<todos>
[x] Analyze requirements
[-] Generate custom object
[ ] Add custom fields
[ ] Deploy to org
</todos>
</update_todo_list>`
}

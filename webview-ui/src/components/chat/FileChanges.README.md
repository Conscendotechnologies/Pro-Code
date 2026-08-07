# FileChanges Component

Displays the files changed during the current task, with per-file line counts, status icons, Salesforce deployment badges, and per-file diff/revert actions.

## Where the data comes from

The component is **presentational only**. It renders whatever `files` it is given and owns no fetching, persistence, or caching.

The data originates in the task's **shadow git repository** — a repo the checkpoints service maintains at `<globalStorage>/tasks/<taskId>/checkpoints/.git` with `core.worktree` pointed at the workspace. The user's own `.git` is never read or written, so this works even in a workspace with no git repo or no source tracking configured.

```
ShadowCheckpointService.getFileChangeSummary()   // git diffSummary + --name-status
        ↓
getTaskFileChanges(cline)                        // src/core/checkpoints/index.ts
        ↓  merges in-memory deployment status
postMessageToWebview({ type: "fileChanges" })
        ↓
useFileChangesBackend(taskId)                    // subscribes; no polling
        ↓
<FileChanges files={...} />
```

Counts are **cumulative from task start**, not per-edit: a file edited three times shows its total change. Because git diffs the workspace rather than the agent, changes made outside the agent during a task (manual edits, build output) are included — git cannot attribute a change to its author.

The extension pushes an updated list whenever a checkpoint is saved (after every file-writing tool) and on Salesforce deploy phase transitions. The hook only requests an initial list when the task changes.

When checkpoints are unavailable — disabled by setting, git not installed, or nested git repos in the workspace — the list is empty and nothing renders.

## Usage

```tsx
const { files } = useFileChangesBackend(currentTaskItem?.id)

{
	files.length > 0 && (
		<FileChanges
			files={files}
			variant="list"
			defaultCollapsed={true}
			onViewDiff={openVsCodeDiff}
			onRevert={revertFile}
			className="px-3.5 mb-2"
		/>
	)
}
```

## Props

### FileChangesProps

| Prop               | Type                         | Default    | Description                                 |
| ------------------ | ---------------------------- | ---------- | ------------------------------------------- |
| `files`            | `FileChange[]`               | _required_ | Files to display                            |
| `variant`          | `"list" \| "detail"`         | `"list"`   | Display variant                             |
| `defaultCollapsed` | `boolean`                    | `true`     | Initial collapsed state (list variant only) |
| `onFileClick`      | `(path: string) => void`     | _optional_ | Overrides the default "open file" behavior  |
| `onViewDiff`       | `(file: FileChange) => void` | _optional_ | Shows the diff button when provided         |
| `onRevert`         | `(file: FileChange) => void` | _optional_ | Shows the revert button when provided       |
| `className`        | `string`                     | `""`       | Additional CSS classes                      |

### FileChange

```typescript
type FileChange = {
	path: string
	additions?: number
	deletions?: number
	status?: "modified" | "created" | "deleted" | "renamed"
	deploymentStatus?: DeploymentStatus
	error?: string // Deployment error, when deploymentStatus is "failed"
}

type DeploymentStatus = "local" | "dry-run" | "deploying" | "deployed" | "failed"
```

Diff text is deliberately **not** on this type — shipping full before/after content for every row would be wasteful when most are never opened. `onViewDiff` posts an `openDiff` message and the extension reads the content from the shadow repo on demand.

## Variants

**`list`** — collapsible, for the chat interface. Header shows the file count and deployment status chips.

**`detail`** — always expanded, with total additions/deletions in the header. Currently unused.

## Actions

Clicking a **file path** opens it in the editor. The diff and revert buttons only render when their handler is supplied.

**View diff** opens VS Code's native diff editor showing _"Changes since task started"_ — the file's content at the task's base commit versus the file on disk. Because the right-hand side is the real file, VS Code's own gutter arrows work, giving per-hunk revert for free.

> The inline `Edit:` rows in the chat transcript (rendered by `ChatRow`, not this component) use the same `openDiff` message but pass the `{from, to}` hashes of the checkpoint that edit produced, so their diff is scoped to that single operation and matches the `+/-` shown beside it.

**Revert** restores the file to its content at task start via `git checkout <baseHash> -- <path>` in the shadow repo; a file created during the task is deleted instead. Other files are untouched. This is destructive and not undoable from the panel, so it confirms first.

## Status icons

| Status     | Icon                    | Color                                      |
| ---------- | ----------------------- | ------------------------------------------ |
| `created`  | `codicon-diff-added`    | `gitDecoration-addedResourceForeground`    |
| `modified` | `codicon-diff-modified` | `gitDecoration-modifiedResourceForeground` |
| `deleted`  | `codicon-diff-removed`  | `gitDecoration-deletedResourceForeground`  |
| `renamed`  | `codicon-diff-renamed`  | `gitDecoration-renamedResourceForeground`  |
| _default_  | `codicon-file`          | `editor-foreground`                        |

## Deployment status

Deployment status is the one field git cannot supply — whether a file reached a Salesforce org is org state, not workspace state. It is tracked separately in `src/services/file-changes/deploymentStatus.ts` and merged onto the git summary when the list is built.

That store is **in-memory**, so status is lost on window reload: the badge disappears while the file list and line counts, which come from git, survive. Persisting it is a deliberate deferral, not an oversight.

| Status      | Label     | Icon                | Color             |
| ----------- | --------- | ------------------- | ----------------- |
| `local`     | Local     | `codicon-file`      | Blue              |
| `dry-run`   | Dry Run   | `codicon-debug-alt` | Purple            |
| `deploying` | Deploying | `codicon-sync~spin` | Orange (animated) |
| `deployed`  | Deployed  | `codicon-check`     | Green             |
| `failed`    | Failed    | `codicon-error`     | Red               |

## Related files

| File                                                  | Role                                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `useFileChangesBackend.ts`                            | Subscribes to `fileChanges` pushes                                            |
| `src/core/checkpoints/index.ts`                       | `getTaskFileChanges`, `postFileChanges`, `openTaskFileDiff`, `revertTaskFile` |
| `src/services/checkpoints/ShadowCheckpointService.ts` | `getFileChangeSummary`, `revertFile`                                          |
| `src/services/file-changes/deploymentStatus.ts`       | Per-task deployment status map                                                |

## License

Part of the Roo-Code/Siid-Code project.

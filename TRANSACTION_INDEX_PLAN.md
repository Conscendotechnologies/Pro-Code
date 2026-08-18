# Transaction Index — Implementation Plan

Adding the temporal layer to the Salesforce GraphRAG engine: pinning every piece of
automation to its exact position in the Salesforce Order of Execution, so the agent
knows **when** logic runs and **what side effects it causes** — not just what is connected.

- **Base commit:** `9bb533c1f`
- **Branch:** `feature/salesforce-codebase-indexing`
- **Status:** planning — nothing implemented yet

---

## 1. Goal

The engine today answers _structural_ questions:

> "What references `Invoice__c.Amount__c`?"

After this work it also answers _temporal_ questions:

> "I'm about to update `Invoice__c`. What runs, in what order, what mutates `Amount__c`
> before the validation rule sees it, and does anything re-enter the save cycle?"

Concretely, four new capabilities:

| Capability               | Question it answers                                                       |
| ------------------------ | ------------------------------------------------------------------------- |
| **Transaction timeline** | What automation fires on this object + DML event, in canonical order?     |
| **Field lifecycle**      | Who writes `Amount__c`, who reads it, and in what sequence before commit? |
| **Conflict detection**   | Do two pieces of automation mutate the same field at adjacent steps?      |
| **Recursion detection**  | Does a field update re-enter the trigger pipeline, and is it guarded?     |

Plus a governor surface: cumulative SOQL/DML counts across the synchronous group,
with queries-in-loops flagged.

---

## 2. Architecture decision

**One store. Three modules. A separate export artifact.**

The Transaction Index is **not** a fourth engine beside the metadata graph, the vector
index, and the symbol indexer. It is a set of attributes on nodes that already exist,
plus new node types for automation that currently isn't indexed at all.

### Why not a separate store

- **Same source files feed both.** `.trigger`, `.flow-meta.xml`, and `.field-meta.xml`
  are inputs to the structural graph _and_ the transaction model. Two stores means
  parsing every file twice on the debounce path, or one parser fanning out to two
  writers — the sync problem in disguise.
- **Lifecycle duplication is where bugs live.** A fourth store needs its own
  `getInstance` workspace map, `clear()`, `removeFile()`, and four new call sites in
  `salesforce-standalone-indexer.ts`. Every lifecycle bug so far has been in exactly
  that category.
- **The useful queries cross both.** Blast radius wants structural edges _and_ step
  positions. Conflict detection wants field mutations _and_ ordering. Split stores mean
  joining by string ID across two maps with no referential integrity.
- **Node identity is shared.** `InvoiceTrigger` is one node, not two.

### File layout

```
src/services/code-index/processors/
  salesforce-graph.ts            store, edges, BFS  — extended, not restructured
  salesforce-automation.ts       NEW · parsers for the 8 new metadata types
  salesforce-transaction.ts      NEW · OOE_STEPS + analysis (pure functions, no state)
  salesforce-indexer.ts          unchanged
  salesforce-vector-indexer.ts   unchanged
  salesforce-standalone-indexer.ts   wiring only
```

`salesforce-transaction.ts` holds **no state**. It takes the graph and returns results.
Nothing to invalidate, nothing to keep in sync, no fourth `removeFile`.

### Export artifact

New file alongside the existing two:

```
.siid-code/
  SALESFORCE_INDEX.md          existing
  SALESFORCE_GRAPH.md          existing
  SALESFORCE_TRANSACTIONS.md   NEW
```

Written from the same debounced export path.

---

## 3. Canonical Order of Execution

Store this as a constant and key every node off it. Use the **full 21-step numbering** —
do not invent a compressed scale, or the governor grouping and the agent's reasoning
will drift apart.

|      Step | Stage                                                                                                   | Local source                         |
| --------: | ------------------------------------------------------------------------------------------------------- | ------------------------------------ |
|       1–2 | Load original record; overwrite with request values                                                     | —                                    |
|         3 | System validation (required, format, length)                                                            | `field-meta.xml`                     |
|     **4** | **Before-save record-triggered flows**                                                                  | `flow-meta.xml`                      |
|     **5** | **Before triggers**                                                                                     | `.trigger`                           |
|     **6** | **System validation again + custom validation rules**                                                   | `validationRule-meta.xml`            |
|     **7** | **Duplicate rules**                                                                                     | `duplicateRule-meta.xml`             |
|         8 | Save to database — _not committed_                                                                      | —                                    |
|     **9** | **After triggers**                                                                                      | `.trigger`                           |
|    **10** | **Assignment rules** _(Lead and Case only)_                                                             | `assignmentRules-meta.xml`           |
|    **11** | **Auto-response rules**                                                                                 | `autoResponseRules-meta.xml`         |
|    **12** | **Workflow rules + Process Builder**                                                                    | `workflow-meta.xml`, `flow-meta.xml` |
|    **13** | **Workflow field-update re-entry**                                                                      | `workflow-meta.xml`                  |
|    **14** | **After-save record-triggered flows**                                                                   | `flow-meta.xml`                      |
|    **15** | **Escalation rules**                                                                                    | `escalationRules-meta.xml`           |
|    **16** | **Entitlement rules**                                                                                   | `entitlementProcess-meta.xml`        |
| **17–18** | **Roll-up summary recalc** (parent, then grandparent — each re-enters the full save)                    | `field-meta.xml` `type=Summary`      |
|    **19** | **Criteria-based sharing evaluation**                                                                   | `sharingRules-meta.xml`              |
|    **20** | **COMMIT** — everything above is one synchronous transaction                                            | —                                    |
|    **21** | Post-commit: email, Queueable / Future / Batch, outbound messages, publish-after-commit platform events | `.cls` call sites                    |

### Step 13 semantics (important)

A workflow field update re-runs **before and after triggers exactly once**. It does
**not** re-run custom validation rules, duplicate rules, or escalation rules. On that
re-run, `Trigger.old` holds the values from **before the initial update**, not the
intermediate state. Both facts must be encoded in the output.

### Corrections against the original spec

1. **Criteria-based sharing (19)** was missing entirely — real cost, goes async at volume.
2. **Escalation (15)** and **entitlement (16)** were missing.
3. **Workflow re-entry** belongs in the sequence as step 13, not only under "recursion."
4. Sync group is **1–19**, commit is **20**, async is **21** — not the 1–18 / 19 split.

---

## 4. Data model changes

### `salesforce-graph.ts` — type additions

```ts
export type DmlEvent = "insert" | "update" | "delete" | "undelete"

export type NodeType =
	| "OBJECT"
	| "FIELD"
	| "APEX_CLASS"
	| "APEX_TRIGGER"
	| "FLOW"
	| "LWC"
	| "PERMISSION_SET"
	| "AGENTFORCE_TOPIC"
	// transaction layer
	| "VALIDATION_RULE"
	| "WORKFLOW_RULE"
	| "WORKFLOW_FIELD_UPDATE"
	| "DUPLICATE_RULE"
	| "ASSIGNMENT_RULE"
	| "AUTO_RESPONSE_RULE"
	| "ESCALATION_RULE"
	| "ENTITLEMENT_PROCESS"
	| "SHARING_RULE"
	| "ROLLUP_SUMMARY"
	| "ASYNC_JOB"
	| "PLATFORM_EVENT"

export interface TransactionAttrs {
	objectApiName: string
	dmlEvents: DmlEvent[]
	executionSteps: number[] // array — a trigger can be both before AND after
	isAsync?: boolean
	active?: boolean
	triggerOrder?: number
	requiresChangeToMeetCriteria?: boolean
	recursionGuard?: boolean
	mutatesFields?: string[]
	readsFields?: string[]
	soqlCount?: number
	dmlCount?: number
	hasLoopedQuery?: boolean
}

export interface GraphNode {
	id: string
	type: NodeType
	name: string
	filePath: string
	metadata?: Record<string, any>
	txn?: TransactionAttrs // present only on save-pipeline participants
}
```

One optional field on `GraphNode`, properly typed. `node.txn !== undefined` is a clean
test for "participates in the save pipeline."

Extend `GraphEdge.relationship` with:

```ts
| "RUNS_ON_OBJECT" | "MUTATES_FIELD" | "READS_FIELD"
| "ENQUEUES_ASYNC" | "PUBLISHES_EVENT" | "REENTERS"
```

`CALLS_APEX` is already in the union but has never been emitted — Phase 2 fixes that.

---

## PHASE 1 — Deterministic skeleton

Everything here is derivable straight from metadata XML and the trigger header. No
inference, no heuristics. **Shippable on its own.**

### Step 1.1 — Single source of truth for indexed file types

**File:** `salesforce-standalone-indexer.ts`

`findSalesforceFiles` (lines ~96–103) and the `RelativePattern` glob in
`setupFileWatcher` (line ~120) are two hardcoded lists that will drift. Hoist one
exported constant and use it in both places.

```ts
export const SF_INDEXED_SUFFIXES = [
	".cls",
	".trigger",
	".cmp",
	".page",
	".object-meta.xml",
	".field-meta.xml",
	".flow-meta.xml",
	".validationrule-meta.xml",
	".workflow-meta.xml",
	".duplicaterule-meta.xml",
	".assignmentrules-meta.xml",
	".autoresponserules-meta.xml",
	".escalationrules-meta.xml",
	".sharingrules-meta.xml",
	".entitlementprocess-meta.xml",
] as const
```

Scanner: `SF_INDEXED_SUFFIXES.some((s) => lowerName.endsWith(s))`
Watcher glob: build `**/*{cls,trigger,...}` from the same array.

**Caution:** workflow, sharing, assignment, auto-response and escalation files are
**per-object bundles** — one file yields N nodes. `removeFile` matches on `filePath`,
so it should handle this correctly; add a test rather than assuming.

---

### Step 1.2 — Parse the trigger header

**File:** `salesforce-graph.ts` → `indexApexCode`

Highest value-per-line change in the whole feature. `.trigger` files are currently
parsed as generic Apex and the header is discarded.

```ts
if (isTrigger) {
	const hdr = content.match(/^\s*trigger\s+(\w+)\s+on\s+(\w+)\s*\(([^)]*)\)/im)
	if (hdr) {
		const objectApiName = hdr[2]
		const steps = new Set<number>()
		const events = new Set<DmlEvent>()

		for (const ctx of hdr[3].split(",")) {
			const [timing, evt] = ctx.trim().toLowerCase().split(/\s+/)
			if (timing === "before") steps.add(5)
			if (timing === "after") steps.add(9)
			if (evt) events.add(evt as DmlEvent)
		}

		node.txn = {
			objectApiName,
			dmlEvents: [...events],
			executionSteps: [...steps],
			active: true,
		}
		this.addEdge({
			sourceId: className,
			targetId: objectApiName,
			relationship: "RUNS_ON_OBJECT",
		})
	}
}
```

Handles `trigger X on Account (before insert, before update, after insert)` — three
contexts, two steps, two events.

---

### Step 1.3 — Read flow trigger timing

**File:** `salesforce-graph.ts` → `indexFlowXml`

Currently reads only `processType`, `status`, and `start.object`. Add the timing fields.

```ts
const start = root.start || {}
const processType = String(root.processType || "")

// Screen flows are not in the DML pipeline
if (processType === "Flow") return

const triggerType = String(start.triggerType || "")
const step =
	triggerType === "RecordBeforeSave"
		? 4
		: triggerType === "RecordAfterSave"
			? 14
			: processType === "Workflow"
				? 12 // Process Builder
				: undefined

const rtt = String(start.recordTriggerType || "")
const dmlEvents: DmlEvent[] =
	rtt === "Create"
		? ["insert"]
		: rtt === "Update"
			? ["update"]
			: rtt === "CreateAndUpdate"
				? ["insert", "update"]
				: rtt === "Delete"
					? ["delete"]
					: []

if (step !== undefined && start.object) {
	node.txn = {
		objectApiName: String(start.object),
		dmlEvents,
		executionSteps: [step],
		active: String(root.status || "") === "Active",
		triggerOrder: Number(start.triggerOrder ?? root.triggerOrder) || undefined,
		requiresChangeToMeetCriteria: String(start.doesRequireRecordChangedToMeetCriteria ?? "") === "true",
	}
}
```

**`triggerType` values:** `RecordBeforeSave`, `RecordAfterSave`, `RecordBeforeDelete`,
`Scheduled`, `PlatformEvent`.
**`processType` values:** `AutoLaunchedFlow`, `Flow` (screen — skip),
`Workflow` (Process Builder), `InvocableProcess`.

---

### Step 1.4 — New automation parsers

**File:** `salesforce-automation.ts` _(new)_

Each parser follows the existing `indexObjectXml` pattern: parse XML → `addNode` with
`txn` populated → `addEdge` `RUNS_ON_OBJECT`. Export a single dispatcher the graph
engine calls.

```ts
export function indexAutomationFile(
	graph: SalesforceGraphEngine,
	filePath: string,
	content: string,
	xmlParser: XMLParser,
): boolean // returns true if handled
```

Wire it into `indexFileForGraph` as a final `else if` branch.

| Parser                    | File suffix                    |         Root element |    Step | Key fields                                                                                 |
| ------------------------- | ------------------------------ | -------------------: | ------: | ------------------------------------------------------------------------------------------ |
| `parseValidationRule`     | `.validationRule-meta.xml`     |     `ValidationRule` |       6 | `active`, `errorConditionFormula` → `readsFields`, `errorDisplayField`                     |
| `parseWorkflow`           | `.workflow-meta.xml`           |           `Workflow` | 12 / 13 | `rules[]` → step 12; `fieldUpdates[]` → separate nodes, step 13, `field` → `mutatesFields` |
| `parseDuplicateRule`      | `.duplicateRule-meta.xml`      |      `DuplicateRule` |       7 | `isActive`                                                                                 |
| `parseAssignmentRules`    | `.assignmentRules-meta.xml`    |    `AssignmentRules` |      10 | `assignmentRule[].active`                                                                  |
| `parseAutoResponseRules`  | `.autoResponseRules-meta.xml`  |  `AutoResponseRules` |      11 |                                                                                            |
| `parseEscalationRules`    | `.escalationRules-meta.xml`    |    `EscalationRules` |      15 |                                                                                            |
| `parseSharingRules`       | `.sharingRules-meta.xml`       |       `SharingRules` |      19 | `sharingCriteriaRules[]`, `sharingOwnerRules[]`                                            |
| `parseEntitlementProcess` | `.entitlementProcess-meta.xml` | `EntitlementProcess` |      16 |                                                                                            |

**Deriving the object name:**

- Bundle types (`Account.workflow-meta.xml`) → from the filename before the first `.`
- Validation rules (`objects/Invoice__c/validationRules/X.validationRule-meta.xml`) →
  from the path, reusing the `parts.lastIndexOf("objects")` trick already in `indexFieldXml`

**fast-xml-parser gotcha:** a single `<rules>` child parses as an object, multiple parse
as an array. Normalize everything through a helper before iterating:

```ts
const toArray = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v])
```

You will hit this immediately on `rules`, `fieldUpdates`, and
`sharingCriteriaRules`. Get it in first.

**Validity check:** assignment rules only exist for Lead and Case. If one is found on
any other object, record the node but flag it — that is a real config error worth
surfacing.

---

### Step 1.5 — Roll-up summary fields

**File:** `salesforce-graph.ts` → `indexFieldXml`

```ts
if (String(root.type) === "Summary") {
	// ROLLUP_SUMMARY node at step 17, edged to the child object it summarizes
	// root.summarizedField   → "Invoice_Line__c.Amount__c"
	// root.summaryForeignKey → "Invoice_Line__c.Invoice__c"
	// root.summaryOperation  → sum | count | min | max
}
```

Roll-ups matter because the parent record re-enters the entire save procedure — that is
why steps 17–18 exist as separate entries.

---

### Step 1.6 — The transaction module

**File:** `salesforce-transaction.ts` _(new)_

Holds `OOE_STEPS` and the analysis functions. **No state.**

```ts
export const OOE_STEPS = [
	{ step: 3, label: "System validation", phase: "sync" },
	{ step: 4, label: "Before-save flows", phase: "sync" },
	{ step: 5, label: "Before triggers", phase: "sync" },
	{ step: 6, label: "Custom validation rules", phase: "sync" },
	{ step: 7, label: "Duplicate rules", phase: "sync" },
	{ step: 8, label: "Save (uncommitted)", phase: "sync" },
	{ step: 9, label: "After triggers", phase: "sync" },
	{ step: 10, label: "Assignment rules", phase: "sync" },
	{ step: 11, label: "Auto-response rules", phase: "sync" },
	{ step: 12, label: "Workflow rules / Processes", phase: "sync" },
	{ step: 13, label: "Workflow field-update re-entry", phase: "sync" },
	{ step: 14, label: "After-save flows", phase: "sync" },
	{ step: 15, label: "Escalation rules", phase: "sync" },
	{ step: 16, label: "Entitlement rules", phase: "sync" },
	{ step: 17, label: "Roll-up summary recalc", phase: "sync" },
	{ step: 19, label: "Criteria-based sharing", phase: "sync" },
	{ step: 20, label: "COMMIT", phase: "commit" },
	{ step: 21, label: "Post-commit async", phase: "post-commit" },
] as const

export function getTransactionTimeline(
	graph: SalesforceGraphEngine,
	objectApiName: string,
	event: DmlEvent,
): TimelineResult
```

**Algorithm:**

1. Filter nodes where `node.txn?.objectApiName` matches (case-insensitive) and
   `txn.dmlEvents` includes the event (or is empty — meaning "all events").
2. Expand multi-step nodes into one row per step.
3. Sort by step.
4. Group into `sync` / `commit` / `post-commit`.

**Two rules the renderer must follow:**

- Flows within a step sort by `triggerOrder`, then by name.
- **Multiple Apex triggers in the same step render as an explicitly unordered set.**
  Salesforce does not define their execution order. Implying one is worse than
  admitting it is unknown.

Inactive automation is rendered **flagged, not omitted** — "there is a Draft flow here"
is information the agent needs.

---

### Step 1.7 — Tool wiring

**`src/shared/tools.ts`** — add to `toolParamNames`:

```ts
"objectApiName", "dmlEvent", "fieldName",
```

Unregistered params are silently swallowed by the assistant-message parser and arrive
`undefined`. This already bit `symbolId` and `category`.

**`src/core/tools/searchSalesforceGraphTool.ts`** — add `mode: "transaction"` alongside
the existing `blast_radius` / `upstream` / `downstream`. Read `objectApiName` and
`dmlEvent`; default `dmlEvent` to `"update"`.

Cap the output. A busy object's timeline is long — design the compact rendering now
rather than retrofitting a cap the way `searchSchema` needed.

Footer every transaction result:

```
Source: local SFDX metadata only. Managed-package automation, org-only automation,
and inactive-version drift are not represented.
```

**`src/core/prompts/tools/search-salesforce-graph.ts`** — document the new mode and
params. Keep advertised modes exactly in sync with implemented ones; this file
previously promised `upstream`/`downstream` before they existed.

---

### Step 1.8 — Export artifact

**File:** `salesforce-standalone-indexer.ts` → `scheduleDebouncedExport`

Add a third write inside the existing `try`:

```ts
await exportTransactionIndex(this.graphEngine, this.workspaceRoot)
```

Writes `.siid-code/SALESFORCE_TRANSACTIONS.md` — one section per object that has any
automation, each showing the ordered timeline for insert / update / delete.

---

### Step 1.9 — Tests

**File:** `src/services/code-index/__tests__/salesforce-transaction.test.ts` _(new)_

1. **Golden timeline.** Fixture object with a before-save flow, a before trigger, a
   validation rule, a workflow field update, and an after-save flow. Assert the exact
   ordered output, including the step-13 re-entry row.
2. **Unordered peers.** Two Apex triggers in the same step render as an explicitly
   unordered set.
3. **Screen flows excluded.** A `processType: Flow` file produces no timeline row.
4. **Inactive flagged not dropped.** A `status: Draft` flow appears, marked inactive.
5. **Multi-node file deletion.** A workflow bundle producing 3 nodes is fully removed by
   `removeFile`.

Use `os.tmpdir()` for any disk writes, with `afterEach` cleanup — matching the existing
pattern in `salesforce-indexer.test.ts`.

### Phase 1 definition of done

- `search_salesforce_graph` with `mode=transaction` returns a correct, ordered timeline
  for any object in a real SFDX project
- `.siid-code/SALESFORCE_TRANSACTIONS.md` is written on the debounce
- `tsc --noEmit` clean, all tests green
- Apex triggers sharing a step are visibly unordered

---

## PHASE 2 — Call graph and field deltas

The real work. Flow and validation-rule deltas come nearly free from XML; **Apex is the
hard half** and needs an actual call graph.

### Step 2.1 — Emit `CALLS_APEX` edges

**File:** `salesforce-graph.ts` → `indexApexCode`

```ts
const callRe = /\b([A-Z]\w*)\s*(?:\.\s*\w+\s*\(|\()/g
let m: RegExpExecArray | null
while ((m = callRe.exec(cleanCode)) !== null) {
	const target = m[1]
	if (target === className) continue
	if (!knownApexClasses.has(target.toLowerCase())) continue // ← load-bearing
	this.addEdge({ sourceId: className, targetId: target, relationship: "CALLS_APEX" })
}
```

**The registry check is not optional.** Without it you re-create the garbage-node
problem the old `UPDATES_OBJECT` regex had, and the auto-implicit-node creation in
`addEdge` will promote every capitalized token into a real graph node.

Because a class may be indexed before its callees exist, run resolution as a **second
pass after the full scan completes**, not inline during parsing.

### Step 2.2 — Extract field mutations

**Flows** (cheap, structured):

- `<recordUpdates>` → `inputAssignments[].field`
- `<assignments>` → `assignmentItems[].assignToReference` matching `$Record.<Field>`

**Validation rules** (cheap): field tokens in `errorConditionFormula` → `readsFields`.

**Apex** (shallow first): assignments of the form `<var>.<Field> =` where `<var>` is
bound to `Trigger.new` / `Trigger.newMap` iteration. Document the depth limit rather
than overclaiming — anything reached through a chain of helper calls requires the
call graph from 2.1 plus real data-flow analysis.

### Step 2.3 — Aggregate up the call chain

Walk `CALLS_APEX` from each trigger node with a bounded depth and visited set — reuse
the BFS already in `getBlastRadius` — accumulating `mutatesFields`, `soqlCount`, and
`dmlCount` onto the trigger node.

### Step 2.4 — Conflict detection

```ts
export function detectFieldConflicts(graph, objectApiName, event): ConflictFinding[]
```

Two nodes, same object and event, overlapping `mutatesFields`, same or adjacent step.
The before-trigger vs. before-save-flow collision is the case worth catching.

### Step 2.5 — Field lifecycle

```ts
export function traceFieldLifecycle(graph, objectApiName, fieldName): LifecycleStep[]
```

Ordered writes and reads of one field across the pipeline, ending at the last
validation before commit.

Add tool modes `conflicts` and `field_lifecycle`.

---

## PHASE 3 — Recursion and governor surface

Highest false-positive risk, so it goes last, on a foundation already trusted.

### Step 3.1 — Recursion detection

```ts
export function detectRecursion(graph, objectApiName): RecursionFinding[]
```

Any `WORKFLOW_FIELD_UPDATE` or step-14 flow whose `mutatesFields` targets its own
object triggers step-13 re-entry modeling. Emit the re-entry row plus the `Trigger.old`
annotation.

Flag as **unbounded** only when _both_:

- `requiresChangeToMeetCriteria` is false (or absent), and
- no static recursion guard is found in the Apex handler
  (`static Boolean hasRun` / `alreadyRan` pattern)

Anything else is reported as re-entrant but bounded.

### Step 3.2 — Governor surface

Per Apex class:

- SOQL count via `[SELECT`
- DML count via statement keywords plus `Database.*` methods
- Brace-depth tracking to detect SOQL or DML inside `for` / `while` → `hasLoopedQuery`

Then aggregate across the sync group (steps 3–19) per object + event and report counts
plus loop violations.

**Do not report a CPU-time estimate.** CPU time is not statically computable and a
fabricated number is worse than none. Loop violations are the signal that actually
predicts limit failures.

### Step 3.3 — Async call sites

**File:** `salesforce-graph.ts` → `indexApexCode`

```ts
const asyncPatterns: [RegExp, NodeType][] = [
	[/System\.enqueueJob\s*\(/g, "ASYNC_JOB"],
	[/Database\.executeBatch\s*\(/g, "ASYNC_JOB"],
	[/System\.schedule\s*\(/g, "ASYNC_JOB"],
	[/@future\b/gi, "ASYNC_JOB"],
	[/EventBus\.publish\s*\(/g, "PLATFORM_EVENT"],
]
```

Each match → node at step 21, `isAsync: true`, edge `ENQUEUES_ASYNC` from the calling
class. This is what lets the engine recommend moving heavy synchronous work past the
commit boundary.

---

## 5. Hard limits

These are properties of the problem, not gaps to close later. Build the output so the
agent is **told** about them rather than silently misled.

| Limit                                       | Consequence                                                                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Apex trigger order is undefined**         | Multiple triggers on one object have no guaranteed order. Before-save flows have `triggerOrder`; triggers do not. Render peers as unordered. |
| **Managed-package automation is invisible** | A packaged trigger on Account never appears in local source, and the index cannot know it is missing.                                        |
| **CPU time is not computable**              | Report statement counts and loop violations, never a synthesized millisecond figure.                                                         |
| **Local source is not the org**             | A different flow version may be active; Setup-created automation may never have been retrieved.                                              |
| **Formula evaluation is textual**           | You can extract which fields a validation rule reads. You cannot evaluate whether it will fail.                                              |

Surface the first four in the tool output footer.

---

## 6. Suggested order of work

|   # | Task                                                   | Phase | Notes                             |
| --: | ------------------------------------------------------ | :---: | --------------------------------- |
|   1 | `SF_INDEXED_SUFFIXES` constant, both call sites        |   1   | 30 min                            |
|   2 | `toArray()` helper                                     |   1   | do before any new parser          |
|   3 | Trigger header parse                                   |   1   | highest value/line in the feature |
|   4 | Flow trigger type + timing                             |   1   |                                   |
|   5 | Type additions (`TransactionAttrs`, node types, edges) |   1   |                                   |
|   6 | Validation rule + workflow parsers                     |   1   | the two that matter most          |
|   7 | Remaining 6 parsers                                    |   1   | mechanical once 6 is done         |
|   8 | Roll-up summary detection                              |   1   |                                   |
|   9 | `OOE_STEPS` + `getTransactionTimeline`                 |   1   |                                   |
|  10 | Tool params, mode, prompt                              |   1   |                                   |
|  11 | Export artifact                                        |   1   |                                   |
|  12 | Tests                                                  |   1   | **Phase 1 ships here**            |
|  13 | `CALLS_APEX` second-pass resolution                    |   2   |                                   |
|  14 | Flow + VR field mutations                              |   2   | cheap                             |
|  15 | Apex field mutations (shallow)                         |   2   | document the limit                |
|  16 | Call-chain aggregation                                 |   2   |                                   |
|  17 | Conflict detection + field lifecycle                   |   2   | **Phase 2 ships here**            |
|  18 | Recursion detection                                    |   3   |                                   |
|  19 | Governor surface                                       |   3   |                                   |
|  20 | Async call sites                                       |   3   | **Phase 3 ships here**            |

**Start with 1, 2, 3, 4.** Roughly a day, and it produces a real, correct timeline
skeleton for any object. Everything after that fills rows into a structure that already
works.

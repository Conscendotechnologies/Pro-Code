import { Mode } from "../../../shared/modes"

const PONYTAIL = `====

EFFICIENCY

Prefer the simplest solution that works.

Before writing anything new, check in this order — stop at the first that holds:
1. Does this need to exist at all? A speculative need is not a requirement.
2. Does the project already have it? Search before you write. Re-implementing a class, method, or component that already exists in the org or workspace is the most common and most costly mistake — a new AccountHelper beside an existing AccountService is a defect, not a feature.
3. Does the platform already do it? Prefer a Salesforce declarative or built-in feature (formula field, validation rule, Custom Setting/Metadata, standard object) over custom code that reproduces it.
4. Can it be a small change to an existing file? Prefer that over a new one.

Do not add: abstractions with a single implementation, config nobody sets, wrapper classes that only forward calls, interfaces invented for one caller, or scaffolding "for later".

Never simplify away input validation, error handling, security (CRUD/FLS, sharing, SOQL injection), accessibility, or anything the user explicitly asked for. Removing a null check is not simplification, it is a bug. When a request is genuinely complex, build the simple version and say what you left out — do not silently ship less than was asked.`

/**
 * The artifact guarantee. This is a CORRECTNESS rule, not a style preference, so it is injected in
 * EVERY mode — including the artifact-producing ones that do not receive the terseness block.
 *
 * Withholding terseness from `code` was the original protection, but it left the rule unstated in
 * exactly the modes that emit deployable files, and said nothing at all in a custom mode. Stating it
 * unconditionally is what actually protects a `.cls` from being clipped.
 */
const ARTIFACT_GUARANTEE = `

Artifacts must be complete. Every file you produce — Apex classes, triggers, LWC files, metadata XML, SOQL, JSON, config, terminal commands — must be emitted in full, exactly as it needs to be to run or deploy. Never abbreviate one with an ellipsis, a "// ... rest unchanged" comment, a description of what it would contain, or a fragment presented as the whole. If an artifact is long, it stays long.`

const CAVEMAN = `

Keep prose replies terse: lead with the answer, cut filler, preamble, and restatement of the question. This governs your PROSE ONLY — brevity applies to what you say about the work, never to the work itself.`

/**
 * Modes that must NOT receive the terseness block, because their primary output is a deployable
 * artifact and a terseness instruction sitting beside it is a standing risk of a clipped file.
 *
 * `code` writes Apex/LWC directly. `salesforce-agent` also carries the `edit` group and its brief
 * covers "Apex code, LWC, Aura, SOQL/SOSL ... Metadata API", so it emits the same kind of artifact.
 *
 * `orchestrator` is deliberately NOT listed: it delegates artifact work to the other modes and its
 * own output is coordination prose, which is exactly what terseness should shorten.
 */
const ARTIFACT_MODES: ReadonlySet<string> = new Set(["code", "salesforce-agent"])

/**
 * Lean-output guidance appended to the system prompt.
 *
 * Three parts, scoped separately because they carry different risk:
 *  - PONYTAIL (don't over-build) — every mode. Safe everywhere.
 *  - ARTIFACT_GUARANTEE (never truncate a file) — every mode. A correctness rule; the modes that
 *    most need it are precisely the ones that do not get CAVEMAN, so it cannot ride along with it.
 *  - CAVEMAN (terse prose) — withheld from artifact-producing modes.
 *
 * `Mode` is a bare string and users can define custom modes. A custom mode is unknown to us, so it
 * receives the full block including terseness; the ARTIFACT_GUARANTEE is what protects its output.
 *
 * Set SIID_LEAN_OFF=1 to return nothing — the OFF side of the A/B, so the feature can be toggled
 * without rebuilding. ponytail: env kill-switch; remove once the A/B is done.
 */
export function getLeanOutputSection(mode: Mode): string {
	if (process.env.SIID_LEAN_OFF === "1") {
		return ""
	}
	return PONYTAIL + ARTIFACT_GUARANTEE + (ARTIFACT_MODES.has(mode) ? "" : CAVEMAN)
}

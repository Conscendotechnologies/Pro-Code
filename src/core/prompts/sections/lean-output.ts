import { Mode } from "../../../shared/modes"

const PONYTAIL = `====

EFFICIENCY

Prefer the simplest solution that works. Before writing code: does it need to exist (YAGNI)? Does a helper, stdlib function, or native platform feature already cover it? Reuse before adding. No speculative abstractions, no config nobody sets, no boilerplate "for later". Fewest files, shortest working change. Never simplify away input validation, error handling, security, or anything explicitly requested.`

const CAVEMAN = `

Keep prose replies terse: lead with the answer, drop filler and preamble. This applies to your explanations ONLY — never abbreviate or truncate generated code, files, or deployable artifacts, which must always be complete and verbatim.`

/**
 * Lean-output guidance appended to the system prompt.
 *
 * PONYTAIL (don't over-build) is safe in every mode. CAVEMAN (terse prose) is withheld from `code`
 * mode, which emits full Apex/LWC artifacts that must never be abbreviated — terseness there risks
 * truncating a deployable .cls. Mode scope is the control.
 *
 * Set SIID_LEAN_OFF=1 to return nothing — the OFF side of the A/B, so the feature can be toggled
 * without rebuilding. ponytail: env kill-switch; remove once the A/B is done.
 */
export function getLeanOutputSection(mode: Mode): string {
	if (process.env.SIID_LEAN_OFF === "1") {
		return ""
	}
	return PONYTAIL + (mode === "code" ? "" : CAVEMAN)
}

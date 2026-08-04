import { ToolArgs } from "./types"
import { FORGE_FEATURES } from "../../tools/forgeFeatureRegistry"

/**
 * Description for the single `siid_forge` tool. Generated from the feature registry so the docs and
 * the dispatcher can never drift. The model picks a `feature` and passes a JSON `args` object.
 */
export function getSiidForgeDescription(_args: ToolArgs): string | undefined {
	const featureLines = FORGE_FEATURES.map((f) => {
		const argList =
			f.args.length === 0
				? "(no args)"
				: f.args.map((a) => `${a.name}${a.required ? "" : "?"}: ${a.type} — ${a.description}`).join("; ")
		const gate = f.mutating ? " [MUTATING — asks the user for approval]" : ""
		const returns = f.returns ? `\n    returns: ${f.returns}` : ""
		return `- ${f.name}${gate}: ${f.summary}\n    args: ${argList}${returns}`
	}).join("\n")

	return `## siid_forge
Description: Use SIID Forge's headless Salesforce features through ONE tool. Pick a capability with the \`feature\` parameter and pass its inputs as a JSON object in \`args\`.

ALWAYS prefer the most specific feature for your task (e.g. \`query\` for SOQL, \`deploy\` for deploying Apex, \`runApexTests\` for tests, \`describeObject\` for schema, \`evaluateFormula\` for formulas). The \`sfRun\` feature is a last-resort escape hatch for \`sf\` commands that no dedicated feature covers — do NOT use it when a specific feature exists (e.g. never use sfRun to deploy; use \`deploy\`).

Parameters:
- feature: (required) The capability to run. One of the features listed below.
- args: (optional) A JSON object with the feature's arguments.

Available features:
${featureLines}

Usage:
<siid_forge>
<feature>feature name here</feature>
<args>{"key": "value"}</args>
</siid_forge>

Example: run a SOQL query
<siid_forge>
<feature>query</feature>
<args>{"soql": "SELECT Id, Name FROM Account LIMIT 10"}</args>
</siid_forge>

Example: describe an object's schema
<siid_forge>
<feature>describeObject</feature>
<args>{"name": "Account"}</args>
</siid_forge>

Example: run a class's Apex tests
<siid_forge>
<feature>runApexTests</feature>
<args>{"className": "AccountServiceTest"}</args>
</siid_forge>

Example: deploy named Apex classes (preferred over sfRun)
<siid_forge>
<feature>deploy</feature>
<args>{"metadata": ["ApexClass:LeadService", "ApexClass:LeadServiceTest"]}</args>
</siid_forge>`
}

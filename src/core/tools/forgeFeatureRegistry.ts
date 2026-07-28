import type { SiidForgeApi } from "@conscendotech/siid-forge-api"

/**
 * Feature registry for the single `siid_forge` tool.
 *
 * ONE tool exposes many SIID Forge capabilities; the model picks a capability via the `feature`
 * parameter and passes `args`. This registry is the single source of truth — both the tool handler
 * (dispatch + validation + approval gating) and the model-facing prompt description are generated
 * from it, so they can never drift.
 *
 * Every feature dispatches to forge's ALREADY-HEADLESS public API (`SiidForgeApi`); this file adds
 * no Salesforce logic of its own. Mutating features are flagged so the tool asks the user for
 * approval before running them.
 */

/** One declared argument for a feature (drives validation + the prompt docs). */
export interface ForgeArgSpec {
	name: string
	type: "string" | "number" | "boolean" | "string[]" | "object" | "object[]"
	required: boolean
	description: string
}

export interface ForgeFeature {
	/** The `feature` value the model passes, e.g. "query". */
	name: string
	/** One-line description for the model. */
	summary: string
	/** True if it writes to the org / mutates files / handles credentials → requires approval. */
	mutating: boolean
	/** Declared args (validated before dispatch; documented to the model). */
	args: ForgeArgSpec[]
	/**
	 * Dispatch to the forge API. `args` has already been shape-validated against `args` above.
	 * Return any JSON-serializable result; it becomes the tool result the model sees.
	 */
	run(forge: SiidForgeApi, args: Record<string, unknown>): Promise<unknown>
}

/** Minimum forge API version this tool relies on. */
export const REQUIRED_FORGE_VERSION = "2.11.0" // needs the `data` namespace (query/updateRecords)

const str = (a: Record<string, unknown>, k: string) => a[k] as string
const opt = <T>(a: Record<string, unknown>, k: string) => a[k] as T | undefined

/**
 * The curated feature set. All are exposed; `mutating: true` ones are approval-gated by the handler.
 * Read features first, then the powerful/mutating ones.
 */
export const FORGE_FEATURES: ForgeFeature[] = [
	// ─────────────── read / inspect (safe, run directly) ───────────────
	{
		name: "query",
		summary: "Run a SOQL query and return the records (like `sf data query`).",
		mutating: false,
		args: [
			{ name: "soql", type: "string", required: true, description: "The SOQL query string." },
			{ name: "projectRoot", type: "string", required: false, description: "Optional project root override." },
		],
		run: (forge, a) => forge.data.query(str(a, "soql"), { projectRoot: opt<string>(a, "projectRoot") }),
	},
	{
		name: "describeObject",
		summary: "Describe an SObject's schema (fields, picklists) from the org.",
		mutating: false,
		args: [
			{ name: "name", type: "string", required: true, description: "SObject API name, e.g. Account." },
			{ name: "projectRoot", type: "string", required: false, description: "Optional project root override." },
		],
		run: async (forge, a) => {
			await forge.schema.describeObject(str(a, "name"), opt<string>(a, "projectRoot"))
			return forge.schema.readObject(str(a, "name"), opt<string>(a, "projectRoot")) ?? { described: true }
		},
	},
	{
		name: "listObjects",
		summary: "List the SObject API names available in the project.",
		mutating: false,
		args: [
			{ name: "projectRoot", type: "string", required: false, description: "Optional project root override." },
		],
		run: async (forge, a) => forge.schema.listObjects(opt<string>(a, "projectRoot")),
	},
	{
		name: "readApex",
		summary: "Read a parsed Apex class's schema (methods, properties) from the project.",
		mutating: false,
		args: [
			{ name: "name", type: "string", required: true, description: "Apex class name." },
			{ name: "projectRoot", type: "string", required: false, description: "Optional project root override." },
		],
		run: async (forge, a) => forge.schema.readApex(str(a, "name"), opt<string>(a, "projectRoot")) ?? null,
	},
	{
		name: "listOrgs",
		summary: "List authorized Salesforce orgs.",
		mutating: false,
		args: [{ name: "force", type: "boolean", required: false, description: "Bypass the ~30s cache." }],
		run: async (forge, a) => forge.orgs.list(opt<boolean>(a, "force")),
	},
	{
		name: "getDefaultOrg",
		summary: "Get the default org username/alias for the project.",
		mutating: false,
		args: [],
		run: async (forge) => (await forge.orgs.getDefault()) ?? null,
	},
	{
		name: "getCoverage",
		summary: "Get stored Apex code-coverage for a class.",
		mutating: false,
		args: [
			{ name: "className", type: "string", required: true, description: "Apex class name." },
			{ name: "projectRoot", type: "string", required: false, description: "Optional project root override." },
		],
		run: async (forge, a) => forge.coverage.get(str(a, "className"), opt<string>(a, "projectRoot")) ?? null,
	},
	{
		name: "analyzeLog",
		summary: "Analyze an Apex debug log string (governor limits, timings, SOQL/DML, errors).",
		mutating: false,
		args: [{ name: "rawLog", type: "string", required: true, description: "The raw Apex debug log text." }],
		run: async (forge, a) => forge.logs.analyze(str(a, "rawLog")),
	},
	{
		name: "runApexTests",
		summary: "Run a class's Apex tests against the org and return structured results.",
		mutating: false,
		args: [
			{ name: "className", type: "string", required: true, description: "Apex test class name to run." },
			{ name: "projectRoot", type: "string", required: false, description: "Optional project root override." },
		],
		run: async (forge, a) =>
			forge.apexTests.run(str(a, "className"), { projectRoot: opt<string>(a, "projectRoot") }),
	},
	{
		name: "sfCliAvailable",
		summary: "Check whether the Salesforce CLI (sf) is installed/resolvable.",
		mutating: false,
		args: [],
		run: async (forge) => ({ available: await forge.cli.isAvailable(), version: await forge.cli.getVersion() }),
	},

	// ─────────────── powerful / mutating (approval-gated) ───────────────
	{
		name: "sfRun",
		summary: "Run an arbitrary `sf` CLI command (JSON output). Powerful — can deploy/modify. Requires approval.",
		mutating: true,
		args: [
			{ name: "args", type: "string[]", required: true, description: 'sf CLI args, e.g. ["org","list"].' },
			{ name: "projectRoot", type: "string", required: false, description: "Working directory override." },
		],
		run: async (forge, a) => forge.sf.run(a["args"] as string[], { cwd: opt<string>(a, "projectRoot") }),
	},
	{
		name: "updateRecords",
		summary: "Write edited records back to the org (one update per row). Requires approval.",
		mutating: true,
		args: [
			{ name: "sobject", type: "string", required: true, description: "SObject API name." },
			{
				name: "edits",
				type: "object[]",
				required: true,
				description: "Array of record edits (per the RecordEdit shape).",
			},
			{ name: "projectRoot", type: "string", required: false, description: "Optional project root override." },
		],
		run: async (forge, a) =>
			forge.data.updateRecords(str(a, "sobject"), a["edits"] as never, {
				projectRoot: opt<string>(a, "projectRoot"),
			}),
	},
	{
		name: "generateApexTest",
		summary: "AI-driven Apex test generation for a class: writes, deploys, runs, self-corrects. Requires approval.",
		mutating: true,
		args: [
			{
				name: "clsPath",
				type: "string",
				required: true,
				description: "Absolute path of the class-under-test .cls.",
			},
			{ name: "coverageTarget", type: "number", required: false, description: "Coverage % target (default 75)." },
		],
		run: async (forge, a) =>
			forge.apexTests.generate({
				clsPath: str(a, "clsPath"),
				coverageTarget: opt<number>(a, "coverageTarget"),
			} as never),
	},
	{
		name: "retrieveTypes",
		summary: "Retrieve whole metadata types from the org into the local project. Requires approval.",
		mutating: true,
		args: [
			{
				name: "types",
				type: "string[]",
				required: true,
				description: 'Metadata type names, e.g. ["CustomObject"].',
			},
			{ name: "projectRoot", type: "string", required: false, description: "Optional project root override." },
		],
		run: async (forge, a) => forge.diff.retrieveTypes(a["types"] as never, opt<string>(a, "projectRoot") as never),
	},
	{
		name: "authorizeOrg",
		summary: "Authorize an org from a session id / access token. Handles credentials — requires approval.",
		mutating: true,
		args: [
			{ name: "accessToken", type: "string", required: true, description: "Access token (<orgId>!<token>)." },
			{ name: "instanceUrl", type: "string", required: true, description: "Org instance URL." },
			{ name: "alias", type: "string", required: false, description: "Optional alias." },
			{ name: "setDefault", type: "boolean", required: false, description: "Set as default org." },
		],
		run: async (forge, a) => {
			await forge.orgs.authorizeWithToken(
				str(a, "accessToken"),
				str(a, "instanceUrl"),
				opt<string>(a, "alias"),
				opt<boolean>(a, "setDefault"),
			)
			return { authorized: true }
		},
	},
]

/** Look up a feature by name. */
export function getForgeFeature(name: string): ForgeFeature | undefined {
	return FORGE_FEATURES.find((f) => f.name === name)
}

/**
 * Validate `args` against a feature's declared arg specs. Returns an error string, or undefined if OK.
 * Only shape/presence is checked (required present, primitive type matches) — deep validation is the
 * forge API's job.
 */
export function validateForgeArgs(feature: ForgeFeature, args: Record<string, unknown>): string | undefined {
	for (const spec of feature.args) {
		const v = args[spec.name]
		if (v === undefined || v === null) {
			if (spec.required) {
				return `Missing required arg "${spec.name}" for feature "${feature.name}".`
			}
			continue
		}
		const ok =
			spec.type === "string"
				? typeof v === "string"
				: spec.type === "number"
					? typeof v === "number"
					: spec.type === "boolean"
						? typeof v === "boolean"
						: spec.type === "string[]"
							? Array.isArray(v) && v.every((x) => typeof x === "string")
							: spec.type === "object[]"
								? Array.isArray(v)
								: spec.type === "object"
									? typeof v === "object"
									: false
		if (!ok) {
			return `Arg "${spec.name}" for feature "${feature.name}" must be ${spec.type}.`
		}
	}
	return undefined
}

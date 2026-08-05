/*---------------------------------------------------------------------------------------------
 *  Warn (never fail) when a newer tag of a pinned @conscendotech/*-api types package exists.
 *
 *  These packages are consumed as `github:<owner>/<repo>#v<ver>` git deps — pinned to an EXACT
 *  tag, so npm/pnpm never tells you a newer version shipped. This postinstall check queries the
 *  GitHub tags API for each pin and prints a yellow nudge if the pin is behind. Bumping is a
 *  deliberate opt-in (see the api package's MAINTAINING.md), so this only warns.
 *
 *  FAIL-OPEN by contract: no network, rate-limit, parse error, missing tag → exit 0, silent.
 *  A dev-tooling nudge must never block an install. In CI we skip unless a token is present
 *  (unauthenticated GitHub API is 60 req/hr/IP and would rate-limit noisily).
 *--------------------------------------------------------------------------------------------*/
"use strict"
const fs = require("fs")
const path = require("path")

const YELLOW = "\x1b[33m"
const RESET = "\x1b[0m"

/** Pinned api packages to check. Pins live in src/package.json dependencies. */
const PKGS = ["@conscendotech/siid-forge-api", "@conscendotech/siid-compression-api"]

/** Parse a `github:owner/repo#vX.Y.Z` spec → { owner, repo, version }, or null. */
function parseSpec(spec) {
	const m = /^github:([^/]+)\/([^#]+)#v?(.+)$/.exec(spec || "")
	return m ? { owner: m[1], repo: m[2], version: m[3] } : null
}

/** Compare dotted numeric versions; >0 if a>b, <0 if a<b, 0 if equal. Non-numeric parts → 0. */
function cmpVersion(a, b) {
	const pa = a.split(".").map((n) => parseInt(n, 10) || 0)
	const pb = b.split(".").map((n) => parseInt(n, 10) || 0)
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		const d = (pa[i] || 0) - (pb[i] || 0)
		if (d !== 0) return d > 0 ? 1 : -1
	}
	return 0
}

/** Highest `vX.Y.Z` tag for a repo via the GitHub API, or null on any failure. */
async function latestTag(owner, repo) {
	try {
		const headers = { "user-agent": "siid-code-postinstall", accept: "application/vnd.github+json" }
		const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
		if (token) headers.authorization = `Bearer ${token}`
		const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/tags?per_page=100`, { headers })
		if (!res.ok) return null
		const tags = await res.json()
		if (!Array.isArray(tags)) return null
		let best = null
		for (const t of tags) {
			const v = /^v?(\d+\.\d+\.\d+)$/.exec(t && t.name)
			if (v && (!best || cmpVersion(v[1], best) > 0)) best = v[1]
		}
		return best
	} catch {
		return null // fail-open: offline, DNS, etc.
	}
}

async function main() {
	// In CI, only run when a token is available (avoid unauthenticated rate-limit noise).
	if (process.env.CI && !(process.env.GITHUB_TOKEN || process.env.GH_TOKEN)) return

	let deps
	try {
		deps =
			JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "package.json"), "utf-8")).dependencies || {}
	} catch {
		return // can't read pins → nothing to check
	}

	for (const pkg of PKGS) {
		const spec = parseSpec(deps[pkg])
		if (!spec) continue
		const latest = await latestTag(spec.owner, spec.repo)
		if (latest && cmpVersion(latest, spec.version) > 0) {
			console.warn(
				`${YELLOW}⚠  ${pkg} v${latest} is available (you pin v${spec.version}).\n` +
					`   Bump the pin in src/package.json to "github:${spec.owner}/${spec.repo}#v${latest}" ` +
					`if you need the new surface.${RESET}`,
			)
		}
	}
}

// Never let this reject and surface as an install failure.
main().catch(() => {})

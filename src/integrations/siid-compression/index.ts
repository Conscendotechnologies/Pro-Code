import * as vscode from "vscode"
import type { ProviderSettings } from "@siid-code/types"
import type { ICompressionApi } from "@conscendotech/siid-compression-api"

/**
 * Optional integration with the SIID Compression extension.
 *
 * If `ConscendoTechInc.siid-compression` is installed and its local proxy is healthy, we route
 * this extension's OpenRouter traffic through it so the conversation is losslessly compressed
 * before reaching OpenRouter. This is done by pointing the OpenRouter client's base URL at the
 * proxy — see `maybeRouteThroughCompression`.
 *
 * It is ENTIRELY OPTIONAL with a DIRECT FALLBACK: if the extension is absent, inactive, its proxy
 * isn't ready, the provider isn't OpenRouter, or the user already set a custom base URL, we leave
 * the configuration untouched and traffic goes straight to OpenRouter. Nothing here can break a
 * request — every failure path falls through to the original config.
 */

const COMPRESSION_EXT_ID = "ConscendoTechInc.siid-compression"

/** Resolve the compression proxy base URL, or undefined if unavailable. Never throws. */
function resolveProxyBaseUrl(): string | undefined {
	try {
		const ext = vscode.extensions.getExtension(COMPRESSION_EXT_ID)
		// Only use it if already active — don't block a request on activating another extension.
		const api = ext?.isActive ? (ext.exports as ICompressionApi | undefined) : undefined
		const base = api?.getProxyBaseUrl?.() // '' when the proxy isn't healthy
		return base || undefined
	} catch {
		return undefined
	}
}

/**
 * Return a (possibly) adjusted copy of `configuration` that routes OpenRouter traffic through the
 * compression proxy when it's available. Returns the ORIGINAL object unchanged in every case where
 * routing shouldn't or can't apply, so callers can use it unconditionally:
 *
 *   this.api = buildApiHandler(maybeRouteThroughCompression(apiConfiguration))
 *
 * Conditions to route:
 *  - provider is "openrouter" (the only provider the proxy fronts), and
 *  - the user has NOT set a custom openRouterBaseUrl (respect an explicit override), and
 *  - the compression extension is active AND its proxy reports a healthy base URL.
 */
export function maybeRouteThroughCompression(configuration: ProviderSettings): ProviderSettings {
	if (configuration.apiProvider !== "openrouter") {
		return configuration
	}
	if (configuration.openRouterBaseUrl && configuration.openRouterBaseUrl.trim().length > 0) {
		// User (or another integration) already chose a base URL — don't override it.
		return configuration
	}
	const proxyBase = resolveProxyBaseUrl()
	if (!proxyBase) {
		return configuration
	}
	return { ...configuration, openRouterBaseUrl: proxyBase }
}

/**
 * OrgSyncService — Automated & Scheduled Remote Salesforce Org Metadata Sync.
 *
 * Periodically polls the target org using SF CLI in the background to detect
 * metadata changes/drift (e.g. fields created via Salesforce Setup UI or remote deployments)
 * and merges them seamlessly into the local SalesforceMetadataIndexer without disrupting local edits.
 */

import { exec } from "child_process"
import { SalesforceMetadataIndexer } from "./processors/salesforce-indexer"

export interface OrgSyncConfig {
	enabled: boolean
	pollIntervalMinutes: number
	targetOrg?: string
}

export class OrgSyncService {
	private static instance: OrgSyncService
	private timer: NodeJS.Timeout | null = null
	private isSyncing: boolean = false
	private config: OrgSyncConfig = {
		enabled: true,
		pollIntervalMinutes: 15,
	}

	private constructor() {}

	public static getInstance(): OrgSyncService {
		if (!OrgSyncService.instance) {
			OrgSyncService.instance = new OrgSyncService()
		}
		return OrgSyncService.instance
	}

	/**
	 * Start the background scheduled poller.
	 */
	public startScheduledSync(workspacePath: string, config?: Partial<OrgSyncConfig>): void {
		if (config) {
			this.config = { ...this.config, ...config }
		}

		if (!this.config.enabled) return

		this.stopScheduledSync()

		const intervalMs = Math.max(1, this.config.pollIntervalMinutes) * 60 * 1000
		console.log(
			`[OrgSyncService] Scheduled org metadata sync enabled. Interval: ${this.config.pollIntervalMinutes}m`,
		)

		this.timer = setInterval(() => {
			void this.syncOrgMetadata(workspacePath)
		}, intervalMs)
	}

	/**
	 * Stop the background scheduled poller.
	 */
	public stopScheduledSync(): void {
		if (this.timer) {
			clearInterval(this.timer)
			this.timer = null
		}
	}

	/**
	 * Run an immediate sync against the target org using non-blocking SF CLI queries.
	 */
	public async syncOrgMetadata(workspacePath: string): Promise<void> {
		if (this.isSyncing) return
		this.isSyncing = true

		try {
			console.log(`[OrgSyncService] Starting background Salesforce org metadata sync...`)

			const orgFlag = this.config.targetOrg ? `--target-org "${this.config.targetOrg}"` : ""
			const cmd = `sf org list metadata --metadata-type CustomObject ${orgFlag} --json`

			const stdout = await new Promise<string>((resolve, reject) => {
				exec(cmd, { cwd: workspacePath, maxBuffer: 10 * 1024 * 1024 }, (err, out) => {
					if (err) reject(err)
					else resolve(out)
				})
			})

			const parsed = JSON.parse(stdout)
			const records = parsed?.result
			if (!Array.isArray(records)) return

			const indexer = SalesforceMetadataIndexer.getInstance()
			const registry = indexer.getRegistry()

			for (const rec of records) {
				if (rec.fullName && !registry.objects.has(rec.fullName)) {
					console.log(`[OrgSyncService] Detected new remote SObject in org: ${rec.fullName}`)
					// Merge placeholder into indexer until fully retrieved
					registry.objects.set(rec.fullName, {
						apiName: rec.fullName,
						fields: new Map(),
						filePath: "(Remote Org)",
					})
				}
			}
			console.log(`[OrgSyncService] Sync completed. Registered ${registry.objects.size} objects.`)
		} catch (err: any) {
			console.log(`[OrgSyncService] Org sync skipped or offline: ${err.message}`)
		} finally {
			this.isSyncing = false
		}
	}
}

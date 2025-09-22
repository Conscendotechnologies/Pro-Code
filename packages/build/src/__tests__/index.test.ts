// npx vitest run src/__tests__/index.test.ts

import { generatePackageJson } from "../index.js"

describe("generatePackageJson", () => {
	it("should be a test", () => {
		const generatedPackageJson = generatePackageJson({
			packageJson: {
				name: "siid-roo-cline",
				displayName: "%extension.displayName%",
				description: "%extension.description%",
				publisher: "ConscendoTechInc",
				version: "3.17.2",
				icon: "assets/icons/iconV1.png",
				contributes: {
					viewsContainers: {
						activitybar: [
							{
								id: "siid-roo-cline-ActivityBar",
								title: "%views.activitybar.title%",
								icon: "assets/icons/iconV1.svg",
							},
						],
					},
					views: {
						"siid-roo-cline-ActivityBar": [
							{
								type: "webview",
								id: "siid-roo-cline.SidebarProvider",
								name: "",
							},
						],
					},
					commands: [
						{
							command: "siid-roo-cline.plusButtonClicked",
							title: "%command.newTask.title%",
							icon: "$(add)",
						},
						{
							command: "siid-roo-cline.openInNewTab",
							title: "%command.openInNewTab.title%",
							category: "%configuration.title%",
						},
					],
					menus: {
						"editor/context": [
							{
								submenu: "siid-roo-cline.contextMenu",
								group: "navigation",
							},
						],
						"siid-roo-cline.contextMenu": [
							{
								command: "siid-roo-cline.addToContext",
								group: "1_actions@1",
							},
						],
						"editor/title": [
							{
								command: "siid-roo-cline.plusButtonClicked",
								group: "navigation@1",
								when: "activeWebviewPanelId == siid-roo-cline.TabPanelProvider",
							},
							{
								command: "siid-roo-cline.settingsButtonClicked",
								group: "navigation@6",
								when: "activeWebviewPanelId == siid-roo-cline.TabPanelProvider",
							},
							{
								command: "siid-roo-cline.accountButtonClicked",
								group: "navigation@6",
								when: "activeWebviewPanelId == siid-roo-cline.TabPanelProvider",
							},
						],
					},
					submenus: [
						{
							id: "siid-roo-cline.contextMenu",
							label: "%views.contextMenu.label%",
						},
						{
							id: "siid-roo-cline.terminalMenu",
							label: "%views.terminalMenu.label%",
						},
					],
					configuration: {
						title: "%configuration.title%",
						properties: {
							"siid-roo-cline.allowedCommands": {
								type: "array",
								items: {
									type: "string",
								},
								default: ["npm test", "npm install", "tsc", "git log", "git diff", "git show"],
								description: "%commands.allowedCommands.description%",
							},
							"siid-roo-cline.customStoragePath": {
								type: "string",
								default: "",
								description: "%settings.customStoragePath.description%",
							},
						},
					},
				},
				scripts: {
					lint: "eslint **/*.ts",
				},
			},
			overrideJson: {
				name: "roo-code-nightly",
				displayName: "Roo Code Nightly",
				publisher: "ConscendoTechInc",
				version: "0.0.1",
				icon: "assets/icons/icon-nightlyV1.png",
				scripts: {},
			},
			substitution: ["siid-roo-cline", "roo-code-nightly"],
		})

		expect(generatedPackageJson).toStrictEqual({
			name: "roo-code-nightly",
			displayName: "Roo Code Nightly",
			description: "%extension.description%",
			publisher: "ConscendoTechInc",
			version: "0.0.1",
			icon: "assets/icons/icon-nightlyV1.png",
			contributes: {
				viewsContainers: {
					activitybar: [
						{
							id: "roo-code-nightly-ActivityBar",
							title: "%views.activitybar.title%",
							icon: "assets/icons/iconV1.svg",
						},
					],
				},
				views: {
					"roo-code-nightly-ActivityBar": [
						{
							type: "webview",
							id: "roo-code-nightly.SidebarProvider",
							name: "",
						},
					],
				},
				commands: [
					{
						command: "roo-code-nightly.plusButtonClicked",
						title: "%command.newTask.title%",
						icon: "$(add)",
					},
					{
						command: "roo-code-nightly.openInNewTab",
						title: "%command.openInNewTab.title%",
						category: "%configuration.title%",
					},
				],
				menus: {
					"editor/context": [
						{
							submenu: "roo-code-nightly.contextMenu",
							group: "navigation",
						},
					],
					"roo-code-nightly.contextMenu": [
						{
							command: "roo-code-nightly.addToContext",
							group: "1_actions@1",
						},
					],
					"editor/title": [
						{
							command: "roo-code-nightly.plusButtonClicked",
							group: "navigation@1",
							when: "activeWebviewPanelId == roo-code-nightly.TabPanelProvider",
						},
						{
							command: "roo-code-nightly.settingsButtonClicked",
							group: "navigation@6",
							when: "activeWebviewPanelId == roo-code-nightly.TabPanelProvider",
						},
						{
							command: "roo-code-nightly.accountButtonClicked",
							group: "navigation@6",
							when: "activeWebviewPanelId == roo-code-nightly.TabPanelProvider",
						},
					],
				},
				submenus: [
					{
						id: "roo-code-nightly.contextMenu",
						label: "%views.contextMenu.label%",
					},
					{
						id: "roo-code-nightly.terminalMenu",
						label: "%views.terminalMenu.label%",
					},
				],
				configuration: {
					title: "%configuration.title%",
					properties: {
						"roo-code-nightly.allowedCommands": {
							type: "array",
							items: {
								type: "string",
							},
							default: ["npm test", "npm install", "tsc", "git log", "git diff", "git show"],
							description: "%commands.allowedCommands.description%",
						},
						"roo-code-nightly.customStoragePath": {
							type: "string",
							default: "",
							description: "%settings.customStoragePath.description%",
						},
					},
				},
			},
			scripts: {},
		})
	})
})

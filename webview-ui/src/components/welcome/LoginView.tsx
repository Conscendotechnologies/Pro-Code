import { useCallback } from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"

import { vscode } from "@src/utils/vscode"
// import { useAppTranslation } from "@src/i18n/TranslationContext"

import { Tab, TabContent } from "../common/Tab"
import RooHero from "./RooHero"

const LoginView = () => {
	console.log("🚀 LoginView component is rendering!")

	// const { t } = useAppTranslation() // Commented out as not used yet

	const handleLogin = useCallback(() => {
		// Execute firebase authentication command
		vscode.postMessage({
			type: "executeCommand",
			command: "firebase-authentication-v1.signIn",
		} as any)
	}, [])

	const handleSkipLogin = useCallback(() => {
		// Skip login and proceed to welcome/main app
		vscode.postMessage({ type: "skipLogin" } as any)
	}, [])

	return (
		<Tab>
			<TabContent className="flex flex-col gap-5 p-16">
				<RooHero />
				<h2 className="mt-0 mb-0">Welcome to SIID-Code | TEST-V2</h2>

				<div className="font-bold">
					<p>Please log in to continue using Roo with full features.</p>
					<p>You can also skip login to use basic features.</p>
				</div>

				<div className="flex flex-col gap-4 mt-8">
					<VSCodeButton onClick={handleLogin} appearance="primary">
						Login to Your Account
					</VSCodeButton>

					<VSCodeButton onClick={handleSkipLogin} appearance="secondary">
						Skip Login (Limited Features)
					</VSCodeButton>
				</div>

				<div className="text-sm text-vscode-descriptionForeground mt-4">
					<p>By logging in, you&apos;ll have access to:</p>
					<ul className="list-disc list-inside mt-2 space-y-1">
						<li>Cloud synchronization</li>
						<li>Advanced AI features</li>
						<li>Team collaboration</li>
						<li>Premium support</li>
					</ul>
				</div>
			</TabContent>
		</Tab>
	)
}

export default LoginView

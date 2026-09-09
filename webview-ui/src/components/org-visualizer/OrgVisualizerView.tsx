import React, { useState } from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"

interface OrgVisualizerViewProps {
	onDone: () => void
}

const OrgVisualizerView: React.FC<OrgVisualizerViewProps> = ({ onDone }) => {
	const [activeTab, setActiveTab] = useState<"index" | "transaction" | "graph">("index")

	// In a real implementation, we would load the MD files via VS Code messages and parse them.
	// For now, this is a beautiful state mockup using SIID design tokens.

	return (
		<div className="flex flex-col h-full bg-vscode-editor-background">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-vscode-panel-border shrink-0">
				<div className="flex items-center gap-2">
					<VSCodeButton appearance="icon" onClick={onDone}>
						<span className="codicon codicon-arrow-left"></span>
					</VSCodeButton>
					<h2 className="text-lg font-bold text-vscode-foreground m-0">Org Visualizer</h2>
				</div>
				<div className="text-xs opacity-60 flex gap-2 items-center">
					<span className="codicon codicon-pulse animate-glow-pulse"></span>
					Live Sync
				</div>
			</div>

			{/* Navigation */}
			<div className="flex gap-4 p-4 pb-0 shrink-0">
				<button
					onClick={() => setActiveTab("index")}
					className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "index" ? "border-[#3B62D1] text-[#3B62D1]" : "border-transparent text-vscode-descriptionForeground hover:text-vscode-foreground"}`}>
					Overview
				</button>
				<button
					onClick={() => setActiveTab("transaction")}
					className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "transaction" ? "border-[#3B62D1] text-[#3B62D1]" : "border-transparent text-vscode-descriptionForeground hover:text-vscode-foreground"}`}>
					Transactions
				</button>
				<button
					onClick={() => setActiveTab("graph")}
					className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "graph" ? "border-[#3B62D1] text-[#3B62D1]" : "border-transparent text-vscode-descriptionForeground hover:text-vscode-foreground"}`}>
					Dependency Graph
				</button>
			</div>

			{/* Content Area */}
			<div className="flex-1 overflow-auto p-4">
				{activeTab === "index" && (
					<div className="grid grid-cols-2 gap-4">
						<div className="siid-glass-card p-5 rounded-lg border border-vscode-panel-border flex flex-col gap-2">
							<h3 className="text-xs font-bold opacity-70 m-0 uppercase tracking-wide">Total Objects</h3>
							<p className="text-3xl font-light m-0">1,245</p>
						</div>
						<div className="siid-glass-card p-5 rounded-lg border border-vscode-panel-border flex flex-col gap-2">
							<h3 className="text-xs font-bold opacity-70 m-0 uppercase tracking-wide">
								Active Triggers
							</h3>
							<p className="text-3xl font-light m-0 text-green-500">84</p>
						</div>
						<div className="siid-glass-card p-5 rounded-lg border border-vscode-panel-border col-span-2 mt-4">
							<h3 className="text-sm font-bold m-0 mb-4 border-b border-vscode-panel-border pb-2">
								Recent Deployments
							</h3>
							<div className="animate-shimmer w-full h-8 bg-vscode-input-background rounded mb-2"></div>
							<div className="animate-shimmer w-full h-8 bg-vscode-input-background rounded mb-2"></div>
							<div className="animate-shimmer w-3/4 h-8 bg-vscode-input-background rounded"></div>
						</div>
					</div>
				)}

				{activeTab === "transaction" && (
					<div className="flex flex-col gap-3">
						<div className="siid-glass-card-strong p-4 rounded-md flex justify-between items-center border-l-4 border-l-green-500 siid-interactive cursor-pointer">
							<div>
								<h4 className="m-0 font-bold text-sm">Account Trigger</h4>
								<span className="text-xs opacity-70">before_insert</span>
							</div>
							<div className="text-xs bg-vscode-badge-background text-vscode-badge-foreground px-2 py-1 rounded-full">
								12ms
							</div>
						</div>
						<div className="siid-glass-card-strong p-4 rounded-md flex justify-between items-center border-l-4 border-l-[#3B62D1] siid-interactive cursor-pointer">
							<div>
								<h4 className="m-0 font-bold text-sm">Update Contact Flow</h4>
								<span className="text-xs opacity-70">record_triggered</span>
							</div>
							<div className="text-xs bg-vscode-badge-background text-vscode-badge-foreground px-2 py-1 rounded-full">
								45ms
							</div>
						</div>
						<div className="siid-glass-card-strong p-4 rounded-md flex justify-between items-center border-l-4 border-l-red-500 siid-interactive cursor-pointer">
							<div>
								<h4 className="m-0 font-bold text-sm">Sync To ERP</h4>
								<span className="text-xs opacity-70 text-red-500">Callout Exception</span>
							</div>
							<div className="text-xs bg-vscode-badge-background text-vscode-badge-foreground px-2 py-1 rounded-full">
								2000ms
							</div>
						</div>
					</div>
				)}

				{activeTab === "graph" && (
					<div className="w-full h-full min-h-[300px] siid-glass-card border border-vscode-panel-border rounded-lg flex items-center justify-center relative overflow-hidden">
						{/* Mock Graph using simple CSS */}
						<div className="absolute top-[20%] left-[20%] w-16 h-16 rounded-full bg-[#3B62D1] flex items-center justify-center text-xs shadow-[0_0_15px_rgba(59,98,209,0.5)] z-10 animate-float text-white font-bold">
							Account
						</div>
						<div
							className="absolute top-[50%] left-[50%] w-16 h-16 rounded-full bg-vscode-button-background flex items-center justify-center text-xs z-10 animate-float text-white"
							style={{ animationDelay: "0.5s" }}>
							Contact
						</div>
						<div
							className="absolute top-[30%] right-[20%] w-16 h-16 rounded-full bg-vscode-button-background flex items-center justify-center text-xs z-10 animate-float text-white"
							style={{ animationDelay: "1s" }}>
							Oppty
						</div>
						{/* Lines */}
						<svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
							<line
								x1="28%"
								y1="28%"
								x2="48%"
								y2="48%"
								stroke="currentColor"
								strokeWidth="2"
								strokeDasharray="5,5"
								className="animate-glow-pulse"
							/>
							<line
								x1="52%"
								y1="52%"
								x2="72%"
								y2="35%"
								stroke="currentColor"
								strokeWidth="2"
								strokeDasharray="5,5"
							/>
						</svg>

						<div className="absolute bottom-4 left-0 right-0 text-center text-xs opacity-50">
							Interactive Graph Mode
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default OrgVisualizerView

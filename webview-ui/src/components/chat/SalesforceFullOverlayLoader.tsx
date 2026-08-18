import React from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"

export interface SalesforceIndexingProgress {
	phase: "DISCOVERING" | "RETRIEVING_METADATA" | "BUILDING_TRANSACTIONS" | "BUILDING_GRAPH" | "COMPLETE" | "ERROR"
	currentStep: number
	totalSteps: number
	currentFile?: string
	docType?: "APEX" | "TRIGGER" | "OBJECT" | "FLOW" | "VALIDATION" | "LWC" | "AURA" | "FLEXIPAGE" | "LAYOUT" | "OTHER"
	itemsProcessed: number
	totalItems: number
	nodeCount?: number
	edgeCount?: number
	timelineCount?: number
	durationMs?: number
	error?: string
}

interface SalesforceFullOverlayLoaderProps {
	progress: SalesforceIndexingProgress | null
	onClose: () => void
}

export const SalesforceFullOverlayLoader: React.FC<SalesforceFullOverlayLoaderProps> = ({ progress, onClose }) => {
	if (!progress) return null

	const isComplete = progress.phase === "COMPLETE"
	const isError = progress.phase === "ERROR"

	const progressPercentage =
		progress.totalItems > 0
			? Math.min(100, Math.round((progress.itemsProcessed / progress.totalItems) * 100))
			: progress.phase === "BUILDING_TRANSACTIONS"
				? 85
				: progress.phase === "BUILDING_GRAPH"
					? 95
					: progress.phase === "COMPLETE"
						? 100
						: 5

	// Dynamic Icon selection based on docType or phase
	const renderCenterIcon = () => {
		if (isComplete) {
			return (
				<svg
					className="w-12 h-12 text-white animate-bounce"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2.5}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			)
		}
		if (isError) {
			return (
				<svg
					className="w-12 h-12 text-red-100"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2.5}>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
			)
		}

		switch (progress.docType) {
			case "APEX":
				return (
					<svg
						className="w-10 h-10 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
					</svg>
				)
			case "TRIGGER":
				return (
					<svg
						className="w-10 h-10 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				)
			case "OBJECT":
				return (
					<svg
						className="w-10 h-10 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8-4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
						/>
					</svg>
				)
			case "LWC":
			case "AURA":
				return (
					<svg
						className="w-10 h-10 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				)
			case "FLOW":
				return (
					<svg
						className="w-10 h-10 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
						/>
					</svg>
				)
			case "FLEXIPAGE":
			case "LAYOUT":
				return (
					<svg
						className="w-10 h-10 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
						/>
					</svg>
				)
			case "VALIDATION":
				return (
					<svg
						className="w-10 h-10 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
				)
			default:
				return (
					<svg
						className="w-10 h-10 text-white animate-spin"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl transition-all duration-300 font-sans text-slate-100 p-6 overflow-hidden">
			{/* Salesforce Lightning Soft Background Grid Glow */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(1,118,211,0.18)_0%,transparent_65%)] pointer-events-none" />

			{/* Main Content Modal Container */}
			<div className="relative z-10 flex flex-col items-center max-w-lg w-full text-center">
				{/* 7-Hexagon Salesforce Honeycomb Grid Visualizer */}
				<div className="relative w-72 h-64 mb-6 flex items-center justify-center">
					{/* Honeycomb Center Active Hexagon */}
					<div className="absolute z-20 w-28 h-32 flex items-center justify-center shadow-[0_0_35px_rgba(1,118,211,0.6)] transition-all duration-500 scale-105">
						<svg
							className="absolute inset-0 w-full h-full filter drop-shadow-md"
							viewBox="0 0 100 115"
							fill="none">
							<defs>
								<linearGradient id="sfHexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" stopColor="#0176D3" />
									<stop offset="100%" stopColor="#0B5CAB" />
								</linearGradient>
							</defs>
							<polygon
								points="50,2 98,28 98,87 50,113 2,87 2,28"
								fill="url(#sfHexGradient)"
								stroke="#38BDF8"
								strokeWidth="2.5"
							/>
						</svg>

						{/* Node Vertices Dots */}
						<div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-400 shadow-[0_0_8px_#38BDF8]" />
						<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-400 shadow-[0_0_8px_#38BDF8]" />
						<div className="absolute top-7 -left-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-400 shadow-[0_0_8px_#38BDF8]" />
						<div className="absolute top-7 -right-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-400 shadow-[0_0_8px_#38BDF8]" />
						<div className="absolute bottom-7 -left-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-400 shadow-[0_0_8px_#38BDF8]" />
						<div className="absolute bottom-7 -right-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-400 shadow-[0_0_8px_#38BDF8]" />

						{/* Dynamic Icon */}
						<div className="relative z-10 flex items-center justify-center">{renderCenterIcon()}</div>
					</div>

					{/* Surrounding Honeycomb Tile: Top Left (Apex) */}
					<div className="absolute -top-2 left-6 w-20 h-24 opacity-80 transition-all duration-300">
						<svg className="w-full h-full" viewBox="0 0 100 115" fill="none">
							<polygon
								points="50,2 98,28 98,87 50,113 2,87 2,28"
								fill="#1E293B"
								stroke="#334155"
								strokeWidth="2"
							/>
						</svg>
						<div className="absolute inset-0 flex items-center justify-center text-sky-400 opacity-60">
							<span className="text-xs font-mono font-bold">&lt;/&gt;</span>
						</div>
					</div>

					{/* Surrounding Honeycomb Tile: Top Right (Triggers) */}
					<div className="absolute -top-2 right-6 w-20 h-24 opacity-80 transition-all duration-300">
						<svg className="w-full h-full" viewBox="0 0 100 115" fill="none">
							<polygon
								points="50,2 98,28 98,87 50,113 2,87 2,28"
								fill="#1E293B"
								stroke="#334155"
								strokeWidth="2"
							/>
						</svg>
						<div className="absolute inset-0 flex items-center justify-center text-amber-400 opacity-60">
							<span className="text-sm">⚡</span>
						</div>
					</div>

					{/* Surrounding Honeycomb Tile: Left (SObjects) */}
					<div className="absolute top-20 -left-4 w-20 h-24 opacity-80 transition-all duration-300">
						<svg className="w-full h-full" viewBox="0 0 100 115" fill="none">
							<polygon
								points="50,2 98,28 98,87 50,113 2,87 2,28"
								fill="#1E293B"
								stroke="#334155"
								strokeWidth="2"
							/>
						</svg>
						<div className="absolute inset-0 flex items-center justify-center text-emerald-400 opacity-60">
							<span className="text-sm">📊</span>
						</div>
					</div>

					{/* Surrounding Honeycomb Tile: Right (LWC / UI) */}
					<div className="absolute top-20 -right-4 w-20 h-24 opacity-80 transition-all duration-300">
						<svg className="w-full h-full" viewBox="0 0 100 115" fill="none">
							<polygon
								points="50,2 98,28 98,87 50,113 2,87 2,28"
								fill="#1E293B"
								stroke="#334155"
								strokeWidth="2"
							/>
						</svg>
						<div className="absolute inset-0 flex items-center justify-center text-purple-400 opacity-60">
							<span className="text-sm">💻</span>
						</div>
					</div>

					{/* Surrounding Honeycomb Tile: Bottom Left (Flows) */}
					<div className="absolute -bottom-2 left-6 w-20 h-24 opacity-80 transition-all duration-300">
						<svg className="w-full h-full" viewBox="0 0 100 115" fill="none">
							<polygon
								points="50,2 98,28 98,87 50,113 2,87 2,28"
								fill="#1E293B"
								stroke="#334155"
								strokeWidth="2"
							/>
						</svg>
						<div className="absolute inset-0 flex items-center justify-center text-cyan-400 opacity-60">
							<span className="text-sm">🔀</span>
						</div>
					</div>

					{/* Surrounding Honeycomb Tile: Bottom Right (Validation) */}
					<div className="absolute -bottom-2 right-6 w-20 h-24 opacity-80 transition-all duration-300">
						<svg className="w-full h-full" viewBox="0 0 100 115" fill="none">
							<polygon
								points="50,2 98,28 98,87 50,113 2,87 2,28"
								fill="#1E293B"
								stroke="#334155"
								strokeWidth="2"
							/>
						</svg>
						<div className="absolute inset-0 flex items-center justify-center text-pink-400 opacity-60">
							<span className="text-sm">🛡️</span>
						</div>
					</div>
				</div>

				{/* Title & Phase Status */}
				<h2 className="text-xl font-medium tracking-wide text-slate-100 mb-1">
					{isComplete
						? "Salesforce Indexing Complete"
						: isError
							? "Indexing Error Occurred"
							: progress.phase === "DISCOVERING"
								? "Discovering Salesforce Metadata Files..."
								: progress.phase === "RETRIEVING_METADATA"
									? "Retrieving & Parsing Salesforce Metadata..."
									: progress.phase === "BUILDING_TRANSACTIONS"
										? "Mapping 21-Step Execution Order Timelines..."
										: progress.phase === "BUILDING_GRAPH"
											? "Building Dependency Call Graph..."
											: "Indexing Salesforce Org..."}
				</h2>

				{/* Live Streaming File Badge */}
				{progress.currentFile && !isComplete && (
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono text-sky-300 max-w-md truncate mb-4 shadow-sm">
						<span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
						<span className="truncate">{progress.currentFile}</span>
					</div>
				)}

				{/* Salesforce Blue Pill Progress Bar */}
				<div className="w-full bg-slate-900 border border-slate-800 rounded-full h-3 mb-2 overflow-hidden relative shadow-inner">
					<div
						className="bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 h-full rounded-full transition-all duration-300 relative"
						style={{ width: `${progressPercentage}%` }}>
						<div className="absolute inset-0 bg-white/20 animate-pulse" />
					</div>
				</div>

				{/* Progress Numbers & Percentage */}
				<div className="flex justify-between w-full text-xs text-slate-400 mb-6 font-mono">
					<span>
						{progress.itemsProcessed} / {progress.totalItems} metadata items
					</span>
					<span className="font-bold text-sky-400">{progressPercentage}%</span>
				</div>

				{/* Summary Metrics Grid (Visible on Complete or Active) */}
				{(isComplete || (progress.nodeCount && progress.nodeCount > 0)) && (
					<div className="grid grid-cols-4 gap-2 w-full mb-6 text-left">
						<div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
							<div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
								Nodes
							</div>
							<div className="text-sm font-bold text-sky-400">{progress.nodeCount || 0}</div>
						</div>
						<div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
							<div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
								Timelines
							</div>
							<div className="text-sm font-bold text-emerald-400">{progress.timelineCount || 0}</div>
						</div>
						<div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
							<div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
								Call Edges
							</div>
							<div className="text-sm font-bold text-purple-400">{progress.edgeCount || 0}</div>
						</div>
						<div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
							<div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
								Time
							</div>
							<div className="text-sm font-bold text-amber-400">
								{progress.durationMs ? `${(progress.durationMs / 1000).toFixed(1)}s` : "..."}
							</div>
						</div>
					</div>
				)}

				{/* Close / Run in Background Button */}
				<div className="flex gap-3">
					<VSCodeButton appearance={isComplete ? "primary" : "secondary"} onClick={onClose}>
						{isComplete ? "Done" : "Run in Background"}
					</VSCodeButton>
				</div>
			</div>
		</div>
	)
}

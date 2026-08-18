import React, { useEffect, useState } from "react"

export interface SalesforceIndexingProgress {
	phase: "DISCOVERING" | "RETRIEVING_METADATA" | "BUILDING_TRANSACTIONS" | "BUILDING_GRAPH" | "COMPLETE" | "ERROR"
	currentStep: number
	totalSteps: number
	currentFile?: string
	docType?: "APEX" | "TRIGGER" | "OBJECT" | "FLOW" | "VALIDATION" | "OTHER"
	itemsProcessed: number
	totalItems: number
	nodeCount?: number
	edgeCount?: number
	timelineCount?: number
	durationMs?: number
	error?: string
}

interface SalesforceIndexLoaderProps {
	progress: SalesforceIndexingProgress | null
	onClose?: () => void
}

export const SalesforceIndexLoader: React.FC<SalesforceIndexLoaderProps> = ({ progress, onClose }) => {
	const [rotation, setRotation] = useState(0)

	// Continuous spin animation frame for geometry polygons & construction gear
	useEffect(() => {
		let animId: number
		const animate = () => {
			setRotation((r) => (r + 2) % 360)
			animId = requestAnimationFrame(animate)
		}
		animId = requestAnimationFrame(animate)
		return () => cancelAnimationFrame(animId)
	}, [])

	if (!progress) return null

	const {
		phase,
		currentStep,
		totalSteps,
		currentFile,
		docType,
		itemsProcessed,
		totalItems,
		nodeCount,
		edgeCount,
		timelineCount,
		durationMs,
		error,
	} = progress

	const percent = totalItems > 0 ? Math.min(100, Math.round((itemsProcessed / totalItems) * 100)) : 0
	const isComplete = phase === "COMPLETE"
	const isError = phase === "ERROR"
	const isRetrieving = phase === "RETRIEVING_METADATA" || phase === "DISCOVERING"
	const isBuilding = phase === "BUILDING_TRANSACTIONS" || phase === "BUILDING_GRAPH"

	// Helper for polygon colors based on Salesforce metadata type
	const getDocTypeColor = (type?: string) => {
		switch (type) {
			case "APEX":
				return "#A855F7" // Purple / Apex
			case "TRIGGER":
				return "#EC4899" // Pink / Trigger
			case "OBJECT":
				return "#06B6D4" // Cyan / SObject
			case "FLOW":
				return "#10B981" // Emerald / Flow
			case "VALIDATION":
				return "#F59E0B" // Amber / Validation
			default:
				return "#8B5CF6"
		}
	}

	const currentColor = getDocTypeColor(docType)

	return (
		<div className="my-4 p-4 rounded-xl border border-purple-500/30 bg-slate-950/80 backdrop-blur-md shadow-2xl relative overflow-hidden transition-all duration-300">
			{/* Animated Background Laser Glow */}
			<div
				className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-25 pointer-events-none transition-colors duration-500"
				style={{ backgroundColor: currentColor }}
			/>

			{/* Header Stage Badge & Step Indicator */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<span className="relative flex h-3 w-3">
						{!isComplete && !isError && (
							<span
								className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
								style={{ backgroundColor: currentColor }}
							/>
						)}
						<span
							className="relative inline-flex rounded-full h-3 w-3"
							style={{ backgroundColor: isComplete ? "#10B981" : isError ? "#EF4444" : currentColor }}
						/>
					</span>
					<span className="font-semibold text-xs tracking-wide uppercase text-slate-200">
						{isComplete
							? "Salesforce Indexing Complete"
							: isError
								? "Indexing Failed"
								: `Stage ${currentStep}/${totalSteps}: ${
										phase === "DISCOVERING"
											? "Discovering Metadata Files"
											: phase === "RETRIEVING_METADATA"
												? "Retrieving Metadata & Parsing ASTs"
												: phase === "BUILDING_TRANSACTIONS"
													? "Mapping 21-Step Execution Timelines"
													: "Constructing Call Graph & Exporting Report"
									}`}
					</span>
				</div>
				{isComplete && (
					<button
						onClick={onClose}
						className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700">
						Done
					</button>
				)}
			</div>

			{/* VISUAL STAGE 1: METADATA RETRIEVAL POLYGON ANIMATION */}
			{isRetrieving && (
				<div className="flex flex-col items-center justify-center py-4 space-y-3">
					{/* Spinning Polygon Geometry Field */}
					<div className="relative w-28 h-28 flex items-center justify-center">
						{/* Outer Hexagon */}
						<svg
							className="absolute w-28 h-28 opacity-40 transition-transform duration-75"
							style={{ transform: `rotate(${rotation}deg)` }}
							viewBox="0 0 100 100">
							<polygon
								points="50,5 90,25 90,75 50,95 10,75 10,25"
								fill="none"
								stroke={currentColor}
								strokeWidth="2"
								strokeDasharray="4 4"
							/>
						</svg>

						{/* Counter-rotating Octagon */}
						<svg
							className="absolute w-20 h-20 opacity-70 transition-transform duration-75"
							style={{ transform: `rotate(${-rotation * 1.5}deg)` }}
							viewBox="0 0 100 100">
							<polygon
								points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30"
								fill="none"
								stroke="#A855F7"
								strokeWidth="2"
							/>
						</svg>

						{/* Center Pulsing Diamond */}
						<div
							className="w-10 h-10 transform rotate-45 rounded-sm flex items-center justify-center shadow-lg transition-colors duration-300"
							style={{
								backgroundColor: `${currentColor}33`,
								border: `2px solid ${currentColor}`,
								boxShadow: `0 0 16px ${currentColor}aa`,
							}}>
							<span className="transform -rotate-45 text-xs font-mono font-bold text-white">SF</span>
						</div>
					</div>

					{/* Live File Stream Badge */}
					<div className="text-center px-2">
						{currentFile ? (
							<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-cyan-300 max-w-full truncate shadow-inner">
								<span
									className="w-2 h-2 rounded-full animate-pulse"
									style={{ backgroundColor: currentColor }}
								/>
								<span className="truncate">Retrieving: {currentFile}</span>
							</div>
						) : (
							<span className="text-xs text-slate-400 animate-pulse">Scanning org structure...</span>
						)}
					</div>
				</div>
			)}

			{/* VISUAL STAGE 2: MAIN CONSTRUCTION GEAR ENGINE */}
			{isBuilding && (
				<div className="flex flex-col items-center justify-center py-4 space-y-3">
					{/* Spinning Construction Engine */}
					<div className="relative w-28 h-28 flex items-center justify-center">
						{/* Rotating Gear Ring */}
						<svg
							className="absolute w-24 h-24 text-amber-400/80 transition-transform duration-75"
							style={{ transform: `rotate(${rotation * 1.2}deg)` }}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5">
							<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
							<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
						</svg>

						{/* Center Construction Icon */}
						<div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
							<span className="codicon codicon-tools text-amber-400 text-lg animate-bounce" />
						</div>
					</div>

					<span className="text-xs font-medium text-amber-300 tracking-wide animate-pulse">
						{phase === "BUILDING_TRANSACTIONS"
							? "Building 21-Step Execution Graph..."
							: "Linking Symbol Network & Exporting Reports..."}
					</span>
				</div>
			)}

			{/* VISUAL STAGE 3: COMPLETE STATS SUMMARY BADGE */}
			{isComplete && (
				<div className="py-2 space-y-3">
					<div className="flex items-center gap-3 bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/30">
						<div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
							<span className="codicon codicon-check text-emerald-400 text-lg font-bold" />
						</div>
						<div>
							<h5 className="text-xs font-bold text-emerald-300 m-0">Index Built Successfully</h5>
							<p className="text-[11px] text-slate-300 my-0">
								Parsed {totalItems} files in {((durationMs || 0) / 1000).toFixed(1)}s. Transaction
								timeline auto-exported to{" "}
								<code className="text-emerald-400 bg-slate-900 px-1 rounded">
									.siid-code/SALESFORCE_TRANSACTIONS.md
								</code>
								.
							</p>
						</div>
					</div>

					{/* Summary Grid Chips */}
					<div className="grid grid-cols-3 gap-2 pt-1">
						<div className="bg-slate-900/80 p-2 rounded border border-slate-800 text-center">
							<div className="text-[10px] uppercase tracking-wider text-slate-400">Nodes</div>
							<div className="text-xs font-bold text-purple-400">{nodeCount || 0}</div>
						</div>
						<div className="bg-slate-900/80 p-2 rounded border border-slate-800 text-center">
							<div className="text-[10px] uppercase tracking-wider text-slate-400">Timelines</div>
							<div className="text-xs font-bold text-pink-400">{timelineCount || 0}</div>
						</div>
						<div className="bg-slate-900/80 p-2 rounded border border-slate-800 text-center">
							<div className="text-[10px] uppercase tracking-wider text-slate-400">Call Edges</div>
							<div className="text-xs font-bold text-cyan-400">{edgeCount || 0}</div>
						</div>
					</div>
				</div>
			)}

			{/* ERROR STATE */}
			{isError && (
				<div className="p-3 bg-red-950/50 rounded-lg border border-red-500/40 text-red-300 text-xs my-2">
					<div className="font-bold mb-1">Indexing Failed</div>
					<div>{error || "An unexpected error occurred during indexing."}</div>
				</div>
			)}

			{/* PROGRESS BAR & COUNTER */}
			{!isComplete && !isError && (
				<div className="space-y-1.5 pt-2 border-t border-slate-800/80">
					<div className="flex justify-between items-center text-[11px] text-slate-400">
						<span>
							Progress: {itemsProcessed} / {totalItems} items
						</span>
						<span className="font-mono font-bold text-cyan-400">{percent}%</span>
					</div>
					<div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
						<div
							className="h-full rounded-full transition-all duration-300 shadow-sm"
							style={{
								width: `${percent}%`,
								backgroundColor: currentColor,
								boxShadow: `0 0 10px ${currentColor}`,
							}}
						/>
					</div>
				</div>
			)}
		</div>
	)
}

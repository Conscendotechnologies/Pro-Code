/**
 * Salesforce Agent instructions
 */
export const SALESFORCE_AGENT_INSTRUCTIONS: string

/**
 * Shared subtask completion protocol (used by salesforce-agent and code modes)
 */
export const SUBTASK_COMPLETION_PROTOCOL: string

/**
 * Orchestrator instructions
 */
export const ORCHESTRATOR_INSTRUCTIONS: string

/**
 * Helper function to get instructions by mode slug
 * @param slug The mode slug
 * @returns The instructions for the specified mode
 */
export function getInstructionsBySlug(slug: string): string

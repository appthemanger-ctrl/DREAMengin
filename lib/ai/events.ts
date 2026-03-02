// lib/ai/events.ts
// TRIAD AI PROTOCOL — Canonical inter-agent event schema.
// All communication between Dr. Eams, IDARi, and Boogie MUST use these typed events.
//
// Docs: docs/AI_TRIAD_PROTOCOL.md (source of truth)
// Public overview: docs/POLICY_TRIAD_OVERVIEW.md → exposed at /policy/ai
//
// Design constraints:
//   - Every event is idempotent (safe to reprocess without duplication).
//   - Every event carries policy_version when related to enforcement.
//   - correlation_id links all events in a single incident end-to-end.
//   - Clients cannot emit triad events directly (server-side ingestion only).
//   - Raw triad logs are never publicly exposed.

import { z } from 'zod';

// ============================================================================
// TRIAD PROTOCOL VERSION
// ============================================================================

export const TRIAD_PROTOCOL_VERSION = 'TRIAD_V1' as const;

// ============================================================================
// BLAST RADIUS CLASSIFICATION
// Classifies the potential impact scope of any triad action.
// ============================================================================

export const BlastRadiusSchema = z.enum(['LOCAL', 'USER', 'SYSTEM', 'GLOBAL']);
export type BlastRadius = z.infer<typeof BlastRadiusSchema>;

// ============================================================================
// EVENT SEVERITY
// ============================================================================

export const EventSeveritySchema = z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type EventSeverity = z.infer<typeof EventSeveritySchema>;

// Agent enum — mirrors AgentSchema in ./schemas but defined locally to avoid
// circular imports and Zod v4 schema construction order issues.
const TriadAgentSchema = z.enum(['dr_eams', 'idari', 'boogieman']);

// ============================================================================
// ALLOWED INTER-AGENT MESSAGE TYPES
// All agent-to-agent communication uses exactly these types (no freeform chat).
// ============================================================================

export const TriadEventTypeSchema = z.enum([
  // Requests from one agent to another
  'REQUEST_REVIEW',           // Any agent → Boogie: request policy review
  'REQUEST_EXPLANATION',      // IDARi/Boogie → Dr. Eams: request user message copy
  'REQUEST_OPTIMIZATION',     // Dr. Eams/Boogie → IDARi: request performance work

  // Incident and action events
  'INCIDENT_DETECTED',        // Boogie or IDARi: something bad was found
  'ACTION_TAKEN',             // Boogie: enforcement action applied
  'SUGGESTION_PROPOSED',      // Any agent: governance proposal submitted
  'SUGGESTION_APPROVED',      // Triad: unanimous approval recorded
  'SUGGESTION_REJECTED',      // Triad: proposal rejected (reason required)

  // Status and feedback
  'STATUS_SNAPSHOT',          // IDARi: system health summary for triad
  'APPEAL_RECEIVED',          // Dr. Eams → Boogie: user submitted an appeal
]);

export type TriadEventType = z.infer<typeof TriadEventTypeSchema>;

// ============================================================================
// CANONICAL TRIAD EVENT SCHEMA
// Every inter-agent event MUST conform to this shape.
// ============================================================================

export const TriadEventSchema = z.object({
  // Identity
  event_id: z.string().uuid(),              // Unique ID for this event
  correlation_id: z.string().uuid(),        // Links all events in one incident
  timestamp: z.string().datetime(),         // ISO 8601

  // Agents
  actor: TriadAgentSchema,                  // Who sent this event
  target: TriadAgentSchema,                 // Who should receive/act on it

  // Classification
  type: TriadEventTypeSchema,
  severity: EventSeveritySchema,
  blast_radius: BlastRadiusSchema.optional(), // Impact scope classification

  // Context — optional but always preferred
  user_id: z.string().uuid().optional(),    // User affected (if applicable)
  dream_id: z.string().uuid().optional(),   // Dream/widget affected (if applicable)
  context_refs: z.array(z.string()),        // IDs/hashes of related objects (never raw content)

  // Policy traceability — required for enforcement events
  policy_version: z.string().optional(),    // e.g. "BOOGIE_POLICY_V1"
  protocol_version: z.string().default(TRIAD_PROTOCOL_VERSION),

  // Idempotency — safe to reprocess
  idempotency_key: z.string(),              // Prevents duplicate processing

  // Payload — typed per event type, stored as structured data
  payload: z.record(z.unknown()),

  // Simulation flag — events in sim mode must never apply real restrictions
  simulation: z.boolean().default(false),
});

export type TriadEvent = z.infer<typeof TriadEventSchema>;

// ============================================================================
// TYPED PAYLOAD SHAPES (per event type)
// Enforces structured data for each message type.
// ============================================================================

/** REQUEST_REVIEW — sent to Boogie asking for a policy review */
export interface RequestReviewPayload {
  subject: string;        // What is being reviewed
  reason: string;         // Why a review is needed
  proposed_change?: string;
  is_false_positive_suspicion?: boolean;
}

/** REQUEST_EXPLANATION — sent to Dr. Eams asking for user-facing copy */
export interface RequestExplanationPayload {
  action_taken: string;   // What happened
  rule_code: string;      // Which rule triggered it
  expiry?: string | null; // When the restriction ends
  appeal_url?: string;
}

/** REQUEST_OPTIMIZATION — sent to IDARi */
export interface RequestOptimizationPayload {
  concern: string;        // What should be optimized
  metrics?: Record<string, number>;
}

/** INCIDENT_DETECTED — Boogie or IDARi found something bad */
export interface IncidentDetectedPayload {
  description: string;
  rule_code?: string;
  confidence: number;     // 0–1
  severity_score: number; // 0–1
  affected_users?: number;
  suggested_action?: string;
}

/** ACTION_TAKEN — Boogie applied an enforcement action */
export interface ActionTakenPayload {
  action: string;         // NUDGE, WARN, THROTTLE, etc.
  rule_code: string;
  scopes_affected: string[];
  expiry: string | null;
  is_simulation: boolean;
}

/** SUGGESTION_PROPOSED — any agent proposes a major update */
export interface SuggestionProposedPayload {
  title: string;
  scope: 'minor' | 'major';
  blast_radius: BlastRadius;
  rationale: string;
  risks: string;
  acceptance_criteria: string;
  test_plan: string;
  rollback_plan: string;
  requires_human_approval: boolean;
}

/** SUGGESTION_APPROVED / SUGGESTION_REJECTED */
export interface SuggestionDecisionPayload {
  proposal_id: string;
  decision: 'approved' | 'rejected';
  reason?: string;        // Required for rejected proposals (prevents endless resubmission)
  approving_agents?: string[];
}

/** STATUS_SNAPSHOT — IDARi system health summary */
export interface StatusSnapshotPayload {
  crash_rate: number;
  p95_latency_ms: number;
  memory_mb?: number;
  render_fps?: number;
  enforcement_rate?: number;
  degraded: boolean;
  notes?: string;
}

/** APPEAL_RECEIVED — Dr. Eams relays a user appeal to Boogie */
export interface AppealReceivedPayload {
  appeal_id: string;
  reason: string;         // User's stated reason
  new_evidence?: string;  // Minimal; never raw private content
  strike_id?: string;
  prior_event_id?: string;
}

// ============================================================================
// PLATFORM LIMITS (shared across all agents)
// All three agents respect these values. Boogie enforces user behavior limits.
// IDARi enforces system health limits. Dr. Eams explains them as product constraints.
// ============================================================================

export const PLATFORM_LIMITS = {
  MAX_DREAMS_PER_USER: 48,
  MAX_POSTS_PER_HOUR: 30,
  MAX_MESSAGES_PER_MINUTE: 10,
  MAX_SHARE_CODES_PER_DAY: 20,
  MAX_CONNECTOR_REQUESTS_PER_MIN: 30,
  DATA_REFRESH_BUDGET_SECONDS: 60,   // Minimum interval between heavy data refreshes
} as const;

// ============================================================================
// AGENT ROLE RESTRAINTS (enforced server-side, not by client flags)
// ============================================================================

/** Actions that Boogie (and only Boogie) can perform */
export const BOOGIE_EXCLUSIVE_ACTIONS = [
  'BAN_USER',
  'LOCK_ACCOUNT',
  'APPLY_ENFORCEMENT',
  'ESCALATE_TO_HUMAN',
] as const;

/** Actions that IDARi (and only IDARi) can perform */
export const IDARI_EXCLUSIVE_ACTIONS = [
  'THROTTLE_SYSTEM',
  'SHED_LOAD',
  'LOWER_REFRESH_RATE',
  'TRIGGER_CACHE_FIRST',
] as const;

/** Actions that Dr. Eams (and only Dr. Eams) can perform */
export const EAMS_EXCLUSIVE_ACTIONS = [
  'SEND_USER_MESSAGE',
  'UPDATE_MESSAGE_TEMPLATE',
  'EXPLAIN_RESTRICTION',
] as const;

export type BoogieExclusiveAction = typeof BOOGIE_EXCLUSIVE_ACTIONS[number];
export type IdariExclusiveAction = typeof IDARI_EXCLUSIVE_ACTIONS[number];
export type EamsExclusiveAction = typeof EAMS_EXCLUSIVE_ACTIONS[number];

// ============================================================================
// ROLE GUARD — server-side validation of action permissions
// Import and call in API route handlers to enforce triad restraints.
// ============================================================================

type AgentRole = 'dr_eams' | 'idari' | 'boogieman';

/**
 * Checks whether an agent is allowed to perform the specified action.
 * Enforced server-side; never trust client-side role flags.
 */
export function checkAgentPermission(
  agent: AgentRole,
  action: string,
): { allowed: boolean; reason?: string } {
  // Boogie-exclusive: only boogieman can ban/lock/enforce
  if ((BOOGIE_EXCLUSIVE_ACTIONS as readonly string[]).includes(action)) {
    if (agent !== 'boogieman') {
      return {
        allowed: false,
        reason: `Action "${action}" is exclusive to Boogie (policy/overwatch). Agent "${agent}" is not permitted.`,
      };
    }
  }

  // IDARi-exclusive: only idari can throttle system / shed load
  if ((IDARI_EXCLUSIVE_ACTIONS as readonly string[]).includes(action)) {
    if (agent !== 'idari') {
      return {
        allowed: false,
        reason: `Action "${action}" is exclusive to IDARi (optimizer). Agent "${agent}" is not permitted.`,
      };
    }
  }

  // Dr. Eams-exclusive: only dr_eams can send user messages / update templates
  if ((EAMS_EXCLUSIVE_ACTIONS as readonly string[]).includes(action)) {
    if (agent !== 'dr_eams') {
      return {
        allowed: false,
        reason: `Action "${action}" is exclusive to Dr. Eams (user-facing). Agent "${agent}" is not permitted.`,
      };
    }
  }

  return { allowed: true };
}

// ============================================================================
// HIGH-IMPACT ACTION GUARD
// Actions with GLOBAL blast radius require explicit human/admin confirmation.
// ============================================================================

/** Actions that always require explicit human confirmation */
export const GLOBAL_IMPACT_ACTIONS = [
  'PERMA_BAN',
  'GLOBAL_SETTING_CHANGE',
  'POLICY_TEXT_CHANGE',
  'AUTH_FLOW_CHANGE',
  'MONETIZATION_CHANGE',
  'CONNECTOR_PERMISSION_CHANGE',
  'PUBLIC_DATA_EXPOSURE_CHANGE',
] as const;

export function requiresHumanConfirmation(action: string): boolean {
  return (GLOBAL_IMPACT_ACTIONS as readonly string[]).includes(action);
}

// lib/ai/schemas.ts
// Zod 4 schemas for tri-agent AI system

import { z } from 'zod';

// ============================================================================
// AGENT & UI CONTEXT SCHEMAS
// ============================================================================

export const AgentSchema = z.enum(['dr_eams', 'idari', 'boogieman']);
export type Agent = z.infer<typeof AgentSchema>;

export const UIContextSchema = z.object({
  route: z.string(),
  nav: z.object({
    home_anchor_state: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
    surface: z.enum(['PERSONAL', 'HOME_DREAMS', 'WORK_DAY']).optional(),
    overlay: z.enum(['NONE', 'HOME_MENU', 'DREAM_MENU', 'PREVIEW', 'ACTION_SHEET']).optional(),
  }).optional(),
  focus: z.object({
    dream_id: z.string().uuid().optional(),
    post_id: z.string().uuid().optional(),
    profile_id: z.string().uuid().optional(),
  }).optional(),
  viewport: z.object({
    w: z.number(),
    h: z.number(),
    dpr: z.number(),
  }).optional(),
  device: z.object({
    ios: z.boolean(),
    safari: z.boolean(),
    reduced_motion: z.boolean(),
  }).optional(),
});
export type UIContext = z.infer<typeof UIContextSchema>;

// ============================================================================
// INTENT SCHEMAS
// ============================================================================

export const IntentTypeSchema = z.enum([
  'NAV_DELTA',
  'HOME_ANCHOR_SET_STATE',
  'HOME_MENU_OPEN',
  'DREAM_PREVIEW',
  'DREAM_OPEN',
  'DREAM_CONFIG_PATCH',
  'DREAM_REORDER',
  'POST_CREATE',
  'DIAG_SCHEMA_SNAPSHOT',
  'DIAG_RLS_SNAPSHOT',
  'SEARCH',
]);
export type IntentType = z.infer<typeof IntentTypeSchema>;

export const IntentSchema = z.object({
  intent_id: z.string().uuid(),
  type: IntentTypeSchema,
  confidence: z.number().min(0).max(1),
  requires_confirmation: z.boolean(),
  rationale: z.string(),
  idempotency_key: z.string(),
  payload: z.record(z.unknown()),
});
export type Intent = z.infer<typeof IntentSchema>;

export const IntentEnvelopeSchema = z.object({
  request_id: z.string().uuid(),
  agent: AgentSchema,
  actor_user_id: z.string().uuid(),
  timestamp: z.string(),
  ui: UIContextSchema,
  intents: z.array(IntentSchema).max(3),
  meta: z.record(z.unknown()).optional(),
});
export type IntentEnvelope = z.infer<typeof IntentEnvelopeSchema>;

// ============================================================================
// DR. EAMS RUN REQUEST/RESPONSE
// ============================================================================

export const DrEamsRunBodySchema = z.object({
  message: z.string().min(1).max(4000),
  ui: UIContextSchema,
  client_session_id: z.string().optional(),
});
export type DrEamsRunBody = z.infer<typeof DrEamsRunBodySchema>;

export const DrEamsRunResponseSchema = z.object({
  response_text: z.string(),
  proposed_intents: z.array(IntentSchema),
  boogie_decisions: z.array(z.object({
    intent_id: z.string().uuid(),
    decision: z.enum(['ALLOW', 'DENY', 'CONFIRM', 'MODIFY']),
    risk_score: z.number(),
    reason_code: z.string(),
  })),
  confirm_token: z.string().optional(),
});
export type DrEamsRunResponse = z.infer<typeof DrEamsRunResponseSchema>;

// ============================================================================
// EXECUTE REQUEST/RESPONSE
// ============================================================================

export const ExecuteBodySchema = z.object({
  request_id: z.string().uuid(),
  intent_ids: z.array(z.string().uuid()).min(1).max(3),
  confirm_token: z.string().optional(),
  ui: UIContextSchema,
});
export type ExecuteBody = z.infer<typeof ExecuteBodySchema>;

export const ExecuteResponseSchema = z.object({
  ok: z.boolean(),
  results: z.array(z.object({
    intent_id: z.string().uuid(),
    executed: z.boolean(),
    error: z.string().optional(),
  })),
  boogie: z.object({
    allowed: z.boolean(),
    reason: z.string().optional(),
  }),
});
export type ExecuteResponse = z.infer<typeof ExecuteResponseSchema>;

// ============================================================================
// BOOGIE MAN SCHEMAS
// ============================================================================

export const BoogieDecisionSchema = z.enum(['ALLOW', 'DENY', 'CONFIRM', 'MODIFY']);
export type BoogieDecision = z.infer<typeof BoogieDecisionSchema>;

export const BoogieResultSchema = z.object({
  intent_id: z.string().uuid(),
  decision: BoogieDecisionSchema,
  risk_score: z.number().min(0).max(1),
  reason_code: z.string(),
  policy_version: z.string(),
  modified_payload: z.record(z.unknown()).optional(),
});
export type BoogieResult = z.infer<typeof BoogieResultSchema>;

export const BoogieOutputSchema = z.object({
  global: z.object({
    hard_block: z.boolean(),
    cooldown_seconds: z.number().optional(),
  }),
  per_intent: z.array(BoogieResultSchema),
  policy_version: z.string(),
});
export type BoogieOutput = z.infer<typeof BoogieOutputSchema>;

// ============================================================================
// THEBOOGIEMAN.AI — ENFORCEMENT SCHEMAS (req 16–50, 96–100)
// Every enforcement event has two outputs: user-safe explanation + audit event.
// ============================================================================

// Action types ordered least → most force (req 36)
export const EnforcementActionSchema = z.enum([
  'NUDGE',
  'WARN',
  'THROTTLE',
  'FEATURE_LOCK',
  'QUARANTINE',
  'TEMP_SUSPEND',
  'TEMP_BAN',
  'ESCALATE',
]);
export type EnforcementAction = z.infer<typeof EnforcementActionSchema>;

// Per-surface enforcement scopes (req 46)
export const EnforcementScopeSchema = z.enum([
  'POSTING',
  'MESSAGING',
  'LINKING',
  'MARKETPLACE',
  'TEMPLATE_SHARE',
]);
export type EnforcementScope = z.infer<typeof EnforcementScopeSchema>;

// Strike severity levels (req 46)
export const StrikeSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type StrikeSeverity = z.infer<typeof StrikeSeveritySchema>;

// Strike ledger entry (req 27)
export const StrikeEntrySchema = z.object({
  strike_id: z.string().uuid(),
  rule_code: z.string(),
  category: z.string(),
  severity: StrikeSeveritySchema,
  confidence: z.number().min(0).max(1),
  action_taken: EnforcementActionSchema,
  timestamp: z.string().datetime(),
  expires_at: z.string().datetime().nullable(),
});
export type StrikeEntry = z.infer<typeof StrikeEntrySchema>;

// User-safe explanation payload (req 17)
export const UserSafeExplanationSchema = z.object({
  what_happened: z.string(),
  why: z.string(),
  what_changes: z.string(),
  what_to_do_next: z.string(),
  policy_version: z.string(),
  rule_code: z.string(),
  appeal_available: z.boolean(),
  expiry: z.string().datetime().nullable(),
  scopes_affected: z.array(EnforcementScopeSchema),
  policy_page_url: z.string(),
});
export type UserSafeExplanation = z.infer<typeof UserSafeExplanationSchema>;

// Internal audit event payload (req 18, 19, 20)
export const InternalAuditEventSchema = z.object({
  event_id: z.string().uuid(),
  user_id: z.string(),
  action: EnforcementActionSchema,
  severity: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  risk_score: z.number().min(0).max(1),
  rule_code: z.string(),
  policy_version: z.string(),
  scopes_restricted: z.array(EnforcementScopeSchema),
  timestamp: z.string().datetime(),
  expiry: z.string().datetime().nullable(),
  evidence_refs: z.array(z.string()),          // hashes/IDs only, never raw content (req 19)
  prior_event_id: z.string().uuid().nullable(), // append-only corrections (req 20)
  simulation: z.boolean(),                      // true when BOOGIE_SIMULATION_MODE=true (req 61)
});
export type InternalAuditEvent = z.infer<typeof InternalAuditEventSchema>;

// Dual-output enforcement result (req 16)
export const BoogieEnforceOutputSchema = z.object({
  user_explanation: UserSafeExplanationSchema,
  audit_event: InternalAuditEventSchema,
  action: EnforcementActionSchema,
  should_escalate: z.boolean(),
  simulation: z.boolean(),
});
export type BoogieEnforceOutput = z.infer<typeof BoogieEnforceOutputSchema>;

// Appeal request (req 44, 75)
export const AppealRequestSchema = z.object({
  user_id: z.string(),
  strike_id: z.string().uuid().optional(),
  event_id: z.string().uuid().optional(),
  reason: z.string().min(10).max(2000),
  new_evidence: z.string().max(500).optional(),
});
export type AppealRequest = z.infer<typeof AppealRequestSchema>;

// Appeal queue entry
export const AppealEntrySchema = z.object({
  appeal_id: z.string().uuid(),
  user_id: z.string(),
  strike_id: z.string().uuid().nullable(),
  event_id: z.string().uuid().nullable(),
  reason: z.string(),
  new_evidence: z.string().nullable(),
  status: z.enum(['received', 'reviewing', 'resolved']),
  submitted_at: z.string().datetime(),
  resolved_at: z.string().datetime().nullable(),
  policy_version: z.string(),
});
export type AppealEntry = z.infer<typeof AppealEntrySchema>;

// Policy health status (req 65)
export const PolicyHealthSchema = z.object({
  status: z.enum(['ok', 'degraded', 'offline']),
  policy_version: z.string(),
  simulation_mode: z.boolean(),
  timestamp: z.string().datetime(),
});
export type PolicyHealth = z.infer<typeof PolicyHealthSchema>;

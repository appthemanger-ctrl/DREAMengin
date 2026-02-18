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
  modified_payload: z.record(z.unknown()).optional(),
});
export type BoogieResult = z.infer<typeof BoogieResultSchema>;

export const BoogieOutputSchema = z.object({
  global: z.object({
    hard_block: z.boolean(),
    cooldown_seconds: z.number().optional(),
  }),
  per_intent: z.array(BoogieResultSchema),
});
export type BoogieOutput = z.infer<typeof BoogieOutputSchema>;

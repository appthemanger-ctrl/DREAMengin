// types/ai-system.ts
// DREAMENGIN AI SYSTEM v2026.0 - Core Type Definitions
// Strict TypeScript types for the three-agent AI system

import { z } from 'zod';

// ============================================================================
// ACTOR CONTEXT (SERVER-OWNED)
// ============================================================================

export const UserRole = z.enum(['user', 'admin', 'system']);
export type UserRole = z.infer<typeof UserRole>;

export const ActorContextSchema = z.object({
  user_id: z.string().uuid(),
  role: UserRole,
  caps: z.array(z.string()),
  space_memberships: z.array(z.string().uuid()),
  issued_at: z.string().datetime(),
});
export type ActorContext = z.infer<typeof ActorContextSchema>;

// ============================================================================
// UI CONTEXT (SAFE SUBSET)
// ============================================================================

export const HomeAnchorState = z.union([z.literal(0), z.literal(1), z.literal(2)]);
export type HomeAnchorState = z.infer<typeof HomeAnchorState>;

export const Surface = z.enum(['PERSONAL', 'HOME_DREAMS', 'WORK_DAY']);
export type Surface = z.infer<typeof Surface>;

export const CubePosition = z.object({
  face: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  slot: z.number().int().min(0).max(7),
});
export type CubePosition = z.infer<typeof CubePosition>;

export const Overlay = z.enum([
  'NONE',
  'HOME_MENU',
  'DREAM_MENU',
  'PREVIEW',
  'ACTION_SHEET',
]);
export type Overlay = z.infer<typeof Overlay>;

export const GestureDirection = z.enum(['L', 'R', 'U', 'D', 'IN', 'OUT']);
export type GestureDirection = z.infer<typeof GestureDirection>;

export const GestureChain = z.object({
  dir: GestureDirection.optional(),
  len: z.number(),
  t: z.string().datetime(),
});
export type GestureChain = z.infer<typeof GestureChain>;

export const NavStateSafe = z.object({
  home_anchor_state: HomeAnchorState,
  surface: Surface,
  cube: CubePosition,
  overlay: Overlay,
  gesture_chain: GestureChain,
});
export type NavStateSafe = z.infer<typeof NavStateSafe>;

export const UIContextSchema = z.object({
  route: z.string(),
  nav: NavStateSafe,
  focus: z
    .object({
      dream_id: z.string().uuid().optional(),
      post_id: z.string().uuid().optional(),
      profile_id: z.string().uuid().optional(),
    })
    .optional(),
  viewport: z
    .object({
      w: z.number(),
      h: z.number(),
      dpr: z.number(),
    })
    .optional(),
  device: z
    .object({
      ios: z.boolean(),
      safari: z.boolean(),
      reduced_motion: z.boolean(),
    })
    .optional(),
});
export type UIContext = z.infer<typeof UIContextSchema>;

// ============================================================================
// INTENT SYSTEM (THE ONLY EXECUTABLE LANGUAGE)
// ============================================================================

// Dr. Eams Intent Types (user-facing)
export const DrEamsIntentType = z.enum([
  'NAV_DELTA',
  'HOME_ANCHOR_SET_STATE',
  'HOME_MENU_OPEN',
  'DREAM_PREVIEW',
  'DREAM_OPEN',
  'DREAM_CONFIG_PATCH',
  'DREAM_REORDER',
  'DREAM_ADD_FROM_PRESET',
  'DREAM_REMOVE',
  'POST_CREATE',
  'POST_LIKE',
  'FOLLOW_USER',
  'SEARCH',
  'DRAFT_SAVE',
]);
export type DrEamsIntentType = z.infer<typeof DrEamsIntentType>;

// iDari Intent Types (admin-only)
export const IDariIntentType = z.enum([
  'DIAG_SCHEMA_SNAPSHOT',
  'DIAG_RLS_SNAPSHOT',
  'DIAG_CODE_REFERENCE_SCAN',
  'DIAG_ENV_CHECKLIST',
  'ADMIN_PATCH_PROPOSAL',
  'ADMIN_MIGRATION_PROPOSAL',
  'MODERATION_FLAG_CONTENT',
]);
export type IDariIntentType = z.infer<typeof IDariIntentType>;

export const IntentType = z.union([DrEamsIntentType, IDariIntentType]);
export type IntentType = z.infer<typeof IntentType>;

// Base Intent
export const IntentSchema = z.object({
  intent_id: z.string().uuid(),
  type: IntentType,
  payload: z.record(z.unknown()),
  confidence: z.number().min(0).max(1),
  requires_confirmation: z.boolean(),
  rationale: z.string().max(240),
  idempotency_key: z.string(),
});
export type Intent = z.infer<typeof IntentSchema>;

// Agent Types
export const AgentType = z.enum(['dr_eams', 'idari']);
export type AgentType = z.infer<typeof AgentType>;

// Intent Envelope (JSON-only model output)
export const IntentEnvelopeSchema = z.object({
  request_id: z.string().uuid(),
  agent: AgentType,
  actor_user_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  ui: UIContextSchema,
  intents: z.array(IntentSchema),
  meta: z.object({
    model: z.string(),
    prompt_hash: z.string(),
    token: z.object({
      in: z.number(),
      out: z.number(),
    }),
    latency_ms: z.number(),
  }),
});
export type IntentEnvelope = z.infer<typeof IntentEnvelopeSchema>;

// ============================================================================
// SPECIFIC INTENT PAYLOAD SCHEMAS
// ============================================================================

// Navigation intents
export const NavDeltaPayload = z.object({
  delta_route: z.string().optional(),
  delta_nav: z.record(z.unknown()).optional(),
});

export const HomeAnchorSetStatePayload = z.object({
  state: HomeAnchorState,
});

export const HomeMenuOpenPayload = z.object({});

// Dream intents
export const DreamPreviewPayload = z.object({
  dream_id: z.string().uuid(),
});

export const DreamOpenPayload = z.object({
  dream_id: z.string().uuid(),
});

export const DreamConfigPatchPayload = z.object({
  dream_id: z.string().uuid(),
  config_patch: z.record(z.unknown()),
});

export const DreamReorderPayload = z.object({
  dream_ids: z.array(z.string().uuid()),
});

export const DreamAddFromPresetPayload = z.object({
  preset_type: z.string(),
  position: z.number().optional(),
});

export const DreamRemovePayload = z.object({
  dream_id: z.string().uuid(),
});

// Post intents
export const PostCreatePayload = z.object({
  content: z.string(),
  media_json: z.record(z.unknown()).optional(),
  visibility: z.enum(['public', 'followers', 'private']).optional(),
});

export const PostLikePayload = z.object({
  post_id: z.string().uuid(),
});

// Social intents
export const FollowUserPayload = z.object({
  user_id: z.string().uuid(),
});

// Search intent
export const SearchPayload = z.object({
  query: z.string(),
  scope: z.enum(['posts', 'users', 'dreams', 'all']).optional(),
});

// Draft intent
export const DraftSavePayload = z.object({
  draft_id: z.string().uuid().optional(),
  content: z.string(),
  context: z.record(z.unknown()).optional(),
});

// Admin/diagnostic intents
export const DiagSchemaSnapshotPayload = z.object({
  include_policies: z.boolean().optional(),
});

export const DiagRLSSnapshotPayload = z.object({
  table_filter: z.array(z.string()).optional(),
});

export const DiagCodeReferenceScanPayload = z.object({
  scan_depth: z.enum(['surface', 'deep']).optional(),
});

export const DiagEnvChecklistPayload = z.object({});

export const AdminPatchProposalPayload = z.object({
  target_file: z.string(),
  description: z.string(),
  diff_unified: z.string(),
});

export const AdminMigrationProposalPayload = z.object({
  description: z.string(),
  sql_up: z.string(),
  sql_down: z.string().optional(),
});

export const ModerationFlagContentPayload = z.object({
  content_type: z.enum(['post', 'profile', 'comment']),
  content_id: z.string().uuid(),
  reason: z.string(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
});

// ============================================================================
// BOOGIE MAN (VERIFIER) TYPES
// ============================================================================

export const BoogieDecision = z.enum(['ALLOW', 'DENY', 'CONFIRM', 'MODIFY']);
export type BoogieDecision = z.infer<typeof BoogieDecision>;

export const ReasonCode = z.enum([
  'OK',
  'INTENT_NOT_ALLOWLISTED',
  'ADMIN_ONLY',
  'CROSS_USER_OPERATION',
  'DESTRUCTIVE_ACTION',
  'MASS_WRITE',
  'RATE_LIMIT',
  'JAILBREAK_DETECTED',
  'SECRET_DETECTED',
  'TOOL_OVERRIDE_ATTEMPT',
  'RISK_SCORE_HIGH',
  'RISK_SCORE_MODERATE',
]);
export type ReasonCode = z.infer<typeof ReasonCode>;

export const JSONPatch = z.object({
  op: z.enum(['add', 'remove', 'replace', 'move', 'copy', 'test']),
  path: z.string(),
  value: z.unknown().optional(),
});
export type JSONPatch = z.infer<typeof JSONPatch>;

export const BoogieIntentDecision = z.object({
  intent_id: z.string().uuid(),
  decision: BoogieDecision,
  risk_score: z.number(),
  reason_code: ReasonCode,
  redactions: z
    .array(
      z.object({
        json_path: z.string(),
        replacement: z.string(),
      })
    )
    .optional(),
  modifications: z
    .object({
      payload_patch: z.array(JSONPatch).optional(),
    })
    .optional(),
});
export type BoogieIntentDecision = z.infer<typeof BoogieIntentDecision>;

export const BoogieOutput = z.object({
  request_id: z.string().uuid(),
  per_intent: z.array(BoogieIntentDecision),
  global: z.object({
    hard_block: z.boolean(),
    cooldown_seconds: z.number().optional(),
  }),
});
export type BoogieOutput = z.infer<typeof BoogieOutput>;

export const BoogieSignals = z.object({
  rate: z.object({
    rpm: z.number(),
    burst: z.boolean(),
  }),
  injection: z.object({
    jailbreak: z.boolean(),
    tool_override: z.boolean(),
    schema_poison: z.boolean(),
  }),
  auth: z.object({
    tries_admin: z.boolean(),
    cross_user_target: z.boolean(),
    privilege_escalation: z.boolean(),
  }),
  ops: z.object({
    destructive: z.boolean(),
    mass_write: z.boolean(),
    external_side_effect: z.boolean(),
  }),
  data: z.object({
    secret_like: z.boolean(),
    pii_like: z.boolean(),
  }),
});
export type BoogieSignals = z.infer<typeof BoogieSignals>;

// ============================================================================
// TOOL HANDLER TYPES
// ============================================================================

export const UIToast = z.object({
  kind: z.enum(['success', 'error', 'info', 'warning']),
  message: z.string(),
});
export type UIToast = z.infer<typeof UIToast>;

export const UIDelta = z.object({
  nav_patch: z.array(JSONPatch).optional(),
  toast: UIToast.optional(),
  open_overlay: Overlay.optional(),
});
export type UIDelta = z.infer<typeof UIDelta>;

export const ToolResultError = z.object({
  code: z.string(),
  message: z.string(),
  detail: z.unknown().optional(),
});
export type ToolResultError = z.infer<typeof ToolResultError>;

export const ToolResult = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  ui_delta: UIDelta.optional(),
  error: ToolResultError.optional(),
});
export type ToolResult = z.infer<typeof ToolResult>;

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Dr. Eams Run Request
export const DrEamsRunRequest = z.object({
  message: z.string(),
  ui: UIContextSchema,
  client_session_id: z.string().optional(),
  device_hints: z.record(z.unknown()).optional(),
});
export type DrEamsRunRequest = z.infer<typeof DrEamsRunRequest>;

// Dr. Eams Run Response
export const DrEamsRunResponse = z.object({
  response_text: z.string(),
  proposed_intents: z.array(IntentSchema),
  boogie_decisions: z.array(BoogieIntentDecision),
  confirm_token: z.string().optional(),
});
export type DrEamsRunResponse = z.infer<typeof DrEamsRunResponse>;

// iDari Run Request
export const IDariRunRequest = z.object({
  message: z.string(),
  ui: UIContextSchema,
  scope: z.string().optional(),
  diag_targets: z.array(z.string()).optional(),
});
export type IDariRunRequest = z.infer<typeof IDariRunRequest>;

// iDari Run Response
export const IDariRunResponse = z.object({
  response_text: z.string(),
  proposed_intents: z.array(IntentSchema),
  boogie_decisions: z.array(BoogieIntentDecision),
});
export type IDariRunResponse = z.infer<typeof IDariRunResponse>;

// Execute Request
export const ExecuteRequest = z.object({
  request_id: z.string().uuid(),
  intent_ids: z.array(z.string().uuid()),
  confirm_token: z.string().optional(),
  ui: UIContextSchema,
});
export type ExecuteRequest = z.infer<typeof ExecuteRequest>;

// Execute Response
export const ExecuteResponse = z.object({
  tool_results: z.array(ToolResult),
  ui_deltas: z.array(UIDelta),
  response_text: z.string().optional(),
});
export type ExecuteResponse = z.infer<typeof ExecuteResponse>;

// ============================================================================
// MEMORY TYPES
// ============================================================================

export const MemoryScope = z.enum(['preferences', 'nav_habits', 'drafts']);
export type MemoryScope = z.infer<typeof MemoryScope>;

export const AIMemory = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  agent: AgentType,
  scope: MemoryScope,
  key: z.string(),
  value: z.record(z.unknown()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type AIMemory = z.infer<typeof AIMemory>;

// ============================================================================
// AUDIT TYPES
// ============================================================================

export const AuditEntry = z.object({
  id: z.string().uuid(),
  request_id: z.string().uuid(),
  intent_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  agent: AgentType,
  intent_type: IntentType.optional(),
  decision: BoogieDecision.optional(),
  payload_hash: z.string(),
  ok: z.boolean(),
  error_code: z.string().optional(),
  latency_ms: z.number(),
  created_at: z.string().datetime(),
});
export type AuditEntry = z.infer<typeof AuditEntry>;

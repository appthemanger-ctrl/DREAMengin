// lib/ai/boogie-verifier.ts
// THE BOOGIE MAN - Policy Enforcement & Risk Scoring Engine
// Deterministic verifier for all AI intents

import {
  Intent,
  ActorContext,
  BoogieOutput,
  BoogieIntentDecision,
  BoogieSignals,
  BoogieDecision,
  ReasonCode,
  AgentType,
  DrEamsIntentType,
  IDariIntentType,
} from '@/types/ai-system';
import { createServerClient } from '@/lib/supabase/server';

// ============================================================================
// POLICY CONFIGURATION
// ============================================================================

interface PolicyRules {
  hard_deny_rules: string[];
  allowlists: {
    dr_eams: string[];
    idari: string[];
  };
}

interface RiskWeights {
  tries_admin: number;
  cross_user_target: number;
  destructive: number;
  mass_write: number;
  rpm_factor: number;
  jailbreak: number;
  secret_like: number;
  tool_override: number;
  external_side_effect: number;
}

interface RiskThresholds {
  deny: number;
  confirm: number;
  allow: number;
}

interface PolicyVersion {
  version: string;
  rules_json: PolicyRules;
  weights: RiskWeights;
  thresholds: RiskThresholds;
}

// Default policy (fallback if DB not available)
const DEFAULT_POLICY: PolicyVersion = {
  version: 'v1.0-default',
  rules_json: {
    hard_deny_rules: [
      'intent_type_not_allowlisted',
      'admin_intent_from_user',
      'service_key_in_payload',
      'raw_sql_in_payload',
    ],
    allowlists: {
      dr_eams: [
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
      ],
      idari: [
        'DIAG_SCHEMA_SNAPSHOT',
        'DIAG_RLS_SNAPSHOT',
        'DIAG_CODE_REFERENCE_SCAN',
        'DIAG_ENV_CHECKLIST',
        'ADMIN_PATCH_PROPOSAL',
        'ADMIN_MIGRATION_PROPOSAL',
        'MODERATION_FLAG_CONTENT',
      ],
    },
  },
  weights: {
    tries_admin: 6,
    cross_user_target: 6,
    destructive: 5,
    mass_write: 4,
    rpm_factor: 2,
    jailbreak: 4,
    secret_like: 4,
    tool_override: 5,
    external_side_effect: 4,
  },
  thresholds: {
    deny: 10,
    confirm: 6,
    allow: 0,
  },
};

// ============================================================================
// SIGNAL DETECTION
// ============================================================================

function detectJailbreak(message: string, payload: Record<string, unknown>): boolean {
  const patterns = [
    /ignore\s+(previous\s+)?instructions?/i,
    /act\s+as\s+(a\s+)?(system|admin|root)/i,
    /disregard\s+(all\s+)?rules?/i,
    /you\s+are\s+now/i,
    /new\s+instructions?:/i,
    /override\s+policy/i,
    /bypass\s+security/i,
  ];

  const textToCheck = message + JSON.stringify(payload);
  return patterns.some((pattern) => pattern.test(textToCheck));
}

function detectToolOverride(message: string, payload: Record<string, unknown>): boolean {
  const patterns = [
    /run\s+(sql|query|command)/i,
    /execute\s+(code|script|function)/i,
    /eval\(/i,
    /system\(/i,
    /shell_exec/i,
    /__import__/i,
  ];

  const textToCheck = message + JSON.stringify(payload);
  return patterns.some((pattern) => pattern.test(textToCheck));
}

function detectSchemaPoisoning(payload: Record<string, unknown>): boolean {
  const payloadStr = JSON.stringify(payload).toLowerCase();
  const patterns = ['alter table', 'drop table', 'create table', 'grant ', 'revoke '];
  return patterns.some((p) => payloadStr.includes(p));
}

function detectSecretLike(payload: Record<string, unknown>): boolean {
  const payloadStr = JSON.stringify(payload);
  const patterns = [
    /sk-[a-zA-Z0-9]{32,}/i, // OpenAI-style keys
    /[a-f0-9]{32,}/i, // Generic hex keys
    /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+/, // JWT
    /BEGIN\s+(RSA\s+)?PRIVATE\s+KEY/i,
    /service_role/i,
    /anon_key/i,
  ];

  return patterns.some((pattern) => pattern.test(payloadStr));
}

function detectPII(payload: Record<string, unknown>): boolean {
  const payloadStr = JSON.stringify(payload);
  const patterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{16}\b/, // Credit card
    /\b[\w._%+-]+@[\w.-]+\.[a-z]{2,}\b/i, // Email (loose check)
  ];

  return patterns.some((pattern) => pattern.test(payloadStr));
}

function detectCrossUserTarget(
  intent: Intent,
  actor: ActorContext
): boolean {
  const payload = intent.payload;

  // Check for user_id that doesn't match actor
  if (payload.user_id && payload.user_id !== actor.user_id) {
    // Allow following/viewing other users
    if (intent.type === 'FOLLOW_USER') return false;
    return true;
  }

  return false;
}

function detectDestructive(intent: Intent): boolean {
  const destructiveIntents = ['DREAM_REMOVE', 'POST_DELETE'];
  return destructiveIntents.includes(intent.type);
}

function detectMassWrite(intent: Intent): boolean {
  const payload = intent.payload;

  // Check for array operations
  if (Array.isArray(payload.dream_ids) && payload.dream_ids.length > 5) {
    return true;
  }

  // Check for bulk operations
  if (payload.bulk === true || payload.batch === true) {
    return true;
  }

  return false;
}

function detectPrivilegeEscalation(intent: Intent, actor: ActorContext): boolean {
  // Check if user is trying to use admin intents
  const adminIntents = [
    'DIAG_SCHEMA_SNAPSHOT',
    'DIAG_RLS_SNAPSHOT',
    'DIAG_CODE_REFERENCE_SCAN',
    'DIAG_ENV_CHECKLIST',
    'ADMIN_PATCH_PROPOSAL',
    'ADMIN_MIGRATION_PROPOSAL',
    'MODERATION_FLAG_CONTENT',
  ];

  if (adminIntents.includes(intent.type) && actor.role !== 'admin') {
    return true;
  }

  // Check payload for role changes
  const payload = intent.payload;
  if (payload.role && payload.role !== actor.role) {
    return true;
  }

  return false;
}

// ============================================================================
// SIGNAL AGGREGATION
// ============================================================================

export async function detectSignals(
  intents: Intent[],
  actor: ActorContext,
  message: string,
  rpm: number
): Promise<BoogieSignals> {
  const signals: BoogieSignals = {
    rate: {
      rpm,
      burst: rpm > 30,
    },
    injection: {
      jailbreak: false,
      tool_override: false,
      schema_poison: false,
    },
    auth: {
      tries_admin: false,
      cross_user_target: false,
      privilege_escalation: false,
    },
    ops: {
      destructive: false,
      mass_write: false,
      external_side_effect: false,
    },
    data: {
      secret_like: false,
      pii_like: false,
    },
  };

  // Check message-level signals
  signals.injection.jailbreak = detectJailbreak(message, {});
  signals.injection.tool_override = detectToolOverride(message, {});

  // Check intent-level signals
  for (const intent of intents) {
    if (detectJailbreak('', intent.payload)) {
      signals.injection.jailbreak = true;
    }
    if (detectToolOverride('', intent.payload)) {
      signals.injection.tool_override = true;
    }
    if (detectSchemaPoisoning(intent.payload)) {
      signals.injection.schema_poison = true;
    }
    if (detectSecretLike(intent.payload)) {
      signals.data.secret_like = true;
    }
    if (detectPII(intent.payload)) {
      signals.data.pii_like = true;
    }
    if (detectCrossUserTarget(intent, actor)) {
      signals.auth.cross_user_target = true;
    }
    if (detectDestructive(intent)) {
      signals.ops.destructive = true;
    }
    if (detectMassWrite(intent)) {
      signals.ops.mass_write = true;
    }
    if (detectPrivilegeEscalation(intent, actor)) {
      signals.auth.privilege_escalation = true;
      signals.auth.tries_admin = true;
    }
  }

  return signals;
}

// ============================================================================
// RISK SCORING
// ============================================================================

function calculateRiskScore(signals: BoogieSignals, weights: RiskWeights): number {
  let score = 0;

  // Feature vector to weight mapping
  if (signals.auth.tries_admin) score += weights.tries_admin;
  if (signals.auth.cross_user_target) score += weights.cross_user_target;
  if (signals.ops.destructive) score += weights.destructive;
  if (signals.ops.mass_write) score += weights.mass_write;
  if (signals.injection.jailbreak) score += weights.jailbreak;
  if (signals.data.secret_like) score += weights.secret_like;
  if (signals.injection.tool_override) score += weights.tool_override;
  if (signals.ops.external_side_effect) score += weights.external_side_effect;

  // Rate-based scoring
  const rpmNormalized = Math.min(signals.rate.rpm / 30, 2);
  score += rpmNormalized * weights.rpm_factor;

  return score;
}

// ============================================================================
// HARD DENY RULES
// ============================================================================

function checkHardDenyRules(
  intent: Intent,
  actor: ActorContext,
  agent: AgentType,
  policy: PolicyRules,
  signals: BoogieSignals
): { deny: boolean; reason: ReasonCode } | null {
  // Check allowlist
  const allowlist = agent === 'dr_eams' ? policy.allowlists.dr_eams : policy.allowlists.idari;
  if (!allowlist.includes(intent.type)) {
    return { deny: true, reason: 'INTENT_NOT_ALLOWLISTED' };
  }

  // Check admin intent from non-admin user
  const adminIntents = policy.allowlists.idari;
  if (adminIntents.includes(intent.type) && actor.role !== 'admin') {
    return { deny: true, reason: 'ADMIN_ONLY' };
  }

  // Check for secrets
  if (signals.data.secret_like) {
    return { deny: true, reason: 'SECRET_DETECTED' };
  }

  // Check for tool override attempts
  if (signals.injection.tool_override) {
    return { deny: true, reason: 'TOOL_OVERRIDE_ATTEMPT' };
  }

  return null;
}

// ============================================================================
// BOOGIE VERIFIER MAIN
// ============================================================================

export async function verifyIntents(
  request_id: string,
  intents: Intent[],
  actor: ActorContext,
  agent: AgentType,
  message: string,
  rpm: number
): Promise<BoogieOutput> {
  // Load policy from DB (or use default)
  const supabase = await createServerClient();
  let policy: PolicyVersion = DEFAULT_POLICY;

  try {
     
    const { data } = await (supabase as any)
      .from('policy_versions')
      .select('version, rules_json, weights, thresholds')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      policy = data as unknown as PolicyVersion;
    }
  } catch (error) {
    console.warn('Failed to load policy from DB, using default:', error);
  }

  // Detect signals
  const signals = await detectSignals(intents, actor, message, rpm);

  // Calculate global risk
  const globalRisk = calculateRiskScore(signals, policy.weights);

  // Check for global hard block
  const globalHardBlock = signals.injection.jailbreak || globalRisk >= policy.thresholds.deny * 2;

  const perIntent: BoogieIntentDecision[] = [];

  for (const intent of intents) {
    // Check hard deny rules first
    const hardDeny = checkHardDenyRules(intent, actor, agent, policy.rules_json, signals);
    if (hardDeny) {
      perIntent.push({
        intent_id: intent.intent_id,
        decision: 'DENY',
        risk_score: 999,
        reason_code: hardDeny.reason,
      });
      continue;
    }

    // Calculate intent-specific risk (use global for now)
    const riskScore = globalRisk;

    // Determine decision based on thresholds
    let decision: BoogieDecision;
    let reasonCode: ReasonCode;

    if (riskScore >= policy.thresholds.deny) {
      decision = 'DENY';
      reasonCode = 'RISK_SCORE_HIGH';
    } else if (riskScore >= policy.thresholds.confirm) {
      decision = 'CONFIRM';
      reasonCode = 'RISK_SCORE_MODERATE';
    } else {
      decision = 'ALLOW';
      reasonCode = 'OK';
    }

    // Override with explicit confirmation requirement
    if (intent.requires_confirmation && decision === 'ALLOW') {
      decision = 'CONFIRM';
    }

    perIntent.push({
      intent_id: intent.intent_id,
      decision,
      risk_score: riskScore,
      reason_code: reasonCode,
    });
  }

  return {
    request_id,
    per_intent: perIntent,
    global: {
      hard_block: globalHardBlock,
      cooldown_seconds: globalHardBlock ? 300 : undefined, // 5 min cooldown on hard block
    },
  };
}

// ============================================================================
// REDACTION HELPERS
// ============================================================================

export function redactSecrets(payload: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...payload };

  function redactValue(val: unknown): unknown {
    if (typeof val === 'string') {
      // Redact JWT patterns, API keys, hex keys
      let s: string = val;
      s = s.replace(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]');
      // Redact API keys
      s = s.replace(/sk-[a-zA-Z0-9]{32,}/gi, '[REDACTED_KEY]');
      // Redact hex keys
      s = s.replace(/\b[a-f0-9]{32,}\b/gi, '[REDACTED_HEX]');
      return s;
    } else if (typeof val === 'object' && val !== null) {
      if (Array.isArray(val)) {
        return val.map(redactValue);
      } else {
        const obj = val as Record<string, unknown>;
        const redactedObj: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
          redactedObj[k] = redactValue(v);
        }
        return redactedObj;
      }
    }
    return val;
  }

  for (const [key, value] of Object.entries(redacted)) {
    redacted[key] = redactValue(value);
  }

  return redacted;
}

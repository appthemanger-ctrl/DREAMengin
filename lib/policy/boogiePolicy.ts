// lib/policy/boogiePolicy.ts
// TheBoogieMan.AI — centralized policy module (req 96–100).
// Single source of truth for category enums, severity enums, thresholds,
// action durations, user-facing copy keys, and the PolicyResult type.
//
// Policy document: docs/BOOGIEMAN_POLICY.md
// Public page: /policy

// Re-export all constants from the core policy file so callers can import
// from either location without duplication.
export {
  BOOGIE_POLICY_VERSION,
  ENFORCEMENT_ACTIONS,
  ENFORCEMENT_SCOPES,
  STRIKE_WEIGHTS,
  STRIKE_EXPIRY_DAYS,
  DEFAULT_DURATIONS_SECONDS,
  THRESHOLDS,
  RULE_CODES,
  CATEGORY_SEVERITY,
  USER_REASON_MESSAGES,
  RECOVER_STEPS,
} from '@/lib/ai/boogie-policy';

export type {
  StrikeSeverityLevel,
  EnforcementAction,
  EnforcementScope,
  BoogiePolicyVersion,
  RuleCode,
} from '@/lib/ai/boogie-policy';

// ============================================================================
// POLICY CATEGORY ENUM (req 24–25)
// Short labels matching docs/BOOGIEMAN_POLICY.md taxonomy.
// ============================================================================

export const PolicyCategory = {
  SPAM_SCAMS:     'SPAM/SCAMS',
  HARASSMENT:     'HARASSMENT',
  HATE:           'HATE',
  SEXUAL:         'SEXUAL',
  MINORS:         'MINORS',
  SELF_HARM:      'SELF-HARM',
  VIOLENCE:       'VIOLENCE',
  ILLEGAL:        'ILLEGAL',
  PRIVACY:        'PRIVACY',
  MALWARE_ABUSE:  'MALWARE/ABUSE',
  IMPERSONATION:  'IMPERSONATION',
  MISINFO:        'MISINFO',
  EVASION:        'EVASION',
  NONE:           'NONE',
} as const;

export type PolicyCategoryValue = typeof PolicyCategory[keyof typeof PolicyCategory];

// ============================================================================
// ENFORCEMENT SEVERITY LEVELS (req 73) — S0 (least) → S5 (most)
// ============================================================================

export const PolicySeverity = {
  S0_NOTICE:       'S0_NOTICE',
  S1_SOFT_WARN:    'S1_SOFT_WARN',
  S2_HARD_WARN:    'S2_HARD_WARN',
  S3_FEATURE_LOCK: 'S3_FEATURE_LOCK',
  S4_TEMP_BAN:     'S4_TEMP_BAN',
  S5_PERM_BAN:     'S5_PERM_BAN',
} as const;

export type PolicySeverityLevel = typeof PolicySeverity[keyof typeof PolicySeverity];

// ============================================================================
// POLICY RESULT (req 98)
// The canonical result type returned by boogieEvaluate() and emitted as events.
// ============================================================================

export interface PolicyResult {
  /** Whether the content/action is allowed. */
  allowed: boolean;
  /** Which policy category triggered this result. */
  category: PolicyCategoryValue;
  /** Enforcement severity level (S0–S5). */
  severity: PolicySeverityLevel;
  /** Ordered list of enforcement actions applied (least → most force). */
  actions: string[];
  /** Plain-language reason shown to the user (never reveals internals). */
  reason: string;
  /** Reference to the specific policy rule that was applied, e.g. "C28_SPAM". */
  policy_ref: string;
  /** ISO timestamp when the restriction expires, or null if no expiry. */
  expires_at: string | null;
}

// ============================================================================
// RULE CODE → PolicyCategory mapping (req 26)
// ============================================================================

const RULE_TO_CATEGORY: Record<string, PolicyCategoryValue> = {
  C21_HARASSMENT: PolicyCategory.HARASSMENT,
  C22_CSAM:       PolicyCategory.MINORS,
  C23_NCII:       PolicyCategory.SEXUAL,
  C24_VIOLENCE:   PolicyCategory.VIOLENCE,
  C25_SELF_HARM:  PolicyCategory.SELF_HARM,
  C26_ILLEGAL:    PolicyCategory.ILLEGAL,
  C27_FRAUD:      PolicyCategory.IMPERSONATION,
  C28_SPAM:       PolicyCategory.SPAM_SCAMS,
  C29_PRIVACY:    PolicyCategory.PRIVACY,
  C30_MALWARE:    PolicyCategory.MALWARE_ABUSE,
  C31_GROOMING:   PolicyCategory.MINORS,  // child predator grooming → MINORS category
  CAT_HATE:       PolicyCategory.HATE,
  CAT_MISINFO:    PolicyCategory.MISINFO,
  CAT_EVASION:    PolicyCategory.EVASION,
};

// ============================================================================
// RULE CODE → PolicySeverity mapping (req 73–79)
// ============================================================================

const RULE_TO_SEVERITY: Record<string, PolicySeverityLevel> = {
  C22_CSAM:    PolicySeverity.S5_PERM_BAN,   // one-strike (req 82)
  C30_MALWARE: PolicySeverity.S5_PERM_BAN,   // one-strike
  C31_GROOMING:PolicySeverity.S5_PERM_BAN,   // one-strike: zero-tolerance for child predators
  C24_VIOLENCE:PolicySeverity.S4_TEMP_BAN,
  C25_SELF_HARM:PolicySeverity.S4_TEMP_BAN,
  C21_HARASSMENT:PolicySeverity.S3_FEATURE_LOCK,
  C29_PRIVACY: PolicySeverity.S3_FEATURE_LOCK,
  C26_ILLEGAL: PolicySeverity.S3_FEATURE_LOCK,
  C27_FRAUD:   PolicySeverity.S3_FEATURE_LOCK,
  C23_NCII:    PolicySeverity.S4_TEMP_BAN,
  C28_SPAM:    PolicySeverity.S1_SOFT_WARN,
};

// ============================================================================
// USER-FACING REASON MESSAGES per category (req 95 — factual, calm, no shaming)
// ============================================================================

const CATEGORY_REASON: Record<PolicyCategoryValue, string> = {
  [PolicyCategory.SPAM_SCAMS]:    'Your activity was flagged for spam or scam patterns.',
  [PolicyCategory.HARASSMENT]:    'Your content was flagged for harassment or targeted abuse.',
  [PolicyCategory.HATE]:          'Your content was flagged for hateful language or dehumanization.',
  [PolicyCategory.SEXUAL]:        'Your content was flagged for explicit sexual material.',
  [PolicyCategory.MINORS]:        'Content involving minors was detected. This requires immediate review.',
  [PolicyCategory.SELF_HARM]:     'Your content was flagged for self-harm context. Support resources are available.',
  [PolicyCategory.VIOLENCE]:      'Your content was flagged for violence or threats.',
  [PolicyCategory.ILLEGAL]:       'Your content was flagged for illegal instructions or activity.',
  [PolicyCategory.PRIVACY]:       'Your content was flagged for sharing private information without consent.',
  [PolicyCategory.MALWARE_ABUSE]: 'A potentially harmful link or file was detected.',
  [PolicyCategory.IMPERSONATION]: 'Your content was flagged for impersonation or misleading identity.',
  [PolicyCategory.MISINFO]:       'Your content was flagged for potentially harmful misinformation.',
  [PolicyCategory.EVASION]:       'Your activity was flagged for attempting to bypass platform rules.',
  [PolicyCategory.NONE]:          'No issues found.',
};

// ============================================================================
// boogieEvaluate — single public API (req 97)
// Accepts flexible input, returns a deterministic PolicyResult.
// ============================================================================

export interface BoogieEvaluateInput {
  /** Rule code from docs/BOOGIEMAN_POLICY.md (e.g. "C28_SPAM"). Required. */
  policy_ref: string;
  /** Numeric severity 0–1. */
  severity?: number;
  /** Confidence in the detection 0–1. */
  confidence?: number;
  /** Number of prior active strikes for this user. */
  strike_count?: number;
  /** ISO timestamp when any applied restriction should expire, if known. */
  expires_at?: string | null;
  /** Override the resolved category. */
  category?: PolicyCategoryValue;
}

/**
 * boogieEvaluate — the single enforcement evaluation function (req 97).
 *
 * Returns a PolicyResult that:
 *  - maps the rule code to its category + default severity
 *  - picks the least-force action matching the severity level (req 22)
 *  - includes the policy_ref so every result links back to a written rule (req 94)
 *  - never reveals internals (req 95)
 */
export function boogieEvaluate(input: BoogieEvaluateInput): PolicyResult {
  const {
    policy_ref,
    severity = 0,
    confidence = 1,
    strike_count = 0,
    expires_at = null,
    category: categoryOverride,
  } = input;

  const category: PolicyCategoryValue =
    categoryOverride ?? RULE_TO_CATEGORY[policy_ref] ?? PolicyCategory.NONE;

  const allowed = category === PolicyCategory.NONE && severity < 0.1;

  // Select severity level (req 73–79)
  const severityLevel: PolicySeverityLevel = selectPolicySeverity(
    policy_ref,
    severity,
    confidence,
    strike_count,
  );

  const actions = allowed ? [] : selectPolicyActions(severityLevel, allowed);
  const reason = CATEGORY_REASON[category] ?? 'Your activity was reviewed by TheBoogieMan.AI.';

  return {
    allowed,
    category,
    severity: severityLevel,
    actions,
    reason,
    policy_ref,
    expires_at,
  };
}

// ============================================================================
// HELPERS (internal — not exported to prevent internal signal leakage, req H63)
// ============================================================================

function selectPolicySeverity(
  ruleCode: string,
  severity: number,
  confidence: number,
  strikeCount: number,
): PolicySeverityLevel {
  // One-strike rules: immediate highest severity regardless of confidence (req 82)
  if (ruleCode === 'C22_CSAM' || ruleCode === 'C30_MALWARE' || ruleCode === 'C31_GROOMING') {
    return PolicySeverity.S5_PERM_BAN;
  }

  // Low severity + first offense + decent confidence → notice only (req 83)
  if (severity < 0.1 && strikeCount === 0 && confidence >= 0.6) {
    return PolicySeverity.S0_NOTICE;
  }

  // Use rule-specific mapping if available
  const mapped = RULE_TO_SEVERITY[ruleCode];
  if (mapped) {
    // Scale up if repeat offender (req 81)
    if (strikeCount > 1 && mapped < PolicySeverity.S4_TEMP_BAN) {
      return escalateSeverity(mapped);
    }
    return mapped;
  }

  // Fallback: derive from numeric severity score (req 73–79)
  if (severity >= 0.9) return PolicySeverity.S4_TEMP_BAN;
  if (severity >= 0.7) return PolicySeverity.S3_FEATURE_LOCK;
  if (severity >= 0.4) return PolicySeverity.S2_HARD_WARN;
  if (severity >= 0.1) return PolicySeverity.S1_SOFT_WARN;
  return PolicySeverity.S0_NOTICE;
}

function escalateSeverity(level: PolicySeverityLevel): PolicySeverityLevel {
  const order: PolicySeverityLevel[] = [
    PolicySeverity.S0_NOTICE,
    PolicySeverity.S1_SOFT_WARN,
    PolicySeverity.S2_HARD_WARN,
    PolicySeverity.S3_FEATURE_LOCK,
    PolicySeverity.S4_TEMP_BAN,
    PolicySeverity.S5_PERM_BAN,
  ];
  const idx = order.indexOf(level);
  return order[Math.min(idx + 1, order.length - 1)];
}

function selectPolicyActions(level: PolicySeverityLevel, _allowed: boolean): string[] {
  switch (level) {
    case PolicySeverity.S0_NOTICE:       return ['NUDGE'];
    case PolicySeverity.S1_SOFT_WARN:    return ['WARN'];
    case PolicySeverity.S2_HARD_WARN:    return ['WARN', 'QUARANTINE'];
    case PolicySeverity.S3_FEATURE_LOCK: return ['QUARANTINE', 'FEATURE_LOCK'];
    case PolicySeverity.S4_TEMP_BAN:     return ['FEATURE_LOCK', 'TEMP_BAN', 'ESCALATE'];
    case PolicySeverity.S5_PERM_BAN:     return ['TEMP_BAN', 'ESCALATE'];
    default:                             return ['NUDGE'];
  }
}

// ============================================================================
// emitBoogieManEvent — client-side event bus (req 99)
// Dispatches a CustomEvent so any UI component can respond consistently.
// ============================================================================

export function emitBoogieManEvent(result: PolicyResult): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<PolicyResult>('dreamengin:boogieman', { detail: result }),
  );
}

export function onBoogieManEvent(
  handler: (result: PolicyResult) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<PolicyResult>;
    if (ce.detail) handler(ce.detail);
  };
  window.addEventListener('dreamengin:boogieman', listener);
  return () => window.removeEventListener('dreamengin:boogieman', listener);
}

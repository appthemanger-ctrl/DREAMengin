// lib/ai/boogie-policy.ts
// TheBoogieMan.Ai — single source of truth for all policy constants.
// Every enforcement decision in boogieman.ts must reference this file.
// Policy document: docs/policy/theboogie.md

// ============================================================================
// POLICY VERSION (change this when the policy doc is updated)
// ============================================================================

export const BOOGIE_POLICY_VERSION = 'BOOGIE_POLICY_V1' as const;
export type BoogiePolicyVersion = typeof BOOGIE_POLICY_VERSION;

// ============================================================================
// ENFORCEMENT ACTION TYPES (req 36) — ordered least → most force
// ============================================================================

export const ENFORCEMENT_ACTIONS = [
  'NUDGE',         // soft informational hint (req 31)
  'WARN',          // explicit written warning (req 36)
  'THROTTLE',      // rate limit / cooldown (req 32, 38)
  'FEATURE_LOCK',  // disable specific surfaces (req 38, 40, 47)
  'QUARANTINE',    // hide content pending edit/review (req 51)
  'TEMP_SUSPEND',  // read-only mode for duration (req 39)
  'TEMP_BAN',      // no access for duration (req 41)
  'ESCALATE',      // hand off to triad / human queue (req 71+)
] as const;

export type EnforcementAction = typeof ENFORCEMENT_ACTIONS[number];

// ============================================================================
// ENFORCEMENT SCOPES (req 46) — prefer scope lock over blanket punishment (req 47)
// ============================================================================

export const ENFORCEMENT_SCOPES = [
  'POSTING',        // post / publish
  'MESSAGING',      // DMs and threads
  'LINKING',        // outbound link insertion
  'MARKETPLACE',    // shop / listings
  'TEMPLATE_SHARE', // dream share codes / templates
] as const;

export type EnforcementScope = typeof ENFORCEMENT_SCOPES[number];

// ============================================================================
// STRIKE SEVERITY LEVELS + WEIGHTS (req 46, 28)
// ============================================================================

export type StrikeSeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const STRIKE_WEIGHTS: Record<StrikeSeverityLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 4,
  CRITICAL: 10,
};

// Strike expiry windows in days (req 47)
export const STRIKE_EXPIRY_DAYS: Record<StrikeSeverityLevel, number> = {
  LOW: 14,      // minor → expires in 14 days
  MEDIUM: 30,   // moderate → expires in 30 days
  HIGH: 90,     // severe → expires in 90 days
  CRITICAL: 180,// critical → expires in 180 days
};

// ============================================================================
// DEFAULT ACTION DURATIONS in seconds (req 41)
// ============================================================================

export const DEFAULT_DURATIONS_SECONDS: Record<string, number> = {
  THROTTLE_MIN:     5 * 60,       // 5 min
  THROTTLE_MAX:     30 * 60,      // 30 min
  FEATURE_LOCK_1ST: 1 * 3600,     // 1 hour (first offense)
  FEATURE_LOCK_2ND: 24 * 3600,    // 24 hours (repeat)
  FEATURE_LOCK_3RD: 7 * 24 * 3600,// 7 days (repeat+)
  TEMP_SUSPEND:     24 * 3600,    // 24 hours baseline
  TEMP_BAN_1:       24 * 3600,    // 24 hours
  TEMP_BAN_2:       3 * 24 * 3600,// 3 days
  TEMP_BAN_3:       7 * 24 * 3600,// 7 days
  TEMP_BAN_MAX:     14 * 24 * 3600,// 14 days max without human review
};

// ============================================================================
// SCORING THRESHOLDS (req 21–25, 57, 58)
// ============================================================================

export const THRESHOLDS = {
  // Below this confidence, never temp-ban; only nudge/warn/throttle/lock + escalate (req 23, 57)
  MIN_CONFIDENCE_FOR_BAN: 0.60,

  // At or above this severity, may quarantine/lock immediately even at moderate confidence (req 24, 58)
  CRITICAL_SEVERITY: 0.95,

  // Above this RPM, hard-block (req 32)
  HARD_BLOCK_RPM: 60,

  // Above this RPM on write ops, require confirmation
  HIGH_RPM_WRITE: 30,

  // Max enforcement actions per user per hour to prevent loops (req 56)
  MAX_ACTIONS_PER_HOUR: 6,

  // Dedup window in seconds — ignore identical triggers (req 57)
  DEDUP_WINDOW_SECONDS: 300,

  // Rolling window for escalation multiplier (req 30)
  STRIKE_ESCALATION_WINDOW_DAYS: 7,
} as const;

// ============================================================================
// RULE CODES — exactly the codes defined in docs/policy/theboogie.md
// Enforcement MUST only reference these codes (req 2, 3, 92)
// ============================================================================

export const RULE_CODES = {
  // A — Scope and guarantees
  A1_SCOPE:            'A1_SCOPE',
  A2_PREDICTABLE:      'A2_PREDICTABLE',
  A3_CONSERVATIVE:     'A3_CONSERVATIVE',
  A4_EXPLAIN:          'A4_EXPLAIN',
  A5_NO_SHADOW_BAN:    'A5_NO_SHADOW_BAN',
  A6_WARN_FIRST:       'A6_WARN_FIRST',
  A7_PREFER_FRICTION:  'A7_PREFER_FRICTION',
  A8_CONSISTENT:       'A8_CONSISTENT',
  A9_PROTECT_MINORS:   'A9_PROTECT_MINORS',
  A10_AUDIT_MINIMAL:   'A10_AUDIT_MINIMAL_DATA',

  // C — Violation categories
  C21_HARASSMENT:      'C21_HARASSMENT',
  C22_CSAM:            'C22_CSAM',
  C23_NCII:            'C23_NCII',
  C24_VIOLENCE:        'C24_VIOLENCE',
  C25_SELF_HARM:       'C25_SELF_HARM',
  C26_ILLEGAL:         'C26_ILLEGAL',
  C27_FRAUD:           'C27_FRAUD',
  C28_SPAM:            'C28_SPAM',
  C29_PRIVACY:         'C29_PRIVACY',
  C30_MALWARE:         'C30_MALWARE',

  // E — Enforcement ladder
  E36_LADDER:          'E36_LADDER',
  E37_SKIP_STEPS:      'E37_SKIP_STEPS',
  E38_FRICTION:        'E38_FRICTION',
  E39_TEMP_MUTE:       'E39_TEMP_MUTE',
  E40_TEMP_LOCK:       'E40_TEMP_LOCK',
  E41_TEMP_BAN:        'E41_TEMP_BAN',
  E42_PERM_BAN_HUMAN:  'E42_PERM_BAN_HUMAN',
  E43_COOLDOWN_SCALE:  'E43_COOLDOWN_SCALE',
  E44_EXPIRY:          'E44_EXPIRY',
  E45_FIRST_TIME:      'E45_FIRST_TIME',

  // F — Strike system
  F46_STRIKE_LEVELS:   'F46_STRIKE_LEVELS',
  F50_CRITICAL_ESC:    'F50_CRITICAL_ESCALATE',
  F51_STRIKE_STORE:    'F51_STRIKE_STORE',
  F53_APPEALABLE:      'F53_APPEALABLE',
  F55_RECALCULATE:     'F55_RECALCULATE',

  // G — Scoring / uncertainty
  G56_SCORES:          'G56_SCORES',
  G57_LOW_CONFIDENCE:  'G57_LOW_CONFIDENCE',
  G58_HIGH_SEVERITY:   'G58_HIGH_SEVERITY',
  G60_AMBIGUOUS:       'G60_AMBIGUOUS',

  // H — Messaging
  H61_PLAIN_REASON:    'H61_PLAIN_REASON',
  H62_NEXT_STEP:       'H62_NEXT_STEP',
  H63_NO_INTERNALS:    'H63_NO_INTERNALS',
  H66_POLICY_LINK:     'H66_POLICY_LINK',
  H70_CRISIS:          'H70_CRISIS_RESOURCES',

  // I — Escalation
  I71_IMMEDIATE:       'I71_IMMEDIATE',
  I72_SATIRE:          'I72_SATIRE_PARODY',
  I75_NEW_EVIDENCE:    'I75_NEW_EVIDENCE',
  I78_SPAM_WAVE:       'I78_SPAM_WAVE',
  I79_POLICY_CHANGE:   'I79_POLICY_CHANGE',
  I80_PERM_BAN:        'I80_PERM_BAN',

  // J — Triad
  J81_TRIAD_ROLES:     'J81_TRIAD_ROLES',
  J86_TRIAD_APPROVAL:  'J86_TRIAD_APPROVAL',
  J88_NO_SCOPE_CREEP:  'J88_NO_SCOPE_CREEP',
  J90_API:             'J90_API',

  // K — Data/privacy
  K91_MIN_EVIDENCE:    'K91_MIN_EVIDENCE',
  K92_NO_PRIVATE_MSG:  'K92_NO_PRIVATE_MESSAGES',
  K95_DELETE_DATA:     'K95_DELETE_DATA',
  K99_PUBLIC_POLICY:   'K99_PUBLIC_POLICY',
  K100_CHANGELOG:      'K100_CHANGELOG',

  // Internal codes (intent-gate rules, not content rules)
  ADMIN_REQUIRED:      'ADMIN_REQUIRED',
  HIGH_RISK:           'HIGH_RISK',
  HIGH_RPM_WRITE:      'HIGH_RPM_WRITE',
  LOW_CONFIDENCE:      'LOW_CONFIDENCE',
  UNKNOWN_INTENT_TYPE: 'UNKNOWN_INTENT_TYPE',
  USER_CONFIRM:        'USER_CONFIRMATION_REQUIRED',
  RATE_LIMIT:          'RATE_LIMIT',
  OK:                  'OK',
  SIMULATION:          'SIMULATION',
} as const;

export type RuleCode = typeof RULE_CODES[keyof typeof RULE_CODES];

// ============================================================================
// CATEGORY → default StrikeSeverityLevel mapping
// ============================================================================

export const CATEGORY_SEVERITY: Record<string, StrikeSeverityLevel> = {
  C21_HARASSMENT: 'HIGH',
  C22_CSAM:       'CRITICAL',
  C23_NCII:       'CRITICAL',
  C24_VIOLENCE:   'CRITICAL',
  C25_SELF_HARM:  'CRITICAL',
  C26_ILLEGAL:    'HIGH',
  C27_FRAUD:      'HIGH',
  C28_SPAM:       'LOW',
  C29_PRIVACY:    'MEDIUM',
  C30_MALWARE:    'CRITICAL',
};

// ============================================================================
// USER-FACING REASON MESSAGES per rule code (req 61, 17)
// These are the only allowed user-safe explanations. Internal signals never leak.
// ============================================================================

export const USER_REASON_MESSAGES: Partial<Record<string, string>> = {
  C21_HARASSMENT: 'Your content was flagged for harassment or targeted abuse.',
  C22_CSAM:       'Content involving minors was detected. This requires immediate review.',
  C23_NCII:       'Content flagged for non-consensual intimate image concerns.',
  C24_VIOLENCE:   'Content flagged for violence incitement.',
  C25_SELF_HARM:  'Content flagged for self-harm context.',
  C26_ILLEGAL:    'Content flagged for illegal instructions.',
  C27_FRAUD:      'Activity flagged for potential fraud or scam patterns.',
  C28_SPAM:       'Your activity rate exceeded the allowed threshold.',
  C29_PRIVACY:    'Content flagged for sharing private information without consent.',
  C30_MALWARE:    'A potentially harmful link or file was detected.',
  ADMIN_REQUIRED: 'This action requires admin access.',
  HIGH_RISK:      'This action requires your confirmation before proceeding.',
  LOW_CONFIDENCE: 'This request could not be processed with sufficient confidence.',
  RATE_LIMIT:     'You have exceeded the request rate limit. Please slow down.',
  OK:             'No issues found.',
};

// ============================================================================
// HOW-TO-RECOVER STEPS per scope (req 50)
// ============================================================================

export const RECOVER_STEPS: Record<EnforcementScope, string> = {
  POSTING:        'Edit or remove the content, then re-submit. If you believe this is an error, submit an appeal.',
  MESSAGING:      'Slow down your messaging rate. After the restriction expires, messaging will restore automatically.',
  LINKING:        'Remove the flagged link from your content, or replace it with a verified source.',
  MARKETPLACE:    'Review your listings for policy compliance. Contact support if you believe this is an error.',
  TEMPLATE_SHARE: 'Remove any suspicious links or unrecognized widget fields from your template before sharing.',
};

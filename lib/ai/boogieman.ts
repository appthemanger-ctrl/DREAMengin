// lib/ai/boogieman.ts
// TheBoogieMan.Ai — deterministic policy engine.
//
// Every enforcement decision:
//   1. References a rule_code defined in docs/policy/theboogie.md
//   2. Carries BOOGIE_POLICY_VERSION so events are traceable to a published rule
//   3. Produces DUAL OUTPUT: user-safe explanation + internal audit event (req 16)
//   4. Uses the least-force action that reduces risk below threshold (req 37)
//   5. Never issues a permanent ban autonomously (req 9, 43)
//
// Simulation mode: set BOOGIE_SIMULATION_MODE=true to produce audit events and
// UI banners without actually restricting accounts (req 61, 62).

import { v4 as uuidv4 } from 'uuid';
import type { Intent } from './schemas';
import type {
  BoogieResult,
  BoogieOutput,
  BoogieEnforceOutput,
  EnforcementAction,
  EnforcementScope,
  StrikeSeverity,
} from './schemas';
import {
  BOOGIE_POLICY_VERSION,
  ENFORCEMENT_ACTIONS,
  STRIKE_WEIGHTS,
  STRIKE_EXPIRY_DAYS,
  DEFAULT_DURATIONS_SECONDS,
  THRESHOLDS,
  RULE_CODES,
  CATEGORY_SEVERITY,
  USER_REASON_MESSAGES,
  RECOVER_STEPS,
  type StrikeSeverityLevel,
  type EnforcementScope as PolicyScope,
} from './boogie-policy';

export { BOOGIE_POLICY_VERSION };

// ============================================================================
// SIMULATION MODE (req 61, 62) — never enable in production
// ============================================================================

function isSimulationMode(): boolean {
  return process.env.BOOGIE_SIMULATION_MODE === 'true';
}

// ============================================================================
// BLAST RADIUS THRESHOLD (req 25)
// Actions at or above this severity level are considered "containment-grade".
// Wide-impact incidents (blastRadius >= BLAST_RADIUS_ESCALATION_THRESHOLD) that
// have not yet reached containment severity are upgraded to QUARANTINE.
// ============================================================================

export const BLAST_RADIUS_ESCALATION_THRESHOLD = 10;
// Actions that already constitute meaningful containment (no further upgrade needed).
export const CONTAINMENT_ACTIONS: EnforcementAction[] = [
  'QUARANTINE', 'FEATURE_LOCK', 'TEMP_SUSPEND', 'TEMP_BAN', 'ESCALATE',
];

// ============================================================================
// RISK SCORING (req 21, 22)
// risk_score = severity × confidence × history_multiplier
// history_multiplier scales up when multiple strikes occur in rolling 7-day window (req 30)
// ============================================================================

export function computeRiskScore(
  severity: number,
  confidence: number,
  historyMultiplier = 1.0,
): number {
  return Math.min(1.0, severity * confidence * historyMultiplier);
}

// ============================================================================
// LEAST-FORCE ACTION SELECTION (req 7, 37)
// Given risk score and severity, return the smallest action that is warranted.
// ============================================================================

export function selectAction(params: {
  riskScore: number;
  severityLevel: StrikeSeverityLevel;
  confidence: number;
  isFirstOffense: boolean;
  isRepeatOffense: boolean;
}): EnforcementAction {
  const { riskScore, severityLevel, confidence, isFirstOffense } = params;

  // CRITICAL severity → immediate escalation/quarantine regardless of confidence (req 24, 42)
  if (severityLevel === 'CRITICAL') {
    return confidence >= THRESHOLDS.MIN_CONFIDENCE_FOR_BAN ? 'TEMP_SUSPEND' : 'ESCALATE';
  }

  // Below minimum confidence for ban → max is FEATURE_LOCK + escalate (req 23, 57)
  if (confidence < THRESHOLDS.MIN_CONFIDENCE_FOR_BAN) {
    return riskScore > 0.4 ? 'FEATURE_LOCK' : 'WARN';
  }

  // Education-first for first-time LOW violations (req 31)
  if (isFirstOffense && severityLevel === 'LOW') {
    return 'NUDGE';
  }

  // Graduated selection based on risk score (req 36, 37)
  if (riskScore >= 0.85) return 'TEMP_BAN';
  if (riskScore >= 0.70) return 'TEMP_SUSPEND';
  if (riskScore >= 0.55) return 'QUARANTINE';
  if (riskScore >= 0.40) return 'FEATURE_LOCK';
  if (riskScore >= 0.25) return 'THROTTLE';
  if (riskScore >= 0.10) return 'WARN';
  return 'NUDGE';
}

// ============================================================================
// EXPIRY CALCULATION (req 39, 41, 44)
// ============================================================================

function computeExpiryISO(action: EnforcementAction, strikeCount = 1): string | null {
  const now = Date.now();
  let durationSeconds: number | null = null;

  switch (action) {
    case 'THROTTLE':
      durationSeconds = DEFAULT_DURATIONS_SECONDS.THROTTLE_MIN;
      break;
    case 'FEATURE_LOCK':
      if (strikeCount >= 3) durationSeconds = DEFAULT_DURATIONS_SECONDS.FEATURE_LOCK_3RD;
      else if (strikeCount === 2) durationSeconds = DEFAULT_DURATIONS_SECONDS.FEATURE_LOCK_2ND;
      else durationSeconds = DEFAULT_DURATIONS_SECONDS.FEATURE_LOCK_1ST;
      break;
    case 'TEMP_SUSPEND':
      durationSeconds = DEFAULT_DURATIONS_SECONDS.TEMP_SUSPEND;
      break;
    case 'TEMP_BAN':
      if (strikeCount >= 3) durationSeconds = DEFAULT_DURATIONS_SECONDS.TEMP_BAN_3;
      else if (strikeCount === 2) durationSeconds = DEFAULT_DURATIONS_SECONDS.TEMP_BAN_2;
      else durationSeconds = DEFAULT_DURATIONS_SECONDS.TEMP_BAN_1;
      break;
    default:
      return null;
  }

  if (durationSeconds === null) return null;
  return new Date(now + durationSeconds * 1000).toISOString();
}

// ============================================================================
// SCOPE SELECTION (req 47, 48) — prefer surface-specific lock over blanket
// ============================================================================

function selectScopes(ruleCode: string, action: EnforcementAction): PolicyScope[] {
  // For blanket actions, restrict all scopes
  if (action === 'TEMP_BAN' || action === 'TEMP_SUSPEND') {
    return ['POSTING', 'MESSAGING', 'LINKING', 'MARKETPLACE', 'TEMPLATE_SHARE'];
  }
  // Map rule codes to affected scopes (req 47 — feature-specific preferred)
  const map: Partial<Record<string, PolicyScope[]>> = {
    C28_SPAM:       ['POSTING', 'MESSAGING'],
    C21_HARASSMENT: ['MESSAGING', 'POSTING'],
    C29_PRIVACY:    ['POSTING'],
    C27_FRAUD:      ['MARKETPLACE'],
    C30_MALWARE:    ['LINKING', 'TEMPLATE_SHARE'],
    C26_ILLEGAL:    ['POSTING', 'LINKING'],
  };
  return map[ruleCode] ?? ['POSTING'];
}

// ============================================================================
// USER-SAFE EXPLANATION BUILDER (req 17, 61–70)
// Must not reveal internal signals or thresholds (req 11, 63)
// ============================================================================

function buildUserExplanation(params: {
  action: EnforcementAction;
  ruleCode: string;
  scopes: PolicyScope[];
  expiry: string | null;
  isSimulation: boolean;
}): BoogieEnforceOutput['user_explanation'] {
  const { action, ruleCode, scopes, expiry } = params;
  const reason = USER_REASON_MESSAGES[ruleCode] ?? 'Your content or activity was flagged by TheBoogieMan.Ai.';

  const actionLabel: Record<EnforcementAction, string> = {
    NUDGE:        'You have received a guidance note.',
    WARN:         'You have received a formal warning.',
    THROTTLE:     'Your activity has been rate-limited temporarily.',
    FEATURE_LOCK: `Access to ${scopes.map(s => RECOVER_STEPS[s as EnforcementScope].split('.')[0]).join(', ')} has been temporarily restricted.`,
    QUARANTINE:   'The flagged content has been hidden pending your review.',
    TEMP_SUSPEND: 'Your account has been set to read-only mode temporarily.',
    TEMP_BAN:     'Your account access has been temporarily suspended.',
    ESCALATE:     'This case has been escalated to the review team.',
  };

  const nextStep = scopes.length > 0
    ? RECOVER_STEPS[scopes[0] as EnforcementScope]
    : 'Review the platform policy at /policy and submit an appeal if you believe this is an error.';

  return {
    what_happened: actionLabel[action],
    why: reason,
    what_changes: scopes.length > 0
      ? `The following areas are affected: ${scopes.join(', ')}.`
      : 'No access changes.',
    what_to_do_next: nextStep,
    policy_version: BOOGIE_POLICY_VERSION,
    rule_code: ruleCode,
    appeal_available: !['NUDGE', 'WARN'].includes(action),
    expiry: expiry,
    scopes_affected: scopes as EnforcementScope[],
    policy_page_url: '/policy',
  };
}

// ============================================================================
// INTERNAL AUDIT EVENT BUILDER (req 18, 19, 20, K91)
// evidence_refs = hashes/IDs only, never raw private content (req 19)
// ============================================================================

function buildAuditEvent(params: {
  userId: string;
  action: EnforcementAction;
  severity: number;
  confidence: number;
  riskScore: number;
  ruleCode: string;
  scopes: PolicyScope[];
  expiry: string | null;
  evidenceRefs: string[];
  priorEventId?: string;
  isSimulation: boolean;
}): BoogieEnforceOutput['audit_event'] {
  return {
    event_id: uuidv4(),
    user_id: params.userId,
    action: params.action,
    severity: params.severity,
    confidence: params.confidence,
    risk_score: params.riskScore,
    rule_code: params.ruleCode,
    policy_version: BOOGIE_POLICY_VERSION,
    scopes_restricted: params.scopes as EnforcementScope[],
    timestamp: new Date().toISOString(),
    expiry: params.expiry,
    evidence_refs: params.evidenceRefs,
    prior_event_id: params.priorEventId ?? null,
    simulation: params.isSimulation,
  };
}

// ============================================================================
// boogieEnforce — main public API (req 16)
// Produces dual output for every content/behavior enforcement decision.
// ============================================================================

export interface BoogieEnforceInput {
  userId: string;
  ruleCode: string;           // must be a code from docs/policy/theboogie.md
  severity: number;           // 0–1
  confidence: number;         // 0–1
  evidenceRefs?: string[];    // hashes or content IDs only (req 19)
  strikeCount?: number;       // number of prior active strikes for this user
  historyMultiplier?: number; // > 1.0 if multiple strikes in rolling 7-day window (req 30)
  priorEventId?: string;
  scopes?: PolicyScope[];     // override scope selection
  blastRadius?: number;       // req 25: number of users potentially affected
}

export function boogieEnforce(input: BoogieEnforceInput): BoogieEnforceOutput {
  const {
    userId,
    ruleCode,
    severity,
    confidence,
    evidenceRefs = [],
    strikeCount = 0,
    historyMultiplier = 1.0,
    priorEventId,
    scopes: scopeOverride,
    blastRadius = 0,
  } = input;

  const simulation = isSimulationMode();

  // Validate rule code is from the published policy (req 2, 92)
  // If unknown, default to least restrictive + escalate (req 4, 5, 99)
  const knownCodes = new Set(Object.values(RULE_CODES));
  const resolvedCode = knownCodes.has(ruleCode) ? ruleCode : RULE_CODES.A3_CONSERVATIVE;
  const escalateForUnknown = !knownCodes.has(ruleCode);

  const severityLevel = mapToStrikeSeverity(severity);
  const riskScore = computeRiskScore(severity, confidence, historyMultiplier);
  const isFirstOffense = strikeCount === 0;
  const isRepeatOffense = strikeCount > 1;

  let action = selectAction({ riskScore, severityLevel, confidence, isFirstOffense, isRepeatOffense });

  // Wide-impact incidents escalate faster (req 25): blast radius ≥ threshold raises to at least QUARANTINE
  if (blastRadius >= BLAST_RADIUS_ESCALATION_THRESHOLD && !CONTAINMENT_ACTIONS.includes(action)) {
    action = 'QUARANTINE';
  }

  // Never issue permanent ban autonomously (req 9, 43)
  // Cap at TEMP_BAN; escalate for human review
  const shouldEscalate =
    escalateForUnknown ||
    severityLevel === 'CRITICAL' ||          // req 71, F50
    confidence < THRESHOLDS.MIN_CONFIDENCE_FOR_BAN || // req 23, G57
    action === 'TEMP_BAN' ||                 // req 80, I80 — always escalate with temp bans
    blastRadius >= BLAST_RADIUS_ESCALATION_THRESHOLD; // req 25 — wide-impact incidents always escalate

  if (shouldEscalate && !['NUDGE', 'WARN'].includes(action)) {
    // Keep the restriction, but also flag for human review (req 73)
    action = action === 'TEMP_BAN' ? 'TEMP_BAN' : action;
  }

  const scopes = scopeOverride ?? selectScopes(resolvedCode, action);
  const expiry = computeExpiryISO(action, strikeCount + 1);

  const userExplanation = buildUserExplanation({
    action,
    ruleCode: resolvedCode,
    scopes: scopes as PolicyScope[],
    expiry,
    isSimulation: simulation,
  });

  const auditEvent = buildAuditEvent({
    userId,
    action,
    severity,
    confidence,
    riskScore,
    ruleCode: resolvedCode,
    scopes: scopes as PolicyScope[],
    expiry,
    evidenceRefs,
    priorEventId,
    isSimulation: simulation,
  });

  // IDARi telemetry summary (req 69) — rate, blast radius, performance notes
  const idariTelemetry = {
    rule_code: resolvedCode,
    action,
    confidence,
    severity,
    blast_radius: blastRadius,
    simulation,
    timestamp: auditEvent.timestamp,
  };

  return {
    user_explanation: userExplanation,
    audit_event: auditEvent,
    action,
    should_escalate: shouldEscalate,
    simulation,
    blast_radius: blastRadius,
    idari_telemetry: idariTelemetry,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function mapToStrikeSeverity(severity: number): StrikeSeverityLevel {
  if (severity >= THRESHOLDS.CRITICAL_SEVERITY) return 'CRITICAL';
  if (severity >= 0.70) return 'HIGH';
  if (severity >= 0.40) return 'MEDIUM';
  return 'LOW';
}

export function getStrikeWeight(level: StrikeSeverityLevel): number {
  return STRIKE_WEIGHTS[level];
}

export function getStrikeExpiryDays(level: StrikeSeverityLevel): number {
  return STRIKE_EXPIRY_DAYS[level];
}

// ============================================================================
// boogieEvaluate — legacy intent-gate (kept for backwards compat)
// Evaluates AI intents against the access-control rules.
// Now includes policy_version in every result (req 3, 4).
// ============================================================================

interface BoogieEvaluateInput {
  actorRole: 'user' | 'admin';
  rateRpm: number;
  intents: Intent[];
}

const ADMIN_ONLY_INTENTS = ['DIAG_SCHEMA_SNAPSHOT', 'DIAG_RLS_SNAPSHOT'];
const HIGH_RISK_INTENTS = ['DREAM_CONFIG_PATCH', 'DREAM_REORDER'];
const WRITE_INTENTS = ['POST_CREATE', 'DREAM_CONFIG_PATCH', 'DREAM_REORDER'];

export function boogieEvaluate(input: BoogieEvaluateInput): BoogieOutput {
  const { actorRole, rateRpm, intents } = input;

  const perIntentResults: BoogieResult[] = [];
  let globalHardBlock = false;
  let cooldownSeconds = 0;

  // Rate limiting check (req C28_SPAM, E38_FRICTION)
  if (rateRpm > THRESHOLDS.HARD_BLOCK_RPM) {
    globalHardBlock = true;
    cooldownSeconds = 60;
  }

  for (const intent of intents) {
    let decision: BoogieResult['decision'] = 'ALLOW';
    let riskScore = 0.1;
    let reasonCode = RULE_CODES.OK;

    // Rule: Unknown intent types → DENY
    if (!intent.type || intent.type.length === 0) {
      decision = 'DENY';
      riskScore = 1.0;
      reasonCode = RULE_CODES.UNKNOWN_INTENT_TYPE;
    }
    // Rule: Admin-only intents for non-admin → DENY (J81_TRIAD_ROLES)
    else if (ADMIN_ONLY_INTENTS.includes(intent.type) && actorRole !== 'admin') {
      decision = 'DENY';
      riskScore = 1.0;
      reasonCode = RULE_CODES.ADMIN_REQUIRED;
    }
    // Rule: High-risk intents → CONFIRM
    else if (HIGH_RISK_INTENTS.includes(intent.type)) {
      decision = 'CONFIRM';
      riskScore = 0.7;
      reasonCode = RULE_CODES.HIGH_RISK;
    }
    // Rule: Write operations + high RPM → CONFIRM
    else if (WRITE_INTENTS.includes(intent.type) && rateRpm > THRESHOLDS.HIGH_RPM_WRITE) {
      decision = 'CONFIRM';
      riskScore = 0.6;
      reasonCode = RULE_CODES.HIGH_RPM_WRITE;
    }
    // Rule: Intent requires confirmation
    else if (intent.requires_confirmation) {
      decision = 'CONFIRM';
      riskScore = 0.5;
      reasonCode = RULE_CODES.USER_CONFIRM;
    }
    // Rule: Low confidence → DENY (G57_LOW_CONFIDENCE)
    else if (intent.confidence < 0.5) {
      decision = 'DENY';
      riskScore = 0.8;
      reasonCode = RULE_CODES.LOW_CONFIDENCE;
    }

    perIntentResults.push({
      intent_id: intent.intent_id,
      decision,
      risk_score: riskScore,
      reason_code: reasonCode,
      policy_version: BOOGIE_POLICY_VERSION,
    });
  }

  return {
    global: {
      hard_block: globalHardBlock,
      cooldown_seconds: globalHardBlock ? cooldownSeconds : undefined,
    },
    per_intent: perIntentResults,
    policy_version: BOOGIE_POLICY_VERSION,
  };
}

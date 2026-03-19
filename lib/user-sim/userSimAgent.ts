// lib/user-sim/userSimAgent.ts
// User Sim AI — simulates real user personas navigating the DREAMengin product.
//
// The agent has four systems:
//   1. Persona Brain   — models how different people think and behave
//   2. Perception      — reads a PerceptionFrame (screenshot + DOM signals)
//   3. Behaviour Policy — picks the next AgentAction from signals + persona
//   4. Audit Judge     — writes AuditFinding entries after each step / journey
//
// Persona-driven behaviour includes intentional randomness (e.g. distracted multitasker
// pausing unpredictably) — mock Math.random in tests when you need reproducibility.
// No network calls, no DB access.

import { v4 as uuidv4 } from 'uuid';
import type {
  Persona,
  PersonaType,
  PerceptionFrame,
  BehaviorSignals,
  AgentAction,
  AuditFinding,
  FindingSeverity,
  SimStep,
  SimJourneyResult,
  JourneyOutcome,
} from '@/types/user-sim';

// ============================================================================
// 1. PERSONA BRAIN
// ============================================================================

/** Canonical registry of all supported personas. */
export const PERSONAS: Record<PersonaType, Persona> = {
  impatient_first_time_user: {
    type: 'impatient_first_time_user',
    label: 'Impatient First-Time User',
    goal: 'Complete sign-up and see the home feed as fast as possible',
    patience: 0.1,
    attention: 0.3,
    trust_threshold: 0.4,
    accessibility_priority: false,
    distracted: false,
  },
  skeptical_buyer: {
    type: 'skeptical_buyer',
    label: 'Skeptical Buyer',
    goal: 'Evaluate pricing, reviews, and refund policy before purchasing',
    patience: 0.6,
    attention: 0.8,
    trust_threshold: 0.85,
    accessibility_priority: false,
    distracted: false,
  },
  confused_older_user: {
    type: 'confused_older_user',
    label: 'Confused Older User',
    goal: 'Find and read recent posts from followed accounts',
    patience: 0.5,
    attention: 0.6,
    trust_threshold: 0.7,
    accessibility_priority: true,
    distracted: false,
  },
  power_user: {
    type: 'power_user',
    label: 'Power User',
    goal: 'Configure advanced settings and customise the dashboard',
    patience: 0.9,
    attention: 0.95,
    trust_threshold: 0.3,
    accessibility_priority: false,
    distracted: false,
  },
  distracted_multitasker: {
    type: 'distracted_multitasker',
    label: 'Distracted Multitasker',
    goal: 'Quickly share a link and return to other work',
    patience: 0.3,
    attention: 0.25,
    trust_threshold: 0.35,
    accessibility_priority: false,
    distracted: true,
  },
  accessibility_sensitive_user: {
    type: 'accessibility_sensitive_user',
    label: 'Accessibility-Sensitive User',
    goal: 'Navigate the platform using keyboard-only or screen reader',
    patience: 0.7,
    attention: 0.85,
    trust_threshold: 0.6,
    accessibility_priority: true,
    distracted: false,
  },
  trust_seeking_user: {
    type: 'trust_seeking_user',
    label: 'Trust-Seeking User',
    goal: 'Verify platform safety and privacy policy before creating an account',
    patience: 0.65,
    attention: 0.9,
    trust_threshold: 0.9,
    accessibility_priority: false,
    distracted: false,
  },
  goal_driven_returning_user: {
    type: 'goal_driven_returning_user',
    label: 'Goal-Driven Returning User',
    goal: 'Pick up a saved draft and publish it',
    patience: 0.75,
    attention: 0.7,
    trust_threshold: 0.4,
    accessibility_priority: false,
    distracted: false,
  },
  comparison_shopper: {
    type: 'comparison_shopper',
    label: 'Comparison Shopper',
    goal: 'Compare two subscription tiers side-by-side before deciding',
    patience: 0.7,
    attention: 0.85,
    trust_threshold: 0.75,
    accessibility_priority: false,
    distracted: false,
  },
  frustrated_user_after_failure: {
    type: 'frustrated_user_after_failure',
    label: 'Frustrated User After One Failure',
    goal: 'Retry the last failed action and complete the journey',
    patience: 0.15,
    attention: 0.5,
    trust_threshold: 0.55,
    accessibility_priority: false,
    distracted: false,
  },
};

// ============================================================================
// 2. PERCEPTION — derive BehaviorSignals from a PerceptionFrame
// ============================================================================

/** Minimum recommended tap-target size in CSS pixels (WCAG 2.5.5). */
const MIN_TAP_TARGET_PX = 44;

/**
 * Analyse a PerceptionFrame and return quantified BehaviorSignals.
 * All calculations are deterministic so they can be unit-tested.
 */
export function perceive(frame: PerceptionFrame): BehaviorSignals {
  const elements = frame.visible_elements;
  const total = elements.length;

  // ── friction ────────────────────────────────────────────────────────────────
  // Elevated by: no CTAs, small tap-targets, missing labels.
  const ctaCount = elements.filter((e) => e.is_cta).length;
  const smallTargets = elements.filter(
    (e) => e.tap_target_px !== null && e.tap_target_px < MIN_TAP_TARGET_PX,
  ).length;
  const unlabelledInteractive = elements.filter(
    (e) => (e.tag === 'button' || e.tag === 'a' || e.tag === 'input') && !e.label,
  ).length;

  const frictionFactors = [
    ctaCount === 0 ? 0.4 : 0,
    total > 0 ? (smallTargets / total) * 0.3 : 0,
    total > 0 ? (unlabelledInteractive / total) * 0.3 : 0,
  ];
  const friction = clamp01(frictionFactors.reduce((a, b) => a + b, 0));

  // ── confusion ───────────────────────────────────────────────────────────────
  // Elevated by: multiple competing CTAs (> 3), very high element density.
  const competingCtas = Math.max(0, ctaCount - 3);
  const densityFactor = total > 30 ? 0.3 : total > 15 ? 0.15 : 0;
  const confusion = clamp01(competingCtas * 0.1 + densityFactor);

  // ── layout clarity ──────────────────────────────────────────────────────────
  // Inverse of confusion plus a bonus for labelled CTAs.
  const labelledCtas = elements.filter((e) => e.is_cta && e.label).length;
  const clarityBonus = ctaCount > 0 ? (labelledCtas / ctaCount) * 0.4 : 0;
  const layout_clarity = clamp01(1 - confusion + clarityBonus - friction * 0.3);

  // ── trust signals ───────────────────────────────────────────────────────────
  // Proxy: HTTPS in URL + presence of terms/privacy/security text in element labels.
  const httpsPresent = frame.url.startsWith('https://') ? 0.4 : 0;
  const trustKeywords = ['privacy', 'secure', 'verified', 'trusted', 'policy'];
  const trustHits = elements.filter((e) =>
    trustKeywords.some((kw) => (e.label ?? '').toLowerCase().includes(kw)),
  ).length;
  const trust_signals = clamp01(httpsPresent + Math.min(trustHits * 0.15, 0.6));

  // ── mobile reachability ─────────────────────────────────────────────────────
  // Simplistic model: if viewport width ≤ 480 (mobile), check whether CTAs
  // are in the bottom 40% of the viewport (thumb zone).  Without positional
  // data we use tap-target size as a proxy.
  const isMobile = frame.viewport.width <= 480;
  const reachableCtas = elements.filter(
    (e) => e.is_cta && e.tap_target_px !== null && e.tap_target_px >= MIN_TAP_TARGET_PX,
  ).length;
  const mobile_reachability = isMobile
    ? ctaCount > 0
      ? clamp01(reachableCtas / ctaCount)
      : 0.5
    : 1.0;

  // ── broken / misleading heuristics ─────────────────────────────────────────
  const brokenKeywords = ['error', '404', '500', 'loading…', 'undefined'];
  const misleadingKeywords = ['free*', 'limited offer', 'act now', 'you must'];
  const ui_appears_broken = elements.some((e) =>
    brokenKeywords.some((kw) => (e.label ?? '').toLowerCase().includes(kw)),
  );
  const ui_appears_misleading = elements.some((e) =>
    misleadingKeywords.some((kw) => (e.label ?? '').toLowerCase().includes(kw)),
  );

  return {
    friction,
    confusion,
    layout_clarity,
    trust_signals,
    mobile_reachability,
    ui_appears_broken,
    ui_appears_misleading,
  };
}

// ============================================================================
// 3. BEHAVIOUR POLICY — choose the next AgentAction
// ============================================================================

/**
 * Decide what the agent should do next given the persona and current signals.
 *
 * Priority order:
 *   1. Abandon if patience is exhausted by friction.
 *   2. Abandon if UI appears broken and persona has low patience.
 *   3. Inspect when confusion is high and persona pays attention.
 *   4. Click the primary CTA when layout is clear.
 *   5. Scroll to look for CTA when none is visible.
 *   6. Wait when distracted.
 *   7. Default: click first available interactive element.
 */
export function decideAction(
  persona: Persona,
  signals: BehaviorSignals,
  frame: PerceptionFrame,
): AgentAction {
  // 1. Abandon — patience exhausted by friction
  if (signals.friction > 1 - persona.patience) {
    return {
      type: 'abandon',
      rationale: `Friction (${signals.friction.toFixed(2)}) exceeded patience threshold (${(1 - persona.patience).toFixed(2)}) for persona "${persona.label}".`,
    };
  }

  // 2. Abandon — broken UI with low-patience persona
  if (signals.ui_appears_broken && persona.patience < 0.4) {
    return {
      type: 'abandon',
      rationale: `UI appears broken and persona "${persona.label}" has low patience (${persona.patience}).`,
    };
  }

  // 3. Inspect — high confusion + attentive persona
  if (signals.confusion > 0.5 && persona.attention > 0.6) {
    return {
      type: 'inspect',
      rationale: `High confusion (${signals.confusion.toFixed(2)}) detected; attentive persona "${persona.label}" inspects the page before acting.`,
    };
  }

  // 4. Click primary CTA when layout is clear
  const primaryCta = frame.visible_elements.find((e) => e.is_cta && e.label);
  if (primaryCta && signals.layout_clarity > 0.5) {
    return {
      type: 'click',
      target: primaryCta.id,
      rationale: `Layout is clear (${signals.layout_clarity.toFixed(2)}); clicking primary CTA "${primaryCta.label}".`,
    };
  }

  // 5. Scroll to search for CTA
  if (!primaryCta) {
    return {
      type: 'scroll',
      rationale: `No primary CTA visible; scrolling to locate next action.`,
    };
  }

  // 6. Distracted persona randomly pauses (30 % chance) — realistic multi-tasker behaviour
  if (persona.distracted && Math.random() < 0.3) {
    return {
      type: 'wait',
      rationale: `Distracted persona "${persona.label}" pauses before continuing.`,
    };
  }

  // 7. Click first available interactive element
  const interactive = frame.visible_elements.find(
    (e) => e.tag === 'button' || e.tag === 'a' || e.tag === 'input',
  );
  if (interactive) {
    return {
      type: 'click',
      target: interactive.id,
      rationale: `Clicking first available interactive element "${interactive.id}".`,
    };
  }

  // Fallback
  return {
    type: 'wait',
    rationale: 'No actionable element found; waiting for page to load.',
  };
}

// ============================================================================
// 4. AUDIT JUDGE — issue findings after each step and for the journey summary
// ============================================================================

/** Spec rules that the audit judge checks against. */
export const SPEC_RULES = {
  CTA_VISIBLE: 'Every screen must have at least one clearly labelled primary CTA.',
  TAP_TARGET_SIZE: `All interactive elements must meet the minimum tap-target size of ${MIN_TAP_TARGET_PX}px (WCAG 2.5.5).`,
  ELEMENT_LABELS: 'All interactive elements (buttons, inputs, links) must have visible or accessible labels.',
  TRUST_SIGNALS: 'Checkout and sign-up flows must display trust signals (HTTPS, privacy notice, brand mark).',
  MOBILE_REACHABILITY: 'Primary CTAs must be reachable with one thumb on mobile viewports (≤ 480 px wide).',
  NO_BROKEN_UI: 'No error states, spinners, or undefined values should be visible to the user.',
  NO_DARK_PATTERNS: 'Copy must be honest; dark patterns (false urgency, hidden costs) are prohibited.',
  ACCESSIBLE_FOCUS: 'All interactive elements must be keyboard-focusable with a visible focus ring.',
  LAYOUT_CLARITY: 'The primary action path must be unambiguous; competing CTAs must be visually differentiated.',
  CONFUSION_LIMIT: 'Pages should not present more than 3 competing calls-to-action at the same level.',
} as const;

export type SpecRuleKey = keyof typeof SPEC_RULES;

/**
 * Analyse the current step and emit zero or more AuditFinding objects.
 * Each finding includes the violated spec rule, severity, confidence, and a fix.
 */
export function judgeStep(
  step: number,
  persona: Persona,
  signals: BehaviorSignals,
  frame: PerceptionFrame,
): AuditFinding[] {
  const findings: AuditFinding[] = [];

  const push = (
    issue: string,
    evidence: string,
    ruleKey: SpecRuleKey,
    severity: FindingSeverity,
    confidence: number,
    fix: string,
  ) => {
    findings.push({
      finding_id: uuidv4(),
      step,
      persona: persona.type,
      issue,
      evidence,
      violated_spec_rule: SPEC_RULES[ruleKey],
      severity,
      confidence: clamp01(confidence),
      top_class_fix: fix,
    });
  };

  // ── No primary CTA ──────────────────────────────────────────────────────────
  const ctaCount = frame.visible_elements.filter((e) => e.is_cta).length;
  if (ctaCount === 0) {
    push(
      'No primary CTA visible on screen',
      `Step ${step}: visible_elements contains ${frame.visible_elements.length} element(s), none marked is_cta=true.`,
      'CTA_VISIBLE',
      'high',
      0.9,
      'Add a clearly labelled button with is_cta=true that advances the user toward their goal.',
    );
  }

  // ── Small tap targets ───────────────────────────────────────────────────────
  const smallTargets = frame.visible_elements.filter(
    (e) => e.tap_target_px !== null && e.tap_target_px < MIN_TAP_TARGET_PX,
  );
  if (smallTargets.length > 0) {
    push(
      `${smallTargets.length} interactive element(s) below minimum tap-target size`,
      `Elements: ${smallTargets.map((e) => `${e.id} (${e.tap_target_px}px)`).join(', ')}.`,
      'TAP_TARGET_SIZE',
      smallTargets.length > 2 ? 'high' : 'medium',
      0.95,
      `Increase the tap-target area to ≥ ${MIN_TAP_TARGET_PX}px using padding or min-height/min-width.`,
    );
  }

  // ── Unlabelled interactive elements ────────────────────────────────────────
  const unlabelled = frame.visible_elements.filter(
    (e) =>
      (e.tag === 'button' || e.tag === 'a' || e.tag === 'input') &&
      !e.label,
  );
  if (unlabelled.length > 0) {
    const sev: FindingSeverity = persona.accessibility_priority ? 'critical' : 'medium';
    push(
      `${unlabelled.length} interactive element(s) missing accessible label`,
      `Elements: ${unlabelled.map((e) => e.id).join(', ')}.`,
      'ELEMENT_LABELS',
      sev,
      0.9,
      'Add aria-label, aria-labelledby, or visible text content to every interactive element.',
    );
  }

  // ── Low trust signals for trust-sensitive persona ───────────────────────────
  if (signals.trust_signals < persona.trust_threshold) {
    push(
      'Insufficient trust signals for this persona',
      `Trust signal score ${signals.trust_signals.toFixed(2)} is below persona threshold ${persona.trust_threshold.toFixed(2)}.`,
      'TRUST_SIGNALS',
      signals.trust_signals < 0.3 ? 'high' : 'medium',
      0.75,
      'Add security badge, privacy-policy link, HTTPS lock icon, or customer count near CTAs.',
    );
  }

  // ── Mobile reachability ─────────────────────────────────────────────────────
  if (frame.viewport.width <= 480 && signals.mobile_reachability < 0.6) {
    push(
      'Primary CTA not easily reachable on mobile',
      `Viewport width: ${frame.viewport.width}px. Mobile reachability score: ${signals.mobile_reachability.toFixed(2)}.`,
      'MOBILE_REACHABILITY',
      'high',
      0.8,
      'Move primary CTAs to the bottom thumb zone (last 40% of viewport height) and ensure tap-targets ≥ 44px.',
    );
  }

  // ── Broken UI ───────────────────────────────────────────────────────────────
  if (signals.ui_appears_broken) {
    push(
      'UI appears broken or contains unresolved error state',
      'An element label contains a known error keyword (error / 404 / 500 / loading… / undefined).',
      'NO_BROKEN_UI',
      'critical',
      0.85,
      'Implement graceful error boundaries with user-friendly copy and a recovery action.',
    );
  }

  // ── Dark patterns ───────────────────────────────────────────────────────────
  if (signals.ui_appears_misleading) {
    push(
      'Potentially misleading copy detected',
      'An element label matches a known dark-pattern keyword.',
      'NO_DARK_PATTERNS',
      'high',
      0.7,
      'Replace urgency/manipulation copy with honest, factual language that respects the user.',
    );
  }

  // ── High confusion ──────────────────────────────────────────────────────────
  if (signals.confusion > 0.5) {
    push(
      'Page presents too many competing calls-to-action',
      `CTA count: ${ctaCount}. Confusion score: ${signals.confusion.toFixed(2)}.`,
      'CONFUSION_LIMIT',
      'medium',
      0.8,
      'Reduce visible CTAs to ≤ 3 per screen; use visual hierarchy (size, colour, weight) to differentiate them.',
    );
  }

  // ── Accessibility focus (accessibility-sensitive persona only) ─────────────
  if (persona.accessibility_priority) {
    const nonFocusable = frame.visible_elements.filter(
      (e) =>
        (e.tag === 'button' || e.tag === 'a' || e.tag === 'input') &&
        !e.focusable,
    );
    if (nonFocusable.length > 0) {
      push(
        `${nonFocusable.length} interactive element(s) not keyboard-focusable`,
        `Elements: ${nonFocusable.map((e) => e.id).join(', ')}.`,
        'ACCESSIBLE_FOCUS',
        'critical',
        0.9,
        'Ensure all interactive elements are in the tab order (tabindex ≥ 0) and display a visible :focus-visible ring.',
      );
    }
  }

  return findings;
}

// ============================================================================
// JOURNEY RUNNER — orchestrates perception → policy → audit for a sequence
// ============================================================================

export interface JourneyRunnerInput {
  journey_id?: string;
  persona_type: PersonaType;
  frames: PerceptionFrame[];
}

/**
 * Run a complete simulated user journey over a sequence of PerceptionFrames.
 *
 * The caller is responsible for providing frames (typically from a headless
 * browser or mock).  The runner drives the agent through each frame in order,
 * stops early on `abandon`, and returns the full SimJourneyResult.
 */
export function runJourney(input: JourneyRunnerInput): SimJourneyResult {
  const { frames, persona_type } = input;
  const journey_id = input.journey_id ?? uuidv4();
  const persona = PERSONAS[persona_type];
  const started_at = new Date().toISOString();

  const steps: SimStep[] = [];
  const allFindings: AuditFinding[] = [];
  let outcome: JourneyOutcome = 'completed';

  for (const frame of frames) {
    const signals = perceive(frame);
    const action = decideAction(persona, signals, frame);
    const findings = judgeStep(frame.step, persona, signals, frame);

    steps.push({ step: frame.step, persona: persona_type, perception: frame, signals, action, findings });
    allFindings.push(...findings);

    if (action.type === 'abandon') {
      outcome = 'abandoned';
      break;
    }
  }

  // Journey-level summary findings (end-of-journey judge pass)
  const summaryFindings = judgeJourney(persona, steps, allFindings);
  allFindings.push(...summaryFindings);

  const frictionValues = steps.map((s) => s.signals.friction);
  const confusionValues = steps.map((s) => s.signals.confusion);
  const avgFriction = frictionValues.length
    ? frictionValues.reduce((a, b) => a + b, 0) / frictionValues.length
    : 0;
  const avgConfusion = confusionValues.length
    ? confusionValues.reduce((a, b) => a + b, 0) / confusionValues.length
    : 0;

  const findingsBySeverity = countBySeverity(allFindings);

  return {
    journey_id,
    persona: persona_type,
    goal: persona.goal,
    outcome,
    steps,
    all_findings: allFindings,
    stats: {
      total_steps: steps.length,
      total_findings: allFindings.length,
      findings_by_severity: findingsBySeverity,
      avg_friction: clamp01(avgFriction),
      avg_confusion: clamp01(avgConfusion),
    },
    started_at,
    completed_at: new Date().toISOString(),
  };
}

// ============================================================================
// JOURNEY-LEVEL AUDIT JUDGE
// ============================================================================

/**
 * Produce end-of-journey findings that span multiple steps.
 * These are separate from per-step findings and catch systemic issues.
 */
export function judgeJourney(
  persona: Persona,
  steps: SimStep[],
  stepFindings: AuditFinding[],
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const stepCount = steps.length;

  // Recurring friction pattern — same issue type in ≥ 50% of steps
  const recurringIssues = findRecurringIssues(stepFindings, stepCount);
  for (const issue of recurringIssues) {
    findings.push({
      finding_id: uuidv4(),
      step: -1, // journey-level, not step-specific
      persona: persona.type,
      issue: `Recurring issue across ${issue.count}/${stepCount} steps: ${issue.issue}`,
      evidence: `First seen at step ${issue.firstStep}. Pattern suggests a systemic design problem rather than a one-off.`,
      violated_spec_rule: issue.violated_spec_rule,
      severity: 'high',
      confidence: 0.85,
      top_class_fix: `Apply a platform-wide fix for "${issue.issue}" — this affects every screen.`,
    });
  }

  // Journey abandonment
  const lastStep = steps[steps.length - 1];
  if (lastStep?.action.type === 'abandon') {
    findings.push({
      finding_id: uuidv4(),
      step: -1,
      persona: persona.type,
      issue: `Persona "${persona.label}" abandoned the journey before completing their goal`,
      evidence: `Goal: "${persona.goal}". Abandon reason: ${lastStep.action.rationale}`,
      violated_spec_rule: SPEC_RULES.CTA_VISIBLE,
      severity: 'critical',
      confidence: 0.9,
      top_class_fix:
        'Reduce friction to below the persona patience threshold by simplifying the flow and improving CTA visibility.',
    });
  }

  return findings;
}

// ============================================================================
// HELPERS
// ============================================================================

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function countBySeverity(
  findings: AuditFinding[],
): Record<FindingSeverity, number> {
  const counts: Record<FindingSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const f of findings) {
    counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  }
  return counts;
}

interface RecurringIssue {
  issue: string;
  violated_spec_rule: string;
  count: number;
  firstStep: number;
}

function findRecurringIssues(
  findings: AuditFinding[],
  stepCount: number,
): RecurringIssue[] {
  if (stepCount === 0) return [];

  // Group by violated_spec_rule
  const groups = new Map<string, { findings: AuditFinding[]; rule: string }>();
  for (const f of findings) {
    if (f.step < 0) continue; // skip journey-level findings
    const key = f.violated_spec_rule;
    if (!groups.has(key)) groups.set(key, { findings: [], rule: key });
    groups.get(key)!.findings.push(f);
  }

  const recurring: RecurringIssue[] = [];
  for (const [, group] of groups) {
    const uniqueSteps = new Set(group.findings.map((f) => f.step));
    if (uniqueSteps.size >= Math.ceil(stepCount * 0.5)) {
      const first = group.findings.reduce(
        (min, f) => (f.step < min ? f.step : min),
        Infinity,
      );
      recurring.push({
        issue: group.findings[0].issue,
        violated_spec_rule: group.rule,
        count: uniqueSteps.size,
        firstStep: first,
      });
    }
  }

  return recurring;
}

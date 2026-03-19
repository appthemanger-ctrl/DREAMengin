// tests/user-sim.test.ts
//
// Unit tests for lib/user-sim/userSimAgent.ts
//
// Coverage:
//   PERSONAS registry        — all 10 personas present and valid
//   perceive()               — BehaviorSignals derived from PerceptionFrame
//   decideAction()           — policy picks correct AgentAction
//   judgeStep()              — AuditFinding emitted for each spec violation
//   judgeJourney()           — journey-level findings (recurring + abandon)
//   runJourney()             — end-to-end journey orchestration
//   SPEC_RULES               — all 10 rules present

import { describe, it, expect, vi, afterEach } from 'vitest';
import type { PerceptionFrame, VisibleElement } from '@/types/user-sim';
import {
  PERSONAS,
  SPEC_RULES,
  perceive,
  decideAction,
  judgeStep,
  judgeJourney,
  runJourney,
} from '@/lib/user-sim/userSimAgent';

// ── Fixture helpers ───────────────────────────────────────────────────────────

let _stepCounter = 0;

function makeElement(overrides: Partial<VisibleElement> = {}): VisibleElement {
  return {
    id: `el-${_stepCounter++}`,
    tag: 'button',
    label: 'Continue',
    is_cta: true,
    focusable: true,
    tap_target_px: 48,
    ...overrides,
  };
}

function makeFrame(overrides: Partial<PerceptionFrame> = {}): PerceptionFrame {
  return {
    step: _stepCounter++,
    page_title: 'DREAMengin Home',
    url: 'https://dreamengin.com/',
    viewport: { width: 390, height: 844 },
    visible_elements: [makeElement()],
    screenshot_b64: '',
    recent_actions: [],
    ...overrides,
  };
}

afterEach(() => {
  _stepCounter = 0;
  vi.restoreAllMocks();
});

// ============================================================================
// PERSONAS REGISTRY
// ============================================================================

describe('PERSONAS registry', () => {
  const EXPECTED_TYPES = [
    'impatient_first_time_user',
    'skeptical_buyer',
    'confused_older_user',
    'power_user',
    'distracted_multitasker',
    'accessibility_sensitive_user',
    'trust_seeking_user',
    'goal_driven_returning_user',
    'comparison_shopper',
    'frustrated_user_after_failure',
  ] as const;

  it('contains exactly 10 personas', () => {
    expect(Object.keys(PERSONAS)).toHaveLength(10);
  });

  it.each(EXPECTED_TYPES)('"%s" persona is present', (type) => {
    expect(PERSONAS[type]).toBeDefined();
    expect(PERSONAS[type].type).toBe(type);
  });

  it('every persona has a non-empty label and goal', () => {
    for (const p of Object.values(PERSONAS)) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.goal.length).toBeGreaterThan(0);
    }
  });

  it('every persona has patience, attention, trust_threshold in [0,1]', () => {
    for (const p of Object.values(PERSONAS)) {
      expect(p.patience).toBeGreaterThanOrEqual(0);
      expect(p.patience).toBeLessThanOrEqual(1);
      expect(p.attention).toBeGreaterThanOrEqual(0);
      expect(p.attention).toBeLessThanOrEqual(1);
      expect(p.trust_threshold).toBeGreaterThanOrEqual(0);
      expect(p.trust_threshold).toBeLessThanOrEqual(1);
    }
  });

  it('accessibility_sensitive_user has accessibility_priority=true', () => {
    expect(PERSONAS.accessibility_sensitive_user.accessibility_priority).toBe(true);
  });

  it('confused_older_user has accessibility_priority=true', () => {
    expect(PERSONAS.confused_older_user.accessibility_priority).toBe(true);
  });

  it('distracted_multitasker has distracted=true', () => {
    expect(PERSONAS.distracted_multitasker.distracted).toBe(true);
  });

  it('impatient_first_time_user has lowest patience', () => {
    const patience = Object.values(PERSONAS).map((p) => p.patience);
    expect(PERSONAS.impatient_first_time_user.patience).toBe(Math.min(...patience));
  });
});

// ============================================================================
// SPEC_RULES
// ============================================================================

describe('SPEC_RULES', () => {
  const EXPECTED_KEYS = [
    'CTA_VISIBLE',
    'TAP_TARGET_SIZE',
    'ELEMENT_LABELS',
    'TRUST_SIGNALS',
    'MOBILE_REACHABILITY',
    'NO_BROKEN_UI',
    'NO_DARK_PATTERNS',
    'ACCESSIBLE_FOCUS',
    'LAYOUT_CLARITY',
    'CONFUSION_LIMIT',
  ] as const;

  it('contains exactly 10 rules', () => {
    expect(Object.keys(SPEC_RULES)).toHaveLength(10);
  });

  it.each(EXPECTED_KEYS)('rule "%s" is present and non-empty', (key) => {
    expect(SPEC_RULES[key]).toBeTruthy();
    expect(SPEC_RULES[key].length).toBeGreaterThan(10);
  });
});

// ============================================================================
// perceive() — BehaviorSignals
// ============================================================================

describe('perceive()', () => {
  it('returns all required signal fields', () => {
    const signals = perceive(makeFrame());
    expect(signals).toHaveProperty('friction');
    expect(signals).toHaveProperty('confusion');
    expect(signals).toHaveProperty('layout_clarity');
    expect(signals).toHaveProperty('trust_signals');
    expect(signals).toHaveProperty('mobile_reachability');
    expect(signals).toHaveProperty('ui_appears_broken');
    expect(signals).toHaveProperty('ui_appears_misleading');
  });

  it('all numeric signals are in [0,1]', () => {
    const signals = perceive(makeFrame());
    for (const key of ['friction', 'confusion', 'layout_clarity', 'trust_signals', 'mobile_reachability'] as const) {
      expect(signals[key]).toBeGreaterThanOrEqual(0);
      expect(signals[key]).toBeLessThanOrEqual(1);
    }
  });

  it('produces high friction when there is no CTA', () => {
    const frame = makeFrame({ visible_elements: [makeElement({ is_cta: false })] });
    const signals = perceive(frame);
    expect(signals.friction).toBeGreaterThan(0.3);
  });

  it('produces zero friction for a clean frame with one labelled CTA', () => {
    const frame = makeFrame({
      visible_elements: [makeElement({ is_cta: true, label: 'Continue', tap_target_px: 48 })],
    });
    const signals = perceive(frame);
    expect(signals.friction).toBe(0);
  });

  it('detects broken UI from error keyword in element label', () => {
    const frame = makeFrame({
      visible_elements: [makeElement({ label: '404 Not Found' })],
    });
    const signals = perceive(frame);
    expect(signals.ui_appears_broken).toBe(true);
  });

  it('detects misleading copy from dark-pattern keyword', () => {
    const frame = makeFrame({
      visible_elements: [makeElement({ label: 'Limited Offer — Act Now' })],
    });
    const signals = perceive(frame);
    expect(signals.ui_appears_misleading).toBe(true);
  });

  it('trust_signals includes bonus for HTTPS URL', () => {
    const httpsFrame = makeFrame({ url: 'https://dreamengin.com/' });
    const httpFrame = makeFrame({ url: 'http://dreamengin.com/' });
    const https = perceive(httpsFrame);
    const http = perceive(httpFrame);
    expect(https.trust_signals).toBeGreaterThan(http.trust_signals);
  });

  it('elevated trust_signals when privacy keyword appears in element label', () => {
    const frame = makeFrame({
      visible_elements: [makeElement({ label: 'Privacy Policy' })],
    });
    const signals = perceive(frame);
    expect(signals.trust_signals).toBeGreaterThan(0.4);
  });

  it('mobile_reachability is 1.0 on desktop viewport', () => {
    const frame = makeFrame({ viewport: { width: 1440, height: 900 } });
    const signals = perceive(frame);
    expect(signals.mobile_reachability).toBe(1.0);
  });

  it('mobile_reachability is lower when CTA tap-targets are small on mobile', () => {
    const frame = makeFrame({
      viewport: { width: 375, height: 812 },
      visible_elements: [makeElement({ is_cta: true, tap_target_px: 20 })],
    });
    const signals = perceive(frame);
    expect(signals.mobile_reachability).toBeLessThan(1);
  });

  it('confusion is elevated when there are 5+ competing CTAs', () => {
    const ctas = Array.from({ length: 6 }, () => makeElement({ is_cta: true }));
    const frame = makeFrame({ visible_elements: ctas });
    const signals = perceive(frame);
    expect(signals.confusion).toBeGreaterThan(0.1);
  });

  it('small tap-target elements raise friction', () => {
    const els = [
      makeElement({ is_cta: true, tap_target_px: 20 }),
      makeElement({ is_cta: false, tap_target_px: 20 }),
    ];
    const frame = makeFrame({ visible_elements: els });
    const signals = perceive(frame);
    expect(signals.friction).toBeGreaterThan(0);
  });
});

// ============================================================================
// decideAction() — Behaviour Policy
// ============================================================================

describe('decideAction()', () => {
  it('abandons when friction exceeds patience threshold', () => {
    const persona = PERSONAS.impatient_first_time_user; // patience=0.1
    const signals = {
      friction: 0.95,
      confusion: 0.0,
      layout_clarity: 0.5,
      trust_signals: 0.6,
      mobile_reachability: 1.0,
      ui_appears_broken: false,
      ui_appears_misleading: false,
    };
    const action = decideAction(persona, signals, makeFrame());
    expect(action.type).toBe('abandon');
  });

  it('abandons broken UI for low-patience persona', () => {
    const persona = PERSONAS.frustrated_user_after_failure; // patience=0.15
    const signals = {
      friction: 0.0,
      confusion: 0.0,
      layout_clarity: 0.8,
      trust_signals: 0.7,
      mobile_reachability: 1.0,
      ui_appears_broken: true,
      ui_appears_misleading: false,
    };
    const action = decideAction(persona, signals, makeFrame());
    expect(action.type).toBe('abandon');
  });

  it('does NOT abandon broken UI for high-patience persona', () => {
    const persona = PERSONAS.power_user; // patience=0.9
    const signals = {
      friction: 0.0,
      confusion: 0.0,
      layout_clarity: 0.8,
      trust_signals: 0.7,
      mobile_reachability: 1.0,
      ui_appears_broken: true,
      ui_appears_misleading: false,
    };
    const action = decideAction(persona, signals, makeFrame());
    expect(action.type).not.toBe('abandon');
  });

  it('returns inspect when confusion is high and persona is attentive', () => {
    const persona = PERSONAS.power_user; // attention=0.95
    const signals = {
      friction: 0.0,
      confusion: 0.7,
      layout_clarity: 0.3,
      trust_signals: 0.7,
      mobile_reachability: 1.0,
      ui_appears_broken: false,
      ui_appears_misleading: false,
    };
    const action = decideAction(persona, signals, makeFrame());
    expect(action.type).toBe('inspect');
  });

  it('clicks the primary CTA when layout is clear', () => {
    const persona = PERSONAS.goal_driven_returning_user;
    const signals = {
      friction: 0.1,
      confusion: 0.0,
      layout_clarity: 0.8,
      trust_signals: 0.7,
      mobile_reachability: 1.0,
      ui_appears_broken: false,
      ui_appears_misleading: false,
    };
    const frame = makeFrame({
      visible_elements: [makeElement({ id: 'btn-publish', is_cta: true, label: 'Publish' })],
    });
    const action = decideAction(persona, signals, frame);
    expect(action.type).toBe('click');
    expect(action.target).toBe('btn-publish');
  });

  it('scrolls when no primary CTA is visible', () => {
    const persona = PERSONAS.goal_driven_returning_user;
    const signals = {
      friction: 0.0,
      confusion: 0.0,
      layout_clarity: 0.8,
      trust_signals: 0.7,
      mobile_reachability: 1.0,
      ui_appears_broken: false,
      ui_appears_misleading: false,
    };
    const frame = makeFrame({
      visible_elements: [makeElement({ is_cta: false, tag: 'p' })],
    });
    const action = decideAction(persona, signals, frame);
    expect(action.type).toBe('scroll');
  });

  it('every action has a non-empty rationale', () => {
    const persona = PERSONAS.skeptical_buyer;
    const signals = perceive(makeFrame());
    const action = decideAction(persona, signals, makeFrame());
    expect(action.rationale.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// judgeStep() — Audit Judge (per-step)
// ============================================================================

describe('judgeStep()', () => {
  it('emits no findings for a clean frame', () => {
    const persona = PERSONAS.power_user;
    const frame = makeFrame({
      url: 'https://dreamengin.com/',
      visible_elements: [
        makeElement({ id: 'btn', is_cta: true, label: 'Continue', focusable: true, tap_target_px: 48 }),
      ],
    });
    const signals = perceive(frame);
    const findings = judgeStep(0, persona, signals, frame);
    expect(findings).toHaveLength(0);
  });

  it('flags missing CTA as high severity', () => {
    const persona = PERSONAS.impatient_first_time_user;
    const frame = makeFrame({
      visible_elements: [makeElement({ is_cta: false })],
    });
    const signals = perceive(frame);
    const findings = judgeStep(0, persona, signals, frame);
    const ctaFinding = findings.find((f) => f.violated_spec_rule === SPEC_RULES.CTA_VISIBLE);
    expect(ctaFinding).toBeDefined();
    expect(ctaFinding!.severity).toBe('high');
  });

  it('flags small tap targets', () => {
    const persona = PERSONAS.confused_older_user;
    const frame = makeFrame({
      visible_elements: [makeElement({ is_cta: true, tap_target_px: 20 })],
    });
    const signals = perceive(frame);
    const findings = judgeStep(0, persona, signals, frame);
    const tapFinding = findings.find((f) => f.violated_spec_rule === SPEC_RULES.TAP_TARGET_SIZE);
    expect(tapFinding).toBeDefined();
  });

  it('flags unlabelled elements as critical for accessibility_sensitive persona', () => {
    const persona = PERSONAS.accessibility_sensitive_user;
    const frame = makeFrame({
      visible_elements: [makeElement({ tag: 'button', label: undefined, is_cta: true })],
    });
    const signals = perceive(frame);
    const findings = judgeStep(0, persona, signals, frame);
    const labelFinding = findings.find((f) => f.violated_spec_rule === SPEC_RULES.ELEMENT_LABELS);
    expect(labelFinding).toBeDefined();
    expect(labelFinding!.severity).toBe('critical');
  });

  it('flags unlabelled elements as medium for non-a11y persona', () => {
    const persona = PERSONAS.power_user;
    const frame = makeFrame({
      visible_elements: [makeElement({ tag: 'button', label: undefined, is_cta: true })],
    });
    const signals = perceive(frame);
    const findings = judgeStep(0, persona, signals, frame);
    const labelFinding = findings.find((f) => f.violated_spec_rule === SPEC_RULES.ELEMENT_LABELS);
    expect(labelFinding?.severity).toBe('medium');
  });

  it('flags low trust signals for trust-seeking persona', () => {
    const persona = PERSONAS.trust_seeking_user; // trust_threshold=0.9
    const frame = makeFrame({
      url: 'http://dreamengin.com/', // no HTTPS → low trust score
      visible_elements: [makeElement()],
    });
    const signals = perceive(frame);
    const findings = judgeStep(0, persona, signals, frame);
    const trustFinding = findings.find((f) => f.violated_spec_rule === SPEC_RULES.TRUST_SIGNALS);
    expect(trustFinding).toBeDefined();
  });

  it('flags mobile reachability issues on narrow viewport', () => {
    const persona = PERSONAS.impatient_first_time_user;
    const frame = makeFrame({
      viewport: { width: 375, height: 812 },
      visible_elements: [makeElement({ is_cta: true, tap_target_px: 20 })],
    });
    const signals = perceive(frame);
    const findings = judgeStep(0, persona, signals, frame);
    const mobileFinding = findings.find((f) => f.violated_spec_rule === SPEC_RULES.MOBILE_REACHABILITY);
    expect(mobileFinding).toBeDefined();
    expect(mobileFinding!.severity).toBe('high');
  });

  it('flags broken UI as critical', () => {
    const persona = PERSONAS.goal_driven_returning_user;
    const frame = makeFrame({
      visible_elements: [makeElement({ label: '500 Server Error' })],
    });
    const signals = perceive(frame);
    const findings = judgeStep(0, persona, signals, frame);
    const brokenFinding = findings.find((f) => f.violated_spec_rule === SPEC_RULES.NO_BROKEN_UI);
    expect(brokenFinding).toBeDefined();
    expect(brokenFinding!.severity).toBe('critical');
  });

  it('flags misleading copy as high severity', () => {
    const persona = PERSONAS.skeptical_buyer;
    const frame = makeFrame({
      visible_elements: [makeElement({ label: 'Free* with hidden costs' })],
    });
    const signals = perceive(frame);
    const findings = judgeStep(0, persona, signals, frame);
    const darkFinding = findings.find((f) => f.violated_spec_rule === SPEC_RULES.NO_DARK_PATTERNS);
    expect(darkFinding).toBeDefined();
    expect(darkFinding!.severity).toBe('high');
  });

  it('flags non-focusable element for accessibility persona', () => {
    const persona = PERSONAS.accessibility_sensitive_user;
    const frame = makeFrame({
      visible_elements: [makeElement({ tag: 'button', focusable: false })],
    });
    const signals = perceive(frame);
    const findings = judgeStep(0, persona, signals, frame);
    const focusFinding = findings.find((f) => f.violated_spec_rule === SPEC_RULES.ACCESSIBLE_FOCUS);
    expect(focusFinding).toBeDefined();
    expect(focusFinding!.severity).toBe('critical');
  });

  it('every finding has required fields', () => {
    const persona = PERSONAS.impatient_first_time_user;
    const frame = makeFrame({ visible_elements: [makeElement({ is_cta: false })] });
    const signals = perceive(frame);
    const findings = judgeStep(0, persona, signals, frame);
    for (const f of findings) {
      expect(f.finding_id).toBeTruthy();
      expect(f.issue.length).toBeGreaterThan(0);
      expect(f.evidence.length).toBeGreaterThan(0);
      expect(f.violated_spec_rule.length).toBeGreaterThan(0);
      expect(['critical', 'high', 'medium', 'low', 'info']).toContain(f.severity);
      expect(f.confidence).toBeGreaterThanOrEqual(0);
      expect(f.confidence).toBeLessThanOrEqual(1);
      expect(f.top_class_fix.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// judgeJourney() — Audit Judge (journey-level)
// ============================================================================

describe('judgeJourney()', () => {
  it('returns empty array for a clean journey with no step findings', () => {
    const persona = PERSONAS.power_user;
    const steps = [
      { step: 0, persona: persona.type, perception: makeFrame(), signals: perceive(makeFrame()), action: { type: 'click' as const, target: 'btn', rationale: 'ok' }, findings: [] },
      { step: 1, persona: persona.type, perception: makeFrame(), signals: perceive(makeFrame()), action: { type: 'submit' as const, rationale: 'done' }, findings: [] },
    ];
    const journeyFindings = judgeJourney(persona, steps, []);
    expect(journeyFindings).toHaveLength(0);
  });

  it('flags journey abandon with critical severity', () => {
    const persona = PERSONAS.impatient_first_time_user;
    const steps = [
      {
        step: 0,
        persona: persona.type,
        perception: makeFrame(),
        signals: perceive(makeFrame()),
        action: { type: 'abandon' as const, rationale: 'too much friction' },
        findings: [],
      },
    ];
    const findings = judgeJourney(persona, steps, []);
    const abandonFinding = findings.find((f) => f.issue.includes('abandoned'));
    expect(abandonFinding).toBeDefined();
    expect(abandonFinding!.severity).toBe('critical');
  });

  it('flags recurring issue when same spec rule is violated in ≥50% of steps', () => {
    const persona = PERSONAS.confused_older_user;
    const brokenFrame = makeFrame({ visible_elements: [makeElement({ label: '404 error' })] });
    const brokenSignals = perceive(brokenFrame);
    const stepFinding = (step: number) => judgeStep(step, persona, brokenSignals, { ...brokenFrame, step });

    const steps = [0, 1, 2].map((i) => ({
      step: i,
      persona: persona.type,
      perception: { ...brokenFrame, step: i },
      signals: brokenSignals,
      action: { type: 'inspect' as const, rationale: 'confused' },
      findings: stepFinding(i),
    }));
    const allFindings = steps.flatMap((s) => s.findings);

    const journeyFindings = judgeJourney(persona, steps, allFindings);
    const recurringFinding = journeyFindings.find((f) => f.issue.includes('Recurring'));
    expect(recurringFinding).toBeDefined();
    expect(recurringFinding!.severity).toBe('high');
  });
});

// ============================================================================
// runJourney() — End-to-end orchestration
// ============================================================================

describe('runJourney()', () => {
  it('returns a SimJourneyResult with all required fields', () => {
    const result = runJourney({
      persona_type: 'goal_driven_returning_user',
      frames: [makeFrame(), makeFrame()],
    });
    expect(result.journey_id).toBeTruthy();
    expect(result.persona).toBe('goal_driven_returning_user');
    expect(result.goal.length).toBeGreaterThan(0);
    expect(['completed', 'abandoned', 'blocked', 'error']).toContain(result.outcome);
    expect(Array.isArray(result.steps)).toBe(true);
    expect(Array.isArray(result.all_findings)).toBe(true);
    expect(result.stats.total_steps).toBe(result.steps.length);
    expect(result.started_at).toBeTruthy();
    expect(result.completed_at).toBeTruthy();
  });

  it('completes a two-step journey with clean frames', () => {
    const cleanFrame = (step: number): PerceptionFrame => ({
      step,
      page_title: 'DREAMengin',
      url: 'https://dreamengin.com/',
      viewport: { width: 390, height: 844 },
      visible_elements: [makeElement({ id: `cta-${step}`, is_cta: true, label: 'Next', tap_target_px: 48 })],
      screenshot_b64: '',
      recent_actions: [],
    });
    const result = runJourney({
      persona_type: 'power_user',
      frames: [cleanFrame(0), cleanFrame(1)],
    });
    expect(result.outcome).toBe('completed');
    expect(result.steps).toHaveLength(2);
  });

  it('stops early and marks outcome as abandoned when persona abandons', () => {
    // Impatient persona (patience=0.2) encounters max friction frames
    const highFrictionFrame = (step: number): PerceptionFrame => ({
      step,
      page_title: 'Overloaded Page',
      url: 'https://dreamengin.com/shop',
      viewport: { width: 390, height: 844 },
      visible_elements: Array.from({ length: 5 }, (_, i) =>
        makeElement({ id: `el-${step}-${i}`, is_cta: false, tap_target_px: 10, label: undefined, tag: 'button' }),
      ),
      screenshot_b64: '',
      recent_actions: [],
    });
    const result = runJourney({
      persona_type: 'impatient_first_time_user',
      frames: [highFrictionFrame(0), highFrictionFrame(1), highFrictionFrame(2)],
    });
    expect(result.outcome).toBe('abandoned');
    expect(result.steps.length).toBeLessThanOrEqual(3);
  });

  it('accepts a custom journey_id', () => {
    const result = runJourney({
      journey_id: 'test-journey-123',
      persona_type: 'power_user',
      frames: [makeFrame()],
    });
    expect(result.journey_id).toBe('test-journey-123');
  });

  it('stats.findings_by_severity sums to total_findings', () => {
    const result = runJourney({
      persona_type: 'impatient_first_time_user',
      frames: [
        makeFrame({ visible_elements: [makeElement({ is_cta: false, tap_target_px: 10, label: undefined, tag: 'button' })] }),
      ],
    });
    const severitySum = Object.values(result.stats.findings_by_severity).reduce(
      (a, b) => a + b,
      0,
    );
    expect(severitySum).toBe(result.stats.total_findings);
  });

  it('avg_friction is in [0,1]', () => {
    const result = runJourney({
      persona_type: 'skeptical_buyer',
      frames: [makeFrame(), makeFrame()],
    });
    expect(result.stats.avg_friction).toBeGreaterThanOrEqual(0);
    expect(result.stats.avg_friction).toBeLessThanOrEqual(1);
  });

  it('avg_confusion is in [0,1]', () => {
    const result = runJourney({
      persona_type: 'skeptical_buyer',
      frames: [makeFrame(), makeFrame()],
    });
    expect(result.stats.avg_confusion).toBeGreaterThanOrEqual(0);
    expect(result.stats.avg_confusion).toBeLessThanOrEqual(1);
  });

  it('each step contains persona, perception, signals, action, findings', () => {
    const result = runJourney({
      persona_type: 'comparison_shopper',
      frames: [makeFrame()],
    });
    for (const step of result.steps) {
      expect(step.persona).toBe('comparison_shopper');
      expect(step.perception).toBeDefined();
      expect(step.signals).toBeDefined();
      expect(step.action).toBeDefined();
      expect(Array.isArray(step.findings)).toBe(true);
    }
  });

  it('handles an empty frames array gracefully', () => {
    const result = runJourney({
      persona_type: 'power_user',
      frames: [],
    });
    expect(result.outcome).toBe('completed');
    expect(result.steps).toHaveLength(0);
    expect(result.stats.total_steps).toBe(0);
  });
});

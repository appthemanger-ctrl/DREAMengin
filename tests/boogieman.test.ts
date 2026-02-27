// tests/boogieman.test.ts
// Unit tests for TheBoogieMan.Ai policy gate

import { describe, it, expect } from 'vitest';
import { boogieEvaluate, boogieEnforce, computeRiskScore, selectAction, BOOGIE_POLICY_VERSION, CONTAINMENT_ACTIONS, BLAST_RADIUS_ESCALATION_THRESHOLD } from '@/lib/ai/boogieman';
import { RULE_CODES, THRESHOLDS } from '@/lib/ai/boogie-policy';
import type { Intent } from '@/lib/ai/schemas';

// ---------------------------------------------------------------------------
// boogieEvaluate — intent-gate (backwards compat + policy_version stamping)
// ---------------------------------------------------------------------------

describe('BoogieMan — boogieEvaluate (intent gate)', () => {
  it('should deny admin intent for non-admin user', () => {
    const intents: Intent[] = [
      {
        intent_id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'DIAG_SCHEMA_SNAPSHOT',
        payload: {},
        confidence: 0.9,
        requires_confirmation: false,
        rationale: 'Test',
        idempotency_key: 'test-key',
      },
    ];

    const result = boogieEvaluate({ actorRole: 'user', rateRpm: 10, intents });

    expect(result.per_intent[0].decision).toBe('DENY');
    expect(result.per_intent[0].reason_code).toBe(RULE_CODES.ADMIN_REQUIRED);
    expect(result.per_intent[0].policy_version).toBe(BOOGIE_POLICY_VERSION);
    expect(result.policy_version).toBe(BOOGIE_POLICY_VERSION);
  });

  it('should allow low-risk nav intent for user', () => {
    const intents: Intent[] = [
      {
        intent_id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'NAV_DELTA',
        payload: { delta_route: '/home' },
        confidence: 0.9,
        requires_confirmation: false,
        rationale: 'Navigate to home',
        idempotency_key: 'nav-key',
      },
    ];

    const result = boogieEvaluate({ actorRole: 'user', rateRpm: 10, intents });

    expect(result.per_intent[0].decision).toBe('ALLOW');
    expect(result.per_intent[0].reason_code).toBe(RULE_CODES.OK);
    expect(result.per_intent[0].policy_version).toBe(BOOGIE_POLICY_VERSION);
  });

  it('should confirm high-risk intent', () => {
    const intents: Intent[] = [
      {
        intent_id: '123e4567-e89b-12d3-a456-426614174002',
        type: 'DREAM_CONFIG_PATCH',
        payload: { config: { theme: 'dark' } },
        confidence: 0.9,
        requires_confirmation: false,
        rationale: 'Update config',
        idempotency_key: 'config-key',
      },
    ];

    const result = boogieEvaluate({ actorRole: 'user', rateRpm: 10, intents });

    expect(result.per_intent[0].decision).toBe('CONFIRM');
    expect(result.per_intent[0].reason_code).toBe(RULE_CODES.HIGH_RISK);
  });

  it('should hard block on high RPM', () => {
    const intents: Intent[] = [
      {
        intent_id: '123e4567-e89b-12d3-a456-426614174003',
        type: 'NAV_DELTA',
        payload: {},
        confidence: 0.9,
        requires_confirmation: false,
        rationale: 'Test',
        idempotency_key: 'test-key',
      },
    ];

    const result = boogieEvaluate({ actorRole: 'user', rateRpm: 70, intents });

    expect(result.global.hard_block).toBe(true);
    expect(result.global.cooldown_seconds).toBe(60);
    expect(result.policy_version).toBe(BOOGIE_POLICY_VERSION);
  });

  it('should deny low confidence intents', () => {
    const intents: Intent[] = [
      {
        intent_id: '123e4567-e89b-12d3-a456-426614174004',
        type: 'POST_CREATE',
        payload: { content: 'test' },
        confidence: 0.3,
        requires_confirmation: false,
        rationale: 'Create post',
        idempotency_key: 'post-key',
      },
    ];

    const result = boogieEvaluate({ actorRole: 'user', rateRpm: 10, intents });

    expect(result.per_intent[0].decision).toBe('DENY');
    expect(result.per_intent[0].reason_code).toBe(RULE_CODES.LOW_CONFIDENCE);
  });
});

// ---------------------------------------------------------------------------
// computeRiskScore (req 22)
// ---------------------------------------------------------------------------

describe('computeRiskScore', () => {
  it('computes severity × confidence × multiplier', () => {
    expect(computeRiskScore(0.8, 0.9, 1.0)).toBeCloseTo(0.72);
    expect(computeRiskScore(0.5, 0.5, 2.0)).toBeCloseTo(0.5);
  });

  it('clamps at 1.0', () => {
    expect(computeRiskScore(1.0, 1.0, 5.0)).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// selectAction — least-force selection (req 7, 37)
// ---------------------------------------------------------------------------

describe('selectAction', () => {
  it('returns NUDGE for first-time LOW offense', () => {
    const action = selectAction({ riskScore: 0.15, severityLevel: 'LOW', confidence: 0.8, isFirstOffense: true, isRepeatOffense: false });
    expect(action).toBe('NUDGE');
  });

  it('escalates immediately for CRITICAL severity (req 24)', () => {
    const action = selectAction({ riskScore: 0.95, severityLevel: 'CRITICAL', confidence: 0.9, isFirstOffense: false, isRepeatOffense: false });
    expect(['TEMP_SUSPEND', 'ESCALATE']).toContain(action);
  });

  it('caps at FEATURE_LOCK when confidence is below threshold (req 23, G57)', () => {
    const action = selectAction({ riskScore: 0.7, severityLevel: 'HIGH', confidence: THRESHOLDS.MIN_CONFIDENCE_FOR_BAN - 0.01, isFirstOffense: false, isRepeatOffense: true });
    expect(['FEATURE_LOCK', 'WARN']).toContain(action);
  });

  it('returns WARN for low risk score', () => {
    const action = selectAction({ riskScore: 0.15, severityLevel: 'LOW', confidence: 0.9, isFirstOffense: false, isRepeatOffense: false });
    expect(action).toBe('WARN');
  });
});

// ---------------------------------------------------------------------------
// boogieEnforce — dual output (req 16–20)
// ---------------------------------------------------------------------------

describe('boogieEnforce — dual output', () => {
  const baseInput = {
    userId: '123e4567-e89b-12d3-a456-426614174999',
    ruleCode: RULE_CODES.C28_SPAM,
    severity: 0.3,
    confidence: 0.85,
    strikeCount: 0,
  };

  it('produces user_explanation and audit_event', () => {
    const result = boogieEnforce(baseInput);

    expect(result.user_explanation).toBeDefined();
    expect(result.audit_event).toBeDefined();
  });

  it('stamps policy_version on audit_event (req 3, 18)', () => {
    const result = boogieEnforce(baseInput);
    expect(result.audit_event.policy_version).toBe(BOOGIE_POLICY_VERSION);
    expect(result.audit_event.rule_code).toBe(RULE_CODES.C28_SPAM);
  });

  it('stamps policy_version and rule_code on user_explanation (req 17)', () => {
    const result = boogieEnforce(baseInput);
    expect(result.user_explanation.policy_version).toBe(BOOGIE_POLICY_VERSION);
    expect(result.user_explanation.rule_code).toBe(RULE_CODES.C28_SPAM);
    expect(result.user_explanation.policy_page_url).toBe('/policy');
  });

  it('never produces autonomous perm ban — escalates instead (req 9, 43)', () => {
    // Even at max severity+confidence, should be TEMP_BAN not permanent
    const result = boogieEnforce({
      userId: '123e4567-e89b-12d3-a456-426614174888',
      ruleCode: RULE_CODES.C22_CSAM,
      severity: 1.0,
      confidence: 0.99,
      strikeCount: 5,
    });
    // Must escalate for critical severity (req 71)
    expect(result.should_escalate).toBe(true);
    // Action must not be a permanent ban — max is TEMP_BAN (req 42, 43)
    expect(['TEMP_BAN', 'TEMP_SUSPEND', 'ESCALATE']).toContain(result.action);
  });

  it('defaults to least restrictive action for unknown rule code (req 4, 5)', () => {
    const result = boogieEnforce({
      userId: '123e4567-e89b-12d3-a456-426614174777',
      ruleCode: 'INVENTED_RULE_NOT_IN_POLICY',
      severity: 0.2,
      confidence: 0.7,
    });
    // Should escalate because rule is unknown (req 5)
    expect(result.should_escalate).toBe(true);
    // Should use conservative default, not invented rule
    expect(result.audit_event.rule_code).toBe(RULE_CODES.A3_CONSERVATIVE);
  });

  it('includes expiry on timed actions (req 39)', () => {
    const result = boogieEnforce({
      userId: '123e4567-e89b-12d3-a456-426614174666',
      ruleCode: RULE_CODES.C28_SPAM,
      severity: 0.7,
      confidence: 0.9,
      strikeCount: 1,
    });
    if (['THROTTLE', 'FEATURE_LOCK', 'TEMP_SUSPEND', 'TEMP_BAN'].includes(result.action)) {
      expect(result.audit_event.expiry).not.toBeNull();
      expect(result.user_explanation.expiry).not.toBeNull();
    }
  });

  it('appeal_available is false for nudge and warn (req 44)', () => {
    const result = boogieEnforce({
      userId: '123e4567-e89b-12d3-a456-426614174555',
      ruleCode: RULE_CODES.C28_SPAM,
      severity: 0.05,
      confidence: 0.95,
      strikeCount: 0,
    });
    if (result.action === 'NUDGE' || result.action === 'WARN') {
      expect(result.user_explanation.appeal_available).toBe(false);
    }
  });

  it('evidence_refs contains only hashes/IDs (req 19)', () => {
    const result = boogieEnforce({
      ...baseInput,
      evidenceRefs: ['sha256:abc123', 'post_id:def456'],
    });
    expect(result.audit_event.evidence_refs).toEqual(['sha256:abc123', 'post_id:def456']);
  });
});

// ---------------------------------------------------------------------------
// blast_radius — wide-impact escalation (req 25)
// ---------------------------------------------------------------------------

describe('boogieEnforce — blast_radius (req 25)', () => {
  it('escalates and upgrades action when blast_radius >= 10', () => {
    const result = boogieEnforce({
      userId: '123e4567-e89b-12d3-a456-426614170001',
      ruleCode: RULE_CODES.C28_SPAM,
      severity: 0.2,
      confidence: 0.8,
      strikeCount: 0,
      blastRadius: BLAST_RADIUS_ESCALATION_THRESHOLD,
    });
    expect(result.should_escalate).toBe(true);
    expect(result.blast_radius).toBe(BLAST_RADIUS_ESCALATION_THRESHOLD);
    // Action must be at least containment-grade for wide-impact incidents
    expect(CONTAINMENT_ACTIONS).toContain(result.action);
  });

  it('does not upgrade action when blast_radius is small', () => {
    const result = boogieEnforce({
      userId: '123e4567-e89b-12d3-a456-426614170002',
      ruleCode: RULE_CODES.C28_SPAM,
      severity: 0.05,
      confidence: 0.9,
      strikeCount: 0,
      blastRadius: 1,
    });
    expect(result.blast_radius).toBe(1);
    // Should still be NUDGE or WARN (no forced upgrade)
    expect(['NUDGE', 'WARN']).toContain(result.action);
  });

  it('includes blast_radius in idari_telemetry (req 69)', () => {
    const result = boogieEnforce({
      userId: '123e4567-e89b-12d3-a456-426614170003',
      ruleCode: RULE_CODES.C28_SPAM,
      severity: 0.3,
      confidence: 0.85,
      blastRadius: 5,
    });
    expect(result.idari_telemetry).toBeDefined();
    expect(result.idari_telemetry!.blast_radius).toBe(5);
    expect(result.idari_telemetry!.rule_code).toBe(RULE_CODES.C28_SPAM);
    expect(result.idari_telemetry!.action).toBe(result.action);
  });
});

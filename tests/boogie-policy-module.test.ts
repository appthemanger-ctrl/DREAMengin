// tests/boogie-policy-module.test.ts
// Unit tests for lib/policy/boogiePolicy.ts (req 100)
// Validates: category enums, severity ladder, boogieEvaluate(), emitBoogieManEvent(),
// and enforcement anchor linking.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  boogieEvaluate,
  emitBoogieManEvent,
  onBoogieManEvent,
  PolicyCategory,
  PolicySeverity,
  BOOGIE_POLICY_VERSION,
} from '@/lib/policy/boogiePolicy';
import type { PolicyResult } from '@/lib/policy/boogiePolicy';

// ============================================================================
// boogieEvaluate — PolicyResult shape (req 98)
// ============================================================================

describe('boogieEvaluate — PolicyResult schema', () => {
  it('returns all required PolicyResult fields', () => {
    const result = boogieEvaluate({ policy_ref: 'C28_SPAM', severity: 0.3, confidence: 0.9 });
    expect(result).toHaveProperty('allowed');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('severity');
    expect(result).toHaveProperty('actions');
    expect(result).toHaveProperty('reason');
    expect(result).toHaveProperty('policy_ref');
    expect(result).toHaveProperty('expires_at');
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it('carries the policy_ref through to the result (req 94)', () => {
    const result = boogieEvaluate({ policy_ref: 'C21_HARASSMENT', severity: 0.5, confidence: 0.8 });
    expect(result.policy_ref).toBe('C21_HARASSMENT');
  });

  it('maps C28_SPAM to SPAM/SCAMS category (req 25)', () => {
    const result = boogieEvaluate({ policy_ref: 'C28_SPAM', severity: 0.3 });
    expect(result.category).toBe(PolicyCategory.SPAM_SCAMS);
  });

  it('maps C22_CSAM to MINORS category (req 25)', () => {
    const result = boogieEvaluate({ policy_ref: 'C22_CSAM', severity: 0.9 });
    expect(result.category).toBe(PolicyCategory.MINORS);
  });

  it('maps C21_HARASSMENT to HARASSMENT category', () => {
    const result = boogieEvaluate({ policy_ref: 'C21_HARASSMENT', severity: 0.6 });
    expect(result.category).toBe(PolicyCategory.HARASSMENT);
  });

  it('maps C24_VIOLENCE to VIOLENCE category', () => {
    const result = boogieEvaluate({ policy_ref: 'C24_VIOLENCE', severity: 0.8 });
    expect(result.category).toBe(PolicyCategory.VIOLENCE);
  });

  it('maps C25_SELF_HARM to SELF-HARM category', () => {
    const result = boogieEvaluate({ policy_ref: 'C25_SELF_HARM', severity: 0.8 });
    expect(result.category).toBe(PolicyCategory.SELF_HARM);
  });

  it('maps C29_PRIVACY to PRIVACY category', () => {
    const result = boogieEvaluate({ policy_ref: 'C29_PRIVACY', severity: 0.5 });
    expect(result.category).toBe(PolicyCategory.PRIVACY);
  });

  it('maps C30_MALWARE to MALWARE/ABUSE category', () => {
    const result = boogieEvaluate({ policy_ref: 'C30_MALWARE', severity: 0.9 });
    expect(result.category).toBe(PolicyCategory.MALWARE_ABUSE);
  });

  it('returns NONE category for unknown rule code', () => {
    const result = boogieEvaluate({ policy_ref: 'UNKNOWN_RULE', severity: 0 });
    expect(result.category).toBe(PolicyCategory.NONE);
  });
});

// ============================================================================
// boogieEvaluate — allowed flag (req 97)
// ============================================================================

describe('boogieEvaluate — allowed flag', () => {
  it('allowed=true for NONE category + very low severity', () => {
    const result = boogieEvaluate({ policy_ref: 'OK', severity: 0, confidence: 1 });
    expect(result.allowed).toBe(true);
    expect(result.actions).toEqual([]);
  });

  it('allowed=false for any flagged rule code', () => {
    const result = boogieEvaluate({ policy_ref: 'C28_SPAM', severity: 0.3, confidence: 0.9 });
    expect(result.allowed).toBe(false);
  });

  it('allowed=false for CSAM even at low severity (one-strike, req 82)', () => {
    const result = boogieEvaluate({ policy_ref: 'C22_CSAM', severity: 0.1, confidence: 0.5 });
    expect(result.allowed).toBe(false);
    expect(result.severity).toBe(PolicySeverity.S5_PERM_BAN);
  });
});

// ============================================================================
// boogieEvaluate — enforcement ladder (req 73–79)
// ============================================================================

describe('boogieEvaluate — enforcement ladder (S0–S5)', () => {
  it('S0 for very low severity first offense (req 83)', () => {
    // C28_SPAM at very low severity (0.05) on first offense should generate a notice
    const result = boogieEvaluate({ policy_ref: 'C28_SPAM', severity: 0.05, confidence: 0.8, strike_count: 0 });
    expect(result.severity).toBe(PolicySeverity.S0_NOTICE);
    expect(result.actions).toContain('NUDGE');
  });

  it('S1 for low severity C28_SPAM (req 74–75)', () => {
    const result = boogieEvaluate({ policy_ref: 'C28_SPAM', severity: 0.3, confidence: 0.9 });
    expect(result.severity).toBe(PolicySeverity.S1_SOFT_WARN);
    expect(result.actions).toContain('WARN');
  });

  it('S3 for C21_HARASSMENT default (req 77)', () => {
    const result = boogieEvaluate({ policy_ref: 'C21_HARASSMENT', severity: 0.6, confidence: 0.9 });
    expect(result.severity).toBe(PolicySeverity.S3_FEATURE_LOCK);
    expect(result.actions).toContain('FEATURE_LOCK');
  });

  it('S4 for C24_VIOLENCE default (req 78)', () => {
    const result = boogieEvaluate({ policy_ref: 'C24_VIOLENCE', severity: 0.8, confidence: 0.85 });
    expect(result.severity).toBe(PolicySeverity.S4_TEMP_BAN);
    expect(result.actions).toContain('TEMP_BAN');
  });

  it('S5 for C22_CSAM (one-strike, req 82)', () => {
    const result = boogieEvaluate({ policy_ref: 'C22_CSAM', severity: 0.5, confidence: 0.7 });
    expect(result.severity).toBe(PolicySeverity.S5_PERM_BAN);
    expect(result.actions).toContain('ESCALATE');
  });

  it('S5 for C30_MALWARE (one-strike, req 82)', () => {
    const result = boogieEvaluate({ policy_ref: 'C30_MALWARE', severity: 0.5, confidence: 0.7 });
    expect(result.severity).toBe(PolicySeverity.S5_PERM_BAN);
    expect(result.actions).toContain('ESCALATE');
  });

  it('escalates severity on repeat offense (req 81)', () => {
    const firstOffense = boogieEvaluate({ policy_ref: 'C28_SPAM', severity: 0.3, confidence: 0.9, strike_count: 0 });
    const repeatOffense = boogieEvaluate({ policy_ref: 'C28_SPAM', severity: 0.3, confidence: 0.9, strike_count: 2 });
    // Repeat offense must be at least as severe as first offense
    const order = Object.values(PolicySeverity);
    expect(order.indexOf(repeatOffense.severity)).toBeGreaterThanOrEqual(order.indexOf(firstOffense.severity));
  });
});

// ============================================================================
// boogieEvaluate — reason messaging (req 95 — factual, calm, no shaming)
// ============================================================================

describe('boogieEvaluate — reason messaging (req 95)', () => {
  it('provides a non-empty, human-readable reason for every flagged category', () => {
    const codes = ['C21_HARASSMENT', 'C22_CSAM', 'C24_VIOLENCE', 'C25_SELF_HARM', 'C26_ILLEGAL', 'C27_FRAUD', 'C28_SPAM', 'C29_PRIVACY', 'C30_MALWARE'];
    for (const code of codes) {
      const result = boogieEvaluate({ policy_ref: code, severity: 0.5, confidence: 0.8 });
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(10);
    }
  });
});

// ============================================================================
// boogieEvaluate — policy_ref / policy page link (req 94)
// ============================================================================

describe('boogieEvaluate — policy_ref link (req 94)', () => {
  it('policy_ref is set on every result', () => {
    const codes = ['C28_SPAM', 'C21_HARASSMENT', 'C22_CSAM'];
    for (const code of codes) {
      const result = boogieEvaluate({ policy_ref: code, severity: 0.5 });
      expect(result.policy_ref).toBe(code);
    }
  });
});

// ============================================================================
// emitBoogieManEvent + onBoogieManEvent (req 99)
// ============================================================================

describe('emitBoogieManEvent + onBoogieManEvent (req 99)', () => {
  let cleanup: (() => void) | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalWindow: any;
  const listeners: Map<string, EventListenerOrEventListenerObject[]> = new Map();

  beforeEach(() => {
    // Simulate a minimal window with EventTarget in node environment
    originalWindow = (globalThis as Record<string, unknown>).window;
    const et = new EventTarget();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = {
      dispatchEvent: (e: Event) => et.dispatchEvent(e),
      addEventListener: (type: string, fn: EventListenerOrEventListenerObject) => {
        et.addEventListener(type, fn);
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type)!.push(fn);
      },
      removeEventListener: (type: string, fn: EventListenerOrEventListenerObject) => {
        et.removeEventListener(type, fn);
      },
    };
  });

  afterEach(() => {
    cleanup?.();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = originalWindow;
    listeners.clear();
  });

  it('emits a CustomEvent that onBoogieManEvent receives', () => {
    const received: PolicyResult[] = [];
    cleanup = onBoogieManEvent((r) => received.push(r));

    const result = boogieEvaluate({ policy_ref: 'C28_SPAM', severity: 0.3, confidence: 0.9 });
    emitBoogieManEvent(result);

    expect(received).toHaveLength(1);
    expect(received[0].policy_ref).toBe('C28_SPAM');
    expect(received[0].category).toBe(PolicyCategory.SPAM_SCAMS);
  });

  it('emitted event includes all PolicyResult fields', () => {
    const received: PolicyResult[] = [];
    cleanup = onBoogieManEvent((r) => received.push(r));

    const result = boogieEvaluate({ policy_ref: 'C21_HARASSMENT', severity: 0.6, confidence: 0.85 });
    emitBoogieManEvent(result);

    const r = received[0];
    expect(r).toHaveProperty('allowed');
    expect(r).toHaveProperty('category');
    expect(r).toHaveProperty('severity');
    expect(r).toHaveProperty('actions');
    expect(r).toHaveProperty('reason');
    expect(r).toHaveProperty('policy_ref');
    expect(r).toHaveProperty('expires_at');
  });

  it('cleanup function removes listener', () => {
    const received: PolicyResult[] = [];
    const off = onBoogieManEvent((r) => received.push(r));
    off();

    const result = boogieEvaluate({ policy_ref: 'C28_SPAM', severity: 0.3 });
    emitBoogieManEvent(result);

    expect(received).toHaveLength(0);
  });
});

// ============================================================================
// BOOGIE_POLICY_VERSION re-export (req 96)
// ============================================================================

describe('BOOGIE_POLICY_VERSION re-exported (req 96)', () => {
  it('exports a non-empty policy version string', () => {
    expect(typeof BOOGIE_POLICY_VERSION).toBe('string');
    expect(BOOGIE_POLICY_VERSION.length).toBeGreaterThan(0);
  });
});

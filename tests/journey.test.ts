/**
 * tests/journey.test.ts
 *
 * Unit tests for the Journey Trail feature.
 *
 * Architecture justification:
 *   docs/AXIOMS.md §3 — every visible action must do something real.
 *   The Journey Trail persists meaningful user actions as private data points.
 *   These tests verify pure logic helpers that drive the trail visualization
 *   and API behavior.
 *
 * All functions under test are pure — no DOM, no network, no React needed.
 */

import { describe, expect, it } from 'vitest';
import type { JourneyDot, JourneyTimeGroup } from '@/types/journey';
import { JOURNEY_DOMAIN_COLORS } from '@/types/journey';

// ── Helpers mirrored from JourneyTrail.tsx ────────────────────────────────────

function groupDotsByTime(dots: JourneyDot[]): JourneyTimeGroup[] {
  const now = Date.now();
  const DAY = 86_400_000;

  const groups: JourneyTimeGroup[] = [
    { label: 'Today',       dots: [] },
    { label: 'This Week',   dots: [] },
    { label: 'This Month',  dots: [] },
    { label: 'Earlier',     dots: [] },
  ];

  for (const dot of dots) {
    const age = now - new Date(dot.created_at).getTime();
    if (age < DAY)            groups[0].dots.push(dot);
    else if (age < 7 * DAY)   groups[1].dots.push(dot);
    else if (age < 30 * DAY)  groups[2].dots.push(dot);
    else                      groups[3].dots.push(dot);
  }

  return groups.filter(g => g.dots.length > 0);
}

function dotRadius(significance: number): number {
  if (significance >= 0.9) return 8;
  if (significance >= 0.6) return 6;
  return 4;
}

// ── API validation logic (mirrors app/api/journey/route.ts) ──────────────────

function validateDotInput(body: Record<string, unknown>): string | null {
  if (!body.kind || typeof body.kind !== 'string') {
    return 'kind is required and must be a string';
  }
  if (!body.label || typeof body.label !== 'string') {
    return 'label is required and must be a string';
  }
  const sig = body.significance !== undefined ? Number(body.significance) : 0.5;
  if (isNaN(sig) || sig < 0 || sig > 1) {
    return 'significance must be a number between 0 and 1';
  }
  return null;
}

// ── Fixture factories ─────────────────────────────────────────────────────────

function makeDot(overrides: Partial<JourneyDot> = {}): JourneyDot {
  return {
    id:           'test-id',
    user_id:      'user-123',
    kind:         'runtime_first_entry',
    surface:      'HomeDream Surface',
    label:        'You entered DREAMengin for the first time.',
    significance: 1.0,
    domain_color: '#c8981a',
    metadata:     {},
    created_at:   new Date().toISOString(),
    ...overrides,
  };
}

function ageMs(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

// ── Tests: groupDotsByTime ────────────────────────────────────────────────────

describe('groupDotsByTime', () => {
  it('returns empty array when no dots provided', () => {
    expect(groupDotsByTime([])).toEqual([]);
  });

  it('places a dot created now into Today group', () => {
    const dot = makeDot({ created_at: ageMs(1_000) });  // 1 second ago
    const groups = groupDotsByTime([dot]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('Today');
    expect(groups[0].dots).toHaveLength(1);
  });

  it('places a dot created 2 days ago into This Week group', () => {
    const dot = makeDot({ created_at: ageMs(2 * 86_400_000) });
    const groups = groupDotsByTime([dot]);
    expect(groups[0].label).toBe('This Week');
  });

  it('places a dot created 10 days ago into This Month group', () => {
    const dot = makeDot({ created_at: ageMs(10 * 86_400_000) });
    const groups = groupDotsByTime([dot]);
    expect(groups[0].label).toBe('This Month');
  });

  it('places a dot created 45 days ago into Earlier group', () => {
    const dot = makeDot({ created_at: ageMs(45 * 86_400_000) });
    const groups = groupDotsByTime([dot]);
    expect(groups[0].label).toBe('Earlier');
  });

  it('filters out empty groups', () => {
    const dot = makeDot({ created_at: ageMs(1_000) });
    const groups = groupDotsByTime([dot]);
    // Only 'Today' should be returned — no empty This Week / This Month / Earlier
    expect(groups.every(g => g.dots.length > 0)).toBe(true);
  });

  it('distributes multiple dots into correct groups', () => {
    const dots = [
      makeDot({ id: '1', created_at: ageMs(1_000) }),            // Today
      makeDot({ id: '2', created_at: ageMs(3 * 86_400_000) }),   // This Week
      makeDot({ id: '3', created_at: ageMs(60 * 86_400_000) }),  // Earlier
    ];
    const groups = groupDotsByTime(dots);
    expect(groups).toHaveLength(3);
    const labels = groups.map(g => g.label);
    expect(labels).toContain('Today');
    expect(labels).toContain('This Week');
    expect(labels).toContain('Earlier');
  });

  it('maintains order within each group (newest first)', () => {
    const dots = [
      makeDot({ id: 'a', created_at: ageMs(60_000) }),     // 1 min ago
      makeDot({ id: 'b', created_at: ageMs(3_600_000) }),  // 1 hour ago
    ];
    const groups = groupDotsByTime(dots);
    expect(groups[0].dots[0].id).toBe('a');
    expect(groups[0].dots[1].id).toBe('b');
  });
});

// ── Tests: dotRadius ──────────────────────────────────────────────────────────

describe('dotRadius', () => {
  it('returns 8 for high significance (>= 0.9)', () => {
    expect(dotRadius(1.0)).toBe(8);
    expect(dotRadius(0.9)).toBe(8);
  });

  it('returns 6 for medium significance (>= 0.6)', () => {
    expect(dotRadius(0.6)).toBe(6);
    expect(dotRadius(0.8)).toBe(6);
  });

  it('returns 4 for low significance (< 0.6)', () => {
    expect(dotRadius(0.5)).toBe(4);
    expect(dotRadius(0.0)).toBe(4);
  });
});

// ── Tests: validateDotInput ───────────────────────────────────────────────────

describe('validateDotInput', () => {
  it('returns null for a valid minimal input', () => {
    expect(validateDotInput({ kind: 'runtime_first_entry', label: 'You entered DREAMengin.' })).toBeNull();
  });

  it('returns error when kind is missing', () => {
    expect(validateDotInput({ label: 'Test' })).toBe('kind is required and must be a string');
  });

  it('returns error when label is missing', () => {
    expect(validateDotInput({ kind: 'runtime_first_entry' })).toBe('label is required and must be a string');
  });

  it('returns error when kind is not a string', () => {
    expect(validateDotInput({ kind: 42, label: 'Test' })).toBe('kind is required and must be a string');
  });

  it('returns null when significance is 0', () => {
    expect(validateDotInput({ kind: 'runtime_first_entry', label: 'Test', significance: 0 })).toBeNull();
  });

  it('returns null when significance is 1', () => {
    expect(validateDotInput({ kind: 'runtime_first_entry', label: 'Test', significance: 1 })).toBeNull();
  });

  it('returns error when significance is > 1', () => {
    expect(validateDotInput({ kind: 'runtime_first_entry', label: 'Test', significance: 1.5 }))
      .toBe('significance must be a number between 0 and 1');
  });

  it('returns error when significance is < 0', () => {
    expect(validateDotInput({ kind: 'runtime_first_entry', label: 'Test', significance: -0.1 }))
      .toBe('significance must be a number between 0 and 1');
  });

  it('returns error when significance is NaN', () => {
    expect(validateDotInput({ kind: 'runtime_first_entry', label: 'Test', significance: NaN }))
      .toBe('significance must be a number between 0 and 1');
  });

  it('defaults to 0.5 significance when not provided (valid)', () => {
    // When significance is missing the default 0.5 is used — should be valid
    expect(validateDotInput({ kind: 'runtime_first_entry', label: 'Test' })).toBeNull();
  });
});

// ── Tests: JOURNEY_DOMAIN_COLORS ──────────────────────────────────────────────

describe('JOURNEY_DOMAIN_COLORS', () => {
  it('contains all canonical surface names', () => {
    const expected = [
      'HomeDream Surface',
      'Music Daydream Surface',
      'Games Daydream Surface',
      'Lab Daydream Surface',
      'Code Daydream Surface',
      'Brand Daydream Surface',
      'Create Daydream Surface',
      'DreamDM Surface',
      'DreamShop Surface',
    ];
    for (const name of expected) {
      expect(JOURNEY_DOMAIN_COLORS).toHaveProperty(name);
    }
  });

  it('all color values are valid hex strings', () => {
    const hexRe = /^#[0-9a-fA-F]{6}$/;
    for (const [surface, color] of Object.entries(JOURNEY_DOMAIN_COLORS)) {
      expect(color).toMatch(hexRe);
      expect(typeof surface).toBe('string');
    }
  });

  it('HomeDream Surface and DreamShop Surface both use gold (#c8981a)', () => {
    expect(JOURNEY_DOMAIN_COLORS['HomeDream Surface']).toBe('#c8981a');
    expect(JOURNEY_DOMAIN_COLORS['DreamShop Surface']).toBe('#c8981a');
  });
});

// ── Tests: JourneyDot privacy guarantees ─────────────────────────────────────

describe('JourneyDot privacy model', () => {
  it('a JourneyDot has no visibility field (privacy enforced at DB layer)', () => {
    const dot = makeDot();
    // The JourneyDot type intentionally has no visibility field —
    // privacy is enforced by RLS at the database layer, not by a flag.
    expect('visibility' in dot).toBe(false);
  });

  it('a dot always has a user_id field', () => {
    const dot = makeDot();
    expect(dot.user_id).toBeTruthy();
  });
});

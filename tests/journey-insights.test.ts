/**
 * tests/journey-insights.test.ts
 *
 * Unit tests for lib/journey/journeyInsights — the derived signal layer.
 *
 * All functions under test are pure — no DOM, no network, no React.
 *
 * Coverage:
 *   findFirstOccurrenceIds    — mark the earliest dot per kind
 *   computeCurrentStreak      — consecutive-day streak from today
 *   computeWeeklyFrequency    — count per kind in 7-day rolling window
 *   detectReturnGaps          — detect gaps ≥ RETURN_GAP_DAYS
 *   annotateDotsWithInsights  — full annotation pass (integration)
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import type { JourneyDot } from '@/types/journey';
import {
  findFirstOccurrenceIds,
  computeCurrentStreak,
  computeWeeklyFrequency,
  detectReturnGaps,
  annotateDotsWithInsights,
  RETURN_GAP_DAYS,
} from '@/lib/journey/journeyInsights';

// ── Fixture helpers ───────────────────────────────────────────────────────────

let nextId = 1;
function makeDot(overrides: Partial<JourneyDot> = {}): JourneyDot {
  return {
    id:           String(nextId++),
    user_id:      'user-1',
    kind:         'runtime_first_entry',
    surface:      'HomeDream Surface',
    label:        'Test dot',
    significance: 0.5,
    domain_color: '#c8981a',
    metadata:     {},
    created_at:   new Date().toISOString(),
    ...overrides,
  };
}

/** Return an ISO timestamp N days ago from now. */
function daysAgo(n: number, offsetMs = 0): string {
  return new Date(Date.now() - n * 86_400_000 - offsetMs).toISOString();
}

afterEach(() => {
  nextId = 1;
  vi.restoreAllMocks();
});

// ─── findFirstOccurrenceIds ───────────────────────────────────────────────────

describe('findFirstOccurrenceIds()', () => {
  it('returns empty set for empty input', () => {
    expect(findFirstOccurrenceIds([])).toEqual(new Set());
  });

  it('marks the single dot in a one-element list as first', () => {
    const dot = makeDot({ id: 'a', kind: 'runtime_first_entry', created_at: daysAgo(1) });
    expect(findFirstOccurrenceIds([dot])).toContain('a');
  });

  it('marks only the oldest dot of each kind as first (newest-first API order)', () => {
    // API returns newest first
    const newerDot = makeDot({ id: 'new', kind: 'surface_first_entry', created_at: daysAgo(1) });
    const olderDot = makeDot({ id: 'old', kind: 'surface_first_entry', created_at: daysAgo(5) });
    const ids = findFirstOccurrenceIds([newerDot, olderDot]); // newest first
    expect(ids).toContain('old');   // oldest = "first ever"
    expect(ids).not.toContain('new');
  });

  it('returns one first-id per unique kind', () => {
    const dots = [
      makeDot({ id: 'a', kind: 'runtime_first_entry',  created_at: daysAgo(3) }),
      makeDot({ id: 'b', kind: 'surface_first_entry',  created_at: daysAgo(2) }),
      makeDot({ id: 'c', kind: 'runtime_first_entry',  created_at: daysAgo(1) }),
    ];
    const ids = findFirstOccurrenceIds([dots[2], dots[1], dots[0]]); // newest first
    expect(ids.size).toBe(2);
    expect(ids).toContain('a'); // oldest runtime_first_entry
    expect(ids).toContain('b'); // only surface_first_entry
  });
});

// ─── computeCurrentStreak ─────────────────────────────────────────────────────

describe('computeCurrentStreak()', () => {
  it('returns 0 for empty dot list', () => {
    expect(computeCurrentStreak([])).toBe(0);
  });

  it('returns 0 when there is no activity today or yesterday', () => {
    const dots = [makeDot({ created_at: daysAgo(3) })];
    expect(computeCurrentStreak(dots)).toBe(0);
  });

  it('returns 1 when there is only activity today', () => {
    const dots = [makeDot({ created_at: daysAgo(0, 60_000) })]; // now - 1 min
    expect(computeCurrentStreak(dots)).toBe(1);
  });

  it('returns 3 for three consecutive days ending today', () => {
    const dots = [
      makeDot({ created_at: daysAgo(0, 60_000) }),  // today
      makeDot({ created_at: daysAgo(1) }),           // yesterday
      makeDot({ created_at: daysAgo(2) }),           // day before
    ];
    expect(computeCurrentStreak(dots)).toBe(3);
  });

  it('stops at a gap — returns streak up to the gap', () => {
    const dots = [
      makeDot({ created_at: daysAgo(0, 60_000) }),  // today
      makeDot({ created_at: daysAgo(1) }),           // yesterday
      // gap: no activity on day 2
      makeDot({ created_at: daysAgo(3) }),           // 3 days ago
    ];
    expect(computeCurrentStreak(dots)).toBe(2); // today + yesterday only
  });

  it('counts multiple dots on the same day as one streak-day', () => {
    const dots = [
      makeDot({ id: 'a1', created_at: daysAgo(0, 1_000) }),
      makeDot({ id: 'a2', created_at: daysAgo(0, 2_000) }),  // same day
      makeDot({ id: 'b',  created_at: daysAgo(1) }),
    ];
    expect(computeCurrentStreak(dots)).toBe(2);
  });
});

// ─── computeWeeklyFrequency ───────────────────────────────────────────────────

describe('computeWeeklyFrequency()', () => {
  it('returns empty map for empty input', () => {
    expect(computeWeeklyFrequency([])).toEqual(new Map());
  });

  it('does not include an id when count is 1', () => {
    const dot = makeDot({ kind: 'surface_first_entry' });
    const freq = computeWeeklyFrequency([dot]);
    expect(freq.has(dot.id)).toBe(false);
  });

  it('includes an id when the same kind appears twice within 7 days', () => {
    const d1 = makeDot({ id: '1', kind: 'content_first_created', created_at: daysAgo(1) });
    const d2 = makeDot({ id: '2', kind: 'content_first_created', created_at: daysAgo(2) });
    const freq = computeWeeklyFrequency([d1, d2]);
    expect(freq.get(d1.id)).toBe(2);
    expect(freq.get(d2.id)).toBe(2);
  });

  it('does not count a dot outside the 7-day window', () => {
    const recent = makeDot({ id: 'r', kind: 'content_first_created', created_at: daysAgo(1) });
    const old    = makeDot({ id: 'o', kind: 'content_first_created', created_at: daysAgo(10) });
    const freq = computeWeeklyFrequency([recent, old]);
    // 'recent' only has 1 occurrence in its 7-day window (old is outside)
    expect(freq.has(recent.id)).toBe(false);
    // 'old' has 1 occurrence in its 7-day window
    expect(freq.has(old.id)).toBe(false);
  });

  it('counts correctly when 3 same-kind dots fall within the window', () => {
    const dots = [
      makeDot({ id: 'a', kind: 'dream_window_first_mount', created_at: daysAgo(1) }),
      makeDot({ id: 'b', kind: 'dream_window_first_mount', created_at: daysAgo(2) }),
      makeDot({ id: 'c', kind: 'dream_window_first_mount', created_at: daysAgo(3) }),
    ];
    const freq = computeWeeklyFrequency(dots);
    // Each dot's 7-day window includes all three
    expect(freq.get('a')).toBe(3);
  });
});

// ─── detectReturnGaps ─────────────────────────────────────────────────────────

describe('detectReturnGaps()', () => {
  it('returns empty map for empty input', () => {
    expect(detectReturnGaps([])).toEqual(new Map());
  });

  it('returns empty map for a single dot', () => {
    const dot = makeDot();
    expect(detectReturnGaps([dot])).toEqual(new Map());
  });

  it('does not flag a return when gap is less than RETURN_GAP_DAYS', () => {
    // RETURN_GAP_DAYS = 3; gap of 2 days should not flag
    const older  = makeDot({ id: 'old', kind: 'surface_first_entry', surface: 'Music', created_at: daysAgo(3) });
    const newer  = makeDot({ id: 'new', kind: 'surface_first_entry', surface: 'Music', created_at: daysAgo(1) });
    const gaps = detectReturnGaps([newer, older]); // newest first
    expect(gaps.has('new')).toBe(false);
  });

  it(`flags a return when gap is ≥ RETURN_GAP_DAYS (${RETURN_GAP_DAYS} days)`, () => {
    const gap = RETURN_GAP_DAYS + 2; // comfortably over threshold
    const older = makeDot({ id: 'old', kind: 'surface_first_entry', surface: 'Music', created_at: daysAgo(gap + 1) });
    const newer = makeDot({ id: 'new', kind: 'surface_first_entry', surface: 'Music', created_at: daysAgo(1) });
    const gaps = detectReturnGaps([newer, older]);
    expect(gaps.has('new')).toBe(true);
    expect(gaps.get('new')).toBeGreaterThanOrEqual(RETURN_GAP_DAYS);
  });

  it('does not flag dots with different kind+surface combinations', () => {
    const older = makeDot({ id: 'old', kind: 'surface_first_entry', surface: 'Music', created_at: daysAgo(10) });
    const newer = makeDot({ id: 'new', kind: 'surface_first_entry', surface: 'Code',  created_at: daysAgo(1) });
    const gaps = detectReturnGaps([newer, older]);
    expect(gaps.has('new')).toBe(false);
  });
});

// ─── annotateDotsWithInsights ─────────────────────────────────────────────────

describe('annotateDotsWithInsights()', () => {
  it('returns empty array for empty input', () => {
    expect(annotateDotsWithInsights([])).toEqual([]);
  });

  it('adds an insight object to every dot', () => {
    const dots = [makeDot(), makeDot()];
    const result = annotateDotsWithInsights(dots);
    expect(result).toHaveLength(2);
    for (const d of result) {
      expect(d).toHaveProperty('insight');
    }
  });

  it('marks a dot as first when it is the only occurrence of its kind', () => {
    const dot = makeDot({ id: 'x', kind: 'runtime_first_entry', created_at: daysAgo(1) });
    const [annotated] = annotateDotsWithInsights([dot]);
    expect(annotated.insight.isFirst).toBe(true);
  });

  it('does not mark a newer duplicate as first', () => {
    const older = makeDot({ id: 'old', kind: 'connector_linked', created_at: daysAgo(5) });
    const newer = makeDot({ id: 'new', kind: 'connector_linked', created_at: daysAgo(1) });
    const result = annotateDotsWithInsights([newer, older]);
    const byId = new Map(result.map(d => [d.id, d]));
    expect(byId.get('old')!.insight.isFirst).toBe(true);
    expect(byId.get('new')!.insight.isFirst).toBeUndefined();
  });

  it('sets weeklyFrequency when same kind appears multiple times within 7 days', () => {
    const d1 = makeDot({ id: '1', kind: 'content_shared', created_at: daysAgo(1) });
    const d2 = makeDot({ id: '2', kind: 'content_shared', created_at: daysAgo(2) });
    const result = annotateDotsWithInsights([d1, d2]);
    const byId   = new Map(result.map(d => [d.id, d]));
    expect(byId.get('1')!.insight.weeklyFrequency).toBe(2);
    expect(byId.get('2')!.insight.weeklyFrequency).toBe(2);
  });

  it('sets returnAfterDays on a return dot', () => {
    const gap   = RETURN_GAP_DAYS + 3;
    const older = makeDot({ id: 'old', kind: 'surface_first_entry', surface: 'Brand', created_at: daysAgo(gap + 1) });
    const newer = makeDot({ id: 'new', kind: 'surface_first_entry', surface: 'Brand', created_at: daysAgo(1) });
    const result = annotateDotsWithInsights([newer, older]);
    const byId   = new Map(result.map(d => [d.id, d]));
    expect(byId.get('new')!.insight.returnAfterDays).toBeGreaterThanOrEqual(RETURN_GAP_DAYS);
    expect(byId.get('old')!.insight.returnAfterDays).toBeUndefined();
  });

  it('preserves original dot fields in annotated output', () => {
    const dot = makeDot({ id: 'z', label: 'Special label', significance: 0.9 });
    const [annotated] = annotateDotsWithInsights([dot]);
    expect(annotated.id).toBe('z');
    expect(annotated.label).toBe('Special label');
    expect(annotated.significance).toBe(0.9);
  });

  it('preserves original array order', () => {
    const dots = [
      makeDot({ id: 'first',  created_at: daysAgo(0, 1_000) }),
      makeDot({ id: 'second', created_at: daysAgo(1) }),
      makeDot({ id: 'third',  created_at: daysAgo(2) }),
    ];
    const result = annotateDotsWithInsights(dots);
    expect(result.map(d => d.id)).toEqual(['first', 'second', 'third']);
  });
});

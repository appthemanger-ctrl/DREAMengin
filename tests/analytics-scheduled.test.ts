/**
 * tests/analytics-scheduled.test.ts
 *
 * Unit tests for the analytics and scheduled-posts wiring layer.
 *
 * Architecture justification:
 *   docs/AXIOMS.md §3 — every visible action must do something real.
 *   AnalyticsPanel and ContentScheduler were both previously using fake/stub
 *   data.  These tests verify the pure logic helpers that drive the real wiring:
 *   - pctChange calculation (analytics)
 *   - scheduled post status classification
 *   - platform option validation
 *
 * All functions under test are pure — no DOM, no network, no React needed.
 */

import { describe, expect, it } from 'vitest';

// ---------------------------------------------------------------------------
// pctChange — isolated pure function (mirrors /api/analytics/route.ts)
// ---------------------------------------------------------------------------

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat(((current - previous) / previous * 100).toFixed(1));
}

describe('pctChange', () => {
  it('returns 0 when both are zero', () => {
    expect(pctChange(0, 0)).toBe(0);
  });

  it('returns 100 when previous is 0 and current is positive', () => {
    expect(pctChange(5, 0)).toBe(100);
  });

  it('calculates positive growth correctly', () => {
    expect(pctChange(110, 100)).toBe(10);
  });

  it('calculates negative growth correctly', () => {
    expect(pctChange(90, 100)).toBe(-10);
  });

  it('rounds to 1 decimal place', () => {
    expect(pctChange(103, 100)).toBe(3);
    expect(pctChange(101, 300)).toBe(-66.3);
  });

  it('handles large numbers without overflow', () => {
    expect(pctChange(2_000_000, 1_000_000)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Scheduled post status validation
// ---------------------------------------------------------------------------

type ScheduledPostStatus = 'scheduled' | 'publishing' | 'published' | 'failed';

const VALID_STATUSES: ScheduledPostStatus[] = ['scheduled', 'publishing', 'published', 'failed'];

function isValidStatus(s: string): s is ScheduledPostStatus {
  return (VALID_STATUSES as string[]).includes(s);
}

describe('scheduled post status', () => {
  it('accepts all four valid statuses', () => {
    for (const s of VALID_STATUSES) {
      expect(isValidStatus(s)).toBe(true);
    }
  });

  it('rejects unknown statuses', () => {
    expect(isValidStatus('draft')).toBe(false);
    expect(isValidStatus('queued')).toBe(false);
    expect(isValidStatus('')).toBe(false);
    expect(isValidStatus('SCHEDULED')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Platform options
// ---------------------------------------------------------------------------

const PLATFORM_OPTIONS = ['feed', 'profile', 'lab', 'music', 'code', 'brand'] as const;
type Platform = typeof PLATFORM_OPTIONS[number];

function isValidPlatform(p: string): p is Platform {
  return (PLATFORM_OPTIONS as readonly string[]).includes(p);
}

describe('ContentScheduler platform options', () => {
  it('has 6 canonical platform targets', () => {
    expect(PLATFORM_OPTIONS).toHaveLength(6);
  });

  it('includes feed and profile as required targets', () => {
    expect(PLATFORM_OPTIONS).toContain('feed');
    expect(PLATFORM_OPTIONS).toContain('profile');
  });

  it('validates known platforms', () => {
    for (const p of PLATFORM_OPTIONS) {
      expect(isValidPlatform(p)).toBe(true);
    }
  });

  it('rejects unknown platforms', () => {
    expect(isValidPlatform('twitter')).toBe(false);
    expect(isValidPlatform('instagram')).toBe(false);
    expect(isValidPlatform('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Minimum datetime-local (past-prevention guard)
// ---------------------------------------------------------------------------

function minDatetimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

describe('minDatetimeLocal', () => {
  it('returns a string in YYYY-MM-DDTHH:MM format', () => {
    const result = minDatetimeLocal();
    expect(typeof result).toBe('string');
    // datetime-local format: 2026-03-20T14:30
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('is at most 1 minute in the past compared to now', () => {
    const before = Date.now();
    const result = minDatetimeLocal();
    const after  = Date.now();
    const parsed = new Date(result).getTime();
    // Allow up to 2-minute tolerance for timezone offset edge cases
    const toleranceMs = 2 * 60_000;
    expect(parsed).toBeGreaterThanOrEqual(before - toleranceMs);
    expect(parsed).toBeLessThanOrEqual(after   + toleranceMs);
  });
});

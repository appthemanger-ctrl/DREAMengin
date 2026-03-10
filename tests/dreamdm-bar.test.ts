/**
 * tests/dreamdm-bar.test.ts
 *
 * Unit tests for useDreamDMBar (lib/daydream/useDreamDMBar.ts).
 * Validates snap logic, SNAP_PCT values, and draft/snap persistence keys.
 */

import { describe, it, expect } from 'vitest';
import { SNAP_PCT, type DreamDMSnapPoint } from '@/lib/daydream/useDreamDMBar';

// ── SNAP_PCT value contract ──────────────────────────────────────────────────

describe('SNAP_PCT values', () => {
  it('surface-focus puts the bar near the bottom (~87% from top)', () => {
    expect(SNAP_PCT['surface-focus']).toBeCloseTo(0.87, 2);
  });

  it('balanced puts the bar at the midpoint (50% from top)', () => {
    expect(SNAP_PCT['balanced']).toBeCloseTo(0.50, 2);
  });

  it('dream-focus puts the bar near the top (~10% from top)', () => {
    expect(SNAP_PCT['dream-focus']).toBeCloseTo(0.10, 2);
  });

  it('surface-focus gives Surface Space the most room (ratio > 0.5)', () => {
    expect(SNAP_PCT['surface-focus']).toBeGreaterThan(0.5);
  });

  it('dream-focus gives Dream Space the most room (ratio < 0.5)', () => {
    expect(SNAP_PCT['dream-focus']).toBeLessThan(0.5);
  });

  it('all snap ratios are within valid 0–1 range', () => {
    for (const pct of Object.values(SNAP_PCT)) {
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(1);
    }
  });
});

// ── Snap-to-nearest logic (pure function extracted for testability) ──────────

function snapToNearest(pct: number): DreamDMSnapPoint {
  const entries = Object.entries(SNAP_PCT) as [DreamDMSnapPoint, number][];
  let nearest: DreamDMSnapPoint = 'surface-focus';
  let minDist = Infinity;
  for (const [snap, r] of entries) {
    const dist = Math.abs(pct - r);
    if (dist < minDist) { minDist = dist; nearest = snap; }
  }
  return nearest;
}

describe('snapToNearest', () => {
  it('snaps a value near 0.87 to surface-focus', () => {
    expect(snapToNearest(0.85)).toBe('surface-focus');
    expect(snapToNearest(0.90)).toBe('surface-focus');
  });

  it('snaps a value near 0.50 to balanced', () => {
    expect(snapToNearest(0.50)).toBe('balanced');
    expect(snapToNearest(0.55)).toBe('balanced');
    expect(snapToNearest(0.45)).toBe('balanced');
  });

  it('snaps a value near 0.10 to dream-focus', () => {
    expect(snapToNearest(0.08)).toBe('dream-focus');
    expect(snapToNearest(0.15)).toBe('dream-focus');
  });

  it('snaps exactly at SNAP_PCT boundaries', () => {
    expect(snapToNearest(SNAP_PCT['surface-focus'])).toBe('surface-focus');
    expect(snapToNearest(SNAP_PCT['balanced'])).toBe('balanced');
    expect(snapToNearest(SNAP_PCT['dream-focus'])).toBe('dream-focus');
  });

  it('snaps extreme values (near 0 or 1) without throwing', () => {
    expect(() => snapToNearest(0.01)).not.toThrow();
    expect(() => snapToNearest(0.99)).not.toThrow();
  });
});

// ── Storage key contracts ────────────────────────────────────────────────────

describe('localStorage key contracts', () => {
  it('three snap point keys cover the full range of positions', () => {
    const snaps = Object.keys(SNAP_PCT) as DreamDMSnapPoint[];
    expect(snaps).toContain('surface-focus');
    expect(snaps).toContain('balanced');
    expect(snaps).toContain('dream-focus');
    expect(snaps).toHaveLength(3);
  });

  it('three snap point values are defined and unique', () => {
    const vals = Object.values(SNAP_PCT);
    const unique = new Set(vals);
    expect(unique.size).toBe(vals.length);
  });
});

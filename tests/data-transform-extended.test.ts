/**
 * tests/data-transform-extended.test.ts
 * Tests for improvements 1-5 in lib/data-transform.ts
 */

import { describe, it, expect } from 'vitest';
import {
  encodeToLedger,
  decodeFromLedger,
  normalizeBuffer,
  computeBufferStats,
  zscore,
} from '../lib/data-transform';

// ── Improvement 93 tests — encodeToLedger NaN/Infinity guard ─────────────────
describe('encodeToLedger (improvement 1)', () => {
  it('handles NaN inputs with zero output', () => {
    expect(encodeToLedger([NaN])).toEqual([0]);
  });

  it('handles Infinity inputs with zero output', () => {
    expect(encodeToLedger([Infinity, -Infinity])).toEqual([0, 0]);
  });

  it('encodes normal values correctly', () => {
    const result = encodeToLedger([1, -1, 0]);
    expect(result[0]).toBeCloseTo(Math.log1p(1));
    expect(result[1]).toBeCloseTo(-Math.log1p(1));
    expect(result[2]).toBe(0);
  });
});

// ── Improvement 94 tests — decodeFromLedger NaN/Infinity guard ───────────────
describe('decodeFromLedger (improvement 2)', () => {
  it('handles NaN inputs with zero output', () => {
    expect(decodeFromLedger([NaN])).toEqual([0]);
  });

  it('handles Infinity with zero output', () => {
    expect(decodeFromLedger([Infinity])).toEqual([0]);
  });

  it('round-trips correctly', () => {
    const original = [1, 5, -3, 10];
    const encoded = encodeToLedger(original);
    const decoded = decodeFromLedger(encoded);
    original.forEach((v, i) => expect(decoded[i]).toBeCloseTo(v, 8));
  });
});

// ── Improvement 95 tests — normalizeBuffer ────────────────────────────────────
describe('normalizeBuffer (improvement 3)', () => {
  it('normalizes to [0, 1]', () => {
    const result = normalizeBuffer([0, 5, 10]);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0.5);
    expect(result[2]).toBe(1);
  });

  it('returns zeros for constant buffer', () => {
    expect(normalizeBuffer([7, 7, 7])).toEqual([0, 0, 0]);
  });

  it('returns empty array for empty input', () => {
    expect(normalizeBuffer([])).toEqual([]);
  });
});

// ── Improvement 96 tests — computeBufferStats ─────────────────────────────────
describe('computeBufferStats (improvement 4)', () => {
  it('computes correct stats', () => {
    const stats = computeBufferStats([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(stats.count).toBe(8);
    expect(stats.mean).toBe(5);
    expect(stats.min).toBe(2);
    expect(stats.max).toBe(9);
    expect(stats.sum).toBe(40);
    expect(stats.std).toBeCloseTo(2, 0);
  });

  it('handles empty buffer', () => {
    const stats = computeBufferStats([]);
    expect(stats.count).toBe(0);
    expect(stats.mean).toBe(0);
  });

  it('ignores NaN and Infinity', () => {
    const stats = computeBufferStats([1, 2, NaN, Infinity, 3]);
    expect(stats.count).toBe(3);
    expect(stats.mean).toBe(2);
  });
});

// ── Improvement 97 tests — zscore ─────────────────────────────────────────────
describe('zscore (improvement 5)', () => {
  it('z-scores sum to approximately 0', () => {
    const scores = zscore([2, 4, 4, 4, 5, 5, 7, 9]);
    const sum = scores.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum)).toBeLessThan(0.0001);
  });

  it('returns all zeros for constant series', () => {
    expect(zscore([5, 5, 5])).toEqual([0, 0, 0]);
  });

  it('handles NaN by producing 0', () => {
    const scores = zscore([NaN, 1, 2]);
    expect(scores[0]).toBe(0);
  });
});

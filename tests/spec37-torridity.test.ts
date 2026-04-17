/**
 * tests/spec37-torridity.test.ts
 *
 * §37 Torridity Physics Constants
 * Tests the spec-exact formulas added to lib/torridity.ts.
 */

import { describe, it, expect } from 'vitest';
import {
  TORRIDITY_N,
  TORRIDITY_DP,
  TORRIDITY_LAMBDA,
  TORRIDITY_A0_PERCEPTION,
  mu,
  contentMass,
  torridityRankSpec,
  torridityRank,
  contentDecayFactor,
  decayedRank,
  throttledVisibility,
  rankFeed,
  type ContentItem,
} from '@/lib/torridity';

// ─── §37 Constants ────────────────────────────────────────────────────────────

describe('§37 Torridity constants', () => {
  it('n = 2.1', () => expect(TORRIDITY_N).toBe(2.1));
  it('ΔP = n − 2 = 0.1', () => expect(TORRIDITY_DP).toBeCloseTo(0.1, 10));
  it('λ = 1.71', () => expect(TORRIDITY_LAMBDA).toBeCloseTo(1.71, 10));
  it('a0 = 0.05', () => expect(TORRIDITY_A0_PERCEPTION).toBe(0.05));
  it('geometric series Σλ^k k=0..9 ≈ 300', () => {
    let sum = 0;
    for (let k = 0; k < 10; k++) sum += Math.pow(TORRIDITY_LAMBDA, k);
    expect(sum).toBeCloseTo(300, 0);
  });
});

// ─── §37 Interpolation function μ ────────────────────────────────────────────

describe('§37 μ(x) interpolation function', () => {
  it('μ(0) = 0', () => expect(mu(0)).toBe(0));
  it('μ(x) > 0 for x > 0', () => {
    expect(mu(0.1)).toBeGreaterThan(0);
    expect(mu(1)).toBeGreaterThan(0);
    expect(mu(100)).toBeGreaterThan(0);
  });
  it('μ(x) < 1 for all finite x (Newtonian regime approaches 1 but never reaches)', () => {
    expect(mu(1000)).toBeLessThan(1);
  });
  it('deep-MOND: μ(x) ≈ x for small x', () => {
    // For x ≪ 1: μ(x) ≈ x / (1 + x^n)^(1/n) ≈ x
    expect(mu(0.001)).toBeCloseTo(0.001, 3);
  });
  it('μ is monotonically increasing', () => {
    expect(mu(1)).toBeGreaterThan(mu(0.5));
    expect(mu(10)).toBeGreaterThan(mu(1));
  });
  it('μ(x) = x / (1 + x^n)^(1/n) — exact formula verification at x=1', () => {
    const x = 1, n = TORRIDITY_N;
    const expected = x / Math.pow(1 + Math.pow(x, n), 1 / n);
    expect(mu(1)).toBeCloseTo(expected, 10);
  });
});

// ─── §37 Content mass ────────────────────────────────────────────────────────

describe('§37 contentMass', () => {
  it('M = log(1 + buildTime·0.5 + uniqueAssets·2)', () => {
    expect(contentMass(0, 0)).toBe(0);
    expect(contentMass(2, 0)).toBeCloseTo(Math.log1p(1), 10);
    expect(contentMass(0, 1)).toBeCloseTo(Math.log1p(2), 10);
  });
  it('higher effort → higher mass', () => {
    expect(contentMass(60, 10)).toBeGreaterThan(contentMass(5, 1));
  });
});

// ─── §37 torridityRankSpec ────────────────────────────────────────────────────

describe('§37 torridityRankSpec (spec-exact)', () => {
  it('returns 0 for zero mass', () => {
    expect(torridityRankSpec(100, 0)).toBe(0);
  });
  it('returns near-zero for zero views (log1p(1)/4 is small but nonzero)', () => {
    // V = a0 * log1p(0+1) / 4 = 0.05 * ln(2) / 4 ≈ 0.0087 — small but > 0
    const r = torridityRankSpec(0, 1);
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(0.02);
  });
  it('V = a0 · log1p(views+1) / 4 drives the rank', () => {
    const views = 1000, mass = 2;
    const V    = TORRIDITY_A0_PERCEPTION * Math.log1p(views + 1) / 4;
    const rank = mu(V * mass);
    expect(torridityRankSpec(views, mass)).toBeCloseTo(rank, 10);
  });
  it('higher views → higher rank (monotonic for fixed mass)', () => {
    const m = 2;
    expect(torridityRankSpec(1000, m)).toBeGreaterThan(torridityRankSpec(100, m));
  });
  it('rank output is in [0, 1)', () => {
    const r = torridityRankSpec(1_000_000, 5);
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(1);
  });
});

// ─── §37 Content decay ───────────────────────────────────────────────────────

describe('§37 contentDecayFactor', () => {
  it('decay_factor = μ(age_hours / 24)', () => {
    const ageHours = 48;
    expect(contentDecayFactor(ageHours)).toBeCloseTo(mu(ageHours / 24), 10);
  });
  it('fresh content has near-zero decay factor', () => {
    expect(contentDecayFactor(0)).toBe(0);
  });
  it('older content has larger decay factor', () => {
    expect(contentDecayFactor(240)).toBeGreaterThan(contentDecayFactor(24));
  });
  it('decay factor approaches 1 for very old content', () => {
    expect(contentDecayFactor(100_000)).toBeGreaterThan(0.9);
  });
});

// ─── §37 decayedRank ─────────────────────────────────────────────────────────

describe('§37 decayedRank', () => {
  it('fresh content (ageHours=0) has maximum rank', () => {
    const r0 = decayedRank(500, 2, 0);
    const r24 = decayedRank(500, 2, 24);
    expect(r0).toBeGreaterThan(r24);
  });
  it('returns 0 for zero mass', () => {
    expect(decayedRank(100, 0, 10)).toBe(0);
  });
});

// ─── §37 Throttling gate ─────────────────────────────────────────────────────

describe('§37 throttledVisibility', () => {
  it('caps low-mass content to 10% of feed slots (ΔP = 0.1)', () => {
    const slots = 20;
    expect(throttledVisibility(0.5, slots)).toBe(Math.max(1, Math.floor(slots * TORRIDITY_DP)));
  });
  it('does not cap high-mass content', () => {
    expect(throttledVisibility(2.0, 20)).toBe(20);
  });
  it('minimum cap is 1 slot', () => {
    expect(throttledVisibility(0, 5)).toBe(1);
  });
});

// ─── §37 rankFeed ────────────────────────────────────────────────────────────

describe('§37 rankFeed', () => {
  const items: ContentItem[] = [
    { id: 'a', views: 1000, buildTime: 60, uniqueAssets: 10, ageHours: 1 },
    { id: 'b', views: 10,   buildTime: 0,  uniqueAssets: 0,  ageHours: 1 },
    { id: 'c', views: 500,  buildTime: 30, uniqueAssets: 5,  ageHours: 48 },
  ];

  it('returns items sorted by rank descending', () => {
    const ranked = rankFeed(items, 20);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]!.rank).toBeGreaterThanOrEqual(ranked[i]!.rank);
    }
  });

  it('includes mass, rank, visibilityCap, and decayFactor on each item', () => {
    const [first] = rankFeed(items, 20);
    expect(first).toHaveProperty('mass');
    expect(first).toHaveProperty('rank');
    expect(first).toHaveProperty('visibilityCap');
    expect(first).toHaveProperty('decayFactor');
  });

  it('high-effort item ranks first', () => {
    const ranked = rankFeed(items);
    expect(ranked[0]!.id).toBe('a');
  });
});

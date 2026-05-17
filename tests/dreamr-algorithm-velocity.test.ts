/**
 * tests/dreamr-algorithm-velocity.test.ts
 *
 * Tests for the DreamR engine upgrades layered on top of the existing
 * humanistic algorithm (without breaking any of its public contracts):
 *
 *   • computeViewVelocity   — views/hour, age-floored
 *   • scoreViewVelocity     — sqrt-cap to 1.0 around 50 v/h
 *   • dominantSignal        — picks max-weighted contribution
 *   • DREAMR_REASONS        — short phrasing for each signal
 *   • scoreDreamRPost       — exposes viewVelocity, dominantSignal, reason
 *   • rankFeed              — attaches view_velocity / dominant_signal /
 *                              dreamr_reason to every post
 */

import { describe, it, expect } from 'vitest';
import {
  computeViewVelocity,
  scoreViewVelocity,
  dominantSignal,
  DREAMR_REASONS,
  DREAMR_WEIGHTS,
  scoreDreamRPost,
  rankFeed,
  type DreamRSignals,
  type ScoredPost,
} from '@/app/dreamdmbar/_components/dreamr/algorithms/dreamrAlgorithm';

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function makePost(overrides: Partial<ScoredPost> =) {}): ScoredPost {
  return {
    id:         't',
    content:    'A genuinely thoughtful piece of writing.',
    created_at: hoursAgo(1),
    profiles:   { handle: 'creator', display_name: 'Creator', avatar_url: null },
    ...overrides,
  };
}

// -- computeViewVelocity ------------------------------------------------------

describe('computeViewVelocity', () => {
  it('returns 0 for zero or undefined views', () => {
    expect(computeViewVelocity(0, hoursAgo(1))).toBe(0);
    expect(computeViewVelocity(undefined, hoursAgo(1))).toBe(0);
  });

  it('computes views per hour for a 1h-old post', () => {
    expect(computeViewVelocity(60, hoursAgo(1))).toBeCloseTo(60, 0);
  });

  it('floors age at 0.25h to prevent runaway velocity on fresh posts', () => {
    // A 1-second-old post with 50 views must NOT report 180,000 v/h.
    const v = computeViewVelocity(50, new Date(Date.now() - 1000).toISOString());
    expect(v).toBeLessThanOrEqual(50 / 0.25 + 0.01);
  });

  it('halves with double age', () => {
    const a = computeViewVelocity(120, hoursAgo(2));
    const b = computeViewVelocity(120, hoursAgo(4));
    expect(a).toBeGreaterThan(b);
    expect(b).toBeCloseTo(a / 2, 0);
  });

  it('clamps negative views to 0', () => {
    expect(computeViewVelocity(-5, hoursAgo(1))).toBe(0);
  });
});

// -- scoreViewVelocity --------------------------------------------------------

describe('scoreViewVelocity', () => {
  it('returns 0 for zero / negative / non-finite velocity', () => {
    expect(scoreViewVelocity(0)).toBe(0);
    expect(scoreViewVelocity(-1)).toBe(0);
    expect(scoreViewVelocity(NaN)).toBe(0);
    // Infinity is treated as non-finite (defensive — never trust the caller).
    expect(scoreViewVelocity(Infinity)).toBe(0);
  });

  it('grows sub-linearly (sqrt) with velocity', () => {
    const a = scoreViewVelocity(5);
    const b = scoreViewVelocity(20);
    const c = scoreViewVelocity(50);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    // 4× velocity should be ~2× score, not 4×
    expect(b).toBeLessThan(a * 3);
  });

  it('caps at 1.0 around 50 v/h', () => {
    expect(scoreViewVelocity(50)).toBe(1.0);
    expect(scoreViewVelocity(500)).toBe(1.0);
  });

  it('always stays in [0, 1]', () => {
    for (const v of [0, 0.1, 1, 5, 25, 50, 100, 1000]) {
      const s = scoreViewVelocity(v);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });
});

// -- dominantSignal -----------------------------------------------------------

describe('dominantSignal', () => {
  function sig(overrides: Partial<DreamRSignals>): DreamRSignals {
    return {
      contentDepth:   0,
      originalMedia:  0,
      dreamenginMade: 0,
      textRichness:   0,
      freshness:      0,
      trendImpact:    0,
      ...overrides,
    };
  }

  it('returns contentDepth when only that signal is present', () => {
    expect(dominantSignal(sig({ contentDepth: 1 }))).toBe('contentDepth');
  });

  it('returns originalMedia when it dominates', () => {
    expect(dominantSignal(sig({ originalMedia: 1, freshness: 0.5 }))).toBe('originalMedia');
  });

  it('uses weighted contribution, not raw value', () => {
    // freshness has weight 0.13, originalMedia 0.22.
    // Equal raw values → originalMedia wins.
    expect(dominantSignal(sig({ originalMedia: 0.5, freshness: 0.5 }))).toBe('originalMedia');
  });

  it('a tiny but well-weighted signal can beat a smaller-weighted one', () => {
    // contentDepth weight = 0.22, trendImpact = 0.10
    // contentDepth 0.6 * 0.22 = 0.132
    // trendImpact  1.0 * 0.10 = 0.100
    expect(dominantSignal(sig({ contentDepth: 0.6, trendImpact: 1 }))).toBe('contentDepth');
  });

  it('returns one of the six known keys for any input', () => {
    const all: Array<keyof DreamRSignals> = Object.keys(DREAMR_WEIGHTS) as Array<keyof DreamRSignals>;
    for (const seed of [0.1, 0.5, 0.9]) {
      const result = dominantSignal(sig({ contentDepth: seed, freshness: seed }));
      expect(all).toContain(result);
    }
  });
});

// -- DREAMR_REASONS -----------------------------------------------------------

describe('DREAMR_REASONS', () => {
  it('has a phrase for every signal in DREAMR_WEIGHTS', () => {
    for (const k of Object.keys(DREAMR_WEIGHTS)) {
      expect(DREAMR_REASONS).toHaveProperty(k);
      expect(typeof (DREAMR_REASONS as any)[k]).toBe('string');
      expect(((DREAMR_REASONS as any)[k] as string).length).toBeGreaterThan(0);
    }
  });

  it('has no extra unknown signal keys', () => {
    const reasonKeys = Object.keys(DREAMR_REASONS).sort();
    const weightKeys = Object.keys(DREAMR_WEIGHTS).sort();
    expect(reasonKeys).toEqual(weightKeys);
  });
});

// -- scoreDreamRPost — new outputs --------------------------------------------

describe('scoreDreamRPost — transparency outputs', () => {
  it('returns viewVelocity, dominantSignal and reason', () => {
    const post = makePost({ views_count: 60, created_at: hoursAgo(1) });
    const out = scoreDreamRPost(post);
    expect(out).toHaveProperty('viewVelocity');
    expect(out).toHaveProperty('dominantSignal');
    expect(out).toHaveProperty('reason');
    expect(out.viewVelocity).toBeGreaterThan(0);
    expect(typeof out.dominantSignal).toBe('string');
    expect(out.reason.length).toBeGreaterThan(0);
  });

  it('viewVelocity is 0 for a post with no views', () => {
    const out = scoreDreamRPost(makePost({ views_count: 0 }));
    expect(out.viewVelocity).toBe(0);
  });

  it('reason matches DREAMR_REASONS[dominantSignal]', () => {
    const out = scoreDreamRPost(makePost({
      content:   Array(80).fill('genuine thoughtful writing word').join(' '),
      media_url: 'https://cdn.example.com/img.jpg',
      source:    'post',
      provider:  'dreamengin',
    }));
    expect(out.reason).toBe(DREAMR_REASONS[out.dominantSignal]);
  });

  it('a runaway-velocity post still scores higher than a slow one with same signals', () => {
    const slow = makePost({
      id: 'slow', views_count: 2, created_at: hoursAgo(8),
    });
    const fast = makePost({
      id: 'fast', views_count: 200, created_at: hoursAgo(1),
    });
    const slowScore = scoreDreamRPost(slow).score;
    const fastScore = scoreDreamRPost(fast).score;
    expect(fastScore).toBeGreaterThan(slowScore);
  });

  it('velocity bonus is bounded — does not overpower core signals', () => {
    // A spam post with massive velocity must not outrank a deeply human post
    // with negligible velocity.
    const spammyButViral = makePost({
      id:        'spam',
      content:   '#like #follow #share',
      source:    'connector',
      provider:  'twitter',
      views_count: 100000,
      created_at: hoursAgo(1),
    });
    const humanQuiet = makePost({
      id:        'human',
      content:   Array(120).fill('genuine craft writing word').join(' '),
      media_url: 'https://cdn.example.com/photo.jpg',
      source:    'post',
      provider:  'dreamengin',
      views_count: 0,
      created_at: hoursAgo(3),
    });
    expect(scoreDreamRPost(humanQuiet).score).toBeGreaterThan(
      scoreDreamRPost(spammyButViral).score,
    );
  });

  it('overall score still in [0, 100]-ish range (with small bonus)', () => {
    const out = scoreDreamRPost(makePost({ views_count: 9999, created_at: hoursAgo(0.5) }));
    expect(out.score).toBeGreaterThanOrEqual(0);
    // baseScore*0.8 ≤ 80, torridityRank*20 ≤ 20, velocityBonus ≤ 2.5
    expect(out.score).toBeLessThanOrEqual(102.5);
  });
});

// -- rankFeed — attaches new fields -------------------------------------------

describe('rankFeed — attaches transparency fields', () => {
  it('every post has dominant_signal, dreamr_reason and view_velocity', () => {
    const ranked = rankFeed([
      makePost({ id: 'a', views_count: 30, created_at: hoursAgo(2) }),
      makePost({ id: 'b', views_count: 0,  created_at: hoursAgo(2) }),
    ]);
    for (const p of ranked) {
      expect(p.dominant_signal).toBeDefined();
      expect(typeof p.dreamr_reason).toBe('string');
      expect(typeof p.view_velocity).toBe('number');
    }
  });

  it('view_velocity matches computeViewVelocity for the same inputs', () => {
    const post = makePost({ id: 'v', views_count: 100, created_at: hoursAgo(2) });
    const ranked = rankFeed([post])[0]!;
    const expected = Math.round(computeViewVelocity(100, post.created_at) * 100) / 100;
    expect(ranked.view_velocity).toBeCloseTo(expected, 1);
  });
});

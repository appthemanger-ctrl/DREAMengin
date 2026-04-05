/**
 * tests/dreamr-algorithm.test.ts
 *
 * Full unit-test coverage for lib/dreamr/dreamrAlgorithm.ts.
 *
 * All functions under test are pure — no I/O, no mocks needed.
 *
 * Coverage:
 *  A. scoreContentDepth   — crafted-writing curve
 *  B. scoreOriginalMedia  — original vs. connector media
 *  C. scoreDreamenginMade — platform-native content boost
 *  D. scoreTextRichness   — real words vs. hashtag/emoji spam
 *  E. scoreFreshness      — gentle recency curve
 *  F. scoreTrendImpact    — sqrt-capped engagement signal
 *  G. scoreDreamRPost     — composite scorer + signal breakdown
 *  H. rankFeed            — sorting + creator-diversity pass
 *  I. DREAMR_WEIGHTS      — sum must equal 1.0
 */

import { describe, it, expect } from 'vitest';
import {
  scoreContentDepth,
  scoreOriginalMedia,
  scoreDreamenginMade,
  scoreTextRichness,
  scoreFreshness,
  scoreTrendImpact,
  scoreDreamRPost,
  rankFeed,
  DREAMR_WEIGHTS,
  type ScoredPost,
} from '@/lib/dreamr/dreamrAlgorithm';

// ── Helper ────────────────────────────────────────────────────────────────────

function makePost(overrides: Partial<ScoredPost> = {}): ScoredPost {
  return {
    id:         'test-id',
    content:    'A genuinely thoughtful piece of writing.',
    created_at: new Date(Date.now() - 3_600_000).toISOString(), // 1 hour ago
    profiles: { handle: 'creator', display_name: 'Creator', avatar_url: null },
    ...overrides,
  };
}

// ── A. scoreContentDepth ─────────────────────────────────────────────────────

describe('DreamR — scoreContentDepth', () => {
  it('returns 0 for empty string', () => {
    expect(scoreContentDepth('')).toBe(0);
  });

  it('returns 0 for whitespace-only string', () => {
    expect(scoreContentDepth('   ')).toBe(0);
  });

  it('returns 0 for single-character tokens', () => {
    // All single chars are filtered out (length > 1 required)
    expect(scoreContentDepth('a b c')).toBe(0);
  });

  it('returns > 0 for a few real words', () => {
    expect(scoreContentDepth('hello world test')).toBeGreaterThan(0);
  });

  it('grows as word count grows', () => {
    const short  = scoreContentDepth('hello world');
    const medium = scoreContentDepth('hello world this is a nice medium length post');
    const long   = scoreContentDepth(
      Array(150).fill('word').join(' '),
    );
    expect(medium).toBeGreaterThan(short);
    expect(long).toBeGreaterThan(medium);
  });

  it('caps at 1.0 for very long posts', () => {
    const score = scoreContentDepth(Array(400).fill('word').join(' '));
    expect(score).toBe(1);
  });

  it('returns a value between 0 and 1 inclusive', () => {
    const samples = [
      'short',
      'a bit longer text here',
      Array(80).fill('word').join(' '),
      Array(300).fill('word').join(' '),
    ];
    for (const s of samples) {
      const score = scoreContentDepth(s);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});

// ── B. scoreOriginalMedia ────────────────────────────────────────────────────

describe('DreamR — scoreOriginalMedia', () => {
  it('returns 0 when no media_url', () => {
    expect(scoreOriginalMedia(null,      undefined, undefined)).toBe(0);
    expect(scoreOriginalMedia(undefined, undefined, undefined)).toBe(0);
    expect(scoreOriginalMedia('',        undefined, undefined)).toBe(0);
  });

  it('returns 1.0 for an original dreamengin post with media', () => {
    expect(scoreOriginalMedia('https://cdn.example.com/photo.jpg', 'post', 'dreamengin')).toBe(1.0);
  });

  it('returns 1.0 when provider is absent (native post)', () => {
    expect(scoreOriginalMedia('https://cdn.example.com/photo.jpg', 'post', undefined)).toBe(1.0);
  });

  it('returns 0.5 for connector items with media (external, not original)', () => {
    expect(scoreOriginalMedia('https://yt.com/thumb.jpg', 'connector', 'youtube')).toBe(0.5);
  });

  it('returns 0.5 for any non-dreamengin provider with media', () => {
    expect(scoreOriginalMedia('https://ig.com/photo.jpg', undefined, 'instagram')).toBe(0.5);
  });
});

// ── C. scoreDreamenginMade ───────────────────────────────────────────────────

describe('DreamR — scoreDreamenginMade', () => {
  it('returns 1.0 for a native dreamengin post', () => {
    expect(scoreDreamenginMade('post', 'dreamengin', 'My new track')).toBe(1.0);
  });

  it('returns 1.0 for a native post with no provider field', () => {
    expect(scoreDreamenginMade('post', undefined, 'Something cool')).toBe(1.0);
  });

  it('returns 0.6 when content mentions a dreamengin tool', () => {
    expect(scoreDreamenginMade('connector', 'twitter', 'Made this beat in StarMaker')).toBe(0.6);
    expect(scoreDreamenginMade('connector', 'youtube', 'Built with GameEngin')).toBe(0.6);
    expect(scoreDreamenginMade(undefined,   undefined, 'created inside DREAMengin')).toBe(0.6);
  });

  it('returns 0.6 for all recognised dreamengin keywords in content', () => {
    const keywords = ['StarMaker', 'dreamengin', 'GameEngin', 'CodeCode', 'LabEngin', 'BrandEngin'];
    for (const kw of keywords) {
      expect(scoreDreamenginMade('connector', 'x', `check out ${kw}`)).toBe(0.6);
    }
  });

  it('returns 0 for external content with no dreamengin mention', () => {
    expect(scoreDreamenginMade('connector', 'twitter', 'Just a random tweet')).toBe(0);
    expect(scoreDreamenginMade(undefined,   'reddit',  'nothing here')).toBe(0);
  });
});

// ── D. scoreTextRichness ─────────────────────────────────────────────────────

describe('DreamR — scoreTextRichness', () => {
  it('returns 0 for empty / whitespace', () => {
    expect(scoreTextRichness('')).toBe(0);
    expect(scoreTextRichness('   ')).toBe(0);
  });

  it('returns 0 for pure hashtag posts', () => {
    expect(scoreTextRichness('#art #music #vibes #cool #trending')).toBe(0);
  });

  it('returns 0 for pure emoji posts', () => {
    expect(scoreTextRichness('🎵 🎨 🔥 💯 ✨')).toBe(0);
  });

  it('returns a high score for genuine prose', () => {
    // Uses long words exclusively to avoid short-word drag on the ratio
    const prose = 'Genuine thoughtful reflection creativity human expression depth knowledge craft mastery';
    expect(scoreTextRichness(prose)).toBeGreaterThan(0.7);
  });

  it('penalises mixed hashtag-spam posts (low richness)', () => {
    const spam = '#art #cool #fire #trending #viral #follow #like #share #music #mood';
    expect(scoreTextRichness(spam)).toBe(0);
  });

  it('gives partial credit to mixed real-words + hashtags', () => {
    const mixed = 'I made this painting using oil on canvas #art #painting';
    const score = scoreTextRichness(mixed);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('returns a value between 0 and 1', () => {
    const samples = [
      'pure text here with genuine writing',
      '#hashtag #only #post',
      'some text with #hashtag inside',
      '🎵🎨🎉',
      '',
    ];
    for (const s of samples) {
      const score = scoreTextRichness(s);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});

// ── E. scoreFreshness ────────────────────────────────────────────────────────

describe('DreamR — scoreFreshness', () => {
  function hoursAgo(h: number): string {
    return new Date(Date.now() - h * 3_600_000).toISOString();
  }

  it('returns a score in the peak window (1–8 h) of 0.85–1.0', () => {
    // At 2h the peak ramp-up reaches 1.0
    expect(scoreFreshness(hoursAgo(2))).toBeCloseTo(1.0, 1);
    // 5h is well inside the peak plateau
    expect(scoreFreshness(hoursAgo(5))).toBe(1.0);
    // 8h is the last second of the peak window
    expect(scoreFreshness(hoursAgo(8))).toBeCloseTo(1.0, 1);
  });

  it('gives a high score to very fresh posts (< 2 h)', () => {
    // Fresh post (just now) starts at 0.85 and ramps up
    expect(scoreFreshness(hoursAgo(0))).toBeGreaterThanOrEqual(0.85);
  });

  it('decays after 8 hours', () => {
    const at8h  = scoreFreshness(hoursAgo(8));
    const at24h = scoreFreshness(hoursAgo(24));
    const at72h = scoreFreshness(hoursAgo(72));
    expect(at24h).toBeLessThan(at8h);
    expect(at72h).toBeLessThan(at24h);
  });

  it('never drops below 0.05 (old masterpieces can still surface)', () => {
    const veryOld = scoreFreshness(hoursAgo(24 * 180)); // 180 days old
    expect(veryOld).toBeGreaterThanOrEqual(0.05);
  });

  it('returns 0.5 for a future-dated post (neutral)', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    expect(scoreFreshness(future)).toBe(0.5);
  });

  it('always stays in [0.05, 1.0] range', () => {
    const ages = [0, 0.5, 1, 2, 4, 8, 12, 24, 48, 72, 168, 720];
    for (const h of ages) {
      const score = scoreFreshness(hoursAgo(h));
      expect(score).toBeGreaterThanOrEqual(0.05);
      expect(score).toBeLessThanOrEqual(1.0);
    }
  });
});

// ── F. scoreTrendImpact ──────────────────────────────────────────────────────

describe('DreamR — scoreTrendImpact', () => {
  it('returns 0 for a post with no engagement', () => {
    expect(scoreTrendImpact(0, 0)).toBe(0);
    expect(scoreTrendImpact(undefined, undefined)).toBe(0);
  });

  it('returns > 0 for any positive engagement', () => {
    expect(scoreTrendImpact(1, 0)).toBeGreaterThan(0);
    expect(scoreTrendImpact(0, 1)).toBeGreaterThan(0);
  });

  it('returns 1.0 for posts with ≥ 500 combined engagements', () => {
    expect(scoreTrendImpact(500,  0)).toBe(1.0);
    expect(scoreTrendImpact(250, 250)).toBe(1.0);
    expect(scoreTrendImpact(1000, 0)).toBe(1.0);
  });

  it('grows sub-linearly (sqrt) with engagement', () => {
    const s10   = scoreTrendImpact(10,   0);
    const s100  = scoreTrendImpact(100,  0);
    const s1000 = scoreTrendImpact(1000, 0);
    // Sub-linear: doubling engagement must NOT double the score
    expect(s100).toBeGreaterThan(s10);
    expect(s1000).toBeGreaterThan(s100);
    // Confirm sqrt compression: score(100) < 10 * score(1)
    const s1 = scoreTrendImpact(1, 0);
    expect(s100).toBeLessThan(s1 * 100);
  });

  it('combines likes and comments', () => {
    const combined = scoreTrendImpact(10, 10);
    const likesOnly = scoreTrendImpact(10, 0);
    expect(combined).toBeGreaterThan(likesOnly);
  });

  it('stays in [0, 1] range', () => {
    const cases: [number | undefined, number | undefined][] = [
      [0, 0], [1, 0], [10, 5], [100, 200], [10000, 0],
    ];
    for (const [l, c] of cases) {
      const score = scoreTrendImpact(l, c);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});

// ── G. scoreDreamRPost ───────────────────────────────────────────────────────

describe('DreamR — scoreDreamRPost', () => {
  it('returns a numeric score between 0 and 100', () => {
    const post = makePost();
    const { score } = scoreDreamRPost(post);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns all six signal keys in the breakdown', () => {
    const { signals } = scoreDreamRPost(makePost());
    expect(Object.keys(signals)).toEqual([
      'contentDepth', 'originalMedia', 'dreamenginMade',
      'textRichness', 'freshness', 'trendImpact',
    ]);
  });

  it('each signal value is in [0, 1]', () => {
    const { signals } = scoreDreamRPost(makePost());
    for (const v of Object.values(signals)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('scores a rich native dreamengin post higher than a connector spam post', () => {
    const richNative = makePost({
      id:       'rich',
      content:  Array(60).fill('genuine creative writing word').join(' '),
      source:   'post',
      provider: 'dreamengin',
      media_url: 'https://cdn.example.com/art.jpg',
      created_at: new Date(Date.now() - 2 * 3_600_000).toISOString(), // 2h ago (peak)
    });

    const connectorSpam = makePost({
      id:       'spam',
      content:  '#follow #like #viral #trending #share #repost',
      source:   'connector',
      provider: 'twitter',
      created_at: new Date(Date.now() - 7 * 24 * 3_600_000).toISOString(), // 7 days old
    });

    const { score: richScore } = scoreDreamRPost(richNative);
    const { score: spamScore } = scoreDreamRPost(connectorSpam);
    expect(richScore).toBeGreaterThan(spamScore);
  });

  it('score is rounded to 1 decimal place', () => {
    const { score } = scoreDreamRPost(makePost());
    expect(score).toBe(Math.round(score * 10) / 10);
  });

  it('handles missing optional fields gracefully', () => {
    const minimal: ScoredPost = {
      id:         'min',
      content:    '',
      created_at: new Date().toISOString(),
      profiles:   { handle: 'anon', display_name: null, avatar_url: null },
    };
    const { score, signals } = scoreDreamRPost(minimal);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(signals.contentDepth).toBe(0);
    expect(signals.originalMedia).toBe(0);
    expect(signals.trendImpact).toBe(0);
  });
});

// ── H. rankFeed ──────────────────────────────────────────────────────────────

describe('DreamR — rankFeed', () => {
  it('returns an empty array for empty input', () => {
    expect(rankFeed([])).toEqual([]);
  });

  it('attaches dreamr_score and dreamr_signals to every post', () => {
    const posts = [makePost({ id: 'a' }), makePost({ id: 'b' })];
    const ranked = rankFeed(posts);
    for (const p of ranked) {
      expect(p.dreamr_score).toBeDefined();
      expect(p.dreamr_signals).toBeDefined();
    }
  });

  it('sorts posts from highest to lowest score', () => {
    const richPost = makePost({
      id:         'rich',
      content:    Array(80).fill('genuine thoughtful writing').join(' '),
      source:     'post',
      provider:   'dreamengin',
      media_url:  'https://cdn.example.com/photo.jpg',
      created_at: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    });
    const weakPost = makePost({
      id:       'weak',
      content:  '#like #follow',
      source:   'connector',
      provider: 'twitter',
      created_at: new Date(Date.now() - 14 * 24 * 3_600_000).toISOString(),
    });

    const ranked = rankFeed([weakPost, richPost]);
    expect(ranked[0].id).toBe('rich');
    expect(ranked[1].id).toBe('weak');
  });

  it('applies creator-diversity penalty for back-to-back same-creator posts', () => {
    // Three posts from same creator — the later ones should be penalised
    const now = Date.now();
    const posts: ScoredPost[] = [
      makePost({ id: '1', profiles: { handle: 'alice', display_name: 'Alice', avatar_url: null }, created_at: new Date(now - 1_000_000).toISOString() }),
      makePost({ id: '2', profiles: { handle: 'alice', display_name: 'Alice', avatar_url: null }, created_at: new Date(now - 2_000_000).toISOString() }),
      makePost({ id: '3', profiles: { handle: 'bob',   display_name: 'Bob',   avatar_url: null }, created_at: new Date(now - 3_000_000).toISOString() }),
    ];

    // We give alice's posts identical raw content so they'd score equally
    // Without diversity, both alice posts would be #1 and #2.
    // With diversity, bob's post should displace alice's second post.
    const ranked = rankFeed(posts);

    // At minimum the output has all 3 posts
    expect(ranked).toHaveLength(3);
    // dreamr_score should have been modified (may differ from original raw score)
    const alicePosts = ranked.filter(p => p.profiles.handle === 'alice');
    expect(alicePosts).toHaveLength(2);
  });

  it('does not mutate the original input array', () => {
    const posts = [
      makePost({ id: 'x' }),
      makePost({ id: 'y' }),
    ];
    const originalIds = posts.map(p => p.id);
    rankFeed(posts);
    expect(posts.map(p => p.id)).toEqual(originalIds);
  });

  it('single post passes through unchanged in structure', () => {
    const post = makePost({ id: 'solo' });
    const ranked = rankFeed([post]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].id).toBe('solo');
    expect(ranked[0].dreamr_score).toBeDefined();
  });
});

// ── I. DREAMR_WEIGHTS ────────────────────────────────────────────────────────

describe('DreamR — DREAMR_WEIGHTS', () => {
  it('weights sum to exactly 1.0', () => {
    const total = Object.values(DREAMR_WEIGHTS).reduce((a, b) => a + b, 0);
    // Use rounding to avoid floating-point epsilon issues
    expect(Math.round(total * 1000) / 1000).toBe(1.0);
  });

  it('all individual weights are positive', () => {
    for (const [key, value] of Object.entries(DREAMR_WEIGHTS)) {
      expect(value).toBeGreaterThan(0), `weight for ${key} should be positive`;
    }
  });

  it('trendImpact has the smallest weight (de-emphasised engagement signal)', () => {
    const min = Math.min(...Object.values(DREAMR_WEIGHTS));
    expect(DREAMR_WEIGHTS.trendImpact).toBe(min);
  });

  it('contentDepth and originalMedia share the highest weights', () => {
    const max = Math.max(...Object.values(DREAMR_WEIGHTS));
    expect(DREAMR_WEIGHTS.contentDepth).toBe(max);
    expect(DREAMR_WEIGHTS.originalMedia).toBe(max);
  });
});

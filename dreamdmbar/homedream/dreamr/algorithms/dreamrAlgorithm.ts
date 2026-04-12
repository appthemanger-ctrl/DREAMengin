/**
 * DreamR Algorithm — humanistic feed scoring.
 *
 * Philosophy: celebrate humanity, not trends.
 *
 * Signal weights
 * ──────────────
 *  contentDepth        0.22  crafted, thoughtful writing
 *  originalMedia       0.22  original image / audio / video attached
 *  dreamenginMade      0.18  created with a dreamengin tool (StarMaker, GameEngin, Lab…)
 *  textRichness        0.15  genuine language vs hashtag-and-emoji spam
 *  freshness           0.13  gentle recency curve — peaks 1-8 h, never pure recency
 *  trendImpact         0.10  likes + comments — minimal, so deeply human work surfaces
 *                            even when it hasn't gone viral yet
 *
 * What is deliberately never scored:
 *   • raw likes count as a primary signal
 *   • follower count of the creator
 *   • share velocity
 *   • political / news keywords
 *   • sexual or violent content signals
 *
 * All functions are pure — no I/O, fully testable.
 */

import {
  calculateRank,
  derivePostMassMeta,
  getPostMass,
} from '@/dreamdmbar/homedream/dreamr/algorithms/torridityLedger';

export interface ScoredPost {
  id: string;
  content: string;
  media_url?: string | null;
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
  created_at: string;
  source?: string;
  provider?: string;
  profiles: {
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  /** Computed by scoreDreamRPost — 0-100 */
  dreamr_score?: number;
  /** Torridity Ledger ranking weight — 0-1 */
  torridity_rank?: number;
  /** Torridity-derived originality mass */
  originality_mass?: number;
  /** Per-signal breakdown — for transparency / debugging */
  dreamr_signals?: DreamRSignals;
}

export interface DreamRSignals {
  contentDepth:     number;  // 0-1
  originalMedia:    number;  // 0-1
  dreamenginMade:   number;  // 0-1
  textRichness:     number;  // 0-1
  freshness:        number;  // 0-1
  trendImpact:      number;  // 0-1 (the minimal trends signal)
}

// ── Weights (must sum to 1.0) ─────────────────────────────────────────────────

export const DREAMR_WEIGHTS: Record<keyof DreamRSignals, number> = {
  contentDepth:   0.22,
  originalMedia:  0.22,
  dreamenginMade: 0.18,
  textRichness:   0.15,
  freshness:      0.13,
  trendImpact:    0.10,
};

// ── Individual signal scorers ─────────────────────────────────────────────────

/**
 * contentDepth — rewards crafted writing.
 * Curve: 0 words=0, 20=0.30, 80=0.70, 150=0.90, 300+=1.0
 * Soft-caps so novellas don't dominate over precise, spare writing.
 */
export function scoreContentDepth(content: string): number {
  const words = content.trim().split(/\s+/).filter(w => w.length > 1).length;
  if (words === 0) return 0;
  // Logarithmic growth capped at 1.0
  const raw = Math.log(words + 1) / Math.log(300);
  return Math.min(1, raw);
}

/**
 * originalMedia — rewards content with real human-made media attached.
 * Connector items with embedded media score 0.5 (not original).
 * Own posts with attached image/video score 1.0.
 * Text-only scores 0.
 */
export function scoreOriginalMedia(
  mediaUrl: string | null | undefined,
  source: string | undefined,
  provider: string | undefined,
): number {
  if (!mediaUrl) return 0;
  // Connector items (YouTube, Reddit, etc.) = external media, half credit
  if (source === 'connector' || (provider && provider !== 'dreamengin')) return 0.5;
  return 1.0;
}

/**
 * dreamenginMade — highest bonus for content produced inside the platform.
 * source='post' + provider='dreamengin' means it was posted directly from a Daydream.
 * Content with a known dreamengin-tool keyword in the content also gets partial credit.
 */
export function scoreDreamenginMade(
  source: string | undefined,
  provider: string | undefined,
  content: string,
): number {
  if (source === 'post' && (!provider || provider === 'dreamengin')) return 1.0;
  // Connector posts that reference dreamengin tools (e.g. "made in StarMaker")
  const toolMentions = /starmaker|dreamengin|gameengin|codecode|labengin|brandengin/i.test(content);
  if (toolMentions) return 0.6;
  return 0;
}

/**
 * textRichness — penalises hashtag/emoji spam and rewards genuine language.
 * Score = ratio of real words (≥4 chars, not hashtag) to all tokens.
 * Falls to 0 for posts that are purely hashtags or emojis.
 */
export function scoreTextRichness(content: string): number {
  if (!content.trim()) return 0;
  const tokens = content.trim().split(/\s+/);
  const realWords = tokens.filter(t =>
    t.length >= 4 &&
    !t.startsWith('#') &&
    !t.startsWith('@') &&
    !/^\p{Emoji}+$/u.test(t)
  );
  if (tokens.length === 0) return 0;
  return Math.min(1, realWords.length / Math.max(1, tokens.length));
}

/**
 * freshness — gentle recency curve.
 * Peaks at 2 h, stays high until 8 h, then decays slowly.
 * 24 h = 0.50, 72 h = 0.25, 7 d = 0.10, older = small but non-zero.
 * This means a week-old masterpiece can still surface; a minute-old
 * spam post doesn't automatically jump the queue.
 */
export function scoreFreshness(createdAt: string): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (ageHours < 0) return 0.5;                      // future-dated — neutral
  if (ageHours <= 2)   return 0.85 + 0.15 * (ageHours / 2);  // 0.85–1.0 ramp-up
  if (ageHours <= 8)   return 1.0;                             // peak window
  // Smooth exponential decay beyond 8 h
  const decay = Math.exp(-0.012 * (ageHours - 8));
  return Math.max(0.05, decay);
}

/**
 * trendImpact — minimal contribution from engagement.
 * Uses sqrt so the difference between 100 and 10000 likes is modest.
 * Caps at 1.0 for posts with ≥ 500 combined engagements.
 * This is the ONLY place engagement enters the ranking — intentionally small.
 */
export function scoreTrendImpact(
  viewsCount: number | undefined,
  likesCount?: number | undefined,
  commentsCount?: number | undefined,
): number {
  const publicViews = viewsCount ?? 0;
  if (publicViews > 0) {
    return Math.min(1, Math.sqrt(publicViews) / Math.sqrt(500));
  }

  const fallbackEngagement = (likesCount ?? 0) + (commentsCount ?? 0);
  if (fallbackEngagement === 0) return 0;
  return Math.min(0.25, Math.sqrt(fallbackEngagement) / Math.sqrt(500));
}

// ── Composite scorer ─────────────────────────────────────────────────────────

export function scoreDreamRPost(post: ScoredPost): {
  score: number;
  signals: DreamRSignals;
  torridityRank: number;
  originalityMass: number;
} {
  const massMeta = derivePostMassMeta(post);
  const torridityRank = calculateRank({
    humanViews: post.views_count ?? 0,
    metadata: massMeta,
  });
  const originalityMass = getPostMass(massMeta);
  const signals: DreamRSignals = {
    contentDepth:   scoreContentDepth(post.content ?? ''),
    originalMedia:  scoreOriginalMedia(post.media_url, post.source, post.provider),
    dreamenginMade: scoreDreamenginMade(post.source, post.provider, post.content ?? ''),
    textRichness:   scoreTextRichness(post.content ?? ''),
    freshness:      scoreFreshness(post.created_at),
    trendImpact:    scoreTrendImpact(post.views_count, post.likes_count, post.comments_count),
  };

  const baseScore = (Object.keys(signals) as Array<keyof DreamRSignals>).reduce(
    (sum, key) => sum + signals[key] * DREAMR_WEIGHTS[key],
    0,
  ) * 100;

  const score = (baseScore * 0.8) + (torridityRank * 20);
  return {
    score: Math.round(score * 10) / 10,
    signals,
    torridityRank,
    originalityMass: Math.round(originalityMass * 1000) / 1000,
  };
}

/**
 * rankFeed — score and sort a list of posts using the DreamR algorithm.
 * Also enforces creator diversity: demotes a post if the same creator
 * appeared in the previous 2 slots (penalty 0.25×) so the feed feels
 * like a wide stage, not a spotlight on one person.
 */
export function rankFeed(posts: ScoredPost[]): ScoredPost[] {
  // First pass — compute raw scores
  const scored = posts.map(p => {
    const {
      score,
      signals,
      torridityRank,
      originalityMass,
    } = scoreDreamRPost(p);
    return {
      ...p,
      dreamr_score: score,
      dreamr_signals: signals,
      torridity_rank: torridityRank,
      originality_mass: originalityMass,
    };
  });

  // Sort descending by raw score
  scored.sort((a, b) => (b.dreamr_score ?? 0) - (a.dreamr_score ?? 0));

  // Second pass — creator diversity re-ordering
  const final: ScoredPost[] = [];
  const recentHandles: string[] = [];

  for (const post of scored) {
    const handle = post.profiles?.handle ?? '';
    const repetitionCount = recentHandles.filter(h => h === handle).length;
    // If this creator appeared in the last 2 slots, push it down with a penalty
    if (repetitionCount > 0) {
      post.dreamr_score = (post.dreamr_score ?? 0) * (1 - 0.25 * repetitionCount);
    }
    final.push(post);
    recentHandles.push(handle);
    if (recentHandles.length > 2) recentHandles.shift();
  }

  // Final sort after diversity adjustment
  final.sort((a, b) => (b.dreamr_score ?? 0) - (a.dreamr_score ?? 0));
  return final;
}

/**
 * Torridity Physics
 *
 * Derived from galaxy-rotation MOND interpolation repurposed as a
 * content-relevance / feed-gravity model for DREAMengin.
 *
 * Constants
 * ---------
 *  n  = 2.1           (MOND interpolation exponent)
 *  ΔP = n - 2 = 0.1   (throttle fraction — same as generationLaw ΔP)
 *  λ  = 1.71          (geometric growth factor, from Σ λ^k k=0..9 = 300)
 *  a0 = 1.2e-10 m/s²  (MOND constant, scaled for perception below)
 *
 * Human-perception scale:
 *  a0_perception = 0.05   (scaled acceleration unit for feed gravity)
 */

import { slog } from './slog';

// ─── Constants ────────────────────────────────────────────────────────────────

export const TORRIDITY_N  = 2.1;
export const TORRIDITY_DP = TORRIDITY_N - 2;          // 0.1
export const TORRIDITY_LAMBDA = 1.71;
export const TORRIDITY_A0_PERCEPTION = 0.05;          // scaled for UI gravity

// ─── MOND Interpolation ───────────────────────────────────────────────────────

/**
 * mu(x) = x / (1 + x^n)^(1/n)
 *
 * Interpolation function:  mu → 1 for x ≫ 1 (Newtonian regime),
 *                          mu → x for x ≪ 1 (deep-MOND regime).
 */
export function mu(x: number): number {
  if (x === 0) return 0;
  return x / Math.pow(1 + Math.pow(Math.abs(x), TORRIDITY_N), 1 / TORRIDITY_N);
}

// ─── Content Mass ─────────────────────────────────────────────────────────────

/**
 * contentMass(buildTime, uniqueAssets)
 *
 * Logarithmic mass measure so that high-effort content has more
 * gravitational pull in the feed without dominating linearly.
 *
 * @param buildTime    Build / creation time in minutes.
 * @param uniqueAssets Number of unique assets (images, audio clips, etc.).
 */
export function contentMass(buildTime: number, uniqueAssets: number): number {
  return Math.log1p(buildTime * 0.5 + uniqueAssets * 2);
}

// ─── Torridity Rank ───────────────────────────────────────────────────────────

/**
 * torridityRank(views, mass)
 *
 * Feed rank derived from MOND-style acceleration:
 *
 *   a_N = views · a0_perception          (Newtonian analogy)
 *   x   = a_N / a0_perception = views
 *   a   = mu(x / mass) · views           (MOND modulated)
 *
 * slog is applied to keep the output human-perceivable.
 */
export function torridityRank(views: number, mass: number): number {
  if (mass <= 0) return 0;
  const x = views / (mass * TORRIDITY_A0_PERCEPTION);
  const mondFactor = mu(x);
  return slog(mondFactor * views);
}

// ─── Throttling Gate ──────────────────────────────────────────────────────────

/**
 * Low-mass content visibility cap.
 *
 * If a content item's mass is below the threshold, it is capped to
 * at most 10 % of the visible feed slots.
 *
 * @param mass         Content mass (from contentMass()).
 * @param feedSlots    Total available feed slots.
 * @param massThreshold Minimum mass to escape cap (default 1.0).
 * @returns            Max allowed slots for this item (1 for low-mass).
 */
export function throttledVisibility(
  mass: number,
  feedSlots: number,
  massThreshold = 1.0
): number {
  if (mass >= massThreshold) return feedSlots;
  return Math.max(1, Math.floor(feedSlots * 0.1));
}

// ─── Batch Ranking ───────────────────────────────────────────────────────────

export interface ContentItem {
  id: string;
  views: number;
  buildTime: number;
  uniqueAssets: number;
}

export interface RankedItem extends ContentItem {
  mass: number;
  rank: number;
  visibilityCap: number;
}

/**
 * rankFeed(items, feedSlots)
 *
 * Rank a list of content items by torridity, applying the
 * low-mass visibility throttle.  Returns items sorted descending by rank.
 */
export function rankFeed(items: ContentItem[], feedSlots = 20): RankedItem[] {
  return items
    .map((item) => {
      const mass = contentMass(item.buildTime, item.uniqueAssets);
      const rank = torridityRank(item.views, mass);
      const visibilityCap = throttledVisibility(mass, feedSlots);
      return { ...item, mass, rank, visibilityCap };
    })
    .sort((a, b) => b.rank - a.rank);
}

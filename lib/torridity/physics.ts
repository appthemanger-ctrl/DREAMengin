/**
 * lib/torridity/physics.ts — §37 Torridity Physics Functions
 *
 * MOND-derived feed-gravity physics for DREAMengin content ranking.
 *
 * Functions:
 *   mu(x)                   — MOND interpolation
 *   contentMass(bt, ua)     — log-scaled content effort metric
 *   torridityRank(v, m)     — MOND-modulated feed rank
 *   decayFactor(ageHours)   — time-based decay via mu
 *   throttlingGate(mass, feedSlots) — low-mass content visibility cap
 */

import { n, deltaP, a0Perception } from './constants';

// ─── MOND Interpolation ───────────────────────────────────────────────────────

/**
 * mu(x)
 *
 * MOND interpolation function: x / (1 + x^n)^(1/n)
 *   mu → 1 for x ≫ 1  (Newtonian / high-engagement regime)
 *   mu → x for x ≪ 1  (deep-MOND / low-engagement regime)
 */
export function mu(x: number): number {
  if (x === 0) return 0;
  const ax = Math.abs(x);
  return ax / Math.pow(1 + Math.pow(ax, n), 1 / n);
}

// ─── Content Mass ─────────────────────────────────────────────────────────────

/**
 * contentMass(buildTime, uniqueAssets)
 *
 * Logarithmic mass measure for content effort.
 * buildTime    — creation time in minutes
 * uniqueAssets — number of unique assets (images, audio clips, etc.)
 */
export function contentMass(buildTime: number, uniqueAssets: number): number {
  return Math.log1p(buildTime * 0.5 + uniqueAssets * 2);
}

// ─── Torridity Rank ───────────────────────────────────────────────────────────

/**
 * torridityRank(views, mass)
 *
 * Feed rank derived from MOND-style acceleration:
 *   x      = views / (mass * a0Perception)
 *   factor = mu(x)
 *   rank   = log1p(factor * views)
 */
export function torridityRank(views: number, mass: number): number {
  if (mass <= 0) return 0;
  const x      = views / (mass * a0Perception);
  const factor = mu(x);
  return Math.log1p(factor * views);
}

// ─── Decay Factor ─────────────────────────────────────────────────────────────

/**
 * decayFactor(ageHours)
 *
 * Returns a decay multiplier in (0, 1] using mu(ageHours / 24).
 * Fresh content (ageHours = 0) → decayFactor = 0 (no decay).
 * Old content (ageHours >> 24) → decayFactor approaches 1 (full decay).
 *
 * Feed rank after decay: rank * (1 - decayFactor(ageHours))
 */
export function decayFactor(ageHours: number): number {
  return mu(ageHours / 24);
}

// ─── Throttling Gate ──────────────────────────────────────────────────────────

/**
 * throttlingGate(mass, feedSlots, massThreshold?)
 *
 * Low-mass content is capped to at most ΔP = 10 % of available feed slots.
 * Content with mass >= massThreshold is uncapped.
 *
 * Returns the maximum allowed slot count for this content item.
 */
export function throttlingGate(
  mass:          number,
  feedSlots:     number,
  massThreshold = 1.0,
): number {
  if (mass >= massThreshold) return feedSlots;
  return Math.max(1, Math.floor(feedSlots * deltaP));
}

// ─── Batch Ranking ───────────────────────────────────────────────────────────

export interface ContentItem {
  id:           string;
  views:        number;
  buildTime:    number;   // minutes
  uniqueAssets: number;
  ageHours?:    number;
}

export interface RankedItem extends ContentItem {
  mass:          number;
  baseRank:      number;
  decayedRank:   number;
  visibilityCap: number;
}

/**
 * rankFeed(items, feedSlots?)
 *
 * Rank a batch of content items, applying the decay factor and
 * low-mass throttling gate. Returns items sorted descending by decayedRank.
 */
export function rankFeed(items: ContentItem[], feedSlots = 20): RankedItem[] {
  return items
    .map((item: Record<string, unknown>) => {
      const mass        = contentMass(item.buildTime, item.uniqueAssets);
      const baseRank    = torridityRank(item.views, mass);
      const decay       = item.ageHours !== undefined ? decayFactor(item.ageHours) : 0;
      const decayedRank = baseRank * (1 - decay);
      const visibilityCap = throttlingGate(mass, feedSlots);
      return { ...item, mass, baseRank, decayedRank, visibilityCap };
    })
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => b.decayedRank - a.decayedRank);
}

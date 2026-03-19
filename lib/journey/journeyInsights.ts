/**
 * lib/journey/journeyInsights.ts
 *
 * Derived signal layer for the Journey Trail.
 *
 * "You need computed layers: Streaks · First-time actions · Repeated behaviors · Drop-offs.
 *  Not just dots → patterns." — DREAMengin product directive
 *
 * All functions are pure — no I/O, no React, no DOM.
 * Designed for use in JourneyTrail.tsx and future analytics surfaces.
 *
 * Terminology:
 *   "first occurrence" — the single earliest dot of a given kind in the trail.
 *   "streak"          — consecutive calendar days with at least one dot.
 *   "frequency"       — count of dots of a given kind within a rolling window.
 *   "return gap"      — a gap of ≥ GAP_DAYS between two consecutive dots
 *                       on the same surface, flagging the later one as a return.
 */

import type { JourneyDot } from '@/types/journey';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Milliseconds in one calendar day — used consistently throughout this module. */
export const MS_PER_DAY = 86_400_000;

/** Minimum gap in days between two dots of the same kind to classify as a "return". */
export const RETURN_GAP_DAYS = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Insight annotations attached to a dot.
 * All fields are optional — present only when the signal fires for that dot.
 */
export interface DotInsight {
  /** True if this is the very first dot of this kind in the trail. */
  isFirst?: boolean;
  /**
   * Number of times this dot's kind has appeared in the last 7 days
   * (including this dot). Only set when count ≥ 2.
   */
  weeklyFrequency?: number;
  /**
   * How many days elapsed since the previous dot of the same kind on the
   * same surface. Only set when gap ≥ RETURN_GAP_DAYS.
   */
  returnAfterDays?: number;
}

/** A dot plus its derived insight annotations. */
export type AnnotatedDot = JourneyDot & { insight: DotInsight };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Truncate a timestamp to midnight UTC to compare calendar days. */
function calendarDay(isoString: string): number {
  const d = new Date(isoString);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Return the IDs of dots that are the first occurrence of their kind
 * in the provided list (ordered newest-first, as the API returns).
 *
 * We scan from oldest to newest (reversed) so that "first" means temporally first.
 */
export function findFirstOccurrenceIds(dots: JourneyDot[]): Set<string> {
  const seen = new Set<string>();
  const firstIds = new Set<string>();

  // Process oldest → newest to find the earliest dot per kind
  for (const dot of [...dots].reverse()) {
    if (!seen.has(dot.kind)) {
      seen.add(dot.kind);
      firstIds.add(dot.id);
    }
  }
  return firstIds;
}

/**
 * Compute the current activity streak (consecutive calendar days with ≥ 1 dot),
 * counting backwards from today.
 *
 * Returns 0 if there are no dots or no activity today/yesterday.
 */
export function computeCurrentStreak(dots: JourneyDot[]): number {
  if (dots.length === 0) return 0;

  const activeDays = new Set(dots.map(d => calendarDay(d.created_at)));
  const todayDay   = calendarDay(new Date().toISOString());

  let streak = 0;
  let cursor = todayDay;

  while (activeDays.has(cursor)) {
    streak++;
    cursor -= MS_PER_DAY; // subtract one calendar day (UTC ms)
  }

  return streak;
}

/**
 * For each dot that falls within the last 7 days, compute how many times its
 * kind appeared in the last 7 days (rolling window ending now).
 *
 * Returns a map from dot.id → count. Only includes entries where count ≥ 2,
 * so callers can skip if the id is missing.
 *
 * Only dots from the last 7 days receive a frequency annotation — older dots
 * are not annotated because "X times this week" is meaningless for historical items.
 */
export function computeWeeklyFrequency(dots: JourneyDot[]): Map<string, number> {
  const result = new Map<string, number>();
  const now           = Date.now();
  const SEVEN_DAYS_MS = 7 * MS_PER_DAY;
  const windowStart   = now - SEVEN_DAYS_MS;

  // Only consider dots within the last 7 days
  const recentDots = dots.filter(d => new Date(d.created_at).getTime() >= windowStart);

  // Count per kind within recent window
  const kindCount = new Map<string, number>();
  for (const d of recentDots) {
    kindCount.set(d.kind, (kindCount.get(d.kind) ?? 0) + 1);
  }

  // Annotate each recent dot with the count for its kind (only if count >= 2)
  for (const d of recentDots) {
    const count = kindCount.get(d.kind) ?? 1;
    if (count >= 2) {
      result.set(d.id, count);
    }
  }

  return result;
}

/**
 * For each dot, detect if it represents a return after a gap.
 *
 * A "return" means: the same kind+surface combination previously appeared,
 * and the gap between that last appearance and this dot is ≥ RETURN_GAP_DAYS.
 *
 * Returns a map from dot.id → gap-in-days.
 * The dots are expected to be ordered newest-first (API canonical order).
 */
export function detectReturnGaps(dots: JourneyDot[]): Map<string, number> {
  const result = new Map<string, number>();
  // Track the last seen date per (kind + surface) key
  const lastSeen = new Map<string, number>();
  const GAP_MS = RETURN_GAP_DAYS * MS_PER_DAY;

  // Process oldest → newest so "previous" is always older
  for (const dot of [...dots].reverse()) {
    const key = `${dot.kind}::${dot.surface}`;
    const ts  = new Date(dot.created_at).getTime();

    if (lastSeen.has(key)) {
      const prevTs  = lastSeen.get(key)!;
      const gapMs   = ts - prevTs;
      if (gapMs >= GAP_MS) {
        const gapDays = Math.round(gapMs / MS_PER_DAY);
        result.set(dot.id, gapDays);
      }
    }

    lastSeen.set(key, ts);
  }

  return result;
}

/**
 * Annotate an array of dots with all derived insight signals.
 *
 * Returns AnnotatedDot[] in the same order as the input.
 * This is the single function JourneyTrail.tsx calls — one pass.
 */
export function annotateDotsWithInsights(dots: JourneyDot[]): AnnotatedDot[] {
  if (dots.length === 0) return [];

  const firstIds       = findFirstOccurrenceIds(dots);
  const weeklyFreqs    = computeWeeklyFrequency(dots);
  const returnGaps     = detectReturnGaps(dots);

  return dots.map(dot => {
    const insight: DotInsight = {};

    if (firstIds.has(dot.id))          insight.isFirst          = true;
    if (weeklyFreqs.has(dot.id))       insight.weeklyFrequency  = weeklyFreqs.get(dot.id);
    if (returnGaps.has(dot.id))        insight.returnAfterDays  = returnGaps.get(dot.id);

    return { ...dot, insight };
  });
}

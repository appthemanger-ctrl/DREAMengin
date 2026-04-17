/**
 * Bot Detection — Physical Turing Test
 *
 * Analyses swipe paths and view durations to discriminate human from
 * bot interaction using slog-transformed physics metrics.
 *
 * Exported API:
 *   analyzeSwipe(points)      → SwipeAnalysis
 *   tallyView(durationMs)     → ViewTally
 *   isBotSession(history)     → BotSessionResult
 */

import { slog, slogVariance, slogEntropy } from './slog';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
  /** Timestamp in ms (relative to swipe start). */
  t: number;
}

export interface SwipeAnalysis {
  /** Mean perpendicular deviation from best-fit line (px). */
  meanDeviation: number;
  /** slog-transformed velocity variance. */
  slogVelocityVariance: number;
  /** slog-transformed jerk (rate of acceleration change). */
  slogJerk: number;
  /** Shannon entropy of deviations (higher = more human). */
  deviationEntropy: number;
  /** Cross-path similarity against stored reference paths [0,1]. */
  crossSimilarity: number;
  /** Coarse-graining invariance: |mean_dev_first_half − mean_dev_second_half|. */
  coarseGrainDiff: number;
  /** Likely bot flag based on this single swipe. */
  likelyBot: boolean;
  /** Reason string for debugging. */
  reason: string;
}

export interface ViewTally {
  durationMs: number;
  /** True if the view lasted ≥ 4 000 ms without early leave. */
  counted: boolean;
}

export interface BotSessionResult {
  isBot: boolean;
  confidence: number;
  signals: string[];
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Fit a line y = mx + b through the first and last point. */
function fitLine(points: Point[]): { m: number; b: number } {
  const first = points[0];
  const last  = points[points.length - 1];
  const dx    = last.x - first.x;
  const dy    = last.y - first.y;
  if (Math.abs(dx) < 1e-6) {
    // Vertical line — use x-deviation instead
    return { m: Infinity, b: first.x };
  }
  const m = dy / dx;
  const b = first.y - m * first.x;
  return { m, b };
}

/** Perpendicular distance from point to line ax + by + c = 0. */
function perpDistance(
  p: Point,
  m: number,
  b: number,
  vertical: boolean,
  lineX: number
): number {
  if (vertical) return Math.abs(p.x - lineX);
  // Line: mx - y + b = 0
  return Math.abs(m * p.x - p.y + b) / Math.sqrt(m * m + 1);
}

/** Cosine similarity between two normalised path vectors. */
function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Resample a path to N evenly-spaced deviation values. */
function normalisePath(deviations: number[], n = 20): number[] {
  if (deviations.length === 0) return new Array(n).fill(0);
  const result: number[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i / (n - 1)) * (deviations.length - 1));
    result.push(deviations[Math.min(idx, deviations.length - 1)]);
  }
  return result;
}

// ─── In-memory swipe history for cross-similarity ────────────────────────────

const MAX_HISTORY = 5;
const swipeHistory: number[][] = [];

function updateHistory(normPath: number[]) {
  swipeHistory.push(normPath);
  if (swipeHistory.length > MAX_HISTORY) swipeHistory.shift();
}

// ─── Perfect-line trap state ──────────────────────────────────────────────────

let perfectLineStreak = 0;
let frozenUntil       = 0; // timestamp (Date.now())

// ─── analyzeSwipe ────────────────────────────────────────────────────────────

/**
 * analyzeSwipe(points)
 *
 * Analyses a single swipe gesture for bot-like characteristics.
 */
export function analyzeSwipe(points: Point[]): SwipeAnalysis {
  if (points.length < 3) {
    return {
      meanDeviation: 0,
      slogVelocityVariance: 0,
      slogJerk: 0,
      deviationEntropy: 0,
      crossSimilarity: 0,
      coarseGrainDiff: 0,
      likelyBot: false,
      reason: 'Too few points to analyse.',
    };
  }

  const { m, b } = fitLine(points);
  const vertical = m === Infinity;
  const lineX    = b; // reused as lineX when vertical

  // ── Perpendicular deviations ──
  const deviations = points.map((p) => perpDistance(p, m, b, vertical, lineX));
  const meanDev    = deviations.reduce((a, c) => a + c, 0) / deviations.length;

  // ── Coarse-graining invariance ──
  const half   = Math.floor(deviations.length / 2);
  const first  = deviations.slice(0, half);
  const second = deviations.slice(half);
  const meanFirst  = first.reduce((a, c) => a + c, 0) / (first.length || 1);
  const meanSecond = second.reduce((a, c) => a + c, 0) / (second.length || 1);
  const coarseGrainDiff = Math.abs(meanFirst - meanSecond);

  // ── Entropy ──
  const entropy = slogEntropy(deviations);

  // ── Velocity + Jerk (slog-transformed) ──
  const velocities: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const dt = points[i].t - points[i - 1].t;
    if (dt <= 0) continue;
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    velocities.push(Math.sqrt(dx * dx + dy * dy) / dt);
  }
  const slogVelVar = slogVariance(velocities);

  const jerks: number[] = [];
  for (let i = 1; i < velocities.length; i++) {
    const dt = points[i + 1] ? points[i + 1].t - points[i].t : 1;
    jerks.push(Math.abs(velocities[i] - velocities[i - 1]) / (dt || 1));
  }
  const slogJerk = jerks.length > 0 ? slog(jerks.reduce((a, c) => a + c, 0) / jerks.length) : 0;

  // ── Cross-path similarity ──
  const normPath   = normalisePath(deviations);
  let crossSim     = 0;
  if (swipeHistory.length > 0) {
    const sims = swipeHistory.map((h) => cosineSimilarity(normPath, h));
    crossSim = sims.reduce((a, c) => a + c, 0) / sims.length;
  }
  updateHistory(normPath);

  // ── Perfect-line trap ──
  const now = Date.now();
  if (now < frozenUntil) {
    return {
      meanDeviation: meanDev,
      slogVelocityVariance: slogVelVar,
      slogJerk,
      deviationEntropy: entropy,
      crossSimilarity: crossSim,
      coarseGrainDiff,
      likelyBot: true,
      reason: 'Session frozen — perfect-line trap triggered.',
    };
  }

  if (meanDev < 1.5) {
    perfectLineStreak++;
    if (perfectLineStreak >= 2) {
      // Freeze for 3–5 s
      frozenUntil = now + 3000 + Math.random() * 2000;
      return {
        meanDeviation: meanDev,
        slogVelocityVariance: slogVelVar,
        slogJerk,
        deviationEntropy: entropy,
        crossSimilarity: crossSim,
        coarseGrainDiff,
        likelyBot: true,
        reason: 'Perfect-line streak ≥ 2 — bot flagged and session frozen.',
      };
    }
  } else {
    perfectLineStreak = 0;
  }

  // ── Decision ──
  const signals: string[] = [];
  let botScore = 0;

  if (meanDev < 0.8)              { botScore++; signals.push(`meanDev ${meanDev.toFixed(2)} < 0.8`); }
  if (crossSim > 0.95)            { botScore++; signals.push(`crossSim ${crossSim.toFixed(2)} > 0.95`); }
  if (coarseGrainDiff > 0.15)     { botScore++; signals.push(`coarseGrainDiff ${coarseGrainDiff.toFixed(2)} > 0.15`); }
  if (entropy < 0.5)              { botScore++; signals.push(`entropy ${entropy.toFixed(2)} < 0.5`); }
  if (slogVelVar < 0.3)           { botScore++; signals.push(`slogVelVar ${slogVelVar.toFixed(2)} < 0.3`); }

  const likelyBot = botScore >= 3;

  return {
    meanDeviation: meanDev,
    slogVelocityVariance: slogVelVar,
    slogJerk,
    deviationEntropy: entropy,
    crossSimilarity: crossSim,
    coarseGrainDiff,
    likelyBot,
    reason: likelyBot
      ? `Bot signals: ${signals.join('; ')}`
      : 'Human-like swipe.',
  };
}

// ─── tallyView ───────────────────────────────────────────────────────────────

/**
 * tallyView(durationMs)
 *
 * Returns whether a card view counts as a genuine engagement.
 * 4 000 ms minimum — timer should be cancelled by the caller if user
 * navigates away before calling tallyView.
 */
export function tallyView(durationMs: number): ViewTally {
  return {
    durationMs,
    counted: durationMs >= 4000,
  };
}

// ─── isBotSession ────────────────────────────────────────────────────────────

export interface SwipeRecord {
  analysis: SwipeAnalysis;
  viewTally?: ViewTally;
}

/**
 * isBotSession(history)
 *
 * Aggregates a session's swipe + view history to produce a final
 * bot-probability estimate.
 */
export function isBotSession(history: SwipeRecord[]): BotSessionResult {
  if (history.length === 0) {
    return { isBot: false, confidence: 0, signals: ['No history.'] };
  }

  const signals: string[] = [];

  const botSwipes     = history.filter((r) => r.analysis.likelyBot).length;
  const botSwipeRatio = botSwipes / history.length;

  if (botSwipeRatio > 0.6) signals.push(`${Math.round(botSwipeRatio * 100)}% bot swipes`);

  const avgDeviation =
    history.reduce((a, r) => a + r.analysis.meanDeviation, 0) / history.length;
  if (avgDeviation < 0.8) signals.push(`avg deviation ${avgDeviation.toFixed(2)} < 0.8`);

  const avgCrossSim =
    history.reduce((a, r) => a + r.analysis.crossSimilarity, 0) / history.length;
  if (avgCrossSim > 0.95) signals.push(`avg crossSim ${avgCrossSim.toFixed(2)} > 0.95`);

  const viewedRecords = history.filter((r) => r.viewTally !== undefined);
  if (viewedRecords.length > 0) {
    const countedViews = viewedRecords.filter((r) => r.viewTally!.counted).length;
    const viewRatio    = countedViews / viewedRecords.length;
    if (viewRatio < 0.2) signals.push(`only ${Math.round(viewRatio * 100)}% views ≥ 4s`);
  }

  const confidence = Math.min(1, signals.length / 3);
  const isBot      = confidence >= 0.67 || (frozenUntil > Date.now());

  return { isBot, confidence, signals };
}

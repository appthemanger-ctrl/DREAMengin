/**
 * botDetector — Physical Turing Test for DreamR swipe interactions.
 *
 * Analyses per-swipe touch paths using 7 bio-mechanical features to compute
 * a weighted bot-likelihood score.  A score ≥ 0.55 flags the swipe as bot.
 *
 * Feature weights (sum to 1.0):
 *   straightness   0.15 – deviation from straight line (low dev → bot)
 *   avgDevSlog     0.25 – slog-scaled average deviation (low → bot)
 *   coarseShift    0.10 – first-half vs second-half deviation difference (high → bot)
 *   crossSim       0.15 – similarity to last 5 stored paths (high → bot)
 *   entropy        0.10 – Shannon entropy of deviations (low → bot)
 *   velVar         0.15 – slog-transformed velocity variance (low → bot)
 *   jerk           0.10 – slog-transformed mean jerk (low → bot)
 *
 * Architecture: dreamdmbar/homedream/dreamr/algorithms/
 * Called by: DreamRCore before writing to torridityLedger
 */

import { slog, TORRIDITY_LEDGER_CONFIG } from './torridityLedger';

// ─── Types ──────────────────────────────────────────────────────────────────

/** A single touch sample from a swipe gesture. */
export interface TouchPoint {
  x: number;
  y: number;
  /** Timestamp in milliseconds (e.g. from PointerEvent.timeStamp). */
  t: number;
}

/** Per-feature botness scores (0 = human-like, 1 = bot-like) and summary. */
export interface SwipePathScore {
  /** 1 = perfectly straight (bot); 0 = average deviation ≥ 1.5 px (human). */
  straightness: number;
  /** slog-scaled inverse of average deviation. */
  avgDevSlog: number;
  /** Difference between first-half and second-half mean deviations (normalised). */
  coarseShift: number;
  /** Cosine similarity to stored recent paths (normalised). */
  crossSim: number;
  /** 1 − normalised Shannon entropy of deviations. */
  entropy: number;
  /** 1 − slog-normalised velocity variance. */
  velVar: number;
  /** 1 − slog-normalised mean jerk. */
  jerk: number;
  /** Weighted sum of the above (0–1). Threshold 0.55 → bot. */
  botScore: number;
  /** True when botScore ≥ TORRIDITY_LEDGER_CONFIG.botScoreThreshold (0.55). */
  isBot: boolean;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Perpendicular distances from each interior touch point to the chord
 *  connecting the first and last point of the swipe. */
function perpendicularDeviations(points: TouchPoint[]): number[] {
  if (points.length < 3) return [];
  const p0 = points[0];
  const pn = points[points.length - 1];
  const dx = pn.x - p0.x;
  const dy = pn.y - p0.y;
  const lineLen = Math.sqrt(dx * dx + dy * dy);
  if (lineLen < 1e-9) return points.slice(1, -1).map(() => 0);

  return points.slice(1, -1).map((p) => {
    const vx = p.x - p0.x;
    const vy = p.y - p0.y;
    return Math.abs(dx * vy - dy * vx) / lineLen;
  });
}

/** Normalised Shannon entropy (0–1) using 10 equal-width bins. */
function shannonEntropy(values: number[]): number {
  if (values.length === 0) return 0;
  const BINS = 10;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;
  if (range < 1e-9) return 0;

  const counts = new Array<number>(BINS).fill(0);
  for (const v of values) {
    const bin = Math.min(BINS - 1, Math.floor(((v - min) / range) * BINS));
    counts[bin]++;
  }

  const n = values.length;
  let h = 0;
  for (const c of counts) {
    if (c > 0) {
      const p = c / n;
      h -= p * Math.log2(p);
    }
  }
  return h / Math.log2(BINS);
}

/** |mean(firstHalf) − mean(secondHalf)| of the deviation array. */
function coarseGrainShift(deviations: number[]): number {
  if (deviations.length < 2) return 0;
  const half = Math.floor(deviations.length / 2);
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.abs(mean(deviations.slice(0, half)) - mean(deviations.slice(half)));
}

/**
 * Average cosine similarity between `currentPath` and each of the
 * `storedPaths` (last ≤ 5 normalised deviation arrays).
 */
function crossSwipeSimilarity(
  currentPath: number[],
  storedPaths: number[][],
): number {
  if (storedPaths.length === 0 || currentPath.length === 0) return 0;

  const normalise = (path: number[]) => {
    const maxVal = Math.max(...path, 1e-9);
    return path.map((v) => v / maxVal);
  };

  const normCurrent = normalise(currentPath);
  let totalSim = 0;

  for (const stored of storedPaths) {
    const normStored = normalise(stored);
    const len = Math.min(normCurrent.length, normStored.length);
    if (len === 0) continue;

    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let k = 0; k < len; k++) {
      dot += normCurrent[k] * normStored[k];
      magA += normCurrent[k] * normCurrent[k];
      magB += normStored[k] * normStored[k];
    }
    totalSim += magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
  }

  return totalSim / storedPaths.length;
}

/** slog-transformed velocity variance and mean jerk from touch points. */
function velocityFeatures(points: TouchPoint[]): { variance: number; jerk: number } {
  if (points.length < 2) return { variance: 0, jerk: 0 };

  const velocities: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const dt = Math.max(points[i].t - points[i - 1].t, 1);
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    velocities.push(Math.sqrt(dx * dx + dy * dy) / dt);
  }

  const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
  const rawVariance =
    velocities.reduce((acc, v) => acc + (v - mean) ** 2, 0) / velocities.length;

  let jerkSum = 0;
  for (let i = 0; i < velocities.length - 1; i++) {
    const dt = Math.max(points[i + 2].t - points[i + 1].t, 1);
    jerkSum += Math.abs(velocities[i + 1] - velocities[i]) / dt;
  }
  const avgJerk = velocities.length > 1 ? jerkSum / (velocities.length - 1) : 0;

  return { variance: slog(rawVariance), jerk: slog(avgJerk) };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Score a swipe path against the Physical Turing Test.
 *
 * @param points      Ordered touch samples for this swipe (≥ 3 recommended).
 * @param recentPaths Last ≤ 5 deviation arrays from previous swipes (optional).
 *                    Caller is responsible for maintaining and trimming the list.
 */
export function scoreSwipePath(
  points: TouchPoint[],
  recentPaths: number[][] = [],
): SwipePathScore {
  const { botScoreThreshold } = TORRIDITY_LEDGER_CONFIG;
  const deviations = perpendicularDeviations(points);
  const avgDev =
    deviations.length > 0
      ? deviations.reduce((a, b) => a + b, 0) / deviations.length
      : 0;

  // Straightness: bot swipes straight (avgDev < 0.8 px → score near 1)
  const straightness = Math.max(0, 1 - avgDev / 1.5);

  // avgDevSlog: slog-scale the average deviation; near-zero deviation → score 1
  const slogRef = slog(2.5); // slog value at avgDev = 1.5 (human threshold)
  const avgDevSlog = Math.max(0, 1 - slog(avgDev + 1) / slogRef);

  // Coarse-graining: human distributions are fractal (small shift); bot > 0.15
  const shift = coarseGrainShift(deviations);
  const coarseShift = Math.min(1, shift / 0.15);

  // Cross-swipe similarity: identical repeated paths → high similarity → bot
  const sim = crossSwipeSimilarity(deviations, recentPaths);
  const crossSim = Math.min(1, Math.max(0, (sim - 0.85) / (TORRIDITY_LEDGER_CONFIG.crossSimThreshold - 0.85)));

  // Shannon entropy: low entropy (concentrated deviations) → bot
  const ent = shannonEntropy(deviations);
  const entropy = Math.max(0, 1 - ent / 0.7);

  // Velocity variance & jerk: high slog-transformed values → human
  const { variance: slogVelVar, jerk: slogJerk } = velocityFeatures(points);
  const velVar = Math.max(0, 1 - Math.min(1, slogVelVar / 0.5));
  const jerk = Math.max(0, 1 - Math.min(1, slogJerk / 0.5));

  // Weighted combination
  const botScore =
    0.15 * straightness +
    0.25 * avgDevSlog +
    0.10 * coarseShift +
    0.15 * crossSim +
    0.10 * entropy +
    0.15 * velVar +
    0.10 * jerk;

  return {
    straightness,
    avgDevSlog,
    coarseShift,
    crossSim,
    entropy,
    velVar,
    jerk,
    botScore,
    isBot: botScore >= botScoreThreshold,
  };
}

/** Convenience wrapper — returns true when the swipe path scores as bot. */
export function isSwipeBot(points: TouchPoint[], recentPaths: number[][] = []): boolean {
  return scoreSwipePath(points, recentPaths).isBot;
}

// ─── Legacy interaction-signal API (kept for backward compatibility) ─────────

export interface InteractionSignal {
  userId: string;
  videoId: string;
  action: 'view' | 'like' | 'share' | 'comment';
  timestamp: number;
  sessionDurationMs?: number;
}

/** Returns a coarse confidence score 0–1 based on timing heuristics only. */
export function scoreBotLikelihood(signal: InteractionSignal): number {
  let score = 0;
  if (signal.sessionDurationMs !== undefined && signal.sessionDurationMs < 500) {
    score += 0.5;
  }
  if (signal.action === 'share' && (signal.sessionDurationMs ?? 0) < 1000) {
    score += 0.4;
  }
  return Math.min(score, 1);
}

export function isLikelyBot(signal: InteractionSignal, threshold = 0.7): boolean {
  return scoreBotLikelihood(signal) >= threshold;
}


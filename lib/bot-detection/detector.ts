/**
 * lib/bot-detection/detector.ts — §36 BotDetector Class
 *
 * Combines all five physics metrics plus the Perfect Line Trap to
 * produce a BotScore for a user session.
 *
 * §36.3 Perfect Line Trap:
 *   If mean deviation < 1.5 px → freeze UI 3–5 s.
 *   Second consecutive perfect swipe → flag as bot.
 */

import {
  perpendicularDeviation,
  crossSwipeSimilarity,
  coarseGrainInvariance,
  deviationEntropy,
  velocityVarianceJerk,
  type Path,
} from './swipe-physics';

// --- Types --------------------------------------------------------------------

export interface SwipeRecord {
  path:       Path;
  timestamps: number[];
}

export interface BotScore {
  isBot:      boolean;
  confidence: number;   // 0–1
  flags:      string[];
}

// --- Thresholds ---------------------------------------------------------------

const PERFECT_LINE_PX        = 1.5;
const BOT_DEVIATION_PX       = 0.8;
const BOT_CROSS_SIM          = 0.95;
const BOT_COARSE_GRAIN        = 0.15;
const BOT_ENTROPY             = 0.5;
const BOT_VEL_VARIANCE        = 0.3;
const FREEZE_MIN_MS           = 3000;
const FREEZE_MAX_MS           = 5000;
const BOT_CONFIDENCE_THRESHOLD = 0.6;

// --- BotDetector -------------------------------------------------------------

export class BotDetector {
  private readonly history: SwipeRecord[] = [];
  private perfectLineStreak    = 0;
  private frozenUntilMs        = 0;

  // -- Public API -------------------------------------------------------------

  /** Add a swipe to the history. Also runs the Perfect Line Trap. */
  recordSwipe(path: Path, timestamps: number[]): 'ok' | 'freeze' | 'block' {
    const record: SwipeRecord = { path, timestamps };
    this.history.push(record);

    const dev = perpendicularDeviation(path);

    if (this.isFrozen()) return 'block';

    if (dev < PERFECT_LINE_PX) {
      this.perfectLineStreak++;
      if (this.perfectLineStreak >= 2) return 'block';

      const duration = FREEZE_MIN_MS + Math.random() * (FREEZE_MAX_MS - FREEZE_MIN_MS);
      this.frozenUntilMs = Date.now() + duration;
      return 'freeze';
    }

    this.perfectLineStreak = 0;
    return 'ok';
  }

  /** Analyse accumulated history and return a BotScore. */
  analyze(): BotScore {
    if (this.history.length === 0) {
      return { isBot: false, confidence: 0, flags: [] };
    }

    const flags: string[] = [];
    let botSignals = 0;
    const totalMetrics = 5;

    // 1. Mean perpendicular deviation
    const allPaths = this.history.map((r: Record<string, unknown>) => r.path);
    const avgDev   = allPaths.reduce(s: Record<string, unknown>, p: Record<string, unknown> => s + perpendicularDeviation(p), 0) / allPaths.length;
    if (avgDev < BOT_DEVIATION_PX) {
      botSignals++;
      flags.push(`Low deviation: ${avgDev.toFixed(2)} px (bot < ${BOT_DEVIATION_PX})`);
    }

    // 2. Cross-swipe similarity
    const crossSim = crossSwipeSimilarity(allPaths);
    if (crossSim > BOT_CROSS_SIM) {
      botSignals++;
      flags.push(`High cross-similarity: ${crossSim.toFixed(3)} (bot > ${BOT_CROSS_SIM})`);
    }

    // 3. Coarse-grain invariance (use most recent path)
    const latestPath = this.history[this.history.length - 1].path;
    const cgInv = coarseGrainInvariance(latestPath);
    if (cgInv < 1 - BOT_COARSE_GRAIN) {
      botSignals++;
      flags.push(`Low coarse-grain diff: ${cgInv.toFixed(3)}`);
    }

    // 4. Deviation entropy
    const entropy = deviationEntropy(latestPath);
    if (entropy < BOT_ENTROPY) {
      botSignals++;
      flags.push(`Low entropy: ${entropy.toFixed(3)} (bot < ${BOT_ENTROPY})`);
    }

    // 5. Velocity variance + jerk
    const latest     = this.history[this.history.length - 1];
    const { variance } = velocityVarianceJerk(latest.path, latest.timestamps);
    if (variance < BOT_VEL_VARIANCE) {
      botSignals++;
      flags.push(`Low velocity variance: ${variance.toFixed(3)} (bot < ${BOT_VEL_VARIANCE})`);
    }

    // Perfect Line Trap override
    if (this.isFrozen() || this.perfectLineStreak >= 2) {
      flags.push('Perfect Line Trap triggered');
      return { isBot: true, confidence: 1, flags };
    }

    const confidence = botSignals / totalMetrics;
    return {
      isBot:      confidence >= BOT_CONFIDENCE_THRESHOLD,
      confidence,
      flags,
    };
  }

  /** Whether the session is currently frozen due to the Perfect Line Trap. */
  isFrozen(): boolean {
    return Date.now() < this.frozenUntilMs;
  }

  /** Remaining freeze time in ms (0 if not frozen). */
  freezeRemainingMs(): number {
    return Math.max(0, this.frozenUntilMs - Date.now());
  }

  /** Reset all state (new session). */
  reset(): void {
    this.history.length      = 0;
    this.perfectLineStreak   = 0;
    this.frozenUntilMs       = 0;
  }

  get swipeCount(): number {
    return this.history.length;
  }
}

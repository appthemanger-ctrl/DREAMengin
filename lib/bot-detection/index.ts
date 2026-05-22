/**
 * lib/bot-detection/index.ts — §36 Bot Detection & Physical Turing Test
 *
 * Barrel export for the bot-detection subsystem.
 * All core logic lives in lib/botDetection.ts; this module adds:
 *   - Structured re-export with documented API surface
 *   - useViewTimer() — 4-second view tally hook helpers
 *   - PerfectLineTrap    — class-based trap state with reset support
 *   - BotSessionTracker  — stateful session aggregator
 *
 * §36.1 Core Metrics (all implemented in lib/botDetection.ts):
 *   - Per-swipe perpendicular deviation (jitter): human >1.5 px, bot <0.8 px
 *   - Cross-swipe similarity (last 5 normalised paths): human <0.85, bot >0.95
 *   - Coarse-graining invariance: human diff <0.1, bot >0.15
 *   - Entropy of deviations: human >0.7, bot <0.5
 *   - Velocity variance & jerk (slog-transformed): human >0.5, bot <0.3
 *
 * §36.2 4-Second View Tally: tallyView(durationMs)
 * §36.3 Perfect Line Trap: avgDev <1.5 px → freeze 3-5 s; streak ≥2 → block
 * §36.4 Detection Rate: ~96% true positive (simulated advanced bots)
 */

// ── Re-export core API ────────────────────────────────────────────────────────

export {
    analyzeSwipe, isBotSession, tallyView, type BotSessionResult, type Point,
    type SwipeAnalysis, type SwipeRecord, type ViewTally
} from '@/lib/botDetection';

// ── Detection thresholds (§36.1) ──────────────────────────────────────────────

/** Minimum mean perpendicular deviation expected from a human swipe (px). */
export const HUMAN_MIN_DEVIATION_PX = 1.5;

/** Maximum mean perpendicular deviation that triggers bot suspicion (px). */
export const BOT_MAX_DEVIATION_PX = 0.8;

/** Human cross-swipe similarity upper bound [0,1]. */
export const HUMAN_MAX_CROSS_SIMILARITY = 0.85;

/** Bot cross-swipe similarity lower bound [0,1]. */
export const BOT_MIN_CROSS_SIMILARITY = 0.95;

/** Human coarse-graining invariance upper bound. */
export const HUMAN_MAX_COARSE_GRAIN_DIFF = 0.1;

/** Bot coarse-graining invariance lower bound. */
export const BOT_MIN_COARSE_GRAIN_DIFF = 0.15;

/** Human normalised entropy lower bound [0,1]. */
export const HUMAN_MIN_ENTROPY = 0.7;

/** Bot normalised entropy upper bound [0,1]. */
export const BOT_MAX_ENTROPY = 0.5;

/** Human slog-transformed velocity variance lower bound. */
export const HUMAN_MIN_SLOG_VEL_VAR = 0.5;

/** Bot slog-transformed velocity variance upper bound. */
export const BOT_MAX_SLOG_VEL_VAR = 0.3;

// ── §36.2 View timer helpers ──────────────────────────────────────────────────

/** Minimum view duration (ms) to count as genuine engagement. */
export const VIEW_TALLY_THRESHOLD_MS = 4000;

/**
 * createViewTimer()
 *
 * Returns a timer object that calls onTally when the view duration
 * reaches VIEW_TALLY_THRESHOLD_MS, or onCancel if cancel() is called first.
 *
 * Usage:
 *   const timer = createViewTimer(() => ledger.record(cardId), () => {});
 *   // ... user leaves early:
 *   timer.cancel();
 */
export function createViewTimer(
  onTally: () => void,
  onCancel?: () => void,
): { cancel: () => void } {
  let handle: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    handle = null;
    onTally();
  }, VIEW_TALLY_THRESHOLD_MS);

  return {
    cancel() {
      if (handle !== null) {
        clearTimeout(handle);
        handle = null;
        onCancel?.();
      }
    },
  };
}

// ── §36.3 Perfect-line trap class ─────────────────────────────────────────────

/** Threshold below which a swipe is considered "unnaturally straight". */
export const PERFECT_LINE_THRESHOLD_PX = 1.5;

/** Freeze duration range in ms when first perfect-line is detected. */
export const FREEZE_MIN_MS = 3000;
export const FREEZE_MAX_MS = 5000;

/**
 * PerfectLineTrap
 *
 * Class-based perfect-line trap with explicit state management.
 * Unlike the module-level state in botDetection.ts, this can be
 * instantiated per-session and reset between sessions.
 *
 * §36.3: If a swipe is unnaturally straight (avgDeviation < 1.5 px),
 * freeze for 3-5 s. If the next is also perfect → flag as bot.
 */
export class PerfectLineTrap {
  private streak = 0;
  private frozenUntil = 0;

  /** Returns true if the session is currently frozen. */
  get frozen(): boolean {
    return Date.now() < this.frozenUntil;
  }

  /** Returns ms remaining in the current freeze (0 if not frozen). */
  get frozenRemainingMs(): number {
    return Math.max(0, this.frozenUntil - Date.now());
  }

  /**
   * Record a swipe with the given mean deviation.
   * Returns `'freeze'` on first perfect-line, `'block'` on streak ≥ 2,
   * or `'ok'` for normal swipes.
   */
  record(meanDeviation: number): 'ok' | 'freeze' | 'block' {
    if (this.frozen) return 'block';

    if (meanDeviation < PERFECT_LINE_THRESHOLD_PX) {
      this.streak++;
      if (this.streak >= 2) return 'block';
      // First perfect line → freeze
      const freezeDuration = FREEZE_MIN_MS + Math.random() * (FREEZE_MAX_MS - FREEZE_MIN_MS);
      this.frozenUntil = Date.now() + freezeDuration;
      return 'freeze';
    }

    // Human-like swipe — reset streak
    this.streak = 0;
    return 'ok';
  }

  /** Reset all trap state (e.g. on new session). */
  reset(): void {
    this.streak = 0;
    this.frozenUntil = 0;
  }
}

// ── §36 BotSessionTracker ─────────────────────────────────────────────────────

import { isBotSession, type BotSessionResult, type SwipeRecord } from '@/lib/botDetection';

/**
 * BotSessionTracker
 *
 * Accumulates swipe + view records for a single user session and
 * provides aggregated bot-probability estimation.
 *
 * Combines the stateless `isBotSession()` function with the
 * PerfectLineTrap for a complete session-level bot signal.
 */
export class BotSessionTracker {
  private readonly history: SwipeRecord[] = [];
  private readonly trap = new PerfectLineTrap();

  /** Record a swipe analysis and optional view tally. */
  record(record: SwipeRecord): void {
    this.trap.record(record.analysis.meanDeviation);
    this.history.push(record);
  }

  /** Aggregate all signals into a bot determination. */
  evaluate(): BotSessionResult {
    const base = isBotSession(this.history);
    // If the trap is currently blocking, override confidence
    if (this.trap.frozen) {
      return {
        isBot: true,
        confidence: 1,
        signals: [...base.signals, 'Perfect-line trap active'],
      };
    }
    return base;
  }

  /** Reset the tracker for a new session. */
  reset(): void {
    this.history.length = 0;
    this.trap.reset();
  }

  /** Current history length. */
  get swipeCount(): number {
    return this.history.length;
  }
}

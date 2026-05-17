/**
 * tests/spec36-bot-detection.test.ts
 *
 * §36 Bot Detection & Physical Turing Test
 * Tests the structured lib/bot-detection/ module.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createViewTimer,
  PerfectLineTrap,
  BotSessionTracker,
  VIEW_TALLY_THRESHOLD_MS,
  PERFECT_LINE_THRESHOLD_PX,
  HUMAN_MIN_DEVIATION_PX,
  BOT_MAX_DEVIATION_PX,
  FREEZE_MIN_MS,
  FREEZE_MAX_MS,
} from '@/lib/bot-detection/index';
import { analyzeSwipe, tallyView } from '@/lib/botDetection';

// --- §36.2 View timer --------------------------------------------------------

describe('§36.2 createViewTimer', () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it('calls onTally after VIEW_TALLY_THRESHOLD_MS (4 000 ms)', () => {
    const onTally  = vi.fn();
    const onCancel = vi.fn();
    createViewTimer(onTally, onCancel);

    vi.advanceTimersByTime(VIEW_TALLY_THRESHOLD_MS - 1);
    expect(onTally).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onTally).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('calls onCancel when cancel() is invoked before threshold', () => {
    const onTally  = vi.fn();
    const onCancel = vi.fn();
    const timer = createViewTimer(onTally, onCancel);

    vi.advanceTimersByTime(2000);
    timer.cancel();
    vi.advanceTimersByTime(5000);

    expect(onTally).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('VIEW_TALLY_THRESHOLD_MS is 4 000', () => {
    expect(VIEW_TALLY_THRESHOLD_MS).toBe(4000);
  });
});

// --- §36.3 PerfectLineTrap ---------------------------------------------------

describe('§36.3 PerfectLineTrap', () => {
  it('returns "ok" for high-deviation swipes', () => {
    const trap = new PerfectLineTrap();
    expect(trap.record(5.0)).toBe('ok');
  });

  it('returns "freeze" on first perfect-line swipe', () => {
    const trap = new PerfectLineTrap();
    const result = trap.record(0.5); // < 1.5 px threshold
    expect(result).toBe('freeze');
    expect(trap.frozen).toBe(true);
    expect(trap.frozenRemainingMs).toBeGreaterThanOrEqual(FREEZE_MIN_MS - 50);
    expect(trap.frozenRemainingMs).toBeLessThanOrEqual(FREEZE_MAX_MS + 50);
  });

  it('returns "block" when session is frozen', () => {
    const trap = new PerfectLineTrap();
    trap.record(0.5); // freeze
    expect(trap.record(5.0)).toBe('block'); // still frozen
  });

  it('resets streak and freeze on reset()', () => {
    const trap = new PerfectLineTrap();
    trap.record(0.5);
    trap.reset();
    expect(trap.frozen).toBe(false);
    expect(trap.record(5.0)).toBe('ok');
  });

  it('PERFECT_LINE_THRESHOLD_PX is 1.5', () => {
    expect(PERFECT_LINE_THRESHOLD_PX).toBe(1.5);
  });
});

// --- §36 Detection thresholds ------------------------------------------------

describe('§36.1 Detection threshold constants', () => {
  it('human min deviation is 1.5 px', () => {
    expect(HUMAN_MIN_DEVIATION_PX).toBe(1.5);
  });

  it('bot max deviation is 0.8 px', () => {
    expect(BOT_MAX_DEVIATION_PX).toBe(0.8);
  });
});

// --- §36 BotSessionTracker ---------------------------------------------------

describe('§36 BotSessionTracker', () => {
  function straightLinePoints(n = 6) {
    return Array.from({ length: n }, (_, i) => ({
      x: (i / (n - 1)) * 100,
      y: 0,
      t: (i / (n - 1)) * 100,
    }));
  }

  it('evaluates no history as not a bot', () => {
    const tracker = new BotSessionTracker();
    const result  = tracker.evaluate();
    expect(result.isBot).toBe(false);
    expect(tracker.swipeCount).toBe(0);
  });

  it('accumulates swipe records', () => {
    const tracker = new BotSessionTracker();
    const pts     = straightLinePoints();
    tracker.record({ analysis: analyzeSwipe(pts) });
    expect(tracker.swipeCount).toBe(1);
  });

  it('resets between sessions', () => {
    const tracker = new BotSessionTracker();
    tracker.record({ analysis: analyzeSwipe(straightLinePoints()) });
    tracker.reset();
    expect(tracker.swipeCount).toBe(0);
    expect(tracker.evaluate().isBot).toBe(false);
  });
});

// --- §36.2 tallyView passthrough --------------------------------------------

describe('§36.2 tallyView', () => {
  it('counts views ≥ 4 000 ms', () => {
    expect(tallyView(4000).counted).toBe(true);
    expect(tallyView(5000).counted).toBe(true);
  });

  it('does not count views < 4 000 ms', () => {
    expect(tallyView(3999).counted).toBe(false);
    expect(tallyView(0).counted).toBe(false);
  });
});

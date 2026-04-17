/**
 * lib/gameengin/unifiedLoop.ts
 *
 * UNIFIED GAME LOOP
 *
 * A single requestAnimationFrame driver that runs ALL active games in one
 * coordinated tick.  This is better than each game owning its own RAF because:
 *   - One RAF = one vsync callback = no frame-budget waste
 *   - Priority queue ensures critical systems always run first
 *   - Budget enforcement defers low-priority work when the frame is tight
 *   - Easy to pause/resume individual games without touching the RAF
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Frame budget: 16.67 ms (60 fps target)                                 │
 * │  Priority tiers:                                                        │
 * │    CRITICAL — always runs (physics, core simulation)                    │
 * │    HIGH     — runs until 100 % of budget used                          │
 * │    NORMAL   — skipped when frame is over budget                        │
 * │    LOW      — skipped when frame is > 80 % of budget                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Usage:
 *   registerGame('my-game', (dt) => tick(dt), 'HIGH');
 *   // later…
 *   unregisterGame('my-game');
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Execution priority tier for a registered game. */
export type LoopPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Target frame time in milliseconds (1000 / 60). */
const FRAME_BUDGET_MS = 1000 / 60; // 16.67 ms

/** Maximum dt cap — prevents spiral-of-death after tab wake-up. */
const MAX_DT_MS = 50;

/** Priority ordering (lower number = runs first). */
const PRIORITY_ORDER: Record<LoopPriority, number> = {
  CRITICAL: 0,
  HIGH:     1,
  NORMAL:   2,
  LOW:      3,
};

// ─── Internal state ───────────────────────────────────────────────────────────

interface GameEntry {
  readonly id: string;
  readonly tickFn: (dt: number) => void;
  readonly priority: LoopPriority;
}

/** Sorted registry of active games (CRITICAL first). */
let _entries: GameEntry[] = [];
/** Current RAF handle — 0 when the loop is stopped. */
let _rafHandle = 0;
/** Timestamp of the last tick (ms). */
let _lastTime = 0;
/** Whether the unified loop RAF is currently running. */
let _running = false;

// ─── Private helpers ──────────────────────────────────────────────────────────

function _sortEntries(): void {
  _entries.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

function _tick(now: number): void {
  // Re-schedule immediately so we keep the loop alive even if a game throws.
  _rafHandle = requestAnimationFrame(_tick);

  const rawDt = _lastTime > 0 ? now - _lastTime : FRAME_BUDGET_MS;
  _lastTime = now;

  // Cap dt to prevent physics/AI from exploding after a tab becomes visible.
  const dt = Math.min(rawDt, MAX_DT_MS);

  const frameStart = performance.now();

  for (const entry of _entries) {
    const elapsed = performance.now() - frameStart;

    // Budget gates — CRITICAL always runs; lower tiers skip when frame is tight.
    if (entry.priority === 'LOW'    && elapsed > FRAME_BUDGET_MS * 0.8) continue;
    if (entry.priority === 'NORMAL' && elapsed > FRAME_BUDGET_MS)       continue;
    // CRITICAL and HIGH run regardless (HIGH may still overshoot the budget).

    try {
      entry.tickFn(dt);
    } catch (err) {
      // One game crashing must not stop others — log and continue.
      if (typeof console !== 'undefined') {
        // eslint-disable-next-line no-console
        console.error(`[UnifiedLoop] uncaught error in game '${entry.id}':`, err);
      }
    }
  }
}

function _startLoop(): void {
  if (_running || typeof requestAnimationFrame === 'undefined') return;
  _running = true;
  _lastTime = 0;
  _rafHandle = requestAnimationFrame(_tick);
}

function _stopLoop(): void {
  if (!_running) return;
  _running = false;
  if (_rafHandle) cancelAnimationFrame(_rafHandle);
  _rafHandle = 0;
  _lastTime  = 0;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Register a game with the unified loop.
 *
 * If a game with the same `id` is already registered its entry is replaced
 * (new tickFn + priority take effect immediately).
 *
 * Starts the RAF loop automatically if it is not already running.
 *
 * @param id       - unique, stable identifier (e.g. `'rts-game'`)
 * @param tickFn   - called every frame with `dt` in **milliseconds**
 * @param priority - execution priority tier (default `'NORMAL'`)
 */
export function registerGame(
  id: string,
  tickFn: (dt: number) => void,
  priority: LoopPriority = 'NORMAL',
): void {
  // Remove any stale entry with the same id before adding the new one.
  _entries = _entries.filter(e => e.id !== id);
  _entries.push({ id, tickFn, priority });
  _sortEntries();
  _startLoop();
}

/**
 * Unregister a game from the unified loop.
 *
 * Stops the RAF loop automatically when no games remain (saves battery /
 * CPU when the user navigates away from all game views).
 *
 * @param id - the same identifier passed to `registerGame`
 */
export function unregisterGame(id: string): void {
  _entries = _entries.filter(e => e.id !== id);
  if (_entries.length === 0) _stopLoop();
}

/** Returns the number of currently-registered games. */
export function activeGameCount(): number {
  return _entries.length;
}

/**
 * Whether the unified RAF loop is currently running.
 * Useful for diagnostics.
 */
export function isLoopRunning(): boolean {
  return _running;
}

/**
 * Force-reset the loop (removes all games, cancels RAF).
 * Intended for test teardown only — do not call in production code.
 */
export function _resetLoop(): void {
  _stopLoop();
  _entries = [];
}

'use client';
/**
 * lib/gameengin/useUnifiedLoop.ts
 *
 * REACT HOOK FOR THE UNIFIED GAME LOOP
 *
 * Registers a tick function with the singleton unified RAF loop for the
 * lifetime of the calling component.
 *
 * Key design choices:
 *   • The tickFn is stored in a ref so it always captures the latest closure
 *     (fresh state / props) without causing the effect to re-run and
 *     re-register the game on every render.
 *   • The effect only re-runs when `id`, `priority`, or `active` change —
 *     not when tickFn changes.
 *   • When `active` is `false` the game is unregistered immediately (useful
 *     for pause / menu states).
 *
 * Usage:
 *   useUnifiedLoop('rts-game',  (dt) => step(dt), 'HIGH',   phase === 'playing');
 *   useUnifiedLoop('hud-anim',  (dt) => anim(dt), 'LOW',    true);
 */

import { useEffect, useRef } from 'react';
import {
  registerGame,
  unregisterGame,
  type LoopPriority,
} from './unifiedLoop';

/**
 * Register a game tick function with the unified loop for the component's
 * lifetime.
 *
 * @param id       - stable, unique game identifier (string constant)
 * @param tickFn   - function called each frame; receives `dt` in **milliseconds**
 * @param priority - execution priority (default `'NORMAL'`)
 * @param active   - when `false` the game is immediately unregistered
 *                   (useful for pausing without unmounting the component)
 */
export function useUnifiedLoop(
  id: string,
  tickFn: (dt: number) => void,
  priority: LoopPriority = 'NORMAL',
  active = true,
): void {
  // ── Stable ref so the effect closure always calls the latest tickFn ──────
  const tickRef = useRef<(dt: number) => void>(tickFn);
  // Update the ref on every render (not an effect — synchronous assignment).
  tickRef.current = tickFn;

  useEffect(() => {
    if (!active) return;

    // The stable wrapper captures tickRef (not tickFn) so it always invokes
    // the most-recent version of the callback without re-registering.
    const stableFn = (dt: number): void => {
      tickRef.current(dt);
    };

    registerGame(id, stableFn, priority);

    return (): void => {
      unregisterGame(id);
    };
  }, [id, priority, active]); // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ tickFn intentionally excluded — changes are handled via ref above.
}

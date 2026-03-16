/**
 * lib/games/hooks.ts
 *
 * Shared React hooks for canvas-based game components.
 *
 * Two patterns appear identically across 10+ game components:
 *   1. Synchronised phase state + ref — avoids stale-closure bugs in RAF loops.
 *   2. Tracked held-key Set — a single `keysRef` whose add/remove listeners
 *      are attached only while the game is active.
 *
 * These hooks extract both patterns so each game only declares its own
 * game-specific state on top of these shared primitives.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Keeps a React state value and a mutable ref in sync so that RAF loops
 * (which close over the ref) always see the current phase without
 * triggering unnecessary re-renders.
 *
 * Returns `[phase, phaseRef, setPhase]`.
 * `setPhase` updates both the state (triggering a render) and the ref.
 * The ref may also be mutated directly inside tight loops if a render is
 * triggered immediately afterward via a separate setState call.
 */
export function useGamePhase<P extends string>(
  initial: P,
): [P, React.MutableRefObject<P>, (p: P) => void] {
  const [phase, setPhaseState] = useState<P>(initial);
  const phaseRef = useRef<P>(initial);
  const setPhase = useCallback((p: P) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);
  return [phase, phaseRef, setPhase];
}

/**
 * Tracks currently held keyboard keys as a `Set<string>`.
 * Listeners are attached when `active` is `true` and removed (with the set
 * cleared) when it becomes `false`.
 *
 * The returned ref can also be mutated directly in JSX touch-button handlers
 * (e.g. `onPointerDown={() => keysRef.current.add('ArrowUp')}`).
 *
 * @param active      Whether keyboard input should be captured (typically
 *                    `phase === 'playing'`).
 * @param preventDefault  When `true`, both keydown and keyup events call
 *                    `e.preventDefault()` — useful to stop arrow-key scrolling.
 */
export function useKeySet(
  active: boolean,
  preventDefault = false,
): React.MutableRefObject<Set<string>> {
  const keysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!active) {
      keysRef.current.clear();
      return;
    }
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (preventDefault) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
      if (preventDefault) e.preventDefault();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [active, preventDefault]);
  return keysRef;
}

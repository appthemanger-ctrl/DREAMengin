'use client';
/**
 * lib/games/useAIDirector.ts
 *
 * React hook wrapping the `AIDirector` class so any game component can plug
 * in adaptive difficulty with a single import.
 *
 * The `AIDirector` (lib/gameengin/ai-director.ts) is an in-browser TensorFlow.js
 * powered system that maps player signals → a normalized challenge level (0–1).
 * Previously it was only wired manually in NeonDrift and EchoArena — this hook
 * makes it trivially composable in any game.
 *
 * Usage:
 *   const { update, level, state, ready } = useAIDirector();
 *
 *   // Inside game loop (e.g. every N frames):
 *   const directorState = update({ deaths, score, combo, avgSpeed, elapsed });
 *   const spawnRate = BASE_SPAWN_RATE * (0.5 + directorState.challengeLevel);
 *
 * The hook:
 *   1. Creates an `AIDirector` instance (stable across renders via ref).
 *   2. Calls `director.init()` once on mount — loads TF.js + warms up the backend.
 *   3. Exposes a stable `update` callback and reactive `level` / `state` values.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AIDirector, type PlayerSignals, type DirectorState } from '@/lib/gameengin/ai-director';

const DEFAULT_STATE: DirectorState = {
  challengeLevel: 0.35,
  skillTier: 'casual',
  label: '🟡 In the zone',
};

export interface AIDirectorHookResult {
  /**
   * Call every N frames with current player signals.
   * Returns the latest DirectorState synchronously (no awaiting needed).
   */
  update: (signals: PlayerSignals) => DirectorState;
  /** Normalized challenge level 0 (trivial) → 1 (maximum). */
  level: number;
  /** Latest full director state (reactive — triggers re-renders on change). */
  state: DirectorState;
  /** True once TF.js has finished loading and the director is ready. */
  ready: boolean;
}

/**
 * Stable React hook for the AI Director adaptive difficulty system.
 * Safe to call in any client component.  `update` is referentially stable.
 */
export function useAIDirector(): AIDirectorHookResult {
  const directorRef = useRef<AIDirector>(new AIDirector());
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<DirectorState>(DEFAULT_STATE);

  // Initialise TF.js once on mount
  useEffect(() => {
    directorRef.current.init().then(() => setReady(true));
  }, []);

  const update = useCallback((signals: PlayerSignals): DirectorState => {
    const next = directorRef.current.update(signals);
    // Only trigger a React re-render when the label or skill tier changes
    // (level changes every frame — we don't want to re-render every frame)
    setState(prev => {
      if (prev.label !== next.label || prev.skillTier !== next.skillTier) {
        return next;
      }
      return prev;
    });
    return next;
  }, []);

  return {
    update,
    level: state.challengeLevel,
    state,
    ready,
  };
}

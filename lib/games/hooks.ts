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
import { isWebGPUAvailable } from '@/lib/webgpu';
import {
  createPerformanceBaselineSampler,
  DE_GAME_PERFORMANCE_BASELINE,
  resolveRendererBackend,
  type GamePerformanceBaseline,
  type GameRenderMode,
} from '@/lib/games/performance-baseline';

/**
 * Listens for the global `de-game-start` CustomEvent and calls `startFn`
 * so that games auto-launch when selected from GamesHub (or when the
 * GameRemote ▶ PLAY button is pressed).
 *
 * Pass `null` to temporarily disable (e.g. while the game is already playing).
 */
export function useGameAutoStart(startFn: (() => void) | null) {
  const startFnRef = useRef(startFn);
  startFnRef.current = startFn;

  useEffect(() => {
    const handler = () => {
      if (startFnRef.current) startFnRef.current();
    };
    window.addEventListener('de-game-start', handler as EventListener);
    return () => window.removeEventListener('de-game-start', handler as EventListener);
  }, []);
}

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
    if (!active) return;
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
      keysRef.current.clear();
    };
  }, [active, preventDefault]);
  return keysRef;
}

/**
 * Returns a stable `submit(score, level?)` function that POSTs a score to
 * `/api/game-scores`.  The call is fire-and-forget — failures are silently
 * swallowed so a network hiccup never interrupts gameplay.
 *
 * The returned callback is intentionally stable (empty `useCallback` deps when
 * `game` is a string literal) so it is safe to include in `useEffect` dep arrays.
 */
export function useSubmitScore(game: string) {
  return useCallback(
    (score: number, level?: number) => {
      fetch('/api/game-scores', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ game, score, ...(level !== undefined ? { level } : {}) }),
      }).catch(() => {}); // best-effort — 401 for unauthenticated users is expected
    },
    [game],
  );
}

interface UseGamePerformanceBaselineOptions {
  active: boolean;
  gameId: string;
  renderMode: GameRenderMode;
}

export function useGamePerformanceBaseline({
  active,
  gameId,
  renderMode,
}: UseGamePerformanceBaselineOptions): GamePerformanceBaseline | null {
  const [baseline, setBaseline] = useState<GamePerformanceBaseline | null>(null);
  const runtimeSeenAtRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setBaseline(null);
      runtimeSeenAtRef.current = 0;
      return;
    }

    setBaseline(null);
    runtimeSeenAtRef.current = 0;

    let cancelled = false;
    isWebGPUAvailable().then((webgpuSupported) => {
      if (cancelled) return;
      setBaseline((prev) => ({
        fps: prev?.fps ?? 0,
        avgFps: prev?.avgFps ?? 0,
        frameMs: prev?.frameMs ?? 0,
        avgFrameMs: prev?.avgFrameMs ?? 0,
        sampleCount: prev?.sampleCount ?? 0,
        source: prev?.source ?? 'shell',
        gameId,
        renderMode,
        webgpuSupported,
        rendererBackend: prev?.rendererBackend ?? resolveRendererBackend(renderMode, webgpuSupported),
      }));
    }).catch(() => {
      if (cancelled) return;
      setBaseline((prev) => ({
        fps: prev?.fps ?? 0,
        avgFps: prev?.avgFps ?? 0,
        frameMs: prev?.frameMs ?? 0,
        avgFrameMs: prev?.avgFrameMs ?? 0,
        sampleCount: prev?.sampleCount ?? 0,
        source: prev?.source ?? 'shell',
        gameId,
        renderMode,
        webgpuSupported: false,
        rendererBackend: prev?.rendererBackend ?? resolveRendererBackend(renderMode, false),
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [active, gameId, renderMode]);

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    const sampler = createPerformanceBaselineSampler();
    let rafId = 0;

    const tick = (timestamp: number) => {
      const sample = sampler.pushFrame(timestamp);
      if (sample) {
        setBaseline((prev) => {
          if (prev?.source === 'runtime' && performance.now() - runtimeSeenAtRef.current < 1500) {
            return prev;
          }

          return {
            gameId,
            renderMode,
            rendererBackend: prev?.rendererBackend ?? resolveRendererBackend(renderMode, prev?.webgpuSupported ?? false),
            webgpuSupported: prev?.webgpuSupported ?? false,
            source: 'shell',
            ...sample,
          };
        });
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [active, gameId, renderMode]);

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    const handleBaseline = (event: Event) => {
      const detail = (event as CustomEvent<GamePerformanceBaseline>).detail;
      if (!detail || detail.gameId !== gameId) return;
      runtimeSeenAtRef.current = performance.now();
      setBaseline(detail);
    };

    window.addEventListener(DE_GAME_PERFORMANCE_BASELINE, handleBaseline as EventListener);
    return () => {
      window.removeEventListener(DE_GAME_PERFORMANCE_BASELINE, handleBaseline as EventListener);
    };
  }, [active, gameId]);

  return baseline;
}

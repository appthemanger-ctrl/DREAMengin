'use client';

/**
 * useGodTier — React hook that drives the DreamEngineGodTierSystem.
 *
 * Collects real device / runtime / UX signals and runs the orchestrator
 * every animation frame, injecting CSS custom properties onto the root
 * element so every component can respond to the current GodTierState.
 *
 * Usage:
 *   const { state, uiTokens } = useGodTier({ route: '/showcase', activeTask: 'hero_showcase' });
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    defaultDeviceSignals,
    defaultRuntimeMetrics,
    defaultUXSignals,
    DreamEngineGodTierSystem,
    getGodTierUiTokens,
    type DeviceSignals,
    type GodTierState,
    type MeshSnapshot,
    type RouteSignals,
    type RuntimeMetrics,
    type UIElementSnapshot,
    type UXSignals,
} from './godTierEngine';

export interface UseGodTierOptions {
  /** Current route path, e.g. '/showcase'. */
  route?: string;
  /** Active task label, e.g. 'hero_showcase_detail'. */
  activeTask?: string;
  /** Primary user intent description. */
  primaryIntent?: string;
  /** Next likely routes for speculative prefetch. */
  nextLikelyRoutes?: string[];
  /** Babylon mesh snapshots for this scene (optional). */
  meshes?: MeshSnapshot[];
  /** UI element snapshots for hierarchy scoring (optional). */
  ui?: UIElementSnapshot[];
  /** How often (ms) to re-run the orchestrator. Default: every rAF (~16ms). */
  tickMs?: number;
  /**
   * Enable child-safety content filtering.
   * When true the algorithm blocks adult-rated content labels.
   * Default: false.
   */
  childSafetyMode?: boolean;
}

export interface UseGodTierReturn {
  /** Latest computed GodTierState. null until first tick. */
  state: GodTierState | null;
  /** CSS classes and CSS vars from getGodTierUiTokens(). */
  uiTokens: ReturnType<typeof getGodTierUiTokens> | null;
  /** Record a pointer/tap event — updates UX signals. */
  recordTap: (kind: 'normal' | 'repeat' | 'rage' | 'dead') => void;
  /** Record a hesitation duration in ms. */
  recordHesitation: (ms: number) => void;
  /** Record a backtrack (user went back). */
  recordBacktrack: () => void;
  /** Record a correction (e.g. typo fix). */
  recordCorrection: () => void;
}

export function useGodTier(opts: UseGodTierOptions = {}): UseGodTierReturn {
  const {
    route = '/',
    activeTask = 'browse',
    primaryIntent = 'explore',
    nextLikelyRoutes = [],
    meshes = [],
    ui = [],
    childSafetyMode = false,
  } = opts;

  // ── Engine instance (stable across renders) ─────────────────────────────────
  const systemRef = useRef<DreamEngineGodTierSystem>(new DreamEngineGodTierSystem());

  // ── Device signals (computed once per mount) ─────────────────────────────────
  const deviceRef = useRef<DeviceSignals>(defaultDeviceSignals());

  // ── Runtime metrics (updated every frame) ────────────────────────────────────
  const runtimeRef = useRef<RuntimeMetrics>(defaultRuntimeMetrics());
  const frameTsRef = useRef<number>(0);
  const frameHistoryRef = useRef<number[]>([]);
  const MAX_FRAME_HISTORY = 24;

  // ── UX signals (mutated by recordX helpers) ───────────────────────────────────
  const uxRef = useRef<UXSignals>(defaultUXSignals());

  // ── State ─────────────────────────────────────────────────────────────────────
  const [state, setState] = useState<GodTierState | null>(null);
  const [uiTokens, setUiTokens] = useState<ReturnType<typeof getGodTierUiTokens> | null>(null);

  // ── Cadence: orchestrator + CSS-var write throttle ───────────────────────────
  // Setting CSS custom properties on <html> invalidates style for the entire
  // document, so we run the orchestrator at most every UPDATE_INTERVAL_MS
  // (≈4 Hz) instead of every animation frame, and only call setProperty for
  // vars whose values actually changed since the last write.
  const lastOrchTsRef = useRef<number>(0);
  const lastVarsRef = useRef<Record<string, string>>({});
  const UPDATE_INTERVAL_MS = 250;
  const lastReactUpdateRef = useRef<number>(0);

  // ── Volatile inputs into refs so the rAF callback identity stays stable ─────
  // Without this, `tick` (and the rAF effect that depends on it) re-creates
  // whenever a parent passes a new `nextLikelyRoutes`/`meshes`/`ui` array
  // literal — which silently cancels and reschedules the loop on every render.
  const inputsRef = useRef({
    route, activeTask, primaryIntent, nextLikelyRoutes, meshes, ui, childSafetyMode,
  });
  inputsRef.current = {
    route, activeTask, primaryIntent, nextLikelyRoutes, meshes, ui, childSafetyMode,
  };

  // ── Frame measurement ─────────────────────────────────────────────────────────
  const rafRef = useRef<number | null>(null);

  const tick = useCallback((ts: number) => {
    // Always measure frame time (cheap; needed for adaptive quality).
    const frameMs = frameTsRef.current === 0 ? 16.6 : ts - frameTsRef.current;
    frameTsRef.current = ts;

    const hist = frameHistoryRef.current;
    hist.push(frameMs);
    if (hist.length > MAX_FRAME_HISTORY) hist.shift();
    const avgFrameMs = hist.reduce((a, b) => a + b, 0) / hist.length;
    const dropped = hist.filter((f) => f > 20).length / hist.length;

    runtimeRef.current = {
      frameMs,
      avgFrameMs,
      cpuMs: frameMs * 0.4,
      gpuMs: frameMs * 0.5,
      droppedFrameRatio: dropped,
      inputLatencyMs: runtimeRef.current.inputLatencyMs,
      scrollVelocity: runtimeRef.current.scrollVelocity,
      pointerVelocity: runtimeRef.current.pointerVelocity,
      interactionBurst: runtimeRef.current.interactionBurst,
    };

    // Run the orchestrator + CSS-var write at most every UPDATE_INTERVAL_MS.
    if (ts - lastOrchTsRef.current >= UPDATE_INTERVAL_MS) {
      lastOrchTsRef.current = ts;

      const inputs = inputsRef.current;
      const routeSignals: RouteSignals = {
        route: inputs.route,
        activeTask: inputs.activeTask,
        primaryIntent: inputs.primaryIntent,
        nextLikelyRoutes: inputs.nextLikelyRoutes,
      };

      const next = systemRef.current.update({
        device:  deviceRef.current,
        runtime: runtimeRef.current,
        ux:      uxRef.current,
        route:   routeSignals,
        meshes:  inputs.meshes,
        ui:      inputs.ui,
        childSafetyMode: inputs.childSafetyMode,
      });

      const tokens = getGodTierUiTokens(next);

      // Diff-then-set: only call setProperty for vars whose value changed.
      // This avoids invalidating <html> style when nothing actually moved.
      // `tokens.vars` is a plain string→string map by construction
      // (see getGodTierUiTokens in godTierEngine.ts), so Object.entries is
      // safe and avoids a type assertion.
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        const prev = lastVarsRef.current;
        const nextVars: Record<string, string> = {};
        for (const [k, v] of Object.entries(tokens.vars)) {
          nextVars[k] = v;
          if (prev[k] !== v) {
            root.style.setProperty(k, v);
          }
        }
        lastVarsRef.current = nextVars;
      }

      // React state at the same cadence — no extra re-renders.
      if (ts - lastReactUpdateRef.current >= UPDATE_INTERVAL_MS) {
        lastReactUpdateRef.current = ts;
        setState(next);
        setUiTokens(tokens);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Scroll velocity tracking ───────────────────────────────────────────────
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastScrollTs = performance.now();

    const onScroll = () => {
      const now = performance.now();
      const dt  = now - lastScrollTs;
      if (dt > 0) {
        const dy = Math.abs(window.scrollY - lastScrollY);
        runtimeRef.current.scrollVelocity = dy / dt;
      }
      lastScrollY  = window.scrollY;
      lastScrollTs = now;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Pointer velocity tracking ──────────────────────────────────────────────
  useEffect(() => {
    let lastX = 0, lastY = 0, lastTs = 0;

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const dt  = now - lastTs;
      if (dt > 0 && lastTs > 0) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        runtimeRef.current.pointerVelocity = Math.sqrt(dx * dx + dy * dy) / dt;
      }
      lastX  = e.clientX;
      lastY  = e.clientY;
      lastTs = now;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // ── rAF loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    // Refresh device signals on mount
    deviceRef.current = defaultDeviceSignals();

    const start = () => {
      if (rafRef.current === null) {
        // Reset frame timer so the first measured frame after a pause/resume
        // doesn't get attributed a multi-second delta.
        frameTsRef.current = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    // Pause when the tab is backgrounded — battery discipline.
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    if (typeof document !== 'undefined' && !document.hidden) start();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      stop();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [tick]);

  // ── UX helper callbacks ────────────────────────────────────────────────────
  const recordTap = useCallback((kind: 'normal' | 'repeat' | 'rage' | 'dead') => {
    const ux = uxRef.current;
    if (kind === 'repeat') ux.repeatTapCount += 1;
    else if (kind === 'rage') ux.rageTapCount += 1;
    else if (kind === 'dead') ux.deadTapCount += 1;
    // Decay after a short window to avoid permanently penalising UX score
    setTimeout(() => {
      if (kind === 'repeat' && ux.repeatTapCount > 0) ux.repeatTapCount -= 1;
      if (kind === 'rage'   && ux.rageTapCount   > 0) ux.rageTapCount   -= 1;
      if (kind === 'dead'   && ux.deadTapCount   > 0) ux.deadTapCount   -= 1;
    }, 4000);
  }, []);

  const recordHesitation = useCallback((ms: number) => {
    uxRef.current.hesitationMs = ms;
  }, []);

  const recordBacktrack = useCallback(() => {
    uxRef.current.backtrackCount += 1;
  }, []);

  const recordCorrection = useCallback(() => {
    uxRef.current.correctionCount += 1;
  }, []);

  return { state, uiTokens, recordTap, recordHesitation, recordBacktrack, recordCorrection };
}

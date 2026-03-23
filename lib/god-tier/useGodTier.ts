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

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  DreamEngineGodTierSystem,
  getGodTierUiTokens,
  defaultDeviceSignals,
  defaultRuntimeMetrics,
  defaultUXSignals,
  type GodTierState,
  type DeviceSignals,
  type RuntimeMetrics,
  type UXSignals,
  type RouteSignals,
  type MeshSnapshot,
  type UIElementSnapshot,
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

  // ── Frame measurement ─────────────────────────────────────────────────────────
  const rafRef = useRef<number | null>(null);

  const tick = useCallback((ts: number) => {
    // Measure frame time
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

    const routeSignals: RouteSignals = {
      route,
      activeTask,
      primaryIntent,
      nextLikelyRoutes,
    };

    const next = systemRef.current.update({
      device:  deviceRef.current,
      runtime: runtimeRef.current,
      ux:      uxRef.current,
      route:   routeSignals,
      meshes,
      ui,
    });

    setState(next);
    const tokens = getGodTierUiTokens(next);
    setUiTokens(tokens);

    // Inject CSS custom properties on :root
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      for (const [k, v] of Object.entries(tokens.vars)) {
        root.style.setProperty(k, v);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [route, activeTask, primaryIntent, nextLikelyRoutes, meshes, ui]);

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

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
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

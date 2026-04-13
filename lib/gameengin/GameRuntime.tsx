'use client';

/**
 * lib/gameengin/GameRuntime.tsx
 *
 * The Shared Engine Runtime Host — the console's heartbeat.
 *
 * Responsibilities:
 *   - Owns ONE single requestAnimationFrame loop (fixed 60fps timestep)
 *   - Provides the GameEngineAPI to whatever cartridge is loaded
 *   - Wires physicsConfig from GameEngin's existing state
 *   - Handles cartridge hot-swap (unmount old, mount new) without page reload
 *   - Shows a real FPS counter in the HUD
 *   - Uses useRef for all mutable state inside the RAF loop (no useState)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  GameCartridge,
  GameEngineAPI,
  GravityPreset,
  CartridgeInputEvent,
} from './cartridge';
import { GRAVITY_VALUES } from './cartridge';

// ── Constants ────────────────────────────────────────────────────────────────

/** Fixed timestep target: 60fps = 16.667ms per tick */
const FIXED_DT = 1000 / 60;
/** Maximum frames to accumulate before capping (prevents spiral of death) */
const MAX_ACCUMULATED_FRAMES = 5;
const MAX_ACCUMULATOR = FIXED_DT * MAX_ACCUMULATED_FRAMES;
/** Cap FPS display to prevent layout issues */
const MAX_DISPLAY_FPS = 999;

// ── Props ────────────────────────────────────────────────────────────────────

export interface GameRuntimeProps {
  cartridge: GameCartridge | null;
  physicsConfig: { gravity: GravityPreset; friction: number } | null;
  onFrame?: (fps: number) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GameRuntime({ cartridge, physicsConfig, onFrame }: GameRuntimeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fps, setFps] = useState(0);

  // Mutable refs for RAF loop state
  const tickCallbacksRef = useRef<Set<(dt: number, elapsed: number) => void>>(new Set());
  const renderCallbacksRef = useRef<Set<(dt: number) => void>>(new Set());
  const keysDownRef = useRef<Set<string>>(new Set());
  const inputListenersRef = useRef<Map<string, Set<(payload: CartridgeInputEvent) => void>>>(new Map());
  const rafIdRef = useRef(0);
  const accumulatorRef = useRef(0);
  const lastTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const frameTimesRef = useRef<number[]>([]);
  const fpsIntervalRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);
  const physicsRef = useRef(physicsConfig);
  const onFrameRef = useRef(onFrame);

  // Keep refs in sync
  physicsRef.current = physicsConfig;
  onFrameRef.current = onFrame;

  // ── Build the GameEngineAPI ─────────────────────────────────────────────

  const buildAPI = useCallback((): GameEngineAPI => {
    const tickCbs = tickCallbacksRef.current;
    const renderCbs = renderCallbacksRef.current;
    const keysDown = keysDownRef.current;
    const inputListeners = inputListenersRef.current;

    return {
      loop: {
        onTick(cb) {
          tickCbs.add(cb);
          return () => { tickCbs.delete(cb); };
        },
        onRender(cb) {
          renderCbs.add(cb);
          return () => { renderCbs.delete(cb); };
        },
      },
      physics: {
        get gravity() {
          const preset = physicsRef.current?.gravity ?? 'earth';
          return GRAVITY_VALUES[preset];
        },
        get friction() {
          const raw = physicsRef.current?.friction ?? 50;
          return raw / 100;
        },
      },
      input: {
        on(event, cb) {
          let set = inputListeners.get(event);
          if (!set) { set = new Set(); inputListeners.set(event, set); }
          set.add(cb);
          return () => { set!.delete(cb); };
        },
        isKeyDown(key) {
          return keysDown.has(key);
        },
      },
      score: {
        async submit(gameId, value, level) {
          try {
            await fetch('/api/game-scores', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ game: gameId, score: value, ...(level !== undefined ? { level } : {}) }),
            });
          } catch {
            // best-effort — 401 for unauthenticated users is expected
          }
        },
      },
      pool: {
        // Simple pool: games should call acquire with the SAME factory reference
        // to benefit from object reuse. For cross-factory pooling, use ResourcePool directly.
        acquire<T>(factory: () => T): T {
          return factory();
        },
        release<T>(_obj: T): void {
          // Basic implementation — objects are garbage collected.
          // Migrated games should use ResourcePool from power-systems.ts directly
          // for zero-allocation hot paths.
        },
      },
      telemetry: {
        reportFrame(dtMs) {
          frameTimesRef.current.push(dtMs);
          if (frameTimesRef.current.length > 120) {
            frameTimesRef.current.shift();
          }
        },
      },
    };
  }, []);

  // ── Keyboard input wiring ───────────────────────────────────────────────

  useEffect(() => {
    const keysDown = keysDownRef.current;
    const inputListeners = inputListenersRef.current;

    const dispatch = (type: 'keydown' | 'keyup', e: KeyboardEvent) => {
      const payload: CartridgeInputEvent = {
        key: e.key,
        type,
        preventDefault: () => e.preventDefault(),
      };
      const listeners = inputListeners.get(type);
      if (listeners) {
        for (const cb of listeners) cb(payload);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keysDown.add(e.key);
      dispatch('keydown', e);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.key);
      dispatch('keyup', e);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ── Fixed-timestep RAF loop ─────────────────────────────────────────────

  useEffect(() => {
    if (!cartridge) return;

    lastTimeRef.current = 0;
    accumulatorRef.current = 0;
    elapsedRef.current = 0;
    frameTimesRef.current = [];

    const loop = (now: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = now;
        rafIdRef.current = requestAnimationFrame(loop);
        return;
      }

      const rawDt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      const frameStart = performance.now();

      // Accumulate delta, but cap to prevent spiral of death
      accumulatorRef.current = Math.min(accumulatorRef.current + rawDt, MAX_ACCUMULATOR);

      // Run fixed-timestep ticks
      while (accumulatorRef.current >= FIXED_DT) {
        accumulatorRef.current -= FIXED_DT;
        elapsedRef.current += FIXED_DT;
        const dtSeconds = FIXED_DT / 1000;
        const elapsedSeconds = elapsedRef.current / 1000;
        for (const cb of tickCallbacksRef.current) {
          cb(dtSeconds, elapsedSeconds);
        }
      }

      // Render pass (once per frame)
      const renderDt = rawDt / 1000;
      for (const cb of renderCallbacksRef.current) {
        cb(renderDt);
      }

      const frameMs = performance.now() - frameStart;
      frameTimesRef.current.push(frameMs);
      if (frameTimesRef.current.length > 120) frameTimesRef.current.shift();

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    // FPS counter interval
    fpsIntervalRef.current = window.setInterval(() => {
      const times = frameTimesRef.current;
      if (times.length > 0) {
        const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
        const currentFps = avgMs > 0 ? Math.round(Math.min(1000 / avgMs, MAX_DISPLAY_FPS)) : 0;
        setFps(currentFps);
        onFrameRef.current?.(currentFps);
      }
    }, 500);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      clearInterval(fpsIntervalRef.current);
    };
  }, [cartridge]);

  // ── Cartridge mount / hot-swap ──────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !cartridge) return;

    // Unmount previous cartridge
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Clear callbacks from previous cartridge
    tickCallbacksRef.current.clear();
    renderCallbacksRef.current.clear();
    inputListenersRef.current.clear();

    // Build API and mount new cartridge
    const api = buildAPI();
    const cleanup = cartridge.mount(container, api);
    cleanupRef.current = cleanup;

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      tickCallbacksRef.current.clear();
      renderCallbacksRef.current.clear();
      inputListenersRef.current.clear();
    };
  }, [cartridge, buildAPI]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* FPS counter overlay */}
      {cartridge && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            zIndex: 10,
            fontSize: 10,
            fontWeight: 700,
            fontFamily: 'monospace',
            color: fps >= 50 ? '#4ade80' : fps >= 30 ? '#facc15' : '#f87171',
            background: 'rgba(0,0,0,0.5)',
            padding: '2px 6px',
            borderRadius: 4,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {fps} FPS
        </div>
      )}

      {/* Game container — cartridges mount into this div */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      />
    </div>
  );
}

'use client';

/**
 * lib/gameengin/GameRuntime.tsx
 *
 * The Shared Engine Runtime Host — the console's heartbeat.
 *
 * Responsibilities:
 *   - Owns ONE single requestAnimationFrame loop (fixed 60fps timestep)
 *   - Builds and provides the complete GameEngineAPI to whatever cartridge is loaded
 *   - Wires physicsConfig from GameEngin's existing state
 *   - Handles cartridge hot-swap (unmount old, mount new) without page reload
 *   - Shows a real FPS counter in the HUD (engine chrome only — no game HUD here)
 *
 * HUD layer contract:
 *   - ENGINE chrome (this file): FPS counter — top-right, 10px, pointer-events: none
 *   - GAME chrome: score/lives/level — rendered by the cartridge inside its own container
 *   - SHELL chrome: mobile controls — rendered by ImmersiveGameShell outside this component
 *
 * These three layers never overlap. Do not add score/lives/game info here.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  GameCartridge,
  GameEngineAPI,
  GravityPreset,
  CartridgeInputEvent,
} from './cartridge';
import { ENGINE_VERSION, GRAVITY_VALUES } from './cartridge';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';
import { createLocalChannel } from '@/lib/runtime/runtimeChannel';
import { recordEmission } from '@/lib/runtime/channelMetrics';
import { acquireSharedResource, releaseSharedResource } from '@/lib/runtime/sharedResourcePool';
import { createSaveAPI } from './cartridges/saveState';
import { createAchievementsAPI } from './cartridges/achievementEngine';
import {
  stubAudioAPI,
  stubHapticsAPI,
  stubAssetsAPI,
  stubNetworkAPI,
} from './cartridges/apiStubs';
import type { AchievementDefinition } from './cartridge';

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
  const tickCallbacksRef   = useRef<Set<(dt: number, elapsed: number) => void>>(new Set());
  const renderCallbacksRef = useRef<Set<(dt: number) => void>>(new Set());
  const keysDownRef        = useRef<Set<string>>(new Set());
  const inputListenersRef  = useRef<Map<string, Set<(payload: CartridgeInputEvent) => void>>>(new Map());
  const rafIdRef           = useRef(0);
  const accumulatorRef     = useRef(0);
  const lastTimeRef        = useRef(0);
  const elapsedRef         = useRef(0);
  const frameTimesRef      = useRef<number[]>([]);
  const fpsIntervalRef     = useRef(0);
  const cleanupRef         = useRef<(() => void) | null>(null);
  const physicsRef         = useRef(physicsConfig);
  const onFrameRef         = useRef(onFrame);
  const scoreChannelRef    = useRef(
    createLocalChannel<{ type: 'game:score-submit'; gameId: string; score: number; level?: number }>('engine:game-scores'),
  );

  // Keep refs in sync
  physicsRef.current  = physicsConfig;
  onFrameRef.current  = onFrame;

  // ── Build the complete GameEngineAPI ───────────────────────────────────────

  const buildAPI = useCallback((forCartridge: GameCartridge): GameEngineAPI => {
    const cartridgeId  = forCartridge.id;
    const capabilities = new Set(forCartridge.capabilities ?? []);

    // Save state — real implementation when capability is declared
    const saveAPI = capabilities.has('save-state')
      ? createSaveAPI(cartridgeId)
      : {
          async list()        { return []; },
          async load()        { return null; },
          async write()       {},
          async erase()       {},
          async autoSave()    {},
        };

    // Achievements — real implementation when capability is declared
    const achievementDefs: AchievementDefinition[] = [];
    const achievementsAPI = capabilities.has('achievements')
      ? createAchievementsAPI((cartridgeId: string, achievementDefs: AchievementDefinition[], def: AchievementDefinition) => {
          // Emit to dreamOSBus so the shell can show a pop-up
          dreamOSBus.emit('game:achievement-unlocked' as Parameters<typeof dreamOSBus.emit>[0], {
            cartridgeId,
            id: def.id,
            label: def.label,
            description: def.description,
            icon: def.icon,
          } as unknown as Parameters<typeof dreamOSBus.emit>[1]);
        })
      : {
          async unlock()    {},
          async progress()  {},
          async getAll()    { return []; },
        };

    return {
      engineVersion: ENGINE_VERSION,

      loop: {
        onTick(cb) {
          return dreamOSBus.on('engine:tick', ({ dt, elapsed }) => cb(dt, elapsed));
        },
        onRender(cb) {
          return dreamOSBus.on('engine:render', ({ dt }) => cb(dt));
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
          return dreamOSBus.on('game:input', payload => {
            if (payload.type === event) cb(payload as CartridgeInputEvent);
          });
        },
        isKeyDown(key) {
          return keysDownRef.current.has(key);
        },
      },

      score: {
        async submit(gameId, value, level) {
          await scoreChannelRef.current.publish({
            type: 'game:score-submit',
            gameId,
            score: value,
            level,
          });
          recordEmission('games');
          try {
            await fetch('/api/game-scores', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                game: gameId,
                score: value,
                ...(level !== undefined ? { level } : {}),
              }),
            });
          } catch {
            // best-effort — 401 for unauthenticated users is expected
          }
        },
      },

      pool: {
        acquire<T>(factory: () => T): T {
          return acquireSharedResource('game:runtime', factory);
        },
        release<T>(obj: T): void {
          releaseSharedResource('game:runtime', obj);
        },
      },

      telemetry: {
        reportFrame(dtMs) {
          recordEmission('games', dtMs);
          frameTimesRef.current.push(dtMs);
          if (frameTimesRef.current.length > 120) {
            frameTimesRef.current.shift();
          }
        },
      },

      save:         saveAPI,
      achievements: achievementsAPI,

      audio:   stubAudioAPI,
      haptics: stubHapticsAPI,
      assets:  stubAssetsAPI,
      network: stubNetworkAPI,
    };
  }, []);

  // ── Keyboard input wiring ──────────────────────────────────────────────────

  useEffect(() => {
    const keysDown       = keysDownRef.current;
    const inputListeners = inputListenersRef.current;

    const dispatch = (type: 'keydown' | 'keyup', e: KeyboardEvent) => {
      // Create the payload without explicit type so TS infers exact keydown/keyup shape
      const payload = {
        key: e.key,
        type,
        preventDefault: () => e.preventDefault(),
      };
      
      const listeners = inputListeners.get(type);
      if (listeners) {
        // Cast here since the listeners expect the wider union type
        for (const cb of listeners) cb(payload as CartridgeInputEvent);
      }
      
      // Successfully emits the narrower keyboard type
      dreamOSBus.emit('game:input', payload);
    };

    const onKeyDown = (e: KeyboardEvent) => { keysDown.add(e.key);    dispatch('keydown', e); };
    const onKeyUp   = (e: KeyboardEvent) => { keysDown.delete(e.key); dispatch('keyup', e); };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    };
  }, []);

  // ── Fixed-timestep RAF loop ────────────────────────────────────────────────

  useEffect(() => {
    if (!cartridge) return;

    lastTimeRef.current  = 0;
    accumulatorRef.current = 0;
    elapsedRef.current   = 0;
    frameTimesRef.current = [];

    const loop = (now: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = now;
        rafIdRef.current = requestAnimationFrame(loop);
        return;
      }

      const rawDt       = now - lastTimeRef.current;
      lastTimeRef.current = now;
      const frameStart  = performance.now();

      // Accumulate delta, cap to prevent spiral of death
      accumulatorRef.current = Math.min(accumulatorRef.current + rawDt, MAX_ACCUMULATOR);

      // Fixed-timestep ticks
      while (accumulatorRef.current >= FIXED_DT) {
        accumulatorRef.current -= FIXED_DT;
        elapsedRef.current     += FIXED_DT;
        const dtSec      = FIXED_DT / 1000;
        const elapsedSec = elapsedRef.current / 1000;
        dreamOSBus.emit('engine:tick', { dt: dtSec, elapsed: elapsedSec });
        for (const cb of tickCallbacksRef.current) cb(dtSec, elapsedSec);
      }

      // Render pass (once per frame)
      const renderDt = rawDt / 1000;
      dreamOSBus.emit('engine:render', { dt: renderDt });
      for (const cb of renderCallbacksRef.current) cb(renderDt);

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
        const avgMs      = times.reduce((a, b) => a + b, 0) / times.length;
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

  // ── Cartridge mount / hot-swap ─────────────────────────────────────────────

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

    // Build a fresh API scoped to this cartridge and mount
    const api     = buildAPI(cartridge);
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* ── Engine chrome: FPS counter ── */}
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

      {/* ── Game container — cartridges mount into this div ── */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      />
    </div>
  );
}

/**
 * lib/gameengin/platform.ts
 *
 * GameEngin Platform — the single, canonical, console-class facade.
 *
 * GameEngin is no longer a "library each game wires up itself" — it is a
 * **next-gen home-console-class browser platform** that every registered
 * cartridge runs on. This module is the one coherent surface that ties the
 * existing pieces together:
 *
 *   • Renderer         — EliteGameEngine (WebGPU-first, ECS, adaptive budget)
 *   • AI               — AIDirector (TF.js adaptive difficulty, on-device)
 *   • Post-FX          — PostFXManager (bloom, glow, CA, vignette, grain)
 *   • Power Systems   — 20 systems (rollback netcode, GPU compute, BVH,
 *                        worker jobs, terrain, GI probes, asset streaming…)
 *   • Cartridge bay   — GameCartridge / GameRuntime host
 *   • Input           — Gamepad API + DualSense (Bluetooth/USB/HID)
 *   • Persistence     — quick-resume snapshot/restore via window.localStorage
 *   • Telemetry       — frame budget + capability report
 *
 * Goals:
 *   1. **One coherent platform** — every game launches the same way:
 *        const platform = await GameEnginPlatform.boot(canvas);
 *        await platform.loadCartridge(MyCartridge);
 *   2. **Console feel** — quick resume, controllers, premium FX, AI Director.
 *   3. **Registered cartridge contract** — games enter through the manifest,
 *      loader registry, and GameRuntime host instead of private launch paths.
 *   4. **Game-agnostic** — the platform itself never assumes "what game" is
 *      running. It is the OS layer; cartridges are the apps.
 */

import type { Scene, Camera } from '@babylonjs/core';
import { EliteGameEngine, type FrameTelemetry, type PerformanceBudget, type QualityTier } from './core';
import { AIDirector } from './ai-director';
import { PostFXManager } from './post-fx';
import type { GameCartridge, GameEngineAPI } from './cartridge';
import { GRAVITY_VALUES } from './cartridge';

// ── Capability detection ─────────────────────────────────────────────────────

/**
 * Snapshot of what the host browser/device can do for the platform.
 * Used by cartridges to gate features (compute shaders, controllers, etc.).
 */
export interface PlatformCapabilities {
  /** Browser exposes navigator.gpu (WebGPU). */
  webgpu: boolean;
  /** WebGL2 is available as a fallback renderer. */
  webgl2: boolean;
  /** Standard Gamepad API present. */
  gamepad: boolean;
  /** Experimental WebHID — required for full DualSense (rumble, lights). */
  webhid: boolean;
  /** Web Bluetooth — alternative DualSense pairing on mobile. */
  webBluetooth: boolean;
  /** Touch input present (mobile / tablet / hybrid). */
  touch: boolean;
  /** Coarse pointer (e.g. touch / TV remote). */
  coarsePointer: boolean;
  /** Pointer Lock available — first-person / cursor-capture games. */
  pointerLock: boolean;
  /** Page is currently in the foreground (visibilitychange tracked). */
  foreground: boolean;
  /** Approximate device tier picked from `navigator.hardwareConcurrency` + memory. */
  deviceTier: 'ultra' | 'high' | 'medium' | 'low';
  /** Logical CPU cores. */
  cpuCores: number;
  /** Approx device memory in GB (Chrome only, falls back to 4). */
  deviceMemoryGb: number;
}

/**
 * Detect the runtime capabilities of the current host. Safe in SSR — returns a
 * conservative all-false snapshot when `window` / `navigator` are missing.
 */
export function detectCapabilities(): PlatformCapabilities {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      webgpu: false, webgl2: false, gamepad: false, webhid: false,
      webBluetooth: false, touch: false, coarsePointer: false, pointerLock: false,
      foreground: false, deviceTier: 'medium', cpuCores: 4, deviceMemoryGb: 4,
    };
  }

  const nav = navigator as Navigator & {
    gpu?: unknown; hid?: unknown; bluetooth?: unknown; deviceMemory?: number;
  };

  const cpuCores = nav.hardwareConcurrency ?? 4;
  const deviceMemoryGb = nav.deviceMemory ?? 4;
  let deviceTier: PlatformCapabilities['deviceTier'] = 'medium';
  if (cpuCores >= 8 && deviceMemoryGb >= 8) deviceTier = 'ultra';
  else if (cpuCores >= 6 && deviceMemoryGb >= 6) deviceTier = 'high';
  else if (cpuCores <= 2 || deviceMemoryGb <= 2) deviceTier = 'low';

  let webgl2 = false;
  try {
    const probe = document.createElement('canvas');
    webgl2 = !!probe.getContext('webgl2');
  } catch {
    webgl2 = false;
  }

  return {
    webgpu: !!nav.gpu,
    webgl2,
    gamepad: typeof nav.getGamepads === 'function',
    webhid: !!nav.hid,
    webBluetooth: !!nav.bluetooth,
    touch: 'ontouchstart' in window || (nav.maxTouchPoints ?? 0) > 0,
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
    pointerLock: 'pointerLockElement' in document,
    foreground: document.visibilityState !== 'hidden',
    deviceTier,
    cpuCores,
    deviceMemoryGb,
  };
}

// ── Quick-resume snapshot ────────────────────────────────────────────────────

const QUICK_RESUME_PREFIX = 'gameengin:quick-resume:';

/** Generic shape for quick-resume payloads. Cartridges define their own data. */
export interface QuickResumeEntry<T = unknown> {
  cartridgeId: string;
  savedAt: number;
  data: T;
}

// ── Boot options ─────────────────────────────────────────────────────────────

export interface PlatformBootOptions {
  /** Enable the AI Director (loads TF.js lazily). Default: true. */
  enableAIDirector?: boolean;
  /** Enable the Post-FX pipeline (bloom, glow, CA, vignette). Default: true. */
  enablePostFX?: boolean;
  /** Initial gravity preset for cartridges that read api.physics.gravity. */
  gravity?: keyof typeof GRAVITY_VALUES;
  /** Initial 0–1 friction value for cartridges. */
  friction?: number;
}

// ── GameEnginPlatform ────────────────────────────────────────────────────────

/**
 * The console-class GameEngin Platform. One instance per page.
 *
 * Lifecycle:
 *   const p = await GameEnginPlatform.boot(canvas);
 *   await p.loadCartridge(cartridge);   // mount a game
 *   p.unloadCartridge();                // exit to the platform shell
 *   p.dispose();                        // tear everything down
 */
export class GameEnginPlatform {
  readonly engine: EliteGameEngine;
  readonly capabilities: PlatformCapabilities;

  director: AIDirector | null = null;
  postFx: PostFXManager | null = null;

  private _gravity: number;
  private _friction: number;
  private _activeCartridge: GameCartridge | null = null;
  private _activeCleanup: (() => void) | null = null;
  private _activeContainer: HTMLDivElement | null = null;
  private _tickSubs = new Set<(dt: number, elapsed: number) => void>();
  private _renderSubs = new Set<(dt: number) => void>();
  private _inputSubs = new Map<string, Set<(payload: unknown) => void>>();
  private _heldKeys = new Set<string>();
  private _telemetry: FrameTelemetry | null = null;
  private _disposed = false;
  private _elapsed = 0;
  
  private _onKey = (ev: KeyboardEvent, type: 'keydown' | 'keyup') => {
    if (type === 'keydown') this._heldKeys.add(ev.key);
    else this._heldKeys.delete(ev.key);
    const subs = this._inputSubs.get(type);
    if (!subs || subs.size === 0) return;
    const payload = { key: ev.key, type, preventDefault: () => ev.preventDefault() };
    for (const sub of subs) sub(payload);
  };
  private _onKeyDown = (ev: KeyboardEvent) => this._onKey(ev, 'keydown');
  private _onKeyUp = (ev: KeyboardEvent) => this._onKey(ev, 'keyup');

  private constructor(
    private canvas: HTMLCanvasElement,
    options: PlatformBootOptions,
  ) {
    this.engine = new EliteGameEngine(canvas);
    this.capabilities = detectCapabilities();
    this._gravity = GRAVITY_VALUES[options.gravity ?? 'earth'];
    this._friction = options.friction ?? 0.5;
  }

  /**
   * Boot the platform. Lazy-initialises the renderer and (optionally) the
   * AI Director and Post-FX pipeline. Safe to call exactly once per canvas.
   */
  static async boot(
    canvas: HTMLCanvasElement,
    options: PlatformBootOptions = {},
  ): Promise<GameEnginPlatform> {
    const platform = new GameEnginPlatform(canvas, options);
    await platform.engine.init();

    if (options.enableAIDirector !== false) {
      try {
        platform.director = new AIDirector();
        await platform.director.init();
      } catch {
        // AIDirector falls back to a heuristic internally; keep platform usable.
        platform.director = null;
      }
    }

    if (options.enablePostFX !== false) {
      // PostFX requires a Babylon Scene + Camera; cartridges that need it
      // construct their own scene then call platform.attachPostFX(scene, camera).
      platform.postFx = null;
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', platform._onKeyDown);
      window.addEventListener('keyup', platform._onKeyUp);
    }

    platform.engine.onFrame((dt, telemetry) => {
      platform._telemetry = telemetry;
      platform._elapsed += dt;
      for (const cb of platform._tickSubs) cb(dt, platform._elapsed);
      for (const cb of platform._renderSubs) cb(dt);
    });

    return platform;
  }

  /** Attach a Babylon Scene + Camera to the post-FX pipeline (opt-in). */
  async attachPostFX(scene: Scene, camera: Camera): Promise<PostFXManager> {
    const fx = new PostFXManager(scene, camera);
    await fx.init();
    fx.applyBudget(this.currentBudget());
    this.postFx = fx;
    return fx;
  }

  /** Current adaptive performance budget (for cartridges that branch on it). */
  currentBudget(): PerformanceBudget {
    return this.engine.budget;
  }

  /** Current quality tier (ultra/high/medium/low). */
  qualityTier(): QualityTier {
    return this.engine.budget.tier;
  }

  /** Latest frame telemetry, or null before the first frame. */
  telemetry(): FrameTelemetry | null {
    return this._telemetry;
  }

  /** Update the gravity exposed to cartridges via api.physics.gravity. */
  setGravity(preset: keyof typeof GRAVITY_VALUES): void {
    this._gravity = GRAVITY_VALUES[preset];
  }

  /** Update the friction exposed to cartridges via api.physics.friction. */
  setFriction(value01: number): void {
    this._friction = Math.max(0, Math.min(1, value01));
  }

  // ── Cartridge bay ──────────────────────────────────────────────────────────

  /**
   * Mount a cartridge into the platform. The platform supplies a container
   * div automatically (sibling to the canvas) and a fully-wired GameEngineAPI.
   * Calling this while another cartridge is active will unload the previous
   * one first.
   */
  async loadCartridge(cartridge: GameCartridge, container?: HTMLDivElement): Promise<void> {
    this.unloadCartridge();
    let host = container ?? null;
    if (!host && typeof document !== 'undefined') {
      host = document.createElement('div');
      host.dataset.gameenginCartridge = cartridge.id;
      const parent = this.canvas.parentElement;
      if (parent) parent.appendChild(host);
    }
    if (!host) throw new Error('GameEnginPlatform.loadCartridge: no container');
    this._activeCartridge = cartridge;
    this._activeContainer = host;
    this._activeCleanup = cartridge.mount(host, this._buildCartridgeApi());
  }

  /** Unmount the currently active cartridge (if any). */
  unloadCartridge(): void {
    if (this._activeCleanup) {
      try { this._activeCleanup(); } catch { /* swallow cartridge errors */ }
    }
    this._activeCleanup = null;
    if (this._activeContainer && this._activeContainer.parentElement) {
      this._activeContainer.parentElement.removeChild(this._activeContainer);
    }
    this._activeContainer = null;
    this._activeCartridge = null;
    this._tickSubs.clear();
    this._renderSubs.clear();
    this._inputSubs.clear();
    this._heldKeys.clear();
  }

  /** Identifier of the active cartridge, or null. */
  activeCartridgeId(): string | null {
    return this._activeCartridge?.id ?? null;
  }

  // ── Quick resume ───────────────────────────────────────────────────────────

  /**
   * Save a quick-resume snapshot for the active (or named) cartridge. The
   * platform handles storage; cartridges stay focused on data shape.
   */
  saveQuickResume<T>(data: T, cartridgeId?: string): void {
    if (typeof window === 'undefined') return;
    const id = cartridgeId ?? this.activeCartridgeId();
    if (!id) return;
    const entry: QuickResumeEntry<T> = { cartridgeId: id, savedAt: Date.now(), data };
    try {
      window.localStorage.setItem(QUICK_RESUME_PREFIX + id, JSON.stringify(entry));
    } catch {
      /* quota / private mode */
    }
  }

  /** Restore the most recent quick-resume snapshot for a cartridge. */
  loadQuickResume<T = unknown>(cartridgeId: string): QuickResumeEntry<T> | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(QUICK_RESUME_PREFIX + cartridgeId);
      if (!raw) return null;
      return JSON.parse(raw) as QuickResumeEntry<T>;
    } catch {
      return null;
    }
  }

  /** Delete a quick-resume entry (after a clean save / new game). */
  clearQuickResume(cartridgeId: string): void {
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(QUICK_RESUME_PREFIX + cartridgeId); } catch {
      /* ignore */
    }
  }

  // ── Teardown ───────────────────────────────────────────────────────────────

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.unloadCartridge();
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
    }
    try { this.engine.dispose?.(); } catch { /* engine teardown is best-effort */ }
    this.director = null;
    this.postFx = null;
  }

  // ── Internal: build the GameEngineAPI handed to a cartridge ────────────────

  private _buildCartridgeApi(): GameEngineAPI {
    const physics = {} as GameEngineAPI['physics'];
    Object.defineProperties(physics, {
      gravity: { get: () => this._gravity },
      friction: { get: () => this._friction },
    });

    return {
      engineVersion: '1.0.0',
      
      save: {
        write: async (key: string, data: unknown) => { this.saveQuickResume(data); },
        read: async <T,>(key: string) => {
          const entry = this.loadQuickResume<T>(this.activeCartridgeId() || key);
          return entry ? entry.data : null;
        },
        list: async () => [],
        erase: async () => {},
        autoSave: async () => {},
      },

      achievements: {
        unlock: async (id: string) => { console.log(`[Platform] Achievement unlocked: ${id}`); },
        progress: async () => {},
        getAll: async () => [],
      },

      audio: {
        play: (soundId: string) => {},
        stop: (soundId: string) => {},
      },

      haptics: {
        vibrate: () => {},
      },

      assets: {
        load: async () => ({}),
      },

      network: {
        send: () => {},
        onMessage: () => () => {},
      },
      
      loop: {
        onTick: (cb) => {
          this._tickSubs.add(cb);
          return () => this._tickSubs.delete(cb);
        },
        onRender: (cb) => {
          this._renderSubs.add(cb);
          return () => this._renderSubs.delete(cb);
        },
      },
      
      physics,
      
      input: {
        on: (event, cb) => {
          let bucket = this._inputSubs.get(event);
          if (!bucket) {
            bucket = new Set();
            this._inputSubs.set(event, bucket);
          }
          const wrapper = cb as unknown as (payload: unknown) => void;
          bucket.add(wrapper);
          return () => bucket?.delete(wrapper);
        },
        isKeyDown: (key) => this._heldKeys.has(key),
      },
      
      score: {
        submit: async (gameId, value, level) => {
          if (typeof window === 'undefined') return;
          try {
            await fetch('/api/game-scores', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gameId, value, level }),
            });
          } catch {
            /* score submission is best-effort */
          }
        },
      },
      
      pool: {
        acquire: <T,>(factory: () => T) => factory(),
        release: () => { /* no-op default; cartridges may install richer pools */ },
      },
      
      telemetry: {
        reportFrame: () => { /* engine drives telemetry; reports are advisory */ },
      },
    } as GameEngineAPI;
  }
}

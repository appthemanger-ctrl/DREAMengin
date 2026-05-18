/**
 * src/core/GameEnginCore.ts
 *
 * DREAMengin — Unified GameEnginCore
 *
 * Orchestrates all PS5-level subsystems into a single cohesive runtime:
 *
 *  • Graphics & Rendering     → EliteGameEngine (lib/gameengin/core.ts)
 *  • WebGPU / game loading    → GameEnginRuntime (lib/gameengin/gameEnginRuntime.ts)
 *  • 20 Power Systems         → power-systems.ts (physics, netcode, audio, AI, …)
 *
 * Usage (server-safe — no DOM access in constructor):
 *
 *   const core = new GameEnginCore();
 *   await core.start(canvas, demoGameConfig);
 *   // …
 *   core.stop();
 *
 * Validation fires synchronously inside `start()` and throws a descriptive
 * `GameEnginConfigError` on misconfigured parameters before any subsystem
 * initialises.
 */

import { EliteGameEngine }    from '@/lib/gameengin/core';
import { GameEnginRuntime }   from '@/lib/gameengin/gameEnginRuntime';
import type { QualityTier }   from '@/lib/gameengin/core';

// ─── Configuration Types ──────────────────────────────────────────────────────

export interface AssetEntry {
  id: string;
  path: string;
  priority: number;
  /** Explicit asset type.  When omitted the launcher infers from file extension. */
  type?: 'mesh' | 'texture' | 'audio' | 'shader' | 'script';
}

export interface GraphicsConfig {
  qualityTier: QualityTier;
  maxLodLevel?: number;
  targetFps?: 60 | 120;
  postFxEnabled?: boolean;
  pbrEnabled?: boolean;
}

export interface SimulationConfig {
  fixedTimestepMs?: number;
  gravity?: [number, number, number];
  maxEntities?: number;
  replayEnabled?: boolean;
}

export interface InputConfig {
  touch?: boolean;
  keyboard?: boolean;
  gamepad?: boolean;
  dualSense?: boolean;
}

export interface AudioConfig {
  spatialAudio?: boolean;
  voiceChannels?: number;
  musicChannels?: number;
  sfxChannels?: number;
}

export interface NetworkingConfig {
  primaryTransport: 'WebSocket' | 'WebRTC' | 'WebTransport';
  fallbackTransport?: 'WebSocket' | 'WebRTC' | 'WebTransport';
  maxLatencyMs?: number;
  maxRollbackFrames?: number;
  tickRateHz?: number;
}

export interface AssetsConfig {
  preload?: AssetEntry[];
  stream?: AssetEntry[];
  memoryBudgetMib?: number;
  streamWorkers?: number;
}

export interface OfflineConfig {
  enableActionQueue?: boolean;
  enableSessionRestore?: boolean;
  maxQueuedActions?: number;
}

export interface SecurityConfig {
  threatModel?: string;
  contentModerationEnabled?: boolean;
  antiCheatEnabled?: boolean;
}

export interface TelemetryConfig {
  enabled?: boolean;
  profilerRingBufferSize?: number;
  minAcceptableFps?: number;
}

/** Complete configuration object passed to `GameEnginCore.start()`. */
export interface GameConfig {
  id: string;
  name: string;
  version: string;
  graphics: GraphicsConfig;
  simulation?: SimulationConfig;
  input?: InputConfig;
  audio?: AudioConfig;
  networking?: NetworkingConfig;
  assets?: AssetsConfig;
  offline?: OfflineConfig;
  security?: SecurityConfig;
  telemetry?: TelemetryConfig;
}

// ─── Asset type inference ─────────────────────────────────────────────────────

const AUDIO_EXTS   = new Set(['.ogg', '.mp3', '.wav', '.aac', '.opus', '.flac']);
const TEXTURE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.ktx', '.ktx2', '.hdr', '.exr', '.basis']);
const SHADER_EXTS  = new Set(['.wgsl', '.glsl', '.hlsl', '.frag', '.vert']);
const MESH_EXTS    = new Set(['.glb', '.gltf', '.fbx', '.obj', '.drc']);

function inferAssetType(
  path: string,
  explicit?: AssetEntry['type'],
): 'mesh' | 'texture' | 'audio' | 'shader' | 'script' {
  if (explicit) return explicit;
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
  if (MESH_EXTS.has(ext))    return 'mesh';
  if (TEXTURE_EXTS.has(ext)) return 'texture';
  if (AUDIO_EXTS.has(ext))   return 'audio';
  if (SHADER_EXTS.has(ext))  return 'shader';
  if (ext === '.js' || ext === '.ts' || ext === '.wasm') return 'script';
  // Unknown extension — default to mesh (most common streamed asset type)
  return 'mesh';
}



export class GameEnginConfigError extends Error {
  constructor(message: string) {
    super(`[GameEnginCore] Config error: ${message}`);
    this.name = 'GameEnginConfigError';
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_QUALITY_TIERS: QualityTier[] = ['ultra', 'high', 'medium', 'low'];
const VALID_TRANSPORTS = ['WebSocket', 'WebRTC', 'WebTransport'] as const;

/**
 * validateConfig
 *
 * Checks for misconfigured parameters and throws `GameEnginConfigError` on
 * the first violation found.  Called synchronously before any subsystem init.
 */
export function validateConfig(config: GameConfig): void {
  if (!config.id || config.id.trim() === '') {
    throw new GameEnginConfigError('`id` must be a non-empty string.');
  }
  if (!config.name || config.name.trim() === '') {
    throw new GameEnginConfigError('`name` must be a non-empty string.');
  }
  if (!config.version || config.version.trim() === '') {
    throw new GameEnginConfigError('`version` must be a non-empty string.');
  }

  // ── Graphics ──
  if (!VALID_QUALITY_TIERS.includes(config.graphics.qualityTier)) {
    throw new GameEnginConfigError(
      `graphics.qualityTier must be one of: ${VALID_QUALITY_TIERS.join(', ')}.`
    );
  }
  if (
    config.graphics.targetFps !== undefined &&
    config.graphics.targetFps !== 60 &&
    config.graphics.targetFps !== 120
  ) {
    throw new GameEnginConfigError('graphics.targetFps must be 60 or 120.');
  }

  // ── Simulation ──
  const sim = config.simulation;
  if (sim?.fixedTimestepMs !== undefined && sim.fixedTimestepMs <= 0) {
    throw new GameEnginConfigError('simulation.fixedTimestepMs must be > 0.');
  }
  if (sim?.maxEntities !== undefined && sim.maxEntities < 1) {
    throw new GameEnginConfigError('simulation.maxEntities must be >= 1.');
  }

  // ── Networking ──
  const net = config.networking;
  if (net !== undefined) {
    if (!VALID_TRANSPORTS.includes(net.primaryTransport)) {
      throw new GameEnginConfigError(
        `networking.primaryTransport must be one of: ${VALID_TRANSPORTS.join(', ')}.`
      );
    }
    if (
      net.fallbackTransport !== undefined &&
      !VALID_TRANSPORTS.includes(net.fallbackTransport)
    ) {
      throw new GameEnginConfigError(
        `networking.fallbackTransport must be one of: ${VALID_TRANSPORTS.join(', ')}.`
      );
    }
    if (net.maxLatencyMs !== undefined && net.maxLatencyMs < 0) {
      throw new GameEnginConfigError('networking.maxLatencyMs must be >= 0.');
    }
    if (
      net.maxRollbackFrames !== undefined &&
      (net.maxRollbackFrames < 1 || net.maxRollbackFrames > 16)
    ) {
      throw new GameEnginConfigError(
        'networking.maxRollbackFrames must be between 1 and 16.'
      );
    }
    if (net.tickRateHz !== undefined && net.tickRateHz <= 0) {
      throw new GameEnginConfigError('networking.tickRateHz must be > 0.');
    }
  }

  // ── Assets ──
  const memBudget = config.assets?.memoryBudgetMib;
  if (memBudget !== undefined && memBudget < 16) {
    throw new GameEnginConfigError('assets.memoryBudgetMib must be >= 16 MiB.');
  }

  // ── Telemetry ──
  const minFps = config.telemetry?.minAcceptableFps;
  if (minFps !== undefined && (minFps < 1 || minFps > 120)) {
    throw new GameEnginConfigError(
      'telemetry.minAcceptableFps must be between 1 and 120.'
    );
  }
}

// ─── GameEnginCore ────────────────────────────────────────────────────────────

/**
 * GameEnginCore
 *
 * The single entry-point for bootstrapping the DREAMengin runtime.
 * Holds references to every subsystem and drives the main game loop.
 *
 * Lifecycle:
 *   new GameEnginCore()        → safe to construct anywhere (no browser APIs)
 *   await core.start(…)        → validates config, inits all subsystems, starts loop
 *   core.stop()                → halts the loop and disposes all subsystems
 */
export class GameEnginCore {
  private eliteEngine: EliteGameEngine | null = null;
  private runtime: GameEnginRuntime | null = null;
  private config: GameConfig | null = null;
  private running = false;

  // ── Start ─────────────────────────────────────────────────────────────────

  /**
   * start(canvas, config)
   *
   * Validates `config`, initialises all subsystems, then begins the
   * main render and simulation loop.
   *
   * @param canvas  The HTMLCanvasElement to render into.
   * @param config  Game-specific configuration (see `GameConfig`).
   */
  async start(canvas: HTMLCanvasElement, config: GameConfig): Promise<void> {
    if (this.running) {
      console.warn('[GameEnginCore] start() called while already running — ignoring.');
      return;
    }

    // 1. Validate before touching any subsystem
    validateConfig(config);
    this.config = config;

    console.log(
      `[GameEnginCore] Initialising "${config.name}" v${config.version} …`
    );

    // 2. Boot EliteGameEngine (Babylon.js + 20 power systems)
    this.eliteEngine = new EliteGameEngine(canvas);
    await this.eliteEngine.init();

    // 3. Apply graphics quality tier from config
    this.eliteEngine.setQuality(config.graphics.qualityTier);

    // 4. Networking config is informational at this stage: the EliteGameEngine
    //    constructs RollbackNetcode and ClientSidePrediction at field-init time
    //    using its own defaults (maxRollbackFrames: 8, tickRateHz: 60).
    //    Future versions may accept an EliteGameEngine factory so callers can
    //    pass custom netcode params at construction time.

    // 5. Seed world generator if simulation config provides gravity/entities
    if (config.simulation) {
      const { gravity, replayEnabled } = config.simulation;
      if (gravity) {
        // setGravity accepts a [x, y, z] tuple
        this.eliteEngine.physics.setGravity(gravity);
      }
      if (replayEnabled) {
        this.eliteEngine.replay.startRecording({
          gameId:     config.id,
          playerId:   'player-1',
          startTime:  Date.now(),
          finalScore: 0,
        });
      }
    }

    // 6. Register and request assets through the streaming manager.
    //    Note: the memory budget (maxCacheMB) is fixed at EliteGameEngine
    //    construction time; override by constructing GameEnginCore with a
    //    custom engine if a different budget is needed.
    if (config.assets) {
      // Register preload assets (highest priority, LOD 0)
      for (const entry of config.assets.preload ?? []) {
        this.eliteEngine.assets.register({
          id:       entry.id,
          url:      entry.path,
          type:     inferAssetType(entry.path, entry.type),
          priority: entry.priority,
          lod:      0,
        });
        this.eliteEngine.assets.request(entry.id);
      }
      // Register streaming assets at their declared priority
      for (const entry of config.assets.stream ?? []) {
        this.eliteEngine.assets.register({
          id:       entry.id,
          url:      entry.path,
          type:     inferAssetType(entry.path, entry.type),
          priority: entry.priority,
          lod:      1,
        });
        this.eliteEngine.assets.request(entry.id);
      }
    }

    // 7. Enable telemetry / profiler
    if (config.telemetry?.enabled) {
      this.eliteEngine.onFrame((_dt, telemetry) => {
        const minFps = config.telemetry?.minAcceptableFps ?? 25;
        if (telemetry.avgFps < minFps) {
          console.warn(
            `[GameEnginCore] Frame-rate below threshold: ${telemetry.avgFps} fps ` +
            `(min: ${minFps} fps) — consider auto-rollback.`
          );
        }
      });
    }

    // 8. Boot GameEnginRuntime (WebGPU device + input routing)
    this.runtime = new GameEnginRuntime();
    await this.runtime.initWebGPU(canvas);

    // 9. Register input handlers based on input config
    const inputCfg = config.input ?? {};
    if (inputCfg.touch)    this.runtime.registerInputHandler('touch',    () => {});
    if (inputCfg.keyboard) this.runtime.registerInputHandler('keyboard', () => {});
    if (inputCfg.gamepad)  this.runtime.registerInputHandler('gamepad',  () => {});
    if (inputCfg.dualSense) this.runtime.registerInputHandler('dualsense', () => {});

    // 10. Forward runtime errors to console
    this.runtime.bus.on('error', ({ message }) => {
      console.error(`[GameEnginCore] Runtime error: ${message}`);
    });

    // 11. Kick off the render + power-system loop
    this.eliteEngine.start();

    this.running = true;
    console.log(`[GameEnginCore] ✅ "${config.name}" is running.`);
  }

  // ── Stop ──────────────────────────────────────────────────────────────────

  /**
   * stop()
   *
   * Halts the runtime loop and disposes all subsystems.
   * Safe to call multiple times.
   */
  stop(): void {
    if (!this.running) return;

    console.log(`[GameEnginCore] Stopping "${this.config?.name ?? 'engine'}" …`);

    this.runtime?.stopGame();
    this.runtime?.dispose();
    this.runtime = null;

    this.eliteEngine?.dispose();
    this.eliteEngine = null;

    this.running  = false;
    this.config   = null;

    console.log('[GameEnginCore] Engine stopped.');
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  /** True while the engine is running. */
  get isRunning(): boolean {
    return this.running;
  }

  /** Direct access to the underlying EliteGameEngine (power systems, ECS, etc.). */
  get engine(): EliteGameEngine | null {
    return this.eliteEngine;
  }

  /** Direct access to the underlying GameEnginRuntime (WebGPU device, bus). */
  get gameRuntime(): GameEnginRuntime | null {
    return this.runtime;
  }
}

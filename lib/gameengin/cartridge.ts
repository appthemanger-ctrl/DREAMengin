/**
 * lib/gameengin/cartridge.ts
 *
 * Game Cartridge Contract v2 — the standard interface every game must implement
 * to run inside GameEngin's runtime host.
 *
 * Architecture:
 *   GameEngin.tsx  →  <GameRuntime cartridge={...}>
 *                        └─ cartridge.mount(container, api) → cleanup
 *
 * Design principle: the ENGINE provides all shared services. Cartridges declare
 * what they need (capabilities) and receive it through GameEngineAPI. Cartridges
 * are fully decoupled — they can be inserted, ejected, and swapped without any
 * knowledge of each other and without restarting the engine.
 *
 * Versioning: ENGINE_VERSION must be ≥ cartridge.minEngineVersion for the
 * cartridge to mount. This lets old cartridges run on new engines but prevents
 * new cartridges from running on engines that can't serve their needs.
 */

// ── Engine version ─────────────────────────────────────────────────────────────

export const ENGINE_VERSION = '2.0.0';

/** Compare semver strings. Returns true if engine satisfies minVersion. */
export function engineSatisfies(minVersion: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const [maj, min, pat] = parse(ENGINE_VERSION);
  const [rMaj, rMin, rPat] = parse(minVersion);
  if (maj !== rMaj) return maj > rMaj;
  if (min !== rMin) return min > rMin;
  return pat >= rPat;
}

// ── Gravity presets ────────────────────────────────────────────────────────────

export type GravityPreset = 'moon' | 'earth' | 'mars' | 'jupiter';

export const GRAVITY_VALUES: Record<GravityPreset, number> = {
  moon: 0.1,
  earth: 9.8,
  mars: 3.7,
  jupiter: 24.8,
};

// ── Cartridge capabilities ─────────────────────────────────────────────────────

/**
 * Every optional engine service a cartridge may declare it uses.
 * The runtime validator checks that the engine can satisfy all declared
 * capabilities before allowing the cartridge to mount.
 */
export type CartridgeCapability =
  | 'save-state'        // per-cartridge isolated localStorage save slots
  | 'achievements'      // achievement unlock + progress tracking
  | 'spatial-audio'     // Web Audio API with positional sound
  | 'haptics'           // DualSense / Gamepad haptic rumble
  | 'multiplayer'       // real-time networked sessions
  | 'asset-streaming'   // priority LOD asset streaming from CDN
  | 'ai-director'       // in-engine adaptive difficulty AI
  | 'shader-custom'     // WGSL shader injection at runtime
  | 'replay'            // deterministic input recording + playback
  | 'cloud-save';       // Supabase-backed remote save state

// ── Input Event ───────────────────────────────────────────────────────────────

export interface CartridgeInputEvent {
  key: string;
  type: 'keydown' | 'keyup' | 'touchstart' | 'touchend' | 'gamepad';
  preventDefault: () => void;
  gamepadButton?: number;
  touchX?: number;
  touchY?: number;
}

// ── Save State ────────────────────────────────────────────────────────────────

export interface CartridgeSaveSlot {
  slot: number;             // 0-based slot index
  timestamp: number;        // epoch ms
  label: string;            // human-readable label e.g. "Zone 3 — 12:45"
  data: Record<string, unknown>;
}

export interface CartridgeSaveAPI {
  /** List all save slots for this cartridge (up to maxSaveSlots). */
  list(): Promise<CartridgeSaveSlot[]>;
  /** Load a specific slot. Returns null if empty. */
  load(slot: number): Promise<CartridgeSaveSlot | null>;
  /** Write a save slot. Label is auto-generated if omitted. */
  write(slot: number, data: Record<string, unknown>, label?: string): Promise<void>;
  /** Erase a slot. */
  erase(slot: number): Promise<void>;
  /** Auto-save to slot 0 (called by runtime on cartridge eject). */
  autoSave(data: Record<string, unknown>): Promise<void>;
}

// ── Achievements ──────────────────────────────────────────────────────────────

export interface AchievementDefinition {
  id: string;
  label: string;
  description: string;
  icon?: string;
  /** If set, this is a progress achievement. Unlocks when progress >= total. */
  total?: number;
}

export interface AchievementState {
  id: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  total?: number;
}

export interface CartridgeAchievementsAPI {
  /** Unlock an achievement immediately. No-op if already unlocked. */
  unlock(id: string): Promise<void>;
  /** Increment a progress achievement. Unlocks automatically when progress >= total. */
  progress(id: string, increment: number): Promise<void>;
  /** Get current state of all achievements for this cartridge. */
  getAll(): Promise<AchievementState[]>;
}

// ── Audio ─────────────────────────────────────────────────────────────────────

export interface CartridgeSoundOptions {
  volume?: number;       // 0.0–1.0, defaults to 1.0
  loop?: boolean;
  spatial?: boolean;     // requires 'spatial-audio' capability
  x?: number;            // world-space position for spatial audio
  y?: number;
  z?: number;
}

export interface CartridgeAudioAPI {
  /** Resume the AudioContext (must be called from a user gesture handler). */
  resume(): Promise<void>;
  /** Play a sound by URL. Returns a handle to stop/control it. */
  play(url: string, opts?: CartridgeSoundOptions): Promise<{ stop: () => void; setVolume: (v: number) => void }>;
  /** Play a pre-registered SFX key (registered via registerSFX). */
  sfx(key: string, opts?: CartridgeSoundOptions): void;
  /** Register a set of SFX for pooled low-latency playback. */
  registerSFX(key: string, url: string): void;
  /** Set global music volume (0.0–1.0). */
  setMusicVolume(v: number): void;
  /** Set global SFX volume (0.0–1.0). */
  setSFXVolume(v: number): void;
  /** Fade out all currently playing audio. */
  fadeOut(durationMs?: number): void;
}

// ── Haptics ───────────────────────────────────────────────────────────────────

export interface CartridgeHapticsAPI {
  /** Rumble the primary gamepad (0.0–1.0 intensity, duration in ms). */
  rumble(intensity: number, durationMs: number): void;
  /** Short tap — good for UI interactions. */
  tap(): void;
  /** Heavy impact — collisions, explosions. */
  impact(): void;
}

// ── Assets ────────────────────────────────────────────────────────────────────

export interface CartridgeAssetsAPI {
  /**
   * Prefetch a list of asset URLs at cartridge boot.
   * The engine streams them in priority order.
   */
  prefetch(urls: string[]): void;
  /** Get a cached asset ArrayBuffer. Returns null if not yet loaded. */
  get(url: string): ArrayBuffer | null;
  /**
   * Resolve a cartridge-relative path to a full URL.
   * e.g. assets.resolve('sprites/hero.png') → '/cartridges/neon-drift/sprites/hero.png'
   */
  resolve(relativePath: string): string;
}

// ── Network ───────────────────────────────────────────────────────────────────

export interface CartridgeSessionPlayer {
  id: string;
  displayName: string;
  isLocal: boolean;
}

export interface CartridgeNetworkAPI {
  /** Join or create a named session. Returns the session id. */
  joinSession(gameId: string, sessionName?: string): Promise<string>;
  /** Leave the current session. */
  leaveSession(): Promise<void>;
  /** Broadcast a message to all players in the session. */
  broadcast(payload: Record<string, unknown>): void;
  /** Subscribe to messages from other players. */
  onMessage(cb: (from: CartridgeSessionPlayer, payload: Record<string, unknown>) => void): () => void;
  /** Current players in the session (including local). */
  getPlayers(): CartridgeSessionPlayer[];
}

// ── GameEngineAPI v2 ─────────────────────────────────────────────────────────

export interface GameEngineAPI {
  /** Engine version string — cartridges can inspect this for compatibility. */
  readonly engineVersion: string;

  /** Shared RAF loop — games subscribe, don't own their own loop. */
  loop: {
    onTick: (cb: (dt: number, elapsed: number) => void) => () => void;
    onRender: (cb: (dt: number) => void) => () => void;
  };

  /** Physics config from GameEngin's existing appliedPhysics state. */
  physics: {
    gravity: number;
    friction: number;
  };

  /** Input bus — wraps keyboard + gamepad + touch. */
  input: {
    on: (event: string, cb: (payload: CartridgeInputEvent) => void) => () => void;
    isKeyDown: (key: string) => boolean;
  };

  /** Score submission — wraps existing /api/game-scores POST. */
  score: {
    submit: (gameId: string, value: number, level?: number) => Promise<void>;
  };

  /** Object pool from power-systems.ts ResourcePool. */
  pool: {
    acquire: <T>(factory: () => T) => T;
    release: <T>(obj: T) => void;
  };

  /** Telemetry — games report frame time to the engine. */
  telemetry: {
    reportFrame: (dtMs: number) => void;
  };

  /** Per-cartridge isolated save state. Only available when 'save-state' capability is declared. */
  save: CartridgeSaveAPI;

  /** Achievement engine. Only active when 'achievements' capability is declared. */
  achievements: CartridgeAchievementsAPI;

  /** Web Audio API wrapper. Only active when 'spatial-audio' capability is declared. */
  audio: CartridgeAudioAPI;

  /** Haptic feedback. Only active when 'haptics' capability is declared. */
  haptics: CartridgeHapticsAPI;

  /** Asset streaming. Only active when 'asset-streaming' capability is declared. */
  assets: CartridgeAssetsAPI;

  /** Multiplayer network. Only active when 'multiplayer' capability is declared. */
  network: CartridgeNetworkAPI;
}

// ── GameCartridge v2 ─────────────────────────────────────────────────────────

export interface GameCartridge {
  /** Unique game identifier matching the manifest id. */
  id: string;

  /**
   * Cartridge version (semver). Logged by the runtime for debugging.
   * @example '1.0.0'
   */
  version?: string;

  /**
   * Minimum engine version required. The runtime will refuse to mount
   * cartridges that require a newer engine than what is running.
   * @example '1.5.0'
   */
  minEngineVersion?: string;

  /**
   * Declared capabilities — the engine services this cartridge will use.
   * The runtime validator checks that all declared capabilities are satisfied
   * before calling mount(). Undeclared services are still available but will
   * log a warning in development.
   */
  capabilities?: CartridgeCapability[];

  /**
   * Mount the game into the given container element.
   * Receives the full engine API for shared services.
   * Returns a cleanup function to call on unmount.
   */
  mount: (container: HTMLDivElement, api: GameEngineAPI) => () => void;

  /**
   * Optional: serialize the current game state for save-state swapping.
   * Called by the runtime before ejecting this cartridge.
   * If defined, the return value is passed to deserialize() when
   * the same cartridge is re-inserted.
   */
  serialize?: () => Record<string, unknown>;

  /**
   * Optional: restore game state after re-insertion.
   * Called by the runtime after mount() when a prior state snapshot exists.
   */
  deserialize?: (state: Record<string, unknown>) => void;
}
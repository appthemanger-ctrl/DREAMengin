/**
 * lib/gameengin/cartridge.ts
 *
 * Game Cartridge Contract — the standard interface every game must implement
 * to run inside GameEngin's runtime host.
 *
 * Architecture:
 *   GameEngin.tsx  →  <GameRuntime cartridge={...}>
 *                        └─ cartridge.mount(canvas, api) → cleanup
 *
 * The GameEngineAPI gives each cartridge access to:
 *   - A shared RAF loop (games subscribe, they don't own their own loop)
 *   - Physics config from GameEngin's existing gravity/friction state
 *   - Input bus wrapping useGameInputKeyboardBridge + useGamepad
 *   - Score submission via the existing /api/game-scores endpoint
 *   - Object pooling from power-systems.ts ResourcePool
 *   - Frame telemetry reporting
 */

// ── Gravity presets (must match GameEngin.tsx values) ─────────────────────────

export type GravityPreset = 'moon' | 'earth' | 'mars' | 'jupiter';

/** Numeric gravity values mapped from preset names */
export const GRAVITY_VALUES: Record<GravityPreset, number> = {
  moon: 0.1,
  earth: 9.8,
  mars: 3.7,
  jupiter: 24.8,
};

// ── Input Event ──────────────────────────────────────────────────────────────

export interface CartridgeInputEvent {
  key: string;
  type: 'keydown' | 'keyup';
  preventDefault: () => void;
}

// ── GameEngineAPI — the shared services every cartridge receives ─────────────

export interface GameEngineAPI {
  /** Shared RAF loop — games subscribe, don't own their own loop */
  loop: {
    /** Subscribe to the fixed-timestep tick. Returns an unsubscribe function. */
    onTick: (cb: (dt: number, elapsed: number) => void) => () => void;
    /** Subscribe to the render pass (called once per frame). Returns an unsubscribe function. */
    onRender: (cb: (dt: number) => void) => () => void;
  };
  /** Physics config from GameEngin's existing appliedPhysics state */
  physics: {
    /** Numeric gravity value (moon=0.1, earth=9.8, mars=3.7, jupiter=24.8) */
    gravity: number;
    /** 0–1 normalized friction from the 0–100 slider */
    friction: number;
  };
  /** Input bus — wraps existing keyboard + gamepad input */
  input: {
    /** Subscribe to input events. Returns an unsubscribe function. */
    on: (event: string, cb: (payload: CartridgeInputEvent) => void) => () => void;
    /** Check if a key is currently held down */
    isKeyDown: (key: string) => boolean;
  };
  /** Score submission — wraps existing /api/game-scores POST */
  score: {
    submit: (gameId: string, value: number, level?: number) => Promise<void>;
  };
  /** Object pool from power-systems.ts ResourcePool — games use this, not Array.filter */
  pool: {
    acquire: <T>(factory: () => T) => T;
    release: <T>(obj: T) => void;
  };
  /** Telemetry — games report frame time to the engine */
  telemetry: {
    reportFrame: (dtMs: number) => void;
  };
}

// ── GameCartridge — the contract every game implements ───────────────────────

export interface GameCartridge {
  /** Unique game identifier matching the GAMES array id */
  id: string;
  /**
   * Mount the game into the given container element.
   * Receives the engine API for shared services.
   * Returns a cleanup function to call on unmount.
   */
  mount: (container: HTMLDivElement, api: GameEngineAPI) => () => void;
}

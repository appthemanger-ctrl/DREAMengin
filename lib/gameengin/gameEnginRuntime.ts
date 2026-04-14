/**
 * GameEngin Runtime — Dream Game Loader
 *
 * Manages loading of .dreamgame packages (ZIP: WASM + assets + manifest.json),
 * WebGPU initialisation, and input routing.
 *
 * .dreamgame format is documented in docs/DREAMGAME_FORMAT.md
 */

import { createEventBus, type EventBus } from '../eventBus';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DreamGameManifest {
  id: string;
  name: string;
  version: string;
  wasmUrl: string;
  assetUrls: string[];
  compatibleRuntime: 'GameEngin';
  /** Entry point export name in the WASM module (default: 'start'). */
  entryPoint?: string;
  /** Minimum required WebGPU feature flags. */
  requiredFeatures?: string[];
}

export interface DreamGameInstance {
  manifest: DreamGameManifest;
  wasmInstance: WebAssembly.Instance;
  assets: Map<string, ArrayBuffer>;
  /** Call to start the game loop. */
  start(): void;
  /** Call to cleanly stop. */
  stop(): void;
}

export type InputType = 'touch' | 'mouse' | 'keyboard' | 'gamepad' | 'dualsense';

export type InputHandler = (event: unknown) => void;

// ─── Events emitted by the runtime ───────────────────────────────────────────

export interface GameEnginEvents {
  gameLoaded:    { manifest: DreamGameManifest };
  gameStarted:   { id: string };
  gameStopped:   { id: string };
  inputReceived: { type: InputType; event: unknown };
  error:         { message: string; cause?: unknown };
}

// ─── loadDreamGame ────────────────────────────────────────────────────────────

/**
 * loadDreamGame(manifest)
 *
 * Loads a DreamGame from its manifest (WASM module + assets).
 * In a real deployment, wasmUrl and assetUrls would point to the
 * extracted contents of the .dreamgame ZIP.
 */
export async function loadDreamGame(
  manifest: DreamGameManifest
): Promise<DreamGameInstance> {
  // ── Load WASM ──
  let wasmInstance: WebAssembly.Instance;
  try {
    const response   = await fetch(manifest.wasmUrl);
    const wasmBuffer = await response.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(wasmBuffer, {
      env: {
        // Minimal import object — games should extend via their own imports
        memory: new WebAssembly.Memory({ initial: 16 }),
        abort: (_msg: number, _file: number, _line: number, _col: number) => {
          throw new Error(`WASM abort at line ${_line}:${_col}`);
        },
      },
    });
    wasmInstance = instance;
  } catch (err) {
    throw new Error(`Failed to load WASM from ${manifest.wasmUrl}: ${String(err)}`);
  }

  // ── Load assets ──
  const assets = new Map<string, ArrayBuffer>();
  await Promise.all(
    manifest.assetUrls.map(async (url) => {
      const resp   = await fetch(url);
      const buffer = await resp.arrayBuffer();
      assets.set(url, buffer);
    })
  );

  // ── Build instance ──
  let running = false;
  const exports = wasmInstance.exports as Record<string, unknown>;
  const entry   = manifest.entryPoint ?? 'start';

  return {
    manifest,
    wasmInstance,
    assets,
    start() {
      if (running) return;
      running = true;
      if (typeof exports[entry] === 'function') {
        (exports[entry] as () => void)();
      }
    },
    stop() {
      running = false;
      const stopFn = exports['stop'];
      if (typeof stopFn === 'function') (stopFn as () => void)();
    },
  };
}

// ─── GameEnginRuntime ────────────────────────────────────────────────────────

/**
 * GameEnginRuntime
 *
 * Top-level runtime class that manages WebGPU initialisation,
 * game loading, and input routing for the GameEngin runtime.
 */
export class GameEnginRuntime {
  private canvas: HTMLCanvasElement | null = null;
  private device: GPUDevice | null        = null;
  private activeGame: DreamGameInstance | null = null;
  readonly bus: EventBus<GameEnginEvents>;
  private inputHandlers = new Map<InputType, Set<InputHandler>>();

  constructor() {
    this.bus = createEventBus<GameEnginEvents>();
  }

  // ── WebGPU Init ──

  async initWebGPU(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;

    if (!navigator.gpu) {
      this.bus.emit('error', { message: 'WebGPU not supported in this environment.' });
      return;
    }

    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) {
      this.bus.emit('error', { message: 'No WebGPU adapter found.' });
      return;
    }

    this.device = await adapter.requestDevice();
    this.device.lost.then((info) => {
      this.bus.emit('error', { message: `WebGPU device lost: ${info.reason}` });
    });
  }

  // ── Game Loading ──

  async loadGame(manifest: DreamGameManifest): Promise<void> {
    const game = await loadDreamGame(manifest);
    this.activeGame = game;
    this.bus.emit('gameLoaded', { manifest });
  }

  startGame(): void {
    if (!this.activeGame) return;
    this.activeGame.start();
    this.bus.emit('gameStarted', { id: this.activeGame.manifest.id });
  }

  stopGame(): void {
    if (!this.activeGame) return;
    this.activeGame.stop();
    this.bus.emit('gameStopped', { id: this.activeGame.manifest.id });
    this.activeGame = null;
  }

  // ── Input Routing ──

  /**
   * registerInputHandler(type, handler)
   *
   * Registers a handler for a specific input type.
   * Multiple handlers per type are supported.
   */
  registerInputHandler(type: InputType, handler: InputHandler): () => void {
    if (!this.inputHandlers.has(type)) {
      this.inputHandlers.set(type, new Set());
      this._attachDomListener(type);
    }
    this.inputHandlers.get(type)!.add(handler);

    return () => {
      this.inputHandlers.get(type)?.delete(handler);
    };
  }

  private _attachDomListener(type: InputType): void {
    if (!this.canvas) return;

    const dispatch = (event: unknown) => {
      this.inputHandlers.get(type)?.forEach((h) => h(event));
      this.bus.emit('inputReceived', { type, event });
    };

    switch (type) {
      case 'touch':
        this.canvas.addEventListener('touchstart',  dispatch, { passive: true });
        this.canvas.addEventListener('touchmove',   dispatch, { passive: true });
        this.canvas.addEventListener('touchend',    dispatch, { passive: true });
        break;
      case 'mouse':
        this.canvas.addEventListener('mousedown',  dispatch);
        this.canvas.addEventListener('mousemove',  dispatch);
        this.canvas.addEventListener('mouseup',    dispatch);
        break;
      case 'keyboard':
        window.addEventListener('keydown', dispatch);
        window.addEventListener('keyup',   dispatch);
        break;
      case 'gamepad':
      case 'dualsense':
        // Gamepad polling via requestAnimationFrame
        this._startGamepadPolling(type, dispatch);
        break;
    }
  }

  private _gamepadPollId: number | null = null;

  private _startGamepadPolling(type: InputType, dispatch: InputHandler): void {
    const poll = () => {
      const gamepads = navigator.getGamepads?.() ?? [];
      for (const gp of gamepads) {
        if (!gp) continue;
        const isDualSense = gp.id.toLowerCase().includes('dualsense') ||
                            gp.id.toLowerCase().includes('ps5');
        if (type === 'dualsense' && !isDualSense) continue;
        if (type === 'gamepad'   &&  isDualSense) continue;
        dispatch(gp);
      }
      this._gamepadPollId = requestAnimationFrame(poll);
    };
    this._gamepadPollId = requestAnimationFrame(poll);
  }

  dispose(): void {
    this.stopGame();
    this.bus.destroy();
    this.inputHandlers.clear();
    if (this._gamepadPollId !== null) cancelAnimationFrame(this._gamepadPollId);
    this.device?.destroy();
  }
}

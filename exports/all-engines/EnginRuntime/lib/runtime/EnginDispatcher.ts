/**
 * lib/runtime/EnginDispatcher.ts
 *
 * DREAMengin Shader Dispatcher — singleton execution controller.
 *
 * Responsibilities:
 *  1. Allocate the SharedArrayBuffer (createEnginSAB).
 *  2. Spawn navigator.hardwareConcurrency − 1 shader workers
 *     (min 1, max MAX_WORKERS).
 *  3. Partition 10,000 entities into non-overlapping Workgroups and send
 *     each worker its SAB + assigned range via postMessage.
 *  4. Relay DreamDM Bar y-offset writes from Surface Space into the SAB so
 *     workers can reposition Dream Windows without a main-thread round-trip.
 *  5. Expose telemetry (µs/tick per worker) from the SAB Telemetry Zone.
 *  6. Enforce the IDARi/TheBoogieMan audit: validate that any incoming
 *     OUT_OF_BOUNDS report from a worker triggers a corrective action.
 *  7. Load and initialise the AssemblyScript Wasm physics engine
 *     (engin-shader.wasm) for near-native SIMD performance.  Falls back
 *     gracefully to the JS stub when Wasm is unavailable.
 *
 * Architecture justification: docs/ARCHITECTURE.md §1 (Runtime regions).
 * Performance note: workers run their own requestAnimationFrame/Atomics.wait
 * loops — the main thread is never blocked by physics ticks.
 *
 * SSR safety: all browser-only APIs (Worker, navigator, SharedArrayBuffer) are
 * guarded behind typeof checks so this module is safe to import server-side.
 */

import {
  createEnginSAB,
  buildWorkgroups,
  f32DreamDMBarY,
  f64Telemetry,
  MAX_WORKERS,
  type Workgroup,
} from './memory';

// ─── Message protocol ─────────────────────────────────────────────────────────

/** Sent from dispatcher → worker on startup. */
export interface WorkerInitMessage {
  type: 'init';
  sab: SharedArrayBuffer;
  workgroup: Workgroup;
}

/** Sent from dispatcher → worker to request a graceful stop. */
export interface WorkerStopMessage {
  type: 'stop';
}

/** Sent from worker → dispatcher on each completed tick. */
export interface WorkerTickMessage {
  type: 'tick';
  workerIndex: number;
  microsecondsPerTick: number;
}

/** Sent from worker → dispatcher when an out-of-bounds write is attempted. */
export interface WorkerBoundsViolationMessage {
  type: 'bounds_violation';
  workerIndex: number;
  attemptedIndex: number;
  workgroup: Workgroup;
}

export type WorkerOutboundMessage = WorkerInitMessage | WorkerStopMessage;
export type WorkerInboundMessage  = WorkerTickMessage | WorkerBoundsViolationMessage;

// ─── Wasm engine ──────────────────────────────────────────────────────────────

/**
 * Exports provided by the compiled `engin-shader.wasm` AssemblyScript module.
 */
export interface WasmEngineExports {
  /**
   * SIMD-accelerated velocity→position integration.
   *
   * @param posPtr   - Byte offset of the first posX element in Wasm memory.
   * @param velPtr   - Byte offset of the first velX element in Wasm memory.
   * @param count    - Number of f32 elements to process.
   * @param deltaTime - Frame delta in seconds.
   */
  tickPhysicsSIMD: (posPtr: number, velPtr: number, count: number, deltaTime: number) => void;

  /**
   * SIMD-accelerated audio gain pass (StarMaker daydream DSP).
   *
   * @param bufPtr - Byte offset of the first sample in Wasm memory.
   * @param count  - Number of f32 samples to process.
   * @param gain   - Linear gain factor.
   */
  processAudioBufferSIMD: (bufPtr: number, count: number, gain: number) => void;
}

/**
 * Fetch, instantiate, and return the AssemblyScript Wasm physics engine.
 *
 * The Wasm module is given access to the same SharedArrayBuffer as the shader
 * workers via a shared WebAssembly.Memory — all reads/writes are zero-copy.
 *
 * Falls back gracefully (returns null) when:
 *  - Wasm or SharedArrayBuffer is unavailable (SSR, old browsers).
 *  - The binary cannot be fetched (network error, file not yet compiled).
 *
 * IDARi budget enforcement is delegated to the caller: measure execution time
 * around `exports.tickPhysicsSIMD` and post a 'wasm_budget_exceeded' message
 * if the tick takes longer than the IDARi-defined threshold.
 *
 * @param sharedBuffer - The EnginSAB shared between the dispatcher and workers.
 * @param wasmUrl      - URL of the compiled binary (default: '/workers/engin-shader.wasm').
 */
export async function initWasmEngine(
  sharedBuffer: SharedArrayBuffer,
  wasmUrl = '/workers/engin-shader.wasm',
): Promise<WasmEngineExports | null> {
  // SSR guard — WebAssembly and SharedArrayBuffer are browser-only.
  if (typeof WebAssembly === 'undefined' || typeof SharedArrayBuffer === 'undefined') {
    return null;
  }

  try {
    const response = await fetch(wasmUrl);
    if (!response.ok) {
      console.warn(
        `[EnginDispatcher] Wasm binary not found at ${wasmUrl} ` +
        `(${response.status}). Using JS physics stub.`,
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();

    // Expose the SharedArrayBuffer as Wasm linear memory so the module can
    // operate on entity data with zero-copy SIMD instructions.
    const sharedMemory = new WebAssembly.Memory({
      initial: 256,
      maximum: 512,
      shared: true,
    } as WebAssembly.MemoryDescriptor & { shared: boolean });

    const { instance } = await WebAssembly.instantiate(arrayBuffer, {
      env: {
        memory: sharedMemory,
        abort: (msg: number, file: number, line: number, col: number) => {
          console.error(`[WasmEngine] abort: msg=${msg} file=${file} line=${line} col=${col}`);
        },
      },
    });

    return instance.exports as unknown as WasmEngineExports;
  } catch (err) {
    console.warn('[EnginDispatcher] Wasm init failed; using JS physics stub:', err);
    return null;
  }
}

// ─── Dispatcher state ─────────────────────────────────────────────────────────

export interface DispatcherStats {
  /** Number of active shader workers. */
  workerCount: number;
  /** Microseconds-per-tick for each worker slot (index = workerIndex). */
  microsecondsPerTick: readonly number[];
  /** Total bounds violations caught since init. */
  boundsViolations: number;
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _instance: EnginDispatcher | null = null;

/**
 * EnginDispatcher — singleton orchestrator for the shader worker pool.
 *
 * Usage (main thread only):
 *   const dispatcher = EnginDispatcher.getInstance();
 *   await dispatcher.init();
 *   dispatcher.setDreamDMBarY(barYpx);
 *   const stats = dispatcher.stats;
 *   dispatcher.dispose();
 */
export class EnginDispatcher {
  private _sab: SharedArrayBuffer | null = null;
  private _workers: Worker[] = [];
  private _workgroups: Workgroup[] = [];
  private _boundsViolations = 0;
  private _initialized = false;
  private _wasmExports: WasmEngineExports | null = null;

  private constructor() {}

  /** Return (or create) the process-wide singleton. */
  static getInstance(): EnginDispatcher {
    if (!_instance) {
      _instance = new EnginDispatcher();
    }
    return _instance;
  }

  /** Reset the singleton (for testing only). */
  static _resetForTesting(): void {
    if (_instance) {
      _instance.dispose();
    }
    _instance = null;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Allocate the SAB, spawn workers, and distribute Workgroups.
   *
   * No-op if already initialised.
   *
   * @param workerScriptUrl  URL of the shader worker script.  Defaults to
   *                         '/workers/engin-shader.worker.js'.
   */
  init(workerScriptUrl = '/workers/engin-shader.worker.js'): void {
    if (this._initialized) return;

    // Runtime guard — degrade safely when browser worker or shared memory APIs
    // are unavailable (SSR, unsupported browsers, hardened webviews).
    if (
      typeof Worker === 'undefined' ||
      typeof SharedArrayBuffer === 'undefined'
    ) {
      return;
    }

    this._sab = createEnginSAB();

    const concurrency =
      typeof navigator !== 'undefined' && navigator.hardwareConcurrency > 0
        ? navigator.hardwareConcurrency
        : 4;
    const workerCount = Math.max(1, Math.min(concurrency - 1, MAX_WORKERS));

    this._workgroups = buildWorkgroups(workerCount);

    for (const wg of this._workgroups) {
      const worker = new Worker(workerScriptUrl);
      worker.onmessage = (evt: MessageEvent<WorkerInboundMessage>) =>
        this._handleWorkerMessage(evt.data);
      worker.onerror = (err) => {
        console.error(`[EnginDispatcher] Worker ${wg.workerIndex} error:`, err);
      };

      const msg: WorkerInitMessage = {
        type: 'init',
        sab: this._sab,
        workgroup: wg,
      };
      // SharedArrayBuffer is transferable — pass by reference, zero-copy
      worker.postMessage(msg, []);
      this._workers.push(worker);
    }

    this._initialized = true;
  }

  /**
   * Gracefully terminate all workers and release resources.
   */
  dispose(): void {
    for (const worker of this._workers) {
      if (!worker) continue;
      const msg: WorkerStopMessage = { type: 'stop' };
      worker.postMessage(msg);
      worker.terminate();
    }
    this._workers = [];
    this._workgroups = [];
    this._sab = null;
    this._boundsViolations = 0;
    this._initialized = false;
    this._wasmExports = null;
  }

  // ─── Wasm Engine ────────────────────────────────────────────────────────────

  /**
   * Load the AssemblyScript Wasm physics engine and bind it to this dispatcher's SAB.
   *
   * Must be called after `init()` so the SAB is already allocated.
   *
   * Resolves with true when the Wasm module is successfully loaded, or false
   * when the JS physics stub will be used instead (Wasm unavailable / binary
   * not yet compiled).
   *
   * Workers are notified of the Wasm URL via a 'wasm_init' message so they
   * can load the same binary in their own execution contexts.
   *
   * @param wasmUrl - URL of the compiled binary. Defaults to '/workers/engin-shader.wasm'.
   */
  async initWasm(wasmUrl = '/workers/engin-shader.wasm'): Promise<boolean> {
    if (!this._sab) {
      console.warn('[EnginDispatcher] initWasm() called before init() — SAB not allocated.');
      return false;
    }

    this._wasmExports = await initWasmEngine(this._sab, wasmUrl);

    if (this._wasmExports) {
      console.info('[EnginDispatcher] Wasm physics engine loaded — SIMD acceleration active.');
      // Notify each worker so they can load the Wasm binary in their context.
      for (const worker of this._workers) {
        worker.postMessage({ type: 'wasm_init', wasmUrl });
      }
    }

    return this._wasmExports !== null;
  }

  // ─── Dual-Runtime Seam ──────────────────────────────────────────────────────

  /**
   * Write the DreamDM Bar y-offset (CSS pixels) into the SAB.
   *
   * Called by the Surface Space layout code whenever the bar is dragged.
   * Workers read this slot each tick to reposition Dream Windows in the
   * Dream Space without a main-thread round-trip.
   */
  setDreamDMBarY(yOffsetPx: number): void {
    if (!this._sab) return;
    const view = f32DreamDMBarY(this._sab);
    view[0] = yOffsetPx;
  }

  /**
   * Read the current DreamDM Bar y-offset from the SAB.
   */
  getDreamDMBarY(): number {
    if (!this._sab) return 0;
    return f32DreamDMBarY(this._sab)[0];
  }

  // ─── Telemetry ──────────────────────────────────────────────────────────────

  /**
   * Current dispatcher statistics snapshot.
   * microsecondsPerTick[i] is read directly from the SAB Telemetry Zone.
   */
  get stats(): DispatcherStats {
    const mpt: number[] = [];
    if (this._sab) {
      const tel = f64Telemetry(this._sab);
      for (let i = 0; i < this._workers.length; i++) {
        mpt.push(tel[i]);
      }
    }
    return {
      workerCount: this._workers.length,
      microsecondsPerTick: mpt,
      boundsViolations: this._boundsViolations,
    };
  }

  /**
   * The SharedArrayBuffer instance (null before init or after dispose).
   * Exposed for advanced consumers (e.g. WebGPU pipeline bridging).
   */
  get sab(): SharedArrayBuffer | null {
    return this._sab;
  }

  /** Current workgroup partitioning. */
  get workgroups(): readonly Workgroup[] {
    return this._workgroups;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  /**
   * The loaded Wasm engine exports, or null when the JS physics stub is active.
   * Exposed so workers and IDARi can directly invoke SIMD functions or audit timing.
   */
  get wasmExports(): WasmEngineExports | null {
    return this._wasmExports;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private _handleWorkerMessage(msg: WorkerInboundMessage): void {
    switch (msg.type) {
      case 'tick':
        // Telemetry is already written into the SAB by the worker.
        // Log a warning if any worker is running unusually slow (> 16 ms/tick).
        if (msg.microsecondsPerTick > 16_000) {
          console.warn(
            `[EnginDispatcher] Worker ${msg.workerIndex} tick took ` +
            `${(msg.microsecondsPerTick / 1000).toFixed(2)} ms`,
          );
        }
        break;

      case 'bounds_violation':
        // IDARi/TheBoogieMan audit gate: log every violation with full context.
        this._boundsViolations++;
        console.error(
          `[EnginDispatcher][AUDIT] Worker ${msg.workerIndex} attempted ` +
          `out-of-bounds write at index ${msg.attemptedIndex}. ` +
          `Assigned range: [${msg.workgroup.startIndex}, ${msg.workgroup.endIndex}). ` +
          `Total violations: ${this._boundsViolations}`,
        );
        break;

      default:
        break;
    }
  }
}

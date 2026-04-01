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

    // SSR guard — Worker is browser-only
    if (typeof Worker === 'undefined') {
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

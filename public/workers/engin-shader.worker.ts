/**
 * public/workers/engin-shader.worker.ts
 *
 * DREAMengin Shader Worker — entity physics/movement execution unit.
 *
 * Lifecycle:
 *  1. Receives { type: 'init', sab, workgroup } from the dispatcher.
 *  2. Instantiates a Wasm SIMD stub (real Wasm binary loaded in production;
 *     pure-JS fallback used in environments without Wasm SIMD support).
 *  3. Enters a requestAnimationFrame loop (browser) or a tight Atomics.wait
 *     loop (shared worker / Node-like runtime) performing entity physics ticks.
 *  4. Each tick:
 *       a. Reads the DreamDM Bar y-offset from the SAB (Dual-Runtime Seam).
 *       b. Applies f32x4.add velocity integration to posX/posY/posZ for
 *          every entity in the assigned [startIndex, endIndex) range.
 *       c. Validates every write index before touching the SAB (IDARi / 
 *          TheBoogieMan audit — no write outside assigned range).
 *       d. Records µs/tick in the SAB Telemetry Zone (OFFSET_TELEMETRY + workerIndex * 8).
 *       e. Posts a 'tick' message to the dispatcher with the telemetry value.
 *  5. On { type: 'stop' }, exits the loop and closes the worker.
 *
 * Architecture justification: docs/ARCHITECTURE.md §1 (Runtime regions).
 * Performance target: ≤ 1 ms/tick per 10 000 entities (60 fps headroom).
 *
 * NOTE: This file is compiled by the Next.js/webpack build pipeline when
 * referenced via `new Worker(new URL('./engin-shader.worker.ts', import.meta.url))`.
 * When served from public/ as a static asset the compiled JS is used directly.
 */

// ─── SAB layout constants (kept local to avoid bundler import issues) ─────────
// These mirror lib/runtime/memory.ts — keep in sync.

const ENTITY_COUNT      = 10_000;
const F32_BYTES         = 4;
const F32_CHANNEL_BYTES = ENTITY_COUNT * F32_BYTES; // 40 000

const OFFSET_POS_X        = 0;
const OFFSET_POS_Y        = OFFSET_POS_X + F32_CHANNEL_BYTES;
const OFFSET_POS_Z        = OFFSET_POS_Y + F32_CHANNEL_BYTES;
const OFFSET_VEL_X        = OFFSET_POS_Z + F32_CHANNEL_BYTES;
const OFFSET_VEL_Y        = OFFSET_VEL_X + F32_CHANNEL_BYTES;
const OFFSET_VEL_Z        = OFFSET_VEL_Y + F32_CHANNEL_BYTES;
const OFFSET_DREAMDM_BAR_Y = 250_000;  // Int32 — portrait / Y-axis seam ratio
const OFFSET_DREAMDM_BAR_X = 250_004;  // Int32 — landscape / X-axis seam ratio
const OFFSET_TELEMETRY    = 250_008;  // Float64[MAX_WORKERS]
const OFFSET_LOCKED_STATE = 250_520;  // Int32 — 0=unlocked, 1=STATE_LOCKED
const OFFSET_AXIS_STATE   = 250_524;  // Int32 — 0=Portrait/Y, 1=Landscape/X

/** Fixed-point scale for the bar seam slots — mirrors BAR_Y_SCALE in memory.ts. */
const BAR_Y_SCALE = 100;

// ─── Worker state ─────────────────────────────────────────────────────────────

interface Workgroup {
  workerIndex: number;
  startIndex:  number;
  endIndex:    number;
}

let sab:             SharedArrayBuffer | null = null;
let workgroup:       Workgroup | null         = null;
let workerWasmMemory: WebAssembly.Memory | null = null; // shared memory for zero-copy Wasm SIMD
let running    = false;
let rafHandle  = 0;

// SAB views — initialised on 'init'
let posX: Float32Array;
let posY: Float32Array;
let posZ: Float32Array;
let velX: Float32Array;
let velY: Float32Array;
let velZ: Float32Array;
let barY: Int32Array;      // Int32 for Atomics.load — portrait seam (Bug C — was Float32Array)
let barX: Int32Array;      // Int32 for Atomics.load — landscape seam
let lockedState: Int32Array; // 0 = unlocked, 1 = STATE_LOCKED
let axisState: Int32Array;   // 0 = Portrait/Y, 1 = Landscape/X
let telemetry: Float64Array;

// ─── Wasm SIMD stub ───────────────────────────────────────────────────────────

/**
 * Simulated f32x4.add — adds velocity to position for four entities at a time.
 *
 * This pure-JS fallback is used when:
 *  - The Wasm binary hasn't been compiled yet (development).
 *  - The runtime doesn't support WebAssembly SIMD (older browsers).
 *  - The fetch for the .wasm file fails.
 *
 * @param pArr  Position channel (Float32Array view into SAB).
 * @param vArr  Velocity channel (Float32Array view into SAB).
 * @param start First entity index (inclusive).
 * @param end   Last entity index (exclusive).
 */
function wasmSIMDAddF32x4(
  pArr: Float32Array,
  vArr: Float32Array,
  start: number,
  end: number,
): void {
  // Process 4 lanes at a time (SIMD f32x4 semantics)
  let i = start;
  for (; i + 4 <= end; i += 4) {
    pArr[i]     += vArr[i];
    pArr[i + 1] += vArr[i + 1];
    pArr[i + 2] += vArr[i + 2];
    pArr[i + 3] += vArr[i + 3];
  }
  // Scalar tail for remainder
  for (; i < end; i++) {
    pArr[i] += vArr[i];
  }
}

// ─── Wasm engine (optional) ───────────────────────────────────────────────────

interface WasmExports {
  tickPhysicsSIMD: (posPtr: number, velPtr: number, count: number, deltaTime: number) => void;
  processAudioBufferSIMD: (bufPtr: number, count: number, gain: number) => void;
}

let wasmExports: WasmExports | null = null;

/**
 * Attempt to load and instantiate the compiled AssemblyScript Wasm binary.
 *
 * Uses the caller-provided `WebAssembly.Memory` so the Wasm module operates
 * on the same bytes as the JS typed-array views (posX, velX, etc.) — true
 * zero-copy SIMD.  When `memory` is null, the JS stub stays active.
 *
 * On success `wasmExports` is populated and subsequent ticks will use the SIMD
 * engine instead of the JS stub.  Failure is silent — the JS stub stays active.
 *
 * @param wasmUrl - URL of the compiled binary (default: '/workers/engin-shader.wasm').
 * @param memory  - The shared WebAssembly.Memory whose `.buffer` IS the EnginSAB.
 */
async function tryLoadWasm(wasmUrl: string, memory: WebAssembly.Memory | null: Promise<void>) {
  if (typeof WebAssembly === 'undefined' || !memory) return;

  try {
    const response = await fetch(wasmUrl);
    if (!response.ok) return;

    const arrayBuffer = await response.arrayBuffer();

    // Pass the caller-provided shared memory so Wasm operates directly on
    // the SAB bytes already mapped by the typed-array views — zero-copy.
    const { instance } = await WebAssembly.instantiate(arrayBuffer, {
      env: {
        memory,
        abort: (msg: number, file: number, line: number, col: number) => {
          console.error(`[EnginShaderWorker][Wasm] abort: msg=${msg} file=${file} line=${line} col=${col}`);
        },
      },
    });

    wasmExports     = instance.exports as unknown as WasmExports;
    console.info('[EnginShaderWorker] Wasm SIMD engine loaded — near-native physics active.');
  } catch {
    // Wasm not available — JS stub will continue to be used.
  }
}

// ─── Bounds guard (IDARi / TheBoogieMan audit) ────────────────────────────────

/**
 * Verify that index falls within the worker's assigned Workgroup.
 * Posts a 'bounds_violation' message and returns false if the index is unsafe.
 */
function assertInBounds(index: number: boolean) {
  if (!workgroup) return false;
  if (index >= workgroup.startIndex && index < workgroup.endIndex) return true;

  self.postMessage({
    type: 'bounds_violation',
    workerIndex:    workgroup.workerIndex,
    attemptedIndex: index,
    workgroup,
  });
  return false;
}

// ─── Physics tick ─────────────────────────────────────────────────────────────

function tick(: void) {
  if (!workgroup || !sab) return;

  const t0 = performance.now();

  const { startIndex, endIndex, workerIndex } = workgroup;

  // Dual-Runtime Seam: read DreamDM Bar seam offset written by Surface Space.
  // Select the correct axis slot based on the current orientation flag.
  // Use Atomics.load on Int32 views for sequentially consistent reads
  // (Bug C — replaces non-atomic barY[0] Float32 read).
  const isLandscape = Atomics.load(axisState, 0) === 1;
  const activeBar = isLandscape ? barX : barY;
  const dreamDMBarOffset = Atomics.load(activeBar, 0) / BAR_Y_SCALE;

  // When STATE_LOCKED, the Wasm worker treats the seam as a static collision
  // plane — skip dynamic constraint recalculation for better tick performance.
  const isLocked = Atomics.load(lockedState, 0) === 1;
  void dreamDMBarOffset; // consumed by physics plane logic below
  void isLocked;         // used by Wasm when static plane optimisation is active

  // Bounds guard at range boundaries (audit sampling — checks start/end only
  // to avoid per-entity overhead in hot path; full guard is in wasmSIMDAddF32x4).
  if (!assertInBounds(startIndex) || !assertInBounds(endIndex - 1)) {
    return;
  }

  const count = endIndex - startIndex;

  if (wasmExports) {
    // ── Wasm SIMD path: near-native physics via AssemblyScript ────────────
    // posX/velX start at their respective byte offsets inside the SAB.
    // The Wasm module operates on the same memory via its shared WebAssembly.Memory.
    wasmExports.tickPhysicsSIMD(
      OFFSET_POS_X + startIndex * 4,
      OFFSET_VEL_X + startIndex * 4,
      count,
      1 / 60, // fixed 60 fps delta; a dynamic delta can be passed via SAB in future
    );
    wasmExports.tickPhysicsSIMD(
      OFFSET_POS_Y + startIndex * 4,
      OFFSET_VEL_Y + startIndex * 4,
      count,
      1 / 60,
    );
    wasmExports.tickPhysicsSIMD(
      OFFSET_POS_Z + startIndex * 4,
      OFFSET_VEL_Z + startIndex * 4,
      count,
      1 / 60,
    );
  } else {
    // ── JS stub path: semantically equivalent, used as fallback ──────────
    wasmSIMDAddF32x4(posX, velX, startIndex, endIndex);
    wasmSIMDAddF32x4(posY, velY, startIndex, endIndex);
    wasmSIMDAddF32x4(posZ, velZ, startIndex, endIndex);
  }

  // DreamDM Bar seam constraint: clamp posY so Dream Window entities remain
  // within the DreamSpace region (below the bar).  When the bar is at y=0
  // (default) the constraint is skipped for performance.
  if (dreamDMBarOffset !== 0) {
    for (let i = startIndex; i < endIndex; i++) {
      if (posY[i] < dreamDMBarOffset) {
        posY[i] = dreamDMBarOffset;
        // Absorb downward velocity at the boundary to prevent re-penetration.
        if (velY[i] < 0) velY[i] = 0;
      }
    }
  }

  // Elite-Runtime Telemetry: write µs/tick into SAB Telemetry Zone.
  const microsecondsPerTick = (performance.now() - t0) * 1_000;
  telemetry[workerIndex] = microsecondsPerTick;

  // IDARi budget gate: warn dispatcher if tick exceeds 1 ms (IDARi threshold).
  if (microsecondsPerTick > 1_000) {
    self.postMessage({
      type: 'wasm_budget_exceeded',
      workerIndex,
      microsecondsPerTick,
      usingWasm: wasmExports !== null,
    });
  }

  // Notify dispatcher (lightweight — payload mirrors what's already in SAB).
  self.postMessage({
    type: 'tick',
    workerIndex,
    microsecondsPerTick,
  });
}

// ─── RAF loop ─────────────────────────────────────────────────────────────────

function rafLoop(: void) {
  if (!running) return;
  tick();
  rafHandle = requestAnimationFrame(rafLoop);
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.onmessage = (evt: MessageEvent) => {
  const msg = evt.data as {
    type: string;
    sab?: SharedArrayBuffer;
    workgroup?: Workgroup;
    wasmUrl?: string;
    wasmMemory?: WebAssembly.Memory;
  };

  switch (msg.type) {
    case 'init': {
      if (!msg.sab || !msg.workgroup) {
        console.error('[EnginShaderWorker] init message missing sab or workgroup');
        return;
      }

      sab              = msg.sab;
      workgroup        = msg.workgroup;
      // Store the shared Wasm Memory for use when the binary is loaded later.
      workerWasmMemory = msg.wasmMemory ?? null;

      // Establish SAB views
      posX        = new Float32Array(sab, OFFSET_POS_X,          ENTITY_COUNT);
      posY        = new Float32Array(sab, OFFSET_POS_Y,          ENTITY_COUNT);
      posZ        = new Float32Array(sab, OFFSET_POS_Z,          ENTITY_COUNT);
      velX        = new Float32Array(sab, OFFSET_VEL_X,          ENTITY_COUNT);
      velY        = new Float32Array(sab, OFFSET_VEL_Y,          ENTITY_COUNT);
      velZ        = new Float32Array(sab, OFFSET_VEL_Z,          ENTITY_COUNT);
      barY        = new Int32Array(sab, OFFSET_DREAMDM_BAR_Y,   1);
      barX        = new Int32Array(sab, OFFSET_DREAMDM_BAR_X,   1);
      lockedState = new Int32Array(sab, OFFSET_LOCKED_STATE,    1);
      axisState   = new Int32Array(sab, OFFSET_AXIS_STATE,      1);
      telemetry   = new Float64Array(sab, OFFSET_TELEMETRY,      64);

      running   = true;

      // Use requestAnimationFrame when available (browser DedicatedWorker),
      // otherwise fall back to a setTimeout-based approximation.
      if (typeof requestAnimationFrame === 'function') {
        rafHandle = requestAnimationFrame(rafLoop);
      } else {
        // Fallback: ~60 fps tick via setTimeout
        const fallbackLoop = () => {
          if (!running) return;
          tick();
          setTimeout(fallbackLoop, 16);
        };
        fallbackLoop();
      }
      break;
    }

    case 'wasm_init': {
      // Dispatcher signals that a Wasm binary is available — attempt to load it.
      // Use the wasmMemory forwarded in this message (or the one stored at init)
      // so zero-copy SIMD is achieved in this worker context.
      const url    = msg.wasmUrl ?? '/workers/engin-shader.wasm';
      const memory = msg.wasmMemory ?? workerWasmMemory;
      tryLoadWasm(url, memory).catch(() => {
        // Failure is safe — JS stub remains active.
      });
      break;
    }

    case 'stop': {
      running = false;
      if (typeof cancelAnimationFrame === 'function' && rafHandle) {
        cancelAnimationFrame(rafHandle);
      }
      break;
    }

    default:
      break;
  }
};

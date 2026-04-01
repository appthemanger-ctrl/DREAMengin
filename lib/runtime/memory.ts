/**
 * lib/runtime/memory.ts
 *
 * DREAMengin Shared-Memory Map — Pass 1 (SoA layout)
 *
 * Defines a SharedArrayBuffer layout for 10,000 entities using a
 * Structure-of-Arrays (SoA) format.  All workers receive the same SAB and
 * operate on non-overlapping index ranges to avoid data races.
 *
 * Memory map (all offsets in bytes):
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Zone            │ Offset       │ Size (bytes) │ Type        │
 * ├─────────────────┼──────────────┼──────────────┼─────────────┤
 * │ POS_X           │          0   │       40 000 │ f32 × 10k   │
 * │ POS_Y           │     40 000   │       40 000 │ f32 × 10k   │
 * │ POS_Z           │     80 000   │       40 000 │ f32 × 10k   │
 * │ VEL_X           │    120 000   │       40 000 │ f32 × 10k   │
 * │ VEL_Y           │    160 000   │       40 000 │ f32 × 10k   │
 * │ VEL_Z           │    200 000   │       40 000 │ f32 × 10k   │
 * │ DAYDREAM_TYPE   │    240 000   │       10 000 │ u8  × 10k   │
 * │ (pad to 4B)     │    250 000   │            4 │ —           │
 * │ DREAMDM_BAR_Y   │    250 000   │            4 │ f32         │
 * │ (pad to 8B)     │    250 004   │            4 │ —           │
 * │ TELEMETRY       │    250 008   │          512 │ f64 × 64    │
 * └─────────────────┴──────────────┴──────────────┴─────────────┘
 * Total: 250 520 bytes (~245 KiB)
 *
 * Architecture justification: docs/ARCHITECTURE.md §1 (Runtime regions).
 * Workers must stay inside their assigned [startIndex, endIndex) range.
 * The DREAMDM_BAR_Y slot is written exclusively by the Surface Space
 * main-thread code so all Dream Windows can reposition without a
 * main-thread round-trip (Dual-Runtime Seam requirement).
 */

// ─── Entity / worker constants ────────────────────────────────────────────────

/** Number of entities managed by the runtime. */
export const ENTITY_COUNT = 10_000;

/** Maximum number of concurrent shader workers. */
export const MAX_WORKERS = 64;

// ─── SoA channel sizes ────────────────────────────────────────────────────────

const F32_BYTES = 4;
const F64_BYTES = 8;
const F32_CHANNEL_BYTES = ENTITY_COUNT * F32_BYTES; // 40 000 per channel

// ─── Zone offsets (bytes) ─────────────────────────────────────────────────────

/** f32 channel: entity position X */
export const OFFSET_POS_X = 0;
/** f32 channel: entity position Y */
export const OFFSET_POS_Y = OFFSET_POS_X + F32_CHANNEL_BYTES;
/** f32 channel: entity position Z */
export const OFFSET_POS_Z = OFFSET_POS_Y + F32_CHANNEL_BYTES;
/** f32 channel: entity velocity X */
export const OFFSET_VEL_X = OFFSET_POS_Z + F32_CHANNEL_BYTES;
/** f32 channel: entity velocity Y */
export const OFFSET_VEL_Y = OFFSET_VEL_X + F32_CHANNEL_BYTES;
/** f32 channel: entity velocity Z */
export const OFFSET_VEL_Z = OFFSET_VEL_Y + F32_CHANNEL_BYTES;

/**
 * u8 channel: Daydream type tag per entity.
 * 0 = unassigned, 1 = Music, 2 = Games, 3 = Lab, 4 = Code, 5 = Brand, 6 = Create.
 */
export const OFFSET_DAYDREAM_TYPE = OFFSET_VEL_Z + F32_CHANNEL_BYTES; // 240 000

/**
 * f32 scalar: DreamDM Bar y-offset in CSS pixels.
 * Written by Surface Space; read by shader workers to reposition Dream Windows
 * without a main-thread round-trip (Dual-Runtime Seam).
 *
 * Aligned to 4-byte boundary (250 000 % 4 === 0).
 */
export const OFFSET_DREAMDM_BAR_Y = OFFSET_DAYDREAM_TYPE + ENTITY_COUNT; // 250 000

/**
 * f64 array: Elite-Runtime Telemetry — microseconds-per-tick per worker.
 * Index i corresponds to worker slot i (0-indexed).
 * Each slot is 8 bytes (f64). Max slots = MAX_WORKERS.
 *
 * Aligned to 8-byte boundary: 250 004 → rounded up → 250 008.
 */
export const OFFSET_TELEMETRY = 250_008;

/** Total size of the SharedArrayBuffer in bytes. */
export const SAB_BYTES = OFFSET_TELEMETRY + MAX_WORKERS * F64_BYTES; // 250 520

// ─── Daydream type constants ──────────────────────────────────────────────────

export const DAYDREAM_TYPE_UNASSIGNED = 0;
export const DAYDREAM_TYPE_MUSIC      = 1;
export const DAYDREAM_TYPE_GAMES      = 2;
export const DAYDREAM_TYPE_LAB        = 3;
export const DAYDREAM_TYPE_CODE       = 4;
export const DAYDREAM_TYPE_BRAND      = 5;
export const DAYDREAM_TYPE_CREATE     = 6;

// ─── SAB factory ─────────────────────────────────────────────────────────────

/**
 * Allocate and zero-initialise the SharedArrayBuffer for the full entity pool.
 *
 * Must be called on the main thread.  The returned SAB is transferable to
 * shader workers via `postMessage`.
 *
 * @returns A fresh, zeroed SharedArrayBuffer sized to SAB_BYTES.
 * @throws  If SharedArrayBuffer is not available in this context.
 */
export function createEnginSAB(): SharedArrayBuffer {
  if (typeof SharedArrayBuffer === 'undefined') {
    throw new Error(
      '[EnginMemory] SharedArrayBuffer is not available. ' +
      'Ensure the page is served with Cross-Origin-Opener-Policy: same-origin ' +
      'and Cross-Origin-Embedder-Policy: require-corp headers.',
    );
  }
  return new SharedArrayBuffer(SAB_BYTES);
}

// ─── Typed-array view helpers ─────────────────────────────────────────────────

/** Float32 view of a single SoA channel (ENTITY_COUNT elements). */
export function f32Channel(sab: SharedArrayBuffer, byteOffset: number): Float32Array {
  return new Float32Array(sab, byteOffset, ENTITY_COUNT);
}

/** Uint8 view of the DAYDREAM_TYPE channel. */
export function u8DaydreamType(sab: SharedArrayBuffer): Uint8Array {
  return new Uint8Array(sab, OFFSET_DAYDREAM_TYPE, ENTITY_COUNT);
}

/**
 * Float32 scalar view for the DreamDM Bar y-offset slot.
 * Length 1 so callers use index [0].
 */
export function f32DreamDMBarY(sab: SharedArrayBuffer): Float32Array {
  return new Float32Array(sab, OFFSET_DREAMDM_BAR_Y, 1);
}

/**
 * Float64 view of the Telemetry zone.
 * Index i = microseconds-per-tick for worker slot i.
 */
export function f64Telemetry(sab: SharedArrayBuffer): Float64Array {
  return new Float64Array(sab, OFFSET_TELEMETRY, MAX_WORKERS);
}

// ─── Workgroup helpers ────────────────────────────────────────────────────────

/** A contiguous range of entity indices assigned to one worker. */
export interface Workgroup {
  /** Zero-based worker slot index. */
  workerIndex: number;
  /** First entity index (inclusive). */
  startIndex: number;
  /** Last entity index (exclusive). */
  endIndex: number;
}

/**
 * Partition ENTITY_COUNT entities into `workerCount` non-overlapping Workgroups.
 *
 * Remainder entities are distributed one-by-one to the first workers so
 * every entity is covered exactly once.
 *
 * @param workerCount  Number of shader workers (must be ≥ 1).
 */
export function buildWorkgroups(workerCount: number): Workgroup[] {
  if (workerCount < 1) {
    throw new RangeError(`[EnginMemory] workerCount must be ≥ 1, got ${workerCount}`);
  }
  const clamped = Math.min(workerCount, MAX_WORKERS);
  const base      = Math.floor(ENTITY_COUNT / clamped);
  const remainder = ENTITY_COUNT % clamped;

  const groups: Workgroup[] = [];
  let cursor = 0;
  for (let i = 0; i < clamped; i++) {
    const extra = i < remainder ? 1 : 0;
    const size  = base + extra;
    groups.push({ workerIndex: i, startIndex: cursor, endIndex: cursor + size });
    cursor += size;
  }
  return groups;
}

/**
 * Guard: verify a worker's write index is within its assigned Workgroup.
 * Returns true if the index is safe; false if it would cause data corruption.
 *
 * Used by the shader worker and IDARi/TheBoogieMan audit layer.
 */
export function isIndexInBounds(index: number, wg: Workgroup): boolean {
  return index >= wg.startIndex && index < wg.endIndex;
}

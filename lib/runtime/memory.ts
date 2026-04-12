/**
 * DREAMengin Shared Memory Map — Conform Mode
 *
 * Implements a 16 MB SharedArrayBuffer partitioned into:
 *   1. Control region (64 bytes, one cache line) — Atomics-accessible flags and seam state
 *   2. Entity SoA arrays — PosX, PosY, VelX, VelY for 10,000 entities
 *   3. HomeDream private region — protected from the Public View pointer
 *
 * DreamDM Bar Seam Logic:
 *   The bar's split ratio (0.0–1.0, stored as ratio × BAR_SEAM_SCALE) is written
 *   atomically to BAR_SEAM_ATOMICS_INDEX so both Surface Space and DreamSpace
 *   runtimes can read the current spatial split with zero latency.
 *
 * TheBoogieMan.Ai policy (C29_PRIVACY):
 *   The HomeDream private memory region starts at HOMEDREAM_PRIVATE_OFFSET.
 *   The Public View pointer must never reach or exceed PUBLIC_VIEW_LIMIT.
 *   boogieMemoryGuard() enforces this boundary — any access into the private region
 *   by a non-owner is denied with rule code C29_PRIVACY.
 *
 * Memory layout (all SoA arrays are 64-byte cache-line aligned):
 *
 *   [0 – 63]         Control region (Int32, 16 slots)
 *                      slot 0 = BAR_SEAM_ATOMICS_INDEX (bar split ratio × 1000)
 *   [64 – 40,063]    PosX[10,000] Float32
 *   [40,064 – 80,063] PosY[10,000] Float32
 *   [80,064 – 120,063] VelX[10,000] Float32
 *   [120,064 – 160,063] VelY[10,000] Float32
 *   [160,064 – 16,777,215] HomeDream private region
 *
 * Architecture: docs/ARCHITECTURE.md §1 (Runtime regions), §5 (Privacy boundaries)
 * Policy: docs/BOOGIEMAN_POLICY.md C29_PRIVACY
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/** Total shared memory size: 16 MB */
export const MEMORY_SIZE = 16 * 1024 * 1024; // 16,777,216 bytes

/** Maximum number of shader workers that may be spawned. */
export const MAX_WORKERS = 64;

/** Cache line size used for all SoA array alignment */
export const CACHE_LINE = 64; // bytes

/** Number of entities in the SoA layout */
export const ENTITY_COUNT = 10_000;

/** Bytes per Float32 element */
const FLOAT32_BYTES = 4;

// ── Control region ────────────────────────────────────────────────────────────

/**
 * Atomics index (Int32) for the DreamDM Bar seam y-offset.
 *
 * Value is the bar split ratio × BAR_SEAM_SCALE stored as a signed integer.
 * Example: split ratio 0.9 → stored as 900.
 *
 * Both Surface Space and DreamSpace runtimes read this via Atomics.load() for
 * zero-latency access to the current spatial split.
 */
export const BAR_SEAM_ATOMICS_INDEX = 0;

/** Fixed-point scale factor: ratio × BAR_SEAM_SCALE = stored integer */
export const BAR_SEAM_SCALE = 1_000;

// ── SoA array byte offsets (each array is 64-byte aligned) ───────────────────

/** Byte offset of the PosX array (entity position X) */
export const SOA_POSX_OFFSET = CACHE_LINE; // 64

/** Byte offset of the PosY array (entity position Y) */
export const SOA_POSY_OFFSET = SOA_POSX_OFFSET + ENTITY_COUNT * FLOAT32_BYTES; // 40,064

/** Byte offset of the VelX array (entity velocity X) */
export const SOA_VELX_OFFSET = SOA_POSY_OFFSET + ENTITY_COUNT * FLOAT32_BYTES; // 80,064

/** Byte offset of the VelY array (entity velocity Y) */
export const SOA_VELY_OFFSET = SOA_VELX_OFFSET + ENTITY_COUNT * FLOAT32_BYTES; // 120,064

/** Byte offset one past the last entity byte */
const SOA_END_OFFSET = SOA_VELY_OFFSET + ENTITY_COUNT * FLOAT32_BYTES; // 160,064

// ── Privacy boundary ──────────────────────────────────────────────────────────

/**
 * Byte offset where the HomeDream private memory region begins.
 * Rounded up to the next 64-byte cache-line boundary.
 *
 * Everything at or above this offset is private to the authenticated HomeDream owner.
 * Public View consumers must not access bytes >= HOMEDREAM_PRIVATE_OFFSET.
 */
export const HOMEDREAM_PRIVATE_OFFSET: number =
  Math.ceil(SOA_END_OFFSET / CACHE_LINE) * CACHE_LINE; // 160,064

/**
 * The exclusive upper bound for Public View pointer access.
 * Identical to HOMEDREAM_PRIVATE_OFFSET — the boundary where private memory begins.
 */
export const PUBLIC_VIEW_LIMIT = HOMEDREAM_PRIVATE_OFFSET;

// ── Conform Mode memory map ───────────────────────────────────────────────────

/**
 * The DREAMengin Shared Memory Map for Conform Mode.
 *
 * Allocated once per runtime context and shared between Surface Space and
 * DreamSpace via Worker postMessage transfer or direct SharedArrayBuffer access.
 */
export interface ConformMemoryMap {
  /** The raw 16 MB shared buffer */
  readonly buffer: SharedArrayBuffer;
  /** Int32 view over the control region — use with Atomics */
  readonly control: Int32Array;
  /** Float32 views for each SoA entity array */
  readonly posX: Float32Array;
  readonly posY: Float32Array;
  readonly velX: Float32Array;
  readonly velY: Float32Array;
}

/** Singleton instance — allocated once per runtime context */
let _memoryMap: ConformMemoryMap | null = null;

/**
 * Returns (or allocates) the singleton Conform Mode shared memory map.
 *
 * Safe to call from both Surface Space and DreamSpace — always returns the
 * same SharedArrayBuffer instance within a single runtime context.
 */
export function getConformMemoryMap(): ConformMemoryMap {
  if (_memoryMap) return _memoryMap;

  const buffer = new SharedArrayBuffer(MEMORY_SIZE);

  _memoryMap = {
    buffer,
    // Control region: first 64 bytes → 16 Int32 slots (CACHE_LINE / 4)
    control: new Int32Array(buffer, 0, CACHE_LINE / 4),
    posX: new Float32Array(buffer, SOA_POSX_OFFSET, ENTITY_COUNT),
    posY: new Float32Array(buffer, SOA_POSY_OFFSET, ENTITY_COUNT),
    velX: new Float32Array(buffer, SOA_VELX_OFFSET, ENTITY_COUNT),
    velY: new Float32Array(buffer, SOA_VELY_OFFSET, ENTITY_COUNT),
  };

  return _memoryMap;
}

/**
 * Resets the singleton for testing purposes.
 * @internal — never call in production code.
 */
export function _resetConformMemoryMap(): void {
  _memoryMap = null;
}

// ── DreamDM Bar Seam Logic ────────────────────────────────────────────────────

/**
 * Writes the current DreamDM Bar split ratio to the shared control region.
 *
 * Uses Atomics.store() so both Surface Space and DreamSpace runtimes can read
 * the current spatial split with zero latency and no lock contention.
 *
 * @param splitRatio - Bar split ratio in [0.0, 1.0].
 *   0.1 = Dream-focus | 0.5 = balanced | 0.9 = Surface-focus | 1.0 = Surface-only.
 */
export function writeBarSeam(splitRatio: number): void {
  const map = getConformMemoryMap();
  const encoded = Math.round(splitRatio * BAR_SEAM_SCALE);
  Atomics.store(map.control, BAR_SEAM_ATOMICS_INDEX, encoded);
}

/**
 * Reads the current DreamDM Bar split ratio from the shared control region.
 *
 * Uses Atomics.load() for a sequentially consistent read visible to all runtimes.
 *
 * @returns Current split ratio (0.0–1.0).
 */
export function readBarSeam(): number {
  const map = getConformMemoryMap();
  const encoded = Atomics.load(map.control, BAR_SEAM_ATOMICS_INDEX);
  return encoded / BAR_SEAM_SCALE;
}

// ── TheBoogieMan.Ai memory policy guard ───────────────────────────────────────

/**
 * Result of a BoogieMan memory access policy check.
 */
export interface MemoryPolicyResult {
  /** Whether the access is permitted */
  allowed: boolean;
  /** Policy rule code — 'OK' on success, or the violated rule on denial */
  ruleCode: 'OK' | 'C29_PRIVACY' | 'MEM_PRIVATE_ACCESS';
  /** Human-readable denial reason (undefined when allowed) */
  reason?: string;
}

/**
 * TheBoogieMan.Ai memory access guard — Conform Mode policy enforcement.
 *
 * Enforces the HomeDream private memory boundary:
 *   - Accesses within [0, PUBLIC_VIEW_LIMIT) are always permitted.
 *   - Accesses within [HOMEDREAM_PRIVATE_OFFSET, MEMORY_SIZE) require isOwner === true.
 *   - Out-of-range accesses are denied unconditionally.
 *
 * Policy: C29_PRIVACY (docs/BOOGIEMAN_POLICY.md)
 * Architecture: docs/ARCHITECTURE.md §5 (Privacy boundaries)
 *
 * @param byteOffset - The byte offset being accessed.
 * @param isOwner    - True when the accessor is the authenticated HomeDream owner.
 */
export function boogieMemoryGuard(
  byteOffset: number,
  isOwner: boolean,
): MemoryPolicyResult {
  // Out-of-range access — deny unconditionally
  if (byteOffset < 0 || byteOffset >= MEMORY_SIZE) {
    return {
      allowed: false,
      ruleCode: 'MEM_PRIVATE_ACCESS',
      reason: `Byte offset ${byteOffset} is out of the valid range [0, ${MEMORY_SIZE}).`,
    };
  }

  // Public View region — accessible to all consumers
  if (byteOffset < PUBLIC_VIEW_LIMIT) {
    return { allowed: true, ruleCode: 'OK' };
  }

  // HomeDream private region — owner-only access
  if (!isOwner) {
    return {
      allowed: false,
      ruleCode: 'C29_PRIVACY',
      reason:
        `Access denied: offset ${byteOffset} falls within the HomeDream private memory region ` +
        `(starts at ${HOMEDREAM_PRIVATE_OFFSET}). ` +
        `The Public View pointer must not reach or exceed ${PUBLIC_VIEW_LIMIT}.`,
    };
  }

  return { allowed: true, ruleCode: 'OK' };
}

// ── EnginSAB — Shader Worker shared memory layout ────────────────────────────
//
// Layout (SoA, 3-axis + per-entity type byte + seam slot + telemetry zone):
//
//   [0       – 39,999]  OFFSET_POS_X         posX[10,000]    Float32
//   [40,000  – 79,999]  OFFSET_POS_Y         posY[10,000]    Float32
//   [80,000  – 119,999] OFFSET_POS_Z         posZ[10,000]    Float32
//   [120,000 – 159,999] OFFSET_VEL_X         velX[10,000]    Float32
//   [160,000 – 199,999] OFFSET_VEL_Y         velY[10,000]    Float32
//   [200,000 – 239,999] OFFSET_VEL_Z         velZ[10,000]    Float32
//   [240,000 – 249,999] OFFSET_DAYDREAM_TYPE  type[10,000]   Uint8 (daydream class)
//   [250,000 – 250,003] OFFSET_DREAMDM_BAR_Y               Float32 (1 slot, 4-byte aligned)
//   [250,008 – 250,519] OFFSET_TELEMETRY                    Float64 (64 slots, 8-byte aligned)
//
// SAB_BYTES = OFFSET_TELEMETRY + MAX_WORKERS * 8 = 250,520
//
// Architecture: docs/ARCHITECTURE.md §1 (Runtime regions)

const _ENGIN_ENTITY_COUNT  = 10_000;
const _ENGIN_F32_BYTES     = 4;
const _ENGIN_CHANNEL_BYTES = _ENGIN_ENTITY_COUNT * _ENGIN_F32_BYTES; // 40,000

/** Byte offset of the posX SoA channel. */
export const OFFSET_POS_X: number = 0;
/** Byte offset of the posY SoA channel. */
export const OFFSET_POS_Y: number = OFFSET_POS_X + _ENGIN_CHANNEL_BYTES;      // 40,000
/** Byte offset of the posZ SoA channel. */
export const OFFSET_POS_Z: number = OFFSET_POS_Y + _ENGIN_CHANNEL_BYTES;      // 80,000
/** Byte offset of the velX SoA channel. */
export const OFFSET_VEL_X: number = OFFSET_POS_Z + _ENGIN_CHANNEL_BYTES;      // 120,000
/** Byte offset of the velY SoA channel. */
export const OFFSET_VEL_Y: number = OFFSET_VEL_X + _ENGIN_CHANNEL_BYTES;      // 160,000
/** Byte offset of the velZ SoA channel. */
export const OFFSET_VEL_Z: number = OFFSET_VEL_Y + _ENGIN_CHANNEL_BYTES;      // 200,000
/** Byte offset of the daydream-type byte array (Uint8, one per entity). */
export const OFFSET_DAYDREAM_TYPE: number = OFFSET_VEL_Z + _ENGIN_CHANNEL_BYTES; // 240,000
/**
 * Byte offset of the DreamDM Bar y-offset slot (Float32, 1 element).
 * Fixed at 250,000 — 4-byte aligned, leaves a gap after DAYDREAM_TYPE for
 * future per-entity metadata without breaking the Atomics alignment contract.
 */
export const OFFSET_DREAMDM_BAR_Y = 250_000;
/**
 * Byte offset of the SAB Telemetry Zone (Float64, MAX_WORKERS elements).
 * Fixed at 250,008 — 8-byte aligned.
 */
export const OFFSET_TELEMETRY = 250_008;

/** Total size of the EnginSAB in bytes. */
export const SAB_BYTES = OFFSET_TELEMETRY + MAX_WORKERS * 8; // 250,520

/**
 * A non-overlapping slice of entity indices assigned to one shader worker.
 */
export interface Workgroup {
  /** Zero-based worker index (matches telemetry slot). */
  workerIndex: number;
  /** First entity index assigned to this worker (inclusive). */
  startIndex: number;
  /** One past the last entity index (exclusive). */
  endIndex: number;
}

/**
 * Allocate the EnginSAB used by all shader workers.
 *
 * The returned SharedArrayBuffer is SAB_BYTES in size, zero-initialised, and
 * holds the full 3-axis SoA entity layout + the DreamDM Bar seam slot + the
 * telemetry zone.
 */
export function createEnginSAB(): SharedArrayBuffer {
  return new SharedArrayBuffer(SAB_BYTES);
}

/**
 * Partition ENTITY_COUNT entities into `workerCount` non-overlapping Workgroups
 * for distribution to shader workers.
 *
 * @throws {RangeError} when `workerCount` is less than 1.
 */
export function buildWorkgroups(workerCount: number): Workgroup[] {
  if (workerCount < 1) {
    throw new RangeError(`workerCount must be ≥ 1, got ${workerCount}`);
  }
  // Clamp to the maximum allowed number of workers.
  const count = Math.min(workerCount, MAX_WORKERS);
  const perWorker = Math.ceil(ENTITY_COUNT / count);
  const groups: Workgroup[] = [];
  for (let i = 0; i < count; i++) {
    const startIndex = i * perWorker;
    const endIndex = Math.min(startIndex + perWorker, ENTITY_COUNT);
    groups.push({ workerIndex: i, startIndex, endIndex });
    if (endIndex >= ENTITY_COUNT) break;
  }
  return groups;
}

/**
 * Pure bounds-guard helper — returns true when `index` is within the
 * workgroup's assigned [startIndex, endIndex) range.
 *
 * Extracted as a standalone export so both the worker and unit tests can
 * share the same logic without spawning a Worker.
 */
export function isIndexInBounds(index: number, wg: Workgroup): boolean {
  return index >= wg.startIndex && index < wg.endIndex;
}

/**
 * Return a Float32Array of length ENTITY_COUNT starting at `byteOffset`.
 * Use for posX / posY / posZ / velX / velY / velZ channels.
 */
export function f32Channel(sab: SharedArrayBuffer, byteOffset: number): Float32Array {
  return new Float32Array(sab, byteOffset, ENTITY_COUNT);
}

/**
 * Return a Uint8Array of length ENTITY_COUNT at OFFSET_DAYDREAM_TYPE.
 * Each slot holds the daydream-class identifier for the corresponding entity.
 */
export function u8DaydreamType(sab: SharedArrayBuffer): Uint8Array {
  return new Uint8Array(sab, OFFSET_DAYDREAM_TYPE, ENTITY_COUNT);
}

/**
 * Return a Float32Array (1 element) positioned at the DreamDM Bar Y slot.
 */
export function f32DreamDMBarY(sab: SharedArrayBuffer): Float32Array {
  return new Float32Array(sab, OFFSET_DREAMDM_BAR_Y, 1);
}

/**
 * Return a Float64Array (MAX_WORKERS elements) covering the telemetry zone.
 * Worker i writes µs/tick to slot i.
 */
export function f64Telemetry(sab: SharedArrayBuffer): Float64Array {
  return new Float64Array(sab, OFFSET_TELEMETRY, MAX_WORKERS);
}

// ── Convenience aliases (previously ENGIN_OFFSET_* names) ────────────────────
// Kept for internal use; the canonical names above are the public API.
/** @internal */ export const ENGIN_OFFSET_POS_X         = OFFSET_POS_X;
/** @internal */ export const ENGIN_OFFSET_POS_Y         = OFFSET_POS_Y;
/** @internal */ export const ENGIN_OFFSET_POS_Z         = OFFSET_POS_Z;
/** @internal */ export const ENGIN_OFFSET_VEL_X         = OFFSET_VEL_X;
/** @internal */ export const ENGIN_OFFSET_VEL_Y         = OFFSET_VEL_Y;
/** @internal */ export const ENGIN_OFFSET_VEL_Z         = OFFSET_VEL_Z;
/** @internal */ export const ENGIN_OFFSET_DREAMDM_BAR_Y = OFFSET_DREAMDM_BAR_Y;
/** @internal */ export const ENGIN_OFFSET_TELEMETRY     = OFFSET_TELEMETRY;
/** @internal */ export const ENGIN_SAB_SIZE             = SAB_BYTES;

// ── Improvement 48: isSABAvailable ───────────────────────────────────────────

/**
 * Returns true when SharedArrayBuffer is available AND the page is served with
 * the required COOP/COEP headers (crossOriginIsolated).
 *
 * Calling `new SharedArrayBuffer()` without crossOriginIsolated throws a
 * TypeError in modern browsers. Use this check before calling createEnginSAB()
 * or getConformMemoryMap() to avoid cryptic crashes.
 */
export function isSABAvailable(): boolean {
  if (typeof SharedArrayBuffer === 'undefined') return false;
  if (typeof crossOriginIsolated !== 'undefined' && !crossOriginIsolated) return false;
  try {
    // Allocate the smallest valid SAB as a final runtime check.
    new SharedArrayBuffer(4);
    return true;
  } catch {
    return false;
  }
}

// ── Improvement 49: getEntityBounds ──────────────────────────────────────────

/**
 * Return the byte-level extent of a workgroup across all SoA channels.
 * Useful for allocating sub-views or verifying workgroup memory isolation.
 */
export interface EntityBounds {
  posXStart: number;
  posXEnd: number;
  posYStart: number;
  posYEnd: number;
  velXStart: number;
  velXEnd: number;
  velYStart: number;
  velYEnd: number;
}

export function getEntityBounds(wg: Workgroup): EntityBounds {
  const F32 = 4;
  return {
    posXStart: OFFSET_POS_X + wg.startIndex * F32,
    posXEnd:   OFFSET_POS_X + wg.endIndex   * F32,
    posYStart: OFFSET_POS_Y + wg.startIndex * F32,
    posYEnd:   OFFSET_POS_Y + wg.endIndex   * F32,
    velXStart: OFFSET_VEL_X + wg.startIndex * F32,
    velXEnd:   OFFSET_VEL_X + wg.endIndex   * F32,
    velYStart: OFFSET_VEL_Y + wg.startIndex * F32,
    velYEnd:   OFFSET_VEL_Y + wg.endIndex   * F32,
  };
}

// ── Improvement 50: validateWorkgroup ────────────────────────────────────────

/**
 * Throws a `RangeError` when the workgroup has invalid indices.
 * Call before spawning a worker to catch configuration errors early.
 */
export function validateWorkgroup(wg: Workgroup): void {
  if (wg.startIndex < 0) {
    throw new RangeError(`Workgroup ${wg.workerIndex}: startIndex ${wg.startIndex} must be ≥ 0`);
  }
  if (wg.endIndex > ENTITY_COUNT) {
    throw new RangeError(
      `Workgroup ${wg.workerIndex}: endIndex ${wg.endIndex} exceeds ENTITY_COUNT (${ENTITY_COUNT})`,
    );
  }
  if (wg.startIndex >= wg.endIndex) {
    throw new RangeError(
      `Workgroup ${wg.workerIndex}: startIndex ${wg.startIndex} must be < endIndex ${wg.endIndex}`,
    );
  }
}

// ── Improvement 51: getWorkerCount ───────────────────────────────────────────

/**
 * Return the optimal number of shader workers for the current hardware.
 * Uses `navigator.hardwareConcurrency − 1` (min 1, max MAX_WORKERS) so at
 * least one thread is left for the main loop.
 * Safe to call in Node.js / SSR — falls back to 1.
 */
export function getWorkerCount(): number {
  const concurrency =
    typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 2;
  return Math.min(Math.max(concurrency - 1, 1), MAX_WORKERS);
}

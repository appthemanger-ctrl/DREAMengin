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

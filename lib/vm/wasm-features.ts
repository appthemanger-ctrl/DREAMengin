/**
 * lib/vm/wasm-features.ts — WebAssembly 2.0 Feature Detection
 *
 * Detects runtime support for WASM proposals:
 *   SIMD, threads (SharedArrayBuffer), bulk-memory,
 *   multi-memory, exceptions, tail-call, reference-types.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WasmFeatureSet {
  /** WASM SIMD (128-bit vector operations). */
  simd: boolean;
  /** Threads proposal — requires SharedArrayBuffer. */
  threads: boolean;
  /** Bulk-memory operations (memory.copy / memory.fill). */
  bulkMemory: boolean;
  /** Multi-memory proposal (>1 memory per module). */
  multiMemory: boolean;
  /** Exception-handling proposal. */
  exceptions: boolean;
  /** Tail-call proposal (return_call). */
  tailCall: boolean;
  /** Reference-types proposal (externref / funcref). */
  referenceTypes: boolean;
}

// ─── Feature detection helpers ────────────────────────────────────────────────

function tryValidate(bytes: number[]): boolean {
  try {
    return WebAssembly.validate(new Uint8Array(bytes));
  } catch {
    return false;
  }
}

function detectSIMD(): boolean {
  // Minimal module: one function returning v128 via i32x4.splat
  // magic + version + type(()->v128) + func + code(i32.const 0; i32x4.splat; drop; end)
  return tryValidate([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b,
    0x03, 0x02, 0x01, 0x00,
    0x0a, 0x0a, 0x01, 0x08, 0x00,
    0x41, 0x00, 0xfd, 0x0f, 0x1a, 0x0b,
  ]);
}

function detectThreads(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}

function detectBulkMemory(): boolean {
  // memory.copy: 0xfc 0x0a 0x00 0x00
  return tryValidate([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
    0x03, 0x02, 0x01, 0x00,
    0x05, 0x03, 0x01, 0x00, 0x01,
    0x0a, 0x0d, 0x01, 0x0b, 0x00,
    0x41, 0x00, 0x41, 0x00, 0x41, 0x00,
    0xfc, 0x0a, 0x00, 0x00,
    0x0b,
  ]);
}

function detectMultiMemory(): boolean {
  // Module with 2 memory entries (multi-memory proposal)
  return tryValidate([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x05, 0x05, 0x02,
    0x00, 0x01,
    0x00, 0x01,
  ]);
}

function detectExceptions(): boolean {
  // Exception proposal: tag section (0x0d)
  return tryValidate([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
    0x03, 0x02, 0x01, 0x00,
    0x0d, 0x03, 0x01, 0x00, 0x00,
    0x0a, 0x09, 0x01, 0x07, 0x00,
    0x06, 0x00, 0x00, 0x19, 0x00, 0x0b,
  ]);
}

function detectTailCall(): boolean {
  // return_call 0 (opcode 0x12)
  return tryValidate([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
    0x03, 0x02, 0x01, 0x00,
    0x0a, 0x06, 0x01, 0x04, 0x00,
    0x12, 0x00,
    0x0b,
  ]);
}

function detectReferenceTypes(): boolean {
  // Table of externref (0x6f)
  return tryValidate([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
    0x03, 0x02, 0x01, 0x00,
    0x04, 0x04, 0x01, 0x6f, 0x00, 0x00,
    0x0a, 0x04, 0x01, 0x02, 0x00, 0x0b,
  ]);
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _cached: WasmFeatureSet | null = null;

/**
 * detectWasmFeatures()
 *
 * Probes the current JS engine for WebAssembly 2.0 proposal support.
 * Results are cached after the first call.
 */
export function detectWasmFeatures(): WasmFeatureSet {
  if (_cached) return _cached;

  _cached = {
    simd:           detectSIMD(),
    threads:        detectThreads(),
    bulkMemory:     detectBulkMemory(),
    multiMemory:    detectMultiMemory(),
    exceptions:     detectExceptions(),
    tailCall:       detectTailCall(),
    referenceTypes: detectReferenceTypes(),
  };

  return _cached;
}

/** Reset the feature detection cache (useful in tests). */
export function resetWasmFeatureCache(): void {
  _cached = null;
}

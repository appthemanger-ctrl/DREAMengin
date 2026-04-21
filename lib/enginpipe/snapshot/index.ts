/**
 * lib/enginpipe/snapshot/index.ts
 *
 * Component 5 — State Snapshot System
 *
 * Provides a WASM-compatible snapshot API that any Engin can use to:
 *   • Serialise live state to a compact binary buffer (Uint8Array)
 *   • Restore state from a previously written buffer
 *   • Query the byte size of the serialised form before allocating
 *
 * The wire format is a length-prefixed JSON payload with a 20-byte header:
 *
 *   Offset  Length  Field
 *   ──────  ──────  ──────────────────────────────────────────────────────
 *   0       4       Magic: 0xDE_EA_01_00  (DREAM + ENGIN + version byte)
 *   4       4       Schema version (uint32 LE)
 *   8       4       Timestamp low 32 bits (uint32 LE, ms epoch)
 *   12      4       Timestamp high 32 bits (uint32 LE, ms epoch)
 *   16      4       Payload byte length (uint32 LE)
 *   20      N       UTF-8 JSON payload
 *   20+N    4       CRC-32c checksum of the JSON bytes (uint32 LE)
 *
 * Total fixed overhead: 24 bytes per snapshot.
 *
 * Server-safe: pure TypeScript, no React, no DOM, no Node.js builtins.
 * Works in browser, Node 18+, and WebAssembly host environments.
 *
 * Spec: docs/enginpipe/README.md §5
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const MAGIC_BYTE_0 = 0xde;
const MAGIC_BYTE_1 = 0xea;
const MAGIC_BYTE_2 = 0x01;
const MAGIC_BYTE_3 = 0x00;
const HEADER_SIZE  = 20; // bytes before payload
const CHECKSUM_SIZE = 4; // bytes after payload
const CURRENT_SCHEMA_VERSION = 1;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SnapshotMeta {
  /** Schema version embedded in the snapshot header. */
  schemaVersion: number;
  /** Epoch milliseconds when the snapshot was written. */
  timestamp: number;
  /** Artifact ID embedded in the JSON payload. */
  artifactId: string;
}

export interface SnapshotReadResult {
  meta: SnapshotMeta;
  state: Record<string, unknown>;
}

export type SnapshotValidationError =
  | 'INVALID_MAGIC'
  | 'SCHEMA_VERSION_MISMATCH'
  | 'CHECKSUM_MISMATCH'
  | 'PAYLOAD_PARSE_ERROR'
  | 'BUFFER_TOO_SHORT';

export interface SnapshotManager {
  /**
   * Returns the total byte count the snapshot for `state` will occupy.
   * Use this to pre-allocate a buffer before calling `writeSnapshot`.
   */
  getSnapshotSize(state: Record<string, unknown>, artifactId: string): number;

  /**
   * Serialise `state` into a new `Uint8Array` buffer.
   * The buffer is self-describing and can be passed to `loadSnapshot`
   * on any platform.
   */
  writeSnapshot(state: Record<string, unknown>, artifactId: string): Uint8Array;

  /**
   * Deserialise a buffer produced by `writeSnapshot`.
   * Throws a typed `SnapshotValidationError` string on invalid input.
   */
  loadSnapshot(buffer: Uint8Array): SnapshotReadResult;

  /**
   * Validate a buffer without fully deserialising it.
   * Returns `null` on success, or a `SnapshotValidationError` string.
   */
  validateSnapshot(buffer: Uint8Array): SnapshotValidationError | null;
}

// ─── CRC-32c implementation (pure JS, no lookup table required for small payloads) ──

/**
 * Compute a 32-bit checksum over `bytes` using the Castagnoli polynomial.
 * This is the same polynomial used by iSCSI, SCTP, and ext4 — chosen for
 * its good error-detection properties and hardware acceleration availability.
 *
 * Implementation: standard bit-by-bit CRC-32c (not table-driven) to keep
 * the bundle small.  For payloads < 1 MB the performance is adequate.
 */
function crc32c(bytes: Uint8Array): number {
  const POLY = 0x82f63b78;
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ─── Encode / decode helpers ──────────────────────────────────────────────────

const TEXT_ENCODER = typeof TextEncoder !== 'undefined'
  ? new TextEncoder()
  : { encode: (s: string) => Buffer.from(s, 'utf8') as unknown as Uint8Array };

const TEXT_DECODER = typeof TextDecoder !== 'undefined'
  ? new TextDecoder('utf-8', { fatal: true })
  : { decode: (b: Uint8Array) => Buffer.from(b).toString('utf8') };

function encodeJson(obj: unknown): Uint8Array {
  return TEXT_ENCODER.encode(JSON.stringify(obj));
}

function decodeJson(bytes: Uint8Array): unknown {
  return JSON.parse(TEXT_DECODER.decode(bytes));
}

// ─── write32LE / read32LE helpers ─────────────────────────────────────────────

function write32LE(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value, true /* little-endian */);
}

function read32LE(view: DataView, offset: number): number {
  return view.getUint32(offset, true /* little-endian */);
}

// ─── createSnapshotManager factory ───────────────────────────────────────────

/**
 * Create a `SnapshotManager` bound to a fixed schema version.
 *
 * @param schemaVersion — bumped whenever the payload shape changes in a
 *   breaking way.  Defaults to `1`.  `loadSnapshot` will reject buffers
 *   with a mismatched schema version.
 */
export function createSnapshotManager(schemaVersion = CURRENT_SCHEMA_VERSION): SnapshotManager {

  return {
    getSnapshotSize(state, artifactId) {
      const payload = encodeJson({ artifactId, state });
      return HEADER_SIZE + payload.byteLength + CHECKSUM_SIZE;
    },

    writeSnapshot(state, artifactId) {
      const payload  = encodeJson({ artifactId, state });
      const totalLen = HEADER_SIZE + payload.byteLength + CHECKSUM_SIZE;
      const buf      = new Uint8Array(totalLen);
      const view     = new DataView(buf.buffer);

      // Header
      buf[0] = MAGIC_BYTE_0;
      buf[1] = MAGIC_BYTE_1;
      buf[2] = MAGIC_BYTE_2;
      buf[3] = MAGIC_BYTE_3;
      write32LE(view, 4, schemaVersion);

      const now = Date.now();
      write32LE(view, 8,  now >>> 0);           // low 32
      write32LE(view, 12, Math.floor(now / 0x1_0000_0000)); // high 32
      write32LE(view, 16, payload.byteLength);

      // Payload
      buf.set(payload, HEADER_SIZE);

      // Checksum
      const crc = crc32c(payload);
      write32LE(view, HEADER_SIZE + payload.byteLength, crc);

      return buf;
    },

    loadSnapshot(buffer) {
      const err = this.validateSnapshot(buffer);
      if (err) throw new Error(err);

      const view       = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const tsLow      = read32LE(view, 8);
      const tsHigh     = read32LE(view, 12);
      const timestamp  = tsHigh * 0x1_0000_0000 + tsLow;
      const payloadLen = read32LE(view, 16);
      const sv         = read32LE(view, 4);

      const payloadBytes = buffer.subarray(HEADER_SIZE, HEADER_SIZE + payloadLen);

      let parsed: { artifactId: string; state: Record<string, unknown> };
      try {
        parsed = decodeJson(payloadBytes) as typeof parsed;
      } catch {
        throw new Error('PAYLOAD_PARSE_ERROR' satisfies SnapshotValidationError);
      }

      return {
        meta: {
          schemaVersion: sv,
          timestamp,
          artifactId: parsed.artifactId,
        },
        state: parsed.state,
      };
    },

    validateSnapshot(buffer) {
      if (buffer.byteLength < HEADER_SIZE + CHECKSUM_SIZE) {
        return 'BUFFER_TOO_SHORT';
      }

      // Magic bytes
      if (
        buffer[0] !== MAGIC_BYTE_0 ||
        buffer[1] !== MAGIC_BYTE_1 ||
        buffer[2] !== MAGIC_BYTE_2 ||
        buffer[3] !== MAGIC_BYTE_3
      ) {
        return 'INVALID_MAGIC';
      }

      const view    = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const sv      = read32LE(view, 4);
      if (sv !== schemaVersion) return 'SCHEMA_VERSION_MISMATCH';

      const payloadLen   = read32LE(view, 16);
      if (buffer.byteLength < HEADER_SIZE + payloadLen + CHECKSUM_SIZE) {
        return 'BUFFER_TOO_SHORT';
      }

      const payloadBytes = buffer.subarray(HEADER_SIZE, HEADER_SIZE + payloadLen);
      const storedCrc    = read32LE(view, HEADER_SIZE + payloadLen);
      const actualCrc    = crc32c(payloadBytes);
      if (storedCrc !== actualCrc) return 'CHECKSUM_MISMATCH';

      return null;
    },
  };
}

// ─── Default singleton ────────────────────────────────────────────────────────

/**
 * Default `SnapshotManager` bound to schema version 1.
 * Import and use directly — or call `createSnapshotManager` for a custom version.
 */
export const snapshotManager: SnapshotManager = createSnapshotManager(CURRENT_SCHEMA_VERSION);

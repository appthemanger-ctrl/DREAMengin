/**
 * lib/runtime/snapshotFingerprint.ts
 *
 * Lightweight fingerprinting for TelemetrySnapshot objects so the IDARi loop
 * can skip redundant AI calls when nothing has changed.
 *
 * Improvements 73-75:
 *  73. fingerprintSnapshot  — produces a short stable string from key stats
 *  74. snapshotsAreEquivalent — compare two fingerprints
 *  75. createFingerprintCache — LRU-style cache for fingerprint → analysis reuse
 */

import type { TelemetrySnapshot } from '@/lib/observability/collector';

// ── Improvement 73: fingerprintSnapshot ──────────────────────────────────────

/**
 * Produce a short stable fingerprint string from the key dimensions of a
 * TelemetrySnapshot. Two snapshots with the same counts and the same set of
 * error messages are considered equivalent for the purposes of AI-call dedup.
 *
 * Format: `logs:metrics:traces:errors:<errorDigest>`
 * Where errorDigest is a simple checksum of the first 5 error messages.
 */
export function fingerprintSnapshot(snapshot: TelemetrySnapshot): string {
  const errorMessages = snapshot.logs
    .filter((l) => l.level === 'error')
    .slice(0, 5)
    .map((l) => l.message)
    .join('|');

  // Simple djb2-style hash of the error messages string
  let hash = 5381;
  for (let i = 0; i < errorMessages.length; i++) {
    hash = ((hash << 5) + hash) ^ errorMessages.charCodeAt(i);
    hash = hash >>> 0; // keep as unsigned 32-bit
  }

  return `${snapshot.logs.length}:${snapshot.metrics.length}:${snapshot.traces.length}:${
    snapshot.logs.filter((l) => l.level === 'error').length
  }:${hash.toString(16)}`;
}

// ── Improvement 74: snapshotsAreEquivalent ────────────────────────────────────

/**
 * Return true when two fingerprints represent equivalent snapshots.
 * A pure string equality check — the caller is responsible for producing
 * fingerprints via fingerprintSnapshot().
 */
export function snapshotsAreEquivalent(a: string, b: string): boolean {
  return a === b;
}

// ── Improvement 75: createFingerprintCache ────────────────────────────────────

export interface FingerprintCacheEntry<T> {
  fingerprint: string;
  value: T;
  createdAt: number;
}

export interface FingerprintCache<T> {
  /** Store a value keyed by fingerprint. Evicts oldest when full. */
  set(fingerprint: string, value: T): void;
  /** Return the cached value for a fingerprint, or undefined on miss. */
  get(fingerprint: string): T | undefined;
  /** Return true when the fingerprint is in the cache. */
  has(fingerprint: string): boolean;
  /** Clear all cached entries. */
  clear(): void;
  /** Current number of entries. */
  readonly size: number;
}

/**
 * Create a simple LRU-style fingerprint cache.
 *
 * When the cache reaches `maxSize` entries, the oldest entry (by creation
 * timestamp) is evicted to make room for the new entry.
 *
 * Typical usage: cache AI analysis results keyed by snapshot fingerprint so
 * repeated identical snapshots skip the AI call entirely.
 *
 * @param maxSize Maximum number of entries. Default: 20.
 */
export function createFingerprintCache<T>(maxSize = 20): FingerprintCache<T> {
  const store = new Map<string, FingerprintCacheEntry<T>>();

  return {
    set(fingerprint: string, value: T): void {
      if (store.has(fingerprint)) {
        // Update in-place (refresh timestamp)
        store.set(fingerprint, { fingerprint, value, createdAt: Date.now() });
        return;
      }
      if (store.size >= maxSize) {
        // Evict the oldest entry
        let oldestKey: string | null = null;
        let oldestTime = Infinity;
        for (const [key, entry] of store) {
          if (entry.createdAt < oldestTime) {
            oldestTime = entry.createdAt;
            oldestKey = key;
          }
        }
        if (oldestKey) store.delete(oldestKey);
      }
      store.set(fingerprint, { fingerprint, value, createdAt: Date.now() });
    },

    get(fingerprint: string): T | undefined {
      return store.get(fingerprint)?.value;
    },

    has(fingerprint: string): boolean {
      return store.has(fingerprint);
    },

    clear(): void {
      store.clear();
    },

    get size(): number {
      return store.size;
    },
  };
}

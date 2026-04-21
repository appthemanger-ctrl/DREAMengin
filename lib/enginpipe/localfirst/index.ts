/**
 * lib/enginpipe/localfirst/index.ts
 *
 * Component 10 — Local-First Development Principle
 *
 * The Local-First store is the DREAMengin Engin Pipe's primary data
 * substrate for development and offline scenarios:
 *
 *   • When external APIs (Supabase, Groq, etc.) are unconfigured or
 *     unavailable, Engins fall back to this in-memory file-system-style store.
 *   • The store is serialisable to/from a plain JSON blob, enabling
 *     persist-to-disk in Node and persist-to-localStorage in browsers.
 *   • A simple `ExternalAdapter` interface lets hosts swap in the real
 *     backend when it becomes available (hot-swap, no restart required).
 *
 * Design rule (docs/AGENT_PLAYBOOK.md §5):
 *   "File system as primary DB; cached fallback when external APIs unset."
 *
 * The store is path-based (similar to a virtual filesystem):
 *   store.write('sessions/abc123', { ... })
 *   store.read('sessions/abc123')
 *   store.list('sessions/')
 *   store.delete('sessions/abc123')
 *
 * Server-safe: pure TypeScript, no React, no DOM, no Node.js builtins.
 *
 * Spec: docs/enginpipe/README.md §10
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type LocalFirstValue = Record<string, unknown>;

export interface LocalFirstEntry {
  readonly path: string;
  readonly value: LocalFirstValue;
  readonly writtenAt: number;
  readonly version: number;
}

export interface StoreSnapshot {
  readonly version: 1;
  readonly entries: readonly LocalFirstEntry[];
  readonly exportedAt: number;
}

// ─── External adapter ─────────────────────────────────────────────────────────

/**
 * Optional adapter that the store calls when an external backend is available.
 * If an adapter is registered, writes and reads are forwarded to it.
 * The local cache remains as a fallback if the adapter fails.
 */
export interface ExternalAdapter {
  read(path: string): Promise<LocalFirstValue | null>;
  write(path: string, value: LocalFirstValue): Promise<void>;
  delete(path: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

// ─── Store result ─────────────────────────────────────────────────────────────

export interface StoreReadResult<T extends LocalFirstValue = LocalFirstValue> {
  /** The value, or null if not found. */
  readonly value: T | null;
  /** True if the value came from the local cache (not the external adapter). */
  readonly fromCache: boolean;
}

export interface StoreWriteResult {
  readonly ok: boolean;
  /** True if the value was written to the external adapter. */
  readonly persisted: boolean;
  readonly error?: string;
}

// ─── LocalFirstStore interface ────────────────────────────────────────────────

export interface LocalFirstStore {
  /**
   * Write a value at `path`.
   * Always updates the local cache.  If an ExternalAdapter is set, also
   * attempts to persist externally.
   */
  write(path: string, value: LocalFirstValue): Promise<StoreWriteResult>;

  /**
   * Read a value at `path`.
   * Tries the ExternalAdapter first (if set); falls back to local cache.
   */
  read<T extends LocalFirstValue = LocalFirstValue>(
    path: string,
  ): Promise<StoreReadResult<T>>;

  /**
   * Delete a value at `path` from both the local cache and the external adapter.
   */
  delete(path: string): Promise<void>;

  /**
   * List all paths that start with `prefix`.
   */
  list(prefix: string): Promise<string[]>;

  /**
   * Return whether `path` exists in the local cache.
   */
  has(path: string): boolean;

  /** Register (or replace) the ExternalAdapter.  Pass `null` to remove it. */
  setAdapter(adapter: ExternalAdapter | null): void;

  /** Serialise the entire local cache to a plain JSON-safe object. */
  exportSnapshot(): StoreSnapshot;

  /** Restore the local cache from a previously exported snapshot. */
  importSnapshot(snapshot: StoreSnapshot): void;

  /** Return the number of entries in the local cache. */
  readonly size: number;
}

// ─── createLocalFirstStore factory ───────────────────────────────────────────

/**
 * Create a new LocalFirstStore instance.
 *
 * @param maxEntries  Hard cap on the number of stored entries.
 *                    Oldest-written entries are evicted when the cap is hit.
 *                    @default 10_000
 */
export function createLocalFirstStore(maxEntries = 10_000): LocalFirstStore {
  const cache  = new Map<string, LocalFirstEntry>();
  let adapter: ExternalAdapter | null = null;

  function evictIfNeeded(): void {
    if (cache.size <= maxEntries) return;
    // Evict the oldest entry by writtenAt.
    let oldest: string | null = null;
    let oldestTime = Infinity;
    for (const [path, entry] of cache) {
      if (entry.writtenAt < oldestTime) {
        oldestTime = entry.writtenAt;
        oldest     = path;
      }
    }
    if (oldest) cache.delete(oldest);
  }

  function normalisePath(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
  }

  return {
    get size() { return cache.size; },

    setAdapter(a) { adapter = a; },

    async write(rawPath, value) {
      const path  = normalisePath(rawPath);
      const prev  = cache.get(path);
      const entry: LocalFirstEntry = {
        path,
        value,
        writtenAt: Date.now(),
        version:   (prev?.version ?? 0) + 1,
      };
      cache.set(path, entry);
      evictIfNeeded();

      if (!adapter) return { ok: true, persisted: false };

      try {
        await adapter.write(path, value);
        return { ok: true, persisted: true };
      } catch (err) {
        return {
          ok:        true,  // local write succeeded
          persisted: false,
          error:     err instanceof Error ? err.message : String(err),
        };
      }
    },

    async read<T extends LocalFirstValue>(rawPath: string): Promise<StoreReadResult<T>> {
      const path = normalisePath(rawPath);

      if (adapter) {
        try {
          const remote = await adapter.read(path);
          if (remote !== null) {
            // Update local cache with the remote value.
            const prev  = cache.get(path);
            const entry: LocalFirstEntry = {
              path,
              value:     remote,
              writtenAt: Date.now(),
              version:   (prev?.version ?? 0) + 1,
            };
            cache.set(path, entry);
            return { value: remote as T, fromCache: false };
          }
        } catch {
          // Fall through to local cache.
        }
      }

      const local = cache.get(path);
      return { value: (local?.value as T) ?? null, fromCache: true };
    },

    async delete(rawPath) {
      const path = normalisePath(rawPath);
      cache.delete(path);
      try { await adapter?.delete(path); } catch { /* best effort */ }
    },

    async list(prefix) {
      const normPrefix = normalisePath(prefix);

      // Start with local paths.
      const localPaths = [...cache.keys()].filter((p) => p.startsWith(normPrefix));

      if (!adapter) return localPaths.sort();

      try {
        const remotePaths = await adapter.list(normPrefix);
        const merged = new Set([...localPaths, ...remotePaths]);
        return [...merged].sort();
      } catch {
        return localPaths.sort();
      }
    },

    has(rawPath) {
      return cache.has(normalisePath(rawPath));
    },

    exportSnapshot() {
      return {
        version:    1 as const,
        entries:    [...cache.values()],
        exportedAt: Date.now(),
      };
    },

    importSnapshot(snapshot) {
      cache.clear();
      for (const entry of snapshot.entries) {
        cache.set(entry.path, entry);
      }
    },
  };
}

// ─── Default singleton ────────────────────────────────────────────────────────

/**
 * Module-level singleton store.  Use this directly, or call
 * `createLocalFirstStore()` for an isolated instance.
 */
export const localStore: LocalFirstStore = createLocalFirstStore();

/**
 * lib/engin-runtime/EnginIOAdapter.ts
 *
 * I/O persistence layer for Engin state.
 *
 * Provides two concrete adapters:
 *   - LocalStorageAdapter  — client-side, zero-latency (default)
 *   - SupabaseAdapter      — server-route adapter (optional, async)
 *
 * All adapters share the EnginIOAdapter interface so the runtime stays
 * storage-agnostic.  Rule-sets never call I/O directly.
 */

// ─── Adapter contract ─────────────────────────────────────────────────────────

export interface EnginIOAdapter {
  /**
   * Persist a serialisable value under a namespaced key.
   * Returns true on success, false on failure (never throws).
   */
  save(key: string, value: unknown): Promise<boolean>;

  /**
   * Retrieve a previously persisted value.
   * Returns null if the key is not found or if deserialization fails.
   */
  load<T = unknown>(key: string): Promise<T | null>;

  /**
   * Remove a persisted value.
   * Returns true on success, false if the key did not exist.
   */
  remove(key: string): Promise<boolean>;
}

// ─── Key namespacing helper ───────────────────────────────────────────────────

/** Produce the localStorage / storage key for an engin + domain key. */
export function enginStorageKey(enginId: string, key: string: string {
  return `de:engin:${enginId}:${key}`;
}

// ─── LocalStorageAdapter ─────────────────────────────────────────────────────

/**
 * LocalStorageAdapter
 *
 * Client-only, synchronous storage surfaced as an async adapter.
 * Silently no-ops in SSR environments.
 */
export class LocalStorageAdapter implements EnginIOAdapter {
  private readonly prefix: string;

  constructor(enginId: string) {
    this.prefix = `de:engin:${enginId}:`;
  }

  private fullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async save(key: string, value: unknown): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      window.localStorage.setItem(this.fullKey(key), JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  async load<T = unknown>(key: string): Promise<T | null> {
    try {
      if (typeof window === 'undefined') return null;
      const raw = window.localStorage.getItem(this.fullKey(key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const fk = this.fullKey(key);
      const existed = window.localStorage.getItem(fk) !== null;
      window.localStorage.removeItem(fk);
      return existed;
    } catch {
      return false;
    }
  }
}

// ─── MemoryAdapter (test / SSR fallback) ─────────────────────────────────────

/**
 * MemoryAdapter
 *
 * In-process Map-backed adapter.  Useful for tests and for server-side
 * rendering where localStorage is unavailable.
 */
export class MemoryAdapter implements EnginIOAdapter {
  private readonly store = new Map<string, string>();

  async save(key: string, value: unknown): Promise<boolean> {
    try {
      this.store.set(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  async load<T = unknown>(key: string): Promise<T | null> {
    const raw = this.store.get(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<boolean> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed;
  }
}

// ─── In-Memory TTL Cache ─────────────────────────────────────────────────────
// Keyed by an arbitrary string. Serves stale content when sources fail.
// No external dependencies.

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // epoch ms
  storedAt: number;  // epoch ms
}

export class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private defaultTtlMs: number = 10 * 60 * 1000) {}

  set(key: string, value: T, ttlMs?: number): void {
    const now = Date.now();
    this.store.set(key, {
      value,
      expiresAt: now + (ttlMs ?? this.defaultTtlMs),
      storedAt: now,
    });
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /** Return a stale entry even if expired (for stale-while-revalidate). */
  getStale(key: string): T | undefined {
    return this.store.get(key)?.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /** Evict all expired entries. Call periodically to prevent unbounded growth. */
  evict(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  size(): number {
    return this.store.size;
  }
}

// ─── Singleton feed cache ────────────────────────────────────────────────────
// Keyed by `${theme}:${limit}:${cursorBucket}`.
// TTL 10 minutes; stale content served if sources fail.

import type { FeedResponse } from './types';

export const feedCache = new TTLCache<FeedResponse>(10 * 60 * 1000);

// ─── Request coalescing ───────────────────────────────────────────────────────
// Concurrent requests for the same cache key share one in-flight Promise.

const inflight = new Map<string, Promise<FeedResponse>>();

export function coalesce(
  key: string,
  factory: () => Promise<FeedResponse>
): Promise<FeedResponse> {
  const cached = feedCache.get(key);
  if (cached) return Promise.resolve(cached);

  const running = inflight.get(key);
  if (running) return running;

  const promise = factory().then((result) => {
    feedCache.set(key, result);
    inflight.delete(key);
    return result;
  }).catch((err) => {
    inflight.delete(key);
    throw err;
  });

  inflight.set(key, promise);
  return promise;
}

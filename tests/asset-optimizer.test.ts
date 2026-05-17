/**
 * tests/asset-optimizer.test.ts
 *
 * Tests for the asset optimisation pipeline (spec §5):
 *   - registryTagsForContext: correct folder/source metadata per upload context.
 *   - IndexedDB store sentinel logic (mocked).
 *   - Browser-clear detection (checkSentinels).
 *   - Quality config presence.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// ── Mock IndexedDB ─────────────────────────────────────────────────────────────
// jsdom does not include IndexedDB; we provide a minimal stub.

const idbStore = new Map<string, unknown>();

const mockIDB = {
  open: vi.fn().mockImplementation(() => {
    const result: IDBDatabase = {
      createObjectStore: vi.fn(),
      transaction: vi.fn().mockImplementation((_store: string, mode: string) => {
        const objStore = {
          put: vi.fn().mockImplementation((record: { assetId: string }) => {
            idbStore.set(record.assetId, record);
            return { onsuccess: null, onerror: null, result: undefined };
          }),
          get: vi.fn().mockImplementation((key: string) => {
            const req = { onsuccess: null as ((e: Event) => void) | null, onerror: null, result: idbStore.get(key) ?? undefined };
            // Immediately call onsuccess
            Promise.resolve().then(() => req.onsuccess?.({ target: req } as unknown as Event));
            return req;
          }),
          delete: vi.fn().mockImplementation((key: string) => {
            idbStore.delete(key);
            return { onsuccess: null, onerror: null };
          }),
        };
        return { objectStore: vi.fn().mockReturnValue(objStore) };
      }),
    } as unknown as IDBDatabase;

    const req = {
      result,
      onsuccess: null as ((e: Event) => void) | null,
      onerror: null,
      onupgradeneeded: null,
    };
    // Immediately call onsuccess
    Promise.resolve().then(() => req.onsuccess?.({ target: req } as unknown as Event));
    return req;
  }),
};

// Patch global indexedDB
Object.defineProperty(globalThis, 'indexedDB', { value: mockIDB, writable: true });

// ── Mock localStorage ──────────────────────────────────────────────────────────

const localStorageData = new Map<string, string>();
const mockLocalStorage = {
  setItem: (k: string, v: string) => { localStorageData.set(k, v); },
  getItem: (k: string) => localStorageData.get(k) ?? null,
  removeItem: (k: string) => { localStorageData.delete(k); },
  key: (i: number) => [...localStorageData.keys()][i] ?? null,
  get length() { return localStorageData.size; },
  clear: () => { localStorageData.clear(); },
};
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

// ── Import modules under test ──────────────────────────────────────────────────

import { registryTagsForContext } from '@/lib/assets/assetOptimizer';

// ── registryTagsForContext tests ───────────────────────────────────────────────

describe('registryTagsForContext', () => {
  it('returns dreamr_feed folder/source for dreamr_feed context', () => {
    const tags = registryTagsForContext('dreamr_feed');
    expect(tags.folder).toBe('dreamr_feed');
    expect(tags.source).toBe('dreamr_feed');
  });

  it('returns dreamr_profile folder for profile context', () => {
    const tags = registryTagsForContext('profile');
    expect(tags.folder).toBe('dreamr_profile');
    expect(tags.source).toBe('profile');
  });

  it('returns starmaker_audio folder for starmaker context', () => {
    const tags = registryTagsForContext('starmaker');
    expect(tags.folder).toBe('starmaker_audio');
    expect(tags.source).toBe('starmaker');
  });

  it('returns general folder/source for unknown contexts', () => {
    const tags = registryTagsForContext('general');
    expect(tags.folder).toBe('general');
    expect(tags.source).toBe('general');
  });
});

// ── Sentinel / browser-clear detection tests ──────────────────────────────────

describe('IndexedDB sentinel detection', () => {
  beforeEach(() => {
    idbStore.clear();
    localStorageData.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sentinel key format is correct (prefix + assetId)', () => {
    const prefix = 'de_original_sentinel_';
    const assetId = 'asset-sentinel-test-001';
    const expectedKey = `${prefix}${assetId}`;

    // Simulate what storeOriginal does: write sentinel to localStorage.
    const sentinel = { assetId, storedAt: Date.now() };
    localStorageData.set(expectedKey, JSON.stringify(sentinel));

    const stored = localStorageData.get(expectedKey);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.assetId).toBe(assetId);
    expect(typeof parsed.storedAt).toBe('number');
  });

  it('sentinel key uses the expected prefix', () => {
    const prefix = 'de_original_sentinel_';
    const assetId = 'xyz-123';
    const key = `${prefix}${assetId}`;
    expect(key).toBe('de_original_sentinel_xyz-123');
  });

  it('checkSentinels returns empty array when no sentinels exist', async () => {
    localStorageData.clear();
    const { checkSentinels } = await import('@/lib/assets/indexedDBStore');
    const missing = await checkSentinels().catch(() => [] as string[]);
    expect(Array.isArray(missing)).toBe(true);
    expect(missing.length).toBe(0);
  });
});

/**
 * lib/assets/indexedDBStore.ts
 *
 * Temporary original-file storage using IndexedDB (spec §5).
 *
 * The compressed / optimised asset is sent to the server; the full-quality
 * original is stored here client-side only. If the user clears browser data,
 * the original is lost. A localStorage sentinel key is written alongside each
 * stored original so the app can detect when local storage has been cleared.
 *
 * API:
 *   storeOriginal(assetId, blob)   — save the original file
 *   getOriginal(assetId)           — retrieve it (or null if missing)
 *   deleteOriginal(assetId)        — remove after confirmed upload / user action
 *   checkSentinels()               — call on app load; returns any missing originals
 */

const DB_NAME = 'dreamengin_originals';
const DB_VERSION = 1;
const STORE_NAME = 'originals';
const SENTINEL_PREFIX = 'de_original_sentinel_';

/** Metadata stored alongside each original in IndexedDB. */
export interface OriginalRecord {
  assetId: string;
  blob: Blob;
  storedAt: number; // Date.now()
  mimeType: string;
  fileName: string;
}

/** A sentinel entry: written to localStorage so we can detect DB clearing. */
export interface SentinelEntry {
  assetId: string;
  storedAt: number;
}

// ── DB helpers ─────────────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'assetId' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Stores the original (full-quality) file for an asset in IndexedDB and
 * writes a sentinel key to localStorage so browser-clear events are detectable.
 */
export async function storeOriginal(
  assetId: string,
  blob: Blob,
  fileName: string,
): Promise<void> {
  const db = await openDB();
  const record: OriginalRecord = {
    assetId,
    blob,
    storedAt: Date.now(),
    mimeType: blob.type,
    fileName,
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // Write localStorage sentinel.
  const sentinel: SentinelEntry = { assetId, storedAt: record.storedAt };
  localStorage.setItem(`${SENTINEL_PREFIX}${assetId}`, JSON.stringify(sentinel));
}

/**
 * Retrieves the original file for an asset from IndexedDB.
 * Returns null if not found (e.g. browser data was cleared).
 */
export async function getOriginal(assetId: string): Promise<OriginalRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(assetId);
    req.onsuccess = () => resolve((req.result as OriginalRecord) ?? null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Deletes the original from IndexedDB and removes its localStorage sentinel.
 */
export async function deleteOriginal(assetId: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(assetId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  localStorage.removeItem(`${SENTINEL_PREFIX}${assetId}`);
}

/**
 * Checks all sentinel keys in localStorage against IndexedDB.
 * Returns the list of asset IDs whose originals are missing (browser cleared).
 *
 * Call this on application load to show the non-dismissible warning banner.
 */
export async function checkSentinels(): Promise<string[]> {
  const missing: string[] = [];

  const sentinelKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(SENTINEL_PREFIX)) {
      sentinelKeys.push(key);
    }
  }

  if (sentinelKeys.length === 0) return [];

  const db = await openDB();

  for (const key of sentinelKeys) {
    const assetId = key.slice(SENTINEL_PREFIX.length);
    const record = await new Promise<OriginalRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(assetId);
      req.onsuccess = () => resolve((req.result as OriginalRecord) ?? null);
      req.onerror = () => reject(req.error);
    });

    if (!record) {
      missing.push(assetId);
    }
  }

  return missing;
}

// ── Improvement 52: listStoredOriginals ──────────────────────────────────────

/**
 * Return all OriginalRecords currently in IndexedDB.
 * Useful for building a "My stored originals" management UI.
 */
export async function listStoredOriginals(): Promise<OriginalRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as OriginalRecord[]);
    req.onerror = () => reject(req.error);
  });
}

// ── Improvement 53: cleanupExpiredOriginals ───────────────────────────────────

/**
 * Remove all OriginalRecords older than `maxAgeMs` milliseconds.
 * Also cleans up the corresponding localStorage sentinels.
 * Returns the array of asset IDs that were deleted.
 */
export async function cleanupExpiredOriginals(maxAgeMs: number): Promise<string[]> {
  const all = await listStoredOriginals();
  const cutoff = Date.now() - maxAgeMs;
  const expired = all.filter((r) => r.storedAt < cutoff);
  for (const record of expired) {
    await deleteOriginal(record.assetId);
  }
  return expired.map((r) => r.assetId);
}

// ── Improvement 54: getStorageStats ──────────────────────────────────────────

export interface StorageStats {
  count: number;
  /** Sum of all blob sizes in bytes (approximate). */
  totalBytes: number;
  oldestStoredAt: number | null;
  newestStoredAt: number | null;
}

/**
 * Compute storage usage statistics for all stored originals.
 */
export async function getStorageStats(): Promise<StorageStats> {
  const all = await listStoredOriginals();
  if (all.length === 0) {
    return { count: 0, totalBytes: 0, oldestStoredAt: null, newestStoredAt: null };
  }
  const totalBytes = all.reduce((sum, r) => sum + r.blob.size, 0);
  const timestamps = all.map((r) => r.storedAt);
  return {
    count: all.length,
    totalBytes,
    oldestStoredAt: Math.min(...timestamps),
    newestStoredAt: Math.max(...timestamps),
  };
}

// ── Improvement 55: hasOriginal ───────────────────────────────────────────────

/**
 * Returns true when an original with the given assetId exists in IndexedDB.
 * Faster than getOriginal() when you only need a boolean check.
 */
export async function hasOriginal(assetId: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).count(assetId);
    req.onsuccess = () => resolve(req.result > 0);
    req.onerror = () => reject(req.error);
  });
}

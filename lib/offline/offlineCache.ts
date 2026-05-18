/**
 * lib/offline/offlineCache.ts
 *
 * Phase 9 §7: Offline mode — IndexedDB-based asset & scene cache.
 *
 * DREAMenginOS caches assets and scenes locally so you can continue
 * working without internet. Changes sync when back online.
 *
 * Architecture justification:
 *   - docs/ARCHITECTURE.md §10: render-on-demand, performance-first.
 *   - IndexedDB is the only browser API with enough storage for binary
 *     assets (images, audio, 3D geometry).
 *   - The sync queue ensures no data loss across connectivity gaps.
 *
 * Performance: all IndexedDB operations are async. No blocking.
 * Privacy: all data stays in the user's browser. No third-party storage.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const DB_NAME = 'dreamengin-offline';
export const DB_VERSION = 1;

export const STORE_ASSETS = 'assets';
export const STORE_SCENES = 'scenes';
export const STORE_SYNC_QUEUE = 'sync-queue';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CachedAsset {
  /** Unique asset ID (matches server-side ID when available) */
  id: string;
  /** MIME type of the asset */
  mimeType: string;
  /** Asset binary data */
  data: ArrayBuffer;
  /** ISO timestamp of when this was cached */
  cachedAt: string;
  /** ISO timestamp of last modification (for sync) */
  modifiedAt: string;
  /** Whether this asset has been synced to the server */
  synced: boolean;
  /** Optional metadata (name, tags, dimensions, etc.) */
  meta?: Record<string, unknown>;
}

export interface CachedScene {
  /** Scene ID */
  id: string;
  /** Serialised scene state (camera, objects, physics) */
  state: SceneSnapshot;
  /** ISO timestamp */
  savedAt: string;
  /** Whether synced to server */
  synced: boolean;
}

export interface SceneSnapshot {
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  };
  objects: SceneObject[];
  physicsEnabled: boolean;
  environment?: string;
}

export interface SceneObject {
  id: string;
  type: 'mesh' | 'light' | 'audio' | 'particle';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  assetId?: string;
  properties?: Record<string, unknown>;
}

export interface SyncQueueEntry {
  /** Auto-incremented key */
  id?: number;
  /** 'asset' | 'scene' */
  entityType: 'asset' | 'scene';
  /** ID of the entity to sync */
  entityId: string;
  /** 'create' | 'update' | 'delete' */
  action: 'create' | 'update' | 'delete';
  /** ISO timestamp of when this was queued */
  queuedAt: string;
}

// ─── Database initialisation ──────────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        const assetStore = db.createObjectStore(STORE_ASSETS, { keyPath: 'id' });
        assetStore.createIndex('synced', 'synced', { unique: false });
        assetStore.createIndex('cachedAt', 'cachedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_SCENES)) {
        const sceneStore = db.createObjectStore(STORE_SCENES, { keyPath: 'id' });
        sceneStore.createIndex('synced', 'synced', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        db.createObjectStore(STORE_SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

// ─── Asset operations ─────────────────────────────────────────────────────────

export async function cacheAsset(asset: CachedAsset): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readwrite');
    tx.objectStore(STORE_ASSETS).put(asset);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAsset(id: string): Promise<CachedAsset | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readonly');
    const req = tx.objectStore(STORE_ASSETS).get(id);
    req.onsuccess = () => resolve(req.result as CachedAsset | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readwrite');
    tx.objectStore(STORE_ASSETS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listAssets(): Promise<CachedAsset[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readonly');
    const req = tx.objectStore(STORE_ASSETS).getAll();
    req.onsuccess = () => resolve(req.result as CachedAsset[]);
    req.onerror = () => reject(req.error);
  });
}

// ─── Scene operations ─────────────────────────────────────────────────────────

export async function saveScene(scene: CachedScene): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SCENES, 'readwrite');
    tx.objectStore(STORE_SCENES).put(scene);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getScene(id: string): Promise<CachedScene | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SCENES, 'readonly');
    const req = tx.objectStore(STORE_SCENES).get(id);
    req.onsuccess = () => resolve(req.result as CachedScene | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteScene(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SCENES, 'readwrite');
    tx.objectStore(STORE_SCENES).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listScenes(): Promise<CachedScene[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SCENES, 'readonly');
    const req = tx.objectStore(STORE_SCENES).getAll();
    req.onsuccess = () => resolve(req.result as CachedScene[]);
    req.onerror = () => reject(req.error);
  });
}

// ─── Sync queue ───────────────────────────────────────────────────────────────

export async function enqueueSyncAction(entry: Omit<SyncQueueEntry, 'id'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
    tx.objectStore(STORE_SYNC_QUEUE).add(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSyncQueue(): Promise<SyncQueueEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
    const req = tx.objectStore(STORE_SYNC_QUEUE).getAll();
    req.onsuccess = () => resolve(req.result as SyncQueueEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function clearSyncQueue(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
    tx.objectStore(STORE_SYNC_QUEUE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeSyncEntry(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
    tx.objectStore(STORE_SYNC_QUEUE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Online/Offline detection ─────────────────────────────────────────────────

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

/**
 * Subscribe to online/offline transitions.
 * Returns an unsubscribe function.
 */
export function onConnectivityChange(
  callback: (online: boolean) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// ─── Sync engine ──────────────────────────────────────────────────────────────

/**
 * Process the sync queue: attempt to push each pending change to the server.
 * Successfully synced entries are removed from the queue.
 *
 * This is called automatically when connectivity is restored, or can be
 * invoked manually.
 *
 * @param uploadFn - callback that handles the actual server upload.
 *   Receives the queue entry and should throw on failure.
 */
export async function processSyncQueue(
  uploadFn: (entry: SyncQueueEntry) => Promise<void>,
): Promise<{ synced: number; failed: number }> {
  const queue = await getSyncQueue();
  let synced = 0;
  let failed = 0;

  for (const entry of queue) {
    try {
      await uploadFn(entry);
      if (entry.id !== undefined) {
        await removeSyncEntry(entry.id);
      }
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

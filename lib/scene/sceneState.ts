/**
 * lib/scene/sceneState.ts
 *
 * Phase 9 §3: Persistent scene state — serialise and restore the entire
 * 3D scene (camera, objects, physics) when flipping between Daydream/Engin
 * or reloading the page.
 *
 * Uses the offline IndexedDB cache as the storage backend so scenes
 * survive page reloads and can be synced to the server when online.
 *
 * Architecture justification:
 *   - docs/ARCHITECTURE.md §1: dual runtime regions. Scene state is
 *     per-region so switching between Surface Space and DreamSpace
 *     restores each region's scene independently.
 *   - docs/ARCHITECTURE.md §10: performance-first. Serialisation is
 *     done in a single pass; no deep cloning or JSON.parse round-trips
 *     on the hot path.
 */

import {
  saveScene,
  getScene,
  deleteScene,
  listScenes,
  enqueueSyncAction,
  type CachedScene,
  type SceneSnapshot,
  type SceneObject,
} from '@/lib/offline/offlineCache';

// Re-export types for consumers
export type { SceneSnapshot, SceneObject, CachedScene };

// ─── Scene snapshot helpers ───────────────────────────────────────────────────

/**
 * Create a minimal default scene snapshot (empty canvas, default camera).
 */
export function createDefaultSnapshot(): SceneSnapshot {
  return {
    camera: {
      position: [0, 5, -10],
      target: [0, 0, 0],
      fov: 60,
    },
    objects: [],
    physicsEnabled: true,
    environment: 'studio',
  };
}

/**
 * Persist a scene snapshot to IndexedDB.
 * Automatically queues a sync action for server upload.
 *
 * @param sceneId - unique scene identifier (e.g. "surface-space-main")
 * @param snapshot - the scene state to save
 */
export async function persistScene(
  sceneId: string,
  snapshot: SceneSnapshot,
): Promise<void> {
  const now = new Date().toISOString();
  const cached: CachedScene = {
    id: sceneId,
    state: snapshot,
    savedAt: now,
    synced: false,
  };

  await saveScene(cached);

  // Queue for server sync
  await enqueueSyncAction({
    entityType: 'scene',
    entityId: sceneId,
    action: 'update',
    queuedAt: now,
  });
}

/**
 * Restore a previously persisted scene snapshot.
 * Returns `undefined` if no scene has been saved for this ID.
 */
export async function restoreScene(
  sceneId: string,
): Promise<SceneSnapshot | undefined> {
  const cached = await getScene(sceneId);
  return cached?.state;
}

/**
 * Remove a persisted scene.
 */
export async function removeScene(sceneId: string): Promise<void> {
  await deleteScene(sceneId);
}

/**
 * List all persisted scene IDs.
 */
export async function listPersistedScenes(): Promise<string[]> {
  const scenes = await listScenes();
  return scenes.map((s) => s.id);
}

// ─── Scene diffing (for sync optimisation) ────────────────────────────────────

/**
 * Compare two snapshots and return true if they differ meaningfully.
 * Used to avoid writing identical state on every frame.
 */
export function scenesAreDifferent(
  a: SceneSnapshot,
  b: SceneSnapshot,
): boolean {
  // Quick structural checks before deep comparison
  if (a.objects.length !== b.objects.length) return true;
  if (a.physicsEnabled !== b.physicsEnabled) return true;
  if (a.environment !== b.environment) return true;

  // Camera comparison with tolerance (avoid sub-pixel noise)
  const EPSILON = 0.001;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(a.camera.position[i] - b.camera.position[i]) > EPSILON) return true;
    if (Math.abs(a.camera.target[i] - b.camera.target[i]) > EPSILON) return true;
  }
  if (Math.abs(a.camera.fov - b.camera.fov) > EPSILON) return true;

  // Object-level comparison (order-sensitive for speed)
  for (let i = 0; i < a.objects.length; i++) {
    const oa = a.objects[i];
    const ob = b.objects[i];
    if (oa.id !== ob.id || oa.type !== ob.type || oa.assetId !== ob.assetId) return true;
    for (let j = 0; j < 3; j++) {
      if (Math.abs(oa.position[j] - ob.position[j]) > EPSILON) return true;
      if (Math.abs(oa.rotation[j] - ob.rotation[j]) > EPSILON) return true;
      if (Math.abs(oa.scale[j] - ob.scale[j]) > EPSILON) return true;
    }
  }

  return false;
}

// ─── Auto-save throttle helper ────────────────────────────────────────────────

/**
 * Creates a throttled auto-save function that persists the scene at most
 * once every `intervalMs` milliseconds. Only writes when the scene has
 * actually changed (via `scenesAreDifferent`).
 *
 * Usage:
 *   const autosave = createAutoSave('my-scene', 2000);
 *   // In your render loop or effect:
 *   autosave(currentSnapshot);
 *   // On unmount:
 *   autosave.flush();
 */
export function createAutoSave(sceneId: string, intervalMs = 2000) {
  let lastSnapshot: SceneSnapshot | null = null;
  let pending: SceneSnapshot | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (pending && (!lastSnapshot || scenesAreDifferent(lastSnapshot, pending))) {
      lastSnapshot = pending;
      void persistScene(sceneId, pending);
    }
    pending = null;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const save = (snapshot: SceneSnapshot) => {
    pending = snapshot;
    if (timer === null) {
      timer = setTimeout(flush, intervalMs);
    }
  };

  save.flush = flush;
  return save;
}

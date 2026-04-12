/**
 * lib/runtime/offlineQueue.ts
 *
 * Offline Action Queue — spec §30.14 & §27.3.3
 *
 * Any action initiated while offline (message sends, Dream Window reconfigs,
 * post drafts) is queued here and automatically retried when connectivity returns.
 *
 * The queue is persisted to localStorage so it survives page refresh and
 * browser restart, matching the spec requirement:
 *   "Persistence must survive: surface changes, page refresh, browser restart"
 *
 * Improvements 88-92:
 *  88. enqueue        — add a typed action to the queue
 *  89. dequeue        — remove a completed action
 *  90. flushQueue     — attempt to replay all pending actions on reconnect
 *  91. getQueueStatus — inspect the current queue state
 *  92. listenOnline   — register a navigator.online listener + auto-flush
 */

const STORAGE_KEY = 'de-offline-queue';
const MAX_QUEUE_SIZE = 200;
const MAX_RETRY_ATTEMPTS = 5;

// ── Types ──────────────────────────────────────────────────────────────────────

export type OfflineActionType =
  | 'message:send'
  | 'message:react'
  | 'dream-window:reconfigure'
  | 'post:create'
  | 'post:edit'
  | 'content:publish'
  | 'profile:update';

export type OfflineActionStatus = 'pending' | 'replaying' | 'failed';

export interface OfflineAction {
  /** Stable unique ID for this action. */
  id: string;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  /** Epoch ms when the action was enqueued. */
  enqueuedAt: number;
  /** Number of replay attempts so far. */
  attempts: number;
  status: OfflineActionStatus;
  /** Error message from the last failed attempt. */
  lastError?: string;
}

export interface QueueStatus {
  pending: number;
  replaying: number;
  failed: number;
  total: number;
  oldestEnqueuedAt: number | null;
}

// ── Persistence helpers ────────────────────────────────────────────────────────

function _load(): OfflineAction[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineAction[];
  } catch {
    return [];
  }
}

function _save(queue: OfflineAction[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[offlineQueue] Failed to persist queue', err);
  }
}

// ── Improvement 88: enqueue ───────────────────────────────────────────────────

/**
 * Add a typed action to the offline queue.
 * Returns the unique ID assigned to this action.
 *
 * If the queue is full (MAX_QUEUE_SIZE), the oldest failed action is evicted
 * first to make room. If still full, a warning is logged and the action is
 * rejected (returns null).
 */
export function enqueue(
  type: OfflineActionType,
  payload: Record<string, unknown>,
): string | null {
  const queue = _load();

  if (queue.length >= MAX_QUEUE_SIZE) {
    // Evict oldest failed action
    const failedIdx = queue.findIndex((a) => a.status === 'failed');
    if (failedIdx >= 0) {
      queue.splice(failedIdx, 1);
    } else {
      console.warn('[offlineQueue] Queue full, action dropped', { type });
      return null;
    }
  }

  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `offl-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const action: OfflineAction = {
    id,
    type,
    payload,
    enqueuedAt: Date.now(),
    attempts: 0,
    status: 'pending',
  };

  queue.push(action);
  _save(queue);
  return id;
}

// ── Improvement 89: dequeue ───────────────────────────────────────────────────

/**
 * Remove a successfully completed action from the queue by ID.
 * No-op when the ID is not found.
 */
export function dequeue(id: string): void {
  const queue = _load().filter((a) => a.id !== id);
  _save(queue);
}

// ── Improvement 90: flushQueue ────────────────────────────────────────────────

/**
 * Attempt to replay all pending actions in the queue.
 *
 * `executor` receives each action and should return true on success or throw
 * on failure. Successfully replayed actions are dequeued automatically.
 * Failed actions increment their attempt counter; after MAX_RETRY_ATTEMPTS
 * they are marked 'failed'.
 *
 * Returns a summary of the flush: `{ succeeded, failed, skipped }`.
 */
export async function flushQueue(
  executor: (action: OfflineAction) => Promise<void>,
): Promise<{ succeeded: number; failed: number; skipped: number }> {
  const queue = _load();
  // Iterate over a snapshot so in-flight splices don't skip items
  const snapshot = [...queue];
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const action of snapshot) {
    if (action.status === 'failed') { skipped++; continue; }

    // Locate live entry in the mutable queue
    const liveEntry = queue.find((a) => a.id === action.id);
    if (!liveEntry) continue; // already removed in a previous iteration

    liveEntry.status = 'replaying';

    try {
      await executor(liveEntry);
      succeeded++;
      // Remove from the live array and persist
      const idx = queue.findIndex((a) => a.id === liveEntry.id);
      if (idx >= 0) queue.splice(idx, 1);
      _save(queue);
    } catch (err) {
      liveEntry.attempts++;
      liveEntry.lastError = err instanceof Error ? err.message : String(err);
      liveEntry.status = liveEntry.attempts >= MAX_RETRY_ATTEMPTS ? 'failed' : 'pending';
      _save(queue);
      failed++;
    }
  }

  return { succeeded, failed, skipped };
}

// ── Improvement 91: getQueueStatus ────────────────────────────────────────────

/**
 * Return a point-in-time status summary of the offline queue.
 * Safe to call server-side (returns zeroed stats).
 */
export function getQueueStatus(): QueueStatus {
  if (typeof localStorage === 'undefined') {
    return { pending: 0, replaying: 0, failed: 0, total: 0, oldestEnqueuedAt: null };
  }
  const queue = _load();
  let pending = 0, replaying = 0, failed = 0;
  let oldestEnqueuedAt: number | null = null;

  for (const action of queue) {
    if (action.status === 'pending' || action.status === 'replaying') {
      if (action.status === 'pending') pending++;
      else replaying++;
    } else {
      failed++;
    }
    if (oldestEnqueuedAt === null || action.enqueuedAt < oldestEnqueuedAt) {
      oldestEnqueuedAt = action.enqueuedAt;
    }
  }

  return { pending, replaying, failed, total: queue.length, oldestEnqueuedAt };
}

// ── Improvement 92: listenOnline ──────────────────────────────────────────────

/**
 * Register a navigator `online` event listener that automatically calls
 * `flushQueue(executor)` whenever the browser reconnects.
 *
 * Returns a cleanup function that removes the listener.
 *
 * Usage:
 *   const off = listenOnline(async (action) => {
 *     await fetch('/api/messages', { method: 'POST', body: JSON.stringify(action.payload) });
 *   });
 *   // call off() on component unmount
 */
export function listenOnline(
  executor: (action: OfflineAction) => Promise<void>,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    flushQueue(executor).catch((err) => {
      console.error('[offlineQueue] Auto-flush failed', err);
    });
  };

  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}

/**
 * Convenience: return true when the browser is currently online.
 * Safe to call server-side (returns true).
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

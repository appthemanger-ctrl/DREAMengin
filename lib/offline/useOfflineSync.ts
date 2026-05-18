'use client';

/**
 * lib/offline/useOfflineSync.ts
 *
 * Phase 9 §7: React hook that manages offline/online state and triggers
 * sync when connectivity is restored.
 *
 * Architecture justification:
 *   - docs/ARCHITECTURE.md §10: render-on-demand pattern. The hook only
 *     activates sync processing when the browser transitions online.
 *   - docs/LAW.md §3: every visible action must do something real.
 *     The offline indicator reflects true connectivity state.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  isOnline,
  onConnectivityChange,
  processSyncQueue,
  type SyncQueueEntry,
} from './offlineCache';

export interface UseOfflineSyncReturn {
  /** Whether the browser is currently online */
  online: boolean;
  /** Whether a sync operation is in progress */
  syncing: boolean;
  /** Result of the last sync attempt */
  lastSyncResult: { synced: number; failed: number } | null;
  /** Manually trigger a sync */
  triggerSync: () => Promise<void>;
}

/**
 * useOfflineSync
 *
 * Monitors connectivity and syncs the offline queue when the browser
 * comes back online.
 *
 * @param uploadFn - Function that uploads a single sync queue entry to
 *   the server. Throw to signal failure (entry stays in queue).
 */
export function useOfflineSync(
  uploadFn?: (entry: SyncQueueEntry) => Promise<void>,
): UseOfflineSyncReturn {
  const [online, setOnline] = useState(() => isOnline());
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number;
    failed: number;
  } | null>(null);

  const doSync = useCallback(async () => {
    if (!uploadFn) return;
    setSyncing(true);
    try {
      const result = await processSyncQueue(uploadFn);
      setLastSyncResult(result);
    } catch {
      // Sync failed entirely — will retry next online event
    } finally {
      setSyncing(false);
    }
  }, [uploadFn]);

  // Listen for connectivity changes
  useEffect(() => {
    const unsub = onConnectivityChange((nowOnline) => {
      setOnline(nowOnline);
      if (nowOnline) {
        void doSync();
      }
    });
    return unsub;
  }, [doSync]);

  return {
    online,
    syncing,
    lastSyncResult,
    triggerSync: doSync,
  };
}

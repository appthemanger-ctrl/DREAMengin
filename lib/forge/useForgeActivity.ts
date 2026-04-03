/**
 * useForgeActivity — client-side hook for recording Forge activity pulses.
 *
 * Every Engin in DREAMengin can call `record(label)` to notify the Forge that
 * work happened.  The Forge dashboard then reflects this as a live heat map.
 *
 * Records are persisted to localStorage via the canonical `recordForgeActivity`
 * helper from `lib/forge/forgeRegistry.ts`.
 *
 * Architecture justification: docs/ARCHITECTURE.md §1 — cross-engine linkage
 * via the Forge meta-creation layer.  No Supabase writes — this is local
 * telemetry only (no privacy impact).
 */

import { useCallback, useRef, useEffect } from 'react';
import { recordForgeActivity } from './forgeRegistry';

export interface UseForgeActivityOptions {
  /** Machine id matching ENGIN_REGISTRY — e.g. 'games', 'music', 'code' */
  enginId: string;
  /** If true, records an "Entered <enginId>" pulse on mount.  Default true. */
  recordOnMount?: boolean;
}

export interface UseForgeActivityReturn {
  /** Record an arbitrary activity label for this engine */
  record: (label: string) => void;
}

/**
 * Hook that engines call to emit activity pulses visible in the ForgeEngin
 * dashboard.  Usage:
 *
 * ```tsx
 * const forge = useForgeActivity({ enginId: 'games' });
 * // later…
 * forge.record('Launched MADMAXI');
 * ```
 */
export function useForgeActivity({
  enginId,
  recordOnMount = true,
}: UseForgeActivityOptions): UseForgeActivityReturn {
  const mountedRef = useRef(false);

  // Record on mount (once)
  useEffect(() => {
    if (recordOnMount && !mountedRef.current) {
      mountedRef.current = true;
      recordForgeActivity(enginId, `Entered ${enginId}`);
    }
  }, [enginId, recordOnMount]);

  const record = useCallback(
    (label: string) => {
      recordForgeActivity(enginId, label);
    },
    [enginId],
  );

  return { record };
}

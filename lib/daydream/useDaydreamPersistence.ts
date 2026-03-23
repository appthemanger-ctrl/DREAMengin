/**
 * useDaydreamPersistence — saves AND restores full workspace state for a Daydream Engin.
 *
 * Extends the lightweight useDaydreamState hook with a restore path:
 *   - On mount: reads the `state` JSONB column from `daydream_states` for this user + type.
 *   - Exposes `savedState` (typed T) so the calling Engin can hydrate local state.
 *   - Provides `persistState` (debounced 800 ms) to write state snapshots back to DB.
 *
 * Security: reads/writes only the current user's row (user_id = auth.uid()).
 *   RLS is enforced server-side; the client-side user_id filter is defence-in-depth
 *   per AXIOM 4 and SECURITY.md.
 *
 * Privacy: nothing in daydream_states is shared publicly (LAW.md §2, AXIOM 5).
 *
 * Architecture: lives in lib/ (Logic layer) per GENERATION_LAW §3.1.
 *   Never called from app/ Surface files directly — always through Engin components.
 *
 * Phase 8 §F points addressed:
 *   49 — workspace states persist; users restore to last working state on session load
 *   50 — back-navigation preserves context; state survives flip A↔B and route changes
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UseDaydreamPersistenceOptions {
  /**
   * Canonical daydream type: 'music' | 'games' | 'lab' | 'code' | 'brand' | 'create'.
   * Must match the value used in useDaydreamState and the daydream_states PK.
   */
  daydreamType: string;
}

export interface UseDaydreamPersistenceReturn<T = Record<string, unknown>> {
  /** Restored state from DB, or null if no prior session or still loading. */
  savedState: T | null;
  /** True while the initial DB read is in flight; false once complete. */
  isRestoring: boolean;
  /**
   * Persist a state snapshot to DB. Calls are debounced 800 ms to avoid thrashing.
   * The snapshot is stored in `daydream_states.state` as JSONB.
   */
  persistState: (payload: T) => void;
}

/**
 * Hook to save and restore Engin workspace state via the `daydream_states` table.
 *
 * @example
 * ```ts
 * const { savedState, isRestoring, persistState } = useDaydreamPersistence<MusicState>({
 *   daydreamType: 'music',
 * });
 *
 * // Restore once on mount
 * const restoredRef = useRef(false);
 * useEffect(() => {
 *   if (isRestoring || restoredRef.current || !savedState) return;
 *   restoredRef.current = true;
 *   if (savedState.bpm !== undefined) setBpm(savedState.bpm);
 * }, [isRestoring, savedState]);
 *
 * // Persist on change
 * useEffect(() => {
 *   if (isRestoring) return;
 *   persistState({ bpm, beatGrid, ... });
 * }, [bpm, beatGrid, isRestoring]);
 * ```
 */
export function useDaydreamPersistence<T = Record<string, unknown>>(
  { daydreamType }: UseDaydreamPersistenceOptions,
): UseDaydreamPersistenceReturn<T> {
  const [savedState, setSavedState] = useState<T | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load state from DB on mount ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || cancelled) {
        setIsRestoring(false);
        return;
      }

      const { data } = await supabase
        .from('daydream_states')
        .select('state')
        .eq('user_id', user.id)
        .eq('daydream_type', daydreamType)
        .maybeSingle();

      if (!cancelled) {
        setSavedState((data?.state as T) ?? null);
        setIsRestoring(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [daydreamType]);

  // ── Persist state to DB (debounced 800 ms) ───────────────────────────────────
  const persistState = useCallback(
    (payload: T) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('daydream_states')
          .upsert(
            {
              user_id: user.id,
              daydream_type: daydreamType,
              side: 'B',
              state: payload as Record<string, unknown>,
              last_visited: new Date().toISOString(),
            },
            { onConflict: 'user_id,daydream_type', ignoreDuplicates: false },
          );
      }, 800);
    },
    [daydreamType],
  );

  // Flush any pending write on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { savedState, isRestoring, persistState };
}

/**
 * useDaydreamState — persists Side A / Side B state for a Daydream to Supabase.
 *
 * Uses the `daydream_states` table (migration 20260307000000_readme_gaps.sql).
 * RLS enforces owner-only access; this hook adds a client-side uid filter
 * as defence-in-depth (AXIOM 4 — security by default).
 *
 * Architecture note: lives in lib/ (Logic layer) per GENERATION_LAW §3.1.
 * Never called from app/ Surface files directly — always through components.
 *
 * Privacy: reads and writes only the current user's row (user_id = auth.uid()).
 * Nothing in daydream_states is shared publicly (LAW.md §2, AXIOM 5).
 */

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type DaydreamSide = 'A' | 'B';

export type DaydreamStatePayload = {
  side: DaydreamSide;
  [key: string]: unknown;
};

export interface UseDaydreamStateOptions {
  /** Canonical daydream type: 'music' | 'games' | 'lab' | 'code' | 'brand' | 'create' */
  daydreamType: string;
  /** Which side is currently active — tracked for last_visited context */
  side: DaydreamSide;
}

export interface UseDaydreamStateReturn {
  /** Persist a state snapshot — writes are debounced 800 ms to avoid thrashing */
  persistState: (payload: DaydreamStatePayload) => void;
  /** Record a visit timestamp for this daydream (called automatically on mount) */
  markVisited: () => void;
}

export function useDaydreamState({ daydreamType, side }: UseDaydreamStateOptions): UseDaydreamStateReturn {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markVisited = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('daydream_states')
      .upsert(
        {
          user_id: user.id,
          daydream_type: daydreamType,
          side,
          last_visited: new Date().toISOString(),
        },
        { onConflict: 'user_id,daydream_type', ignoreDuplicates: false },
      );
  }, [daydreamType, side]);

  const persistState = useCallback((payload: DaydreamStatePayload) => {
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
            side,
            state: payload,
            last_visited: new Date().toISOString(),
          },
          { onConflict: 'user_id,daydream_type', ignoreDuplicates: false },
        );
    }, 800);
  }, [daydreamType, side]);

  // Mark visited on mount; clear any pending debounced write on unmount
  useEffect(() => {
    markVisited();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [markVisited]);

  return { persistState, markVisited };
}

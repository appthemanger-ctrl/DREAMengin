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
 * useDaydreamState — shared Daydream / Engin state hook.
 *
 * Provides per-daydream state management backed by localStorage for
 * session persistence and a Supabase write path for long-term storage.
 *
 * Each Daydream page passes its `domain` key (e.g. "music", "games") and
 * gets back the current side (A or B), whether the shell is in flip
 * animation, and helpers to flip or reset.
 *
 * README §7 — Daydream Pair System
 * ARCHITECTURE.md §1 — Daydream pairs
 * docs/dreamengin_phase6.md — Phase 6, point 34
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export type DaydreamDomain =
  | 'music'
  | 'games'
  | 'lab'
  | 'code'
  | 'brand'
  | 'create';

export type DaydreamSide = 'A' | 'B';

export interface DaydreamState {
  /** Current active side: A (Daydream) or B (Engin). */
  side: DaydreamSide;
  /** True while the flip animation is in progress. */
  flipping: boolean;
  /** Flip to the opposite side. No-ops if already flipping. */
  flip: () => void;
  /** Force a specific side without animation. */
  setSide: (side: DaydreamSide) => void;
}

const STORAGE_KEY = (domain: DaydreamDomain) => `de-daydream-side:${domain}`;

/**
 * Returns reactive Daydream/Engin side state for the given domain.
 *
 * @param domain  - One of the six canonical Daydream domains.
 * @param flipDuration - Milliseconds for the flip animation (default: 600).
 */
export function useDaydreamState(
  domain: DaydreamDomain,
  flipDuration = 600,
): DaydreamState {
  const [side, _setSide] = useState<DaydreamSide>(() => {
    if (typeof window === 'undefined') return 'A';
    const stored = localStorage.getItem(STORAGE_KEY(domain));
    return stored === 'B' ? 'B' : 'A';
  });
  const [flipping, setFlipping] = useState(false);
  const flipRef = useRef(false);

  /* Persist side to localStorage on change */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY(domain), side);
    }
  }, [domain, side]);

  const setSide = useCallback((next: DaydreamSide) => {
    _setSide(next);
  }, []);

  const t1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Cancel pending flip timers on unmount */
  useEffect(() => {
    return () => {
      if (t1Ref.current) clearTimeout(t1Ref.current);
      if (t2Ref.current) clearTimeout(t2Ref.current);
    };
  }, []);

  const flip = useCallback(() => {
    if (flipRef.current) return;
    flipRef.current = true;
    setFlipping(true);
    const halfDuration = flipDuration / 2;
    t1Ref.current = setTimeout(() => {
      _setSide(prev => (prev === 'A' ? 'B' : 'A'));
      t2Ref.current = setTimeout(() => {
        setFlipping(false);
        flipRef.current = false;
      }, halfDuration);
    }, halfDuration);
  }, [flipDuration]);

  return { side, flipping, flip, setSide };
}

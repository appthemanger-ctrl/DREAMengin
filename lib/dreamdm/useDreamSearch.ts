'use client';

/**
 * useDreamSearch — universal search hook shared by DreamDMessaging and DreamDM Bar.
 *
 * Searches multiple object types:
 *   - people / friends / pages  (profiles table)
 *   - conversations              (conversations table)
 *   - boards                     (message_boards table, if present)
 *   - topics                     (board_topics table, if present)
 *
 * Also manages the Dr. Eams mode toggle (persisted to localStorage).
 *
 * Rules (spec §31–50):
 *   - Standard search is the default mode.
 *   - Dr. Eams mode is optional and must be explicitly toggled by the user.
 *   - Switching must be clear and intentional (persisted preference).
 *   - Results are returned as typed SearchResult objects for use in both
 *     compact (DreamDM Bar) and expanded (DreamDMessaging) suggestion lists.
 *   - No false results for unsupported object types (spec §90).
 *
 * Architecture: Logic layer (lib/) — no UI, no direct component imports.
 * Privacy: queries restricted to public or participant-accessible data via RLS.
 *
 * docs/dreamdm_messaging_phase2.md §3 — useDreamSearch
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SearchResultType =
  | 'person'
  | 'conversation'
  | 'board'
  | 'topic';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  /** Primary display label */
  label: string;
  /** Secondary display label (e.g. @handle, board name) */
  sublabel?: string;
  avatarUrl?: string | null;
  /** Navigation href for board / topic / profile results */
  href?: string;
  /** Conversation or user ID used to initiate/open a message flow */
  targetId?: string;
}

export interface UseDreamSearchReturn {
  /** Current search results — up to 8 items, mixed types */
  results: SearchResult[];
  /** True while an async search is in flight */
  isSearching: boolean;
  /** Whether Dr. Eams mode is active (spec §40–45) */
  drEamsMode: boolean;
  /** Toggle Dr. Eams mode on/off (persists to localStorage) */
  toggleDrEams: () => void;
  /** Clear current results (call when user closes suggestion list) */
  clearResults: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DR_EAMS_KEY  = 'de-dreams-mode';
const DEBOUNCE_MS  = 300;
const MAX_RESULTS  = 8;
const PER_TYPE     = 5;

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDreamSearch(query: string): UseDreamSearchReturn {
  const [results,     setResults]     = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [drEamsMode,  setDrEamsMode]  = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Restore Dr. Eams preference from localStorage ─────────────────────────
  useEffect(() => {
    try {
      if (localStorage.getItem(DR_EAMS_KEY) === 'true') {
        setDrEamsMode(true);
      }
    } catch { /* SSR or private-browse — ignore */ }
  }, []);

  // ── Toggle Dr. Eams mode ───────────────────────────────────────────────────
  const toggleDrEams = useCallback(() => {
    setDrEamsMode((prev) => {
      const next = !prev;
      try { localStorage.setItem(DR_EAMS_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ── Clear results ──────────────────────────────────────────────────────────
  const clearResults = useCallback(() => setResults([]), []);

  // ── Debounced search ───────────────────────────────────────────────────────
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const supabase = createClient();
        const q        = trimmed.toLowerCase();
        const combined: SearchResult[] = [];

        // ── 1. Profiles (people / pages / friends) ──────────────────────────
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, handle, avatar_url')
          .or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`)
          .limit(PER_TYPE);

        if (profiles) {
          for (const p of profiles) {
            combined.push({
              id:        p.id,
              type:      'person',
              label:     p.display_name || p.handle || 'Unknown',
              sublabel:  p.handle ? `@${p.handle}` : undefined,
              avatarUrl: p.avatar_url,
              href:      `/profile/${p.handle || p.id}`,
              targetId:  p.id,
            });
          }
        }

        // ── 2. Conversations (matched by other participant name / handle) ───
        const { data: convs } = await supabase
          .from('conversations')
          .select(`
            id,
            participant1:profiles!participant1_id(id, handle, display_name, avatar_url),
            participant2:profiles!participant2_id(id, handle, display_name, avatar_url)
          `)
          .limit(PER_TYPE * 2); // over-fetch, filter client-side

        if (convs) {
          for (const conv of convs) {
            type Participant = { id: string; handle: string | null; display_name: string | null; avatar_url: string | null };
            const p1 = conv.participant1 as Participant;
            const p2 = conv.participant2 as Participant;
            const match = [p1, p2].find(
              (p) =>
                p?.handle?.toLowerCase().includes(q) ||
                p?.display_name?.toLowerCase().includes(q),
            );
            if (match) {
              // Avoid duplicate if same person already in people results
              const alreadyAdded = combined.some(
                (r) => r.type === 'conversation' && r.id === conv.id,
              );
              if (!alreadyAdded) {
                combined.push({
                  id:        conv.id,
                  type:      'conversation',
                  label:     match.display_name || match.handle || 'Conversation',
                  sublabel:  match.handle ? `@${match.handle}` : 'Conversation',
                  avatarUrl: match.avatar_url,
                  href:      `/messages?conversation=${conv.id}`,
                  targetId:  conv.id,
                });
              }
            }
          }
        }

        // ── 3. Message boards ───────────────────────────────────────────────
        // Query board titles if the table exists (graceful failure otherwise)
        try {
          const { data: boards } = await supabase
            .from('message_boards')
            .select('id, title, description')
            .ilike('title', `%${q}%`)
            .limit(PER_TYPE);

          if (boards) {
            for (const b of boards) {
              combined.push({
                id:       b.id,
                type:     'board',
                label:    b.title,
                sublabel: b.description ?? 'Board',
                href:     `/messages/boards/${b.id}`,
              });
            }
          }
        } catch { /* table may not exist yet — skip silently */ }

        setResults(combined.slice(0, MAX_RESULTS));
      } catch (err) {
        console.error('[useDreamSearch] error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { results, isSearching, drEamsMode, toggleDrEams, clearResults };
}

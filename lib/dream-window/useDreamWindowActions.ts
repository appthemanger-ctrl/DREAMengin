'use client';
/**
 * lib/dream-window/useDreamWindowActions.ts
 *
 * React hook wrapping all Dream Window API calls.
 *
 * Exposes:
 *   { dreamWindows, bindWindow, mountWindow, collapseWindow, activateWindow,
 *     unbindWindow, removeWindow, addWindow, isLoading }
 *
 * Every action writes to the database via the canonical API routes:
 *   POST   /api/dream-windows          — add / create
 *   PATCH  /api/dream-windows/[id]     — bind, mount, collapse, activate, unbind
 *   DELETE /api/dream-windows/[id]     — remove (atomic delete)
 *
 * Architecture: docs/ARCHITECTURE.md §4 (Universal Dream Window model)
 * Phase 8 Section B: Point 16 — all actions write to DB.
 */

import { useCallback, useEffect, useState } from 'react';
import { DREAM_WINDOW_STATES } from './DreamWindowLifecycle';
import type { DreamWindowRecord, CreateDreamWindowBody } from '@/types/dream-window';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseDreamWindowActionsReturn {
  /** Current list of Dream Window records for the authenticated user */
  dreamWindows: DreamWindowRecord[];
  /** True while any API call is in flight */
  isLoading: boolean;
  /** Last error message, or null if no error */
  error: string | null;
  /**
   * Add a new Dream Window — POST /api/dream-windows
   * Transition: creates new record in Unbound state
   */
  addWindow: (body: CreateDreamWindowBody) => Promise<DreamWindowRecord | null>;
  /**
   * Remove a Dream Window — DELETE /api/dream-windows/[id]
   * Transition: atomic delete of record + visibility mappings + projections
   */
  removeWindow: (id: string) => Promise<boolean>;
  /**
   * Bind a Dream Window — PATCH active_state → 'Bound Dream Window'
   * Transition: Unbound → Bound
   */
  bindWindow: (id: string) => Promise<DreamWindowRecord | null>;
  /**
   * Mount a Dream Window — PATCH active_state → 'Mounted Dream Window'
   * Transition: Bound → Mounted
   */
  mountWindow: (id: string) => Promise<DreamWindowRecord | null>;
  /**
   * Collapse a Dream Window — PATCH active_state → 'Collapsed Dream Window'
   * Transition: Mounted → Collapsed
   */
  collapseWindow: (id: string) => Promise<DreamWindowRecord | null>;
  /**
   * Activate a Dream Window — PATCH active_state → 'Mounted Dream Window'
   * Transition: Collapsed → Mounted (re-expand)
   */
  activateWindow: (id: string) => Promise<DreamWindowRecord | null>;
  /**
   * Unbind a Dream Window — PATCH active_state → 'Unbound Dream Window'
   * Transition: Bound → Unbound
   */
  unbindWindow: (id: string) => Promise<DreamWindowRecord | null>;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function useDreamWindowActions(): UseDreamWindowActionsReturn {
  const [dreamWindows, setDreamWindows] = useState<DreamWindowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load on mount ──────────────────────────────────────────────────────

  const loadWindows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dream-windows');
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError((json as { error?: string }).error ?? 'Failed to load Dream Windows');
        return;
      }
      const json = await res.json() as { dreamWindows: DreamWindowRecord[] };
      setDreamWindows(json.dreamWindows ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWindows();
  }, [loadWindows]);

  // ── Add ────────────────────────────────────────────────────────────────

  const addWindow = useCallback(async (
    body: CreateDreamWindowBody,
  ): Promise<DreamWindowRecord | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dream-windows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { dreamWindow?: DreamWindowRecord; error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Failed to create Dream Window');
        return null;
      }
      const newWindow = json.dreamWindow!;
      setDreamWindows((prev) => [newWindow, ...prev]);
      return newWindow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Remove ─────────────────────────────────────────────────────────────

  const removeWindow = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dream-windows/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError((json as { error?: string }).error ?? 'Failed to delete Dream Window');
        return false;
      }
      setDreamWindows((prev) => prev.filter((w) => w.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Generic state transition ───────────────────────────────────────────

  const patchState = useCallback(async (
    id: string,
    active_state: string,
  ): Promise<DreamWindowRecord | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dream-windows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_state }),
      });
      const json = await res.json() as { dreamWindow?: DreamWindowRecord; error?: string };
      if (!res.ok) {
        setError(json.error ?? `Failed to transition Dream Window to ${active_state}`);
        return null;
      }
      const updated = json.dreamWindow!;
      setDreamWindows((prev) =>
        prev.map((w) => (w.id === id ? updated : w)),
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Lifecycle transition methods ───────────────────────────────────────

  const bindWindow = useCallback(
    (id: string) => patchState(id, DREAM_WINDOW_STATES.BOUND),
    [patchState],
  );

  const mountWindow = useCallback(
    (id: string) => patchState(id, DREAM_WINDOW_STATES.MOUNTED),
    [patchState],
  );

  const collapseWindow = useCallback(
    (id: string) => patchState(id, DREAM_WINDOW_STATES.COLLAPSED),
    [patchState],
  );

  const activateWindow = useCallback(
    (id: string) => patchState(id, DREAM_WINDOW_STATES.MOUNTED),
    [patchState],
  );

  const unbindWindow = useCallback(
    (id: string) => patchState(id, DREAM_WINDOW_STATES.UNBOUND),
    [patchState],
  );

  return {
    dreamWindows,
    isLoading,
    error,
    addWindow,
    removeWindow,
    bindWindow,
    mountWindow,
    collapseWindow,
    activateWindow,
    unbindWindow,
  };
}

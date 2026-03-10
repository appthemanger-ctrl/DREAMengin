'use client';

/**
 * useDreamDMBar — state and drag logic for the DreamDM Bar (Pass 1).
 *
 * Manages:
 *  - Bar snap position (surface-focus / balanced / dream-focus)
 *  - Live drag ratio during pointer drag
 *  - Quick-compose draft with localStorage persistence
 *
 * Architecture: Logic layer (lib/) — no UI, no DB access.
 * Privacy: Draft stored only in localStorage (user-private, never sent without
 *          explicit user action — CONSTITUTION Art. III, AXIOM 5).
 *
 * Spec: README.md §22 (DreamDM Bar — Persistent Spatial Divider)
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type DreamDMSnapPoint = 'surface-focus' | 'balanced' | 'dream-focus';

/**
 * Fraction of viewport height where the top of the bar sits.
 * surface-focus  → bar at 87vh  (Surface ~87%, Dream ~13%)
 * balanced       → bar at 50vh  (50 / 50)
 * dream-focus    → bar at 10vh  (Surface ~10%, Dream ~90%)
 */
export const SNAP_PCT: Record<DreamDMSnapPoint, number> = {
  'surface-focus': 0.87,
  'balanced':      0.50,
  'dream-focus':   0.10,
};

const DRAFT_KEY = 'dreamengin:dreamdm-draft';
const SNAP_KEY  = 'dreamengin:dreamdm-snap';

export interface UseDreamDMBarReturn {
  /** Current canonical snap position */
  snapPoint: DreamDMSnapPoint;
  /** Set snap position programmatically */
  setSnapPoint: (snap: DreamDMSnapPoint) => void;
  /**
   * Fraction (0–1) of viewport height at which the top of the bar sits.
   * During drag this reflects the live pointer position; otherwise it
   * mirrors SNAP_PCT[snapPoint].
   */
  barTopPct: number;
  /** True while the user is actively dragging the bar */
  isDragging: boolean;
  /** Current compose draft text */
  draft: string;
  /** Update draft text (persisted to localStorage automatically) */
  setDraft: (d: string) => void;
  /** Ref to attach to the outermost container div (used for height measurement) */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Pointer-event handlers for the draggable handle element */
  handleDragStart: (e: React.PointerEvent) => void;
  handleDragMove:  (e: React.PointerEvent) => void;
  handleDragEnd:   (e: React.PointerEvent) => void;
}

export function useDreamDMBar(): UseDreamDMBarReturn {
  const [snapPoint,    setSnapPointState] = useState<DreamDMSnapPoint>('surface-focus');
  const [draft,        setDraftState]     = useState('');
  const [isDragging,   setIsDragging]     = useState(false);
  const [liveTopPct,   setLiveTopPct]     = useState<number | null>(null);

  const containerRef   = useRef<HTMLDivElement>(null);
  const dragOriginY    = useRef(0);
  const dragOriginPct  = useRef(0);

  // ── Restore persisted state on mount ──────────────────────────────────────
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) setDraftState(savedDraft);
      const savedSnap = localStorage.getItem(SNAP_KEY) as DreamDMSnapPoint | null;
      if (savedSnap && savedSnap in SNAP_PCT) setSnapPointState(savedSnap);
    } catch { /* noop — SSR or private-browse */ }
  }, []);

  // ── Persist draft ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      if (draft) {
        localStorage.setItem(DRAFT_KEY, draft);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch { /* noop */ }
  }, [draft]);

  // ── setSnapPoint (also persists) ───────────────────────────────────────────
  const setSnapPoint = useCallback((snap: DreamDMSnapPoint) => {
    setSnapPointState(snap);
    setLiveTopPct(null);
    try { localStorage.setItem(SNAP_KEY, snap); } catch { /* noop */ }
  }, []);

  // ── Snap to nearest canonical position ────────────────────────────────────
  const snapToNearest = useCallback((pct: number) => {
    const entries = Object.entries(SNAP_PCT) as [DreamDMSnapPoint, number][];
    let nearest: DreamDMSnapPoint = 'surface-focus';
    let minDist = Infinity;
    for (const [snap, r] of entries) {
      const dist = Math.abs(pct - r);
      if (dist < minDist) { minDist = dist; nearest = snap; }
    }
    setSnapPoint(nearest);
  }, [setSnapPoint]);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    dragOriginY.current   = e.clientY;
    dragOriginPct.current = liveTopPct ?? SNAP_PCT[snapPoint];
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [liveTopPct, snapPoint]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const h = containerRef.current.offsetHeight;
    if (!h) return;
    const dy     = e.clientY - dragOriginY.current;
    const newPct = Math.max(0.05, Math.min(0.92, dragOriginPct.current + dy / h));
    setLiveTopPct(newPct);
  }, [isDragging]);

  const handleDragEnd = useCallback((_e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    snapToNearest(liveTopPct ?? SNAP_PCT[snapPoint]);
    setLiveTopPct(null);
  }, [isDragging, liveTopPct, snapPoint, snapToNearest]);

  return {
    snapPoint,
    setSnapPoint,
    barTopPct: liveTopPct ?? SNAP_PCT[snapPoint],
    isDragging,
    draft,
    setDraft: setDraftState,
    containerRef,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}

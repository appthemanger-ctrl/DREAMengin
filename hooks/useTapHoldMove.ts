'use client';

/**
 * useTapHoldMove — Tap / Hold / Drag-to-Edge transfer hook
 *
 * Detects a ≥ 300ms hold on any DOM element, then enables dragging.
 * When the element is dragged near a screen edge, onTransfer is called
 * with the module manifest and the target runtime inferred from the edge.
 *
 * Edge → Runtime mapping:
 *   left edge  → HomeDream
 *   right edge → DreamSpace
 *   top edge   → Daydream
 *   bottom edge → Engin
 */

import { useEffect, useRef, useCallback } from 'react';
import type { ModuleManifest, RuntimeId } from '../lib/universalEditor';
import { canTransfer } from '../lib/universalEditor';

// ─── Constants ────────────────────────────────────────────────────────────────

const HOLD_DURATION_MS    = 300;
const EDGE_THRESHOLD_PX   = 60;

// ─── Edge detection ───────────────────────────────────────────────────────────

function detectEdgeRuntime(
  clientX: number,
  clientY: number
): RuntimeId | null {
  const { innerWidth: W, innerHeight: H } = window;
  if (clientX < EDGE_THRESHOLD_PX)       return 'HomeDream';
  if (clientX > W - EDGE_THRESHOLD_PX)   return 'DreamSpace';
  if (clientY < EDGE_THRESHOLD_PX)       return 'Daydream';
  if (clientY > H - EDGE_THRESHOLD_PX)   return 'Engin';
  return null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseTapHoldMoveOptions {
  /** The module manifest for this draggable element. */
  manifest: ModuleManifest;
  /** Called when the user drags the element to a compatible runtime edge. */
  onTransfer(manifest: ModuleManifest, targetRuntime: RuntimeId): void;
}

export function useTapHoldMove(
  ref: React.RefObject<HTMLElement | null>,
  { manifest, onTransfer }: UseTapHoldMoveOptions
): void {
  const holdTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging     = useRef(false);
  const holdFired    = useRef(false);

  const clearHold = useCallback(() => {
    if (holdTimer.current !== null) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    dragging.current  = false;
    holdFired.current = false;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // ── Pointer down → start hold timer ──
    const onPointerDown = (e: PointerEvent) => {
      holdFired.current = false;
      holdTimer.current = setTimeout(() => {
        holdFired.current = true;
        dragging.current  = true;
        el.setPointerCapture(e.pointerId);
        el.style.cursor   = 'grabbing';
        el.style.opacity  = '0.75';
      }, HOLD_DURATION_MS);
    };

    // ── Pointer move → check edge if dragging ──
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const target = detectEdgeRuntime(e.clientX, e.clientY);
      if (target && canTransfer(manifest, target)) {
        el.style.outline = '2px solid #fbbf24'; // gold highlight
      } else {
        el.style.outline = '';
      }
    };

    // ── Pointer up → trigger transfer or cancel ──
    const onPointerUp = (e: PointerEvent) => {
      if (holdTimer.current !== null) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
      if (dragging.current && holdFired.current) {
        const target = detectEdgeRuntime(e.clientX, e.clientY);
        if (target && canTransfer(manifest, target)) {
          onTransfer(manifest, target);
        }
      }
      dragging.current  = false;
      holdFired.current = false;
      el.style.cursor   = '';
      el.style.opacity  = '';
      el.style.outline  = '';
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup',   onPointerUp);
    el.addEventListener('pointercancel', clearHold);

    return () => {
      clearHold();
      el.removeEventListener('pointerdown',  onPointerDown);
      el.removeEventListener('pointermove',  onPointerMove);
      el.removeEventListener('pointerup',    onPointerUp);
      el.removeEventListener('pointercancel', clearHold);
    };
  }, [ref, manifest, onTransfer, clearHold]);
}

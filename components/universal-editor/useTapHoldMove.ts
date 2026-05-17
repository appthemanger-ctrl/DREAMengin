'use client';

/**
 * components/universal-editor/useTapHoldMove.ts — §39 Tap-Hold-Move hook
 *
 * Detects:
 *   - Tap-hold ≥ 300 ms  → enters drag mode (onDragStart)
 *   - Drag movement       → fires onMove(manifest, position)
 *   - Drag to screen edge (within 40 px) → fires onTransfer(manifest, targetRuntime)
 *
 * Works with touch and mouse events.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { ModuleManifest, RuntimeId } from '@/lib/universal-editor/module-manifest';

// --- Constants ----------------------------------------------------------------

const TAP_HOLD_MS  = 300;
const EDGE_PX      = 40;

// --- Types --------------------------------------------------------------------

export interface Position {
  x: number;
  y: number;
}

export interface TapHoldMoveOptions {
  manifest:     ModuleManifest;
  onDragStart?: (manifest: ModuleManifest) => void;
  onMove?:      (manifest: ModuleManifest, position: Position) => void;
  onTransfer?:  (manifest: ModuleManifest, targetRuntime: RuntimeId) => void;
  onDragEnd?:   (manifest: ModuleManifest) => void;
  disabled?:    boolean;
}

export interface TapHoldMoveBindings {
  onMouseDown:   React.MouseEventHandler;
  onTouchStart:  React.TouchEventHandler;
}

// --- Edge detection -----------------------------------------------------------

function detectEdgeRuntime(x: number, y: number: RuntimeId | null) {
  if (typeof window === 'undefined') return null;
  const { innerWidth: w, innerHeight: h } = window;
  if (x <= EDGE_PX)          return 'HomeDream';
  if (x >= w - EDGE_PX)      return 'DreamSpace';
  if (y <= EDGE_PX)          return 'Daydream';
  if (y >= h - EDGE_PX)      return 'Engin';
  return null;
}

// --- Hook ---------------------------------------------------------------------

export function useTapHoldMove() {
  manifest,
  onDragStart,
  onMove,
  onTransfer,
  onDragEnd,
  disabled = false,
}: TapHoldMoveOptions): TapHoldMoveBindings {
  const holdTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging   = useRef(false);
  const startPos   = useRef<Position>({ x: 0, y: 0 });

  // -- Drag started --------------------------------------------------------

  const beginDrag = useCallback((x: number, y: number) => {
    dragging.current = true;
    startPos.current = { x, y };
    onDragStart?.(manifest);
  }, [manifest, onDragStart]);

  // -- Move ----------------------------------------------------------------

  const handleMove = useCallback((x: number, y: number) => {
    if (!dragging.current) return;
    onMove?.(manifest, { x, y });

    const edge = detectEdgeRuntime(x, y);
    if (edge) {
      onTransfer?.(manifest, edge);
      dragging.current = false;
    }
  }, [manifest, onMove, onTransfer]);

  // -- End drag ------------------------------------------------------------

  const endDrag = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (dragging.current) {
      dragging.current = false;
      onDragEnd?.(manifest);
    }
  }, [manifest, onDragEnd]);

  // -- Mouse ----------------------------------------------------------------

  const onMouseDown: React.MouseEventHandler = useCallback(e: unknown => {
    if (disabled) return;
    const { clientX: x, clientY: y } = e;
    holdTimer.current = setTimeout(() => beginDrag(x, y), TAP_HOLD_MS);
  }, [disabled, beginDrag]);

  // -- Touch -----------------------------------------------------------------

  const onTouchStart: React.TouchEventHandler = useCallback(e: unknown => {
    if (disabled) return;
    const touch = e.touches[0];
    if (!touch) return;
    const { clientX: x, clientY: y } = touch;
    holdTimer.current = setTimeout(() => beginDrag(x, y), TAP_HOLD_MS);
  }, [disabled, beginDrag]);

  // -- Global move/end listeners ------------------------------------------

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) handleMove(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup',   endDrag);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend',  endDrag);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   endDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend',  endDrag);
    };
  }, [handleMove, endDrag]);

  return { onMouseDown, onTouchStart };
}

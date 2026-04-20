'use client';

/**
 * lib/runtime/useDragSurface.ts — Pass 6
 *
 * Universal drag/drop surface hook.
 *
 * Attach to any container element to make it a drop target for DreamDrops.
 * Works with native HTML5 drag-and-drop AND custom module transfer payloads
 * from DraggableModule/useTapHoldMove.
 *
 * Usage:
 *   const { dragProps, isOver, lastDrop } = useDragSurface({
 *     region: 'homedream',
 *     accepts: ['image', 'video', 'url'],
 *     onDrop: (drop) => { ... },
 *   });
 *   return <div {...dragProps} className={isOver ? 'ring-2 ring-violet-500' : ''} />;
 *
 * Architecture: docs/ARCHITECTURE.md §6 (Pass 6 — Universal drag/drop).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { coerceDataTransfer } from '@/lib/runtime/coercionTable';
import { dropTargetRegistry } from '@/lib/runtime/dropTargetRegistry';
import type { DreamDrop, DreamDropType } from '@/lib/runtime/coercionTable';
import type { RuntimeId } from '@/types/module-manifest';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseDragSurfaceOptions {
  /** The runtime region this surface belongs to. */
  region: RuntimeId;
  /** Drop types this surface accepts. Empty = accept all. */
  accepts?: DreamDropType[];
  /** Priority among targets in the same region (higher wins). Default: 0. */
  priority?: number;
  /** Stable ID for the drop target registration. Auto-generated if omitted. */
  id?: string;
  /** Called when a coerced drop is routed here. */
  onDrop?: (drop: DreamDrop) => void;
}

export interface UseDragSurfaceResult {
  /** Spread these onto the container div. */
  dragProps: {
    onDragOver:  React.DragEventHandler;
    onDragEnter: React.DragEventHandler;
    onDragLeave: React.DragEventHandler;
    onDrop:      React.DragEventHandler;
  };
  /** True while a drag is hovering over this surface. */
  isOver: boolean;
  /** The most recent drop received by this surface (null until first drop). */
  lastDrop: DreamDrop | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDragSurface({
  region,
  accepts = [],
  priority = 0,
  id,
  onDrop,
}: UseDragSurfaceOptions): UseDragSurfaceResult {
  const [isOver,    setIsOver]    = useState(false);
  const [lastDrop,  setLastDrop]  = useState<DreamDrop | null>(null);
  const targetId = useRef(id ?? `drag-surface:${region}:${Math.random().toString(36).slice(2)}`);
  const enterCount = useRef(0); // track nested dragenter/dragleave pairs

  const handleDrop = useCallback(
    (drop: DreamDrop) => {
      setLastDrop(drop);
      setIsOver(false);
      enterCount.current = 0;
      onDrop?.(drop);
    },
    [onDrop],
  );

  // ── Register / unregister with the global registry ────────────────────────

  useEffect(() => {
    dropTargetRegistry.register({
      id:       targetId.current,
      region,
      accepts,
      priority,
      onDrop:   handleDrop,
    });
    return () => dropTargetRegistry.unregister(targetId.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, priority, handleDrop]);

  // ── Native HTML5 drag event handlers ──────────────────────────────────────

  const onDragOver: React.DragEventHandler = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDragEnter: React.DragEventHandler = useCallback((e) => {
    e.preventDefault();
    enterCount.current++;
    setIsOver(true);
  }, []);

  const onDragLeave: React.DragEventHandler = useCallback((_e) => {
    enterCount.current--;
    if (enterCount.current <= 0) {
      enterCount.current = 0;
      setIsOver(false);
    }
  }, []);

  const onNativeDrop: React.DragEventHandler = useCallback(
    (e) => {
      e.preventDefault();
      const drop = coerceDataTransfer(e.dataTransfer);

      // Check accepts filter before calling handler.
      if (accepts.length === 0 || accepts.includes(drop.type)) {
        handleDrop(drop);
      }
    },
    [accepts, handleDrop],
  );

  return {
    dragProps: {
      onDragOver,
      onDragEnter,
      onDragLeave,
      onDrop: onNativeDrop,
    },
    isOver,
    lastDrop,
  };
}

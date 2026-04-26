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
 * Architecture: docs/ARCHITECTURE.md §6 (Pass 6 — Universal drag/drop).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { coerceDataTransfer } from '@/lib/runtime/coercionTable';
import { dropTargetRegistry } from '@/lib/runtime/dropTargetRegistry';
import type { DreamDrop, DreamDropType } from '@/lib/runtime/coercionTable';
import type { RuntimeId } from '@/types/module-manifest';

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
  /** Called when a native drop is valid but no registered target consumes it. */
  onUnhandledDrop?: (drop: DreamDrop) => void;
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

export function useDragSurface({
  region,
  accepts = [],
  priority = 0,
  id,
  onDrop,
  onUnhandledDrop,
}: UseDragSurfaceOptions): UseDragSurfaceResult {
  const [isOver, setIsOver] = useState(false);
  const [lastDrop, setLastDrop] = useState<DreamDrop | null>(null);
  const targetId = useRef(id ?? `drag-surface:${region}:${Math.random().toString(36).slice(2)}`);
  const enterCount = useRef(0);

  const handleDrop = useCallback(
    (drop: DreamDrop) => {
      setLastDrop(drop);
      setIsOver(false);
      enterCount.current = 0;
      onDrop?.(drop);
    },
    [onDrop],
  );

  useEffect(() => {
    dropTargetRegistry.register({
      id: targetId.current,
      region,
      accepts,
      priority,
      onDrop: handleDrop,
    });
    return () => dropTargetRegistry.unregister(targetId.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, priority, handleDrop]);

  const onDragOver: React.DragEventHandler = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDragEnter: React.DragEventHandler = useCallback((e) => {
    e.preventDefault();
    enterCount.current++;
    setIsOver(true);
  }, []);

  const onDragLeave: React.DragEventHandler = useCallback(() => {
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
      const accepted = accepts.length === 0 || accepts.includes(drop.type);
      if (!accepted) {
        setIsOver(false);
        return;
      }

      const routed = dropTargetRegistry.route(drop, region);
      if (!routed) {
        setIsOver(false);
        enterCount.current = 0;
        onUnhandledDrop?.(drop);
      }
    },
    [accepts, handleDrop, onUnhandledDrop, region],
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

'use client';

import React, { useRef, useState } from 'react';
import {
  DREAM_DRAG_MIME,
  serializeDreamDragData,
  type DreamDragData,
} from '@/lib/dreams/drag';

interface DraggableDreamProps {
  dream: DreamDragData;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function DraggableDream({ dream, children: Record<string, unknown>, className: Record<string, unknown>, style }: DraggableDreamProps) {
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  const dispatchDragMove = () => {
    frameRef.current = null;
    const pointer = pointerRef.current;
    if (!pointer) return;
    window.dispatchEvent(new CustomEvent('dream:drag-move', {
      detail: { dream, clientX: pointer.x, clientY: pointer.y },
    }));
  };

  return (
    <div
      draggable
      className={className}
      data-dream-id={dream.dream_id}
      data-dream-runtime={dream.runtime}
      onDragStart={(event) => {
        const payload = serializeDreamDragData(dream);
        event.dataTransfer.setData('text/plain', payload);
        event.dataTransfer.setData(DREAM_DRAG_MIME, payload);
        event.dataTransfer.effectAllowed = 'move';
        setDragging(true);
        window.dispatchEvent(new CustomEvent('dream:drag-start', {
          detail: { dream, clientX: event.clientX, clientY: event.clientY },
        }));
      }}
      onDrag={(event) => {
        pointerRef.current = { x: event.clientX, y: event.clientY };
        if (frameRef.current === null) {
          frameRef.current = window.requestAnimationFrame(dispatchDragMove);
        }
      }}
      onDragEnd={(event) => {
        if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        pointerRef.current = null;
        setDragging(false);
        window.dispatchEvent(new CustomEvent('dream:drag-end', {
          detail: { dream, clientX: event.clientX, clientY: event.clientY },
        }));
      }}
      style={{
        opacity: dragging ? 0.58 : 1,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        transition: 'opacity 120ms ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

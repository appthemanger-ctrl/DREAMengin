'use client';

import React, { useState } from 'react';
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

export default function DraggableDream({ dream, children, className, style }: DraggableDreamProps) {
  const [dragging, setDragging] = useState(false);

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
        if (event.clientX || event.clientY) {
          window.dispatchEvent(new CustomEvent('dream:drag-move', {
            detail: { dream, clientX: event.clientX, clientY: event.clientY },
          }));
        }
      }}
      onDragEnd={(event) => {
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

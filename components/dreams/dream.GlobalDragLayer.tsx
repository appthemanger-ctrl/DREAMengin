'use client';

import type { DreamDragData } from '@/lib/dreams/drag';
import { useEffect, useRef, useState } from 'react';

interface DragLayerState {
  dream: DreamDragData;
  x: number;
  y: number;
}

export default function GlobalDreamDragLayer( ){
  const [drag, setDrag] = useState<DragLayerState | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const start = (event: Event) => {
      const detail = (event as CustomEvent).detail as { dream: DreamDragData; clientX: number; clientY: number };
      setDrag({ dream: detail.dream, x: detail.clientX, y: detail.clientY });
    };
    const move = (event: Event) => {
      const detail = (event as CustomEvent).detail as { dream: DreamDragData; clientX: number; clientY: number };
      if (!detail?.dream) return;
      setDrag({ dream: detail.dream, x: detail.clientX, y: detail.clientY });
    };
    const dragOver = (event: DragEvent) => {
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const point = lastPointerRef.current;
        if (!point) return;
        setDrag((current) => current ? { ...current, x: point.x, y: point.y } : current);
      });
    };
    const end = () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastPointerRef.current = null;
      setDrag(null);
    };
    window.addEventListener('dream:drag-start', start);
    window.addEventListener('dream:drag-move', move);
    window.addEventListener('dragover', dragOver);
    window.addEventListener('dream:drag-end', end);
    window.addEventListener('drop', end);
    return () => {
      window.removeEventListener('dream:drag-start', start);
      window.removeEventListener('dream:drag-move', move);
      window.removeEventListener('dragover', dragOver);
      window.removeEventListener('dream:drag-end', end);
      window.removeEventListener('drop', end);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  if (!drag) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 5000,
        transform: `translate3d(${drag.x + 14}px, ${drag.y + 14}px, 0)`,
        willChange: 'transform',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          minWidth: 160,
          maxWidth: 240,
          borderRadius: 18,
          padding: '12px 14px',
          background: 'linear-gradient(135deg, rgba(8,16,38,0.92), rgba(42,138,184,0.82))',
          border: '1px solid rgba(232,184,48,0.36)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.36), 0 0 32px rgba(232,184,48,0.16)',
          color: '#fff',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f4d37b', fontWeight: 800 }}>
          Moving Dream
        </div>
        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 800 }}>
          {drag.dream.title ?? drag.dream.type}
        </div>
      </div>
    </div>
  );
}

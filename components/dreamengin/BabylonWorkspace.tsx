// BabylonWorkspace.tsx
// A lightweight stand‑in for the Babylon.js renderer.  It renders a large
// container that can be panned and zoomed.  When Babylon.js is available this
// component can be replaced with a real engine integration.

'use client';

import React, { useRef, useEffect } from 'react';

interface WorkspaceProps {
  position: { x: number; y: number };
  scale: number;
  depth: number;
  onPan: (dx: number, dy: number) => void;
  onZoom: (dz: number) => void;
}

export default function BabylonWorkspace({
  position,
  scale,
  depth,
  onPan,
  onZoom,
}: WorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<{
    isPanning: boolean;
    startX: number;
    startY: number;
  }>({
    isPanning: false,
    startX: 0,
    startY: 0,
  });

  // Attach pointer listeners to handle panning
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointerState.current.isPanning = true;
      pointerState.current.startX = e.clientX;
      pointerState.current.startY = e.clientY;
      el.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!pointerState.current.isPanning) return;
      const dx = e.clientX - pointerState.current.startX;
      const dy = e.clientY - pointerState.current.startY;
      pointerState.current.startX = e.clientX;
      pointerState.current.startY = e.clientY;
      onPan(dx, dy);
    };

    const handlePointerUp = (e: PointerEvent) => {
      pointerState.current.isPanning = false;
      el.releasePointerCapture(e.pointerId);
    };

    const handleWheel = (e: WheelEvent) => {
      // Zoom with wheel; deltaY positive indicates scroll down
      e.preventDefault();
      const dz = -e.deltaY * 0.001;
      onZoom(dz);
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointerleave', handlePointerUp);
    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointerleave', handlePointerUp);
      el.removeEventListener('wheel', handleWheel);
    };
  }, [onPan, onZoom]);

  // Simple content: a tiled grid to visualise movement
  const tiles = [] as JSX.Element[];
  for (let i = 0; i < 100; i++) {
    tiles.push(
      <div
        key={i}
        className="bg-gray-700 dark:bg-gray-800 border border-gray-600 dark:border-gray-700"
        style={{
          width: 200,
          height: 200,
          display: 'inline-block',
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{
        touchAction: 'none',
        backgroundColor: '#0a0a0a',
        cursor: 'grab',
      }}
    >
      <div
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
          transformOrigin: '0 0',
          transition: 'transform 0s',
          width: '4000px',
          height: '4000px',
        }}
      >
        {/* Render placeholder content.  Replace with Babylon.js scene when available. */}
        {tiles}
      </div>
    </div>
  );
}
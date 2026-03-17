'use client';

import React, { useRef } from 'react';

interface DreamNavControlsProps {
  onHome: () => void;
  onBothMenus: () => void;
}

const DOUBLE_TAP_MS = 260;

export default function DreamNavControls({ onHome, onBothMenus }: DreamNavControlsProps) {
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = () => {
    const now = performance.now();
    const last = lastTapRef.current;
    lastTapRef.current = now;

    // Single tap → open both menus. Double tap → go home.
    if (now - last <= DOUBLE_TAP_MS) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      onHome();
      return;
    }

    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      onBothMenus();
    }, DOUBLE_TAP_MS + 10);
  };

  return (
    <button
      type="button"
      aria-label="Dream Navigation"
      className="gold-button"
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        handleTap();
      }}
      onPointerCancel={(e) => {
        e.preventDefault();
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1, userSelect: 'none' }}>✦</span>
    </button>
  );
}

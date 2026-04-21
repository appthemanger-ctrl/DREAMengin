'use client';

import React, { useRef } from 'react';

interface DreamNavControlsProps {
  onHome: () => void;
  onBothMenus: () => void;
}

const DOUBLE_TAP_MS = 260;

export default function DreamNavControls({ onHome, onBothMenus }: DreamNavControlsProps) {
  const lastTapRef = useRef(0);

  const handleTap = () => {
    const now = performance.now();
    const last = lastTapRef.current;
    lastTapRef.current = now;

    // Double tap → open dual menus (immediate).
    if (now - last <= DOUBLE_TAP_MS) {
      onBothMenus();
      return;
    }

    // Single tap → go home (immediate, no delay).
    onHome();
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

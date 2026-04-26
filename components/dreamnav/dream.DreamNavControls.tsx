'use client';

import React, { useEffect, useRef } from 'react';

interface DreamNavControlsProps {
  onHome: () => void;
  onBothMenus: () => void;
}

const DOUBLE_TAP_MS = 260;

export default function DreamNavControls({ onHome, onBothMenus }: DreamNavControlsProps) {
  const lastTapRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    };
  }, []);

  const handleTap = () => {
    const now = performance.now();
    const last = lastTapRef.current;
    lastTapRef.current = now;

    // Double tap → open dual menus (the only sanctioned double-tap).
    if (last > 0 && now - last <= DOUBLE_TAP_MS) {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      onBothMenus();
      return;
    }

    // Single tap → go home, delayed so double-tap can own menu opening.
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapTimerRef.current = null;
      onHome();
    }, DOUBLE_TAP_MS);
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

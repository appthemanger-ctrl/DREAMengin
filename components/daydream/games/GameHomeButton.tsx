// components/daydream/games/GameHomeButton.tsx
//
// A drop-in replacement for the DayDreamShell ⌂ home button while a game is
// in play / pause mode.  It looks identical to the real home button so the
// user doesn't notice the swap, but it has game-specific tap semantics:
//
//   single tap  → pause the game  (onPause)
//   double tap  → open game menu  (onMenu)
//
// When the user exits the game the shell swaps this button back out and the
// real ⌂ link reappears.

'use client';

import React, { useRef } from 'react';

const DOUBLE_TAP_MS = 260;

interface GameHomeButtonProps {
  /** Called on a confirmed single tap — should pause the running game. */
  onPause: () => void;
  /** Called on a double tap — should open the in-game menu. */
  onMenu: () => void;
}

export default function GameHomeButton({ onPause, onMenu }: GameHomeButtonProps) {
  const lastTapRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = () => {
    const now = performance.now();
    if (now - lastTapRef.current <= DOUBLE_TAP_MS) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      lastTapRef.current = 0;
      onMenu();
      return;
    }
    lastTapRef.current = now;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onPause();
    }, DOUBLE_TAP_MS + 10);
  };

  return (
    <button
      type="button"
      aria-label="Game Home — tap to pause, double-tap for menu"
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLButtonElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        handleTap();
      }}
      onPointerCancel={(e) => {
        e.preventDefault();
      }}
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(100,150,255,0.1)',
        border: '1px solid rgba(100,150,255,0.2)',
        fontSize: 14,
        color: 'rgba(160,185,255,0.7)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'none',
        flexShrink: 0,
      }}
    >
      ⌂
    </button>
  );
}

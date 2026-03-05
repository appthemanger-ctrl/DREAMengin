// components/dreamengin/HomeControls.tsx
// v3.0.0 behavior (per SPEC.md §3.1 — single home button):
// - One floating button, fixed at bottom center.
// - Single tap: Return Home
// - Double tap: Open Dreams menu
//
// Notes:
// - We intentionally removed hold/drag depth navigation to avoid iOS Safari conflicts (pull-to-refresh / back swipe).
// - Keep these controls lightweight: no per-frame React state during gestures.

'use client';

import React, { useMemo, useRef } from 'react';

interface HomeControlsProps {
  onDoubleTap: () => void;
  onGoHome: () => void;
}

const BTN = 52;
const DOUBLE_TAP_MS = 260;

function InfinityIcon() {
  return (
    <svg width="28" height="14" viewBox="0 0 80 36" className="opacity-95">
      <path
        d="M10 18c8-10 18-10 28 0s20 10 28 0"
        fill="none"
        stroke="var(--de-gold, #c8981a)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M10 18c8 10 18 10 28 0s20-10 28 0"
        fill="none"
        stroke="var(--de-gold, #c8981a)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M38 18c4-5 10-10 18-10s16 8 16 10-6 10-16 10-14-5-18-10"
        fill="none"
        stroke="var(--de-accent, #2a8ab8)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HomeControls({
  onDoubleTap,
  onGoHome,
}: HomeControlsProps) {
  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const btnStyle = useMemo(
    () => ({
      width: BTN,
      height: BTN,
      borderRadius: 9999,
      background: 'rgba(42,138,184,0.88)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      border: '2px solid rgba(255,255,255,0.16)',
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'none' as const,
    }),
    []
  );

  const handleTap = () => {
    const now = performance.now();
    const last = lastTapRef.current;
    lastTapRef.current = now;

    if (now - last <= DOUBLE_TAP_MS) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      onDoubleTap();
      return;
    }

    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      onGoHome();
    }, DOUBLE_TAP_MS + 10);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="pointer-events-auto"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 18,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
        }}
      >
        <button
          type="button"
          aria-label="Go Home · Double-tap for Dreams menu"
          className="flex items-center justify-center select-none"
          style={btnStyle}
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
        >
          <InfinityIcon />
        </button>
      </div>
    </div>
  );
}

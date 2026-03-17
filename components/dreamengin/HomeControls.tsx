// components/dreamengin/HomeControls.tsx
// ONE gold button. Always has been. Always will be.
//   • Single tap → open both menus (Outdream on left, Nexus on right)
//   • Double tap → go home

'use client';

import React, { useRef } from 'react';

interface HomeControlsProps {
  onBothMenus: () => void;
  onHome: () => void;
}

const BTN = 52;
const DOUBLE_TAP_MS = 260;

export default function HomeControls({ onBothMenus, onHome }: HomeControlsProps) {
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = () => {
    const now = performance.now();
    const last = lastTapRef.current;
    lastTapRef.current = now;

    // Double tap → go home
    if (now - last <= DOUBLE_TAP_MS) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      onHome();
      return;
    }

    // Single tap → open both menus
    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      onBothMenus();
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
          zIndex: 60,
        }}
      >
        <button
          type="button"
          aria-label="Dream Navigation"
          className="flex items-center justify-center select-none"
          style={{
            width: BTN,
            height: BTN,
            borderRadius: 9999,
            backgroundColor: 'rgba(200,152,26,0.88)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            border: '2px solid rgba(255,255,255,0.16)',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'none',
          }}
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
      </div>
    </div>
  );
}

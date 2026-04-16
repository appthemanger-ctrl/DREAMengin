'use client';

// ONE Gold Particle. Always has been. Always will be.
//   • Single tap → open both menus (Dreams on left, System on right)
//   • Double tap → go home

import React, { useRef } from 'react';

type Props = {
  onOpenBothMenus: () => void;
  onGoHome: () => void;
};

const DOUBLE_TAP_MS = 280;

export default function HomeControls({ onOpenBothMenus, onGoHome }: Props) {
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const now = performance.now();
    const last = lastTapRef.current;
    lastTapRef.current = now;

    // Double tap → go home
    if (now - last < DOUBLE_TAP_MS) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      onGoHome();
      return;
    }

    // Single tap → open both menus
    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      onOpenBothMenus();
    }, DOUBLE_TAP_MS + 10);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center">
      <div className="pointer-events-auto">
        <button
          type="button"
          aria-label="Dream Navigation"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 select-none"
          style={{
            backgroundColor: 'rgba(200,152,26,0.88)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'none',
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
          }}
          onPointerUp={handlePointerUp}
          onPointerCancel={(e) => e.preventDefault()}
        >
          <span style={{ fontSize: 22, lineHeight: 1, userSelect: 'none' }}>✦</span>
        </button>
      </div>
    </div>
  );
}

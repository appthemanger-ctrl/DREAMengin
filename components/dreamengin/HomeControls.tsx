// components/dreamengin/HomeControls.tsx
// v2.0.0 behavior (per spec + Feb17 update):
// - Controls are FIXED (no drag) for now.
// - Single tap (either): Return Home
// - Double tap Blue: Dreams (Outdream) menu
// - Double tap Red:  System (Nexus) menu
//
// Notes:
// - We intentionally removed hold/drag depth navigation to avoid iOS Safari conflicts (pull-to-refresh / back swipe).
// - Keep these controls lightweight: no per-frame React state during gestures.

'use client';

import React, { useMemo, useRef } from 'react';

interface HomeControlsProps {
  onDoubleTapBlue: () => void;
  onDoubleTapRed: () => void;
  onGoHome: () => void;
}

type ControlId = 'blue' | 'red';

const BTN = 52;           // smaller bubble
const GAP = 10;
const DOUBLE_TAP_MS = 260;

function InfinityHalf({ side }: { side: 'left' | 'right' }) {
  const flip = side === 'right';
  return (
    <svg width="28" height="12" viewBox="0 0 80 36" className="opacity-95">
      <g transform={flip ? 'translate(80,0) scale(-1,1)' : undefined}>
        <path
          d="M10 18c8-10 18-10 28 0s20 10 28 0"
          fill="none"
          stroke="rgba(255,255,255,0.92)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M10 18c8 10 18 10 28 0s20-10 28 0"
          fill="none"
          stroke="rgba(255,255,255,0.92)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export default function HomeControls({
  onDoubleTapBlue,
  onDoubleTapRed,
  onGoHome,
}: HomeControlsProps) {
  const lastTapRef = useRef<Record<ControlId, number>>({ blue: 0, red: 0 });
  const singleTapTimerRef = useRef<Record<ControlId, any>>({ blue: null, red: null });

  const commonBtnStyle = useMemo(
    () => ({
      width: BTN,
      height: BTN,
      borderRadius: 9999,
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      border: '2px solid rgba(255,255,255,0.16)',
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'none' as const, // avoid iOS gesture conflicts on the controls themselves
    }),
    []
  );

  const handleTap = (id: ControlId) => {
    const now = performance.now();
    const last = lastTapRef.current[id];
    lastTapRef.current[id] = now;

    // If second tap occurs fast enough, treat as double tap.
    if (now - last <= DOUBLE_TAP_MS) {
      // Cancel pending single-tap action
      if (singleTapTimerRef.current[id]) {
        clearTimeout(singleTapTimerRef.current[id]);
        singleTapTimerRef.current[id] = null;
      }
      if (id === 'blue') onDoubleTapBlue();
      else onDoubleTapRed();
      return;
    }

    // Otherwise schedule single tap (home) after the double-tap window.
    if (singleTapTimerRef.current[id]) clearTimeout(singleTapTimerRef.current[id]);
    singleTapTimerRef.current[id] = setTimeout(() => {
      singleTapTimerRef.current[id] = null;
      onGoHome();
    }, DOUBLE_TAP_MS + 10);
  };

  const Control = ({ id, color }: { id: ControlId; color: string }) => (
    <button
      type="button"
      aria-label={id === 'blue' ? 'Dreams' : 'System'}
      className="flex items-center justify-center select-none"
      style={{ ...commonBtnStyle, backgroundColor: color }}
      onPointerDown={(e) => {
        // prevent iOS Safari edge gestures from starting on the controls
        e.preventDefault();
        (e.currentTarget as HTMLButtonElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        handleTap(id);
      }}
      onPointerCancel={(e) => {
        e.preventDefault();
      }}
    >
      <InfinityHalf side={id === 'blue' ? 'left' : 'right'} />
    </button>
  );

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
          gap: GAP,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
        }}
      >
        <Control id="blue" color="rgba(59,130,246,0.92)" />
        <Control id="red" color="rgba(239,68,68,0.92)" />
      </div>
    </div>
  );
}

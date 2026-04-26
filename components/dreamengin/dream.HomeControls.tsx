// components/dreamengin/dream.HomeControls.tsx
// ONE gold button. Always has been. Always will be.
//   • Single tap → go home
//   • Double tap → open dual menus (the only sanctioned double-tap in the system)

'use client';

import React, { useEffect, useRef } from 'react';
import InfinityIcon from '@/components/ui/dream.InfinityIcon';

interface HomeControlsProps {
  onBothMenus: () => void;
  onHome: () => void;
}

const BTN = 48;
const DOUBLE_TAP_MS = 260;

export default function HomeControls({ onBothMenus, onHome }: HomeControlsProps) {
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

    // Double tap → open dual menus (the only sanctioned double-tap)
    if (last > 0 && now - last <= DOUBLE_TAP_MS) {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      onBothMenus();
      return;
    }

    // Single tap → go home, delayed so double-tap can own menu opening
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapTimerRef.current = null;
      onHome();
    }, DOUBLE_TAP_MS);
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
          <InfinityIcon size={18} variant="flat" colorScheme="dark" />
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useRef } from 'react';

type Props = {
  onReturnHome: () => void;
  onOpenMenu: (anchor: DOMRect) => void;
};

const DOUBLE_TAP_MS = 280;

export default function HomeControls({ onReturnHome, onOpenMenu }: Props) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const lastTapRef = useRef<number>(0);

  const handleTap = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const now = performance.now();
    const isDouble = now - lastTapRef.current < DOUBLE_TAP_MS;
    lastTapRef.current = now;

    if (isDouble) {
      const anchor = btnRef.current?.getBoundingClientRect();
      if (!anchor) return;
      onOpenMenu(anchor);
      return;
    }

    onReturnHome();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center">
      <div className="pointer-events-auto flex items-center rounded-full border border-white/15 bg-slate-950/45 px-3 py-2 backdrop-blur">
        <button
          ref={btnRef}
          type="button"
          aria-label="Go Home · Double-tap for Dreams menu"
          className="h-11 w-11 rounded-full border border-white/20 bg-blue-500/90 text-[10px] font-semibold tracking-[0.22em] text-white"
          onPointerUp={handleTap}
        >
          ∞
        </button>
      </div>
    </div>
  );
}

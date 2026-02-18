'use client';

import React, { useRef } from 'react';

type Props = {
  onReturnHome: () => void;
  onOpenDreamMenu: (anchor: DOMRect) => void;
  onOpenSystemMenu: (anchor: DOMRect) => void;
};

const DOUBLE_TAP_MS = 280;

export default function HomeControls({ onReturnHome, onOpenDreamMenu, onOpenSystemMenu }: Props) {
  const blueRef = useRef<HTMLButtonElement | null>(null);
  const redRef = useRef<HTMLButtonElement | null>(null);
  const lastTapRef = useRef<{ id: 'blue' | 'red' | null; ts: number }>({ id: null, ts: 0 });

  const handleTap = (id: 'blue' | 'red') => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const now = performance.now();
    const previous = lastTapRef.current;
    const isDouble = previous.id === id && now - previous.ts < DOUBLE_TAP_MS;
    lastTapRef.current = { id, ts: now };

    if (isDouble) {
      const anchor = (id === 'blue' ? blueRef.current : redRef.current)?.getBoundingClientRect();
      if (!anchor) return;
      if (id === 'blue') onOpenDreamMenu(anchor);
      else onOpenSystemMenu(anchor);
      return;
    }

    onReturnHome();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-slate-950/45 px-3 py-2 backdrop-blur">
        <button
          ref={blueRef}
          type="button"
          aria-label="Return home or open dreams"
          className="h-11 w-11 rounded-full border border-white/20 bg-blue-500/90 text-[10px] font-semibold tracking-[0.22em] text-white"
          onPointerUp={handleTap('blue')}
        >
          BLUE
        </button>
        <button
          ref={redRef}
          type="button"
          aria-label="Return home or open system"
          className="h-11 w-11 rounded-full border border-white/20 bg-red-500/90 text-[10px] font-semibold tracking-[0.22em] text-white"
          onPointerUp={handleTap('red')}
        >
          RED
        </button>
      </div>
    </div>
  );
}

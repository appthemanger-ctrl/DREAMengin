'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  /** Single tap  → go home */
  onHome: () => void;
  /** Double tap  → open System + Daydreams menus */
  onBothMenus: () => void;
};

const DOUBLE_TAP_MS = 280;
const BTN_SIZE      = 64;

/**
 * DreamNavControls — the DREAMengin golden sphere button.
 *
 * Fixed at the bottom-center of the screen.
 * Single tap  → Go Home
 * Double tap  → Open dual bottom menu (System + Daydreams)
 *
 * Visual: 3-D metallic gold sphere with radial highlight,
 * matching the design mockups.
 */
export default function DreamNavControls({ onHome, onBothMenus }: Props) {
  const [mounted, setMounted]   = useState(false);
  const [pressed, setPressed]   = useState(false);
  const tapRef = useRef<{ at: number; timer: ReturnType<typeof setTimeout> | null }>({
    at: 0,
    timer: null,
  });

  useEffect(() => { setMounted(true); }, []);

  const handleTap = () => {
    const now = performance.now();
    const isDouble = now - tapRef.current.at < DOUBLE_TAP_MS;
    tapRef.current.at = now;
    if (tapRef.current.timer) { clearTimeout(tapRef.current.timer); tapRef.current.timer = null; }

    if (isDouble) {
      onBothMenus();
      return;
    }
    tapRef.current.timer = setTimeout(() => {
      tapRef.current.timer = null;
      onHome();
    }, DOUBLE_TAP_MS + 10);
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        aria-label="Tap to go home · Double-tap to open menus"
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => { setPressed(false); handleTap(); }}
        onPointerCancel={() => setPressed(false)}
        style={{
          width: BTN_SIZE,
          height: BTN_SIZE,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',

          /* ── 3-D metallic gold sphere ── */
          background: `
            radial-gradient(
              circle at 36% 32%,
              #fffde0 0%,
              #f7e07a 12%,
              #d4a843 38%,
              #a16207 68%,
              #6b3c03 100%
            )
          `,
          boxShadow: `
            inset 0 2px 4px rgba(255, 255, 220, 0.85),
            inset -3px -3px 10px rgba(80, 40, 0, 0.40),
            0 6px 24px rgba(100, 58, 4, 0.55),
            0 2px 8px rgba(212, 168, 67, 0.50),
            0 0 0 1.5px rgba(180, 120, 20, 0.45)
          `,
          transform: pressed ? 'translateX(-50%) scale(0.92)' : 'translateX(0) scale(1)',
          transition: 'transform 0.1s ease, box-shadow 0.1s ease',
        }}
      >
        {/* Highlight sheen — small bright ellipse top-left */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '14%',
            left: '18%',
            width: '36%',
            height: '22%',
            borderRadius: '50%',
            background: 'rgba(255,255,245,0.55)',
            filter: 'blur(3px)',
            pointerEvents: 'none',
          }}
        />
        {/* Inner symbol */}
        <svg
          width="28"
          height="14"
          viewBox="0 0 80 36"
          style={{ opacity: 0.82, flexShrink: 0, position: 'relative' }}
          aria-hidden="true"
        >
          <path d="M10 18c8-10 18-10 28 0s20 10 28 0" fill="none" stroke="#fffde0" strokeWidth="6" strokeLinecap="round" />
          <path d="M10 18c8 10 18 10 28 0s20-10 28 0" fill="none" stroke="#fffde0" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

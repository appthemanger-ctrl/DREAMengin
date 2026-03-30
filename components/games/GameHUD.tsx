'use client';

/**
 * GameHUD — Floating translucent controller overlay for ImmersiveGameShell.
 *
 * Sits fixed at the bottom of the screen (z-index 50), overlaid on top of the
 * game viewport.  Two states:
 *   Collapsed — 44 px strip: game name · expand button · EXIT
 *   Expanded  — slides up to reveal the full embedded GameRemote
 *
 * EXIT always navigates to /daydream/games via Next.js router.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import GameRemote from '@/components/games/GameRemote';

interface GameHUDProps {
  gameLabel: string;
  gameEmoji: string;
  playHref?: string;
}

export default function GameHUD({ gameLabel, gameEmoji, playHref }: GameHUDProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const handleExit = useCallback(() => {
    router.push('/daydream/games');
  }, [router]);

  const handlePlay = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('de-game-start'));
    }
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(4, 8, 18, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(125, 211, 252, 0.15)',
        overflow: 'hidden',
        /* height is driven by maxHeight so the transition is smooth */
        maxHeight: expanded ? 560 : 44,
        transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* ── Collapsed strip ── always visible at the top of the HUD ── */}
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Left: emoji + game name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            minWidth: 0,
            flex: 1,
          }}
        >
          <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>{gameEmoji}</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#f8fbff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {gameLabel}
          </span>
        </div>

        {/* Center: expand / collapse button */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-label={expanded ? 'Close remote' : 'Open remote'}
          style={{
            fontSize: 16,
            lineHeight: 1,
            color: expanded ? '#7dd3fc' : 'rgba(220,235,255,0.5)',
            padding: '4px 9px',
            borderRadius: 8,
            background: expanded
              ? 'rgba(125,211,252,0.1)'
              : 'rgba(255,255,255,0.05)',
            border: expanded
              ? '1px solid rgba(125,211,252,0.28)'
              : '1px solid rgba(160,195,240,0.12)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'color 0.15s, background 0.15s, border-color 0.15s',
          }}
        >
          {expanded ? '⊟' : '⊞'}
        </button>

        {/* Right: EXIT button */}
        <button
          type="button"
          onClick={handleExit}
          style={{
            padding: '6px 13px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.42)',
            color: '#ef4444',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.07em',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ✕ EXIT
        </button>
      </div>

      {/* ── Expanded panel — always mounted so transition is smooth ── */}
      <div
        style={{
          /* pointer-events off when visually hidden to avoid ghost interactions */
          pointerEvents: expanded ? 'auto' : 'none',
          opacity: expanded ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        {/* Close-remote button at the top of the expanded area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 18px 0',
          }}
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'rgba(125,211,252,0.6)',
              textTransform: 'uppercase',
              padding: '5px 14px',
              borderRadius: 999,
              background: 'rgba(125,211,252,0.06)',
              border: '1px solid rgba(125,211,252,0.14)',
              cursor: 'pointer',
            }}
          >
            ⊟ Close Remote
          </button>
        </div>

        {/* Embedded GameRemote */}
        <GameRemote
          embedded
          gameLabel={gameLabel}
          playHref={playHref}
          onPlay={handlePlay}
          onExit={handleExit}
        />
      </div>
    </div>
  );
}

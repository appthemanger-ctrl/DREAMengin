'use client';

/**
 * ImmersiveGameShell — True full-screen game launcher with PS5-style boot
 * sequence and a floating HUD controller overlay.
 *
 * DREAMENGIN Elite Game Engine — GameEngin boot sequence:
 *
 * Boot phases:
 *   1 (0 – 800 ms)     Black screen · pulsing ⬡ hex logo in game accent colour
 *   2 (800 – 2200 ms)  "GAMEENGIN" sweeps in from the right · "by DREAMengin" · game emoji
 *   3 (2200 – 3400 ms) Game title card · category badge · "Press any button to start"
 *   4 (3400 ms+)       Waiting for user input → fade out → game revealed
 *
 * Skip button is available from phase 1.
 * After boot dismissal: game fills 100 vw × 100 dvh, GameHUD floats at bottom.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GameHUD from '@/components/games/GameHUD';
import { GAMES } from '@/components/games/GamesHub';
import {
  buildGameLaunchHref,
  DEFAULT_GAME_ID,
  resolveGameLaunchId,
} from '@/lib/games/navigation';

// ── Boot-sequence keyframe CSS (injected once into the document) ─────────────
const BOOT_KEYFRAMES = `
@keyframes de-hex-pulse {
  0%, 100% { opacity: 0.45; transform: scale(1); }
  50%       { opacity: 1;    transform: scale(1.07); }
}
@keyframes de-glow-ring-a {
  0%, 100% { opacity: 0.18; transform: scale(1); }
  50%       { opacity: 0.65; transform: scale(1.18); }
}
@keyframes de-glow-ring-b {
  0%, 100% { opacity: 0.10; transform: scale(1); }
  50%       { opacity: 0.40; transform: scale(1.12); }
}
@keyframes de-sweep-in {
  from { opacity: 0; transform: translateX(56px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes de-sweep-in-sub {
  from { opacity: 0; transform: translateX(38px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes de-emoji-pop {
  0%  { opacity: 0; transform: scale(0.4); }
  70% { transform: scale(1.12); }
  100%{ opacity: 1; transform: scale(1); }
}
@keyframes de-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes de-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
@keyframes de-boot-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; pointer-events: none; }
}
`;

export default function ImmersiveGameShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);

  // ── Resolve game ──────────────────────────────────────────────────────────
  const gameId = resolveGameLaunchId(
    searchParams.get('game'),
    GAMES.map((g) => g.id),
    DEFAULT_GAME_ID,
  );
  const game = useMemo(
    () => GAMES.find((entry) => entry.id === gameId) ?? GAMES[0],
    [gameId],
  );

  // ── Boot sequence state ───────────────────────────────────────────────────
  // phase 1–4 mirrors the spec; 0 = not yet started
  const [bootPhase, setBootPhase] = useState<1 | 2 | 3 | 4>(1);
  const [fadingOut, setFadingOut] = useState(false);
  const [bootDone, setBootDone] = useState(false);

  // ── Suppress layout chrome ────────────────────────────────────────────────
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const footer = document.querySelector('footer') as HTMLElement | null;
    const prevFooterDisplay = footer?.style.display;
    if (footer) footer.style.display = 'none';

    return () => {
      document.body.style.overflow = prevOverflow;
      if (footer) footer.style.display = prevFooterDisplay ?? '';
    };
  }, []);

  // ── Inject boot keyframes once ────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'de-boot-keyframes';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = BOOT_KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  // ── Persist last-played ───────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('de:games:last-launch', game.id);
    }
  }, [game.id]);

  // ── Phase progression timers ──────────────────────────────────────────────
  useEffect(() => {
    // Reset on every game change
    setBootPhase(1);
    setFadingOut(false);
    setBootDone(false);

    const t1 = window.setTimeout(() => setBootPhase(2), 800);
    const t2 = window.setTimeout(() => setBootPhase(3), 2200);
    const t3 = window.setTimeout(() => setBootPhase(4), 3400);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [game.id]);

  // ── Dismiss helpers ───────────────────────────────────────────────────────
  const dismissBoot = useCallback(async () => {
    if (fadingOut || bootDone) return;
    setFadingOut(true);

    // Attempt native fullscreen (best-effort; requires user gesture)
    try {
      const target = rootRef.current ?? document.documentElement;
      if (!document.fullscreenElement && 'requestFullscreen' in target) {
        await target.requestFullscreen();
      }
    } catch {
      /* fullscreen denied — continue anyway */
    }

    window.setTimeout(() => setBootDone(true), 500);
  }, [fadingOut, bootDone]);

  const handleExit = useCallback(() => {
    router.push('/daydream/games');
  }, [router]);

  // Skip is allowed immediately; "press any key" listens from phase 4
  useEffect(() => {
    if (bootPhase < 4 || bootDone || fadingOut) return undefined;
    const handler = () => { dismissBoot(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [bootPhase, bootDone, fadingOut, dismissBoot]);

  // ── Render ────────────────────────────────────────────────────────────────
  const ActiveGameComponent = game.component ?? (() => null);
  const accent = game.color;

  return (
    <div
      ref={rootRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* ── Game viewport — always mounted so assets begin loading immediately ── */}
      <div className="de-immersive-game-stage" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 'var(--de-hud-bottom, 175px)' }}>
        {game.component ? (
          <ActiveGameComponent />
        ) : (
          /* Fallback placeholder for link-only games */
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(180deg, #040816 0%, #07101e 100%)',
              color: 'rgba(226,232,240,0.82)',
              padding: 24,
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
              <div style={{ fontSize: 40 }}>{game.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f8fbff' }}>{game.label}</div>
              <div style={{ fontSize: 14, lineHeight: 1.7 }}>{game.desc}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── PS5-style boot overlay ── hidden once bootDone ── */}
      {!bootDone && (
        <div
          role="presentation"
          onClick={bootPhase >= 3 ? dismissBoot : undefined}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: bootPhase >= 4 ? 'pointer' : 'default',
            animation: fadingOut
              ? 'de-boot-fade-out 0.5s ease forwards'
              : undefined,
          }}
        >
          {/* ── Phase 1: pulsing hex logo ── */}
          {bootPhase === 1 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                animation: 'de-fade-in 0.4s ease forwards',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 130,
                  height: 130,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Outer glow ring */}
                <div
                  style={{
                    position: 'absolute',
                    inset: -20,
                    borderRadius: '50%',
                    border: `2px solid ${accent}`,
                    animation: 'de-glow-ring-a 1.6s ease-in-out infinite',
                  }}
                />
                {/* Inner glow ring */}
                <div
                  style={{
                    position: 'absolute',
                    inset: -10,
                    borderRadius: '50%',
                    border: `1px solid ${accent}`,
                    animation: 'de-glow-ring-b 1.6s ease-in-out infinite 0.4s',
                  }}
                />
                {/* Hex symbol */}
                <div
                  style={{
                    fontSize: 76,
                    lineHeight: 1,
                    color: accent,
                    textShadow: `0 0 48px ${accent}, 0 0 80px ${accent}44`,
                    animation: 'de-hex-pulse 1.6s ease-in-out infinite',
                  }}
                >
                  ⬡
                </div>
              </div>
            </div>
          )}

          {/* ── Phase 2: GAMEENGIN text + game emoji ── */}
          {bootPhase === 2 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 56,
                  lineHeight: 1,
                  animation: 'de-emoji-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
                }}
              >
                {game.emoji}
              </div>
              <div
                style={{
                  fontSize: 'clamp(36px, 7vw, 58px)',
                  fontWeight: 900,
                  letterSpacing: '0.10em',
                  color: '#f8fbff',
                  textTransform: 'uppercase',
                  animation: 'de-sweep-in 0.5s cubic-bezier(0.2,0,0,1) 0.05s both',
                }}
              >
                GAMEENGIN
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.26em',
                  color: 'rgba(220,235,255,0.50)',
                  textTransform: 'uppercase',
                  animation: 'de-sweep-in-sub 0.5s cubic-bezier(0.2,0,0,1) 0.22s both',
                }}
              >
                by DREAMengin
              </div>
            </div>
          )}

          {/* ── Phase 3 + 4: game title card ── */}
          {(bootPhase === 3 || bootPhase === 4) && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 18,
                textAlign: 'center',
                padding: '0 28px',
                animation: 'de-fade-in 0.4s ease forwards',
              }}
            >
              <div style={{ fontSize: 52, lineHeight: 1 }}>{game.emoji}</div>
              <div
                style={{
                  fontSize: 'clamp(26px, 5.5vw, 52px)',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  color: '#f8fbff',
                  lineHeight: 1.1,
                }}
              >
                {game.label}
              </div>
              {/* Category badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 16px',
                  borderRadius: 999,
                  background: `${accent}1f`,
                  border: `1px solid ${accent}55`,
                  color: accent,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.20em',
                  textTransform: 'uppercase',
                }}
              >
                {game.category}
              </div>
              {/* "Press any button" — only in phase 4 */}
              {bootPhase === 4 && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(220,235,255,0.52)',
                    animation: 'de-blink 1.3s ease-in-out infinite',
                  }}
                >
                  Press any button to start
                </div>
              )}
            </div>
          )}

          {/* ── Skip button — always visible ── */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); dismissBoot(); }}
            style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(220,235,255,0.32)',
              padding: '6px 13px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}
          >
            Skip →
          </button>
        </div>
      )}

      {/* ── Universal in-game HUD — mounted only after boot is done ── */}
      {bootDone && (
        <GameHUD
          gameLabel={game.label}
          gameEmoji={game.emoji}
          playHref={buildGameLaunchHref(game.id, { play: true })}
          mode={game.mobileHudMode ?? 'buttons'}
          onExit={handleExit}
        />
      )}
    </div>
  );
}

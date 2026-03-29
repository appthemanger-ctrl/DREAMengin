'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Power } from 'lucide-react';
import GameRemote from '@/components/games/GameRemote';
import { GAMES } from '@/components/games/GamesHub';
import { buildGameLaunchHref, DEFAULT_GAME_ID, isLaunchFlagEnabled, resolveGameLaunchId } from '@/lib/games/navigation';
import { useSearchParams } from 'next/navigation';

const BOOT_MESSAGES = [
  'Booting DREAMENGIN GameOS',
  'Loading render pipeline',
  'Docking remote surface',
  'Mounting game session',
] as const;

export default function ImmersiveGameShell() {
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);
  const [bootStep, setBootStep] = useState(0);
  const [ready, setReady] = useState(false);

  const gameId = resolveGameLaunchId(searchParams.get('game'), GAMES.map((game) => game.id), DEFAULT_GAME_ID);
  const wantsFullscreen = isLaunchFlagEnabled(searchParams.get('expand'));
  const [overlayDismissed, setOverlayDismissed] = useState(!wantsFullscreen);

  const game = useMemo(
    () => GAMES.find((entry) => entry.id === gameId) ?? GAMES[0],
    [gameId],
  );

  useEffect(() => {
    setOverlayDismissed(!wantsFullscreen);
  }, [wantsFullscreen, gameId]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const footer = document.querySelector('footer') as HTMLElement | null;
    const prevFooterDisplay = footer?.style.display;
    if (footer) footer.style.display = 'none';

    return () => {
      document.body.style.overflow = prev;
      if (footer) footer.style.display = prevFooterDisplay ?? '';
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('de:games:last-launch', game.id);
  }, [game.id]);

  useEffect(() => {
    if (!wantsFullscreen) return undefined;

    setBootStep(0);
    setReady(false);
    const timers = BOOT_MESSAGES.map((_, index) => (
      window.setTimeout(() => setBootStep(index), index * 450)
    ));
    const readyTimer = window.setTimeout(() => setReady(true), 1700);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(readyTimer);
    };
  }, [game.id, wantsFullscreen]);

  const progress = useMemo(
    () => ((bootStep + 1) / BOOT_MESSAGES.length) * 100,
    [bootStep],
  );

  async function handleEnterExperience() {
    const target = rootRef.current ?? document.documentElement;

    try {
      if (document.fullscreenElement === null && 'requestFullscreen' in target) {
        await target.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen denial and continue into the experience.
    }

    setOverlayDismissed(true);
  }

  const handleRemotePlay = () => {
    window.dispatchEvent(new CustomEvent('de-game-start'));
  };

  const ActiveGameComponent = game.component;

  return (
    <div
      ref={rootRef}
      style={{
        minHeight: '100dvh',
        height: '100dvh',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #040816 0%, #050c18 38%, #07101e 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {wantsFullscreen && !overlayDismissed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'radial-gradient(circle at top, rgba(42,138,184,0.2), rgba(4,8,18,0.98) 48%), linear-gradient(180deg, #040816, #02040b)',
          }}
        >
          <div
            style={{
              width: 'min(100%, 460px)',
              borderRadius: 28,
              padding: '28px 24px',
              background: 'linear-gradient(180deg, rgba(8,18,38,0.96), rgba(4,10,22,0.96))',
              border: '1px solid rgba(125,211,252,0.18)',
              boxShadow: '0 28px 80px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ background: 'rgba(125,211,252,0.08)', color: '#7dd3fc', border: '1px solid rgba(125,211,252,0.18)' }}>
              <Power className="w-3.5 h-3.5" />
              DREAMENGIN boot sequence
            </div>

            <div style={{ marginTop: 18, fontSize: 34, fontWeight: 900, lineHeight: 0.98, color: '#f8fbff', letterSpacing: '-0.04em' }}>
              {game.label}
            </div>
            <div style={{ marginTop: 4, fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7dd3fc' }}>
              Powered by DREAMengin
            </div>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: 'rgba(226,232,240,0.76)' }}>
              Launching a dedicated game surface so the screen behaves like a console session: game first, remote docked, no scrolling shell around it.
            </div>

            <div style={{ marginTop: 22, display: 'grid', gap: 10 }}>
              {BOOT_MESSAGES.map((message, index) => {
                const active = index <= bootStep;
                return (
                  <div
                    key={message}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 14,
                      background: active ? 'rgba(125,211,252,0.08)' : 'rgba(255,255,255,0.03)',
                      border: active ? '1px solid rgba(125,211,252,0.18)' : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#f8fbff' : 'rgba(226,232,240,0.46)' }}>{message}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: active ? '#7dd3fc' : 'rgba(226,232,240,0.34)' }}>
                      {active ? 'Ready' : 'Wait'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 18, borderRadius: 999, height: 8, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #2a8ab8, #7dd3fc, #c8981a)', transition: 'width 0.35s ease' }} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center" style={{ marginTop: 22 }}>
              <button
                type="button"
                onClick={handleEnterExperience}
                disabled={!ready}
                className="de-btn de-btn-primary"
                style={{
                  minWidth: 210,
                  justifyContent: 'center',
                  opacity: ready ? 1 : 0.6,
                  cursor: ready ? 'pointer' : 'wait',
                }}
              >
                <Maximize2 className="w-4 h-4" />
                {ready ? 'Enter full experience' : 'Preparing...'}
              </button>
              <div style={{ fontSize: 11, lineHeight: 1.6, color: 'rgba(226,232,240,0.58)' }}>
                Fullscreen will be requested when your browser allows it.
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderBottom: '1px solid rgba(125,211,252,0.12)',
          background: 'rgba(7,14,28,0.94)',
          flexShrink: 0,
        }}
      >
        <Link
          href={buildGameLaunchHref(game.id, { openEngin: true })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 108,
            padding: '10px 14px',
            borderRadius: 12,
            textDecoration: 'none',
            background: 'rgba(220,232,248,0.08)',
            border: '1px solid rgba(160,195,240,0.18)',
            color: 'rgba(220,235,255,0.88)',
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          ← Games
        </Link>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc' }}>
            Dedicated Game Session
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fbff', marginTop: 2 }}>
            {game.label}
          </div>
        </div>

        <button
          type="button"
          onClick={handleEnterExperience}
          className="de-btn de-btn-ghost text-xs"
          style={{ borderColor: 'rgba(125,211,252,0.22)', color: '#7dd3fc' }}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Fullscreen
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, minHeight: 0, padding: '12px 12px 0', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 24, overflow: 'hidden', background: 'rgba(5, 12, 24, 0.92)', border: '1px solid rgba(125,211,252,0.16)', boxShadow: '0 24px 80px rgba(0,0,0,0.34)' }}>
            {ActiveGameComponent ? (
              <ActiveGameComponent />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'grid',
                  placeItems: 'center',
                  padding: 24,
                  textAlign: 'center',
                  color: 'rgba(226,232,240,0.82)',
                }}
              >
                <div style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
                  <div style={{ fontSize: 28 }}>{game.emoji}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fbff' }}>{game.label}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7 }}>{game.desc}</div>
                  {game.href && (
                    <Link
                      href={game.href}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 44,
                        padding: '10px 16px',
                        borderRadius: 12,
                        background: 'rgba(125,211,252,0.12)',
                        border: '1px solid rgba(125,211,252,0.24)',
                        color: '#7dd3fc',
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      Open game page
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '10px 12px 12px', borderTop: '1px solid rgba(160,195,240,0.08)', background: 'rgba(2,8,18,0.96)', flexShrink: 0 }}>
          <GameRemote
            embedded
            gameLabel={game.label}
            playHref={buildGameLaunchHref(game.id, { play: true })}
            onPlay={handleRemotePlay}
          />
        </div>
      </div>
    </div>
  );
}

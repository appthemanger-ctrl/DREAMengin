'use client';

/**
 * ImmersiveGameShell — True full-screen game launcher with PS5-style boot
 * sequence and a floating HUD controller overlay.
 *
 * All games run through the GameEngin cartridge system via GameRuntime.
 * No game component is ever mounted directly here.
 *
 * HUD layer contract (three clean layers, no overlap):
 *   SHELL:  Boot sequence overlay + GameHUD mobile controls (this file)
 *   ENGINE: FPS counter (GameRuntime — top-right, pointer-events: none)
 *   GAME:   Score / lives / level (inside each cartridge's container)
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
import GameHUD from '@/components/games/dream.hud.GameHUD';
import GameRuntime from '@/lib/gameengin/GameRuntime';
import { loadCartridge } from '@/lib/gameengin/cartridges/loaders';
import { CARTRIDGE_MANIFEST } from '@/lib/gameengin/cartridges/manifest';
import type { GameCartridge, GravityPreset } from '@/lib/gameengin/cartridge';
import type { MobileHudMode } from '@/lib/games/mobileControls';
import {
  buildGameLaunchHref,
  DEFAULT_GAME_ID,
  resolveGameLaunchId,
} from '@/lib/games/navigation';
import { useGamePerformanceBaseline } from '@/lib/games/hooks';

// ── Boot-sequence keyframe CSS ────────────────────────────────────────────────

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

// ── Mobile HUD mode per cartridge ─────────────────────────────────────────────
// Overrides the default 'controller' mode for specific games.

const HUD_MODES: Record<string, MobileHudMode> = {
  'platformer':             'controller',
  'neon-drift':             'controller',
  'echo-arena':             'controller',
  'null-cathedral':         'buttons',
  'voidline-gp':            'controller',
  'serpent-siege':          'joystick',
  'avenue-of-mirrors':      'joystick',
  'engin-fracture':         'controller',
  'glassfall':              'buttons',
  'nite-flyer-solar-hymn':  'buttons',
  'lexicon-solitaire':      'buttons',
  'defuse-ritual':          'buttons',
};

// ── Layout constants ──────────────────────────────────────────────────────────

const DEFAULT_HUD_BOTTOM             = '175px';
const MIN_STAGE_BOTTOM_CLEARANCE     = 'clamp(80px, 22dvh, 38dvh)';
const LANDSCAPE_MIN_STAGE_BOTTOM     = 'clamp(56px, 14dvh, 24dvh)';
const BASELINE_OVERLAY_OFFSET_PX     = 14;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImmersiveGameShell( {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rootRef      = useRef<HTMLDivElement>(null);

  // ── Resolve game from manifest ───────────────────────────────────────────
  const gameId = resolveGameLaunchId(
    searchParams.get('game'),
    CARTRIDGE_MANIFEST.map((c: Record<string, unknown>) => c.id),
    DEFAULT_GAME_ID,
  );
  const game = useMemo(
    () => CARTRIDGE_MANIFEST.find((c: Record<string, unknown>) => c.id === gameId) ?? CARTRIDGE_MANIFEST[0],
    [gameId],
  );

  const performanceBaseline = useGamePerformanceBaseline({
    active: true,
    gameId: game.id,
    renderMode: game.renderMode,
  });

  // ── Cartridge loading ────────────────────────────────────────────────────
  const [cartridge, setCartridge] = useState<GameCartridge | null>(null);
  const [cartridgeError, setCartridgeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCartridge(null);
    setCartridgeError(null);
    loadCartridge(gameId)
      .then(c: Record<string, unknown> => { if (!cancelled) setCartridge(c); })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCartridgeError(err instanceof Error ? err.message : 'Failed to load cartridge.');
        }
      });
    return () => { cancelled = true; };
  }, [gameId]);

  // ── Boot sequence state ──────────────────────────────────────────────────
  const [bootPhase, setBootPhase] = useState<1 | 2 | 3 | 4>(1);
  const [fadingOut, setFadingOut] = useState(false);
  const [bootDone,  setBootDone]  = useState(false);

  // ── Landscape detection ──────────────────────────────────────────────────
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight,
  );
  useEffect(() => {
    const mql = window.matchMedia('(orientation: landscape)');
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches);
    mql.addEventListener('change', handler);
    setIsLandscape(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // ── Suppress layout chrome ───────────────────────────────────────────────
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

  // ── Inject boot keyframes once ───────────────────────────────────────────
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

  // ── Persist last-played ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('de:games:last-launch', game.id);
    }
  }, [game.id]);

  // ── Phase progression timers ─────────────────────────────────────────────
  useEffect(() => {
    setBootPhase(1);
    setFadingOut(false);
    setBootDone(false);
    const t1 = window.setTimeout(() => setBootPhase(2), 800);
    const t2 = window.setTimeout(() => setBootPhase(3), 2200);
    const t3 = window.setTimeout(() => setBootPhase(4), 3400);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3); };
  }, [game.id]);

  // ── Dismiss helpers ──────────────────────────────────────────────────────
  const dismissBoot = useCallback(async () => {
    if (fadingOut || bootDone) return;
    setFadingOut(true);
    try {
      const target = rootRef.current ?? document.documentElement;
      if (!document.fullscreenElement && 'requestFullscreen' in target) {
        await target.requestFullscreen();
      }
    } catch { /* fullscreen denied — continue */ }
    window.setTimeout(() => setBootDone(true), 500);
  }, [fadingOut, bootDone]);

  const handleExit = useCallback(() => {
    router.push('/daydream/games');
  }, [router]);

  // "Press any key" from phase 4
  useEffect(() => {
    if (bootPhase < 4 || bootDone || fadingOut) return undefined;
    const handler = () => { dismissBoot(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [bootPhase, bootDone, fadingOut, dismissBoot]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const accent      = game.color;
  const hudMode     = HUD_MODES[game.id] ?? 'controller';
  const stageBottom = isLandscape ? LANDSCAPE_MIN_STAGE_BOTTOM : MIN_STAGE_BOTTOM_CLEARANCE;
  const physicsConfig = useMemo<{ gravity: GravityPreset; friction: number }>(
    () => ({ gravity: 'earth', friction: 0.5 }),
    [],
  );

  return (
    <div
      ref={rootRef}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', overflow: 'hidden', background: '#000' }}
    >
      {/* ── SHELL layer 1: Game viewport (GameRuntime runs all cartridges) ── */}
      <div
        className="de-immersive-game-stage"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          bottom: `max(var(--de-hud-bottom, ${DEFAULT_HUD_BOTTOM}), ${stageBottom})`,
          background: '#000',
        }}
      >
        {cartridgeError ? (
          <div style={{
            height: '100%', display: 'grid', placeItems: 'center',
            background: 'linear-gradient(180deg, #1a0505 0%, #0a0202 100%)',
            color: '#fca5a5', padding: 24, textAlign: 'center',
          }}>
            <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
              <div style={{ fontSize: 28 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fbff' }}>Cartridge Error</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{cartridgeError}</div>
            </div>
          </div>
        ) : (
          // GameRuntime is the ONLY place games are mounted.
          // It provides the FPS counter (engine chrome) and all engine services.
          // The game renders its own HUD (score/lives) inside its container.
          <GameRuntime
            cartridge={cartridge}
            physicsConfig={physicsConfig}
          />
        )}
      </div>

      {/* ── SHELL layer 2: Performance baseline chip ── */}
      {performanceBaseline && (
        <div
          style={{
            position: 'absolute',
            left: BASELINE_OVERLAY_OFFSET_PX,
            bottom: `calc(max(var(--de-hud-bottom, ${DEFAULT_HUD_BOTTOM}), ${stageBottom}) + ${BASELINE_OVERLAY_OFFSET_PX}px)`,
            zIndex: 3,
            pointerEvents: 'none',
            background: 'rgba(2,6,23,0.78)',
            border: '1px solid rgba(148,163,184,0.28)',
            borderRadius: 999,
            padding: '6px 10px',
            fontSize: 11,
            fontFamily: 'monospace',
            letterSpacing: '0.04em',
            color: '#e2e8f0',
            backdropFilter: 'blur(10px)',
          }}
        >
          BASELINE [DONE] · {performanceBaseline.rendererBackend.toUpperCase()} · {performanceBaseline.sampleCount > 0
            ? `${performanceBaseline.avgFps} FPS · ${performanceBaseline.avgFrameMs.toFixed(1)}ms`
            : 'warming up'}
        </div>
      )}

      {/* ── SHELL layer 3: PS5-style boot overlay ── */}
      {!bootDone && (
        <div
          role="presentation"
          onPointerDown={bootPhase >= 3 ? dismissBoot : undefined}
          onClick={bootPhase >= 3 ? dismissBoot : undefined}
          style={{
            position: 'absolute', inset: 0, zIndex: 40, background: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: bootPhase >= 4 ? 'pointer' : 'default',
            animation: fadingOut ? 'de-boot-fade-out 0.5s ease forwards' : undefined,
          }}
        >
          {/* Phase 1: pulsing hex logo */}
          {bootPhase === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, animation: 'de-fade-in 0.4s ease forwards' }}>
              <div style={{ position: 'relative', width: 130, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: `2px solid ${accent}`, animation: 'de-glow-ring-a 1.6s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `1px solid ${accent}`, animation: 'de-glow-ring-b 1.6s ease-in-out infinite 0.4s' }} />
                <div style={{ fontSize: 76, lineHeight: 1, color: accent, textShadow: `0 0 48px ${accent}, 0 0 80px ${accent}44`, animation: 'de-hex-pulse 1.6s ease-in-out infinite' }}>⬡</div>
              </div>
            </div>
          )}

          {/* Phase 2: GAMEENGIN text + game emoji */}
          {bootPhase === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 56, lineHeight: 1, animation: 'de-emoji-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>{game.emoji}</div>
              <div style={{ fontSize: 'clamp(36px, 7vw, 58px)', fontWeight: 900, letterSpacing: '0.10em', color: '#f8fbff', textTransform: 'uppercase', animation: 'de-sweep-in 0.5s cubic-bezier(0.2,0,0,1) 0.05s both' }}>GAMEENGIN</div>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.26em', color: 'rgba(220,235,255,0.50)', textTransform: 'uppercase', animation: 'de-sweep-in-sub 0.5s cubic-bezier(0.2,0,0,1) 0.22s both' }}>by DREAMengin</div>
            </div>
          )}

          {/* Phase 3 + 4: game title card */}
          {(bootPhase === 3 || bootPhase === 4) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center', padding: '0 28px', animation: 'de-fade-in 0.4s ease forwards' }}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>{game.emoji}</div>
              <div style={{ fontSize: 'clamp(26px, 5.5vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#f8fbff', lineHeight: 1.1 }}>{game.label}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 16px', borderRadius: 999, background: `${accent}1f`, border: `1px solid ${accent}55`, color: accent, fontSize: 11, fontWeight: 800, letterSpacing: '0.20em', textTransform: 'uppercase' }}>
                {game.category}
              </div>
              {bootPhase === 4 && (
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(220,235,255,0.52)', animation: 'de-blink 1.3s ease-in-out infinite' }}>
                  Press any button to start
                </div>
              )}
            </div>
          )}

          {/* Skip button — always visible during boot */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); dismissBoot(); }}
            style={{
              position: 'absolute', bottom: 24, right: 24,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(220,235,255,0.32)', padding: '6px 13px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}
          >
            Skip →
          </button>
        </div>
      )}

      {/* Landscape black strip below game stage */}
      {isLandscape && (
        <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: LANDSCAPE_MIN_STAGE_BOTTOM, background: '#000', zIndex: 0 }} />
      )}

      {/* ── SHELL layer 4: Mobile controls — mounted only after boot ── */}
      {/* This is CONTROLS chrome: virtual joysticks, buttons, pause, exit.   */}
      {/* It never overlaps the engine FPS counter (top-right) or game HUD.  */}
      {bootDone && (
        <GameHUD
          gameLabel={game.label}
          gameEmoji={game.emoji}
          playHref={buildGameLaunchHref(game.id, { play: true })}
          mode={hudMode}
          onExit={handleExit}
        />
      )}
    </div>
  );
}

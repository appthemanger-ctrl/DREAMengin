'use client';

/**
 * GameRemote — dual analog-stick game controller for the Games Daydream (Side B).
 *
 * Per ARCHITECTURE.md §18 (Universal Mobile Remote):
 *   Left stick  → 8 directions → movement (left/right/up/down/diagonals)
 *   Right stick → 8 directions → PS5-style actions:
 *       up          = × JUMP
 *       down        = △ DUCK
 *       left        = □ SPIN
 *       right       = ○ SHOOT
 *       up-left     = L1  Jump+Spin
 *       up-right    = R2  Jump+Shoot
 *       down-left   = L2  Duck hold
 *       down-right  = R1  Dash/Dodge
 *
 * Events fired on window: CustomEvent('de-game-input', { detail: { action, active } })
 * The game canvas (DrEamsGameCanvas) listens for these events as a third input method
 * alongside keyboard and on-canvas touch zones.
 *
 * Sticks snap back to center on pointer release (spring easing via CSS transition).
 * Direction label appears above each stick while dragging past the dead zone.
 */

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useGamepad } from '@/lib/games/useGamepad';
import { buildGameLaunchHref, DEFAULT_GAME_ID } from '@/lib/games/navigation';
import { broadcastGameInput } from '@/lib/games/useRemoteChannel';

// ── Types ─────────────────────────────────────────────────────────────────────
export type GameInputAction =
  | 'move-left' | 'move-right' | 'move-up' | 'move-down'
  | 'move-up-left' | 'move-up-right' | 'move-down-left' | 'move-down-right'
  | 'move-stop'
  | 'jump' | 'duck' | 'spin' | 'shoot'
  | 'jump-spin' | 'jump-shoot' | 'l2' | 'r1' | 'l3' | 'r3'
  | 'pause';

function fireAction(action: GameInputAction, active: boolean) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('de-game-input', { detail: { action, active } }));
  }
  broadcastGameInput(action, active);
}

// ── Constants ─────────────────────────────────────────────────────────────────
const LEFT_PAD_R    = 52;   // outer pad radius (px)
const RIGHT_PAD_R   = 70;   // right analog is intentionally larger for readability
const LEFT_KNOB_R   = 15;   // inner knob radius
const RIGHT_KNOB_R  = 19;   // slightly larger knob for action stick
const LEFT_MAX_DISP = 38;   // max knob displacement from center
const RIGHT_MAX_DISP= 50;   // larger travel to match larger right stick
const DEAD     = 16;   // dead-zone: no action below this displacement

const REMOTE_ACTION_PILLS = [
  { sym: '×', label: 'Jump', action: 'jump' as GameInputAction, color: '#38bdf8' },
  { sym: '○', label: 'Shoot', action: 'shoot' as GameInputAction, color: '#f87171' },
  { sym: '□', label: 'Spin', action: 'spin' as GameInputAction, color: '#fbbf24' },
  { sym: '△', label: 'Duck', action: 'duck' as GameInputAction, color: '#4ade80' },
  { sym: 'L1', label: 'J+Spin', action: 'jump-spin' as GameInputAction, color: '#a78bfa' },
  { sym: 'R2', label: 'J+Shot', action: 'jump-shoot' as GameInputAction, color: '#a78bfa' },
  { sym: 'L2', label: 'Hold', action: 'l2' as GameInputAction, color: '#818cf8' },
  { sym: 'R1', label: 'Dash', action: 'r1' as GameInputAction, color: '#818cf8' },
  { sym: 'L3', label: 'Stick Click', action: 'l3' as GameInputAction, color: '#94a3b8' },
  { sym: 'R3', label: 'Stick Click / Jump', action: 'r3' as GameInputAction, color: '#facc15' },
] as const;

const RIGHT_STICK_RING_BUTTONS = [
  { sym: '×', label: 'Jump', action: 'jump' as GameInputAction, color: '#38bdf8', top: 0, left: 72 },
  { sym: 'L1', label: 'Jump+Spin', action: 'jump-spin' as GameInputAction, color: '#a78bfa', top: 30, left: 10 },
  { sym: 'R2', label: 'Jump+Shot', action: 'jump-shoot' as GameInputAction, color: '#a78bfa', top: 30, left: 134 },
  { sym: '□', label: 'Spin', action: 'spin' as GameInputAction, color: '#fbbf24', top: 76, left: 0 },
  { sym: '○', label: 'Shoot', action: 'shoot' as GameInputAction, color: '#f87171', top: 76, left: 144 },
  { sym: 'L2', label: 'Hold', action: 'l2' as GameInputAction, color: '#818cf8', top: 124, left: 18 },
  { sym: 'R1', label: 'Dash', action: 'r1' as GameInputAction, color: '#818cf8', top: 124, left: 126 },
  { sym: '△', label: 'Duck', action: 'duck' as GameInputAction, color: '#4ade80', top: 146, left: 72 },
] as const;

// ── Direction helpers ─────────────────────────────────────────────────────────
type Dir8 = 'right' | 'down-right' | 'down' | 'down-left' | 'left' | 'up-left' | 'up' | 'up-right';

function angleToDir(dx: number, dy: number): Dir8 | null {
  const dist = Math.hypot(dx, dy);
  if (dist < DEAD) return null;
  const a = Math.atan2(dy, dx) * (180 / Math.PI); // -180..180, right=0, down=90
  if (a > -22.5   && a <=  22.5)  return 'right';
  if (a >  22.5   && a <=  67.5)  return 'down-right';
  if (a >  67.5   && a <= 112.5)  return 'down';
  if (a >  112.5  && a <= 157.5)  return 'down-left';
  if (a >  157.5  || a <= -157.5) return 'left';
  if (a > -157.5  && a <= -112.5) return 'up-left';
  if (a > -112.5  && a <=  -67.5) return 'up';
  if (a >  -67.5  && a <=  -22.5) return 'up-right';
  return null;
}

function clampToCircle(v: { x: number; y: number }, maxR: number) {
  const d = Math.hypot(v.x, v.y);
  return d > maxR ? { x: (v.x / d) * maxR, y: (v.y / d) * maxR } : v;
}

// ── Mapping tables ────────────────────────────────────────────────────────────
const RIGHT_MAP: Record<Dir8, { action: GameInputAction; label: string; sym: string; color: string }> = {
  'up':         { action: 'jump',       label: 'JUMP',       sym: '×',  color: '#38bdf8' },
  'down':       { action: 'duck',       label: 'DUCK',       sym: '△',  color: '#4ade80' },
  'left':       { action: 'spin',       label: 'SPIN',       sym: '□',  color: '#fbbf24' },
  'right':      { action: 'shoot',      label: 'SHOOT',      sym: '○',  color: '#f87171' },
  'up-left':    { action: 'jump-spin',  label: 'JUMP+SPIN',  sym: 'L1', color: '#a78bfa' },
  'up-right':   { action: 'jump-shoot', label: 'JUMP+SHOT',  sym: 'R2', color: '#a78bfa' },
  'down-left':  { action: 'l2',         label: 'DUCK HOLD',  sym: 'L2', color: '#818cf8' },
  'down-right': { action: 'r1',         label: 'DASH',       sym: 'R1', color: '#818cf8' },
};

const LEFT_MAP: Record<Dir8, { action: GameInputAction; label: string }> = {
  'left':       { action: 'move-left',       label: '◀ LEFT'  },
  'right':      { action: 'move-right',      label: 'RIGHT ▶' },
  'up':         { action: 'move-up',         label: '▲ UP'    },
  'down':       { action: 'move-down',       label: '▼ DOWN'  },
  'up-left':    { action: 'move-up-left',    label: '↖'       },
  'up-right':   { action: 'move-up-right',   label: '↗'       },
  'down-left':  { action: 'move-down-left',  label: '↙'       },
  'down-right': { action: 'move-down-right', label: '↘'       },
};

// ── Single thumbstick ─────────────────────────────────────────────────────────
interface StickProps {
  side: 'left' | 'right';
  accentColor: string;
  label: string;
  scale?: number;
  clickAction?: GameInputAction;
  clickSym?: string;
  clickLabel?: string;
  clickColor?: string;
}

function Stick({
  side,
  accentColor,
  label,
  scale = 1,
  clickAction,
  clickSym,
  clickLabel,
  clickColor = 'rgba(220,235,255,0.82)',
}: StickProps) {
  const padRadius = (side === 'right' ? RIGHT_PAD_R : LEFT_PAD_R) * scale;
  const knobRadius = (side === 'right' ? RIGHT_KNOB_R : LEFT_KNOB_R) * scale;
  const maxDisp = (side === 'right' ? RIGHT_MAX_DISP : LEFT_MAX_DISP) * scale;

  const [knob, setKnob]     = useState({ x: 0, y: 0 });
  const [dir, setDir]       = useState<Dir8 | null>(null);
  const [active, setActive] = useState(false);
  const [buttonAction, setButtonAction] = useState<GameInputAction | null>(null);

  const centerRef       = useRef<{ x: number; y: number } | null>(null);
  const activeActionRef = useRef<GameInputAction | null>(null);
  const prevDirRef      = useRef<Dir8 | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    setActive(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!centerRef.current) return;

    const rawDx = e.clientX - centerRef.current.x;
    const rawDy = e.clientY - centerRef.current.y;
    const clamped = clampToCircle({ x: rawDx, y: rawDy }, maxDisp);
    setKnob(clamped);

    const newDir = angleToDir(rawDx, rawDy);

    if (newDir !== prevDirRef.current) {
      // Release previous action
      if (prevDirRef.current && activeActionRef.current) {
        fireAction(activeActionRef.current, false);
        if (side === 'left') fireAction('move-stop', false);
      }
      // Start new action
      if (newDir) {
        const map = side === 'right' ? RIGHT_MAP[newDir] : LEFT_MAP[newDir];
        activeActionRef.current = map.action;
        fireAction(map.action, true);
      } else {
        activeActionRef.current = null;
        if (side === 'left') fireAction('move-stop', true);
      }
      prevDirRef.current = newDir;
    }

    setDir(newDir);
  }, [maxDisp, side]);

  const handlePointerUp = useCallback(() => {
    if (activeActionRef.current) {
      fireAction(activeActionRef.current, false);
      if (side === 'left') fireAction('move-stop', false);
      activeActionRef.current = null;
    }
    prevDirRef.current = null;
    centerRef.current  = null;
    setKnob({ x: 0, y: 0 });
    setDir(null);
    setActive(false);
  }, [side]);

  const triggerButtonAction = useCallback((action: GameInputAction) => {
    if (activeActionRef.current) {
      fireAction(activeActionRef.current, false);
      activeActionRef.current = null;
    }
    setButtonAction(action);
    fireAction(action, true);
  }, []);

  const releaseButtonAction = useCallback(() => {
    if (!buttonAction) return;
    fireAction(buttonAction, false);
    setButtonAction(null);
  }, [buttonAction]);

  const map        = side === 'right' ? RIGHT_MAP : LEFT_MAP;
  const activeInfo = dir ? map[dir] : null;
  const dirLabel   = activeInfo ? activeInfo.label : null;
  const buttonLabel = buttonAction
    ? (Object.values(RIGHT_MAP).find(info => info.action === buttonAction)?.label ?? buttonAction)
    : null;
  const labelColor = side === 'right' && dir
    ? RIGHT_MAP[dir].color
    : 'rgba(255,255,255,0.9)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, userSelect: 'none' }}>
      {/* Axis label */}
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        color: 'rgba(160,195,240,0.45)', textTransform: 'uppercase',
      }}>{label}</div>

      {/* Direction readout */}
      <div style={{
        height: 18,
        fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
        color: (buttonLabel || dirLabel) ? labelColor : 'transparent',
        textShadow: (buttonLabel || dirLabel) ? '0 1px 8px rgba(0,0,0,0.5)' : 'none',
        transition: 'color 0.08s',
        whiteSpace: 'nowrap',
      }}>
        {buttonLabel ?? dirLabel ?? '·'}
      </div>

      {/* Outer ring */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: padRadius * 2, height: padRadius * 2,
          borderRadius: '50%',
          background: active ? 'rgba(200,232,255,0.12)' : 'rgba(220,232,248,0.06)',
          border: `2px solid ${active ? accentColor + '66' : 'rgba(160,195,240,0.2)'}`,
          boxShadow: active
            ? `0 0 24px ${accentColor}33, inset 0 0 12px rgba(255,255,255,0.04)`
            : '0 4px 24px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'relative',
          touchAction: 'none',
          cursor: 'grab',
          transition: 'border-color 0.12s, background 0.12s, box-shadow 0.12s',
        }}
      >
        {/* Cardinal tick marks — subtle direction indicators for both sticks */}
        {[0, 90, 180, 270].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const r = padRadius - 8;
          const tx = Math.cos(rad) * r + padRadius;
          const ty = Math.sin(rad) * r + padRadius;
          const dirAtDeg = (['right', 'down', 'left', 'up'] as Dir8[])[i];
          const isActive = side === 'right' && dir === dirAtDeg;
          return (
            <div key={deg} style={{
              position: 'absolute',
              left: tx - 2, top: ty - 2,
              width: 4, height: 4,
              borderRadius: '50%',
              background: isActive ? accentColor : 'rgba(160,195,240,0.25)',
              transition: 'background 0.08s',
              pointerEvents: 'none',
            }} />
          );
        })}

        {/* Inner knob — follows finger, spring-snaps to center on release */}
        <div style={{
          position: 'absolute',
          left: padRadius + knob.x - knobRadius,
          top:  padRadius + knob.y - knobRadius,
          width: knobRadius * 2,
          height: knobRadius * 2,
          borderRadius: '50%',
          background: active
            ? `radial-gradient(circle at 38% 38%, ${accentColor}ee, ${accentColor}88)`
            : 'radial-gradient(circle at 38% 38%, rgba(220,235,255,0.92), rgba(160,195,240,0.65))',
          boxShadow: active
            ? `0 2px 14px ${accentColor}66, 0 0 0 2px ${accentColor}33`
            : '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
          // Spring back on release (active=false → transition kicks in)
          transition: active ? 'background 0.08s' : 'left 0.18s cubic-bezier(0.34,1.56,0.64,1), top 0.18s cubic-bezier(0.34,1.56,0.64,1), background 0.1s',
          pointerEvents: 'none',
        }} />
      </div>

      {clickAction && clickSym && (
        <button
          type="button"
          aria-label={clickLabel ?? clickSym}
          onPointerDown={(e) => { e.preventDefault(); triggerButtonAction(clickAction); }}
          onPointerUp={(e) => { e.preventDefault(); releaseButtonAction(); }}
          onPointerCancel={(e) => { e.preventDefault(); releaseButtonAction(); }}
          onPointerLeave={(e) => { e.preventDefault(); releaseButtonAction(); }}
          onTouchStart={(e) => { e.preventDefault(); triggerButtonAction(clickAction); }}
          onTouchEnd={(e) => { e.preventDefault(); releaseButtonAction(); }}
          onTouchCancel={(e) => { e.preventDefault(); releaseButtonAction(); }}
          title={clickLabel ?? clickSym}
          style={{
            minWidth: side === 'right' ? 72 * scale : 58 * scale,
            height: 26 * scale,
            borderRadius: 999,
            padding: '0 10px',
            background: side === 'right'
              ? 'rgba(250,204,21,0.16)'
              : 'rgba(148,163,184,0.16)',
            border: `1.5px solid ${side === 'right' ? '#facc15' : 'rgba(148,163,184,0.6)'}`,
            color: clickColor,
            fontSize: 10 * scale,
            fontWeight: 900,
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: side === 'right'
              ? '0 0 14px rgba(250,204,21,0.18)'
              : '0 0 10px rgba(148,163,184,0.12)',
          }}
        >
          {clickSym}
        </button>
      )}
    </div>
  );
}

// ── GameRemote ────────────────────────────────────────────────────────────────
interface GameRemoteProps {
  onBack?: () => void;
  embedded?: boolean;
  playHref?: string;
  gameLabel?: string;
  onPlay?: () => void;
}

export default function GameRemote({
  onBack,
  embedded = false,
  playHref,
  gameLabel,
  onPlay,
}: GameRemoteProps) {
  const { connected: gpConnected, gamepadName } = useGamepad();
  const searchParams = useSearchParams();

  const gpNameLower = gamepadName.toLowerCase();
  const isDualSense = gpNameLower.includes('dualsense')
    || gpNameLower.includes('playstation')
    || gpNameLower.includes('ps5')
    || gpNameLower.includes('ps4');
  const resolvedPlayHref = playHref ?? buildGameLaunchHref(searchParams.get('game') ?? DEFAULT_GAME_ID, { play: true });
  const handleEmbeddedPlay = useCallback(() => {
    if (onPlay) {
      onPlay();
      return;
    }
    window.dispatchEvent(new CustomEvent('de-game-start'));
  }, [onPlay]);

  const outerPaddingX = embedded ? 18 : 20;
  const bottomPadding = embedded ? 28 : 56;
  const cardMargin = embedded ? '0 18px 18px' : '0 20px 20px';
  const rightClusterScale = embedded ? 0.84 : 1;
  const rightClusterSize = 190 * rightClusterScale;
  const rightButtonSize = 28 * rightClusterScale;
  const rightButtonFontSize = embedded ? 9 : 11;

  return (
    <div style={{
      position: 'relative',
      minHeight: embedded ? undefined : '100dvh',
      background: 'linear-gradient(160deg, #07101e 0%, #0b1a30 55%, #07101e 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRadius: embedded ? 20 : undefined,
      border: embedded ? '1px solid rgba(160,195,240,0.12)' : undefined,
      boxShadow: embedded ? '0 16px 48px rgba(0,0,0,0.28)' : undefined,
    }}>
      {!embedded && (
        <header style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px',
          borderBottom: '1px solid rgba(160,195,240,0.08)',
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to daydream (Side A)"
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(220,232,248,0.08)',
              border: '1px solid rgba(160,195,240,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(220,235,255,0.8)', fontSize: 16,
            }}
          >
            ←
          </button>
          <span style={{
            fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
            color: 'rgba(220,235,255,0.8)', textTransform: 'uppercase',
          }}>Game Remote</span>

          <span
            title={gpConnected ? gamepadName : 'Press any button on your controller to connect'}
            style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
              padding: '2px 8px', borderRadius: 999,
              background: gpConnected ? 'rgba(74,222,128,0.12)' : 'rgba(160,195,240,0.06)',
              color: gpConnected ? '#4ade80' : 'rgba(160,195,240,0.32)',
              border: gpConnected
                ? '1px solid rgba(74,222,128,0.30)'
                : '1px solid rgba(160,195,240,0.10)',
              transition: 'all 0.3s',
              whiteSpace: 'nowrap',
            }}
          >
            {gpConnected
              ? (isDualSense ? '🎮 DualSense' : '🕹 Pad')
              : '🎮 No pad'}
          </span>

          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            color: 'rgba(160,195,240,0.4)', textTransform: 'uppercase',
            padding: '2px 8px', borderRadius: 999,
            border: '1px solid rgba(160,195,240,0.12)',
          }}>Side B</span>
        </header>
      )}

      {embedded && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 18px 0',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(160,195,240,0.45)' }}>
              Shared Remote
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fbff', marginTop: 4 }}>
              {gameLabel ? `${gameLabel} controls` : 'Inline game controls'}
            </div>
          </div>
          <span
            title={gpConnected ? gamepadName : 'Press any button on your controller to connect'}
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
              padding: '4px 10px', borderRadius: 999,
              background: gpConnected ? 'rgba(74,222,128,0.12)' : 'rgba(160,195,240,0.06)',
              color: gpConnected ? '#4ade80' : 'rgba(160,195,240,0.5)',
              border: gpConnected
                ? '1px solid rgba(74,222,128,0.30)'
                : '1px solid rgba(160,195,240,0.10)',
              transition: 'all 0.3s',
              whiteSpace: 'nowrap',
            }}
          >
            {gpConnected
              ? (isDualSense ? '🎮 DualSense linked' : '🕹 Pad linked')
              : '🎮 Remote ready'}
          </span>
        </div>
      )}

      {!embedded && (
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
          padding: `10px ${outerPaddingX}px 0`,
          flexShrink: 0,
        }}>
          {REMOTE_ACTION_PILLS.map(({ sym, label, color }) => (
            <div key={sym} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '2px 7px', borderRadius: 999,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${color}28`,
            }}>
              <span style={{ fontSize: 10, fontWeight: 900, color }}>{sym}</span>
              <span style={{ fontSize: 9, color: 'rgba(220,235,255,0.45)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sticks + center controls + original right action cluster */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: embedded ? 'center' : 'flex-end',
        justifyContent: 'space-between',
        gap: embedded ? 12 : 0,
        padding: embedded
          ? `12px ${outerPaddingX}px ${bottomPadding}px`
          : `0 ${outerPaddingX}px ${bottomPadding}px`,
      }}>
        {/* LEFT stick */}
        <Stick
          side="left"
          accentColor="#2a8ab8"
          label="Move"
          scale={embedded ? 0.78 : 1}
          clickAction="l3"
          clickSym="L3"
          clickLabel="Left stick click"
        />

        {/* Center controls */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 10,
          paddingBottom: embedded ? 0 : 24,
        }}>
          {/* Pause / menu button */}
          <button
            type="button"
            aria-label="Pause / menu"
            onPointerDown={() => fireAction('pause', true)}
            onPointerUp={() => fireAction('pause', false)}
            onPointerCancel={() => fireAction('pause', false)}
            onPointerLeave={() => fireAction('pause', false)}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(160,195,240,0.06)',
              border: '1.5px solid rgba(160,195,240,0.18)',
              color: 'rgba(220,235,255,0.65)',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
            title="Pause"
          >
            ⏸
          </button>

          {/* Play button — fires de-game-start when embedded (starts the active game inline);
              falls back to navigation link on the standalone remote page */}
          {embedded ? (
            <button
              type="button"
              onClick={handleEmbeddedPlay}
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                color: '#c8981a', cursor: 'pointer',
                padding: '4px 10px', borderRadius: 999,
                border: '1px solid rgba(200,152,26,0.3)',
                background: 'rgba(200,152,26,0.07)',
                whiteSpace: 'nowrap',
              }}
            >
              ▶ PLAY
            </button>
          ) : (
            <Link
              href={resolvedPlayHref}
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                color: '#c8981a', textDecoration: 'none',
                padding: '4px 10px', borderRadius: 999,
                border: '1px solid rgba(200,152,26,0.3)',
                background: 'rgba(200,152,26,0.07)',
                whiteSpace: 'nowrap',
              }}
            >
              ▶ PLAY
            </Link>
          )}
        </div>

        {/* RIGHT side: larger analog with buttons wrapped around it like the original remote */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            position: 'relative',
            width: rightClusterSize,
            height: rightClusterSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Stick
              side="right"
              accentColor="#c8981a"
              label="Actions"
              scale={rightClusterScale}
              clickAction="r3"
              clickSym="R3 / ×"
              clickLabel="Right stick click / jump"
              clickColor="#fef08a"
            />

            {RIGHT_STICK_RING_BUTTONS.map(({ sym, label, action, color, top, left }) => (
              <button
                key={sym}
                type="button"
                aria-label={label}
                onPointerDown={(e) => { e.preventDefault(); fireAction(action, true); }}
                onPointerUp={(e)   => { e.preventDefault(); fireAction(action, false); }}
                onPointerCancel={(e) => { e.preventDefault(); fireAction(action, false); }}
                onPointerLeave={(e)  => { e.preventDefault(); fireAction(action, false); }}
                onTouchStart={(e)  => { e.preventDefault(); fireAction(action, true); }}
                onTouchEnd={(e)    => { e.preventDefault(); fireAction(action, false); }}
                onTouchCancel={(e) => { e.preventDefault(); fireAction(action, false); }}
                style={{
                  position: 'absolute',
                  top: top * rightClusterScale,
                  left: left * rightClusterScale,
                  width: rightButtonSize,
                  height: rightButtonSize,
                  borderRadius: '50%',
                  background: `${color}18`,
                  border: `1.5px solid ${color}55`,
                  color,
                  fontSize: rightButtonFontSize,
                  fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  touchAction: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: '0 2px 12px rgba(5, 10, 20, 0.35)',
                  transition: 'background 0.08s, border-color 0.08s, transform 0.08s',
                }}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!embedded && (
        <div style={{
          margin: cardMargin,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(160,195,240,0.08)',
          padding: '10px 14px',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '3px 16px',
          flexShrink: 0,
        }}>
          {([
            ['L-stick', 'Move'],
            ['L3',      'Stick Click'],
            ['×',       'Jump'],
            ['△',       'Duck'],
            ['□',       'Spin'],
            ['○',       'Shoot'],
            ['R3',      'Stick Click / Jump'],
            ['R-stick ↗', 'Jump+Shoot'],
          ] as [string, string][]).map(([ctrl, action]) => (
            <div key={ctrl} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(160,195,240,0.45)', minWidth: 58 }}>{ctrl}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(220,235,255,0.65)' }}>{action}</span>
            </div>
          ))}
        </div>
      )}

      {/* Physical controller hint */}
      {!gpConnected && (
        <p style={{
          margin: embedded ? '0 18px 16px' : '0 20px 18px', textAlign: 'center',
          fontSize: 10, color: 'rgba(160,195,240,0.32)', lineHeight: 1.5,
        }}>
          {embedded
            ? 'Remote inputs are mirrored into the shared game channel so the active game responds immediately.'
            : '🎮 PS5 DualSense / Xbox controller? Press any button to connect via Gamepad API'}
        </p>
      )}
    </div>
  );
}

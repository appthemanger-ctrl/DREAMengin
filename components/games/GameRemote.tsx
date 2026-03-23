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
import { useGamepad } from '@/lib/games/useGamepad';

// ── Types ─────────────────────────────────────────────────────────────────────
export type GameInputAction =
  | 'move-left' | 'move-right' | 'move-up' | 'move-down'
  | 'move-up-left' | 'move-up-right' | 'move-down-left' | 'move-down-right'
  | 'move-stop'
  | 'jump' | 'duck' | 'spin' | 'shoot'
  | 'jump-spin' | 'jump-shoot' | 'l2' | 'r1'
  | 'pause';

function fireAction(action: GameInputAction, active: boolean) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('de-game-input', { detail: { action, active } }));
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PAD_R    = 52;   // outer pad radius (px)
const KNOB_R   = 15;   // inner knob radius
const MAX_DISP = 38;   // max knob displacement from center
const DEAD     = 16;   // dead-zone: no action below this displacement

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
}

function Stick({ side, accentColor, label }: StickProps) {
  const [knob, setKnob]     = useState({ x: 0, y: 0 });
  const [dir, setDir]       = useState<Dir8 | null>(null);
  const [active, setActive] = useState(false);

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
    const clamped = clampToCircle({ x: rawDx, y: rawDy }, MAX_DISP);
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
  }, [side]);

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

  const map        = side === 'right' ? RIGHT_MAP : LEFT_MAP;
  const activeInfo = dir ? map[dir] : null;
  const dirLabel   = activeInfo ? activeInfo.label : null;
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
        color: dirLabel ? labelColor : 'transparent',
        textShadow: dirLabel ? '0 1px 8px rgba(0,0,0,0.5)' : 'none',
        transition: 'color 0.08s',
        whiteSpace: 'nowrap',
      }}>
        {dirLabel ?? '·'}
      </div>

      {/* Outer ring */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: PAD_R * 2, height: PAD_R * 2,
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
        {/* 8 direction tick dots (right stick only — shows PS5 symbol) */}
        {side === 'right' && (Object.entries(RIGHT_MAP) as [Dir8, typeof RIGHT_MAP[Dir8]][]).map(([dirKey, info]) => {
          const angleDeg: Record<Dir8, number> = {
            right: 0, 'down-right': 45, down: 90, 'down-left': 135,
            left: 180, 'up-left': 225, up: 270, 'up-right': 315,
          };
          const rad = (angleDeg[dirKey] * Math.PI) / 180;
          const tickR = PAD_R - 10;
          const tx = Math.cos(rad) * tickR + PAD_R;
          const ty = Math.sin(rad) * tickR + PAD_R;
          const isActive = dir === dirKey;
          return (
            <div key={dirKey} style={{
              position: 'absolute',
              left: tx - 10, top: ty - 10,
              width: 20, height: 20,
              borderRadius: '50%',
              background: isActive ? info.color : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${isActive ? info.color : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 900,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.28)',
              transition: 'background 0.08s, color 0.08s, border-color 0.08s',
              pointerEvents: 'none',
            }}>
              {info.sym}
            </div>
          );
        })}

        {/* Left stick cardinal markers (no symbols, just subtle lines) */}
        {side === 'left' && [0, 90, 180, 270].map(deg => {
          const rad = (deg * Math.PI) / 180;
          const r = PAD_R - 8;
          const tx = Math.cos(rad) * r + PAD_R;
          const ty = Math.sin(rad) * r + PAD_R;
          return (
            <div key={deg} style={{
              position: 'absolute',
              left: tx - 2, top: ty - 2,
              width: 4, height: 4,
              borderRadius: '50%',
              background: 'rgba(160,195,240,0.25)',
              pointerEvents: 'none',
            }} />
          );
        })}

        {/* Inner knob — follows finger, spring-snaps to center on release */}
        <div style={{
          position: 'absolute',
          left: PAD_R + knob.x - KNOB_R,
          top:  PAD_R + knob.y - KNOB_R,
          width: KNOB_R * 2,
          height: KNOB_R * 2,
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
    </div>
  );
}

// ── GameRemote ────────────────────────────────────────────────────────────────
interface GameRemoteProps {
  onBack: () => void;
}

export default function GameRemote({ onBack }: GameRemoteProps) {
  const { connected: gpConnected, gamepadName } = useGamepad();

  const gpNameLower = gamepadName.toLowerCase();
  const isDualSense = gpNameLower.includes('dualsense')
    || gpNameLower.includes('playstation')
    || gpNameLower.includes('ps5')
    || gpNameLower.includes('ps4');

  return (
    <div style={{
      position: 'relative',
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #07101e 0%, #0b1a30 55%, #07101e 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
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

        {/* Physical controller status badge */}
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

      {/* Button legend */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        padding: '10px 20px 0',
        flexShrink: 0,
      }}>
        {[
          { sym: '×',  label: 'Jump',  color: '#38bdf8' },
          { sym: '○',  label: 'Shoot', color: '#f87171' },
          { sym: '□',  label: 'Spin',  color: '#fbbf24' },
          { sym: '△',  label: 'Duck',  color: '#4ade80' },
          { sym: 'L1', label: 'J+Spin', color: '#a78bfa' },
          { sym: 'R2', label: 'J+Shot', color: '#a78bfa' },
          { sym: 'L2', label: 'Hold',   color: '#818cf8' },
          { sym: 'R1', label: 'Dash',   color: '#818cf8' },
        ].map(({ sym, label, color }) => (
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

      {/* Sticks */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '0 20px 56px',
      }}>
        {/* LEFT stick */}
        <Stick side="left" accentColor="#2a8ab8" label="Move" />

        {/* Center controls */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 10,
          paddingBottom: 24,
        }}>
          {/* Pause / menu button */}
          <button
            type="button"
            aria-label="Pause / menu"
            onClick={() => fireAction('pause', true)}
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

          {/* Play link */}
          <Link
            href="/game"
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
        </div>

        {/* RIGHT stick */}
        <Stick side="right" accentColor="#c8981a" label="Actions" />
      </div>

      {/* Quick reference card */}
      <div style={{
        margin: '0 20px 20px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(160,195,240,0.08)',
        padding: '10px 14px',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '3px 16px',
        flexShrink: 0,
      }}>
        {([
          ['Left ↕↔', 'Move / Jump / Duck'],
          ['Right ↑',  '× Jump'],
          ['Right ↓',  '△ Duck'],
          ['Right ←',  '□ Spin'],
          ['Right →',  '○ Shoot'],
          ['Right ↗',  'R2 Jump+Shoot'],
        ] as [string, string][]).map(([dir, action]) => (
          <div key={dir} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'rgba(160,195,240,0.45)', fontFamily: 'monospace', minWidth: 58 }}>{dir}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(220,235,255,0.65)' }}>{action}</span>
          </div>
        ))}
      </div>

      {/* Physical controller hint */}
      {!gpConnected && (
        <p style={{
          margin: '0 20px 18px', textAlign: 'center',
          fontSize: 10, color: 'rgba(160,195,240,0.32)', lineHeight: 1.5,
        }}>
          🎮 PS5 DualSense / Xbox controller? Press any button to connect via Gamepad API
        </p>
      )}
    </div>
  );
}

'use client';

/**
 * BabylonSideScroller — Babylon.js powered 3D side-scrolling platformer.
 *
 * Replaces the old Canvas-2D Dr. Eams Platformer.
 * Key improvements:
 *  • Babylon.js @babylonjs/core v8 for 3-D rendering (glow, lighting, PBR).
 *  • Set<string>-based key tracking so movement + jump always work together.
 *  • Coyote-time (8 frames after leaving ledge) + jump buffering (6 frames).
 *  • Double-jump, particle bursts, scrolling parallax background layers.
 *  • 3 handcrafted levels — each harder than the last.
 *  • Virtual D-Pad for touch / mobile.
 *  • GameRemote CustomEvent bridge.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Game constants ──────────────────────────────────────────────────────────
const GW = 800; // logical canvas width
const GH = 480; // logical canvas height
const GRAV       = 0.048;   // units / frame²
const MAX_FALL   = 0.95;    // terminal velocity (positive = down in BJS Y-up is handled)
const JUMP_VY    = 0.68;    // initial jump Y velocity
const WALK_SPD   = 0.115;   // horizontal speed
const COYOTE_MS  = 8;       // extra frames to jump after leaving ledge
const JBUF_MS    = 6;       // frames to buffer a jump before landing

// Babylon render-unit scale:  1 BU ≈ 40 logical px
const PX_PER_BU  = 40;

// ─── Types ───────────────────────────────────────────────────────────────────
interface PlatDef {
  x: number; y: number; w: number; h: number;
  type: 'solid' | 'moving' | 'goal';
  moveRange?: number; moveSpd?: number;
}
interface CoinDef { x: number; y: number; isGoal?: boolean; }
interface EnemyDef { x: number; y: number; vx: number; }

interface LevelDef {
  platforms: PlatDef[];
  coins: CoinDef[];
  enemies: EnemyDef[];
  worldW: number;
}

// ─── Level data (logical pixels, Y-down) ─────────────────────────────────────
// Ground sits at y=400.  Platforms use their TOP-LEFT corner (x,y,w,h).
function makeLevel(n: number): LevelDef {
  if (n === 1) return {
    worldW: 2400,
    platforms: [
      { x: 0,    y: 400, w: 2400, h: 80, type: 'solid' },   // ground
      { x: 300,  y: 310, w: 120,  h: 20, type: 'solid' },
      { x: 500,  y: 250, w: 140,  h: 20, type: 'solid' },
      { x: 700,  y: 200, w: 120,  h: 20, type: 'solid' },
      { x: 900,  y: 310, w: 160,  h: 20, type: 'solid' },
      { x: 1100, y: 250, w: 140,  h: 20, type: 'solid' },
      { x: 1300, y: 170, w: 130,  h: 20, type: 'solid' },
      { x: 1550, y: 300, w: 160,  h: 20, type: 'moving', moveRange: 80, moveSpd: 0.7 },
      { x: 1800, y: 200, w: 130,  h: 20, type: 'solid' },
      { x: 2050, y: 260, w: 200,  h: 20, type: 'solid' },
      { x: 2200, y: 160, w: 140,  h: 20, type: 'goal' },    // goal
    ],
    coins: [
      { x: 360, y: 280 }, { x: 400, y: 280 },
      { x: 560, y: 220 }, { x: 600, y: 220 },
      { x: 760, y: 170 }, { x: 800, y: 170 },
      { x: 950, y: 280 }, { x: 990, y: 280 },
      { x: 1140,y: 220 }, { x: 1180,y: 220 },
      { x: 1360,y: 140 }, { x: 1400,y: 140 },
      { x: 1620,y: 270 }, { x: 1660,y: 270 },
      { x: 1860,y: 170 }, { x: 1900,y: 170 },
      { x: 2240,y: 130, isGoal: true },
    ],
    enemies: [
      { x: 900,  y: 368, vx: 1.4 },
      { x: 1300, y: 368, vx: -1.6 },
      { x: 1800, y: 368, vx: 1.2 },
    ],
  };

  if (n === 2) return {
    worldW: 2800,
    platforms: [
      { x: 0,    y: 400, w: 2800, h: 80, type: 'solid' },
      { x: 200,  y: 330, w: 100,  h: 20, type: 'solid' },
      { x: 360,  y: 260, w: 90,   h: 20, type: 'solid' },
      { x: 510,  y: 190, w: 100,  h: 20, type: 'solid' },
      { x: 660,  y: 280, w: 90,   h: 20, type: 'moving', moveRange: 100, moveSpd: 1.2 },
      { x: 820,  y: 200, w: 80,   h: 20, type: 'solid' },
      { x: 980,  y: 300, w: 110,  h: 20, type: 'solid' },
      { x: 1150, y: 180, w: 90,   h: 20, type: 'moving', moveRange: 60, moveSpd: 0.9 },
      { x: 1310, y: 260, w: 110,  h: 20, type: 'solid' },
      { x: 1480, y: 150, w: 100,  h: 20, type: 'solid' },
      { x: 1650, y: 240, w: 100,  h: 20, type: 'moving', moveRange: 80, moveSpd: 1.0 },
      { x: 1820, y: 160, w: 90,   h: 20, type: 'solid' },
      { x: 2000, y: 280, w: 120,  h: 20, type: 'solid' },
      { x: 2200, y: 180, w: 110,  h: 20, type: 'solid' },
      { x: 2440, y: 240, w: 130,  h: 20, type: 'solid' },
      { x: 2620, y: 140, w: 120,  h: 20, type: 'goal' },
    ],
    coins: [
      { x: 240, y: 300 }, { x: 400, y: 230 }, { x: 550, y: 160 },
      { x: 720, y: 250 }, { x: 860, y: 170 }, { x: 1020,y: 270 },
      { x: 1200,y: 150 }, { x: 1360,y: 230 }, { x: 1520,y: 120 },
      { x: 1690,y: 210 }, { x: 1860,y: 130 }, { x: 2050,y: 250 },
      { x: 2240,y: 150 }, { x: 2660,y: 110, isGoal: true },
    ],
    enemies: [
      { x: 200, y: 368, vx: 1.5 },
      { x: 700, y: 368, vx: -1.8 },
      { x: 1200,y: 368, vx: 1.6 },
      { x: 1800,y: 368, vx: -2.0 },
      { x: 2400,y: 368, vx: 1.7 },
    ],
  };

  // Level 3 – hardest
  return {
    worldW: 3200,
    platforms: [
      { x: 0,    y: 400, w: 3200, h: 80, type: 'solid' },
      { x: 160,  y: 340, w: 80,   h: 20, type: 'solid' },
      { x: 300,  y: 270, w: 70,   h: 20, type: 'solid' },
      { x: 430,  y: 200, w: 80,   h: 20, type: 'solid' },
      { x: 570,  y: 280, w: 70,   h: 20, type: 'moving', moveRange: 90, moveSpd: 1.6 },
      { x: 700,  y: 180, w: 70,   h: 20, type: 'solid' },
      { x: 840,  y: 270, w: 80,   h: 20, type: 'solid' },
      { x: 980,  y: 160, w: 70,   h: 20, type: 'moving', moveRange: 70, moveSpd: 1.4 },
      { x: 1120, y: 250, w: 80,   h: 20, type: 'solid' },
      { x: 1260, y: 150, w: 70,   h: 20, type: 'solid' },
      { x: 1410, y: 240, w: 80,   h: 20, type: 'moving', moveRange: 80, moveSpd: 1.8 },
      { x: 1580, y: 150, w: 70,   h: 20, type: 'solid' },
      { x: 1730, y: 260, w: 80,   h: 20, type: 'solid' },
      { x: 1880, y: 160, w: 70,   h: 20, type: 'moving', moveRange: 60, moveSpd: 2.0 },
      { x: 2050, y: 250, w: 90,   h: 20, type: 'solid' },
      { x: 2210, y: 150, w: 70,   h: 20, type: 'solid' },
      { x: 2380, y: 260, w: 80,   h: 20, type: 'moving', moveRange: 70, moveSpd: 1.5 },
      { x: 2560, y: 160, w: 80,   h: 20, type: 'solid' },
      { x: 2720, y: 240, w: 90,   h: 20, type: 'solid' },
      { x: 2900, y: 140, w: 80,   h: 20, type: 'solid' },
      { x: 3060, y: 120, w: 100,  h: 20, type: 'goal' },
    ],
    coins: [
      { x: 190, y: 310 }, { x: 330, y: 240 }, { x: 470, y: 170 },
      { x: 610, y: 250 }, { x: 730, y: 150 }, { x: 880, y: 240 },
      { x: 1010,y: 130 }, { x: 1150,y: 220 }, { x: 1290,y: 120 },
      { x: 1450,y: 210 }, { x: 1610,y: 120 }, { x: 1760,y: 230 },
      { x: 1910,y: 130 }, { x: 2090,y: 220 }, { x: 2250,y: 120 },
      { x: 3100, y: 90, isGoal: true },
    ],
    enemies: [
      { x: 300,  y: 368, vx: 1.8 },
      { x: 700,  y: 368, vx: -2.0 },
      { x: 1200, y: 368, vx: 2.1 },
      { x: 1700, y: 368, vx: -2.3 },
      { x: 2200, y: 368, vx: 2.0 },
      { x: 2700, y: 368, vx: -2.2 },
    ],
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function BabylonSideScroller() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gameRef    = useRef<GameCore | null>(null);
  const [status, setStatus]   = useState<'title'|'playing'|'dead'|'complete'|'win'>('title');
  const [level,  setLevel]    = useState(1);
  const [score,  setScore]    = useState(0);
  const [lives,  setLives]    = useState(3);
  const [vpad,   setVpad]     = useState({ left: false, right: false, jump: false });
  const vpadRef  = useRef({ left: false, right: false, jump: false });

  // ── Start / restart ────────────────────────────────────────────────────────
  const startGame = useCallback((lv: number, sc: number, li: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    gameRef.current?.destroy();
    const core = new GameCore(canvas, lv, sc, li, {
      onScore:    (s)  => setScore(s),
      onDie:      (li) => { setLives(li); setStatus('dead'); },
      onComplete: (lv) => { setLevel(lv); setStatus(lv > 3 ? 'win' : 'complete'); },
    });
    gameRef.current = core;
    setStatus('playing');
  }, []);

  // ── Key events ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const keysDown = new Set<string>();
    const down = (e: KeyboardEvent) => {
      keysDown.add(e.code);
      gameRef.current?.setKeys(keysDown);
      if ((e.code === 'Space' || e.code === 'Enter') && status === 'title') {
        startGame(1, 0, 3);
      }
      // Arrow keys / space — prevent page scroll only when game is running
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
      gameRef.current?.setKeys(keysDown);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
    };
  }, [status, startGame]);

  // ── GameRemote bridge ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { action, active } = (e as CustomEvent<{ action: string; active: boolean }>).detail;
      const vp = { ...vpadRef.current };
      if (action === 'move-left' || action === 'move-up-left' || action === 'move-down-left')
        vp.left  = active;
      if (action === 'move-right' || action === 'move-up-right' || action === 'move-down-right')
        vp.right = active;
      if (action === 'move-stop') { vp.left = false; vp.right = false; }
      if (action === 'jump' || action === 'jump-spin' || action === 'jump-shoot')
        vp.jump = active;
      vpadRef.current = vp;
      gameRef.current?.setVpad(vp);
    };
    window.addEventListener('de-game-input', handler);
    return () => window.removeEventListener('de-game-input', handler);
  }, []);

  // ── Touch D-Pad ────────────────────────────────────────────────────────────
  const handleVpad = useCallback((key: 'left'|'right'|'jump', active: boolean) => {
    const vp = { ...vpadRef.current, [key]: active };
    vpadRef.current = vp;
    setVpad(vp);
    gameRef.current?.setVpad(vp);
    if (active && key === 'jump' && status === 'title') startGame(1, 0, 3);
  }, [status, startGame]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => { gameRef.current?.destroy(); }, []);

  // ── Button shared style ────────────────────────────────────────────────────
  const btnBase: React.CSSProperties = {
    border: 'none', borderRadius: 10, cursor: 'pointer',
    fontWeight: 800, fontSize: 14, userSelect: 'none',
    transition: 'opacity 0.1s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {/* ── Canvas ── */}
      <div style={{ position: 'relative', width: '100%', maxWidth: GW }}>
        <canvas
          ref={canvasRef}
          width={GW}
          height={GH}
          style={{ width: '100%', borderRadius: 12, display: 'block',
                   background: '#0a0a1a', cursor: 'default' }}
          onClick={() => { if (status === 'title') startGame(1, 0, 3); }}
        />

        {/* ── Overlay: title ── */}
        {status === 'title' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg,rgba(10,15,40,0.85),rgba(5,5,20,0.92))',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4af', letterSpacing: '0.15em',
                          textTransform: 'uppercase', marginBottom: 8 }}>
              DREAMengin × Babylon.js
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#fff',
                          textShadow: '0 0 24px #4af,0 0 8px #4af', lineHeight: 1.1, marginBottom: 8 }}>
              DREAM RUNNER
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 28, textAlign: 'center' }}>
              3 worlds · 3-D rendering · double jump · dream coins
            </div>
            <button
              style={{ ...btnBase, background: 'linear-gradient(135deg,#2a8ab8,#4a6cf7)',
                       color: '#fff', padding: '12px 36px', fontSize: 16, boxShadow: '0 0 20px #4af6' }}
              onClick={() => startGame(1, 0, 3)}
            >
              ▶ Start Dream
            </button>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 14 }}>
              WASD / Arrows · Space to jump · move + jump works together
            </div>
          </div>
        )}

        {/* ── Overlay: dead ── */}
        {status === 'dead' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(20,5,5,0.88)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#f55',
                          textShadow: '0 0 16px #f55', marginBottom: 8 }}>Dream Lost</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              Level {level} · Score {score}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
              {lives} {lives === 1 ? 'life' : 'lives'} remaining
            </div>
            {lives > 0 ? (
              <button
                style={{ ...btnBase, background: 'linear-gradient(135deg,#b82a2a,#f74a4a)',
                         color: '#fff', padding: '10px 30px' }}
                onClick={() => startGame(level, score, lives)}
              >Retry Level {level}</button>
            ) : (
              <button
                style={{ ...btnBase, background: 'linear-gradient(135deg,#2a8ab8,#4a6cf7)',
                         color: '#fff', padding: '10px 30px' }}
                onClick={() => startGame(1, 0, 3)}
              >New Game</button>
            )}
          </div>
        )}

        {/* ── Overlay: level complete ── */}
        {status === 'complete' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5,20,10,0.88)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#4f8',
                          textShadow: '0 0 16px #4f8', marginBottom: 8 }}>Dream Complete!</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
              Level {level - 1} · Score {score}
            </div>
            <button
              style={{ ...btnBase, background: 'linear-gradient(135deg,#1a8a3a,#4af74a)',
                       color: '#fff', padding: '10px 30px' }}
              onClick={() => startGame(level, score, lives)}
            >Level {level} →</button>
          </div>
        )}

        {/* ── Overlay: victory ── */}
        {status === 'win' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg,rgba(5,10,30,0.92),rgba(10,5,30,0.92))',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fa0',
                          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              All Dreams Conquered
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#fff',
                          textShadow: '0 0 28px #fa0,0 0 8px #fa0', lineHeight: 1.1, marginBottom: 8 }}>
              YOU WIN!
            </div>
            <div style={{ fontSize: 22, color: '#fa0', fontWeight: 800, marginBottom: 24 }}>
              Final Score: {score}
            </div>
            <button
              style={{ ...btnBase, background: 'linear-gradient(135deg,#c8981a,#f7c44a)',
                       color: '#000', padding: '12px 36px', fontSize: 16 }}
              onClick={() => startGame(1, 0, 3)}
            >Play Again</button>
          </div>
        )}

        {/* ── HUD ── */}
        {status === 'playing' && (
          <div style={{ position: 'absolute', top: 10, left: 12, right: 12,
                        display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff',
                          textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                          borderRadius: 6, padding: '3px 10px' }}>
              ⭐ {score}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff',
                          textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                          borderRadius: 6, padding: '3px 10px' }}>
              LVL {level}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff',
                          textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                          borderRadius: 6, padding: '3px 10px' }}>
              {'❤️'.repeat(Math.max(0, lives))}
            </div>
          </div>
        )}
      </div>

      {/* ── Virtual D-Pad ── */}
      {(status === 'playing' || status === 'title') && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
          {/* Left */}
          <button
            style={{ ...btnBase, width: 64, height: 64, fontSize: 22,
                     background: vpad.left ? 'rgba(74,175,255,0.5)' : 'rgba(74,175,255,0.15)',
                     color: 'rgba(180,220,255,0.9)', borderRadius: 12 }}
            onPointerDown={(e) => { e.preventDefault(); handleVpad('left', true); }}
            onPointerUp={() => handleVpad('left', false)}
            onPointerLeave={() => handleVpad('left', false)}
          >◀</button>

          {/* Jump */}
          <button
            style={{ ...btnBase, width: 72, height: 72, fontSize: 22,
                     background: vpad.jump ? 'rgba(74,255,160,0.5)' : 'rgba(74,255,160,0.15)',
                     color: 'rgba(180,255,220,0.9)', borderRadius: 36 }}
            onPointerDown={(e) => { e.preventDefault(); handleVpad('jump', true); }}
            onPointerUp={() => handleVpad('jump', false)}
            onPointerLeave={() => handleVpad('jump', false)}
          >▲</button>

          {/* Right */}
          <button
            style={{ ...btnBase, width: 64, height: 64, fontSize: 22,
                     background: vpad.right ? 'rgba(74,175,255,0.5)' : 'rgba(74,175,255,0.15)',
                     color: 'rgba(180,220,255,0.9)', borderRadius: 12 }}
            onPointerDown={(e) => { e.preventDefault(); handleVpad('right', true); }}
            onPointerUp={() => handleVpad('right', false)}
            onPointerLeave={() => handleVpad('right', false)}
          >▶</button>
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center', maxWidth: 500 }}>
        ← → / A D move &nbsp;·&nbsp; ↑ / W / Space jump (double-jump) &nbsp;·&nbsp;
        Hold forward <strong>and</strong> press jump — they always work together
      </p>
    </div>
  );
}

// ─── GameCore — owns the Babylon.js engine lifecycle ─────────────────────────
interface GameCallbacks {
  onScore:    (s: number) => void;
  onDie:      (livesLeft: number) => void;
  onComplete: (nextLevel: number) => void;
}

type VPad = { left: boolean; right: boolean; jump: boolean };

class GameCore {
  private disposed = false;
  private keys: Set<string> = new Set();
  private vpad: VPad = { left: false, right: false, jump: false };

  // physics state (logical pixels, Y-down)
  private px   = 60; // player x (left edge)
  private py   = 350; // player y (top edge)
  private pvx  = 0;
  private pvy  = 0;
  private onGround   = false;
  private jumpCount  = 0; // 0 = no jump used, 1 = single, 2 = double
  private coyoteFr   = 0; // coyote-time frames remaining
  private jBufFr     = 0; // jump-buffer frames remaining
  private prevJump   = false;
  private facingR    = true;
  private invincible = 0; // frames

  private score: number;
  private lives: number;
  private level: number;
  private cbs: GameCallbacks;

  private platforms: (PlatDef & { curX: number; moveDir: number })[] = [];
  private coins: (CoinDef & { collected: boolean })[] = [];
  private enemies: (EnemyDef & { alive: boolean; curX: number; curY: number })[] = [];

  private camX   = 0;
  private worldW = 2400;

  // Babylon
  private engine: import('@babylonjs/core').Engine | null = null;
  private scene:  import('@babylonjs/core').Scene  | null = null;

  // Babylon mesh refs
  private playerMesh:  import('@babylonjs/core').Mesh | null = null;
  private playerHead:  import('@babylonjs/core').Mesh | null = null;
  private platMeshes:  import('@babylonjs/core').Mesh[] = [];
  private coinMeshes:  (import('@babylonjs/core').Mesh | null)[] = [];
  private enemyMeshes: (import('@babylonjs/core').Mesh | null)[] = [];
  private bgPlane:     import('@babylonjs/core').Mesh | null = null;

  // camera ref
  private camMesh: import('@babylonjs/core').FreeCamera | null = null;

  // particles
  private dustPS: import('@babylonjs/core').ParticleSystem | null = null;

  // anim
  private animTick = 0;

  constructor(
    canvas: HTMLCanvasElement,
    level: number,
    score: number,
    lives: number,
    cbs: GameCallbacks,
  ) {
    this.level = level;
    this.score = score;
    this.lives = lives;
    this.cbs   = cbs;
    this.initLevel(level);
    this.initBabylon(canvas);
  }

  private initLevel(n: number) {
    const def = makeLevel(n);
    this.worldW  = def.worldW;
    this.platforms = def.platforms.map(p => ({ ...p, curX: p.x, moveDir: 1 }));
    this.coins     = def.coins.map(c => ({ ...c, collected: false }));
    this.enemies   = def.enemies.map(e => ({ ...e, alive: true, curX: e.x, curY: e.y }));
    this.px    = 60;
    this.py    = 350;
    this.pvx   = 0;
    this.pvy   = 0;
    this.camX  = 0;
    this.onGround  = false;
    this.jumpCount = 0;
    this.coyoteFr  = 0;
    this.jBufFr    = 0;
    this.prevJump  = false;
    this.invincible = 0;
  }

  private async initBabylon(canvas: HTMLCanvasElement) {
    const BJS = await import('@babylonjs/core');
    if (this.disposed) return;

    const engine = new BJS.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene  = new BJS.Scene(engine);
    this.engine  = engine;
    this.scene   = scene;

    // Sky gradient via clear color
    scene.clearColor = new BJS.Color4(0.05, 0.07, 0.18, 1);

    // ── Camera (FreeCamera, side-view looking in +Z direction) ──────────────
    const cam = new BJS.FreeCamera('cam', new BJS.Vector3(0, 6, -22), scene);
    cam.setTarget(new BJS.Vector3(0, 6, 0));
    this.camMesh = cam;

    // ── Lighting ─────────────────────────────────────────────────────────────
    const ambient = new BJS.HemisphericLight('amb', new BJS.Vector3(0, 1, 0), scene);
    ambient.intensity  = 0.7;
    ambient.diffuse    = new BJS.Color3(0.85, 0.90, 1.0);
    ambient.groundColor= new BJS.Color3(0.1, 0.1, 0.25);

    const sun = new BJS.DirectionalLight('sun', new BJS.Vector3(0.4, -1, 0.5), scene);
    sun.intensity = 0.7;
    sun.diffuse   = new BJS.Color3(1.0, 0.95, 0.8);

    // ── Glow layer ───────────────────────────────────────────────────────────
    const glow = new BJS.GlowLayer('glow', scene);
    glow.intensity = 0.6;

    // ── Background plane (starfield / gradient) ──────────────────────────────
    const bg = BJS.MeshBuilder.CreatePlane('bg', { width: 120, height: 40 }, scene);
    bg.position = new BJS.Vector3(0, 8, 10);
    const bgMat = new BJS.StandardMaterial('bgMat', scene);
    bgMat.diffuseColor  = new BJS.Color3(0.04, 0.06, 0.16);
    bgMat.emissiveColor = new BJS.Color3(0.06, 0.09, 0.25);
    bgMat.backFaceCulling = false;
    bg.material = bgMat;
    this.bgPlane = bg;

    // ── Platform meshes ───────────────────────────────────────────────────────
    for (const p of this.platforms) {
      const bw = p.w / PX_PER_BU;
      const bh = p.h / PX_PER_BU;
      const mesh = BJS.MeshBuilder.CreateBox(`plat_${p.x}`, { width: bw, height: bh, depth: 1.2 }, scene);
      const mat  = new BJS.StandardMaterial(`pmat_${p.x}`, scene);

      if (p.type === 'goal') {
        mat.diffuseColor  = new BJS.Color3(0.9, 0.7, 0.1);
        mat.emissiveColor = new BJS.Color3(0.5, 0.35, 0.0);
        glow.addIncludedOnlyMesh(mesh);
      } else if (p.type === 'moving') {
        mat.diffuseColor  = new BJS.Color3(0.2, 0.55, 0.85);
        mat.emissiveColor = new BJS.Color3(0.05, 0.15, 0.3);
      } else {
        // Alternate subtle colors for ground vs floating
        const isGround = p.y === 400;
        mat.diffuseColor  = isGround
          ? new BJS.Color3(0.18, 0.22, 0.36)
          : new BJS.Color3(0.28, 0.38, 0.62);
        mat.emissiveColor = new BJS.Color3(0.04, 0.06, 0.12);
      }
      mat.specularColor = new BJS.Color3(0.15, 0.2, 0.4);
      mesh.material = mat;
      this.platMeshes.push(mesh);
    }

    // ── Coin meshes ───────────────────────────────────────────────────────────
    for (const c of this.coins) {
      const mesh = BJS.MeshBuilder.CreateSphere(`coin_${c.x}_${c.y}`,
        { diameter: c.isGoal ? 0.7 : 0.42, segments: 8 }, scene);
      const mat  = new BJS.StandardMaterial(`cmat_${c.x}`, scene);
      mat.diffuseColor  = c.isGoal
        ? new BJS.Color3(1, 0.85, 0.1)
        : new BJS.Color3(0.95, 0.75, 0.1);
      mat.emissiveColor = c.isGoal
        ? new BJS.Color3(0.6, 0.4, 0.0)
        : new BJS.Color3(0.35, 0.25, 0.0);
      mesh.material = mat;
      glow.addIncludedOnlyMesh(mesh);
      this.coinMeshes.push(mesh);
    }

    // ── Enemy meshes ──────────────────────────────────────────────────────────
    for (const en of this.enemies) {
      const mesh = BJS.MeshBuilder.CreateSphere(`enemy_${en.x}`,
        { diameter: 0.85, segments: 10 }, scene);
      const mat  = new BJS.StandardMaterial(`emat_${en.x}`, scene);
      mat.diffuseColor  = new BJS.Color3(0.85, 0.18, 0.18);
      mat.emissiveColor = new BJS.Color3(0.35, 0.03, 0.03);
      mat.specularColor = new BJS.Color3(0.5, 0.1, 0.1);
      mesh.material = mat;
      glow.addIncludedOnlyMesh(mesh);
      this.enemyMeshes.push(mesh);
    }

    // ── Player meshes (body + head) ───────────────────────────────────────────
    const body = BJS.MeshBuilder.CreateCapsule('player',
      { radius: 0.32, height: 1.0, tessellation: 12, subdivisions: 4 }, scene);
    const bodyMat = new BJS.StandardMaterial('bodyMat', scene);
    bodyMat.diffuseColor  = new BJS.Color3(0.1, 0.55, 0.95);
    bodyMat.emissiveColor = new BJS.Color3(0.03, 0.18, 0.45);
    bodyMat.specularColor = new BJS.Color3(0.4, 0.7, 1.0);
    body.material = bodyMat;
    glow.addIncludedOnlyMesh(body);
    this.playerMesh = body;

    const head = BJS.MeshBuilder.CreateSphere('phead', { diameter: 0.42, segments: 8 }, scene);
    const headMat = new BJS.StandardMaterial('headMat', scene);
    headMat.diffuseColor  = new BJS.Color3(0.85, 0.80, 0.70);
    headMat.emissiveColor = new BJS.Color3(0.15, 0.12, 0.08);
    head.material = headMat;
    glow.addIncludedOnlyMesh(head);
    this.playerHead = head;

    // ── Particle system (landing/jump dust) ────────────────────────────────
    const dust = new BJS.ParticleSystem('dust', 60, scene);
    // Use a 1x1 white data-URI texture for cross-origin-safe particles
    dust.particleTexture  = new BJS.Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
      scene,
    );
    dust.emitter          = new BJS.Vector3(0, 0, 0);
    dust.minSize          = 0.08;
    dust.maxSize          = 0.22;
    dust.minLifeTime      = 0.2;
    dust.maxLifeTime      = 0.5;
    dust.minEmitPower     = 0.8;
    dust.maxEmitPower     = 2.0;
    dust.emitRate         = 0;
    dust.direction1       = new BJS.Vector3(-1.5, 1, -0.5);
    dust.direction2       = new BJS.Vector3(1.5,  2,  0.5);
    dust.color1 = new BJS.Color4(0.4, 0.65, 1.0, 0.8);
    dust.color2 = new BJS.Color4(0.2, 0.4,  0.8, 0.4);
    dust.colorDead = new BJS.Color4(0, 0, 0, 0);
    dust.gravity  = new BJS.Vector3(0, -4, 0);
    dust.start();
    this.dustPS = dust;

    // ── Render loop ────────────────────────────────────────────────────────
    engine.runRenderLoop(() => {
      if (this.disposed) return;
      this.tick();
      scene.render();
    });

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => { this.engine?.resize(); };

  setKeys(k: Set<string>) { this.keys = k; }
  setVpad(v: VPad)        { this.vpad = v; }

  // ── Physics & logic tick ──────────────────────────────────────────────────
  private tick() {
    if (!this.engine || !this.scene) return;
    this.animTick++;

    const isLeft  = this.keys.has('ArrowLeft')  || this.keys.has('KeyA')  || this.vpad.left;
    const isRight = this.keys.has('ArrowRight') || this.keys.has('KeyD')  || this.vpad.right;
    const isJump  = this.keys.has('ArrowUp')    || this.keys.has('KeyW')  || this.keys.has('Space') || this.vpad.jump;

    // Jump buffer — remember a fresh jump press for JBUF_MS frames
    const freshJump = isJump && !this.prevJump;
    if (freshJump) this.jBufFr = JBUF_MS;
    if (this.jBufFr > 0) this.jBufFr--;
    this.prevJump = isJump;

    // Horizontal movement — always applies regardless of jump state
    this.pvx = isRight ? WALK_SPD * PX_PER_BU
              : isLeft  ? -WALK_SPD * PX_PER_BU
              : 0;
    if (isRight) this.facingR = true;
    if (isLeft)  this.facingR = false;

    // Gravity
    this.pvy += GRAV * PX_PER_BU;
    if (this.pvy > MAX_FALL * PX_PER_BU) this.pvy = MAX_FALL * PX_PER_BU;

    // Move
    this.px += this.pvx;
    this.py += this.pvy;

    // World bounds (clamp left, don't scroll past right until goal)
    if (this.px < 0) { this.px = 0; this.pvx = 0; }

    // ── Platform collisions ───────────────────────────────────────────────
    const wasOnGround = this.onGround;
    this.onGround = false;

    const PW = 28, PH = 40; // player hitbox

    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      // Update moving platform
      if (p.type === 'moving' && p.moveRange && p.moveSpd) {
        p.curX += p.moveSpd * p.moveDir;
        if (p.curX > p.x + p.moveRange || p.curX < p.x - p.moveRange)
          p.moveDir *= -1;
      } else {
        p.curX = p.x;
      }

      // AABB collision (player bottom vs platform top)
      const px2 = this.px + PW, py2 = this.py + PH;
      const tx2 = p.curX + p.w,  ty2 = p.y + p.h;
      const tx  = p.curX,         ty  = p.y;

      if (px2 > tx && this.px < tx2 && py2 > ty && this.py < ty2) {
        const overlapT = py2 - ty;
        const overlapB = ty2 - this.py;
        const overlapL = px2 - tx;
        const overlapR = tx2 - this.px;
        const minOv    = Math.min(overlapT, overlapB, overlapL, overlapR);

        if (minOv === overlapT && this.pvy >= 0) {
          // Land on top
          this.py = ty - PH;
          this.pvy = 0;
          this.onGround = true;
          this.jumpCount = 0;
          // Moving platform drag
          if (p.type === 'moving') this.px += (p.moveSpd ?? 0) * p.moveDir;
        } else if (minOv === overlapB && this.pvy < 0) {
          // Hit ceiling
          this.py = ty2;
          this.pvy = 0;
        } else if (minOv === overlapL) {
          this.px = tx - PW;
          this.pvx = 0;
        } else if (minOv === overlapR) {
          this.px = tx2;
          this.pvx = 0;
        }
      }
    }

    // Coyote time
    if (wasOnGround && !this.onGround) {
      this.coyoteFr = COYOTE_MS;
    }
    if (this.onGround) this.coyoteFr = 0;
    if (this.coyoteFr > 0) this.coyoteFr--;

    // Jump: ground jump, coyote jump, or double-jump
    const canJump = this.onGround || this.coyoteFr > 0;
    if (this.jBufFr > 0) {
      if (canJump && this.jumpCount === 0) {
        this.pvy       = -JUMP_VY * PX_PER_BU;
        this.jumpCount = 1;
        this.jBufFr    = 0;
        this.coyoteFr  = 0;
        this.emitDust();
      } else if (!canJump && this.jumpCount === 1) {
        // Double-jump
        this.pvy       = -JUMP_VY * 0.85 * PX_PER_BU;
        this.jumpCount = 2;
        this.jBufFr    = 0;
        this.emitDust();
      }
    }

    // Fell off screen — die
    if (this.py > GH + 60) {
      this.lives--;
      this.cbs.onDie(this.lives);
      return;
    }

    // ── Coin collection ────────────────────────────────────────────────────
    const CW = 18, PCX = this.px + PW / 2, PCY = this.py + PH / 2;
    for (let i = 0; i < this.coins.length; i++) {
      const c = this.coins[i];
      if (c.collected) continue;
      const cx = c.x + CW / 2, cy = c.y + CW / 2;
      if (Math.abs(PCX - cx) < CW + 8 && Math.abs(PCY - cy) < CW + 8) {
        c.collected = true;
        if (this.coinMeshes[i]) {
          this.coinMeshes[i]!.setEnabled(false);
          this.coinMeshes[i] = null;
        }
        this.score += c.isGoal ? 500 : 100;
        this.cbs.onScore(this.score);
        if (c.isGoal) {
          this.cbs.onComplete(this.level + 1);
          return;
        }
      }
    }

    // ── Enemy collisions ──────────────────────────────────────────────────
    if (this.invincible > 0) this.invincible--;

    for (let i = 0; i < this.enemies.length; i++) {
      const en = this.enemies[i];
      if (!en.alive) continue;

      // Move enemy
      en.curX += en.vx;
      // Reverse at world edges
      const groundPlat = this.platforms.find(p => p.y === 400);
      const gLeft = groundPlat ? groundPlat.x : 0;
      const gRight = gLeft + (groundPlat ? groundPlat.w : this.worldW);
      if (en.curX < gLeft || en.curX > gRight - 32) en.vx *= -1;

      const ex2 = en.curX + 32, ey2 = en.curY + 32;
      const px2e = this.px + PW,    py2e = this.py + PH;

      if (px2e > en.curX && this.px < ex2 && py2e > en.curY && this.py < ey2) {
        const stompOv = py2e - en.curY;
        if (stompOv < 22 && this.pvy > 0) {
          // Stomp!
          en.alive = false;
          if (this.enemyMeshes[i]) {
            this.enemyMeshes[i]!.setEnabled(false);
            this.enemyMeshes[i] = null;
          }
          this.pvy   = -JUMP_VY * 0.7 * PX_PER_BU;
          this.score += 200;
          this.cbs.onScore(this.score);
        } else if (this.invincible === 0) {
          // Hit by enemy
          this.invincible = 90;
          this.lives--;
          this.cbs.onDie(this.lives);
          return;
        }
      }
    }

    // ── Smooth camera follow ─────────────────────────────────────────────
    const targetCamX = this.px - GW / 3;
    const maxCamX    = this.worldW - GW;
    this.camX += (Math.max(0, Math.min(maxCamX, targetCamX)) - this.camX) * 0.09;

    // ── Sync Babylon meshes ──────────────────────────────────────────────
    this.syncMeshes();
  }

  private emitDust() {
    if (!this.dustPS) return;
    const bx = (this.px + 14 - this.camX - GW / 2) / PX_PER_BU;
    const by = -(this.py + 40 - GH / 2) / PX_PER_BU;
    (this.dustPS.emitter as import('@babylonjs/core').Vector3).set(bx, by, 0);
    this.dustPS.manualEmitCount = 12;
  }

  private syncMeshes() {
    const toB = (lx: number, ly: number, lw = 0, lh = 0) => ({
      bx: (lx + lw / 2 - this.camX - GW / 2) / PX_PER_BU,
      by: -(ly + lh / 2 - GH / 2) / PX_PER_BU,
    });

    // Platforms
    for (let i = 0; i < this.platMeshes.length; i++) {
      const p = this.platforms[i];
      const { bx, by } = toB(p.curX, p.y, p.w, p.h);
      this.platMeshes[i].position.x = bx;
      this.platMeshes[i].position.y = by;
      this.platMeshes[i].position.z = 0;
    }

    // Coins
    const coinY = Math.sin(this.animTick * 0.05) * 0.1; // bob animation
    for (let i = 0; i < this.coinMeshes.length; i++) {
      const m = this.coinMeshes[i];
      if (!m) continue;
      const c = this.coins[i];
      const { bx, by } = toB(c.x, c.y, 18, 18);
      m.position.x = bx;
      m.position.y = by + coinY;
      m.position.z = 0.2;
      m.rotation.y = this.animTick * 0.04;
    }

    // Enemies
    for (let i = 0; i < this.enemyMeshes.length; i++) {
      const m = this.enemyMeshes[i];
      if (!m) continue;
      const en = this.enemies[i];
      const { bx, by } = toB(en.curX, en.curY, 32, 32);
      m.position.x = bx;
      m.position.y = by;
      m.position.z = 0;
      // Pulse
      const pulse = 1 + Math.sin(this.animTick * 0.1 + i) * 0.06;
      m.scaling.setAll(pulse);
    }

    // Player
    const PW = 28, PH = 40;
    const { bx: pbx, by: pby } = toB(this.px, this.py, PW, PH);
    if (this.playerMesh) {
      this.playerMesh.position.x = pbx;
      this.playerMesh.position.y = pby;
      this.playerMesh.position.z = 0;
      // Squash-stretch
      if (this.onGround) {
        this.playerMesh.scaling.x = 1.15;
        this.playerMesh.scaling.y = 0.88;
      } else {
        this.playerMesh.scaling.x = 0.88;
        this.playerMesh.scaling.y = 1.15;
      }
      this.playerMesh.scaling.z = 1;
      // Flicker when invincible
      this.playerMesh.setEnabled(this.invincible === 0 || (this.animTick & 4) !== 0);
    }
    if (this.playerHead) {
      this.playerHead.position.x = pbx + (this.facingR ? 0.1 : -0.1);
      this.playerHead.position.y = pby + 0.55;
      this.playerHead.position.z = 0;
      this.playerHead.setEnabled(this.invincible === 0 || (this.animTick & 4) !== 0);
    }

    // Parallax background
    if (this.bgPlane) {
      this.bgPlane.position.x = this.camX / PX_PER_BU * 0.2;
    }

    // Camera follows player smoothly in X
    if (this.camMesh) {
      // Camera X is fixed — mesh positions handle horizontal scrolling
      this.camMesh.position.x = 0;
    }
  }

  destroy() {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    this.dustPS?.stop();
    this.scene?.dispose();
    this.engine?.stopRenderLoop();
    this.engine?.dispose();
    this.engine = null;
    this.scene  = null;
  }
}

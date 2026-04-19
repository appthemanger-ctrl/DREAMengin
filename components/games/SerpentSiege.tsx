'use client';
/**
 * SERPENT SIEGE — fusion of snake + tower-defense + RTS.
 *
 * You pilot the head of an ever-growing serpent across a hex-style grid.
 * Each body segment becomes a static tower whose damage type is set by the
 * terrain beneath it (forest=arrow, ruins=mortar, water=slow). Enemy waves
 * funnel down lanes from the north toward the Mother Egg. You can re-route
 * mid-wave but cannot cross your own body. Defend or the brood dies.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useSubmitScore } from '@/lib/games/hooks';

const COLS = 22;
const ROWS = 16;
const CELL = 30;
const W = COLS * CELL;
const H = ROWS * CELL;

type Phase = 'menu' | 'playing' | 'victory' | 'defeat';
type Terrain = 'plain' | 'forest' | 'ruins' | 'water';
type SegmentKind = 'arrow' | 'mortar' | 'slow';
interface Pt { x: number; y: number; }
interface Segment extends Pt { kind: SegmentKind | null; cooldown: number; }
interface Enemy extends Pt { hp: number; maxHp: number; speed: number; slow: number; }
interface Projectile extends Pt { tx: number; ty: number; kind: SegmentKind; ttl: number; }

const COL = {
  bg: '#1a2516',
  plain: '#1d2a18',
  forest: '#1d4222',
  ruins: '#3a2a1a',
  water: '#13344a',
  serpent: '#7be074',
  serpentTail: '#3aa55a',
  egg: '#f3d76d',
  enemy: '#c8324f',
  arrow: '#cfe88a',
  mortar: '#f1924a',
  slow: '#76d8ff',
} as const;

function genTerrain(): Terrain[][] {
  const t: Terrain[][] = Array.from({ length: ROWS }, () => Array<Terrain>(COLS).fill('plain'));
  // sprinkle biomes
  for (let i = 0; i < 38; i++) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    const k: Terrain[] = ['forest', 'forest', 'ruins', 'water'];
    t[r][c] = k[Math.floor(Math.random() * k.length)];
  }
  // Mother Egg area (bottom-center) is always plain
  for (let r = ROWS - 3; r < ROWS; r++) for (let c = COLS / 2 - 2; c < COLS / 2 + 2; c++) t[r]![c | 0] = 'plain';
  return t;
}
const TERRAIN_KIND: Record<Terrain, SegmentKind | null> = {
  plain: null, forest: 'arrow', ruins: 'mortar', water: 'slow',
};

export default function SerpentSiege() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const terrainRef = useRef<Terrain[][]>(genTerrain());
  const headRef = useRef<Pt>({ x: 5, y: ROWS - 2 });
  const dirRef = useRef<Pt>({ x: 1, y: 0 });
  const nextDirRef = useRef<Pt>({ x: 1, y: 0 });
  const segmentsRef = useRef<Segment[]>([]);
  const eggRef = useRef<Pt>({ x: COLS / 2 | 0, y: ROWS - 2 });
  const eggHpRef = useRef(10);
  const enemiesRef = useRef<Enemy[]>([]);
  const projsRef = useRef<Projectile[]>([]);
  const waveRef = useRef(0);
  const waveStartRef = useRef(0);
  const moveAccumRef = useRef(0);
  const energyRef = useRef(0);
  const scoreRef = useRef(0);
  const [hud, setHud] = useState({ wave: 0, energy: 0, eggHp: 10, length: 0, score: 0 });
  const submit = useSubmitScore('serpent-siege');

  const start = useCallback(() => {
    terrainRef.current = genTerrain();
    headRef.current = { x: 5, y: ROWS - 2 };
    dirRef.current = { x: 1, y: 0 }; nextDirRef.current = { x: 1, y: 0 };
    segmentsRef.current = [];
    eggHpRef.current = 10;
    enemiesRef.current = []; projsRef.current = [];
    waveRef.current = 0; waveStartRef.current = performance.now();
    energyRef.current = 0; scoreRef.current = 0;
    setPhase('playing');
  }, [setPhase]);
  useGameAutoStart(phase === 'menu' ? start : null);
  useEffect(() => { if (phase === 'victory' || phase === 'defeat') submit(scoreRef.current); }, [phase, submit]);

  // Input
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const d = dirRef.current;
      if ((e.key === 'ArrowUp' || e.key === 'w') && d.y === 0) nextDirRef.current = { x: 0, y: -1 };
      if ((e.key === 'ArrowDown' || e.key === 's') && d.y === 0) nextDirRef.current = { x: 0, y: 1 };
      if ((e.key === 'ArrowLeft' || e.key === 'a') && d.x === 0) nextDirRef.current = { x: -1, y: 0 };
      if ((e.key === 'ArrowRight' || e.key === 'd') && d.x === 0) nextDirRef.current = { x: 1, y: 0 };
      if (e.key.startsWith('Arrow')) e.preventDefault();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0; let lastT = performance.now();

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;

      if (phaseRef.current === 'playing') {
        // Move serpent on a tick
        moveAccumRef.current += dt;
        const tick = 0.18;
        if (moveAccumRef.current >= tick) {
          moveAccumRef.current = 0;
          dirRef.current = nextDirRef.current;
          const newHead: Pt = { x: headRef.current.x + dirRef.current.x, y: headRef.current.y + dirRef.current.y };
          // Boundary check + self-collision
          const oob = newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS;
          const onSelf = segmentsRef.current.some((s) => s.x === newHead.x && s.y === newHead.y);
          if (oob || onSelf) {
            // can't move; stay still — serpent is stuck (penalty)
          } else {
            // Drop a segment behind head if there's energy or if we're growing first time
            const grow = energyRef.current >= 1 || segmentsRef.current.length < 4;
            if (grow) energyRef.current = Math.max(0, energyRef.current - 1);
            const oldHead = headRef.current;
            const ter = terrainRef.current[oldHead.y][oldHead.x];
            const seg: Segment = { x: oldHead.x, y: oldHead.y, kind: TERRAIN_KIND[ter], cooldown: 0 };
            if (grow) {
              segmentsRef.current.unshift(seg);
            } else {
              // shift body forward
              if (segmentsRef.current.length > 0) {
                segmentsRef.current.pop();
                segmentsRef.current.unshift(seg);
              }
            }
            headRef.current = newHead;
          }
        }

        // Wave management
        const waveElapsed = (t - waveStartRef.current) / 1000;
        if (enemiesRef.current.length === 0 && waveElapsed > 4 && waveRef.current > 0) {
          waveRef.current += 1; waveStartRef.current = t;
          if (waveRef.current > 5) { setPhase('victory'); }
        } else if (waveRef.current === 0 && waveElapsed > 3) {
          waveRef.current = 1; waveStartRef.current = t;
        }
        // Spawn enemies
        const spawnRate = 0.6 + waveRef.current * 0.25;
        if (waveRef.current > 0 && Math.random() < dt * spawnRate) {
          const lane = Math.floor(Math.random() * COLS);
          const hp = 6 + waveRef.current * 4;
          enemiesRef.current.push({ x: lane, y: 0, hp, maxHp: hp, speed: 0.8 + waveRef.current * 0.15, slow: 0 });
        }
        // Move enemies toward egg (greedy)
        for (const e of enemiesRef.current) {
          const sp = e.speed * (1 - e.slow * 0.6);
          e.slow = Math.max(0, e.slow - dt);
          const dx = Math.sign(eggRef.current.x - e.x);
          const dy = Math.sign(eggRef.current.y - e.y);
          if (Math.random() < 0.6) e.y += sp * dt; else e.x += dx * sp * dt;
          e.y = Math.min(e.y, ROWS - 0.5);
          // Damage egg when reaching
          if (Math.abs(e.x - eggRef.current.x) < 1 && Math.abs(e.y - eggRef.current.y) < 1) {
            eggHpRef.current -= 1; e.hp = 0;
          }
        }

        // Towers fire
        for (const s of segmentsRef.current) {
          if (!s.kind) continue;
          s.cooldown -= dt;
          if (s.cooldown > 0) continue;
          const range = s.kind === 'mortar' ? 6 : 4;
          let target: Enemy | null = null; let bestD = Infinity;
          for (const e of enemiesRef.current) {
            const d = Math.hypot(e.x - s.x, e.y - s.y);
            if (d < range && d < bestD) { bestD = d; target = e; }
          }
          if (target) {
            projsRef.current.push({ x: s.x, y: s.y, tx: target.x, ty: target.y, kind: s.kind, ttl: 0.5 });
            s.cooldown = s.kind === 'arrow' ? 0.6 : s.kind === 'mortar' ? 1.4 : 1.0;
          }
        }
        for (const p of projsRef.current) p.ttl -= dt;
        // Resolve projectiles on impact (instant — used as visuals)
        for (const p of projsRef.current) {
          if (p.ttl <= 0) {
            for (const e of enemiesRef.current) {
              if (Math.abs(e.x - p.tx) < 1 && Math.abs(e.y - p.ty) < 1) {
                if (p.kind === 'arrow') e.hp -= 4;
                if (p.kind === 'mortar') e.hp -= 8;
                if (p.kind === 'slow') { e.hp -= 2; e.slow = 1; }
              }
            }
          }
        }
        projsRef.current = projsRef.current.filter((p) => p.ttl > 0);
        // Award energy + score on kills
        for (const e of enemiesRef.current) if (e.hp <= 0) { energyRef.current += 1; scoreRef.current += 25; }
        enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);

        if (eggHpRef.current <= 0) setPhase('defeat');
      }

      // ── Render ───────────────────────────────────────────────────────────
      ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
      // Terrain
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const ter = terrainRef.current[r][c];
        ctx.fillStyle = ter === 'forest' ? COL.forest : ter === 'ruins' ? COL.ruins : ter === 'water' ? COL.water : COL.plain;
        ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
      }
      // Egg
      ctx.fillStyle = COL.egg; ctx.shadowColor = COL.egg; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.ellipse(eggRef.current.x * CELL + CELL / 2, eggRef.current.y * CELL + CELL / 2, CELL * 0.7, CELL * 0.85, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // egg HP bar
      ctx.fillStyle = '#000'; ctx.fillRect(eggRef.current.x * CELL - 8, eggRef.current.y * CELL - 12, 44, 5);
      ctx.fillStyle = COL.egg; ctx.fillRect(eggRef.current.x * CELL - 8, eggRef.current.y * CELL - 12, 44 * (eggHpRef.current / 10), 5);

      // Serpent body segments
      for (const s of segmentsRef.current) {
        ctx.fillStyle = s.kind === 'arrow' ? COL.arrow : s.kind === 'mortar' ? COL.mortar : s.kind === 'slow' ? COL.slow : COL.serpentTail;
        ctx.fillRect(s.x * CELL + 3, s.y * CELL + 3, CELL - 6, CELL - 6);
      }
      // Head
      ctx.fillStyle = COL.serpent; ctx.shadowColor = COL.serpent; ctx.shadowBlur = 10;
      ctx.fillRect(headRef.current.x * CELL + 2, headRef.current.y * CELL + 2, CELL - 4, CELL - 4);
      ctx.shadowBlur = 0;

      // Enemies
      for (const e of enemiesRef.current) {
        ctx.fillStyle = COL.enemy;
        ctx.beginPath(); ctx.arc(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, CELL * 0.35, 0, Math.PI * 2); ctx.fill();
        // hp
        ctx.fillStyle = '#000'; ctx.fillRect(e.x * CELL, e.y * CELL - 5, CELL, 3);
        ctx.fillStyle = COL.enemy; ctx.fillRect(e.x * CELL, e.y * CELL - 5, CELL * (e.hp / e.maxHp), 3);
      }

      // Projectiles
      for (const p of projsRef.current) {
        ctx.strokeStyle = p.kind === 'arrow' ? COL.arrow : p.kind === 'mortar' ? COL.mortar : COL.slow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x * CELL + CELL / 2, p.y * CELL + CELL / 2);
        ctx.lineTo(p.tx * CELL + CELL / 2, p.ty * CELL + CELL / 2);
        ctx.stroke();
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phaseRef, setPhase]);

  // HUD pump
  useEffect(() => {
    if (phase !== 'playing') return;
    const iv = setInterval(() => setHud({
      wave: waveRef.current, energy: energyRef.current,
      eggHp: eggHpRef.current, length: segmentsRef.current.length,
      score: scoreRef.current,
    }), 150);
    return () => clearInterval(iv);
  }, [phase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 12, background: 'linear-gradient(180deg, #0c130a 0%, #1d2a18 100%)', color: '#dceacf', minHeight: '100%', fontFamily: '"Courier New", monospace' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: W }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', height: 'auto', maxWidth: W, borderRadius: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }} />
        {phase === 'menu' && (
          <Overlay>
            <h1 style={{ color: COL.serpent, fontSize: 36, margin: 0, letterSpacing: 4 }}>🐍 SERPENT SIEGE</h1>
            <p style={{ maxWidth: 460, textAlign: 'center', color: '#bcd2ad', lineHeight: 1.5 }}>
              You hatched first. Defend the Mother Egg from the Vermillion Choir. Your body is your build order — terrain decides what each segment becomes.
            </p>
            <p style={{ color: COL.arrow, fontSize: 12 }}>Forest = arrow · Ruins = mortar · Water = slow · WASD/arrows steer</p>
            <button onClick={start} style={btn}>Hatch</button>
          </Overlay>
        )}
        {phase === 'victory' && (<Overlay><h1 style={{ color: COL.serpent }}>The Choir falls silent.</h1><p>Score: {scoreRef.current}</p><button onClick={start} style={btn}>Re-merge the Broods</button></Overlay>)}
        {phase === 'defeat' && (<Overlay><h1 style={{ color: COL.enemy }}>The Egg cracks.</h1><p>Score: {scoreRef.current}</p><button onClick={start} style={btn}>Re-hatch</button></Overlay>)}
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
        <span>WAVE {hud.wave}/5</span>
        <span style={{ color: COL.serpent }}>LEN {hud.length}</span>
        <span style={{ color: COL.egg }}>EGG {hud.eggHp}/10</span>
        <span style={{ color: COL.arrow }}>ENERGY {hud.energy}</span>
        <span>SCORE {hud.score}</span>
      </div>
    </div>
  );
}

const Overlay = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'radial-gradient(ellipse at center, rgba(12,19,10,0.85), rgba(12,19,10,0.97))', borderRadius: 4 }}>{children}</div>
);
const btn: React.CSSProperties = {
  background: 'linear-gradient(180deg, #1d2a18 0%, #0c130a 100%)',
  border: `1px solid ${COL.serpent}`, color: COL.serpent,
  padding: '10px 26px', borderRadius: 4, fontSize: 14, letterSpacing: 3, cursor: 'pointer',
  fontFamily: 'inherit',
};

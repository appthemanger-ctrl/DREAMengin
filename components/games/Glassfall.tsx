'use client';
/**
 * GLASSFALL — fusion of breakout + tetris + match-3.
 *
 * Tetrominoes drift down a stained-crystal tower. A paddle below bounces a
 * shard upward to chip a single colored cell off a tetromino — that cell
 * becomes a free gem that falls and settles. Three-in-a-row clears them and
 * the surrounding row of stuck blocks. Garbage rises from the bottom on a
 * metronome. You climb the Architect's tower one floor at a time.
 *
 * Render: 2-D canvas, dithered stained-crystal sunset, pixel-rim outlines.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useSubmitScore } from '@/lib/games/hooks';

const COLS = 12;
const ROWS = 18;
const CELL = 28;
const W = COLS * CELL;
const H = ROWS * CELL + 80;

type Phase = 'menu' | 'playing' | 'cleared' | 'crushed';
type CellColor = 0 | 1 | 2 | 3 | 4;
const COL: Record<Exclude<CellColor, 0>, string> = {
  1: '#ff7da8', // rose
  2: '#ffce5e', // gold
  3: '#a78bfa', // violet
  4: '#5fd1f0', // teal
};
const TETROMINOES: Array<Array<[number, number]>> = [
  [[0, 0], [0, 1], [0, 2], [0, 3]],   // I
  [[0, 0], [0, 1], [1, 0], [1, 1]],   // O
  [[0, 1], [1, 0], [1, 1], [1, 2]],   // T
  [[0, 0], [1, 0], [1, 1], [1, 2]],   // J
  [[0, 2], [1, 0], [1, 1], [1, 2]],   // L
];

interface ShardState { x: number; y: number; vx: number; vy: number; color: Exclude<CellColor, 0>; }
interface FallingPiece { cells: Array<[number, number]>; cx: number; cy: number; color: Exclude<CellColor, 0>; }

export default function Glassfall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const gridRef = useRef<CellColor[][]>(Array.from({ length: ROWS }, () => Array<CellColor>(COLS).fill(0)));
  const pieceRef = useRef<FallingPiece | null>(null);
  const shardRef = useRef<ShardState | null>(null);
  const paddleXRef = useRef(W / 2);
  const lastFallRef = useRef(0);
  const lastGarbageRef = useRef(0);
  const scoreRef = useRef(0);
  const floorRef = useRef(1);
  const keysRef = useRef<Set<string>>(new Set());
  const submit = useSubmitScore('glassfall');

  const spawnPiece = useCallback(() => {
    const t = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    const color = (1 + Math.floor(Math.random() * 4)) as Exclude<CellColor, 0>;
    pieceRef.current = { cells: t.map(([r, c]) => [r, c] as [number, number]), cx: 4, cy: 0, color };
  }, []);

  const launchShard = useCallback(() => {
    if (shardRef.current) return;
    shardRef.current = { x: paddleXRef.current, y: H - 90, vx: 0, vy: -380, color: 4 };
  }, []);

  const start = useCallback(() => {
    gridRef.current = Array.from({ length: ROWS }, () => Array<CellColor>(COLS).fill(0));
    paddleXRef.current = W / 2;
    shardRef.current = null;
    scoreRef.current = 0; floorRef.current = 1;
    spawnPiece();
    setPhase('playing');
  }, [spawnPiece, setPhase]);
  useGameAutoStart(phase === 'menu' ? start : null);
  useEffect(() => { if (phase === 'cleared' || phase === 'crushed') submit(scoreRef.current); }, [phase, submit]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === ' ') { e.preventDefault(); launchShard(); }
      if (e.key.startsWith('Arrow')) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [launchShard]);

  // Settle gems via gravity + match-3 sweep
  const settleAndMatch = useCallback(() => {
    const g = gridRef.current;
    // gravity pass — drop free cells
    for (let c = 0; c < COLS; c++) {
      let writeR = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (g[r][c] !== 0) { const v = g[r][c]; g[r][c] = 0; g[writeR][c] = v; writeR--; }
      }
    }
    // detect 3+ runs (rows + cols)
    const remove: boolean[][] = Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));
    for (let r = 0; r < ROWS; r++) {
      let run = 1;
      for (let c = 1; c <= COLS; c++) {
        if (c < COLS && g[r][c] !== 0 && g[r][c] === g[r][c - 1]) run++;
        else { if (run >= 3) for (let k = 1; k <= run; k++) remove[r][c - k] = true; run = 1; }
      }
    }
    for (let c = 0; c < COLS; c++) {
      let run = 1;
      for (let r = 1; r <= ROWS; r++) {
        if (r < ROWS && g[r][c] !== 0 && g[r][c] === g[r - 1][c]) run++;
        else { if (run >= 3) for (let k = 1; k <= run; k++) remove[r - k][c] = true; run = 1; }
      }
    }
    let cleared = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (remove[r][c]) { g[r][c] = 0; cleared++; }
    if (cleared > 0) {
      scoreRef.current += cleared * 25;
      // Cascade
      setTimeout(settleAndMatch, 120);
    }
    // Crush check (top row populated)
    for (let c = 0; c < COLS; c++) if (g[0][c] !== 0) { setPhase('crushed'); return; }
    // Floor clear: top half mostly empty
    if (g.slice(0, ROWS / 2).every((row) => row.every((v) => v === 0)) && scoreRef.current > floorRef.current * 200) {
      floorRef.current += 1;
      if (floorRef.current > 5) setPhase('cleared');
    }
  }, [setPhase]);

  // Loop
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0; let lastT = performance.now();

    const lockPiece = () => {
      const p = pieceRef.current; if (!p) return;
      for (const [dr, dc] of p.cells) {
        const r = p.cy + dr, c = p.cx + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) gridRef.current[r][c] = p.color;
      }
      pieceRef.current = null;
      settleAndMatch();
      spawnPiece();
    };

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;

      if (phaseRef.current === 'playing') {
        // paddle
        const k = keysRef.current;
        if (k.has('ArrowLeft') || k.has('a')) paddleXRef.current -= 320 * dt;
        if (k.has('ArrowRight') || k.has('d')) paddleXRef.current += 320 * dt;
        paddleXRef.current = Math.max(40, Math.min(W - 40, paddleXRef.current));

        // Falling tetromino
        if (t - lastFallRef.current > 700) {
          lastFallRef.current = t;
          const p = pieceRef.current;
          if (p) {
            // Try descend
            let collide = false;
            for (const [dr, dc] of p.cells) {
              const nr = p.cy + dr + 1, nc = p.cx + dc;
              if (nr >= ROWS || (nr >= 0 && gridRef.current[nr][nc] !== 0)) { collide = true; break; }
            }
            if (collide) lockPiece();
            else p.cy += 1;
          }
        }

        // Garbage rises every 8s
        if (t - lastGarbageRef.current > 8_000 && lastGarbageRef.current > 0) {
          lastGarbageRef.current = t;
          // shift up
          for (let r = 0; r < ROWS - 1; r++) gridRef.current[r] = gridRef.current[r + 1];
          gridRef.current[ROWS - 1] = Array.from({ length: COLS }, () => (Math.random() < 0.6 ? (1 + Math.floor(Math.random() * 4)) : 0) as CellColor);
        } else if (lastGarbageRef.current === 0) lastGarbageRef.current = t;

        // Shard
        const s = shardRef.current;
        if (s) {
          s.x += s.vx * dt; s.y += s.vy * dt;
          if (s.x < 8 || s.x > W - 8) s.vx *= -1;
          // Bounce off paddle
          if (s.y > H - 100 && s.y < H - 80 && Math.abs(s.x - paddleXRef.current) < 40) {
            s.vy = -Math.abs(s.vy) - 12;
            s.vx = (s.x - paddleXRef.current) * 6;
          }
          // Hit grid cell — chip & free as gem
          const gr = Math.floor(s.y / CELL);
          const gc = Math.floor(s.x / CELL);
          if (gr >= 0 && gr < ROWS && gc >= 0 && gc < COLS && gridRef.current[gr][gc] !== 0) {
            s.color = gridRef.current[gr][gc] as Exclude<CellColor, 0>;
            gridRef.current[gr][gc] = 0;
            s.vy = Math.abs(s.vy);
            scoreRef.current += 8;
            settleAndMatch();
          }
          // Hit falling piece — chip
          const pp = pieceRef.current;
          if (pp) {
            for (const [dr, dc] of pp.cells) {
              const cellX = (pp.cx + dc) * CELL + CELL / 2;
              const cellY = (pp.cy + dr) * CELL + CELL / 2;
              if (Math.hypot(s.x - cellX, s.y - cellY) < 14) {
                // chip this cell — drop a gem at its location
                gridRef.current[Math.min(ROWS - 1, pp.cy + dr + 1)][pp.cx + dc] = pp.color;
                pp.cells = pp.cells.filter(([r, c]) => !(r === dr && c === dc));
                if (pp.cells.length === 0) { pieceRef.current = null; spawnPiece(); }
                s.vy = Math.abs(s.vy);
                scoreRef.current += 12;
                settleAndMatch();
                break;
              }
            }
          }
          if (s.y > H - 50) shardRef.current = null;
        }
      }

      // ── Render ───────────────────────────────────────────────────────────
      // Sunset gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#411541'); grad.addColorStop(0.6, '#a3346e'); grad.addColorStop(1, '#1a0c1a');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      // Dither bands
      for (let y = 0; y < H; y += 4) { ctx.fillStyle = `rgba(0,0,0,${(y % 8 === 0) ? 0.06 : 0})`; ctx.fillRect(0, y, W, 2); }
      // Grid backdrop
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, ROWS * CELL);

      // Cells
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const v = gridRef.current[r][c]; if (v === 0) continue;
        ctx.fillStyle = COL[v as Exclude<CellColor, 0>];
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
        ctx.strokeRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }
      // Falling piece
      const p = pieceRef.current;
      if (p) {
        ctx.fillStyle = COL[p.color]; ctx.shadowColor = COL[p.color]; ctx.shadowBlur = 8;
        for (const [dr, dc] of p.cells) ctx.fillRect((p.cx + dc) * CELL + 2, (p.cy + dr) * CELL + 2, CELL - 4, CELL - 4);
        ctx.shadowBlur = 0;
      }
      // Paddle
      ctx.fillStyle = '#ffe8c0';
      ctx.fillRect(paddleXRef.current - 40, H - 90, 80, 10);
      // Shard
      const s = shardRef.current;
      if (s) {
        ctx.fillStyle = COL[s.color]; ctx.shadowColor = COL[s.color]; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      // HUD
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left';
      ctx.fillText(`SCORE ${scoreRef.current}`, 10, H - 30);
      ctx.fillText(`FLOOR ${floorRef.current}/5`, 10, H - 14);
      ctx.textAlign = 'right';
      ctx.fillText('SPACE = launch shard', W - 10, H - 14);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phaseRef, settleAndMatch, spawnPiece]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 12, background: 'linear-gradient(180deg, #20081a 0%, #3a0d2c 100%)', color: '#ffe8c0', minHeight: '100%', fontFamily: '"Courier New", monospace' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: W }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', height: 'auto', maxWidth: W, borderRadius: 4, boxShadow: '0 0 60px rgba(255,125,168,0.18) inset, 0 8px 30px rgba(0,0,0,0.7)' }} />
        {phase === 'menu' && (
          <Overlay>
            <h1 style={{ color: '#ff7da8', margin: 0, fontSize: 32, letterSpacing: 4 }}>🔻 GLASSFALL</h1>
            <p style={{ maxWidth: 460, textAlign: 'center', lineHeight: 1.5 }}>
              You are a Catcher. Carve the Architect&apos;s falling tower — bounce shards up, settle gems, push the garbage back down.
            </p>
            <p style={{ color: '#ffe8c0', fontSize: 12 }}>← → paddle · SPACE launch shard</p>
            <button onClick={start} style={btn}>Catch the City</button>
          </Overlay>
        )}
        {phase === 'cleared' && (<Overlay><h1 style={{ color: '#ffce5e' }}>You climb past the Architect.</h1><p>Score: {scoreRef.current}</p><button onClick={start} style={btn}>Reset the Tower</button></Overlay>)}
        {phase === 'crushed' && (<Overlay><h1 style={{ color: '#ff7da8' }}>The tower buries you.</h1><p>Score: {scoreRef.current}</p><button onClick={start} style={btn}>Catch Again</button></Overlay>)}
      </div>
    </div>
  );
}

const Overlay = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'radial-gradient(ellipse at center, rgba(32,8,26,0.85), rgba(32,8,26,0.97))', borderRadius: 4 }}>{children}</div>
);
const btn: React.CSSProperties = {
  background: 'linear-gradient(180deg, #5a1638 0%, #20081a 100%)',
  border: '1px solid #ff7da8', color: '#ff7da8',
  padding: '10px 26px', borderRadius: 4, fontSize: 14, letterSpacing: 3, cursor: 'pointer',
  fontFamily: 'inherit',
};

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
import { ParticlePool, ScreenShake, prefersReducedMotion } from './_fx/canvasFx';

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

export default function Glassfall( {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const gridRef = useRef<CellColor[][]>(Array.from({ length: ROWS }, () => Array<CellColor>(COLS).fill(0)));
  const pieceRef = useRef<FallingPiece | null>(null);
  const shardRef = useRef<ShardState | null>(null);
  const paddleXRef = useRef(W / 2);
  const PADDLE_W = 80;
  const PADDLE_CURVATURE = 0.35;   // 0 = flat, 1 = strong dome
  const particlesRef = useRef(new ParticlePool(220));
  const shakeRef = useRef(new ScreenShake(6));
  const reducedMotionRef = useRef(false);
  const lastFallRef = useRef(0);
  const lastGarbageRef = useRef(0);
  const scoreRef = useRef(0);
  const floorRef = useRef(1);
  const garbageMeterRef = useRef(0);            // 0..1, time since last garbage rise
  const keysRef = useRef<Set<string>>(new Set());
  const submit = useSubmitScore('glassfall');

  /** Rotate a tetromino 90° clockwise around its bounding box. */
  const rotateCells = useCallback((cells: Array<[number, number]>): Array<[number, number]> => {
    let maxC = 0;
    for (const [, c] of cells) if (c > maxC) maxC = c;
    return cells.map(([r, c]) => [c, maxC - r] as [number, number]);
  }, []);

  const tryRotate = useCallback(() => {
    const p = pieceRef.current; if (!p) return;
    const next = rotateCells(p.cells);
    // Validate against grid + bounds
    for (const [dr, dc] of next) {
      const r = p.cy + dr, c = p.cx + dc;
      if (c < 0 || c >= COLS || r >= ROWS) return;
      if (r >= 0 && gridRef.current[r][c] !== 0) return;
    }
    p.cells = next;
  }, [rotateCells]);

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
      if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); tryRotate(); }
      if (e.key.startsWith('Arrow')) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [launchShard, tryRotate]);
  useEffect(() => { reducedMotionRef.current = prefersReducedMotion(); }, []);

  // Settle gems via gravity + cluster sweep (any orthogonal cluster ≥3 same color)
  const settleAndMatch = useCallback(() => {
    const g = gridRef.current;
    // gravity pass — drop free cells
    for (let c = 0; c < COLS; c++) {
      let writeR = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (g[r][c] !== 0) { const v = g[r][c]; g[r][c] = 0; g[writeR][c] = v; writeR--; }
      }
    }
    // detect orthogonal clusters via flood-fill — clusters of size ≥3 are removed
    const remove: boolean[][] = Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));
    const seen: boolean[][] = Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (seen[r][c] || g[r][c] === 0) continue;
      const color = g[r][c];
      const stack: Array<[number, number]> = [[r, c]];
      const cluster: Array<[number, number]> = [];
      while (stack.length) {
        const [cr, cc] = stack.pop()!;
        if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue;
        if (seen[cr][cc] || g[cr][cc] !== color) continue;
        seen[cr][cc] = true;
        cluster.push([cr, cc]);
        stack.push([cr + 1, cc], [cr - 1, cc], [cr, cc + 1], [cr, cc - 1]);
      }
      if (cluster.length >= 3) for (const [cr, cc] of cluster) remove[cr][cc] = true;
    }
    let cleared = 0;
    const burstSpots: Array<[number, number, Exclude<CellColor, 0>]> = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (remove[r][c]) {
      burstSpots.push([r, c, g[r][c] as Exclude<CellColor, 0>]);
      g[r][c] = 0; cleared++;
    }
    if (cleared > 0) {
      scoreRef.current += cleared * 25;
      shakeRef.current.kick(cleared >= 6 ? 6 : 3);
      // Rainbow shatter burst per cleared cell
      for (const [r, c, col] of burstSpots) {
        particlesRef.current.burst(c * CELL + CELL / 2, r * CELL + CELL / 2, 6, { color: COL[col], speed: 130, size: 1.6, maxLife: 0.5, drag: 0.9, gravity: 240 });
      }
      setTimeout(settleAndMatch, 120);
    }
    for (let c = 0; c < COLS; c++) if (g[0][c] !== 0) { setPhase('crushed'); return; }
    if (g.slice(0, ROWS / 2).every((row: Record<string, unknown>) => row.every((v: Record<string, unknown>) => v === 0)) && scoreRef.current > floorRef.current * 200) {
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

        // Garbage rises every 8s (and fill the meter that ticks toward it)
        garbageMeterRef.current = Math.min(1, ((t - lastGarbageRef.current) % 8000) / 8000);
        if (t - lastGarbageRef.current > 8_000 && lastGarbageRef.current > 0) {
          lastGarbageRef.current = t;
          // shift up
          for (let r = 0; r < ROWS - 1; r++) gridRef.current[r] = gridRef.current[r + 1];
          gridRef.current[ROWS - 1] = Array.from({ length: COLS }, () => (Math.random() < 0.6 ? (1 + Math.floor(Math.random() * 4)) : 0) as CellColor);
        } else if (lastGarbageRef.current === 0) lastGarbageRef.current = t;

        // Shard with curved-paddle reflection (real angle of incidence)
        const s = shardRef.current;
        if (s) {
          // Apply gravity for free travel
          s.vy += 80 * dt;
          s.x += s.vx * dt; s.y += s.vy * dt;
          if (s.x < 8) { s.x = 8; s.vx = -s.vx * 0.95; }
          if (s.x > W - 8) { s.x = W - 8; s.vx = -s.vx * 0.95; }
          // Curved paddle: surface y is offset by curvature based on horizontal distance from center.
          // Treat the paddle as a circular arc whose center is below the visible bar.
          const px = paddleXRef.current;
          if (s.y > H - 100 && s.y < H - 78 && Math.abs(s.x - px) < PADDLE_W / 2 + 6) {
            // Local x position relative to paddle center, in [-1..1]
            const u = (s.x - px) / (PADDLE_W / 2);
            // Surface tangent slope at u (curve depth proportional to PADDLE_CURVATURE)
            // Approximate normal with angle = u * tilt
            const tilt = PADDLE_CURVATURE * 1.1;
            const normAng = u * tilt;            // radians, normal tilts away from center
            // Reflect velocity around the surface normal
            const nx = Math.sin(normAng), ny = -Math.cos(normAng);
            const dot = s.vx * nx + s.vy * ny;
            s.vx = s.vx - 2 * dot * nx;
            s.vy = s.vy - 2 * dot * ny;
            // Slight speed-up
            s.vx *= 1.04; s.vy *= 1.04;
            // Push out of paddle
            s.y = H - 100;
            // Sparkle dimming trail
            particlesRef.current.burst(s.x, s.y, 6, { color: '#ffe8c0', speed: 80, size: 1.4, maxLife: 0.4, drag: 0.9 });
          }
          // Hit grid cell — chip & free as gem
          const gr = Math.floor(s.y / CELL);
          const gc = Math.floor(s.x / CELL);
          if (gr >= 0 && gr < ROWS && gc >= 0 && gc < COLS && gridRef.current[gr][gc] !== 0) {
            s.color = gridRef.current[gr][gc] as Exclude<CellColor, 0>;
            gridRef.current[gr][gc] = 0;
            s.vy = Math.abs(s.vy);
            scoreRef.current += 8;
            particlesRef.current.burst(gc * CELL + CELL / 2, gr * CELL + CELL / 2, 8, { color: COL[s.color], speed: 110, size: 1.5, maxLife: 0.4, drag: 0.9, gravity: 200 });
            settleAndMatch();
          }
          // Hit falling piece — chip
          const pp = pieceRef.current;
          if (pp) {
            for (const [dr, dc] of pp.cells) {
              const cellX = (pp.cx + dc) * CELL + CELL / 2;
              const cellY = (pp.cy + dr) * CELL + CELL / 2;
              if (Math.hypot(s.x - cellX, s.y - cellY) < 14) {
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
          // Sparkle dimming trail every frame
          if (Math.random() < 0.5) particlesRef.current.emit({ x: s.x, y: s.y, vx: 0, vy: 20, color: COL[s.color], size: 1.2, maxLife: 0.25, drag: 0.92 });
          if (s.y > H - 50) shardRef.current = null;
        }

        // Step shared FX
        particlesRef.current.step(dt);
        shakeRef.current.step(dt);
      }

      // ── Render ───────────────────────────────────────────────────────────
      // Sunset gradient (with sun-disc + cloud silhouettes parallax)
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#411541'); grad.addColorStop(0.6, '#a3346e'); grad.addColorStop(1, '#1a0c1a');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      // Sun disc
      ctx.fillStyle = 'rgba(255,206,94,0.45)'; ctx.shadowColor = '#ffce5e'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(W * 0.5, H * 0.32, 50, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      // Cloud silhouettes
      ctx.fillStyle = 'rgba(20,8,26,0.55)';
      const drift = reducedMotionRef.current ? 0 : (t / 80) % (W + 200);
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 180 - drift) + W * 2) % (W + 200) - 100;
        const cy = 80 + i * 30;
        ctx.beginPath(); ctx.ellipse(cx, cy, 70, 14, 0, 0, Math.PI * 2); ctx.fill();
      }
      // Dither bands
      for (let y = 0; y < H; y += 4) { ctx.fillStyle = `rgba(0,0,0,${(y % 8 === 0) ? 0.06 : 0})`; ctx.fillRect(0, y, W, 2); }

      ctx.save();
      shakeRef.current.apply(ctx, reducedMotionRef.current ? 0.2 : 1);
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
      // Falling piece (with chromatic-aberration tint)
      const p = pieceRef.current;
      if (p) {
        // Subtle CA shadow offset behind
        ctx.fillStyle = 'rgba(127,209,240,0.25)';
        for (const [dr, dc] of p.cells) ctx.fillRect((p.cx + dc) * CELL + 4, (p.cy + dr) * CELL + 2, CELL - 4, CELL - 4);
        ctx.fillStyle = 'rgba(255,125,168,0.25)';
        for (const [dr, dc] of p.cells) ctx.fillRect((p.cx + dc) * CELL, (p.cy + dr) * CELL + 2, CELL - 4, CELL - 4);
        ctx.fillStyle = COL[p.color]; ctx.shadowColor = COL[p.color]; ctx.shadowBlur = 10;
        for (const [dr, dc] of p.cells) ctx.fillRect((p.cx + dc) * CELL + 2, (p.cy + dr) * CELL + 2, CELL - 4, CELL - 4);
        ctx.shadowBlur = 0;
      }
      // Curved paddle (anisotropic specular streak)
      const px = paddleXRef.current;
      ctx.fillStyle = '#ffe8c0';
      ctx.beginPath();
      ctx.moveTo(px - PADDLE_W / 2, H - 90);
      // top arc — curved upward
      const segs = 12;
      for (let i = 0; i <= segs; i++) {
        const u = (i / segs) * 2 - 1;
        const x = px + u * PADDLE_W / 2;
        const y = H - 90 - Math.cos(u * Math.PI / 2) * PADDLE_CURVATURE * 14;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(px + PADDLE_W / 2, H - 80);
      ctx.lineTo(px - PADDLE_W / 2, H - 80);
      ctx.closePath();
      ctx.fill();
      // Spec streak
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px - PADDLE_W / 2 + 6, H - 88); ctx.lineTo(px + PADDLE_W / 2 - 6, H - 88); ctx.stroke();

      // Shard
      const s = shardRef.current;
      if (s) {
        ctx.fillStyle = COL[s.color]; ctx.shadowColor = COL[s.color]; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Particles
      particlesRef.current.draw(ctx);
      ctx.restore();

      // ── Minimal HUD ── score chip top-right + thin garbage-rise meter on side
      // Score chip
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(W - 88, 6, 82, 18);
      ctx.fillStyle = '#ffe8c0'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'right';
      ctx.fillText(String(scoreRef.current), W - 12, 19);
      // Garbage-rise meter on left edge
      const meterH = ROWS * CELL;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, 4, meterH);
      ctx.fillStyle = '#ff7da8'; ctx.fillRect(0, meterH * (1 - garbageMeterRef.current), 4, meterH * garbageMeterRef.current);
      // Tiny floor pip top-left
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < floorRef.current ? '#ffce5e' : 'rgba(255,206,94,0.2)';
        ctx.fillRect(10 + i * 8, 10, 5, 5);
      }

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

'use client';
/**
 * AVENUE OF MIRRORS — fusion of lucid-avenue + maze + memory-grid.
 *
 * First-person dream-walk. The maze rebuilds itself the moment you stop
 * looking. You only navigate by glyph-grids you must memorize at each Mirror,
 * then recall at the next gate. Watchers cannot be killed; lose them by
 * deliberately disorienting yourself.
 *
 * Render: 2-D canvas, raycaster-style strip projection of a 16×16 maze,
 * silent-hill fog grey, pool tile teal, distance-fog cutoff at 8 cells.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useSubmitScore } from '@/lib/games/hooks';

const MAP_N = 16;
const VIEW_W = 640;
const VIEW_H = 360;
const FOV = Math.PI / 3;
const FOG_DIST = 8;

type Phase = 'menu' | 'walking' | 'memorize' | 'recall' | 'victory' | 'defeat';

const COL = {
  ceil: '#1c1f24',
  floor: '#0d1416',
  wall: '#5b6770',
  wallDark: '#2c3540',
  pool: '#2c8e8e',
  fog: '#0a0d10',
  glyph: '#e8efe8',
  watcher: '#ff5577',
  ui: '#9fb3a4',
  accent: '#7fb6b1',
  panel: 'rgba(12,18,20,0.85)',
} as const;

function newMaze(: number[][]) {
  // Recursive backtracker
  const m: number[][] = Array.from({ length: MAP_N }, () => Array<number>(MAP_N).fill(1));
  const stack: Array<[number, number]> = [[1, 1]];
  m[1][1] = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const opts: Array<[number, number]> = [];
    for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < MAP_N - 1 && ny > 0 && ny < MAP_N - 1 && m[ny][nx] === 1) opts.push([nx, ny]);
    }
    if (opts.length === 0) { stack.pop(); continue; }
    const [nx, ny] = opts[Math.floor(Math.random() * opts.length)];
    m[(y + ny) / 2][(x + nx) / 2] = 0;
    m[ny][nx] = 0;
    stack.push([nx, ny]);
  }
  return m;
}

function makeGlyphGrid(size: number: string[][]) {
  const glyphs = ['◆', '○', '△', '✕', '▽', '◐', '✦', '▫', '☉', '⌬'];
  const grid: string[][] = [];
  for (let r = 0; r < size; r++) {
    const row: string[] = [];
    for (let c = 0; c < size; c++) row.push(glyphs[Math.floor(Math.random() * glyphs.length)]);
    grid.push(row);
  }
  return grid;
}

export default function AvenueOfMirrors() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const mazeRef = useRef<number[][]>(newMaze());
  const playerRef = useRef({ x: 1.5, y: 1.5, angle: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const watchersRef = useRef<Array<{ x: number; y: number }>>([]);
  const lastReshapeRef = useRef(0);
  const memoryRef = useRef<{ grid: string[][]; reveal: number; gridSize: number }>({ grid: [], reveal: 0, gridSize: 4 });
  const [recallGuess, setRecallGuess] = useState<string[][]>([]);
  const [memoryProgress, setMemoryProgress] = useState(0);
  const mirrorsClearedRef = useRef(0);
  const scoreRef = useRef(0);
  const submit = useSubmitScore('avenue-of-mirrors');

  const start = useCallback(() => {
    mazeRef.current = newMaze();
    playerRef.current = { x: 1.5, y: 1.5, angle: 0 };
    watchersRef.current = [];
    mirrorsClearedRef.current = 0;
    scoreRef.current = 0;
    setPhase('walking');
  }, [setPhase]);
  useGameAutoStart(phase === 'menu' ? start : null);
  useEffect(() => { if (phase === 'victory' || phase === 'defeat') submit(scoreRef.current); }, [phase, submit]);

  // Input
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key); if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Trigger Mirror event when you reach the maze exit (bottom-right)
  const checkMirror = useCallback(() => {
    const p = playerRef.current;
    const exitX = MAP_N - 2, exitY = MAP_N - 2;
    if (Math.hypot(p.x - exitX, p.y - exitY) < 1.0) {
      const size = Math.min(6, 4 + mirrorsClearedRef.current);
      memoryRef.current = { grid: makeGlyphGrid(size), reveal: 5, gridSize: size };
      setRecallGuess(Array.from({ length: size }, () => Array<string>(size).fill('')));
      setMemoryProgress(0);
      setPhase('memorize');
    }
  }, [setPhase]);

  // Loop
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0; let lastT = performance.now();

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;

      if (phaseRef.current === 'walking') {
        const p = playerRef.current; const k = keysRef.current;
        const speed = 2.5; const turn = 1.8;
        const fwd = (k.has('w') || k.has('W') || k.has('ArrowUp')) ? 1 : (k.has('s') || k.has('S') || k.has('ArrowDown')) ? -1 : 0;
        const strafe = (k.has('a') || k.has('A')) ? -1 : (k.has('d') || k.has('D')) ? 1 : 0;
        if (k.has('ArrowLeft')) p.angle -= turn * dt;
        if (k.has('ArrowRight')) p.angle += turn * dt;
        const nx = p.x + Math.cos(p.angle) * fwd * speed * dt + Math.cos(p.angle + Math.PI / 2) * strafe * speed * dt;
        const ny = p.y + Math.sin(p.angle) * fwd * speed * dt + Math.sin(p.angle + Math.PI / 2) * strafe * speed * dt;
        if (mazeRef.current[Math.floor(ny)]?.[Math.floor(nx)] === 0) { p.x = nx; p.y = ny; }
        else if (mazeRef.current[Math.floor(p.y)]?.[Math.floor(nx)] === 0) p.x = nx;
        else if (mazeRef.current[Math.floor(ny)]?.[Math.floor(p.x)] === 0) p.y = ny;

        // Reshape geometry behind the player every 4 seconds
        if (t - lastReshapeRef.current > 4000) {
          lastReshapeRef.current = t;
          // Carve / fill a few random cells far from player
          for (let i = 0; i < 6; i++) {
            const rx = 1 + Math.floor(Math.random() * (MAP_N - 2));
            const ry = 1 + Math.floor(Math.random() * (MAP_N - 2));
            if (Math.hypot(rx - p.x, ry - p.y) > 4 && (rx !== MAP_N - 2 || ry !== MAP_N - 2)) {
              mazeRef.current[ry][rx] = mazeRef.current[ry][rx] === 1 ? 0 : 1;
            }
          }
        }

        // Watchers chase
        for (const w of watchersRef.current) {
          const dx = p.x - w.x, dy = p.y - w.y;
          const d = Math.hypot(dx, dy);
          if (d < 0.6) { setPhase('defeat'); return; }
          w.x += (dx / d) * 1.0 * dt; w.y += (dy / d) * 1.0 * dt;
        }
        checkMirror();
      }

      // ── Render raycast ──────────────────────────────────────────────────
      // Sky / floor
      ctx.fillStyle = COL.ceil; ctx.fillRect(0, 0, VIEW_W, VIEW_H / 2);
      ctx.fillStyle = COL.floor; ctx.fillRect(0, VIEW_H / 2, VIEW_W, VIEW_H / 2);
      const p = playerRef.current;
      for (let s = 0; s < VIEW_W; s += 2) {
        const rayAngle = p.angle - FOV / 2 + (s / VIEW_W) * FOV;
        let dist = 0;
        const stepSize = 0.04;
        const dx = Math.cos(rayAngle), dy = Math.sin(rayAngle);
        let hit = false;
        while (dist < FOG_DIST + 2 && !hit) {
          dist += stepSize;
          const cx = Math.floor(p.x + dx * dist);
          const cy = Math.floor(p.y + dy * dist);
          if (cx < 0 || cx >= MAP_N || cy < 0 || cy >= MAP_N) { hit = true; break; }
          if (mazeRef.current[cy][cx] === 1) hit = true;
        }
        const corrected = dist * Math.cos(rayAngle - p.angle);
        const colHeight = Math.min(VIEW_H, VIEW_H / corrected);
        const fogF = Math.max(0, 1 - dist / FOG_DIST);
        const wallShade = Math.floor(80 * fogF + 30);
        ctx.fillStyle = `rgb(${wallShade + 20},${wallShade + 30},${wallShade + 35})`;
        ctx.fillRect(s, (VIEW_H - colHeight) / 2, 2, colHeight);
        // pool-tile floor stripe
        ctx.fillStyle = `rgba(44,142,142,${0.04 * fogF})`;
        ctx.fillRect(s, VIEW_H / 2, 2, VIEW_H / 2);
      }
      // Vignette / fog overlay
      const grad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.2, VIEW_W / 2, VIEW_H / 2, VIEW_H);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, COL.fog);
      ctx.fillStyle = grad; ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      // Watchers — simple billboards
      for (const w of watchersRef.current) {
        const dx = w.x - p.x, dy = w.y - p.y;
        const d = Math.hypot(dx, dy);
        const a = Math.atan2(dy, dx) - p.angle;
        const aNorm = Math.atan2(Math.sin(a), Math.cos(a));
        if (Math.abs(aNorm) < FOV / 2 && d < FOG_DIST) {
          const sx = (aNorm / FOV + 0.5) * VIEW_W;
          const size = Math.min(VIEW_H, VIEW_H / d);
          ctx.fillStyle = `rgba(255,85,119,${0.6 * (1 - d / FOG_DIST)})`;
          ctx.beginPath(); ctx.arc(sx, VIEW_H / 2, size * 0.25, 0, Math.PI * 2); ctx.fill();
        }
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phaseRef, checkMirror, setPhase]);

  // Memorize phase — count down reveal
  useEffect(() => {
    if (phase !== 'memorize') return;
    let left = memoryRef.current.reveal;
    setMemoryProgress(left);
    const iv = setInterval(() => {
      left -= 1; setMemoryProgress(left);
      if (left <= 0) { clearInterval(iv); setPhase('recall'); }
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, setPhase]);

  const submitRecall = useCallback(() => {
    let correct = 0; let total = 0;
    const grid = memoryRef.current.grid;
    for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[r].length; c++) {
      total++;
      if (recallGuess[r]?.[c] === grid[r][c]) correct++;
    }
    const ratio = correct / total;
    if (ratio === 1) {
      mirrorsClearedRef.current += 1;
      scoreRef.current += 200 + mirrorsClearedRef.current * 50;
      if (mirrorsClearedRef.current >= 3) { setPhase('victory'); return; }
      // Reset maze for next layer
      mazeRef.current = newMaze();
      playerRef.current = { x: 1.5, y: 1.5, angle: 0 };
      setPhase('walking');
    } else if (ratio > 0.5) {
      scoreRef.current += Math.floor(80 * ratio);
      mazeRef.current = newMaze();
      playerRef.current = { x: 1.5, y: 1.5, angle: 0 };
      setPhase('walking');
    } else {
      // Watcher spawn
      watchersRef.current.push({ x: MAP_N - 2.5, y: MAP_N - 2.5 });
      mazeRef.current = newMaze();
      playerRef.current = { x: 1.5, y: 1.5, angle: 0 };
      setPhase('walking');
    }
  }, [recallGuess, setPhase]);

  const allGlyphs = ['◆', '○', '△', '✕', '▽', '◐', '✦', '▫', '☉', '⌬'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 12, background: 'linear-gradient(180deg, #060809 0%, #0e1418 100%)', color: COL.ui, minHeight: '100%', fontFamily: '"Courier New", monospace' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: VIEW_W }}>
        <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} style={{ width: '100%', height: 'auto', maxWidth: VIEW_W, borderRadius: 4, boxShadow: '0 0 60px rgba(127,182,177,0.08) inset, 0 8px 30px rgba(0,0,0,0.7)' }} />
        {phase === 'menu' && (
          <Overlay>
            <h1 style={{ color: COL.accent, margin: 0, fontSize: 32, letterSpacing: 4 }}>🪞 AVENUE OF MIRRORS</h1>
            <p style={{ maxWidth: 460, textAlign: 'center', lineHeight: 1.5 }}>Walk the dream-seam. Memorize the glyphs at each Mirror. The maze remembers nothing.</p>
            <p style={{ color: COL.glyph, fontSize: 12 }}>WASD/Arrow keys to move and turn</p>
            <button onClick={start} style={btn}>Open Your Eyes</button>
          </Overlay>
        )}
        {phase === 'memorize' && (
          <Overlay>
            <div style={{ color: COL.accent, fontSize: 13, letterSpacing: 4 }}>MIRROR · MEMORIZE</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${memoryRef.current.gridSize}, 36px)`, gap: 6 }}>
              {memoryRef.current.grid.flatMap(row: Record<string, unknown>, r: number => row.map(g: Record<string, unknown>, c: Record<string, unknown> => (
                <div key={`${r}-${c}`} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COL.panel, border: `1px solid ${COL.accent}`, color: COL.glyph, fontSize: 22 }}>{g}</div>
              )))}
            </div>
            <div style={{ color: COL.accent }}>{memoryProgress}s</div>
          </Overlay>
        )}
        {phase === 'recall' && (
          <Overlay>
            <div style={{ color: COL.accent, fontSize: 13, letterSpacing: 4 }}>RECALL</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${memoryRef.current.gridSize}, 40px)`, gap: 6 }}>
              {recallGuess.flatMap(row: Record<string, unknown>, r: number => row.map(g: Record<string, unknown>, c: Record<string, unknown> => (
                <select
                  key={`${r}-${c}`}
                  value={g}
                  onChange={(e) => {
                    const next = recallGuess.map((rr: Record<string, unknown>) => rr.slice());
                    next[r][c] = e.target.value;
                    setRecallGuess(next);
                  }}
                  style={{ width: 40, height: 40, fontSize: 18, background: COL.panel, color: COL.glyph, border: `1px solid ${COL.accent}` }}
                >
                  <option value=""></option>
                  {allGlyphs.map((x: Record<string, unknown>) => <option key={x} value={x}>{x}</option>)}
                </select>
              )))}
            </div>
            <button onClick={submitRecall} style={btn}>Lock In</button>
          </Overlay>
        )}
        {phase === 'victory' && (<Overlay><h1 style={{ color: COL.accent }}>You remember your face.</h1><p>Score: {scoreRef.current}</p><button onClick={start} style={btn}>Wake Again</button></Overlay>)}
        {phase === 'defeat' && (<Overlay><h1 style={{ color: COL.watcher }}>The Watcher takes you.</h1><p>Score: {scoreRef.current}</p><button onClick={start} style={btn}>Sleep In</button></Overlay>)}
      </div>
      <div style={{ fontSize: 11, color: '#5b6770' }}>
        Mirrors cleared: {mirrorsClearedRef.current}/3 · Watchers: {watchersRef.current.length}
      </div>
    </div>
  );
}

const Overlay = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'radial-gradient(ellipse at center, rgba(6,8,9,0.85), rgba(6,8,9,0.97))', borderRadius: 4 }}>{children}</div>
);
const btn: React.CSSProperties = {
  background: 'linear-gradient(180deg, #16252a 0%, #0a1416 100%)',
  border: `1px solid ${COL.accent}`, color: COL.accent,
  padding: '10px 26px', borderRadius: 4, fontSize: 14, letterSpacing: 3, cursor: 'pointer',
  fontFamily: 'inherit',
};

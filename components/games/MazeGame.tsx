'use client';
/**
 * MazeGame — Top-down maze runner with procedural maze generation.
 * Category: maze / adventure
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useKeySet, useSubmitScore } from '@/lib/games/hooks';

const CELL = 36; const MAZE_W = 15; const MAZE_H = 12;
const CW = MAZE_W * CELL; const CH = MAZE_H * CELL;
type Phase = 'menu' | 'playing' | 'win';
type Dir = 0|1|2|3; // N E S W

interface Cell { walls: [boolean,boolean,boolean,boolean]; visited: boolean; }

const DX = [0,1,0,-1]; const DY = [-1,0,1,0];

function generateMaze(w: number, h: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: h }, () =>
    Array.from({ length: w }, () => ({ walls: [true,true,true,true], visited: false }))
  );
  const stack: [number,number][] = [[0,0]];
  grid[0][0].visited = true;
  while (stack.length > 0) {
    const [cx,cy] = stack[stack.length - 1];
    const neighbors: [number,number,Dir][] = [];
    for (let d = 0; d < 4; d++) {
      const nx = cx + DX[d]; const ny = cy + DY[d];
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && !grid[ny][nx].visited) neighbors.push([nx,ny,d as Dir]);
    }
    if (neighbors.length === 0) { stack.pop(); continue; }
    const [nx,ny,d] = neighbors[Math.floor(Math.random() * neighbors.length)];
    grid[cy][cx].walls[d] = false;
    grid[ny][nx].walls[(d + 2) % 4 as Dir] = false;
    grid[ny][nx].visited = true;
    stack.push([nx,ny]);
  }
  return grid;
}

export default function MazeGame() {
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const [time, setTime] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mazeRef = useRef<Cell[][]>(generateMaze(MAZE_W, MAZE_H));
  const playerRef = useRef({ x: 0, y: 0 });
  const keysRef = useKeySet(phase === 'playing', true);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const submitScore = useSubmitScore('maze');
  useEffect(() => { if (phase === 'win') submitScore(Math.max(0, Math.round(5000 - time * 10))); }, [phase, time, submitScore]);
  const lastMoveRef = useRef(0);
  const tickRef = useRef(0);

  const startGame = useCallback(() => {
    mazeRef.current = generateMaze(MAZE_W, MAZE_H);
    playerRef.current = { x: 0, y: 0 };
    startTimeRef.current = Date.now(); lastMoveRef.current = 0; tickRef.current = 0;
    setTime(0); setPhase('playing');
  }, [setPhase]);
  useGameAutoStart(phase === 'menu' ? startGame : null);

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const loop = (now: number) => {
      if (phaseRef.current !== 'playing') return;
      tickRef.current++;

      // Move
      if (now - lastMoveRef.current > 130) {
        const p = playerRef.current;
        const cell = mazeRef.current[p.y][p.x];
        let moved = false;
        if ((keysRef.current.has('ArrowUp') || keysRef.current.has('w')) && !cell.walls[0] && p.y > 0) { p.y--; moved = true; }
        else if ((keysRef.current.has('ArrowRight') || keysRef.current.has('d')) && !cell.walls[1] && p.x < MAZE_W - 1) { p.x++; moved = true; }
        else if ((keysRef.current.has('ArrowDown') || keysRef.current.has('s')) && !cell.walls[2] && p.y < MAZE_H - 1) { p.y++; moved = true; }
        else if ((keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) && !cell.walls[3] && p.x > 0) { p.x--; moved = true; }
        if (moved) { lastMoveRef.current = now; }
        if (p.x === MAZE_W - 1 && p.y === MAZE_H - 1) {
          const t = Math.round((Date.now() - startTimeRef.current) / 1000);
          setBest(b => b === null || t < b ? t : b);
          setTime(t); setPhase('win'); return;
        }
      }

      // Draw
      ctx.fillStyle = '#0f0f1a'; ctx.fillRect(0, 0, CW, CH);

      // Maze walls
      for (let y = 0; y < MAZE_H; y++) {
        for (let x = 0; x < MAZE_W; x++) {
          const cell = mazeRef.current[y][x];
          const px = x * CELL; const py = y * CELL;
          ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
          if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + CELL, py); ctx.stroke(); }
          if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(px + CELL, py); ctx.lineTo(px + CELL, py + CELL); ctx.stroke(); }
          if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(px, py + CELL); ctx.lineTo(px + CELL, py + CELL); ctx.stroke(); }
          if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + CELL); ctx.stroke(); }
        }
      }

      // Exit marker
      const exitX = (MAZE_W - 1) * CELL + CELL / 2; const exitY = (MAZE_H - 1) * CELL + CELL / 2;
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(exitX, exitY, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f0f1a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', exitX, exitY + 4); ctx.textAlign = 'left';

      // Player
      const p = playerRef.current;
      const cx = p.x * CELL + CELL / 2; const cy = p.y * CELL + CELL / 2;
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🧑', cx, cy + 5); ctx.textAlign = 'left';

      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      setTime(elapsed);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, phaseRef]);

  if (phase === 'menu') return (
    <div style={{ background: '#0f0f1a', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#3b82f6' }}>🌀 MAZE RUNNER</div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>Navigate the maze from 🧑 to ★ — Arrow keys, WASD, or the shared GameRemote</div>
      {best !== null && <div style={{ color: '#facc15', fontSize: 13 }}>Best time: {best}s</div>}
      <button onClick={startGame} style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Enter Maze</button>
    </div>
  );
  if (phase === 'win') return (
    <div style={{ background: '#0f0f1a', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 26, color: '#4ade80', fontWeight: 900 }}>🏆 Escaped!</div>
      <div style={{ fontSize: 16, color: '#9ca3af' }}>Time: {time}s · Best: {best}s</div>
      <button onClick={startGame} style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>New Maze</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ color: '#9ca3af', fontSize: 12 }}>Time: {time}s · Get to the ★ in the corner!</div>
      <canvas ref={canvasRef} width={CW} height={CH} tabIndex={0} style={{ width: '100%', maxWidth: CW, borderRadius: 8, display: 'block', border: '2px solid rgba(59,130,246,0.3)', outline: 'none' }} />
      <div style={{ color: '#60a5fa', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
        Use the shared PS-style GameRemote or keyboard controls.
      </div>
    </div>
  );
}

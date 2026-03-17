'use client';
/**
 * SnakeGame — Classic snake arcade game.
 * Category: arcade / classic
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGamePhase } from '@/lib/games/hooks';

const CELL = 18; const COLS = 24; const ROWS = 22;
const CW = COLS * CELL; const CH = ROWS * CELL;

type Dir = 'up' | 'down' | 'left' | 'right';
type Phase = 'menu' | 'playing' | 'gameover';
interface Pt { x: number; y: number; }

export default function SnakeGame() {
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Pt[]>([{ x: 12, y: 11 }, { x: 11, y: 11 }, { x: 10, y: 11 }]);
  const dirRef = useRef<Dir>('right');
  const nextDirRef = useRef<Dir>('right');
  const foodRef = useRef<Pt>({ x: 18, y: 11 });
  const scoreRef = useRef(0);
  const rafRef = useRef(0);
  const lastTickRef = useRef(0);
  const speedRef = useRef(150);

  function randomFood(snake: Pt[]): Pt {
    let p: Pt;
    do { p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
    while (snake.some(s => s.x === p.x && s.y === p.y));
    return p;
  }

  const startGame = useCallback(() => {
    snakeRef.current = [{ x: 12, y: 11 }, { x: 11, y: 11 }, { x: 10, y: 11 }];
    dirRef.current = 'right'; nextDirRef.current = 'right';
    foodRef.current = { x: 18, y: 11 };
    scoreRef.current = 0; speedRef.current = 150;
    setScore(0); setPhase('playing');
  }, [setPhase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
      const d = map[e.key];
      if (!d) return;
      const opposite: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
      if (d !== opposite[dirRef.current]) nextDirRef.current = d;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const draw = () => {
      ctx.fillStyle = '#0f1a0f'; ctx.fillRect(0, 0, CW, CH);
      // Grid dots
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) { ctx.beginPath(); ctx.arc(c * CELL + CELL/2, r * CELL + CELL/2, 1, 0, Math.PI*2); ctx.fill(); }
      // Food
      const f = foodRef.current;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(f.x * CELL + CELL/2, f.y * CELL + CELL/2, CELL/2 - 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `${CELL - 4}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('🍎', f.x * CELL + CELL/2, f.y * CELL + CELL/2 + 5); ctx.textAlign = 'left';
      // Snake
      const snake = snakeRef.current;
      for (let i = 0; i < snake.length; i++) {
        const s = snake[i];
        const ratio = 1 - i / snake.length * 0.5;
        ctx.fillStyle = i === 0 ? '#4ade80' : `rgba(34,197,94,${ratio})`;
        const pad = i === 0 ? 1 : 2;
        ctx.beginPath(); ctx.roundRect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad*2, CELL - pad*2, 3); ctx.fill();
        if (i === 0) { ctx.fillStyle = '#0f1a0f'; ctx.fillRect(s.x*CELL+5, s.y*CELL+5, 3, 3); ctx.fillRect(s.x*CELL+10, s.y*CELL+5, 3, 3); }
      }
      // Score
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, CW, 24);
      ctx.fillStyle = '#4ade80'; ctx.font = 'bold 11px monospace';
      ctx.fillText(`Score: ${scoreRef.current}`, 8, 16);
    };

    const tick = (now: number) => {
      if (phaseRef.current !== 'playing') return;
      if (now - lastTickRef.current >= speedRef.current) {
        lastTickRef.current = now;
        dirRef.current = nextDirRef.current;
        const head = snakeRef.current[0];
        const delta: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
        const next = { x: head.x + delta[dirRef.current].x, y: head.y + delta[dirRef.current].y };
        // Wall collision
        if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS || snakeRef.current.some(s => s.x === next.x && s.y === next.y)) {
          setBest(b => Math.max(b, scoreRef.current));
          setScore(scoreRef.current);
          setPhase('gameover');
          return;
        }
        const newSnake = [next, ...snakeRef.current];
        if (next.x === foodRef.current.x && next.y === foodRef.current.y) {
          scoreRef.current += 10;
          foodRef.current = randomFood(newSnake);
          speedRef.current = Math.max(60, speedRef.current - 2);
          setScore(scoreRef.current);
        } else {
          newSnake.pop();
        }
        snakeRef.current = newSnake;
      }
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  if (phase === 'menu') return (
    <div style={{ background: '#0f1a0f', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#4ade80' }}>🐍 SNAKE</div>
      <div style={{ fontSize: 12, color: '#86efac' }}>Arrow keys or WASD. Eat apples, don&apos;t hit walls!</div>
      {best > 0 && <div style={{ color: '#facc15', fontSize: 13 }}>Best: {best}</div>}
      <button onClick={startGame} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Play</button>
    </div>
  );
  if (phase === 'gameover') return (
    <div style={{ background: '#0f1a0f', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 26, color: '#f87171', fontWeight: 900 }}>💀 Game Over</div>
      <div style={{ fontSize: 20, color: '#4ade80', fontWeight: 700 }}>Score: {score}</div>
      <div style={{ fontSize: 14, color: '#facc15' }}>Best: {best}</div>
      <button onClick={startGame} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Play Again</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <canvas ref={canvasRef} width={CW} height={CH} tabIndex={0}
        style={{ width: '100%', maxWidth: CW, borderRadius: 8, display: 'block', border: '2px solid rgba(74,222,128,0.3)', outline: 'none' }} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {(['up','left','down','right'] as Dir[]).map(d => (
          <button key={d} onPointerDown={() => { const map: Record<Dir,Dir> = {up:'down',down:'up',left:'right',right:'left'}; if(d!==map[dirRef.current]) nextDirRef.current=d; }}
            style={{ width: 40, height: 40, background: '#1a2a1a', border: '1px solid #374151', borderRadius: 8, color: '#4ade80', fontSize: 16, cursor: 'pointer' }}>
            {d === 'up' ? '↑' : d === 'down' ? '↓' : d === 'left' ? '←' : '→'}
          </button>
        ))}
      </div>
    </div>
  );
}

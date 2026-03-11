'use client';
/**
 * TetrisGame — Classic falling block puzzle.
 * Category: puzzle / classic
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const COLS = 10; const ROWS = 20; const CELL = 26;
const CW = COLS * CELL; const CH = ROWS * CELL;
type Phase = 'menu' | 'playing' | 'gameover';

const PIECES = [
  { shape: [[1,1,1,1]],                              color: '#06b6d4' }, // I
  { shape: [[1,1],[1,1]],                             color: '#eab308' }, // O
  { shape: [[0,1,0],[1,1,1]],                         color: '#a855f7' }, // T
  { shape: [[1,1,0],[0,1,1]],                         color: '#22c55e' }, // S
  { shape: [[0,1,1],[1,1,0]],                         color: '#ef4444' }, // Z
  { shape: [[1,0,0],[1,1,1]],                         color: '#3b82f6' }, // J
  { shape: [[0,0,1],[1,1,1]],                         color: '#f97316' }, // L
];

interface Piece { shape: number[][]; color: string; x: number; y: number; }

function randomPiece(): Piece {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)];
  return { ...p, shape: p.shape.map(r => [...r]), x: Math.floor(COLS / 2) - Math.floor(p.shape[0].length / 2), y: 0 };
}

function rotate(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

function collision(board: (string | 0)[][], piece: Piece, dx = 0, dy = 0, newShape?: number[][]): boolean {
  const shape = newShape ?? piece.shape;
  return shape.some((row, r) => row.some((cell, c) => {
    if (!cell) return false;
    const nx = piece.x + c + dx; const ny = piece.y + r + dy;
    return nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx] !== 0);
  }));
}

function placePiece(board: (string | 0)[][], piece: Piece): (string | 0)[][] {
  const next = board.map(row => [...row]) as (string | 0)[][];
  piece.shape.forEach((row, r) => row.forEach((cell, c) => {
    if (cell && piece.y + r >= 0) next[piece.y + r][piece.x + c] = piece.color;
  }));
  return next;
}

function clearLines(board: (string | 0)[][]): { board: (string | 0)[][]; lines: number } {
  const next = board.filter(row => row.some(c => c === 0));
  const lines = ROWS - next.length;
  const empty = Array.from({ length: lines }, () => Array(COLS).fill(0) as (string | 0)[]);
  return { board: [...empty, ...next], lines };
}

const SCORE_TABLE = [0, 100, 300, 500, 800];
const SPEEDS = [800, 700, 600, 500, 400, 350, 300, 250, 200, 150];

export default function TetrisGame() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [best, setBest] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<Phase>('menu');
  const boardRef = useRef<(string|0)[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const pieceRef = useRef<Piece>(randomPiece());
  const nextPieceRef = useRef<Piece>(randomPiece());
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const lastDropRef = useRef(0);
  const rafRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const keyRepeatRef = useRef<Record<string, number>>({});

  const startGame = useCallback(() => {
    boardRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    pieceRef.current = randomPiece(); nextPieceRef.current = randomPiece();
    scoreRef.current = 0; linesRef.current = 0; levelRef.current = 1;
    setScore(0); setLines(0); setLevel(1);
    phaseRef.current = 'playing'; setPhase('playing');
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (down) keysRef.current.add(e.key); else { keysRef.current.delete(e.key); delete keyRepeatRef.current[e.key]; }
      if (down && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'ArrowUp' || e.key === 'z')) e.preventDefault();
    };
    window.addEventListener('keydown', e => onKey(e, true));
    window.addEventListener('keyup', e => onKey(e, false));
    return () => { window.removeEventListener('keydown', e => onKey(e, true)); window.removeEventListener('keyup', e => onKey(e, false)); };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const drawBoard = () => {
      ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, CW, CH);
      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5;
      for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c*CELL,0); ctx.lineTo(c*CELL,CH); ctx.stroke(); }
      for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0,r*CELL); ctx.lineTo(CW,r*CELL); ctx.stroke(); }
      // Board cells
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const cell = boardRef.current[r][c];
        if (cell) {
          ctx.fillStyle = cell; ctx.fillRect(c*CELL+1,r*CELL+1,CELL-2,CELL-2);
          ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(c*CELL+1,r*CELL+1,CELL-2,4);
        }
      }
      // Ghost piece
      let ghostY = pieceRef.current.y;
      while (!collision(boardRef.current, pieceRef.current, 0, ghostY - pieceRef.current.y + 1)) ghostY++;
      pieceRef.current.shape.forEach((row, r) => row.forEach((cell, c) => {
        if (cell) { ctx.fillStyle = `${pieceRef.current.color}33`; ctx.fillRect((pieceRef.current.x+c)*CELL+1,(ghostY+r)*CELL+1,CELL-2,CELL-2); }
      }));
      // Current piece
      pieceRef.current.shape.forEach((row, r) => row.forEach((cell, c) => {
        if (cell && pieceRef.current.y + r >= 0) {
          ctx.fillStyle = pieceRef.current.color; ctx.fillRect((pieceRef.current.x+c)*CELL+1,(pieceRef.current.y+r)*CELL+1,CELL-2,CELL-2);
          ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect((pieceRef.current.x+c)*CELL+1,(pieceRef.current.y+r)*CELL+1,CELL-2,4);
        }
      }));
    };

    const loop = (now: number) => {
      if (phaseRef.current !== 'playing') return;
      // Key handling with repeat
      const now2 = Date.now();
      for (const key of keysRef.current) {
        const last = keyRepeatRef.current[key] ?? 0;
        const delay = last === 0 ? 150 : 60;
        if (now2 - last >= delay) {
          keyRepeatRef.current[key] = now2;
          const p = pieceRef.current;
          if (key === 'ArrowLeft' && !collision(boardRef.current, p, -1, 0)) p.x--;
          if (key === 'ArrowRight' && !collision(boardRef.current, p, 1, 0)) p.x++;
          if (key === 'ArrowDown' && !collision(boardRef.current, p, 0, 1)) { p.y++; lastDropRef.current = now; }
          if (key === 'ArrowUp' || key === 'z') {
            const rotated = rotate(p.shape);
            if (!collision(boardRef.current, p, 0, 0, rotated)) { p.shape = rotated; keyRepeatRef.current[key] = now2 + 9999; }
          }
          if (key === ' ') {
            while (!collision(boardRef.current, p, 0, 1)) p.y++;
            keyRepeatRef.current[key] = now2 + 9999;
          }
        }
      }

      // Auto drop
      const speed = SPEEDS[Math.min(levelRef.current - 1, SPEEDS.length - 1)];
      if (now - lastDropRef.current >= speed) {
        lastDropRef.current = now;
        const p = pieceRef.current;
        if (!collision(boardRef.current, p, 0, 1)) { p.y++; }
        else {
          boardRef.current = placePiece(boardRef.current, p);
          const { board: newBoard, lines: cleared } = clearLines(boardRef.current);
          boardRef.current = newBoard;
          linesRef.current += cleared;
          scoreRef.current += SCORE_TABLE[cleared] * levelRef.current;
          levelRef.current = Math.floor(linesRef.current / 10) + 1;
          pieceRef.current = { ...nextPieceRef.current };
          nextPieceRef.current = randomPiece();
          if (collision(boardRef.current, pieceRef.current, 0, 0)) {
            phaseRef.current = 'gameover'; setBest(b => Math.max(b, scoreRef.current)); setScore(scoreRef.current); setPhase('gameover'); return;
          }
          setScore(scoreRef.current); setLines(linesRef.current); setLevel(levelRef.current);
        }
      }

      drawBoard();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  if (phase === 'menu') return (
    <div style={{ background: '#111827', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#06b6d4' }}>🟦 TETRIS</div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>← → Arrow keys to move · ↑ / Z to rotate · Space to drop</div>
      {best > 0 && <div style={{ color: '#facc15', fontSize: 13 }}>Best: {best}</div>}
      <button onClick={startGame} style={{ background: '#0e7490', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Play</button>
    </div>
  );
  if (phase === 'gameover') return (
    <div style={{ background: '#111827', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 26, color: '#f87171', fontWeight: 900 }}>Game Over</div>
      <div style={{ fontSize: 18, color: '#facc15', fontWeight: 700 }}>Score: {score} · Lines: {lines} · Level: {level}</div>
      <div style={{ fontSize: 13, color: '#9ca3af' }}>Best: {best}</div>
      <button onClick={startGame} style={{ background: '#0e7490', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Play Again</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      <canvas ref={canvasRef} width={CW} height={CH} tabIndex={0} style={{ borderRadius: 8, border: '2px solid rgba(6,182,212,0.3)', outline: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 80 }}>
        <div style={{ background: '#1f2937', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12 }}>
          <div style={{ color: '#9ca3af', fontSize: 10, marginBottom: 2 }}>SCORE</div>
          <div style={{ fontWeight: 700, color: '#facc15' }}>{score}</div>
          <div style={{ color: '#9ca3af', fontSize: 10, marginTop: 6, marginBottom: 2 }}>LINES</div>
          <div style={{ fontWeight: 700 }}>{lines}</div>
          <div style={{ color: '#9ca3af', fontSize: 10, marginTop: 6, marginBottom: 2 }}>LEVEL</div>
          <div style={{ fontWeight: 700, color: '#06b6d4' }}>{level}</div>
        </div>
        <div style={{ background: '#1f2937', borderRadius: 8, padding: '8px 12px', color: '#9ca3af', fontSize: 10 }}>
          <div>← → Move</div>
          <div>↑ / Z Rotate</div>
          <div>↓ Soft drop</div>
          <div>Space Hard drop</div>
        </div>
      </div>
    </div>
  );
}

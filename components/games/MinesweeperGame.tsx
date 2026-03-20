'use client';
/**
 * MinesweeperGame — Classic minesweeper.
 * Category: puzzle / casual
 */
import { useCallback, useRef, useState, useEffect } from 'react';
import { useSubmitScore } from '@/lib/games/hooks';

const ROWS = 12; const COLS = 16; const MINES = 28;
type CellState = 'hidden' | 'revealed' | 'flagged';
interface Cell { mine: boolean; adj: number; state: CellState; }
type Phase = 'menu' | 'playing' | 'win' | 'dead';

function makeBoard(firstR: number, firstC: number): Cell[][] {
  const board: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, adj: 0, state: 'hidden' as CellState }))
  );
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS); const c = Math.floor(Math.random() * COLS);
    if (board[r][c].mine) continue;
    if (Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1) continue;
    board[r][c].mine = true; placed++;
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (board[r][c].mine) continue;
    let adj = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr; const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) adj++;
    }
    board[r][c].adj = adj;
  }
  return board;
}

function reveal(board: Cell[][], r: number, c: number): Cell[][] {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return board;
  const cell = board[r][c];
  if (cell.state !== 'hidden') return board;
  cell.state = 'revealed';
  if (cell.adj === 0 && !cell.mine) {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) reveal(board, r + dr, c + dc);
  }
  return board;
}

const ADJ_COLORS = ['','#3b82f6','#16a34a','#ef4444','#7c3aed','#dc2626','#0891b2','#1f2937','#6b7280'];

export default function MinesweeperGame() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [board, setBoard] = useState<Cell[][]>([]);
  const [started, setStarted] = useState(false);
  const [flags, setFlags] = useState(MINES);
  const [time, setTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitScore = useSubmitScore('minesweeper');
  useEffect(() => {
    if (phase === 'win')  submitScore(Math.max(0, 5000 - time * 10));
    if (phase === 'dead') submitScore(0);
  }, [phase, time, submitScore]);

  const startGame = useCallback(() => {
    setBoard([]); setStarted(false); setFlags(MINES); setTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('playing');
  }, []);

  const handleClick = useCallback((r: number, c: number) => {
    if (phase !== 'playing') return;
    let b = board;
    if (!started) {
      b = makeBoard(r, c);
      setStarted(true);
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    }
    const cell = b[r][c];
    if (cell.state !== 'hidden') return;
    const newBoard = b.map(row => row.map(c => ({ ...c })));
    reveal(newBoard, r, c);
    if (newBoard[r][c].mine) {
      // Reveal all mines
      for (const row of newBoard) for (const cell of row) if (cell.mine) cell.state = 'revealed';
      if (timerRef.current) clearInterval(timerRef.current);
      setBoard(newBoard); setPhase('dead'); return;
    }
    // Check win
    const hidden = newBoard.flat().filter(c => c.state === 'hidden' && !c.mine).length;
    if (hidden === 0) { if (timerRef.current) clearInterval(timerRef.current); setBoard(newBoard); setPhase('win'); return; }
    setBoard(newBoard);
  }, [board, phase, started]);

  const handleFlag = useCallback((e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (phase !== 'playing') return;
    const cell = board[r]?.[c];
    if (!cell || cell.state === 'revealed') return;
    const newBoard = board.map(row => row.map(c => ({ ...c })));
    if (newBoard[r][c].state === 'hidden') { newBoard[r][c].state = 'flagged'; setFlags(f => f - 1); }
    else { newBoard[r][c].state = 'hidden'; setFlags(f => f + 1); }
    setBoard(newBoard);
  }, [board, phase]);

  const CELL_SIZE = Math.min(36, Math.floor((typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 600) : 600) / COLS));

  if (phase === 'menu') return (
    <div style={{ background: '#1f2937', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#ef4444' }}>💣 MINESWEEPER</div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>Click to reveal · Right-click to flag · {ROWS}×{COLS} · {MINES} mines</div>
      <button onClick={startGame} style={{ background: '#374151', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Start</button>
    </div>
  );

  if (phase === 'win' || phase === 'dead') return (
    <div style={{ background: '#1f2937', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: phase === 'win' ? '#4ade80' : '#ef4444' }}>
        {phase === 'win' ? '🏆 You Win!' : '💥 BOOM!'}
      </div>
      {phase === 'win' && <div style={{ fontSize: 14, color: '#9ca3af' }}>Time: {time}s</div>}
      <button onClick={startGame} style={{ background: '#374151', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Play Again</button>
    </div>
  );

  const displayBoard = board.length > 0 ? board : Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ mine: false, adj: 0, state: 'hidden' as CellState })));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 20, color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>
        <span>💣 {flags}</span>
        <span>⏱ {time}s</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`, gap: 1, background: '#374151', borderRadius: 8, padding: 4, border: '2px solid rgba(239,68,68,0.2)' }}>
        {displayBoard.map((row, r) => row.map((cell, c) => {
          const revealed = cell.state === 'revealed';
          const flagged = cell.state === 'flagged';
          return (
            <button key={`${r}-${c}`} onClick={() => handleClick(r, c)} onContextMenu={e => handleFlag(e, r, c)}
              style={{
                width: CELL_SIZE, height: CELL_SIZE, borderRadius: 3, border: 'none',
                background: revealed ? (cell.mine ? '#dc2626' : '#111827') : '#4b5563',
                cursor: 'pointer',
                fontSize: CELL_SIZE * 0.45,
                fontWeight: 800,
                color: cell.adj > 0 && revealed ? ADJ_COLORS[cell.adj] : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.1s',
              }}>
              {flagged ? '🚩' : revealed ? (cell.mine ? '💣' : (cell.adj > 0 ? cell.adj : '')) : ''}
            </button>
          );
        }))}
      </div>
    </div>
  );
}

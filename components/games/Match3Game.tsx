'use client';
/**
 * Match3Game — Jewel-matching puzzle (Match-3 / Candy Crush style).
 * Category: puzzle / casual
 */
import { useCallback, useState } from 'react';

const COLS = 8; const ROWS = 8;
const GEMS = ['💎','🔴','💛','💚','💜','🔵'];
type Phase = 'menu' | 'playing' | 'gameover';

function makeBoard() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => GEMS[Math.floor(Math.random() * GEMS.length)])
  );
}

function findMatches(board: string[][]): Set<string> {
  const matched = new Set<string>();
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      if (board[r][c] && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2]) {
        let k = c;
        while (k < COLS && board[r][k] === board[r][c]) { matched.add(`${r},${k}`); k++; }
      }
    }
  }
  // Vertical
  for (let r = 0; r < ROWS - 2; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c]) {
        let k = r;
        while (k < ROWS && board[k][c] === board[r][c]) { matched.add(`${k},${c}`); k++; }
      }
    }
  }
  return matched;
}

function collapseBoard(board: string[][]): string[][] {
  const next = board.map(row => [...row]);
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (next[r][c]) { next[write][c] = next[r][c]; if (write !== r) next[r][c] = ''; write--; }
    }
    while (write >= 0) { next[write][c] = GEMS[Math.floor(Math.random() * GEMS.length)]; write--; }
  }
  return next;
}

export default function Match3Game() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [board, setBoard] = useState<string[][]>(makeBoard);
  const [selected, setSelected] = useState<[number,number] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [matches, setMatches] = useState<Set<string>>(new Set());
  const [animating, setAnimating] = useState(false);

  const startGame = useCallback(() => {
    setBoard(makeBoard()); setScore(0); setMoves(30); setSelected(null); setMatches(new Set());
    setPhase('playing');
  }, []);

  const processMatches = useCallback((b: string[][]): boolean => {
    const m = findMatches(b);
    if (m.size === 0) return false;
    setMatches(m);
    setAnimating(true);
    setTimeout(() => {
      const cleared = b.map(row => [...row]);
      for (const key of m) { const [r,c] = key.split(',').map(Number); cleared[r][c] = ''; }
      const collapsed = collapseBoard(cleared);
      setBoard(collapsed);
      setScore(s => s + m.size * 10);
      setMatches(new Set());
      setAnimating(false);
      // Check for chain
      setTimeout(() => { processMatches(collapsed); }, 150);
    }, 300);
    return true;
  }, []);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (animating || phase !== 'playing') return;
    if (!selected) { setSelected([r,c]); return; }
    const [sr, sc] = selected;
    if (sr === r && sc === c) { setSelected(null); return; }
    // Only adjacent swaps
    if (Math.abs(sr - r) + Math.abs(sc - c) !== 1) { setSelected([r,c]); return; }
    const next = board.map(row => [...row]);
    [next[sr][sc], next[r][c]] = [next[r][c], next[sr][sc]];
    const m = findMatches(next);
    if (m.size === 0) { setSelected(null); return; } // no match, revert
    setSelected(null);
    setBoard(next);
    const newMoves = moves - 1;
    setMoves(newMoves);
    setTimeout(() => {
      processMatches(next);
      if (newMoves <= 0) setTimeout(() => setPhase('gameover'), 600);
    }, 50);
  }, [animating, board, phase, moves, processMatches]);

  const GEM_BG: Record<string,string> = { '💎':'#bfdbfe','🔴':'#fecaca','💛':'#fef08a','💚':'#bbf7d0','💜':'#e9d5ff','🔵':'#bae6fd' };

  if (phase === 'menu') return (
    <div style={{ background: '#1e1b4b', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#a78bfa' }}>💎 MATCH-3 GEMS</div>
      <div style={{ fontSize: 12, color: '#c4b5fd' }}>Swap adjacent gems to match 3 or more. You have 30 moves!</div>
      <button onClick={startGame} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Play</button>
    </div>
  );
  if (phase === 'gameover') return (
    <div style={{ background: '#1e1b4b', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 26, color: '#f87171', fontWeight: 900 }}>Out of Moves!</div>
      <div style={{ fontSize: 22, color: '#facc15', fontWeight: 700 }}>Score: {score}</div>
      <button onClick={startGame} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Play Again</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 20, padding: '6px 16px', background: '#1e1b4b', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700 }}>
        <span style={{ color: '#a78bfa' }}>💎 Score: {score}</span>
        <span style={{ color: '#facc15' }}>Moves: {moves}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 44px)`, gap: 3 }}>
        {board.map((row, r) => row.map((gem, c) => {
          const key = `${r},${c}`;
          const isSelected = selected?.[0] === r && selected?.[1] === c;
          const isMatched = matches.has(key);
          return (
            <button key={key} onClick={() => handleCellClick(r, c)} style={{
              width: 44, height: 44, borderRadius: 8, border: isSelected ? '2.5px solid #fff' : '1.5px solid rgba(255,255,255,0.1)',
              background: GEM_BG[gem] ?? '#374151', cursor: 'pointer',
              fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: isMatched ? 'scale(1.2)' : isSelected ? 'scale(1.08)' : 'scale(1)',
              opacity: isMatched ? 0.3 : 1,
              transition: 'transform 0.15s, opacity 0.2s',
            }}>{gem}</button>
          );
        }))}
      </div>
    </div>
  );
}

'use client';
/**
 * ChessGame — Classic chess (2-player local).
 * Category: board game / strategy
 */
import { useCallback, useEffect, useState } from 'react';
import { useSubmitScore } from '@/lib/games/hooks';

type Color = 'w' | 'b';
type PieceType = 'K'|'Q'|'R'|'B'|'N'|'P';
type Piece = `${Color}${PieceType}`;
type Board = (Piece | null)[][];
type Phase = 'menu' | 'playing' | 'done';

const INIT: Board = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR'],
];

const GLYPHS: Record<string,string> = {
  wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',
  bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟',
};

function cloneBoard(b: Board): Board { return b.map(r => [...r]); }
function pieceColor(p: Piece | null): Color | null { return p ? p[0] as Color : null; }

function getMoves(board: Board, r: number, c: number): [number,number][] {
  const piece = board[r][c]; if (!piece) return [];
  const col = pieceColor(piece)!; const type = piece[1] as PieceType;
  const moves: [number,number][] = [];
  const add = (nr: number, nc: number): boolean => {
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return false;
    const target = board[nr][nc];
    if (pieceColor(target) === col) return false;
    moves.push([nr, nc]); return target === null;
  };
  const slide = (dr: number, dc: number) => { let nr = r+dr, nc = c+dc; while (add(nr, nc)) { nr += dr; nc += dc; } };
  if (type === 'P') {
    const dir = col === 'w' ? -1 : 1; const startR = col === 'w' ? 6 : 1;
    if (!board[r+dir]?.[c]) { moves.push([r+dir,c]); if (r === startR && !board[r+dir*2]?.[c]) moves.push([r+dir*2,c]); }
    for (const dc of [-1,1]) { const t = board[r+dir]?.[c+dc]; if (t && pieceColor(t) !== col) moves.push([r+dir,c+dc]); }
  } else if (type === 'N') {
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r+dr, c+dc);
  } else if (type === 'B') { [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => slide(dr,dc)); }
  else if (type === 'R') { [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => slide(dr,dc)); }
  else if (type === 'Q') { [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => slide(dr,dc)); }
  else if (type === 'K') { for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(r+dr,c+dc); }
  return moves;
}

export default function ChessGame() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [board, setBoard] = useState<Board>(() => cloneBoard(INIT));
  const [turn, setTurn] = useState<Color>('w');
  const [selected, setSelected] = useState<[number,number] | null>(null);
  const [moves, setMoves] = useState<[number,number][]>([]);
  const [status, setStatus] = useState('');
  const [captured, setCaptured] = useState<{w: Piece[], b: Piece[]}>({w:[], b:[]});
  const submitScore = useSubmitScore('chess');
  // Submit 1000 when a game completes (2-player — completion itself is the achievement)
  useEffect(() => { if (phase === 'done') submitScore(1000); }, [phase, submitScore]);

  const startGame = useCallback(() => {
    setBoard(cloneBoard(INIT)); setTurn('w'); setSelected(null); setMoves([]);
    setStatus(''); setCaptured({w:[],b:[]}); setPhase('playing');
  }, []);

  const handleClick = useCallback((r: number, c: number) => {
    if (phase !== 'playing') return;
    const piece = board[r][c];

    if (selected) {
      const isMove = moves.some(([mr,mc]) => mr === r && mc === c);
      if (isMove) {
        const [sr,sc] = selected;
        const newBoard = cloneBoard(board);
        const captured_piece = newBoard[r][c];
        const moving = newBoard[sr][sc]!;
        // Pawn promotion
        if (moving[1] === 'P' && (r === 0 || r === 7)) newBoard[r][c] = `${moving[0]}Q` as Piece;
        else newBoard[r][c] = moving;
        newBoard[sr][sc] = null;
        if (captured_piece) setCaptured(prev => ({ ...prev, [turn]: [...prev[turn], captured_piece] }));
        // Check if king captured
        const nextTurn: Color = turn === 'w' ? 'b' : 'w';
        const kingExists = newBoard.flat().some(p => p === `${nextTurn}K`);
        if (!kingExists) { setBoard(newBoard); setPhase('done'); setStatus(`${turn === 'w' ? 'White' : 'Black'} wins!`); return; }
        setBoard(newBoard); setTurn(nextTurn); setStatus(`${nextTurn === 'w' ? 'White' : 'Black'}'s turn`);
        setSelected(null); setMoves([]);
        return;
      }
      if (piece && pieceColor(piece) === turn) { setSelected([r,c]); setMoves(getMoves(board, r, c)); return; }
      setSelected(null); setMoves([]);
      return;
    }

    if (piece && pieceColor(piece) === turn) {
      setSelected([r,c]);
      setMoves(getMoves(board, r, c));
    }
  }, [board, moves, phase, selected, turn]);

  const CELL = 52;
  if (phase === 'menu') return (
    <div style={{ background: '#1c1917', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#f5f5f4' }}>♛ CHESS</div>
      <div style={{ fontSize: 12, color: '#a8a29e' }}>2-player local chess. Click a piece to select, click a highlight to move.</div>
      <button onClick={startGame} style={{ background: '#44403c', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Start Game</button>
    </div>
  );
  if (phase === 'done') return (
    <div style={{ background: '#1c1917', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 26, color: '#facc15', fontWeight: 900 }}>🏆 {status}</div>
      <button onClick={startGame} style={{ background: '#44403c', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>New Game</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
        {turn === 'w' ? '⬜ White' : '⬛ Black'}&apos;s turn
        {selected && <span style={{ marginLeft: 12, color: '#facc15' }}>Piece selected — click a highlighted square</span>}
      </div>
      <div style={{ display: 'inline-block', border: '3px solid #44403c', borderRadius: 4, overflow: 'hidden' }}>
        {board.map((row, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {row.map((piece, c) => {
              const isLight = (r + c) % 2 === 0;
              const isSel = selected?.[0] === r && selected?.[1] === c;
              const isMove = moves.some(([mr,mc]) => mr === r && mc === c);
              return (
                <div key={c} onClick={() => handleClick(r, c)} style={{
                  width: CELL, height: CELL, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSel ? '#f59e0b' : isMove ? (piece ? '#ef444460' : '#22c55e60') : isLight ? '#f0d9b5' : '#b58863',
                  cursor: 'pointer', fontSize: CELL * 0.58, userSelect: 'none',
                  transition: 'background 0.1s',
                }}>
                  {isMove && !piece && <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(34,197,94,0.7)' }} />}
                  {piece ? <span style={{ filter: pieceColor(piece) === 'w' ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'none' }}>{GLYPHS[piece]}</span> : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#6b7280' }}>
        Captured: {captured.w.map(p => GLYPHS[p]).join('')} | {captured.b.map(p => GLYPHS[p]).join('')}
      </div>
    </div>
  );
}

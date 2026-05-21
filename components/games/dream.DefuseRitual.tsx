'use client';
/**
 * DEFUSE RITUAL — fusion of speed-tap + minesweeper.
 *
 * Nine seconds. A 6×6 grid. Around the chamber walls, candle-numbers tell you
 * how many mines hide in each row and column. The wall above the grid shows
 * the safe glyph order — tap them in sequence. Hit a mine → lose 2 seconds
 * AND the brand on your hand grows. Clear all safe tiles before time burns out.
 */

import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';

const N = 6;
const TOTAL_TILES = N * N;
const MINE_COUNT = 6;
const TIME_BUDGET_MS = 9_000;
const GLYPHS = ['◆', '○', '△', '✦', '▽', '⌬', '✕', '☉'];

type Phase = 'menu' | 'playing' | 'won' | 'lost';

interface Tile { mine: boolean; glyph: string; revealed: boolean; mineHit: boolean; }

function makeBoard(): { tiles: Tile[]; rowHints: number[]; colHints: number[]; safeOrder: number[]; safeGlyphs: string[] } {
  const tiles: Tile[] = Array.from({ length: TOTAL_TILES }, () => ({ mine: false, glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)], revealed: false, mineHit: false }));
  // Plant mines
  let placed = 0;
  while (placed < MINE_COUNT) {
    const i = Math.floor(Math.random() * TOTAL_TILES);
    if (!tiles[i].mine) { tiles[i].mine = true; placed++; }
  }
  // Hints
  const rowHints = new Array(N).fill(0);
  const colHints = new Array(N).fill(0);
  for (let i = 0; i < TOTAL_TILES; i++) if (tiles[i].mine) {
    rowHints[Math.floor(i / N)]++;
    colHints[i % N]++;
  }
  // Safe-glyph order: pick 5 safe tiles in random order; their glyphs are the wall sigils
  const safeIdx = tiles.map((t, i: number) => ({ t, i })).filter(({ t }) => !t.mine).map(({ i }) => i);
  for (let i = safeIdx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [safeIdx[i], safeIdx[j]] = [safeIdx[j], safeIdx[i]]; }
  const safeOrder = safeIdx.slice(0, 5);
  const safeGlyphs = safeOrder.map((i: number ) => tiles[i].glyph);
  return { tiles, rowHints, colHints, safeOrder, safeGlyphs };
}

export default function DefuseRitual( ){
  const [phase, setPhase] = useState<Phase>('menu');
  const [board, setBoard] = useState(() => makeBoard());
  const [step, setStep] = useState(0);
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(0);
  const [score, setScore] = useState(0);
  const [brand, setBrand] = useState(0);
  const submit = useSubmitScore('defuse-ritual');
  const rafRef = useRef(0);

  const start = useCallback(() => {
    const b = makeBoard();
    setBoard(b);
    setStep(0); setScore(0); setBrand(0);
    const t = performance.now();
    setEndsAt(t + TIME_BUDGET_MS); setNow(t);
    setPhase('playing');
  }, []);
  useGameAutoStart(phase === 'menu' ? start : null);
  useEffect(() => { if (phase === 'won' || phase === 'lost') submit(score); }, [phase, score, submit]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const tick = () => {
      const t = performance.now();
      setNow(t);
      if (t >= endsAt) setPhase('lost');
      else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, endsAt]);

  const tap = useCallback((i: number) => {
    if (phase !== 'playing') return;
    setBoard((b) => {
      const tiles = b.tiles.map((t) => ({ ...t }));
      const t = tiles[i];
      if (t.revealed) return b;
      // Mine tap?
      if (t.mine) {
        t.revealed = true; t.mineHit = true;
        setEndsAt((e: number) => e - 2_000);
        setBrand((br) => br + 1);
        setScore((s) => Math.max(0, Number(s) - 30));
        if (brand + 1 >= 3) setPhase('lost');
        return { ...b, tiles };
      }
      // Glyph order check
      const expected = b.safeGlyphs[step];
      if (expected && t.glyph === expected) {
        t.revealed = true;
        const newStep = step + 1;
        setStep(newStep);
        setScore((s) => s + 50 + Math.floor((endsAt - performance.now()) / 100));
        if (newStep >= b.safeGlyphs.length) {
          // Reveal remaining safe tiles automatically
          for (let k = 0; k < tiles.length; k++) if (!tiles[k].mine) tiles[k].revealed = true;
          setPhase('won');
        }
      } else {
        // Out-of-order safe tap — small penalty
        setEndsAt((e: number) => e - 600);
        setScore((s) => Math.max(0, Number(s) - 5));
      }
      return { ...b, tiles };
    });
  }, [phase, step, brand]);

  const remaining = phase === 'playing' ? Math.max(0, (endsAt - now) / 1000) : 0;
  const expectedGlyph = board.safeGlyphs[step];

  return (
    <div className="flex flex-col items-center gap-3 p-4 min-h-full"
      style={{ background: 'radial-gradient(ellipse at center top, #2a1f10 0%, #0a0606 80%)', color: '#f0c674', fontFamily: '"Iowan Old Style","Palatino",serif' }}>
      <div className="w-full max-w-md flex justify-between items-baseline text-xs tracking-widest">
        <span style={{ color: '#f0c674' }}>🕯 DEFUSE RITUAL</span>
        <span>BRAND {brand}/3 · SCORE {score}</span>
      </div>

      <div className="w-full max-w-md rounded-md border p-4" style={{ borderColor: '#4a2f10', background: 'rgba(10,6,6,0.7)' }}>
        {phase === 'menu' && (
          <div className="text-center flex flex-col items-center gap-3 py-6">
            <h1 className="m-0 text-2xl" style={{ letterSpacing: 4 }}>🕯 DEFUSE RITUAL</h1>
            <p className="max-w-md text-sm leading-6 opacity-80">
              Nine seconds in the Candle Chamber. Tap the safe glyphs in the order the wall shows. Mines burn time. Three brands and the Order takes your hand.
            </p>
            <button onClick={start} className="px-6 py-2 text-sm tracking-widest border rounded" style={{ borderColor: '#f0c674', color: '#f0c674' }}>Light the Candle</button>
          </div>
        )}

        {(phase === 'playing' || phase === 'won' || phase === 'lost') && (
          <>
            {/* Wall sigil sequence */}
            <div className="flex justify-center gap-2 mb-3">
              {board.safeGlyphs.map((g, i: number) => (
                <div key={i} className="w-9 h-9 flex items-center justify-center rounded text-xl"
                  style={{
                    background: i < step ? '#3a2a14' : i === step ? '#5a3a18' : 'rgba(60,40,16,0.4)',
                    border: `1px solid ${i === step ? '#f0c674' : '#5a3f1d'}`,
                    color: i < step ? '#888' : '#f0c674',
                    boxShadow: i === step ? '0 0 12px rgba(240,198,116,0.5)' : 'none',
                  }}>{g}</div>
              ))}
            </div>

            {/* Time bar */}
            <div className="mb-3 h-2 bg-black rounded">
              <div className="h-2 rounded transition-all"
                style={{ width: `${(remaining / (TIME_BUDGET_MS / 1000)) * 100}%`, background: remaining < 3 ? '#aa3a3a' : '#f0c674' }} />
            </div>
            <div className="text-center text-xs mb-2 opacity-70">{remaining.toFixed(1)}s · seek glyph: <span style={{ color: '#f0c674' }}>{expectedGlyph ?? '—'}</span></div>

            {/* Grid with edge hints */}
            <div className="grid" style={{ gridTemplateColumns: `28px repeat(${N}, 1fr)`, gap: 6 }}>
              <div></div>
              {board.colHints.map((h, i: number) => (
                <div key={`ch${i}`} className="text-xs text-center opacity-60">{h}</div>
              ))}
              {board.tiles.map((t, i: number) => {
                const r = Math.floor(i / N); const c = i % N;
                const cell = (
                  <button key={i} onClick={() => tap(i)} disabled={phase !== 'playing' || t.revealed}
                    className="aspect-square rounded text-base font-bold transition-all"
                    style={{
                      background: t.revealed ? (t.mine ? '#5a1a1a' : '#3a2a14') : '#1a120a',
                      border: `1px solid ${t.revealed ? '#5a3f1d' : '#3a2a14'}`,
                      color: t.revealed ? (t.mine ? '#ff8a8a' : '#f0c674') : 'rgba(240,198,116,0.6)',
                      opacity: t.revealed ? 1 : 0.85,
                      cursor: phase === 'playing' && !t.revealed ? 'pointer' : 'default',
                    }}>
                    {t.revealed ? (t.mine ? '✸' : t.glyph) : t.glyph}
                  </button>
                );
                // Insert row hint at start of each row
                if (c === 0) return [
                  <div key={`rh${r}`} className="text-xs text-center opacity-60 self-center">{board.rowHints[r]}</div>,
                  cell,
                ];
                return cell;
              })}
            </div>
          </>
        )}

        {phase === 'won' && (
          <div className="text-center mt-4">
            <h2 style={{ color: '#f0c674' }}>The flame holds.</h2>
            <p className="text-sm">Score: {score}</p>
            <button onClick={start} className="mt-2 px-5 py-2 text-xs tracking-widest border rounded" style={{ borderColor: '#f0c674', color: '#f0c674' }}>Walk the Chamber Again</button>
          </div>
        )}
        {phase === 'lost' && (
          <div className="text-center mt-4">
            <h2 style={{ color: '#aa3a3a' }}>The Order brands you.</h2>
            <p className="text-sm">Score: {score}</p>
            <button onClick={start} className="mt-2 px-5 py-2 text-xs tracking-widest border rounded" style={{ borderColor: '#f0c674', color: '#f0c674' }}>Re-light</button>
          </div>
        )}
      </div>
    </div>
  );
}

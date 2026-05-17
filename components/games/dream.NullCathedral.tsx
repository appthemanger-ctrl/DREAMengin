'use client';
/**
 * NULL CATHEDRAL — fusion of chess + RPG + minesweeper.
 *
 * Iren Vespa descends the Cathedral of Null to find her sister before CASTLE
 * defrags her. Every battle is a chess match played on an 8×8 board where
 * unseen "mnemic mines" lie buried under random tiles. Detonating a mine
 * destroys the piece that stepped on it. Edge-tile glyphs show how many
 * mines border each row/column — your only deductive lever.
 *
 * Render: 2-D canvas (no external deps), candle-gold + stained-glass cyan/violet
 * on near-black, dithered shadows. Real menu → play → victory/defeat states.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useSubmitScore } from '@/lib/games/hooks';
import { ParticlePool, ScreenShake, drawDitherFog, prefersReducedMotion } from './_fx/canvasFx';

type PieceKind = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
type Side = 'iren' | 'castle';
type MineKind = 'standard' | 'spread' | 'time';
interface Piece { kind: PieceKind; side: Side; }
type Cell = Piece | null;
type Phase = 'menu' | 'playing' | 'victory' | 'defeat';

const N = 8;
const CELL = 56;        // px
const SIZE = N * CELL;  // canvas pixel size of board
const MINE_COUNT = 7;

// ── Palette (Bloodborne-on-PS2 stained gloom) ──────────────────────────────
const COL = {
  bgTop:    '#0b0a14',
  bgBot:    '#181020',
  light:    '#3a2c1c',
  dark:     '#1c1118',
  candle:   '#f3c469',
  iren:     '#79e0d8',
  castle:   '#b069ea',
  mine:     '#e25b5b',
  glyph:    '#c4b18d',
  ring:     'rgba(243,196,105,0.45)',
} as const;

const PIECE_GLYPH: Record<PieceKind, string> = {
  P: '♟', N: '♞', B: '♝', R: '♜', Q: '♛', K: '♚',
};

function startBoard(: Cell[][]) {
  const b: Cell[][] = Array.from({ length: N }, () => Array<Cell>(N).fill(null));
  // Iren (bottom)
  b[7][0] = { kind: 'R', side: 'iren' };
  b[7][1] = { kind: 'N', side: 'iren' };
  b[7][2] = { kind: 'B', side: 'iren' };
  b[7][3] = { kind: 'Q', side: 'iren' };
  b[7][4] = { kind: 'K', side: 'iren' };
  b[7][5] = { kind: 'B', side: 'iren' };
  b[7][6] = { kind: 'N', side: 'iren' };
  b[7][7] = { kind: 'R', side: 'iren' };
  for (let c = 0; c < N; c++) b[6][c] = { kind: 'P', side: 'iren' };
  // CASTLE (top) — limited dream-warden composition
  b[0][3] = { kind: 'K', side: 'castle' };
  b[0][4] = { kind: 'Q', side: 'castle' };
  b[0][0] = { kind: 'R', side: 'castle' };
  b[0][7] = { kind: 'R', side: 'castle' };
  b[0][2] = { kind: 'B', side: 'castle' };
  b[0][5] = { kind: 'B', side: 'castle' };
  b[0][1] = { kind: 'N', side: 'castle' };
  b[0][6] = { kind: 'N', side: 'castle' };
  for (let c = 0; c < N; c++) b[1][c] = { kind: 'P', side: 'castle' };
  return b;
}

function plantMines(:) { mines: boolean[][]; kinds: (MineKind | null)[][] } {
  const m: boolean[][] = Array.from({ length: N }, () => Array<boolean>(N).fill(false));
  const k: (MineKind | null)[][] = Array.from({ length: N }, () => Array<MineKind | null>(N).fill(null));
  let placed = 0;
  while (placed < MINE_COUNT) {
    const r = 2 + Math.floor(Math.random() * 4);
    const c = Math.floor(Math.random() * N);
    if (!m[r][c]) {
      m[r][c] = true;
      // 60% standard, 25% spread (chains to neighbors), 15% time (fires next turn)
      const roll = Math.random();
      k[r][c] = roll < 0.6 ? 'standard' : roll < 0.85 ? 'spread' : 'time';
      placed++;
    }
  }
  return { mines: m, kinds: k };
}

/** True if `side`'s king at (kr,kc) would be attacked by any opponent piece on `b`. */
function squareAttacked(b: Cell[][], kr: number, kc: number, byOpp: Side: boolean) {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const p = b[r][c];
    if (!p || p.side !== byOpp) continue;
    // Pawns attack diagonally only — legalMoves() returns forward step too which we don't want here
    if (p.kind === 'P') {
      const dir = byOpp === 'iren' ? -1 : 1;
      if (r + dir === kr && Math.abs(c - kc) === 1) return true;
      continue;
    }
    if (legalMoves(b, r, c).some(([tr, tc]) => tr === kr && tc === kc)) return true;
  }
  return false;
}

// Simplified legal moves — pawns single-step + diagonal capture, knights L-shape,
// bishops/rooks/queens slide, king 1-step. No castling, no en-passant. This is
// enough to make the deductive-sacrifice loop legible.
function legalMoves(b: Cell[][], r: number, c: number: Array<[number, number]>) {
  const piece = b[r][c]; if (!piece) return [];
  const out: Array<[number, number]> = [];
  const slide = (dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < N && nc >= 0 && nc < N) {
      const t = b[nr][nc];
      if (!t) out.push([nr, nc]);
      else { if (t.side !== piece.side) out.push([nr, nc]); break; }
      nr += dr; nc += dc;
    }
  };
  const step = (nr: number, nc: number) => {
    if (nr < 0 || nr >= N || nc < 0 || nc >= N) return;
    const t = b[nr][nc];
    if (!t || t.side !== piece.side) out.push([nr, nc]);
  };
  switch (piece.kind) {
    case 'P': {
      const dir = piece.side === 'iren' ? -1 : 1;
      const fwd = b[r + dir]?.[c];
      if (r + dir >= 0 && r + dir < N && !fwd) out.push([r + dir, c]);
      for (const dc of [-1, 1]) {
        const t = b[r + dir]?.[c + dc];
        if (t && t.side !== piece.side) out.push([r + dir, c + dc]);
      }
      break;
    }
    case 'N':
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) step(r + dr, c + dc);
      break;
    case 'B':
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr, dc);
      break;
    case 'R':
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, dc);
      break;
    case 'Q':
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, dc);
      break;
    case 'K':
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) step(r + dr, c + dc);
      break;
  }
  return out;
}

function rowMineHints(mines: boolean[][]: number[]) {
  return mines.map((row: Record<string, unknown>) => row.filter(Boolean).length);
}
function colMineHints(mines: boolean[][]: number[]) {
  const out = new Array<number>(N).fill(0);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (mines[r][c]) out[c]++;
  return out;
}

// ── Component ───────────────────────────────────────────────────────────────
export default function NullCathedral() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const boardRef = useRef<Cell[][]>(startBoard());
  const initialMines = plantMines();
  const minesRef = useRef<boolean[][]>(initialMines.mines);
  const mineKindsRef = useRef<(MineKind | null)[][]>(initialMines.kinds);
  const triggeredRef = useRef<boolean[][]>(Array.from({ length: N }, () => Array<boolean>(N).fill(false)));
  const timeMineFusesRef = useRef<Array<{ r: number; c: number; turnsLeft: number }>>([]);
  const animRef = useRef<{ fr: number; fc: number; tr: number; tc: number; piece: Piece; t: number } | null>(null);
  const particlesRef = useRef(new ParticlePool(180));
  const shakeRef = useRef(new ScreenShake(7));
  const reducedMotionRef = useRef(false);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [moves, setMoves] = useState<Array<[number, number]>>([]);
  const [turn, setTurn] = useState<Side>('iren');
  const [score, setScore] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const submit = useSubmitScore('null-cathedral');

  const start = useCallback(() => {
    boardRef.current = startBoard();
    const planted = plantMines();
    minesRef.current = planted.mines;
    mineKindsRef.current = planted.kinds;
    triggeredRef.current = Array.from({ length: N }, () => Array<boolean>(N).fill(false));
    timeMineFusesRef.current = [];
    particlesRef.current.clear();
    setSelected(null); setMoves([]); setTurn('iren'); setScore(0);
    setLog(['The Confession Desk is empty. Iren takes the board.']);
    setPhase('playing');
  }, [setPhase]);
  useGameAutoStart(phase === 'menu' ? start : null);
  useEffect(() => { reducedMotionRef.current = prefersReducedMotion(); }, []);

  // Submit on terminal phase
  useEffect(() => { if (phase === 'victory' || phase === 'defeat') submit(score); }, [phase, score, submit]);

  // ── Render loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0; let lastT = performance.now();
    const draw = (t: number) => {
      const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
      const reduced = reducedMotionRef.current;

      // Step physics
      particlesRef.current.step(dt);
      shakeRef.current.step(dt);
      // Animate moving piece
      if (animRef.current) {
        animRef.current.t = Math.min(1, animRef.current.t + dt * 6);
        if (animRef.current.t >= 1) animRef.current = null;
      }

      ctx.save();
      shakeRef.current.apply(ctx, reduced ? 0.2 : 1);

      // Background gradient
      const g = ctx.createLinearGradient(0, 0, 0, SIZE);
      g.addColorStop(0, COL.bgTop); g.addColorStop(1, COL.bgBot);
      ctx.fillStyle = g; ctx.fillRect(0, 0, SIZE, SIZE);

      // Parallax nave — three receding arch layers (slow drift)
      const drift = reduced ? 0 : t / 4000;
      for (let layer = 0; layer < 3; layer++) {
        const depth = 0.4 + layer * 0.25;
        const y = SIZE * (0.18 + layer * 0.22);
        const archW = SIZE * (0.55 - layer * 0.12);
        const cx = SIZE / 2 + Math.sin(drift + layer) * 6;
        ctx.fillStyle = `rgba(243,196,105,${0.025 + layer * 0.01})`;
        ctx.beginPath();
        ctx.ellipse(cx, y, archW, archW * 0.55, 0, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = `rgba(243,196,105,${0.04 + layer * 0.02})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Board squares + per-cell stained-glass rim-light
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const base = (r + c) % 2 === 0 ? COL.light : COL.dark;
        ctx.fillStyle = base;
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        // Rim-light: thin top/left bevel
        ctx.fillStyle = 'rgba(243,196,105,0.06)';
        ctx.fillRect(c * CELL, r * CELL, CELL, 1);
        ctx.fillRect(c * CELL, r * CELL, 1, CELL);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(c * CELL, r * CELL + CELL - 1, CELL, 1);
        // Dithered candle bloom (rolling)
        if ((r + c + Math.floor(t / 200)) % 7 === 0) {
          ctx.fillStyle = 'rgba(243,196,105,0.05)';
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        }
      }

      // Dithered cathedral fog band rolling across the board
      if (!reduced) {
        const bandY = ((t / 30) % (SIZE + 80)) - 40;
        drawDitherFog(ctx, 0, bandY, SIZE, 50, 'rgba(243,196,105,0.18)', 0.5, 4);
      }

      // Edge mine hints
      ctx.fillStyle = COL.glyph; ctx.font = '14px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const rh = rowMineHints(minesRef.current);
      const ch = colMineHints(minesRef.current);
      for (let i = 0; i < N; i++) {
        ctx.fillText(String(rh[i]), 10, i * CELL + CELL / 2);
        ctx.fillText(String(ch[i]), i * CELL + CELL / 2, 10);
      }

      // Triggered mines (visible craters) + ink-bloom for time mines about to fire
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (triggeredRef.current[r][c]) {
        ctx.fillStyle = 'rgba(226,91,91,0.25)';
        ctx.fillRect(c * CELL + 4, r * CELL + 4, CELL - 8, CELL - 8);
      }
      for (const fuse of timeMineFusesRef.current) {
        const cx = fuse.c * CELL + CELL / 2;
        const cy = fuse.r * CELL + CELL / 2;
        const pulse = (Math.sin(t / 120) + 1) / 2;
        ctx.strokeStyle = `rgba(226,91,91,${0.25 + pulse * 0.45})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, 18 + pulse * 4, 0, Math.PI * 2); ctx.stroke();
      }

      // Highlight selected & legal moves
      if (selected) {
        ctx.strokeStyle = COL.candle; ctx.lineWidth = 2;
        ctx.strokeRect(selected.c * CELL + 2, selected.r * CELL + 2, CELL - 4, CELL - 4);
        for (const [r, c] of moves) {
          ctx.fillStyle = COL.ring;
          ctx.beginPath();
          ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 8 + Math.sin(t / 200) * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Pieces (with eased animation for the mover)
      ctx.font = `${Math.floor(CELL * 0.7)}px serif`;
      const anim = animRef.current;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const p = boardRef.current[r][c]; if (!p) continue;
        // skip drawing the moving piece at its destination — we'll draw the lerped sprite below
        if (anim && anim.tr === r && anim.tc === c) continue;
        ctx.fillStyle = p.side === 'iren' ? COL.iren : COL.castle;
        ctx.shadowColor = p.side === 'iren' ? COL.iren : COL.castle;
        ctx.shadowBlur = 8;
        ctx.fillText(PIECE_GLYPH[p.kind], c * CELL + CELL / 2, r * CELL + CELL / 2 + 2);
        ctx.shadowBlur = 0;
      }
      if (anim) {
        const ease = 1 - Math.pow(1 - anim.t, 3);
        const x = (anim.fc + (anim.tc - anim.fc) * ease) * CELL + CELL / 2;
        const y = (anim.fr + (anim.tr - anim.fr) * ease) * CELL + CELL / 2 + 2;
        ctx.fillStyle = anim.piece.side === 'iren' ? COL.iren : COL.castle;
        ctx.shadowColor = anim.piece.side === 'iren' ? COL.iren : COL.castle;
        ctx.shadowBlur = 14;
        ctx.fillText(PIECE_GLYPH[anim.piece.kind], x, y);
        ctx.shadowBlur = 0;
      }

      // Particles on top
      particlesRef.current.draw(ctx);

      ctx.restore();

      // Diegetic candle-flame turn indicator (top-right corner of canvas)
      const flameX = SIZE - 22, flameY = 22;
      const flick = 1 + Math.sin(t / 90) * 0.15;
      ctx.fillStyle = turn === 'iren' ? COL.iren : COL.castle;
      ctx.shadowColor = turn === 'iren' ? COL.iren : COL.castle;
      ctx.shadowBlur = 14 * flick;
      ctx.beginPath();
      ctx.ellipse(flameX, flameY, 5, 9 * flick, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [selected, moves, turn]);

  // ── Click handling ─────────────────────────────────────────────────────────
  const onCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== 'playing' || turn !== 'iren') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (SIZE / rect.width);
    const y = (e.clientY - rect.top) * (SIZE / rect.height);
    const c = Math.floor(x / CELL); const r = Math.floor(y / CELL);
    if (r < 0 || r >= N || c < 0 || c >= N) return;
    const p = boardRef.current[r][c];

    if (selected) {
      const isMove = moves.some(([mr, mc]) => mr === r && mc === c);
      if (isMove) {
        movePiece(selected.r, selected.c, r, c, 'iren');
        setSelected(null); setMoves([]);
        return;
      }
    }
    if (p && p.side === 'iren') {
      // Filter: king cannot move into a square attacked next half-move (basic check detection)
      const raw = legalMoves(boardRef.current, r, c);
      let filtered = raw;
      if (p.kind === 'K') {
        filtered = raw.filter(([tr, tc]) => {
          const trial = boardRef.current.map((row: Record<string, unknown>) => row.slice());
          trial[r][c] = null;
          trial[tr][tc] = p;
          return !squareAttacked(trial, tr, tc, 'castle');
        });
      }
      setSelected({ r, c });
      setMoves(filtered);
    } else {
      setSelected(null); setMoves([]);
    }
  }, [moves, selected, turn, phaseRef]);

  // Move a piece, handle mine + capture, then trigger CASTLE turn.
  const movePiece = (fr: number, fc: number, tr: number, tc: number, side: Side) => {
    const b = boardRef.current.map((row: Record<string, unknown>) => row.slice());
    const moved = b[fr][fc]!; const captured = b[tr][tc];
    b[fr][fc] = null; b[tr][tc] = moved;
    animRef.current = { fr, fc, tr, tc, piece: moved, t: 0 };

    let logEntry = `${side === 'iren' ? 'Iren' : 'CASTLE'} ${PIECE_GLYPH[moved.kind]} → ${'abcdefgh'[tc]}${8 - tr}`;
    let pts = 0;
    if (captured) {
      pts += captured.kind === 'K' ? 500 : 30;
      logEntry += ` · captures ${PIECE_GLYPH[captured.kind]}`;
      // Candle-flame burst on capture
      const px = tc * CELL + CELL / 2, py = tr * CELL + CELL / 2;
      particlesRef.current.burst(px, py, 14, { color: COL.candle, speed: 90, size: 1.6, maxLife: 0.7, gravity: -40, drag: 0.94 });
      shakeRef.current.kick(2);
      if (captured.kind === 'K' && captured.side === 'castle') {
        boardRef.current = b;
        setScore(s: string => s + pts);
        setLog(l: Record<string, unknown> => [logEntry + ' · CASTLE collapses.', ...l].slice(0, 8));
        setPhase('victory');
        return;
      }
      if (captured.kind === 'K' && captured.side === 'iren') {
        boardRef.current = b;
        setScore(s: string => s + pts);
        setLog(l: Record<string, unknown> => [logEntry + ' · Iren is overwritten.', ...l].slice(0, 8));
        setPhase('defeat');
        return;
      }
    }

    // Mine check — three archetypes
    if (minesRef.current[tr][tc] && !triggeredRef.current[tr][tc]) {
      const kind = mineKindsRef.current[tr][tc] ?? 'standard';
      triggeredRef.current[tr][tc] = true;
      // Real radial shock + ink-bloom particles
      const px = tc * CELL + CELL / 2, py = tr * CELL + CELL / 2;
      particlesRef.current.burst(px, py, 26, { color: COL.mine, speed: 220, size: 2, maxLife: 0.8, drag: 0.9 });
      particlesRef.current.burst(px, py, 18, { color: '#1c0608', speed: 90, size: 3, maxLife: 1.1, drag: 0.85 });
      shakeRef.current.kick(8);

      if (kind === 'standard') {
        b[tr][tc] = null;
        logEntry += ' · MNEMIC MINE — piece scarred';
        pts += 5;
      } else if (kind === 'spread') {
        // Detonates this tile + 4 cardinal neighbors (any pieces vaporized)
        b[tr][tc] = null;
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nr = tr + dr, nc = tc + dc;
          if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
          if (b[nr][nc]) b[nr][nc] = null;
          particlesRef.current.burst(nc * CELL + CELL / 2, nr * CELL + CELL / 2, 10, { color: COL.mine, speed: 150, size: 1.6, maxLife: 0.5, drag: 0.9 });
        }
        logEntry += ' · SPREAD-MINE chains the cross';
        pts += 10;
      } else {
        // Time-mine: arms a fuse that fires after the opponent's turn
        b[tr][tc] = null;
        timeMineFusesRef.current.push({ r: tr, c: tc, turnsLeft: 1 });
        logEntry += ' · TIME-MINE armed';
        pts += 8;
      }
      if (moved.kind === 'K') {
        boardRef.current = b;
        setLog(l: Record<string, unknown> => [logEntry + ` · ${side === 'iren' ? 'Iren' : 'CASTLE'} king lost.`, ...l].slice(0, 8));
        setPhase(side === 'iren' ? 'defeat' : 'victory');
        return;
      }
    }

    boardRef.current = b;

    // Tick time-mine fuses (fire when reaching 0)
    const surviving: Array<{ r: number; c: number; turnsLeft: number }> = [];
    for (const fuse of timeMineFusesRef.current) {
      if (fuse.turnsLeft <= 0) {
        // Detonate now — clear any piece sitting on this tile
        const px = fuse.c * CELL + CELL / 2, py = fuse.r * CELL + CELL / 2;
        particlesRef.current.burst(px, py, 22, { color: COL.mine, speed: 200, size: 2, maxLife: 0.7, drag: 0.9 });
        shakeRef.current.kick(6);
        const sit = b[fuse.r][fuse.c];
        if (sit) {
          if (sit.kind === 'K') {
            setLog(l: Record<string, unknown> => [`Time-mine takes ${sit.side === 'iren' ? 'Iren' : 'CASTLE'} king`, ...l].slice(0, 8));
            setPhase(sit.side === 'iren' ? 'defeat' : 'victory');
            return;
          }
          b[fuse.r][fuse.c] = null;
        }
      } else {
        surviving.push({ r: fuse.r, c: fuse.c, turnsLeft: fuse.turnsLeft - 1 });
      }
    }
    timeMineFusesRef.current = surviving;

    setScore(s: string => s + pts);
    setLog(l: Record<string, unknown> => [logEntry, ...l].slice(0, 8));
    setTurn(side === 'iren' ? 'castle' : 'iren');
  };

  // CASTLE AI: pick a random legal move (prefers captures)
  useEffect(() => {
    if (phase !== 'playing' || turn !== 'castle') return;
    const t = setTimeout(() => {
      const b = boardRef.current;
      const candidates: Array<{ fr: number; fc: number; tr: number; tc: number; cap: boolean }> = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const p = b[r][c]; if (!p || p.side !== 'castle') continue;
        for (const [tr, tc] of legalMoves(b, r, c)) {
          candidates.push({ fr: r, fc: c, tr, tc, cap: !!b[tr][tc] });
        }
      }
      if (candidates.length === 0) { setPhase('victory'); return; }
      const caps = candidates.filter((m: Record<string, unknown>) => m.cap);
      const pool = caps.length > 0 && Math.random() < 0.7 ? caps : candidates;
      const m = pool[Math.floor(Math.random() * pool.length)];
      movePiece(m.fr, m.fc, m.tr, m.tc, 'castle');
    }, 700);
    return () => clearTimeout(t);
  }, [phase, turn, movePiece, setPhase]);

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16, background: 'linear-gradient(180deg, #06050a 0%, #11091a 100%)', color: '#e8e0d0', minHeight: '100%', fontFamily: '"Iowan Old Style", "Palatino", serif' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: SIZE }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          onClick={onCanvasClick}
          style={{ width: '100%', height: 'auto', maxWidth: SIZE, imageRendering: 'pixelated', borderRadius: 8, boxShadow: '0 0 60px rgba(243,196,105,0.15) inset, 0 8px 30px rgba(0,0,0,0.6)' }}
        />
        {phase === 'menu' && (
          <Overlay>
            <h1 style={{ fontSize: 36, color: COL.candle, margin: 0, letterSpacing: 4 }}>♟ NULL CATHEDRAL</h1>
            <p style={{ maxWidth: 460, textAlign: 'center', color: '#bfb39a', lineHeight: 1.5 }}>
              <em>Iren Vespa, excommunicated archivist, descends to find her sister&apos;s archived consciousness before CASTLE — a chess-engine angel — defrags her.</em>
            </p>
            <p style={{ color: COL.iren, fontSize: 13 }}>Edge glyphs count buried mnemic mines. Step carefully.</p>
            <button onClick={start} style={btn}>Begin the Defrag</button>
          </Overlay>
        )}
        {phase === 'victory' && (
          <Overlay>
            <h1 style={{ color: COL.candle, fontSize: 30, letterSpacing: 3 }}>The cycle stalls.</h1>
            <p style={{ color: '#bfb39a' }}>CASTLE&apos;s king topples. Score: {score}</p>
            <button onClick={start} style={btn}>Descend Again</button>
          </Overlay>
        )}
        {phase === 'defeat' && (
          <Overlay>
            <h1 style={{ color: COL.castle, fontSize: 30, letterSpacing: 3 }}>Overwritten.</h1>
            <p style={{ color: '#bfb39a' }}>Iren is folded into the next defrag. Score: {score}</p>
            <button onClick={start} style={btn}>Try the Confession Desk</button>
          </Overlay>
        )}
      </div>
      <div style={{ width: '100%', maxWidth: SIZE, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, letterSpacing: 2, color: '#8d8068' }}>
        <span style={{ color: turn === 'iren' ? COL.iren : COL.castle }}>
          ● {turn === 'iren' ? 'IREN' : 'CASTLE'}
        </span>
        <span>
          {boardRef.current.flat().filter((p: Record<string, unknown>) => p && p.side === 'iren').length}
          <span style={{ color: '#3a2c1c' }}> · </span>
          {boardRef.current.flat().filter((p: Record<string, unknown>) => p && p.side === 'castle').length}
        </span>
        <span>{score}</span>
      </div>
    </div>
  );
}

const Overlay = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16,
    background: 'radial-gradient(ellipse at center, rgba(11,10,20,0.85) 0%, rgba(11,10,20,0.97) 100%)',
    borderRadius: 8,
  }}>{children}</div>
);

const btn: React.CSSProperties = {
  background: 'linear-gradient(180deg, #2a1f10 0%, #110a05 100%)',
  border: '1px solid rgba(243,196,105,0.5)',
  color: COL.candle, padding: '10px 24px', borderRadius: 4,
  fontSize: 13, letterSpacing: 3, cursor: 'pointer',
  fontFamily: 'inherit',
};

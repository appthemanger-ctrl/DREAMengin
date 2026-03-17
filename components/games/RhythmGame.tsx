'use client';
/**
 * RhythmGame — Tap to the beat rhythm game.
 * Category: music / rhythm
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGamePhase } from '@/lib/games/hooks';

const CW = 420; const CH = 520;
const LANES = 4;
const LANE_W = CW / LANES;
const HIT_Y = CH - 70;
const HIT_WINDOW = 50;
const NOTE_SPEED = 3.5;
type Phase = 'menu' | 'playing' | 'done';

const LANE_COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b'];
const LANE_KEYS = ['A','S','K','L'];
const LANE_ARROWS = ['←','↓','↑','→'];

interface Note { id: number; lane: number; y: number; hit: boolean; missed: boolean; }
interface Effect { x: number; y: number; text: string; color: string; alpha: number; vy: number; }

const PATTERN: [number, number][] = [
  [0,0],[1,1],[2,2],[3,3],[0,4],[2,4],[1,5],[3,5],
  [0,6],[1,7],[2,6],[3,7],[0,8],[3,8],[1,9],[2,9],
  [0,10],[2,10],[1,11],[3,11],[0,12],[1,12],[2,13],[3,13],
  [0,14],[3,14],[2,15],[1,15],[0,16],[2,16],[3,16],[1,17],
];

let noteId = 0;

export default function RhythmGame() {
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const notesRef = useRef<Note[]>([]);
  const effectsRef = useRef<Effect[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const beatsRef = useRef(0);
  const patternIdxRef = useRef(0);
  const beatTimerRef = useRef(0);
  const rafRef = useRef(0);
  const pressedRef = useRef<Set<number>>(new Set());

  const startGame = useCallback(() => {
    noteId = 0; notesRef.current = []; effectsRef.current = [];
    scoreRef.current = 0; comboRef.current = 0; beatsRef.current = 0;
    patternIdxRef.current = 0; beatTimerRef.current = 0; pressedRef.current = new Set();
    setScore(0); setCombo(0); setPhase('playing');
  }, [setPhase]);

  const hitLane = useCallback((lane: number) => {
    if (phaseRef.current !== 'playing') return;
    pressedRef.current.add(lane);
    setTimeout(() => pressedRef.current.delete(lane), 120);

    const note = notesRef.current.find(n => !n.hit && !n.missed && n.lane === lane && Math.abs(n.y - HIT_Y) < HIT_WINDOW);
    if (note) {
      note.hit = true;
      const dist = Math.abs(note.y - HIT_Y);
      let pts = 100; let text = 'PERFECT!'; let color = '#facc15';
      if (dist > 25) { pts = 50; text = 'GOOD'; color = '#86efac'; }
      const newCombo = comboRef.current + 1;
      comboRef.current = newCombo;
      scoreRef.current += pts * (1 + Math.floor(newCombo / 5) * 0.2);
      effectsRef.current.push({ x: lane * LANE_W + LANE_W / 2, y: HIT_Y - 20, text, color, alpha: 1, vy: -1.5 });
    } else {
      effectsRef.current.push({ x: lane * LANE_W + LANE_W / 2, y: HIT_Y - 20, text: 'MISS', color: '#f87171', alpha: 1, vy: -1.5 });
      comboRef.current = 0;
    }
    setCombo(comboRef.current); setScore(Math.floor(scoreRef.current));
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      const idx = LANE_KEYS.indexOf(e.key.toUpperCase());
      if (idx !== -1) { e.preventDefault(); hitLane(idx); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, hitLane]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const loop = () => {
      if (phaseRef.current !== 'playing') return;
      ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, CW, CH);

      // Lane backgrounds
      for (let i = 0; i < LANES; i++) {
        ctx.fillStyle = `${LANE_COLORS[i]}12`;
        ctx.fillRect(i * LANE_W, 0, LANE_W, CH);
        ctx.strokeStyle = `${LANE_COLORS[i]}30`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo((i+1) * LANE_W, 0); ctx.lineTo((i+1) * LANE_W, CH); ctx.stroke();
        // Hit zone
        const pressed = pressedRef.current.has(i);
        ctx.fillStyle = pressed ? `${LANE_COLORS[i]}50` : `${LANE_COLORS[i]}20`;
        ctx.beginPath(); ctx.roundRect(i * LANE_W + 4, HIT_Y - 18, LANE_W - 8, 36, 8); ctx.fill();
        ctx.strokeStyle = `${LANE_COLORS[i]}${pressed ? 'ff' : '80'}`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(i * LANE_W + 4, HIT_Y - 18, LANE_W - 8, 36, 8); ctx.stroke();
        // Key label
        ctx.fillStyle = `${LANE_COLORS[i]}cc`; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
        ctx.fillText(LANE_KEYS[i], i * LANE_W + LANE_W / 2, HIT_Y + 5);
      }
      ctx.textAlign = 'left';

      // Spawn notes
      beatTimerRef.current++;
      const BPM_TICK = 28;
      if (beatTimerRef.current >= BPM_TICK) {
        beatTimerRef.current = 0;
        beatsRef.current++;
        const toSpawn = PATTERN.filter(([, beat]) => beat === patternIdxRef.current % 18);
        if (toSpawn.length > 0) {
          for (const [lane] of toSpawn) {
            notesRef.current.push({ id: noteId++, lane, y: -20, hit: false, missed: false });
          }
          patternIdxRef.current++;
        }
        if (beatsRef.current >= 100) {
          setBest(b => Math.max(b, Math.floor(scoreRef.current)));
          setScore(Math.floor(scoreRef.current));
          setPhase('done'); return;
        }
      }

      // Move notes
      for (const n of notesRef.current) {
        if (!n.hit) { n.y += NOTE_SPEED; if (n.y > HIT_Y + HIT_WINDOW && !n.missed) { n.missed = true; comboRef.current = 0; } }
      }
      notesRef.current = notesRef.current.filter(n => n.y < CH + 20);

      // Draw notes
      for (const n of notesRef.current) {
        if (n.hit) continue;
        const x = n.lane * LANE_W;
        const missed = n.missed;
        ctx.fillStyle = missed ? '#374151' : LANE_COLORS[n.lane];
        ctx.shadowColor = missed ? 'transparent' : `${LANE_COLORS[n.lane]}88`;
        ctx.shadowBlur = missed ? 0 : 12;
        ctx.beginPath(); ctx.roundRect(x + 6, n.y - 12, LANE_W - 12, 24, 6); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Effects
      for (const e of effectsRef.current) {
        ctx.fillStyle = e.color; ctx.globalAlpha = e.alpha; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
        ctx.fillText(e.text, e.x, e.y); ctx.textAlign = 'left';
        e.y += e.vy; e.alpha -= 0.025;
      }
      ctx.globalAlpha = 1;
      effectsRef.current = effectsRef.current.filter(e => e.alpha > 0);

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, CW, 30);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace';
      ctx.fillText(`Score: ${Math.floor(scoreRef.current)}`, 8, 20);
      if (comboRef.current > 1) { ctx.fillStyle = '#facc15'; ctx.fillText(`×${comboRef.current} COMBO`, CW / 2 - 40, 20); }
      ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'right'; ctx.fillText(`${Math.min(100, beatsRef.current)}%`, CW - 8, 20); ctx.textAlign = 'left';

      setScore(Math.floor(scoreRef.current)); setCombo(comboRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, phaseRef]);

  if (phase === 'menu') return (
    <div style={{ background: '#0a0a0f', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#a78bfa' }}>🎵 RHYTHM MASTER</div>
      <div style={{ display: 'flex', gap: 12 }}>
        {LANE_COLORS.map((c, i) => <div key={i} style={{ width: 48, height: 48, background: c, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18 }}>{LANE_ARROWS[i]}</div>)}
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>Press A/S/K/L when notes reach the hit zone!</div>
      {best > 0 && <div style={{ color: '#facc15', fontSize: 13 }}>Best: {best}</div>}
      <button onClick={startGame} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Start</button>
    </div>
  );
  if (phase === 'done') return (
    <div style={{ background: '#0a0a0f', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 26, color: '#a78bfa', fontWeight: 900 }}>🎵 Done!</div>
      <div style={{ fontSize: 22, color: '#facc15', fontWeight: 700 }}>Score: {score}</div>
      <div style={{ fontSize: 13, color: '#9ca3af' }}>Best: {best}</div>
      <button onClick={startGame} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Play Again</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <canvas ref={canvasRef} width={CW} height={CH} style={{ width: '100%', maxWidth: CW, borderRadius: 8, display: 'block', border: '2px solid rgba(167,139,250,0.3)' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        {LANE_COLORS.map((c, i) => (
          <button key={i} onPointerDown={() => hitLane(i)} style={{ width: 50, height: 50, background: c, border: 'none', borderRadius: 8, color: '#fff', fontSize: 20, fontWeight: 900, cursor: 'pointer' }}>{LANE_ARROWS[i]}</button>
        ))}
      </div>
    </div>
  );
}

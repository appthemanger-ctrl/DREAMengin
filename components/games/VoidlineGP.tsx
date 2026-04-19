'use client';
/**
 * VOIDLINE GP — fusion of racing + space-shooter + rhythm.
 *
 * Yuna "Telegraph" Orr races the illegal courier circuit above Lucid Avenue.
 * Hold throttle, weave the asteroid corridor, fire only on the soundtrack
 * downbeat — off-beat shots overheat the engine and slow the ship. Chain
 * perfect-beat actions to fill Resonance and warp past Coda.
 *
 * Render: 2-D canvas, neon-orange/magenta on indigo, scanline overlay,
 * pulsing HUD beat ring, chromatic-aberration on speed.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useSubmitScore } from '@/lib/games/hooks';

const W = 640;
const H = 720;
const BPM = 132;
const BEAT_MS = (60 / BPM) * 1000;          // 454.5ms per beat
const HIT_WINDOW = 110;                      // ±ms tolerance for "on-beat"
const PERFECT_WINDOW = 45;
const TRACK_W = 360;
const SHIP_Y = H - 110;
const RACE_DURATION_MS = 90_000;             // 90s race

type Phase = 'menu' | 'playing' | 'win' | 'lose';
interface Asteroid { x: number; y: number; r: number; vy: number; }
interface Rival { x: number; y: number; speed: number; lane: number; hp: number; }
interface Bullet { x: number; y: number; }

const COL = {
  bg0: '#0a0826',
  bg1: '#16093a',
  track: '#1d1245',
  trackEdge: '#ff6a3d',
  neon: '#ff6a3d',
  hot: '#ff2d6d',
  cool: '#7be7ff',
  hudBg: 'rgba(8,4,24,0.85)',
  perfect: '#ffe76b',
} as const;

export default function VoidlineGP() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const shipXRef = useRef(W / 2);
  const shipVxRef = useRef(0);
  const heatRef = useRef(0);                 // 0..1 engine overheat
  const resoRef = useRef(0);                 // 0..1 Resonance gauge
  const positionRef = useRef(0);             // race progress 0..1
  const startTimeRef = useRef(0);
  const lastBeatRef = useRef(0);
  const beatPhaseRef = useRef(0);            // 0..1 inside current beat
  const asteroidsRef = useRef<Asteroid[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const rivalsRef = useRef<Rival[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const [hud, setHud] = useState({ score: 0, combo: 0, reso: 0, heat: 0, pos: 0, beat: 0, lastHit: '' as 'PERFECT' | 'GOOD' | 'OFF' | '' });
  const submit = useSubmitScore('voidline-gp');

  const start = useCallback(() => {
    shipXRef.current = W / 2; shipVxRef.current = 0;
    heatRef.current = 0; resoRef.current = 0; positionRef.current = 0;
    asteroidsRef.current = []; bulletsRef.current = []; comboRef.current = 0;
    rivalsRef.current = [
      { x: W / 2 - 60, y: 280, speed: 0.0009, lane: 0, hp: 3 },
      { x: W / 2 + 60, y: 200, speed: 0.0011, lane: 1, hp: 3 },
      { x: W / 2,      y: 120, speed: 0.00125, lane: 2, hp: 5 }, // Coda — boss
    ];
    scoreRef.current = 0;
    startTimeRef.current = performance.now();
    lastBeatRef.current = startTimeRef.current;
    setPhase('playing');
  }, [setPhase]);
  useGameAutoStart(phase === 'menu' ? start : null);

  useEffect(() => { if (phase === 'win' || phase === 'lose') submit(scoreRef.current); }, [phase, submit]);

  // Input
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key.startsWith('Arrow')) e.preventDefault();
      if (phaseRef.current === 'playing' && (e.key === ' ' || e.key === 'z' || e.key === 'Z')) tryFire();
      if (phaseRef.current === 'playing' && (e.key === 'Shift' || e.key === 'x' || e.key === 'X')) tryBoost();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [phaseRef]);

  // Touch fire
  const tryFire = useCallback(() => {
    const dt = (performance.now() - lastBeatRef.current);
    const offset = Math.min(dt, BEAT_MS - dt);
    if (offset < PERFECT_WINDOW) {
      bulletsRef.current.push({ x: shipXRef.current, y: SHIP_Y });
      bulletsRef.current.push({ x: shipXRef.current - 14, y: SHIP_Y });
      bulletsRef.current.push({ x: shipXRef.current + 14, y: SHIP_Y });
      comboRef.current += 1;
      resoRef.current = Math.min(1, resoRef.current + 0.08);
      scoreRef.current += 50 + comboRef.current * 5;
      setHud((h) => ({ ...h, lastHit: 'PERFECT' }));
    } else if (offset < HIT_WINDOW) {
      bulletsRef.current.push({ x: shipXRef.current, y: SHIP_Y });
      comboRef.current += 1;
      resoRef.current = Math.min(1, resoRef.current + 0.04);
      scoreRef.current += 25;
      setHud((h) => ({ ...h, lastHit: 'GOOD' }));
    } else {
      heatRef.current = Math.min(1, heatRef.current + 0.18);
      comboRef.current = 0;
      setHud((h) => ({ ...h, lastHit: 'OFF' }));
    }
  }, []);

  const tryBoost = useCallback(() => {
    if (resoRef.current < 0.5) return;
    resoRef.current -= 0.5;
    positionRef.current = Math.min(1, positionRef.current + 0.05);
    scoreRef.current += 200;
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0; let lastT = performance.now();

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;

      if (phaseRef.current === 'playing') {
        // Beat tracking
        while (t - lastBeatRef.current >= BEAT_MS) lastBeatRef.current += BEAT_MS;
        beatPhaseRef.current = (t - lastBeatRef.current) / BEAT_MS;

        // Steer
        const k = keysRef.current;
        let ax = 0;
        if (k.has('ArrowLeft') || k.has('a') || k.has('A')) ax -= 1500;
        if (k.has('ArrowRight') || k.has('d') || k.has('D')) ax += 1500;
        shipVxRef.current += ax * dt;
        shipVxRef.current *= 0.88;
        shipXRef.current = Math.max((W - TRACK_W) / 2 + 24, Math.min((W + TRACK_W) / 2 - 24, shipXRef.current + shipVxRef.current * dt));

        // Heat decay
        heatRef.current = Math.max(0, heatRef.current - 0.15 * dt);
        // Auto progress (slowed by heat, accelerated by Resonance trickle)
        const baseRate = 0.0085;
        positionRef.current = Math.min(1, positionRef.current + baseRate * dt * (1 - heatRef.current * 0.5));

        // Spawn asteroids
        if (Math.random() < 0.04 + positionRef.current * 0.06) {
          asteroidsRef.current.push({
            x: (W - TRACK_W) / 2 + 30 + Math.random() * (TRACK_W - 60),
            y: -30,
            r: 14 + Math.random() * 18,
            vy: 200 + Math.random() * 220 + positionRef.current * 280,
          });
        }
        // Update asteroids + collisions
        for (const a of asteroidsRef.current) a.y += a.vy * dt;
        for (const a of asteroidsRef.current) {
          const dx = a.x - shipXRef.current, dy = a.y - SHIP_Y;
          if (Math.hypot(dx, dy) < a.r + 14) {
            heatRef.current = Math.min(1, heatRef.current + 0.4);
            comboRef.current = 0;
            a.y = H + 100;
          }
        }
        asteroidsRef.current = asteroidsRef.current.filter((a) => a.y < H + 40);

        // Bullets
        for (const b of bulletsRef.current) b.y -= 720 * dt;
        // Bullet → asteroid collisions
        for (const b of bulletsRef.current) {
          for (const a of asteroidsRef.current) {
            if (Math.hypot(a.x - b.x, a.y - b.y) < a.r) { a.y = H + 100; b.y = -100; scoreRef.current += 10; }
          }
          for (const r of rivalsRef.current) {
            if (Math.hypot(r.x - b.x, r.y - b.y) < 22) { r.hp -= 1; b.y = -100; scoreRef.current += 30; }
          }
        }
        bulletsRef.current = bulletsRef.current.filter((b) => b.y > -10);

        // Rivals drift
        for (const r of rivalsRef.current) {
          r.y += Math.sin((t / 600) + r.lane) * 12 * dt;
          r.x += Math.sin((t / 800) + r.lane * 2) * 18 * dt;
        }
        rivalsRef.current = rivalsRef.current.filter((r) => r.hp > 0);

        // Win conditions: pass position 1.0 OR knock out Coda + 2 rivals
        if (positionRef.current >= 1 || rivalsRef.current.length === 0) { setPhase('win'); }
        if (heatRef.current >= 1 && t - startTimeRef.current > 5_000) {
          // overheat penalty becomes terminal if sustained — cap as scratched run
        }
        if (t - startTimeRef.current > RACE_DURATION_MS && rivalsRef.current.length > 0) { setPhase('lose'); }
      }

      // ── Render ───────────────────────────────────────────────────────────
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, COL.bg0); g.addColorStop(1, COL.bg1);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // Track
      ctx.fillStyle = COL.track;
      ctx.fillRect((W - TRACK_W) / 2, 0, TRACK_W, H);

      // Scrolling lane lines (Saturn-ring tunnel parallax)
      const scroll = (t / 4) % 60;
      ctx.strokeStyle = 'rgba(255,106,61,0.35)';
      ctx.lineWidth = 2;
      for (let y = -60 + scroll; y < H; y += 60) {
        ctx.beginPath();
        ctx.moveTo((W - TRACK_W) / 2 + 60, y);
        ctx.lineTo((W - TRACK_W) / 2 + 60, y + 30);
        ctx.moveTo((W + TRACK_W) / 2 - 60, y);
        ctx.lineTo((W + TRACK_W) / 2 - 60, y + 30);
        ctx.stroke();
      }
      ctx.strokeStyle = COL.trackEdge; ctx.lineWidth = 4;
      ctx.strokeRect((W - TRACK_W) / 2, 0, TRACK_W, H);

      // Asteroids
      for (const a of asteroidsRef.current) {
        ctx.fillStyle = '#3d2a1a'; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = COL.neon; ctx.lineWidth = 1.5; ctx.stroke();
      }

      // Rivals
      for (const r of rivalsRef.current) {
        ctx.fillStyle = r.hp > 3 ? COL.hot : '#88aaff';
        ctx.beginPath();
        ctx.moveTo(r.x, r.y - 14); ctx.lineTo(r.x + 12, r.y + 12); ctx.lineTo(r.x - 12, r.y + 12);
        ctx.closePath(); ctx.fill();
      }

      // Bullets
      ctx.fillStyle = COL.cool;
      for (const b of bulletsRef.current) {
        ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
      }

      // Ship
      ctx.save();
      ctx.translate(shipXRef.current, SHIP_Y);
      ctx.rotate(shipVxRef.current * 0.001);
      ctx.fillStyle = COL.neon;
      ctx.shadowColor = COL.neon; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(14, 14); ctx.lineTo(-14, 14); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = COL.cool; ctx.fillRect(-3, -6, 6, 14);
      ctx.restore();

      // Scanlines (CRT)
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

      // HUD — beat ring
      const cx = W - 70, cy = 70;
      const beatPulse = 1 - beatPhaseRef.current;
      ctx.strokeStyle = beatPulse > 0.85 ? COL.perfect : COL.cool;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, 28 + beatPulse * 12, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = COL.cool; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('BEAT', cx, cy);

      // HUD — gauges
      ctx.fillStyle = COL.hudBg; ctx.fillRect(10, 10, 200, 90);
      ctx.fillStyle = COL.cool; ctx.font = '11px monospace'; ctx.textAlign = 'left';
      ctx.fillText(`SCORE  ${scoreRef.current}`, 20, 28);
      ctx.fillText(`COMBO  x${comboRef.current}`, 20, 44);
      ctx.fillText(`POS    ${(positionRef.current * 100).toFixed(0)}%`, 20, 60);
      // Resonance bar
      ctx.fillStyle = '#1a1140'; ctx.fillRect(20, 70, 180, 8);
      ctx.fillStyle = COL.perfect; ctx.fillRect(20, 70, 180 * resoRef.current, 8);
      // Heat bar
      ctx.fillStyle = '#1a1140'; ctx.fillRect(20, 84, 180, 8);
      ctx.fillStyle = COL.hot; ctx.fillRect(20, 84, 180 * heatRef.current, 8);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phaseRef, setPhase]);

  // Push HUD updates once per ~100ms (cheap)
  useEffect(() => {
    if (phase !== 'playing') return;
    const iv = setInterval(() => setHud((h) => ({
      ...h,
      score: scoreRef.current, combo: comboRef.current,
      reso: resoRef.current, heat: heatRef.current,
      pos: positionRef.current, beat: beatPhaseRef.current,
    })), 100);
    return () => clearInterval(iv);
  }, [phase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 12, background: 'linear-gradient(180deg, #06051a 0%, #0c0626 100%)', color: '#dcefff', minHeight: '100%', fontFamily: '"VT323", "Courier New", monospace' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: W }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', height: 'auto', maxWidth: W, borderRadius: 6, boxShadow: `0 0 80px rgba(255,106,61,0.18) inset, 0 8px 30px rgba(0,0,0,0.6)` }} />
        {phase === 'menu' && (
          <Overlay>
            <h1 style={{ color: COL.neon, fontSize: 38, margin: 0, letterSpacing: 6, textShadow: `0 0 20px ${COL.neon}` }}>🛸 VOIDLINE GP</h1>
            <p style={{ color: '#dcefff', maxWidth: 460, textAlign: 'center', lineHeight: 1.5 }}>
              Yuna &quot;Telegraph&quot; Orr. Free your mentor on the illegal Voidline circuit. Every shot, every boost — only on the beat.
            </p>
            <p style={{ color: COL.cool, fontSize: 12 }}>← → steer · SPACE fire (on beat) · SHIFT cash Resonance</p>
            <button onClick={start} style={btn}>Throttle Up</button>
          </Overlay>
        )}
        {phase === 'win' && (
          <Overlay>
            <h1 style={{ color: COL.perfect, fontSize: 32, letterSpacing: 4 }}>The universe re-tempos.</h1>
            <p>Coda watches you cross the finish. Score: {scoreRef.current}</p>
            <button onClick={start} style={btn}>Run It Again</button>
          </Overlay>
        )}
        {phase === 'lose' && (
          <Overlay>
            <h1 style={{ color: COL.hot, fontSize: 32, letterSpacing: 4 }}>Off-tempo.</h1>
            <p>The Syndicate paves the Voidline. Score: {scoreRef.current}</p>
            <button onClick={start} style={btn}>Tune the Rig</button>
          </Overlay>
        )}
      </div>
    </div>
  );
}

const Overlay = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 14,
    background: 'radial-gradient(ellipse at center, rgba(6,5,26,0.85) 0%, rgba(6,5,26,0.97) 100%)',
    borderRadius: 6,
  }}>{children}</div>
);

const btn: React.CSSProperties = {
  background: 'linear-gradient(180deg, #2a0d18 0%, #110509 100%)',
  border: `1px solid ${COL.neon}`, color: COL.neon,
  padding: '10px 26px', borderRadius: 4, fontSize: 14, letterSpacing: 4, cursor: 'pointer',
  fontFamily: 'inherit', textShadow: `0 0 8px ${COL.neon}`,
};

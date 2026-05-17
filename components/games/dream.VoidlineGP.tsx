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
import { ParticlePool, ScreenShake, prefersReducedMotion, motionTrail } from './_fx/canvasFx';

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
interface Asteroid { x: number; y: number; r: number; vx: number; vy: number; }
interface Rival { x: number; y: number; speed: number; lane: number; hp: number; }
interface Bullet { x: number; y: number; vx: number; vy: number; }
interface Star { x: number; y: number; layer: 0 | 1 | 2; }

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
  const shipYRef = useRef(SHIP_Y);
  const shipVxRef = useRef(0);
  const shipVyRef = useRef(0);
  const heatRef = useRef(0);                 // 0..1 engine overheat
  const resoRef = useRef(0);                 // 0..1 Resonance gauge
  const positionRef = useRef(0);             // race progress 0..1
  const startTimeRef = useRef(0);
  const lastBeatRef = useRef(0);
  const beatPhaseRef = useRef(0);            // 0..1 inside current beat
  const asteroidsRef = useRef<Asteroid[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const rivalsRef = useRef<Rival[]>([]);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef(new ParticlePool(220));
  const shakeRef = useRef(new ScreenShake(8));
  const reducedMotionRef = useRef(false);
  const chainRef = useRef(0);                 // chain-meter 0..1, decays
  const keysRef = useRef<Set<string>>(new Set());
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const [hud, setHud] = useState({ score: 0, combo: 0, reso: 0, heat: 0, pos: 0, beat: 0, lastHit: '' as 'PERFECT' | 'GOOD' | 'OFF' | '' });
  const submit = useSubmitScore('voidline-gp');

  const start = useCallback(() => {
    shipXRef.current = W / 2; shipYRef.current = SHIP_Y;
    shipVxRef.current = 0; shipVyRef.current = 0;
    heatRef.current = 0; resoRef.current = 0; positionRef.current = 0;
    asteroidsRef.current = []; bulletsRef.current = []; comboRef.current = 0;
    chainRef.current = 0;
    particlesRef.current.clear();
    rivalsRef.current = [
      { x: W / 2 - 60, y: 280, speed: 0.0009, lane: 0, hp: 3 },
      { x: W / 2 + 60, y: 200, speed: 0.0011, lane: 1, hp: 3 },
      { x: W / 2,      y: 120, speed: 0.00125, lane: 2, hp: 5 }, // Coda — boss
    ];
    // Three star layers — different scroll speeds
    starsRef.current = [];
    for (let i = 0; i < 60; i++) starsRef.current.push({ x: Math.random() * W, y: Math.random() * H, layer: 0 });
    for (let i = 0; i < 35; i++) starsRef.current.push({ x: Math.random() * W, y: Math.random() * H, layer: 1 });
    for (let i = 0; i < 20; i++) starsRef.current.push({ x: Math.random() * W, y: Math.random() * H, layer: 2 });
    scoreRef.current = 0;
    startTimeRef.current = performance.now();
    lastBeatRef.current = startTimeRef.current;
    setPhase('playing');
  }, [setPhase]);
  useGameAutoStart(phase === 'menu' ? start : null);
  useEffect(() => { reducedMotionRef.current = prefersReducedMotion(); }, []);

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
      const sx = shipXRef.current, sy = shipYRef.current;
      const ivx = shipVxRef.current * 0.4;     // bullets inherit ship velocity
      bulletsRef.current.push({ x: sx, y: sy, vx: ivx, vy: -720 });
      bulletsRef.current.push({ x: sx - 14, y: sy, vx: ivx - 60, vy: -720 });
      bulletsRef.current.push({ x: sx + 14, y: sy, vx: ivx + 60, vy: -720 });
      comboRef.current += 1;
      chainRef.current = Math.min(1, chainRef.current + 0.18);
      resoRef.current = Math.min(1, resoRef.current + 0.08);
      scoreRef.current += 50 + comboRef.current * 5;
      // Perfect-fire muzzle particles
      particlesRef.current.burst(sx, sy - 10, 8, { color: COL.perfect, speed: 200, size: 1.6, maxLife: 0.35, drag: 0.85 });
      setHud(h: number => ({ ...h, lastHit: 'PERFECT' }));
    } else if (offset < HIT_WINDOW) {
      bulletsRef.current.push({ x: shipXRef.current, y: shipYRef.current, vx: shipVxRef.current * 0.4, vy: -720 });
      comboRef.current += 1;
      chainRef.current = Math.min(1, chainRef.current + 0.08);
      resoRef.current = Math.min(1, resoRef.current + 0.04);
      scoreRef.current += 25;
      setHud(h: number => ({ ...h, lastHit: 'GOOD' }));
    } else {
      heatRef.current = Math.min(1, heatRef.current + 0.18);
      comboRef.current = 0;
      chainRef.current = Math.max(0, chainRef.current - 0.4);
      shakeRef.current.kick(3);
      setHud(h: number => ({ ...h, lastHit: 'OFF' }));
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

        // Steer — accel/drag with momentum + small slide window
        const k = keysRef.current;
        let ax = 0;
        if (k.has('ArrowLeft') || k.has('a') || k.has('A')) ax -= 1700;
        if (k.has('ArrowRight') || k.has('d') || k.has('D')) ax += 1700;
        shipVxRef.current += ax * dt;
        // Drag (per-second)
        const drag = Math.exp(-2.4 * dt);
        shipVxRef.current *= drag;
        shipXRef.current += shipVxRef.current * dt;
        // Track-edge bounce with restitution
        const minX = (W - TRACK_W) / 2 + 24;
        const maxX = (W + TRACK_W) / 2 - 24;
        if (shipXRef.current < minX) { shipXRef.current = minX; shipVxRef.current = -shipVxRef.current * 0.35; shakeRef.current.kick(2); }
        else if (shipXRef.current > maxX) { shipXRef.current = maxX; shipVxRef.current = -shipVxRef.current * 0.35; shakeRef.current.kick(2); }

        // Chain meter decay
        chainRef.current = Math.max(0, chainRef.current - 0.18 * dt);

        // Heat decay
        heatRef.current = Math.max(0, heatRef.current - 0.15 * dt);
        // Auto progress (slowed by heat, accelerated by chain trickle)
        const baseRate = 0.0085;
        positionRef.current = Math.min(1, positionRef.current + baseRate * dt * (1 - heatRef.current * 0.5) * (1 + chainRef.current * 0.4));

        // Spawn asteroids — now with vx
        if (Math.random() < 0.04 + positionRef.current * 0.06) {
          asteroidsRef.current.push({
            x: (W - TRACK_W) / 2 + 30 + Math.random() * (TRACK_W - 60),
            y: -30,
            r: 14 + Math.random() * 18,
            vx: (Math.random() - 0.5) * 60,
            vy: 200 + Math.random() * 220 + positionRef.current * 280,
          });
        }
        // Update asteroids — bounce off track edges with restitution
        for (const a of asteroidsRef.current) {
          a.x += a.vx * dt;
          a.y += a.vy * dt;
          if (a.x - a.r < (W - TRACK_W) / 2) { a.x = (W - TRACK_W) / 2 + a.r; a.vx = Math.abs(a.vx) * 0.7; }
          else if (a.x + a.r > (W + TRACK_W) / 2) { a.x = (W + TRACK_W) / 2 - a.r; a.vx = -Math.abs(a.vx) * 0.7; }
        }
        for (const a of asteroidsRef.current) {
          const dx = a.x - shipXRef.current, dy = a.y - shipYRef.current;
          if (Math.hypot(dx, dy) < a.r + 14) {
            heatRef.current = Math.min(1, heatRef.current + 0.4);
            comboRef.current = 0;
            chainRef.current = Math.max(0, chainRef.current - 0.5);
            shakeRef.current.kick(10);
            // Debris with proper collision normal
            const nrm = Math.atan2(dy, dx);
            for (let i = 0; i < 12; i++) {
              const ang = nrm + (Math.random() - 0.5) * 1.4;
              const sp = 140 + Math.random() * 160;
              particlesRef.current.emit({ x: a.x, y: a.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, color: '#cf7a3a', size: 2, maxLife: 0.6, drag: 0.9 });
            }
            a.y = H + 100;
          }
        }
        asteroidsRef.current = asteroidsRef.current.filter(a: Record<string, unknown> => a.y < H + 40);

        // Bullets — full velocity integration
        for (const b of bulletsRef.current) { b.x += b.vx * dt; b.y += b.vy * dt; }
        for (const b of bulletsRef.current) {
          for (const a of asteroidsRef.current) {
            if (Math.hypot(a.x - b.x, a.y - b.y) < a.r) { a.y = H + 100; b.y = -100; scoreRef.current += 10;
              particlesRef.current.burst(a.x, a.y, 8, { color: COL.cool, speed: 120, size: 1.5, maxLife: 0.4, drag: 0.9 });
            }
          }
          for (const r of rivalsRef.current) {
            if (Math.hypot(r.x - b.x, r.y - b.y) < 22) { r.hp -= 1; b.y = -100; scoreRef.current += 30;
              particlesRef.current.burst(r.x, r.y, 10, { color: COL.hot, speed: 160, size: 1.6, maxLife: 0.5, drag: 0.88 });
              shakeRef.current.kick(4);
            }
          }
        }
        bulletsRef.current = bulletsRef.current.filter(b: Record<string, unknown> => b.y > -10 && b.x > -20 && b.x < W + 20);

        // Per-ship exhaust trail particle
        if (Math.random() < 0.6) {
          particlesRef.current.emit({ x: shipXRef.current + (Math.random() - 0.5) * 4, y: shipYRef.current + 16, vx: -shipVxRef.current * 0.3, vy: 90 + Math.random() * 60, color: COL.neon, size: 2, maxLife: 0.35, drag: 0.95 });
        }
        for (const r of rivalsRef.current) {
          if (Math.random() < 0.3) particlesRef.current.emit({ x: r.x, y: r.y + 14, vx: 0, vy: 60, color: r.hp > 3 ? COL.hot : COL.cool, size: 1.4, maxLife: 0.3, drag: 0.95 });
        }

        // Rivals drift
        for (const r of rivalsRef.current) {
          r.y += Math.sin((t / 600) + r.lane) * 12 * dt;
          r.x += Math.sin((t / 800) + r.lane * 2) * 18 * dt;
        }
        rivalsRef.current = rivalsRef.current.filter((r: Record<string, unknown>) => r.hp > 0);

        // Step FX
        particlesRef.current.step(dt);
        shakeRef.current.step(dt);

        // Win conditions
        if (positionRef.current >= 1 || rivalsRef.current.length === 0) { setPhase('win'); }
        if (t - startTimeRef.current > RACE_DURATION_MS && rivalsRef.current.length > 0) { setPhase('lose'); }
      }

      // ── Render ───────────────────────────────────────────────────────────
      // Motion-blur stamp (low-alpha previous-frame trail)
      if (!reducedMotionRef.current && phaseRef.current === 'playing') {
        motionTrail(ctx, W, H, 0.25, '#06051a');
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, COL.bg0); g.addColorStop(1, COL.bg1);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }

      ctx.save();
      shakeRef.current.apply(ctx, reducedMotionRef.current ? 0.2 : 1);

      // Three-layer parallax starfield (warpy, scroll-by-position)
      const scrollSpeed = 60 + positionRef.current * 220;
      for (const s of starsRef.current) {
        const speed = scrollSpeed * (s.layer === 0 ? 0.4 : s.layer === 1 ? 1 : 1.8);
        s.y = (s.y + speed * dt) % H;
        const size = s.layer === 0 ? 1 : s.layer === 1 ? 1.5 : 2;
        const a = s.layer === 0 ? 0.4 : s.layer === 1 ? 0.7 : 1;
        ctx.fillStyle = `rgba(180,200,255,${a})`;
        // Streak the closest layer for warp feel
        if (s.layer === 2 && positionRef.current > 0.3) ctx.fillRect(s.x, s.y, size, size + 6);
        else ctx.fillRect(s.x, s.y, size, size);
      }

      // Track
      ctx.fillStyle = COL.track;
      ctx.fillRect((W - TRACK_W) / 2, 0, TRACK_W, H);

      // Pseudo-Mode-7 receding poly-lines for the corridor walls
      const horizonY = 60;
      const vp = W / 2; // vanishing point x
      ctx.strokeStyle = COL.trackEdge;
      ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        const tt = ((i / 14) + ((t / 800) % (1 / 14))) % 1;
        const farY = horizonY + (H - horizonY) * tt;
        const farXl = vp - TRACK_W / 2 * tt - 30;
        const farXr = vp + TRACK_W / 2 * tt + 30;
        ctx.beginPath(); ctx.moveTo((W - TRACK_W) / 2, H); ctx.lineTo(farXl, farY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo((W + TRACK_W) / 2, H); ctx.lineTo(farXr, farY); ctx.stroke();
      }
      // Lane markers
      const scroll = (t / 4) % 60;
      ctx.strokeStyle = 'rgba(255,106,61,0.3)';
      ctx.lineWidth = 2;
      for (let y = -60 + scroll; y < H; y += 60) {
        ctx.beginPath();
        ctx.moveTo((W - TRACK_W) / 2 + 60, y); ctx.lineTo((W - TRACK_W) / 2 + 60, y + 30);
        ctx.moveTo((W + TRACK_W) / 2 - 60, y); ctx.lineTo((W + TRACK_W) / 2 - 60, y + 30);
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

      // Particles below ship for exhaust glow
      particlesRef.current.draw(ctx);

      // Bullets
      ctx.fillStyle = COL.cool;
      for (const b of bulletsRef.current) {
        ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
      }

      // Ship
      ctx.save();
      ctx.translate(shipXRef.current, shipYRef.current);
      ctx.rotate(shipVxRef.current * 0.001);
      // Beat-pulse bloom on ship
      const beatBloom = 1 - beatPhaseRef.current;
      ctx.fillStyle = COL.neon;
      ctx.shadowColor = COL.neon; ctx.shadowBlur = 16 + beatBloom * 14;
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(14, 14); ctx.lineTo(-14, 14); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = COL.cool; ctx.fillRect(-3, -6, 6, 14);
      ctx.restore();

      // Scanlines (CRT)
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

      ctx.restore();

      // ── HUD: minimal — beat-window indicator + Resonance arc + lap pip ──
      // Beat-window indicator: closing bar around ship area shows when to fire
      const beatPhase = beatPhaseRef.current;
      // window opens near beat boundaries (offset≈0 or offset≈1)
      const offsetMs = Math.min(beatPhase, 1 - beatPhase) * BEAT_MS;
      if (offsetMs < HIT_WINDOW) {
        const fill = 1 - offsetMs / HIT_WINDOW;
        const win = offsetMs < PERFECT_WINDOW ? COL.perfect : COL.cool;
        ctx.strokeStyle = win;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(shipXRef.current, shipYRef.current, 32 + (1 - fill) * 18, 0, Math.PI * 2 * fill);
        ctx.stroke();
      }
      // Resonance arc top-right
      const cx = W - 56, cy = 52;
      ctx.strokeStyle = 'rgba(255,231,107,0.2)';
      ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = COL.perfect;
      ctx.beginPath(); ctx.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * resoRef.current); ctx.stroke();
      // Lap pip top-left
      ctx.fillStyle = COL.neon;
      ctx.fillRect(20, 20, 60 * positionRef.current, 4);
      ctx.strokeStyle = 'rgba(255,106,61,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 20, 60, 4);
      // Tiny chain-meter under it
      if (chainRef.current > 0.05) {
        ctx.fillStyle = COL.cool; ctx.fillRect(20, 28, 60 * chainRef.current, 2);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phaseRef, setPhase]);

  // Push HUD updates once per ~100ms (cheap)
  useEffect(() => {
    if (phase !== 'playing') return;
    const iv = setInterval(() => setHud(h: number => ({
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

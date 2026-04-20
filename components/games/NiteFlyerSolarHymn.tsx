'use client';
/**
 * NITE FLYER: SOLAR HYMN — fusion of flappy + pong + dreamquest.
 *
 * Side-scrolling courier flight through painted chapters. Each chapter ends
 * in a celestial Pong duel — your wings retract into a paddle and you must
 * out-rally a moon-king. Three chapters → final dialogue with The Long Pause.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useSubmitScore } from '@/lib/games/hooks';

const W = 720;
const H = 400;
const GRAVITY = 1100;
const FLAP_VY = -340;

type Phase = 'menu' | 'flap' | 'boss' | 'victory' | 'defeat';
interface Pipe { x: number; gapY: number; gapH: number; }

const COL = {
  skyTop: '#1a1052',
  skyMid: '#73256e',
  skyBot: '#d27a4a',
  bird: '#ffe1b8',
  pipe: '#221034',
  paddle: '#ffe1b8',
  ball: '#ffd86a',
  bossEye: '#ff5577',
} as const;

export default function NiteFlyerSolarHymn() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const birdRef = useRef({ x: 140, y: H / 2, vy: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const lastPipeRef = useRef(0);
  const distanceRef = useRef(0);
  const chapterRef = useRef(1);
  // Pong
  const playerPaddleRef = useRef(H / 2);
  const bossPaddleRef = useRef(H / 2);
  const ballRef = useRef({ x: W / 2, y: H / 2, vx: 280, vy: 180 });
  const playerScoreRef = useRef(0);
  const bossScoreRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const submit = useSubmitScore('nite-flyer-solar-hymn');

  const startFlap = useCallback(() => {
    birdRef.current = { x: 140, y: H / 2, vy: 0 };
    pipesRef.current = []; lastPipeRef.current = 0; distanceRef.current = 0;
    setPhase('flap');
  }, [setPhase]);
  const startBoss = useCallback(() => {
    playerPaddleRef.current = H / 2; bossPaddleRef.current = H / 2;
    ballRef.current = { x: W / 2, y: H / 2, vx: Math.random() < 0.5 ? -280 : 280, vy: 160 };
    playerScoreRef.current = 0; bossScoreRef.current = 0;
    setPhase('boss');
  }, [setPhase]);
  const start = useCallback(() => { chapterRef.current = 1; startFlap(); }, [startFlap]);
  useGameAutoStart(phase === 'menu' ? start : null);
  useEffect(() => { if (phase === 'victory' || phase === 'defeat') submit(distanceRef.current * 5 + chapterRef.current * 200); }, [phase, submit]);

  // Input
  useEffect(() => {
    const flap = () => { if (phaseRef.current === 'flap') birdRef.current.vy = FLAP_VY; };
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key); if (e.key === ' ') { e.preventDefault(); flap(); } if (e.key.startsWith('Arrow')) e.preventDefault(); };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    const tap = () => flap();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    const c = canvasRef.current;
    c?.addEventListener('pointerdown', tap);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); c?.removeEventListener('pointerdown', tap); };
  }, [phaseRef]);

  // Loop
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0; let lastT = performance.now();

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;

      if (phaseRef.current === 'flap') {
        const b = birdRef.current;
        b.vy += GRAVITY * dt; b.y += b.vy * dt;
        distanceRef.current += dt;
        // Pipes
        if (t - lastPipeRef.current > 1500) {
          lastPipeRef.current = t;
          const gapH = 150 - chapterRef.current * 8;
          const gapY = 60 + Math.random() * (H - 120 - gapH);
          pipesRef.current.push({ x: W + 40, gapY, gapH });
        }
        for (const p of pipesRef.current) p.x -= (180 + chapterRef.current * 30) * dt;
        pipesRef.current = pipesRef.current.filter((p) => p.x > -80);
        // Collisions
        if (b.y < 0 || b.y > H) { setPhase('defeat'); return; }
        for (const p of pipesRef.current) {
          if (b.x + 14 > p.x && b.x - 14 < p.x + 50) {
            if (b.y - 14 < p.gapY || b.y + 14 > p.gapY + p.gapH) { setPhase('defeat'); return; }
          }
        }
        // Reach the boss after 12 seconds of flight
        if (distanceRef.current > 12) startBoss();
      }

      if (phaseRef.current === 'boss') {
        // Player paddle from input
        const k = keysRef.current;
        if (k.has('ArrowUp') || k.has('w') || k.has('W')) playerPaddleRef.current -= 380 * dt;
        if (k.has('ArrowDown') || k.has('s') || k.has('S')) playerPaddleRef.current += 380 * dt;
        playerPaddleRef.current = Math.max(40, Math.min(H - 40, playerPaddleRef.current));
        // Boss AI
        const b = ballRef.current;
        bossPaddleRef.current += Math.sign(b.y - bossPaddleRef.current) * 240 * dt;
        bossPaddleRef.current = Math.max(40, Math.min(H - 40, bossPaddleRef.current));
        // Ball
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.y < 8) { b.y = 8; b.vy *= -1; }
        if (b.y > H - 8) { b.y = H - 8; b.vy *= -1; }
        // Player paddle collision
        if (b.x < 40 && Math.abs(b.y - playerPaddleRef.current) < 44) {
          b.vx = Math.abs(b.vx) + 12;
          b.vy = (b.y - playerPaddleRef.current) * 5;
        }
        if (b.x > W - 40 && Math.abs(b.y - bossPaddleRef.current) < 44) {
          b.vx = -Math.abs(b.vx) - 12;
          b.vy = (b.y - bossPaddleRef.current) * 5;
        }
        if (b.x < 0) { bossScoreRef.current++; b.x = W / 2; b.y = H / 2; b.vx = 280; b.vy = (Math.random() - 0.5) * 240; }
        if (b.x > W) { playerScoreRef.current++; b.x = W / 2; b.y = H / 2; b.vx = -280; b.vy = (Math.random() - 0.5) * 240; }
        if (playerScoreRef.current >= 5) {
          chapterRef.current += 1;
          if (chapterRef.current > 3) { setPhase('victory'); }
          else { startFlap(); }
        }
        if (bossScoreRef.current >= 5) setPhase('defeat');
      }

      // ── Render ───────────────────────────────────────────────────────────
      // Twilight gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, COL.skyTop); grad.addColorStop(0.55, COL.skyMid); grad.addColorStop(1, COL.skyBot);
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      // Floating islands (parallax)
      ctx.fillStyle = 'rgba(20,8,32,0.55)';
      for (let i = 0; i < 6; i++) {
        const ix = ((i * 220 - (t / 12) % (W + 220)) + W * 2) % (W + 220) - 110;
        const iy = 70 + i * 40 + Math.sin(t / 1000 + i) * 4;
        ctx.beginPath(); ctx.ellipse(ix, iy, 60, 16, 0, 0, Math.PI * 2); ctx.fill();
      }

      if (phaseRef.current === 'flap') {
        // Pipes
        ctx.fillStyle = COL.pipe;
        for (const p of pipesRef.current) {
          ctx.fillRect(p.x, 0, 50, p.gapY);
          ctx.fillRect(p.x, p.gapY + p.gapH, 50, H - p.gapY - p.gapH);
        }
        // Bird
        const b = birdRef.current;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, 300));
        ctx.fillStyle = COL.bird; ctx.shadowColor = COL.bird; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#222';
        ctx.fillRect(7, -3, 4, 4);
        ctx.restore();
        ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`CHAPTER ${chapterRef.current}/3 · DISTANCE ${distanceRef.current.toFixed(1)}s · TAP/SPACE flap`, 12, 22);
      }
      if (phaseRef.current === 'boss') {
        // Boss silhouette — moon disc
        ctx.fillStyle = '#fffbea'; ctx.shadowColor = '#fffbea'; ctx.shadowBlur = 30;
        ctx.beginPath(); ctx.arc(W - 80, H / 2, 90, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = COL.bossEye; ctx.beginPath(); ctx.arc(W - 80, H / 2 - 10, 6, 0, Math.PI * 2); ctx.fill();
        // Player paddle
        ctx.fillStyle = COL.paddle;
        ctx.fillRect(20, playerPaddleRef.current - 40, 12, 80);
        // Boss paddle
        ctx.fillStyle = '#ffe1b8';
        ctx.fillRect(W - 32, bossPaddleRef.current - 40, 12, 80);
        // Ball
        const b = ballRef.current;
        ctx.fillStyle = COL.ball; ctx.shadowColor = COL.ball; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Score
        ctx.fillStyle = '#fff'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${playerScoreRef.current} : ${bossScoreRef.current}`, W / 2, 30);
        ctx.font = '11px monospace';
        ctx.fillText(`CHAPTER ${chapterRef.current} BOSS · ↑↓ paddle · first to 5`, W / 2, 50);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phaseRef, setPhase, startBoss, startFlap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 12, background: 'linear-gradient(180deg, #0c0426 0%, #200d35 100%)', color: '#ffe1b8', minHeight: '100%', fontFamily: '"Courier New", monospace' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: W }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', height: 'auto', maxWidth: W, borderRadius: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.7)' }} />
        {phase === 'menu' && (
          <Overlay>
            <h1 style={{ color: '#c47bd6', margin: 0, fontSize: 30, letterSpacing: 4 }}>🌙 NITE FLYER: SOLAR HYMN</h1>
            <p style={{ maxWidth: 480, textAlign: 'center', lineHeight: 1.5 }}>
              Kestrel Vai. Last courier of the eaten sun. Deliver one last letter — to The Long Pause itself.
            </p>
            <p style={{ color: '#ffe1b8', fontSize: 12 }}>SPACE / tap to flap · ↑↓ paddle in boss</p>
            <button onClick={start} style={btn}>Take Wing</button>
          </Overlay>
        )}
        {phase === 'victory' && (<Overlay><h1 style={{ color: '#ffd86a' }}>The Pause listens.</h1><p>Score: {distanceRef.current * 5 + chapterRef.current * 200}</p><button onClick={start} style={btn}>Fly Home</button></Overlay>)}
        {phase === 'defeat' && (<Overlay><h1 style={{ color: '#ff5577' }}>You fall into twilight.</h1><p>Try again.</p><button onClick={start} style={btn}>Re-launch</button></Overlay>)}
      </div>
    </div>
  );
}

const Overlay = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'radial-gradient(ellipse at center, rgba(12,4,38,0.85), rgba(12,4,38,0.97))', borderRadius: 4 }}>{children}</div>
);
const btn: React.CSSProperties = {
  background: 'linear-gradient(180deg, #391846 0%, #1a0a26 100%)',
  border: '1px solid #c47bd6', color: '#c47bd6',
  padding: '10px 26px', borderRadius: 4, fontSize: 14, letterSpacing: 3, cursor: 'pointer',
  fontFamily: 'inherit',
};

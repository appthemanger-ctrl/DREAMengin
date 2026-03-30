'use client';
/**
 * FlappyGame — NITE FLYER: endless flap-runner starring Dr. Eams.
 * Category: endless runner / casual
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useSubmitScore } from '@/lib/games/hooks';

const CW = 360; const CH = 540;
const BIRD_X = 80; const BIRD_R = 14;
const GAP = 130; const PIPE_W = 52; const PIPE_SPEED = 2.4;
type Phase = 'menu' | 'playing' | 'dead';

interface Pipe { x: number; top: number; scored: boolean; }

export default function NiteFlyer() {
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const birdYRef = useRef(CH / 2);
  const birdVRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);
  const rafRef = useRef(0);
  const bgXRef = useRef(0);
  const submitScore = useSubmitScore('flappy');
  useEffect(() => { if (phase === 'dead') submitScore(scoreRef.current); }, [phase, submitScore]);

  const flap = useCallback(() => {
    if (phaseRef.current === 'menu') {
      birdYRef.current = CH / 2; birdVRef.current = 0;
      pipesRef.current = [{ x: CW + 80, top: 80 + Math.random() * (CH - GAP - 160), scored: false }];
      scoreRef.current = 0; frameRef.current = 0;
      setPhase('playing'); setScore(0);
    } else if (phaseRef.current === 'playing') {
      birdVRef.current = -7.5;
    } else if (phaseRef.current === 'dead') {
      setPhase('menu');
    }
  }, [phaseRef, setPhase]);
  useGameAutoStart(phase === 'menu' ? flap : null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); flap(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flap]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const loop = () => {
      if (phaseRef.current !== 'playing') return;
      frameRef.current++;
      // Physics
      birdVRef.current += 0.38;
      birdYRef.current += birdVRef.current;
      bgXRef.current -= 0.6;

      // Spawn pipes
      if (frameRef.current % 90 === 0) {
        pipesRef.current.push({ x: CW + 10, top: 80 + Math.random() * (CH - GAP - 160), scored: false });
      }
      // Move pipes
      for (const p of pipesRef.current) { p.x -= PIPE_SPEED; }
      pipesRef.current = pipesRef.current.filter(p => p.x > -PIPE_W - 10);

      // Score
      for (const p of pipesRef.current) {
        if (!p.scored && p.x + PIPE_W < BIRD_X) { p.scored = true; scoreRef.current++; setScore(scoreRef.current); }
      }

      // Collision
      const byTop = birdYRef.current - BIRD_R < 0;
      const byBot = birdYRef.current + BIRD_R > CH;
      const hitPipe = pipesRef.current.some(p =>
        BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W &&
        (birdYRef.current - BIRD_R < p.top || birdYRef.current + BIRD_R > p.top + GAP)
      );
      if (byTop || byBot || hitPipe) {
        setBest(b => Math.max(b, scoreRef.current));
        setScore(scoreRef.current);
        setPhase('dead');
        return;
      }

      // Draw neon dream-scape sky
      const sky = ctx.createLinearGradient(0, 0, 0, CH);
      sky.addColorStop(0, '#0d0824'); sky.addColorStop(0.6, '#1a0e3d'); sky.addColorStop(1, '#0a1a2e');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, CH);

      // Neon star field (parallax)
      ctx.fillStyle = 'rgba(180,220,255,0.7)';
      for (let i = 0; i < 30; i++) {
        const sx = ((bgXRef.current * 0.15 + i * 37 + i * i * 3) % (CW + 20) + CW + 20) % (CW + 20) - 10;
        const sy = 20 + (i * 47 % (CH - 60));
        const sr = 0.5 + (i % 3) * 0.5;
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
      }

      // Neon clouds / nebula wisps
      ctx.fillStyle = 'rgba(124,58,237,0.12)';
      for (let i = 0; i < 3; i++) {
        const cx = ((bgXRef.current * 0.25 + i * 140) % (CW + 120) + CW + 120) % (CW + 120) - 60;
        const cy = 60 + i * 55;
        ctx.beginPath(); ctx.ellipse(cx, cy, 55, 22, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Ground — neon teal strip
      const grd = ctx.createLinearGradient(0, CH - 30, 0, CH);
      grd.addColorStop(0, '#0ff6'); grd.addColorStop(1, '#0a1a2e');
      ctx.fillStyle = grd; ctx.fillRect(0, CH - 30, CW, 30);

      // Nightmare Gates (dark purple/crimson pillars)
      for (const p of pipesRef.current) {
        // Gate glow
        const glow = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
        glow.addColorStop(0, '#7c3aed'); glow.addColorStop(0.5, '#dc2626'); glow.addColorStop(1, '#7c3aed');
        ctx.fillStyle = glow;
        // Top gate
        ctx.fillRect(p.x, 0, PIPE_W, p.top);
        // Cap
        ctx.fillStyle = '#ef4444'; ctx.fillRect(p.x - 5, p.top - 22, PIPE_W + 10, 22);
        // Edge highlights
        ctx.fillStyle = 'rgba(220,38,38,0.5)'; ctx.fillRect(p.x, 0, 3, p.top);
        // Bottom gate
        const bTop = p.top + GAP;
        ctx.fillStyle = glow;
        ctx.fillRect(p.x, bTop, PIPE_W, CH - bTop);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(p.x - 5, bTop, PIPE_W + 10, 22);
        ctx.fillStyle = 'rgba(220,38,38,0.5)'; ctx.fillRect(p.x, bTop, 3, CH - bTop);
      }

      // Dr. Eams — golden/cyan glowing character
      const wingOff = Math.sin(frameRef.current * 0.3) * 4;
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, birdVRef.current * 0.06));
      ctx.save(); ctx.translate(BIRD_X, birdYRef.current); ctx.rotate(angle);
      // Outer glow aura
      const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_R + 10);
      aura.addColorStop(0, 'rgba(0,255,255,0.45)'); aura.addColorStop(0.5, 'rgba(250,204,21,0.22)'); aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, BIRD_R + 10, 0, Math.PI * 2); ctx.fill();
      // Wings (glowing cyan)
      ctx.fillStyle = '#0ff9';
      ctx.beginPath(); ctx.ellipse(-4, wingOff, 12, 5, Math.PI * 0.35, 0, Math.PI * 2); ctx.fill();
      // Body (golden)
      const bodyGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, BIRD_R);
      bodyGrad.addColorStop(0, '#fde68a'); bodyGrad.addColorStop(0.6, '#f59e0b'); bodyGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath(); ctx.ellipse(0, 0, BIRD_R, BIRD_R * 0.85, 0, 0, Math.PI * 2); ctx.fill();
      // Eye (bright white + dark pupil)
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(5, -4, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a0a2e'; ctx.beginPath(); ctx.arc(6.5, -4.5, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0ff'; ctx.beginPath(); ctx.arc(7.5, -5.5, 1, 0, Math.PI * 2); ctx.fill();
      // Beak (cyan)
      ctx.fillStyle = '#0ee'; ctx.beginPath(); ctx.moveTo(BIRD_R, 0); ctx.lineTo(BIRD_R + 9, -2.5); ctx.lineTo(BIRD_R + 9, 2.5); ctx.closePath(); ctx.fill();
      ctx.restore();

      // Score
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
      ctx.shadowColor = '#0ff'; ctx.shadowBlur = 10;
      ctx.fillText(`${scoreRef.current}`, CW / 2, 50);
      ctx.shadowBlur = 0; ctx.textAlign = 'left';

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  if (phase === 'menu') return (
    <div onClick={flap} style={{ background: 'linear-gradient(180deg,#0d0824,#1a0e3d,#0a1a2e)', borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', userSelect: 'none' }}>
      <div style={{ fontSize: 48 }}>✨</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#0ff', textShadow: '0 0 18px #0ff8', letterSpacing: '0.06em' }}>NITE FLYER</div>
      <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>Starring Dr. Eams</div>
      <div style={{ fontSize: 13, color: '#c4b5fd' }}>Tap / Space to flap — dodge the Nightmare Gates</div>
      {best > 0 && <div style={{ color: '#fbbf24', fontWeight: 700 }}>Best: {best}</div>}
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#0ff4)', color: '#fff', padding: '10px 28px', borderRadius: 999, fontWeight: 700, fontSize: 14, marginTop: 8, border: '1px solid #0ff6' }}>▶ Enter the Dream</div>
    </div>
  );
  if (phase === 'dead') return (
    <div onClick={flap} style={{ background: 'linear-gradient(180deg,#0d0824,#1a0e3d,#0a1a2e)', borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', userSelect: 'none' }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#ef4444', textShadow: '0 0 12px #ef444488' }}>💥 Nightmare Caught You</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>Score: {score}</div>
      <div style={{ fontSize: 14, color: '#a78bfa' }}>Best: {best}</div>
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#0ff4)', color: '#fff', padding: '10px 28px', borderRadius: 999, fontWeight: 700, marginTop: 8, border: '1px solid #0ff6' }}>Fly Again</div>
    </div>
  );
  return (
    <canvas ref={canvasRef} width={CW} height={CH} onClick={flap} style={{ width: '100%', maxWidth: CW, borderRadius: 8, display: 'block', cursor: 'pointer', border: '2px solid rgba(0,255,255,0.35)', margin: '0 auto' }} />
  );
}

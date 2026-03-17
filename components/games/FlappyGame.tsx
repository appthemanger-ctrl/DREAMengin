'use client';
/**
 * FlappyGame — Endless flap-runner (Flappy Bird style).
 * Category: endless runner / casual
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGamePhase } from '@/lib/games/hooks';

const CW = 360; const CH = 540;
const BIRD_X = 80; const BIRD_R = 14;
const GAP = 130; const PIPE_W = 52; const PIPE_SPEED = 2.4;
type Phase = 'menu' | 'playing' | 'dead';

interface Pipe { x: number; top: number; scored: boolean; }

export default function FlappyGame() {
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

      // Draw sky
      const sky = ctx.createLinearGradient(0, 0, 0, CH);
      sky.addColorStop(0, '#87ceeb'); sky.addColorStop(1, '#b0e0e6');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, CH);

      // Clouds (parallax)
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 4; i++) {
        const cx = ((bgXRef.current * 0.3 + i * 110) % (CW + 80) + CW + 80) % (CW + 80) - 40;
        const cy = 60 + i * 40;
        ctx.beginPath(); ctx.ellipse(cx, cy, 40, 18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 20, cy - 8, 26, 16, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Ground
      ctx.fillStyle = '#7cbe55'; ctx.fillRect(0, CH - 30, CW, 30);
      ctx.fillStyle = '#5a9e3a'; ctx.fillRect(0, CH - 30, CW, 6);

      // Pipes
      ctx.fillStyle = '#3a7d44';
      for (const p of pipesRef.current) {
        // Top pipe
        ctx.fillRect(p.x, 0, PIPE_W, p.top);
        ctx.fillStyle = '#4a9e55'; ctx.fillRect(p.x - 4, p.top - 20, PIPE_W + 8, 20); ctx.fillStyle = '#3a7d44';
        // Bottom pipe
        const bTop = p.top + GAP;
        ctx.fillRect(p.x, bTop, PIPE_W, CH - bTop);
        ctx.fillStyle = '#4a9e55'; ctx.fillRect(p.x - 4, bTop, PIPE_W + 8, 20); ctx.fillStyle = '#3a7d44';
      }

      // Bird
      const wingOff = Math.sin(frameRef.current * 0.3) * 4;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.ellipse(BIRD_X, birdYRef.current + wingOff, 10, 6, Math.PI * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, birdVRef.current * 0.06));
      ctx.save(); ctx.translate(BIRD_X, birdYRef.current); ctx.rotate(angle);
      ctx.beginPath(); ctx.ellipse(0, 0, BIRD_R, BIRD_R * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(5, -4, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.arc(7, -4, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(BIRD_R + 2, 0); ctx.lineTo(BIRD_R + 10, -3); ctx.lineTo(BIRD_R + 10, 3); ctx.closePath(); ctx.fill();
      ctx.restore();

      // Score
      ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${scoreRef.current}`, CW / 2, 50); ctx.textAlign = 'left';

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  if (phase === 'menu') return (
    <div onClick={flap} style={{ background: 'linear-gradient(180deg,#87ceeb,#b0e0e6)', borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', userSelect: 'none' }}>
      <div style={{ fontSize: 48 }}>🐦</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#1f2937' }}>FLAPPY BIRD</div>
      <div style={{ fontSize: 13, color: '#374151' }}>Click / Space / Tap to flap wings</div>
      {best > 0 && <div style={{ color: '#92400e', fontWeight: 700 }}>Best: {best}</div>}
      <div style={{ background: '#fbbf24', color: '#1f2937', padding: '10px 28px', borderRadius: 999, fontWeight: 700, fontSize: 14, marginTop: 8 }}>▶ Click to Start</div>
    </div>
  );
  if (phase === 'dead') return (
    <div onClick={flap} style={{ background: 'linear-gradient(180deg,#87ceeb,#b0e0e6)', borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', userSelect: 'none' }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#dc2626' }}>💥 Game Over</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>Score: {score}</div>
      <div style={{ fontSize: 14, color: '#374151' }}>Best: {best}</div>
      <div style={{ background: '#fbbf24', color: '#1f2937', padding: '10px 28px', borderRadius: 999, fontWeight: 700, marginTop: 8 }}>Click to Play Again</div>
    </div>
  );
  return (
    <canvas ref={canvasRef} width={CW} height={CH} onClick={flap} style={{ width: '100%', maxWidth: CW, borderRadius: 8, display: 'block', cursor: 'pointer', border: '2px solid rgba(251,191,36,0.4)', margin: '0 auto' }} />
  );
}

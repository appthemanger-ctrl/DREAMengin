'use client';
/**
 * BreakoutGame — Breakout / Arkanoid brick-breaking game.
 * Category: arcade / classic
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const CW = 480; const CH = 520;
const PAD_W = 80; const PAD_H = 12; const PAD_Y = CH - 40;
const BALL_R = 8;
const BRICK_COLS = 10; const BRICK_ROWS = 6;
const BRICK_W = CW / BRICK_COLS; const BRICK_H = 22;
type Phase = 'menu' | 'playing' | 'win' | 'gameover';

const BRICK_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7'];

interface Brick { x: number; y: number; hp: number; color: string; }
interface Ball { x: number; y: number; vx: number; vy: number; }

function makeBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < BRICK_ROWS; r++) for (let c = 0; c < BRICK_COLS; c++) {
    if (Math.random() < 0.85) bricks.push({ x: c * BRICK_W, y: 50 + r * (BRICK_H + 4), hp: r < 2 ? 2 : 1, color: BRICK_COLORS[r] });
  }
  return bricks;
}

export default function BreakoutGame() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<Phase>('menu');
  const padRef = useRef(CW / 2 - PAD_W / 2);
  const ballRef = useRef<Ball>({ x: CW / 2, y: PAD_Y - BALL_R - 2, vx: 3, vy: -5 });
  const bricksRef = useRef<Brick[]>(makeBricks());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const launchedRef = useRef(false);
  const rafRef = useRef(0);
  const mouseRef = useRef(CW / 2);

  const startGame = useCallback(() => {
    padRef.current = CW / 2 - PAD_W / 2;
    ballRef.current = { x: CW / 2, y: PAD_Y - BALL_R - 2, vx: 3, vy: -5 };
    bricksRef.current = makeBricks(); scoreRef.current = 0; livesRef.current = 3; launchedRef.current = false;
    setScore(0); setLives(3); phaseRef.current = 'playing'; setPhase('playing');
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const onMouse = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mouseRef.current = (e.clientX - r.left) * (CW / r.width); };
    const onTouch = (e: TouchEvent) => { const r = canvas.getBoundingClientRect(); mouseRef.current = (e.touches[0].clientX - r.left) * (CW / r.width); };
    const onClick = () => { launchedRef.current = true; };
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('touchmove', onTouch, { passive: true });
    canvas.addEventListener('click', onClick);

    const loop = () => {
      if (phaseRef.current !== 'playing') return;
      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, CW, CH);

      // Move paddle
      const targetPad = mouseRef.current - PAD_W / 2;
      padRef.current += (targetPad - padRef.current) * 0.2;
      padRef.current = Math.max(0, Math.min(CW - PAD_W, padRef.current));

      const ball = ballRef.current;
      if (!launchedRef.current) {
        ball.x = padRef.current + PAD_W / 2;
      } else {
        ball.x += ball.vx; ball.y += ball.vy;
        // Wall bounce
        if (ball.x <= BALL_R || ball.x >= CW - BALL_R) ball.vx *= -1;
        if (ball.y <= BALL_R) ball.vy *= -1;
        // Paddle bounce
        if (ball.y + BALL_R >= PAD_Y && ball.y + BALL_R <= PAD_Y + PAD_H && ball.x >= padRef.current && ball.x <= padRef.current + PAD_W) {
          const hitPos = (ball.x - padRef.current) / PAD_W - 0.5;
          ball.vx = hitPos * 8; ball.vy = -Math.abs(ball.vy);
        }
        // Brick collision
        for (const brick of bricksRef.current) {
          if (brick.hp <= 0) continue;
          if (ball.x + BALL_R > brick.x && ball.x - BALL_R < brick.x + BRICK_W && ball.y + BALL_R > brick.y && ball.y - BALL_R < brick.y + BRICK_H) {
            brick.hp--; scoreRef.current += brick.hp === 0 ? 20 : 5;
            const overlapL = ball.x - brick.x; const overlapR = brick.x + BRICK_W - ball.x;
            const overlapT = ball.y - brick.y; const overlapB = brick.y + BRICK_H - ball.y;
            const minH = Math.min(overlapL, overlapR); const minV = Math.min(overlapT, overlapB);
            if (minH < minV) ball.vx *= -1; else ball.vy *= -1;
            break;
          }
        }
        bricksRef.current = bricksRef.current.filter(b => b.hp > 0);
        // Bottom — lose life
        if (ball.y > CH + 10) {
          livesRef.current--;
          if (livesRef.current <= 0) { phaseRef.current = 'gameover'; setPhase('gameover'); return; }
          ball.x = padRef.current + PAD_W / 2; ball.y = PAD_Y - BALL_R - 2; ball.vx = 3; ball.vy = -5; launchedRef.current = false;
          setLives(livesRef.current);
        }
        // Win
        if (bricksRef.current.length === 0) { phaseRef.current = 'win'; setPhase('win'); return; }
      }

      // Draw bricks
      for (const b of bricksRef.current) {
        ctx.fillStyle = b.color; ctx.fillRect(b.x + 1, b.y + 1, BRICK_W - 2, BRICK_H - 2);
        if (b.hp > 1) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(b.x + 1, b.y + 1, BRICK_W - 2, 4); }
      }
      // Draw paddle
      const grad = ctx.createLinearGradient(padRef.current, PAD_Y, padRef.current + PAD_W, PAD_Y + PAD_H);
      grad.addColorStop(0, '#3b82f6'); grad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(padRef.current, PAD_Y, PAD_W, PAD_H, 6); ctx.fill();
      // Draw ball
      const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, BALL_R);
      ballGrad.addColorStop(0, '#fff'); ballGrad.addColorStop(1, '#93c5fd');
      ctx.fillStyle = ballGrad; ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, CW, 28);
      ctx.fillStyle = '#facc15'; ctx.font = 'bold 12px monospace'; ctx.fillText(`Score: ${scoreRef.current}`, 8, 18);
      ctx.fillStyle = '#f87171'; ctx.fillText(`❤ ${livesRef.current}`, CW / 2 - 20, 18);
      ctx.fillStyle = '#86efac'; ctx.fillText(`Bricks: ${bricksRef.current.length}`, CW - 90, 18);
      if (!launchedRef.current) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Click to launch', CW/2, CH/2); ctx.textAlign = 'left'; }
      setScore(scoreRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('touchmove', onTouch);
      canvas.removeEventListener('click', onClick);
    };
  }, [phase]);

  if (phase === 'menu') return (
    <div style={{ background: '#0a0a1a', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#3b82f6' }}>🧱 BREAKOUT</div>
      <div style={{ fontSize: 12, color: '#93c5fd' }}>Move mouse / touch to control paddle. Click to launch ball. Break all bricks!</div>
      <button onClick={startGame} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Play</button>
    </div>
  );
  if (phase === 'win') return (
    <div style={{ background: '#0a0a1a', borderRadius: 12, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 26, color: '#4ade80', fontWeight: 900 }}>🏆 You Win!</div>
      <div style={{ fontSize: 18, color: '#facc15', fontWeight: 700, marginTop: 8 }}>Score: {score}</div>
      <button onClick={startGame} style={{ marginTop: 16, background: '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Play Again</button>
    </div>
  );
  if (phase === 'gameover') return (
    <div style={{ background: '#0a0a1a', borderRadius: 12, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 26, color: '#f87171', fontWeight: 900 }}>💀 Game Over</div>
      <div style={{ fontSize: 18, color: '#facc15', fontWeight: 700, marginTop: 8 }}>Score: {score}</div>
      <button onClick={startGame} style={{ marginTop: 16, background: '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Try Again</button>
    </div>
  );
  return <canvas ref={canvasRef} width={CW} height={CH} style={{ width: '100%', maxWidth: CW, borderRadius: 8, display: 'block', cursor: 'none', border: '2px solid rgba(59,130,246,0.3)', margin: '0 auto' }} />;
}

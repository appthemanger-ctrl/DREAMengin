'use client';
/**
 * PongGame — Classic Pong (2-player local or vs AI).
 * Category: sports / classic
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useKeySet, useSubmitScore } from '@/lib/games/hooks';
import {
  getImmersiveCanvasStyle,
  getImmersiveOverlayStyle,
  getImmersiveStageStyle,
  useImmersiveGameLayout,
} from '@/lib/games/useImmersiveGameLayout';

const CW = 600; const CH = 400;
const PAD_W = 10; const PAD_H = 70; const PAD_SPEED = 5;
const BALL_SIZE = 10;
type Phase = 'menu' | 'playing' | 'done';
type Mode = 'ai' | '2p';

export default function PongGame() {
  const immersive = useImmersiveGameLayout();
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const [mode, setMode] = useState<Mode>('ai');
  const [scores, setScores] = useState([0, 0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pad1Ref = useRef(CH / 2 - PAD_H / 2);
  const pad2Ref = useRef(CH / 2 - PAD_H / 2);
  const ballRef = useRef({ x: CW / 2, y: CH / 2, vx: 4, vy: 3 });
  const scoresRef = useRef([0, 0]);
  const keysRef = useKeySet(phase === 'playing');
  const rafRef = useRef(0);
  const submitScore = useSubmitScore('pong');
  useEffect(() => { if (phase === 'done') submitScore(scoresRef.current[0] * 100); }, [phase, submitScore]);
  const modeRef = useRef<Mode>('ai');

  const startGame = useCallback((m: Mode) => {
    modeRef.current = m; setMode(m);
    pad1Ref.current = CH / 2 - PAD_H / 2; pad2Ref.current = CH / 2 - PAD_H / 2;
    ballRef.current = { x: CW / 2, y: CH / 2, vx: 4 * (Math.random() < 0.5 ? 1 : -1), vy: 3 * (Math.random() < 0.5 ? 1 : -1) };
    scoresRef.current = [0, 0]; setScores([0, 0]);
    setPhase('playing');
  }, [setPhase]);
  // Default auto-start: vs AI mode
  useGameAutoStart(phase === 'menu' ? () => startGame('ai') : null);

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const loop = () => {
      if (phaseRef.current !== 'playing') return;
      // Player 1 (W/S)
      if (keysRef.current.has('w') || keysRef.current.has('W')) pad1Ref.current = Math.max(0, pad1Ref.current - PAD_SPEED);
      if (keysRef.current.has('s') || keysRef.current.has('S')) pad1Ref.current = Math.min(CH - PAD_H, pad1Ref.current + PAD_SPEED);
      // Player 2 / AI
      if (modeRef.current === '2p') {
        if (keysRef.current.has('ArrowUp')) pad2Ref.current = Math.max(0, pad2Ref.current - PAD_SPEED);
        if (keysRef.current.has('ArrowDown')) pad2Ref.current = Math.min(CH - PAD_H, pad2Ref.current + PAD_SPEED);
      } else {
        // Simple AI
        const center2 = pad2Ref.current + PAD_H / 2;
        const target = ballRef.current.y;
        const aiSpeed = Math.min(PAD_SPEED * 0.82, Math.abs(target - center2));
        if (center2 < target - 5) pad2Ref.current = Math.min(CH - PAD_H, pad2Ref.current + aiSpeed);
        else if (center2 > target + 5) pad2Ref.current = Math.max(0, pad2Ref.current - aiSpeed);
      }
      // Ball
      const b = ballRef.current;
      b.x += b.vx; b.y += b.vy;
      if (b.y < BALL_SIZE / 2 || b.y > CH - BALL_SIZE / 2) b.vy *= -1;
      // Paddle collisions
      if (b.x <= 20 + PAD_W && b.y >= pad1Ref.current && b.y <= pad1Ref.current + PAD_H) {
        b.vx = Math.abs(b.vx) * 1.04; const hitPos = (b.y - pad1Ref.current - PAD_H / 2) / (PAD_H / 2); b.vy = hitPos * 5;
      }
      if (b.x >= CW - 20 - PAD_W - BALL_SIZE && b.y >= pad2Ref.current && b.y <= pad2Ref.current + PAD_H) {
        b.vx = -Math.abs(b.vx) * 1.04; const hitPos = (b.y - pad2Ref.current - PAD_H / 2) / (PAD_H / 2); b.vy = hitPos * 5;
      }
      // Clamp speed
      const speed = Math.hypot(b.vx, b.vy); if (speed > 12) { b.vx = b.vx / speed * 12; b.vy = b.vy / speed * 12; }
      // Score
      if (b.x < 0) { scoresRef.current[1]++; setScores([...scoresRef.current]); b.x = CW/2; b.y = CH/2; b.vx = 4; b.vy = 3 * (Math.random() < 0.5 ? 1 : -1); }
      if (b.x > CW) { scoresRef.current[0]++; setScores([...scoresRef.current]); b.x = CW/2; b.y = CH/2; b.vx = -4; b.vy = 3 * (Math.random() < 0.5 ? 1 : -1); }
      if (scoresRef.current[0] >= 11 || scoresRef.current[1] >= 11) { setPhase('done'); return; }

      // Draw
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, CW, CH);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([10, 10]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(CW/2, 0); ctx.lineTo(CW/2, CH); ctx.stroke(); ctx.setLineDash([]);
      // Paddles
      const drawPad = (x: number, y: number, color: string) => {
        const g = ctx.createLinearGradient(x, y, x + PAD_W, y + PAD_H);
        g.addColorStop(0, color); g.addColorStop(1, `${color}88`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, PAD_W, PAD_H, 4); ctx.fill();
      };
      drawPad(20, pad1Ref.current, '#3b82f6');
      drawPad(CW - 20 - PAD_W, pad2Ref.current, '#ef4444');
      // Ball
      const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, BALL_SIZE);
      bg.addColorStop(0, '#fff'); bg.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(b.x, b.y, BALL_SIZE / 2, 0, Math.PI * 2); ctx.fill();
      // Score
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 40px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`${scoresRef.current[0]}`, CW/4, 50);
      ctx.fillText(`${scoresRef.current[1]}`, CW * 3/4, 50); ctx.textAlign = 'left';
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  if (phase === 'menu') return (
    <div style={{ background: '#0f172a', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>🏓 PONG</div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>First to 11 wins</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => startGame('ai')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🤖 vs AI (W/S)</button>
        <button onClick={() => startGame('2p')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>👥 2 Players (W/S · ↑/↓)</button>
      </div>
    </div>
  );
  if (phase === 'done') return (
    <div style={{ background: '#0f172a', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 26, color: '#facc15', fontWeight: 900 }}>🏆 {scores[0] >= 11 ? (mode === 'ai' ? 'You Win!' : 'Player 1 Wins!') : (mode === 'ai' ? 'AI Wins!' : 'Player 2 Wins!')}</div>
      <div style={{ fontSize: 18, color: '#fff' }}>{scores[0]} — {scores[1]}</div>
      <button onClick={() => startGame(mode)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Play Again</button>
    </div>
  );
  if (immersive) return (
    <div style={getImmersiveStageStyle()}>
      <div style={getImmersiveOverlayStyle()}>P1 {scores[0]} · {scores[1]} {mode === '2p' ? 'P2' : 'AI'}</div>
      <canvas ref={canvasRef} width={CW} height={CH} style={getImmersiveCanvasStyle()} />
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 40, color: '#9ca3af', fontSize: 11 }}>
        <span style={{ color: '#93c5fd' }}>P1: W/S</span>
        <span style={{ color: mode === '2p' ? '#fca5a5' : '#6b7280' }}>P2: {mode === '2p' ? '↑/↓' : 'AI'}</span>
      </div>
      <canvas ref={canvasRef} width={CW} height={CH} style={{ width: '100%', maxWidth: CW, borderRadius: 8, display: 'block', border: '2px solid rgba(255,255,255,0.1)' }} />
    </div>
  );
}

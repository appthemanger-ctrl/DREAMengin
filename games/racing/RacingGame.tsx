'use client';
/**
 * RacingGame — Top-down racing game.
 * Category: racing / sports
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useKeySet, useSubmitScore } from '@/lib/games/hooks';
import {
  getImmersiveCanvasStyle,
  getImmersiveStageStyle,
  useImmersiveGameLayout,
} from '@/lib/games/useImmersiveGameLayout';

const CW = 500; const CH = 500;
type Phase = 'menu' | 'playing' | 'done';

// Track: circular path defined as a ring
const TRACK_CX = CW / 2; const TRACK_CY = CH / 2;
const TRACK_R_OUT = 200; const TRACK_R_IN = 110;

function onTrack(x: number, y: number): boolean {
  const d = Math.hypot(x - TRACK_CX, y - TRACK_CY);
  return d < TRACK_R_OUT && d > TRACK_R_IN;
}

interface Car { x: number; y: number; angle: number; speed: number; lap: number; lapProgress: number; lastAngle: number; }

function makeCar(startAngle: number, offset: number): Car {
  const r = (TRACK_R_OUT + TRACK_R_IN) / 2 + offset;
  return {
    x: TRACK_CX + Math.cos(startAngle) * r,
    y: TRACK_CY + Math.sin(startAngle) * r,
    angle: startAngle + Math.PI / 2,
    speed: 0,
    lap: 0,
    lapProgress: 0,
    lastAngle: startAngle,
  };
}

export default function RacingGame() {
  const immersive = useImmersiveGameLayout();
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const [best, setBest] = useState<number | null>(null);
  const [pos, setPos] = useState(1);
  const [totalTime, setTotalTime] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Car>(makeCar(-Math.PI / 2, 20));
  const aiCarsRef = useRef<Car[]>([makeCar(-Math.PI / 2, -20), makeCar(-Math.PI / 2, 0)]);
  const keysRef = useKeySet(phase === 'playing');
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const totalTimeRef = useRef(0);
  const LAPS = 3;
  const submitScore = useSubmitScore('racing');
  useEffect(() => { if (phase === 'done') submitScore(Math.max(0, Math.round(10000 - totalTimeRef.current * 10))); }, [phase, submitScore]);

  const startGame = useCallback(() => {
    playerRef.current = makeCar(-Math.PI / 2, 20);
    aiCarsRef.current = [makeCar(-Math.PI / 2, -20), makeCar(-Math.PI / 2, 0)];
    startTimeRef.current = Date.now();
    setPos(1);
    setTotalTime(0);
    setPhase('playing');
  }, [setPhase]);
  useGameAutoStart(phase === 'menu' ? startGame : null);

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const updateCar = (car: Car, isPlayer: boolean) => {
      if (isPlayer) {
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) car.angle -= 0.045;
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) car.angle += 0.045;
        const accel = keysRef.current.has('ArrowUp') || keysRef.current.has('w');
        const brake = keysRef.current.has('ArrowDown') || keysRef.current.has('s');
        if (accel) car.speed = Math.min(car.speed + 0.18, 5.5);
        else if (brake) car.speed = Math.max(car.speed - 0.22, -1.5);
        else car.speed *= 0.96;
      } else {
        // AI: follow track center
        const trackAngle = Math.atan2(car.y - TRACK_CY, car.x - TRACK_CX);
        const targetAngle = trackAngle + Math.PI / 2;
        let diff = targetAngle - car.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        car.angle += diff * 0.12;
        car.speed = 3.2 + Math.random() * 0.3;
      }

      const nx = car.x + Math.cos(car.angle) * car.speed;
      const ny = car.y + Math.sin(car.angle) * car.speed;

      if (onTrack(nx, ny)) { car.x = nx; car.y = ny; }
      else { car.speed *= 0.7; }

      // Lap tracking
      const curAngle = Math.atan2(car.y - TRACK_CY, car.x - TRACK_CX);
      const lastAngle = car.lastAngle;
      // Crossing -PI/2 (top of circle) going clockwise
      const crossed = lastAngle < -Math.PI * 0.4 && curAngle > -Math.PI * 0.1 ||
                      lastAngle > Math.PI * 0.9 && curAngle < Math.PI * 0.1;
      if (crossed && car.speed > 0) car.lap++;
      car.lastAngle = curAngle;
    };

    const drawCar = (car: Car, color: string, label: string) => {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-14, -8, 28, 16);
      // Body
      const g = ctx.createLinearGradient(-14, 0, 14, 0);
      g.addColorStop(0, color); g.addColorStop(1, `${color}bb`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(-14, -8, 28, 16, 4); ctx.fill();
      // Windshield
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-2, -6, 8, 12);
      // Wheels
      ctx.fillStyle = '#1f2937';
      [[-10,-9],[8,-9],[-10,7],[8,7]].forEach(([wx,wy]) => { ctx.beginPath(); ctx.roundRect(wx, wy, 7, 3, 1); ctx.fill(); });
      ctx.restore();
      // Label
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText(label, car.x, car.y - 16); ctx.textAlign = 'left';
    };

    const loop = () => {
      if (phaseRef.current !== 'playing') return;
      // Background
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, CW, CH);
      // Grass
      ctx.fillStyle = '#14532d'; ctx.beginPath(); ctx.arc(TRACK_CX, TRACK_CY, TRACK_R_OUT + 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(TRACK_CX, TRACK_CY, TRACK_R_IN - 5, 0, Math.PI * 2); ctx.fill();
      // Track
      ctx.fillStyle = '#374151';
      ctx.beginPath(); ctx.arc(TRACK_CX, TRACK_CY, TRACK_R_OUT, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath(); ctx.arc(TRACK_CX, TRACK_CY, TRACK_R_IN, 0, Math.PI * 2); ctx.fill();
      // Track markings
      ctx.strokeStyle = '#f5f5f4'; ctx.lineWidth = 2; ctx.setLineDash([15, 20]);
      ctx.beginPath(); ctx.arc(TRACK_CX, TRACK_CY, (TRACK_R_OUT + TRACK_R_IN) / 2, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      // Start/finish
      ctx.fillStyle = '#fff'; ctx.fillRect(TRACK_CX - 3, TRACK_CY - TRACK_R_OUT, 6, TRACK_R_OUT - TRACK_R_IN);

      // Update cars
      updateCar(playerRef.current, true);
      for (const ai of aiCarsRef.current) updateCar(ai, false);

      // Draw
      drawCar(aiCarsRef.current[0], '#ef4444', 'AI 1');
      drawCar(aiCarsRef.current[1], '#f59e0b', 'AI 2');
      drawCar(playerRef.current, '#3b82f6', 'YOU');

      // Position
      const allCars = [playerRef.current, ...aiCarsRef.current];
      allCars.sort((a, b) => b.lap - a.lap || 0);
      const position = allCars.indexOf(playerRef.current) + 1;

      setPos(position);
      if (playerRef.current.lap >= LAPS) {
        const finishTime = (Date.now() - startTimeRef.current) / 1000;
        totalTimeRef.current = finishTime;
        setTotalTime(finishTime);
        setPhase('done');
        setBest(prev => prev === null || finishTime < prev ? finishTime : prev);
        return;
      }

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, CW, 28);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace';
      ctx.fillText(`Lap: ${Math.min(playerRef.current.lap + 1, LAPS)}/${LAPS}`, 8, 18);
      ctx.fillStyle = '#facc15'; ctx.fillText(`P${position}`, 90, 18);
      ctx.fillStyle = '#86efac'; ctx.fillText(`${Math.round(playerRef.current.speed * 20)}km/h`, 130, 18);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, phaseRef]);

  if (phase === 'menu') return (
    <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#3b82f6' }}>🏎 TOP-DOWN RACING</div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>W/S or ↑/↓ = accelerate/brake · A/D or ←/→ = steer · shared GameRemote supported · 3 laps to win!</div>
      {best !== null && <div style={{ color: '#facc15', fontSize: 13 }}>Best time: {best.toFixed(1)}s</div>}
      <button onClick={startGame} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Race!</button>
    </div>
  );
  if (phase === 'done') return (
    <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 26, color: pos === 1 ? '#4ade80' : '#f59e0b', fontWeight: 900 }}>{pos === 1 ? '🏆 1st Place!' : `${pos === 2 ? '2nd' : '3rd'} Place`}</div>
      <div style={{ fontSize: 14, color: '#9ca3af' }}>Time: {totalTime.toFixed(1)}s</div>
      {best !== null && <div style={{ fontSize: 13, color: '#facc15' }}>Best: {best.toFixed(1)}s</div>}
      <button onClick={startGame} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Race Again</button>
    </div>
  );
  if (immersive) return (
    <div style={getImmersiveStageStyle()}>
      <canvas ref={canvasRef} width={CW} height={CH} tabIndex={0} style={getImmersiveCanvasStyle()} />
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <canvas ref={canvasRef} width={CW} height={CH} tabIndex={0} style={{ width: '100%', maxWidth: CW, borderRadius: 8, display: 'block', border: '2px solid rgba(59,130,246,0.3)', outline: 'none' }} />
      <div style={{ color: '#60a5fa', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
        Use the shared PS-style GameRemote or keyboard controls.
      </div>
    </div>
  );
}

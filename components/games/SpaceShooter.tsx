'use client';
/**
 * SpaceShooter — Top-down shoot-em-up.
 * Category: shoot 'em up / arcade
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGamePhase, useKeySet } from '@/lib/games/hooks';

const CW = 400; const CH = 560;
type Phase = 'menu' | 'playing' | 'gameover';

interface Ship { x: number; y: number; }
interface Bullet { id: number; x: number; y: number; vy: number; isEnemy: boolean; damage: number; }
interface Enemy { id: number; x: number; y: number; hp: number; maxHp: number; vx: number; vy: number; type: number; shootTimer: number; }
interface Particle { x: number; y: number; vx: number; vy: number; alpha: number; color: string; }
interface Star { x: number; y: number; vy: number; r: number; }

let gId = 1;

export default function SpaceShooter() {
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shipRef = useRef<Ship>({ x: CW / 2, y: CH - 60 });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>(Array.from({ length: 80 }, () => ({ x: Math.random() * CW, y: Math.random() * CH, vy: 0.5 + Math.random() * 1.5, r: Math.random() * 1.5 + 0.3 })));
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const shootTimerRef = useRef(0);
  const enemySpawnRef = useRef(0);
  const waveRef = useRef(1);
  const keysRef = useKeySet(phase === 'playing');
  const rafRef = useRef(0);
  const touchRef = useRef<{ x: number } | null>(null);

  const explode = (x: number, y: number, color: string) => {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 1 + Math.random() * 3;
      particlesRef.current.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, alpha: 1, color });
    }
  };

  const startGame = useCallback(() => {
    gId = 1; shipRef.current = { x: CW / 2, y: CH - 60 };
    bulletsRef.current = []; enemiesRef.current = []; particlesRef.current = [];
    scoreRef.current = 0; livesRef.current = 3; waveRef.current = 1;
    shootTimerRef.current = 0; enemySpawnRef.current = 0;
    setScore(0); setLives(3);
    setPhase('playing');
  }, [setPhase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const loop = () => {
      if (phaseRef.current !== 'playing') return;
      ctx.fillStyle = '#050815'; ctx.fillRect(0, 0, CW, CH);

      // Stars
      for (const s of starsRef.current) {
        s.y += s.vy;
        if (s.y > CH) s.y = 0;
        ctx.fillStyle = `rgba(255,255,255,${0.4 + s.r * 0.3})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }

      const ship = shipRef.current;
      // Move
      const speed = 4;
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) ship.x = Math.max(16, ship.x - speed);
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) ship.x = Math.min(CW - 16, ship.x + speed);
      if (touchRef.current) ship.x += (touchRef.current.x - ship.x) * 0.15;

      // Auto shoot
      shootTimerRef.current++;
      if (shootTimerRef.current >= 12) {
        shootTimerRef.current = 0;
        bulletsRef.current.push({ id: gId++, x: ship.x, y: ship.y - 20, vy: -10, isEnemy: false, damage: 20 });
      }

      // Spawn enemies
      enemySpawnRef.current++;
      const spawnInterval = Math.max(40, 90 - waveRef.current * 5);
      if (enemySpawnRef.current >= spawnInterval) {
        enemySpawnRef.current = 0;
        const type = Math.min(3, Math.floor(Math.random() * waveRef.current));
        enemiesRef.current.push({ id: gId++, x: 20 + Math.random() * (CW - 40), y: -20, hp: 20 + type * 30, maxHp: 20 + type * 30, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 1.5, type, shootTimer: type > 0 ? 60 : 999 });
      }

      // Move enemies
      for (const e of enemiesRef.current) {
        e.x += e.vx; e.y += e.vy;
        if (e.x < 10 || e.x > CW - 10) e.vx *= -1;
        e.shootTimer--;
        if (e.shootTimer <= 0) {
          e.shootTimer = 80 + Math.random() * 40;
          bulletsRef.current.push({ id: gId++, x: e.x, y: e.y + 12, vy: 4 + e.type, isEnemy: true, damage: 1 });
        }
      }
      enemiesRef.current = enemiesRef.current.filter(e => e.y < CH + 30);

      // Move bullets
      for (const b of bulletsRef.current) { b.y += b.vy; }

      // Collisions: player bullets vs enemies
      for (const b of bulletsRef.current) {
        if (b.isEnemy) continue;
        for (const e of enemiesRef.current) {
          if (Math.hypot(b.x - e.x, b.y - e.y) < 18) {
            e.hp -= b.damage; b.damage = 0;
            if (e.hp <= 0) { explode(e.x, e.y, '#f59e0b'); scoreRef.current += 10 + e.type * 10; }
          }
        }
      }
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);
      bulletsRef.current = bulletsRef.current.filter(b => b.damage > 0 && b.y > -20 && b.y < CH + 20);

      // Collisions: enemy bullets vs player
      for (const b of [...bulletsRef.current]) {
        if (!b.isEnemy) continue;
        if (Math.hypot(b.x - ship.x, b.y - ship.y) < 16) {
          b.damage = 0;
          explode(ship.x, ship.y, '#3b82f6');
          livesRef.current--;
          if (livesRef.current <= 0) { setPhase('gameover'); return; }
        }
      }
      bulletsRef.current = bulletsRef.current.filter(b => b.damage > 0);

      // Particles
      for (const p of particlesRef.current) { p.x += p.vx; p.y += p.vy; p.alpha -= 0.03; }
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);

      // Wave progression
      if (scoreRef.current > waveRef.current * 200) waveRef.current++;

      // Draw bullets
      for (const b of bulletsRef.current) {
        ctx.fillStyle = b.isEnemy ? '#f87171' : '#86efac';
        ctx.fillRect(b.x - 2, b.y - 5, 4, 10);
      }

      // Draw enemies
      for (const e of enemiesRef.current) {
        const colors = ['#6366f1','#ef4444','#f59e0b','#a855f7'];
        ctx.fillStyle = colors[e.type % colors.length];
        ctx.beginPath(); ctx.moveTo(e.x, e.y - 14); ctx.lineTo(e.x + 14, e.y + 12); ctx.lineTo(e.x, e.y + 6); ctx.lineTo(e.x - 14, e.y + 12); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#000'; ctx.fillRect(e.x - 10, e.y - 20, 20, 3);
        ctx.fillStyle = '#22c55e'; ctx.fillRect(e.x - 10, e.y - 20, 20 * e.hp / e.maxHp, 3);
      }

      // Draw ship
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath(); ctx.moveTo(ship.x, ship.y - 18); ctx.lineTo(ship.x + 12, ship.y + 14); ctx.lineTo(ship.x, ship.y + 8); ctx.lineTo(ship.x - 12, ship.y + 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#93c5fd'; ctx.beginPath(); ctx.ellipse(ship.x, ship.y + 2, 6, 4, 0, 0, Math.PI * 2); ctx.fill();

      // Particles
      for (const p of particlesRef.current) {
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, CW, 28);
      ctx.fillStyle = '#facc15'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`Score: ${scoreRef.current}`, 8, 18);
      ctx.fillStyle = '#f87171'; ctx.fillText(`❤ ${livesRef.current}`, CW - 60, 18);
      ctx.fillStyle = '#93c5fd'; ctx.fillText(`Wave ${waveRef.current}`, CW / 2 - 30, 18);

      setScore(scoreRef.current); setLives(livesRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [phase, phaseRef]);

  if (phase === 'menu') return (
    <div style={{ background: '#050815', borderRadius: 12, padding: 32, textAlign: 'center', color: '#fff', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#60a5fa' }}>🚀 SPACE SHOOTER</div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>Arrow keys / touch to move. Auto-fire. Destroy all enemies!</div>
      <button onClick={startGame} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Launch</button>
    </div>
  );
  if (phase === 'gameover') return (
    <div style={{ background: '#050815', borderRadius: 12, padding: 32, textAlign: 'center', color: '#fff', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#f87171' }}>💥 GAME OVER</div>
      <div style={{ fontSize: 20, color: '#facc15', fontWeight: 700 }}>Score: {score}</div>
      <button onClick={startGame} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <canvas ref={canvasRef} width={CW} height={CH}
        onTouchMove={e => { touchRef.current = { x: (e.touches[0].clientX - canvasRef.current!.getBoundingClientRect().left) * (CW / canvasRef.current!.getBoundingClientRect().width) }; }}
        onTouchEnd={() => { touchRef.current = null; }}
        style={{ width: '100%', maxWidth: 400, margin: '0 auto', borderRadius: 8, display: 'block', border: '2px solid rgba(96,165,250,0.3)' }} />
    </div>
  );
}

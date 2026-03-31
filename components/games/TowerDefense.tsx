'use client';
/**
 * TowerDefense — Protect your base from waves of enemies by placing towers.
 * Categories: strategy / tower defense
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useSubmitScore } from '@/lib/games/hooks';
import { getImmersiveCanvasStyle, getImmersiveStageStyle, useImmersiveGameLayout } from '@/lib/games/useImmersiveGameLayout';

const CW = 700; const CH = 480;
const CELL = 40; const COLS = Math.floor(CW / CELL); const ROWS = Math.floor(CH / CELL);

type TowerType = 'arrow' | 'cannon' | 'freeze';
type Phase = 'menu' | 'playing' | 'gameover' | 'win';

interface Tower { id: number; col: number; row: number; type: TowerType; cooldown: number; }
interface Enemy { id: number; x: number; y: number; hp: number; maxHp: number; speed: number; pathIdx: number; }
interface Bullet { id: number; x: number; y: number; tx: number; ty: number; damage: number; type: TowerType; }

const PATH_COLS = [0,1,2,3,4,5,6,7,8,9,10,10,10,10,10,9,8,7,6,5,4,3,3,3,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
const PATH_ROWS = [7,7,7,7,7,7,7,7,7,7,7,8,9,10,11,11,11,11,11,11,11,11,10,9,8,8,8,8,8,8,8,8,8,8,8,8,8,8];
const PATH: { x: number; y: number }[] = PATH_COLS.map((c, i) => ({ x: c * CELL + CELL / 2, y: PATH_ROWS[i] * CELL + CELL / 2 }));
const PATH_SET = new Set(PATH_COLS.map((c, i) => `${c},${PATH_ROWS[i]}`));

const TOWER_STATS: Record<TowerType, { label: string; color: string; cost: number; damage: number; range: number; cooldownMax: number }> = {
  arrow:  { label: '🏹 Arrow',  color: '#10b981', cost: 50,  damage: 15, range: 3, cooldownMax: 30 },
  cannon: { label: '💣 Cannon', color: '#ef4444', cost: 100, damage: 45, range: 4, cooldownMax: 90 },
  freeze: { label: '❄ Freeze',  color: '#3b82f6', cost: 75,  damage: 5,  range: 3, cooldownMax: 45 },
};

let gId = 1;

function spawnEnemy(wave: number): Enemy {
  return { id: gId++, x: PATH[0].x, y: PATH[0].y, hp: 30 + wave * 20, maxHp: 30 + wave * 20, speed: 1 + wave * 0.1, pathIdx: 0 };
}

export default function TowerDefense() {
  const immersive = useImmersiveGameLayout();
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const [gold, setGold] = useState(200);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(1);
  const [selectedTower, setSelectedTower] = useState<TowerType>('arrow');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const towersRef = useRef<Tower[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const goldRef = useRef(200);
  const livesRef = useRef(20);
  const waveRef = useRef(1);
  const spawnTimerRef = useRef(0);
  const spawnsLeftRef = useRef(10);
  const rafRef = useRef(0);
  const selectedRef = useRef<TowerType>('arrow');
  const submitScore = useSubmitScore('tower-defense');
  useEffect(() => {
    if (phase === 'win') submitScore(1000, waveRef.current);
    if (phase === 'gameover') submitScore(waveRef.current * 100, waveRef.current);
  }, [phase, submitScore]);

  useEffect(() => { selectedRef.current = selectedTower; }, [selectedTower]);

  const startGame = useCallback(() => {
    gId = 1;
    towersRef.current = [];
    enemiesRef.current = [];
    bulletsRef.current = [];
    goldRef.current = 200; livesRef.current = 20; waveRef.current = 1;
    spawnTimerRef.current = 0; spawnsLeftRef.current = 10;
    setGold(200); setLives(20); setWave(1);
    setPhase('playing');
  }, [setPhase]);
  useGameAutoStart(phase === 'menu' ? startGame : null);

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const loop = () => {
      if (phaseRef.current !== 'playing') return;
      ctx.clearRect(0, 0, CW, CH);

      // Background
      ctx.fillStyle = '#1c2a1c';
      ctx.fillRect(0, 0, CW, CH);

      // Path
      for (let i = 0; i < PATH_COLS.length; i++) {
        ctx.fillStyle = '#3d2a10';
        ctx.fillRect(PATH_COLS[i] * CELL, PATH_ROWS[i] * CELL, CELL, CELL);
      }

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5;
      for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, CH); ctx.stroke(); }
      for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(CW, r * CELL); ctx.stroke(); }

      // Towers
      for (const t of towersRef.current) {
        const stats = TOWER_STATS[t.type];
        ctx.fillStyle = stats.color;
        ctx.beginPath(); ctx.arc(t.col * CELL + CELL / 2, t.row * CELL + CELL / 2, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(t.type === 'arrow' ? '🏹' : t.type === 'cannon' ? '💣' : '❄', t.col * CELL + CELL / 2, t.row * CELL + CELL / 2 + 5);
        ctx.textAlign = 'left';
      }

      // Enemies
      for (const e of enemiesRef.current) {
        const hpRatio = e.hp / e.maxHp;
        ctx.fillStyle = '#7f1d1d'; ctx.beginPath(); ctx.arc(e.x, e.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(e.x, e.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.fillRect(e.x - 10, e.y - 16, 20, 3);
        ctx.fillStyle = '#22c55e'; ctx.fillRect(e.x - 10, e.y - 16, 20 * hpRatio, 3);
      }

      // Bullets
      for (const b of bulletsRef.current) {
        ctx.fillStyle = b.type === 'freeze' ? '#93c5fd' : b.type === 'cannon' ? '#fbbf24' : '#86efac';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.type === 'cannon' ? 5 : 3, 0, Math.PI * 2); ctx.fill();
      }

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, CW, 30);
      ctx.fillStyle = '#facc15'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`💰 ${goldRef.current}`, 8, 20);
      ctx.fillStyle = '#f87171'; ctx.fillText(`❤ ${livesRef.current}`, 90, 20);
      ctx.fillStyle = '#86efac'; ctx.fillText(`Wave ${waveRef.current}`, 155, 20);
      ctx.fillStyle = '#9ca3af'; ctx.fillText(`Enemies: ${enemiesRef.current.length}`, 230, 20);

      // Update
      spawnTimerRef.current++;
      if (spawnsLeftRef.current > 0 && spawnTimerRef.current >= 60) {
        spawnTimerRef.current = 0;
        spawnsLeftRef.current--;
        enemiesRef.current.push(spawnEnemy(waveRef.current));
      }
      if (spawnsLeftRef.current === 0 && enemiesRef.current.length === 0) {
        waveRef.current++;
        if (waveRef.current > 10) { setPhase('win'); return; }
        spawnsLeftRef.current = 5 + waveRef.current * 2;
        spawnTimerRef.current = 0;
        setWave(waveRef.current);
      }

      // Move enemies
      for (const e of enemiesRef.current) {
        if (e.pathIdx >= PATH.length - 1) {
          livesRef.current = Math.max(0, livesRef.current - 1);
          e.hp = 0;
          if (livesRef.current <= 0) { setPhase('gameover'); return; }
          continue;
        }
        const target = PATH[e.pathIdx + 1];
        const dx = target.x - e.x; const dy = target.y - e.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < e.speed) { e.pathIdx++; } else { e.x += dx / d * e.speed; e.y += dy / d * e.speed; }
      }
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

      // Tower attack
      for (const t of towersRef.current) {
        t.cooldown = Math.max(0, t.cooldown - 1);
        if (t.cooldown > 0) continue;
        const stats = TOWER_STATS[t.type];
        const tx = t.col * CELL + CELL / 2; const ty = t.row * CELL + CELL / 2;
        const target = enemiesRef.current.find(e => Math.hypot(e.x - tx, e.y - ty) < stats.range * CELL);
        if (target) {
          bulletsRef.current.push({ id: gId++, x: tx, y: ty, tx: target.x, ty: target.y, damage: stats.damage, type: t.type });
          t.cooldown = stats.cooldownMax;
        }
      }

      // Move bullets
      for (const b of bulletsRef.current) {
        const dx = b.tx - b.x; const dy = b.ty - b.y; const d = Math.hypot(dx, dy);
        if (d < 8) {
          const hit = enemiesRef.current.find(e => Math.hypot(e.x - b.tx, e.y - b.ty) < 15);
          if (hit) { hit.hp -= b.damage; if (b.type === 'freeze') hit.speed = Math.max(0.3, hit.speed * 0.7); }
          b.damage = 0;
        } else { b.x += dx / d * 6; b.y += dy / d * 6; }
      }
      bulletsRef.current = bulletsRef.current.filter(b => b.damage > 0);

      setGold(goldRef.current); setLives(livesRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, phaseRef]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const col = Math.floor((e.clientX - r.left) * (CW / r.width) / CELL);
    const row = Math.floor((e.clientY - r.top) * (CH / r.height) / CELL);
    if (PATH_SET.has(`${col},${row}`)) return;
    const cost = TOWER_STATS[selectedRef.current].cost;
    if (goldRef.current < cost) return;
    if (towersRef.current.find(t => t.col === col && t.row === row)) return;
    towersRef.current.push({ id: gId++, col, row, type: selectedRef.current, cooldown: 0 });
    goldRef.current -= cost;
  };

  if (phase === 'menu') return (
    <div style={{ background: '#1c2a1c', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#4ade80' }}>🏰 TOWER DEFENSE</div>
      <div style={{ color: '#86efac', fontSize: 13 }}>Place towers on the grid to stop enemies from reaching your base. Survive 10 waves!</div>
      <button onClick={startGame} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Start</button>
    </div>
  );
  if (phase === 'win') return (
    <div style={{ background: '#14532d', borderRadius: 12, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 28, color: '#4ade80', fontWeight: 900 }}>🏆 YOU WIN! All 10 waves defeated!</div>
      <button onClick={startGame} style={{ marginTop: 16, background: '#16a34a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Play Again</button>
    </div>
  );
  if (phase === 'gameover') return (
    <div style={{ background: '#450a0a', borderRadius: 12, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 28, color: '#f87171', fontWeight: 900 }}>💀 Game Over — Wave {wave}</div>
      <button onClick={startGame} style={{ marginTop: 16, background: '#dc2626', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Try Again</button>
    </div>
  );

  const towerButtons = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(Object.entries(TOWER_STATS) as [TowerType, typeof TOWER_STATS[TowerType]][]).map(([type, stats]) => (
        <button key={type} onClick={() => setSelectedTower(type)} style={{ background: selectedTower === type ? stats.color : '#374151', color: '#fff', border: `2px solid ${selectedTower === type ? '#fff' : 'transparent'}`, padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          {stats.label} (${stats.cost})
        </button>
      ))}
    </div>
  );
  if (immersive) {
    return (
      <div style={getImmersiveStageStyle()}>
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
          {towerButtons}
        </div>
        <canvas ref={canvasRef} width={CW} height={CH} onClick={handleClick} style={getImmersiveCanvasStyle()} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {towerButtons}
      <canvas ref={canvasRef} width={CW} height={CH} onClick={handleClick} style={{ width: '100%', borderRadius: 8, cursor: 'crosshair', border: '2px solid rgba(74,222,128,0.3)' }} />
    </div>
  );
}

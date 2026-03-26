'use client';

/**
 * DREAMquest — Turn-based RPG through 5 layered dream worlds.
 * Inspired by Final Fantasy VII + Chrono Trigger.
 *
 * Canvas: combat renderer (600×300)
 * React UI: exploration, vendor, menus
 * Self-contained: react hooks + useSubmitScore only
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSubmitScore } from '@/lib/games/hooks';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'menu' | 'explore' | 'battle' | 'vendor' | 'gameover' | 'win';

interface Player {
  hp: number; maxHP: number;
  dp: number; maxDP: number;
  atk: number; def: number;
  lvl: number; xp: number; xpNext: number;
  shards: number;
  hpPotions: number; dpPotions: number;
}

type EnemyShape =
  | 'cloud' | 'sprite' | 'wraith' | 'ghost'
  | 'knight' | 'jester' | 'stalker' | 'oracle'
  | 'watcher' | 'destroyer';

interface Enemy {
  name: string;
  hp: number; maxHP: number;
  atk: number; def: number;
  xp: number; shards: number;
  layer: number;
  color: string;
  shape: EnemyShape;
  isBoss?: boolean;
  sleepTurns: number;
}

interface LogLine { text: string; color: string; }

interface DmgNum { id: number; text: string; x: number; y: number; color: string; }

interface Ability {
  name: string; dpCost: number; desc: string;
  minLayer: number; color: string; emoji: string;
}

// ── Game data ─────────────────────────────────────────────────────────────────

const CW = 600;
const CH = 300;

const LAYER_INFO = [
  { name: 'The Calm',      flavor: 'A peaceful dream meadow stretches endlessly. Something stirs beneath the surface.',       bg: ['#0d2d4a', '#1a3a5c', '#0a2035'] },
  { name: 'The Fog',       flavor: 'Thick mist swallows your vision. Shapes drift and dissolve around you.',                  bg: ['#1a2535', '#2d3a4a', '#131e2d'] },
  { name: 'The Spiral',    flavor: 'Reality bends and loops. The ground tilts in impossible directions.',                     bg: ['#2a0a4a', '#3a1060', '#1a0535'] },
  { name: 'The Deep',      flavor: 'Absolute darkness. Ancient things breathe in the void. Your dream wavers.',               bg: ['#050510', '#0a0a1a', '#030308'] },
  { name: 'The Awakening', flavor: 'Gold cracks split the black sky. The final truth of the dream awaits. Face it.',          bg: ['#1a0a00', '#2a1500', '#0f0700'] },
] as const;

const ENEMY_POOL: Omit<Enemy, 'hp' | 'sleepTurns'>[][] = [
  [
    { name: 'Drifting Cloud', maxHP: 30,  atk: 6,  def: 1,  xp: 20,  shards: 1, layer: 1, color: '#93c5fd', shape: 'cloud'    },
    { name: 'Sleepy Sprite',  maxHP: 45,  atk: 9,  def: 2,  xp: 30,  shards: 2, layer: 1, color: '#c4b5fd', shape: 'sprite'   },
  ],
  [
    { name: 'Mist Wraith',    maxHP: 70,  atk: 14, def: 3,  xp: 50,  shards: 2, layer: 2, color: '#94a3b8', shape: 'wraith'   },
    { name: 'Echo Ghost',     maxHP: 90,  atk: 18, def: 4,  xp: 65,  shards: 3, layer: 2, color: '#cbd5e1', shape: 'ghost'    },
  ],
  [
    { name: 'Spiral Knight',  maxHP: 130, atk: 24, def: 6,  xp: 90,  shards: 3, layer: 3, color: '#c084fc', shape: 'knight'   },
    { name: 'Twisted Jester', maxHP: 150, atk: 28, def: 5,  xp: 110, shards: 4, layer: 3, color: '#f472b6', shape: 'jester'   },
  ],
  [
    { name: 'Void Stalker',   maxHP: 200, atk: 34, def: 8,  xp: 140, shards: 5, layer: 4, color: '#6366f1', shape: 'stalker'  },
    { name: 'Dark Oracle',    maxHP: 220, atk: 38, def: 10, xp: 160, shards: 6, layer: 4, color: '#7c3aed', shape: 'oracle'   },
  ],
  [
    { name: 'The Watcher',     maxHP: 350, atk: 45, def: 12, xp: 250, shards: 8,  layer: 5, color: '#b45309', shape: 'watcher',   isBoss: true },
    { name: 'Dream Destroyer', maxHP: 500, atk: 55, def: 15, xp: 400, shards: 15, layer: 5, color: '#d97706', shape: 'destroyer', isBoss: true },
  ],
];

const ABILITIES: Ability[] = [
  { name: 'Lullaby',          dpCost: 10, desc: 'Sleep 2 turns',       minLayer: 1, color: '#818cf8', emoji: '🎵' },
  { name: 'Lucid Strike',     dpCost: 15, desc: '2.5× damage',         minLayer: 1, color: '#38bdf8', emoji: '⚡' },
  { name: 'Dream Weave',      dpCost: 20, desc: '+40 HP, +10 DP',      minLayer: 2, color: '#4ade80', emoji: '🌿' },
  { name: 'Nightmare Burst',  dpCost: 25, desc: 'Massive damage',      minLayer: 3, color: '#f97316', emoji: '💥' },
  { name: 'Reality Fracture', dpCost: 35, desc: 'Pierce + destroy',    minLayer: 4, color: '#e11d48', emoji: '🔥' },
];

const BASE: Player = {
  hp: 120, maxHP: 120, dp: 60, maxDP: 60,
  atk: 18, def: 6, lvl: 1, xp: 0, xpNext: 100,
  shards: 0, hpPotions: 2, dpPotions: 1,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function hpColor(hp: number, max: number): string {
  const r = hp / max;
  return r > 0.5 ? '#22c55e' : r > 0.25 ? '#f59e0b' : '#ef4444';
}

function applyLevelUp(p: Player): Player {
  let out = { ...p };
  while (out.xp >= out.xpNext) {
    const excess = out.xp - out.xpNext;
    out = {
      ...out,
      lvl: out.lvl + 1,
      xp: excess,
      xpNext: Math.floor(out.xpNext * 1.7),
      maxHP: out.maxHP + 25,
      hp: Math.min(out.hp + 25, out.maxHP + 25),
      maxDP: out.maxDP + 10,
      dp: Math.min(out.dp + 10, out.maxDP + 10),
      atk: out.atk + 5,
      def: out.def + 2,
    };
  }
  return out;
}

function spawnEnemy(layerIdx: number): Enemy {
  const pool = ENEMY_POOL[layerIdx];
  const tmpl = pool[Math.floor(Math.random() * pool.length)];
  return { ...tmpl, hp: tmpl.maxHP, sleepTurns: 0 };
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function rng(min: number, max: number) { return min + Math.floor(Math.random() * (max - min + 1)); }

// ── Canvas drawing ────────────────────────────────────────────────────────────

function drawBg(ctx: CanvasRenderingContext2D, layerIdx: number) {
  const [c0, c1, c2] = LAYER_INFO[layerIdx].bg;
  const g = ctx.createLinearGradient(0, 0, CW, CH);
  g.addColorStop(0, c0); g.addColorStop(0.5, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
  // ambient particles
  ctx.save();
  for (let i = 0; i < 28; i++) {
    const px = (i * 79 + layerIdx * 37) % CW;
    const py = (i * 53 + layerIdx * 61) % CH;
    const r = 0.8 + (i % 3) * 0.6;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.04 + (i % 5) * 0.025})`;
    ctx.fill();
  }
  ctx.restore();
  // ground line
  const gy = CH - 60;
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(0, gy, CW, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, gy + 1, CW, CH - gy - 1);
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  val: number, max: number,
  barColor: string, label: string,
) {
  const ratio = Math.max(0, val / max);
  ctx.fillStyle = '#1f2937';
  ctx.beginPath(); ctx.roundRect(x, y, w, 9, 3); ctx.fill();
  if (ratio > 0) {
    ctx.fillStyle = barColor;
    ctx.beginPath(); ctx.roundRect(x, y, w * ratio, 9, 3); ctx.fill();
  }
  ctx.fillStyle = '#d1d5db'; ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${label} ${val}/${max}`, x, y - 2);
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean) {
  ctx.save();
  ctx.shadowColor = flash ? '#ffffff' : '#38bdf8';
  ctx.shadowBlur = flash ? 32 : 18;
  const g = ctx.createRadialGradient(x, y - 10, 4, x, y - 10, 36);
  g.addColorStop(0, flash ? '#ffffff' : '#7dd3fc');
  g.addColorStop(0.5, flash ? '#93c5fd' : '#0ea5e9');
  g.addColorStop(1, flash ? '#60a5fa' : '#0369a1');
  // body
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, y, 17, 27, 0, 0, Math.PI * 2); ctx.fill();
  // head
  ctx.beginPath(); ctx.arc(x, y - 34, 13, 0, Math.PI * 2); ctx.fill();
  // cape shimmer
  ctx.fillStyle = flash ? 'rgba(255,255,255,0.55)' : 'rgba(56,189,248,0.3)';
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 20); ctx.lineTo(x - 22, y + 22);
  ctx.lineTo(x + 22, y + 22); ctx.lineTo(x + 10, y - 20);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  // label
  ctx.fillStyle = flash ? '#ffffff' : '#7dd3fc';
  ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 6;
  ctx.fillText('YOU', x, y + 50);
  ctx.shadowBlur = 0;
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number, flash: boolean) {
  ctx.save();
  ctx.shadowColor = flash ? '#ffffff' : e.color;
  ctx.shadowBlur = flash ? 32 : 14;
  const c = flash ? '#ffffff' : e.color;
  ctx.fillStyle = c;

  switch (e.shape) {
    case 'cloud':
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.arc(x - 20, y + 6, 17, 0, Math.PI * 2);
      ctx.arc(x + 20, y + 6, 17, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'sprite':
      ctx.beginPath();
      ctx.moveTo(x, y - 30); ctx.lineTo(x + 18, y);
      ctx.lineTo(x, y + 30); ctx.lineTo(x - 18, y);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = c + '77';
      ctx.beginPath(); ctx.ellipse(x - 28, y, 13, 6, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 28, y, 13, 6, -Math.PI / 4, 0, Math.PI * 2); ctx.fill();
      break;

    case 'wraith':
      ctx.beginPath();
      ctx.arc(x, y - 10, 22, Math.PI, 0);
      ctx.lineTo(x + 22, y + 18);
      ctx.quadraticCurveTo(x + 14, y + 28, x + 7, y + 18);
      ctx.quadraticCurveTo(x, y + 28, x - 7, y + 18);
      ctx.quadraticCurveTo(x - 14, y + 28, x - 22, y + 18);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(x - 9, y - 8, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 9, y - 8, 5, 0, Math.PI * 2); ctx.fill();
      break;

    case 'ghost': {
      const rg = ctx.createRadialGradient(x, y, 4, x, y, 30);
      rg.addColorStop(0, flash ? '#ffffff' : '#e2e8f0');
      rg.addColorStop(0.6, flash ? '#94a3b8' : '#475569');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.font = '18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('👁', x - 8, y + 6); ctx.fillText('👁', x + 8, y + 6);
      break;
    }

    case 'knight':
      ctx.fillRect(x - 15, y - 20, 30, 34);
      ctx.beginPath(); ctx.arc(x, y - 28, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 26, y - 22, 12, 13); ctx.fillRect(x + 14, y - 22, 12, 13);
      ctx.fillStyle = '#1e1b4b'; ctx.fillRect(x - 9, y - 32, 18, 6);
      break;

    case 'jester':
      ctx.beginPath();
      ctx.moveTo(x, y - 36);
      [
        [10, -22],[20,-28],[16,-14],[26,2],[16,8],[18,30],
        [0,20],[-18,30],[-16,8],[-26,2],[-16,-14],[-20,-28],[-10,-22],
      ].forEach(([dx, dy]) => ctx.lineTo(x + dx, y + dy));
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fce7f3'; ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('?!', x, y + 5);
      break;

    case 'stalker':
      ctx.beginPath();
      ctx.moveTo(x, y - 40);
      [
        [8,-30],[22,-24],[12,-11],[26,4],[10,4],[14,30],
        [0,20],[-14,30],[-10,4],[-26,4],[-12,-11],[-22,-24],[-8,-30],
      ].forEach(([dx, dy]) => ctx.lineTo(x + dx, y + dy));
      ctx.closePath(); ctx.fill();
      const sg = ctx.createRadialGradient(x, y - 15, 2, x, y - 15, 10);
      sg.addColorStop(0, '#fff'); sg.addColorStop(1, '#6366f1');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.ellipse(x, y - 15, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y - 15, 4, 0, Math.PI * 2); ctx.fill();
      break;

    case 'oracle':
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 28); ctx.lineTo(x - 24, y + 30);
      ctx.lineTo(x + 24, y + 30); ctx.lineTo(x + 5, y - 28);
      ctx.closePath(); ctx.fill();
      const og = ctx.createRadialGradient(x, y - 46, 3, x, y - 46, 16);
      og.addColorStop(0, '#c4b5fd'); og.addColorStop(1, '#4c1d95');
      ctx.fillStyle = og;
      ctx.beginPath(); ctx.arc(x, y - 46, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c4b5fd';
      ctx.beginPath(); ctx.arc(x, y - 29, 11, 0, Math.PI * 2); ctx.fill();
      break;

    case 'watcher':
      ctx.fillStyle = '#78350f';
      ctx.beginPath(); ctx.ellipse(x, y, 38, 26, 0, 0, Math.PI * 2); ctx.fill();
      const wg = ctx.createRadialGradient(x, y, 4, x, y, 22);
      wg.addColorStop(0, '#fef3c7'); wg.addColorStop(0.4, '#d97706'); wg.addColorStop(1, '#1c1917');
      ctx.fillStyle = wg;
      ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 36, y + Math.sin(a) * 24);
        ctx.lineTo(x + Math.cos(a) * 58, y + Math.sin(a) * 44);
        ctx.stroke();
      }
      break;

    case 'destroyer':
      ctx.strokeStyle = flash ? '#ffffff' : '#f59e0b'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, 43, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 28, 0, Math.PI * 2); ctx.stroke();
      const dg = ctx.createRadialGradient(x, y, 4, x, y, 22);
      dg.addColorStop(0, flash ? '#ffffff' : '#fef9c3');
      dg.addColorStop(0.5, '#d97706'); dg.addColorStop(1, '#7c2d12');
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#fbbf24';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 28, y + Math.sin(a) * 28);
        ctx.lineTo(x + Math.cos(a + 0.2) * 46, y + Math.sin(a + 0.2) * 46);
        ctx.lineTo(x + Math.cos(a - 0.2) * 46, y + Math.sin(a - 0.2) * 46);
        ctx.closePath(); ctx.fill();
      }
      break;
  }

  if (e.sleepTurns > 0) {
    ctx.font = '20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('💤', x + 38, y - 38);
  }
  ctx.restore();

  ctx.fillStyle = flash ? '#ffffff' : e.color;
  ctx.font = `bold ${e.isBoss ? 13 : 11}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.shadowColor = e.color; ctx.shadowBlur = 6;
  ctx.fillText(e.name, x, y + 56);
  ctx.shadowBlur = 0;
}

// ── Component ─────────────────────────────────────────────────────────────────

let dmgCounter = 0;

export default function DREAMquest() {
  const [phase, setPhase]             = useState<Phase>('menu');
  const [player, setPlayer]           = useState<Player>({ ...BASE });
  const [layerIdx, setLayerIdx]       = useState(0);
  const [battlesWon, setBattlesWon]   = useState(0);   // in current layer
  const [totalWon, setTotalWon]       = useState(0);
  const [enemy, setEnemy]             = useState<Enemy | null>(null);
  const [log, setLog]                 = useState<LogLine[]>([]);
  const [lvlUpMsg, setLvlUpMsg]       = useState('');
  const [pFlash, setPFlash]           = useState(false);
  const [eFlash, setEFlash]           = useState(false);
  const [shakeX, setShakeX]           = useState(0);
  const [dmgNums, setDmgNums]         = useState<DmgNum[]>([]);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);

  const submitScore = useSubmitScore('dreamquest');

  // Score on end
  useEffect(() => {
    if (phase === 'win' || phase === 'gameover') {
      submitScore((layerIdx + 1) * 1000 + totalWon * 100 + player.lvl * 50, player.lvl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Canvas render (on demand — no idle RAF) ────────────────────────────────
  useEffect(() => {
    if (phase !== 'battle') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CW, CH);
    drawBg(ctx, layerIdx);

    const pX = 120; const pY = CH - 100;
    drawPlayer(ctx, pX, pY, pFlash);
    drawBar(ctx, 24, 26, 150, player.hp, player.maxHP, hpColor(player.hp, player.maxHP), 'HP');
    // DP bar
    ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.roundRect(24, 50, 150, 9, 3); ctx.fill();
    if (player.dp > 0) {
      ctx.fillStyle = '#818cf8';
      ctx.beginPath(); ctx.roundRect(24, 50, 150 * (player.dp / player.maxDP), 9, 3); ctx.fill();
    }
    ctx.fillStyle = '#a5b4fc'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`DP ${player.dp}/${player.maxDP}`, 24, 47);

    if (enemy) {
      const eX = CW - 145; const eY = CH - 100;
      drawEnemy(ctx, enemy, eX, eY, eFlash);
      drawBar(ctx, CW - 224, 26, 170, enemy.hp, enemy.maxHP, hpColor(enemy.hp, enemy.maxHP), 'HP');
    }

    // damage numbers drawn as DOM overlay — nothing extra on canvas
  }, [phase, layerIdx, player, enemy, pFlash, eFlash]);

  // Cleanup RAF
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const addLog = useCallback((text: string, color = '#e5e7eb') => {
    setLog(prev => [...prev.slice(-3), { text, color }]);
  }, []);

  const flashPlayer = useCallback(() => {
    setPFlash(true); setShakeX(-4);
    setTimeout(() => { setPFlash(false); setShakeX(0); }, 340);
  }, []);

  const flashEnemy = useCallback(() => {
    setEFlash(true);
    setTimeout(() => setEFlash(false), 340);
  }, []);

  const spawnDmg = useCallback((text: string, side: 'player' | 'enemy', color: string) => {
    const id = ++dmgCounter;
    const baseX = side === 'player' ? 120 : CW - 145;
    const baseY = CH - 120;
    const newDn: DmgNum = { id, text, x: baseX, y: baseY, color };
    setDmgNums(prev => [...prev, newDn]);
    // animate upward and fade via RAF
    let tick = 0;
    const step = () => {
      tick++;
      setDmgNums(prev =>
        prev.map(d => d.id === id ? { ...d, y: d.y - 2 } : d).filter(d => tick < 28 || d.id !== id)
      );
      if (tick < 28) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  // Resolve enemy turn (returns updated enemy & player, plus new log lines)
  const resolveEnemyTurn = useCallback((e: Enemy, p: Player): [Enemy, Player, LogLine[]] => {
    const lines: LogLine[] = [];
    const eCopy = { ...e };
    let pCopy = { ...p };
    if (eCopy.sleepTurns > 0) {
      eCopy.sleepTurns--;
      lines.push({ text: `💤 ${eCopy.name} sleeps… (${eCopy.sleepTurns} left)`, color: '#818cf8' });
      return [eCopy, pCopy, lines];
    }
    const dmg = clamp(eCopy.atk - pCopy.def + rng(-2, 4), 1, 9999);
    pCopy.hp = clamp(pCopy.hp - dmg, 0, pCopy.maxHP);
    lines.push({ text: `💢 ${eCopy.name} strikes for ${dmg} damage!`, color: '#f87171' });
    return [eCopy, pCopy, lines];
  }, []);

  const handleVictory = useCallback((defeatedEnemy: Enemy, p: Player, curBattlesWon: number, curTotalWon: number) => {
    let updated = { ...p };
    updated.xp += defeatedEnemy.xp;
    updated.shards += defeatedEnemy.shards;
    const prevLvl = updated.lvl;
    updated = applyLevelUp(updated);
    if (updated.lvl > prevLvl) {
      setLvlUpMsg(`⬆️ Level Up! LV ${updated.lvl} · +25HP +10DP +5ATK +2DEF`);
      setTimeout(() => setLvlUpMsg(''), 3000);
      addLog(`⬆️ LEVEL UP! Now LV ${updated.lvl}!`, '#fbbf24');
    }
    addLog(`🏆 ${defeatedEnemy.name} defeated! +${defeatedEnemy.xp} XP  +${defeatedEnemy.shards} Shards`, '#fbbf24');

    const newTotal = curTotalWon + 1;
    const newLayerBattles = curBattlesWon + 1;
    setTotalWon(newTotal);
    setBattlesWon(newLayerBattles);
    setPlayer(updated);
    setEnemy(null);

    if (defeatedEnemy.shape === 'destroyer') {
      setPhase('win');
    } else {
      setPhase('explore');
    }
  }, [addLog]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleAttack = useCallback(() => {
    if (!enemy) return;
    let p = { ...player };
    let e = { ...enemy };

    const dmg = clamp(p.atk - e.def + rng(-3, 6), 1, 9999);
    e.hp = clamp(e.hp - dmg, 0, e.maxHP);
    flashEnemy(); spawnDmg(`-${dmg}`, 'enemy', '#f87171');
    addLog(`⚔️ You strike for ${dmg} damage!`, '#86efac');

    if (e.hp <= 0) { handleVictory(e, p, battlesWon, totalWon); return; }

    const [ne, np, lines] = resolveEnemyTurn(e, p);
    lines.forEach(l => addLog(l.text, l.color));
    if (np.hp < p.hp) { flashPlayer(); spawnDmg(`-${p.hp - np.hp}`, 'player', '#f87171'); }

    if (np.hp <= 0) { setPlayer(np); setEnemy(ne); setPhase('gameover'); return; }
    setPlayer(np); setEnemy(ne);
  }, [enemy, player, battlesWon, totalWon, addLog, flashEnemy, flashPlayer, spawnDmg, resolveEnemyTurn, handleVictory]);

  const handleAbility = useCallback((ability: Ability) => {
    if (!enemy) return;
    if (player.dp < ability.dpCost) { addLog(`❌ Not enough DP! Need ${ability.dpCost}.`, '#f87171'); return; }

    let p = { ...player, dp: player.dp - ability.dpCost };
    let e = { ...enemy };
    let skipEnemyTurn = false;
    let enemyDead = false;

    switch (ability.name) {
      case 'Lullaby':
        e.sleepTurns = 2;
        addLog(`🎵 Lullaby soothes ${e.name}! Asleep for 2 turns.`, '#818cf8');
        spawnDmg('💤', 'enemy', '#818cf8');
        flashEnemy();
        break;

      case 'Lucid Strike': {
        const dmg = clamp(Math.floor(p.atk * 2.5) - e.def + rng(0, 8), 1, 9999);
        e.hp = clamp(e.hp - dmg, 0, e.maxHP);
        addLog(`⚡ Lucid Strike! ${dmg} dream damage!`, '#38bdf8');
        spawnDmg(`-${dmg}`, 'enemy', '#38bdf8'); flashEnemy();
        if (e.hp <= 0) enemyDead = true;
        break;
      }

      case 'Dream Weave':
        p.hp = clamp(p.hp + 40, 0, p.maxHP);
        p.dp = clamp(p.dp + 10, 0, p.maxDP);
        addLog(`🌿 Dream Weave restores +40 HP & +10 DP!`, '#4ade80');
        spawnDmg('+40', 'player', '#4ade80');
        break;

      case 'Nightmare Burst': {
        const dmg = clamp(Math.floor(p.atk * 3.5) - Math.floor(e.def / 2) + rng(0, 14), 1, 9999);
        e.hp = clamp(e.hp - dmg, 0, e.maxHP);
        addLog(`💥 Nightmare Burst! ${dmg} massive damage!`, '#f97316');
        spawnDmg(`-${dmg}`, 'enemy', '#f97316'); flashEnemy();
        if (e.hp <= 0) enemyDead = true;
        break;
      }

      case 'Reality Fracture': {
        const dmg = clamp(Math.floor(p.atk * 4.5) + rng(5, 20), 1, 9999);
        e.hp = clamp(e.hp - dmg, 0, e.maxHP);
        addLog(`🔥 Reality Fracture! ${dmg} piercing damage!`, '#e11d48');
        spawnDmg(`-${dmg}`, 'enemy', '#e11d48'); flashEnemy();
        if (e.hp <= 0) enemyDead = true;
        break;
      }
    }

    if (enemyDead) { handleVictory(e, p, battlesWon, totalWon); return; }
    if (skipEnemyTurn) { setPlayer(p); setEnemy(e); return; }

    const [ne, np, lines] = resolveEnemyTurn(e, p);
    lines.forEach(l => addLog(l.text, l.color));
    if (np.hp < p.hp) { flashPlayer(); spawnDmg(`-${p.hp - np.hp}`, 'player', '#f87171'); }
    if (np.hp <= 0) { setPlayer(np); setEnemy(ne); setPhase('gameover'); return; }
    setPlayer(np); setEnemy(ne);
  }, [enemy, player, battlesWon, totalWon, addLog, flashEnemy, flashPlayer, spawnDmg, resolveEnemyTurn, handleVictory]);

  const handleItem = useCallback((type: 'hp' | 'dp') => {
    if (!enemy) return;
    let p = { ...player };
    if (type === 'hp') {
      if (p.hpPotions <= 0) { addLog('❌ No HP Potions left!', '#f87171'); return; }
      p.hp = clamp(p.hp + 60, 0, p.maxHP); p.hpPotions--;
      addLog('🧪 Dream Elixir! +60 HP', '#86efac'); spawnDmg('+60', 'player', '#86efac');
    } else {
      if (p.dpPotions <= 0) { addLog('❌ No DP Crystals left!', '#f87171'); return; }
      p.dp = clamp(p.dp + 35, 0, p.maxDP); p.dpPotions--;
      addLog('💎 Focus Crystal! +35 DP', '#a78bfa'); spawnDmg('+35', 'player', '#a78bfa');
    }
    const [ne, np, lines] = resolveEnemyTurn(enemy, p);
    lines.forEach(l => addLog(l.text, l.color));
    if (np.hp < p.hp) { flashPlayer(); spawnDmg(`-${p.hp - np.hp}`, 'player', '#f87171'); }
    if (np.hp <= 0) { setPlayer(np); setEnemy(ne); setPhase('gameover'); return; }
    setPlayer(np); setEnemy(ne);
  }, [enemy, player, addLog, flashPlayer, spawnDmg, resolveEnemyTurn]);

  const handleFlee = useCallback(() => {
    if (!enemy) return;
    if (Math.random() < 0.5) {
      addLog('💨 You vanish into the dream mist!', '#a78bfa');
      setEnemy(null); setPhase('explore');
    } else {
      const dmg = clamp(enemy.atk - player.def + rng(0, 3), 1, 9999);
      const newHp = clamp(player.hp - dmg, 0, player.maxHP);
      addLog(`❌ Failed to flee! ${enemy.name} strikes for ${dmg}!`, '#f87171');
      flashPlayer(); spawnDmg(`-${dmg}`, 'player', '#f87171');
      if (newHp <= 0) { setPlayer(p => ({ ...p, hp: 0 })); setPhase('gameover'); }
      else setPlayer(p => ({ ...p, hp: newHp }));
    }
  }, [enemy, player, addLog, flashPlayer, spawnDmg]);

  const handleExplore = useCallback(() => {
    const roll = Math.random();
    if (roll < 0.5) {
      const e = spawnEnemy(layerIdx);
      setEnemy(e); setLog([]);
      addLog(`⚠️ ${e.name} emerges from the dream!`, '#f87171');
      setPhase('battle');
    } else if (roll < 0.8) {
      const r2 = Math.random();
      setPlayer(prev => {
        const p = { ...prev };
        if (r2 < 0.4) {
          p.hpPotions = Math.min(p.hpPotions + 1, 5);
          addLog('🧪 Found a Dream Elixir! (+1 HP Potion)', '#86efac');
        } else if (r2 < 0.7) {
          p.dpPotions = Math.min(p.dpPotions + 1, 5);
          addLog('💎 Found a Focus Crystal! (+1 DP Potion)', '#a78bfa');
        } else {
          const s = 1 + layerIdx;
          p.shards += s;
          addLog(`✨ Found ${s} Dream Shard${s > 1 ? 's' : ''}!`, '#fbbf24');
        }
        return p;
      });
    } else {
      const heal = 15 + layerIdx * 5;
      const dpRest = 8 + layerIdx * 3;
      setPlayer(prev => ({
        ...prev,
        hp: clamp(prev.hp + heal, 0, prev.maxHP),
        dp: clamp(prev.dp + dpRest, 0, prev.maxDP),
      }));
      addLog(`🌙 You rest in the dream. +${heal} HP, +${dpRest} DP`, '#86efac');
    }
  }, [layerIdx, addLog]);

  const handleDescend = useCallback(() => {
    if (battlesWon < 3) return;
    const next = layerIdx + 1;
    if (next >= LAYER_INFO.length) { setPhase('win'); return; }
    setLayerIdx(next); setBattlesWon(0); setLog([]);
    addLog(`🌀 You descend into ${LAYER_INFO[next].name}…`, '#c084fc');
  }, [battlesWon, layerIdx, addLog]);

  const handleBuy = useCallback((upgrade: 'hp' | 'dp' | 'atk' | 'def') => {
    const costs: Record<string, number> = { hp: 3, dp: 2, atk: 4, def: 3 };
    const cost = costs[upgrade];
    if (player.shards < cost) { addLog(`❌ Need ${cost} Shards.`, '#f87171'); return; }
    setPlayer(prev => {
      const p = { ...prev, shards: prev.shards - cost };
      if (upgrade === 'hp')  return { ...p, maxHP: p.maxHP + 30, hp: clamp(p.hp + 30, 0, p.maxHP + 30) };
      if (upgrade === 'dp')  return { ...p, maxDP: p.maxDP + 20, dp: clamp(p.dp + 20, 0, p.maxDP + 20) };
      if (upgrade === 'atk') return { ...p, atk: p.atk + 8 };
      return { ...p, def: p.def + 3 };
    });
    const labels: Record<string, string> = { hp: '+30 Max HP', dp: '+20 Max DP', atk: '+8 ATK', def: '+3 DEF' };
    addLog(`✨ Purchased: ${labels[upgrade]}`, '#fbbf24');
  }, [player.shards, addLog]);

  const startGame = useCallback(() => {
    setPlayer({ ...BASE }); setLayerIdx(0); setBattlesWon(0);
    setTotalWon(0); setEnemy(null); setLog([]); setLvlUpMsg('');
    setDmgNums([]); setPhase('explore');
  }, []);

  // ── Shared UI helpers ─────────────────────────────────────────────────────

  const unlockedAbilities = ABILITIES.filter(a => a.minLayer <= layerIdx + 1);

  const bar = (val: number, max: number, color: string) => (
    <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: 6, width: `${Math.max(0, (val / max) * 100)}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  );

  const btn = (label: React.ReactNode, onClick: () => void, color: string, disabled = false, extra: React.CSSProperties = {}): React.ReactElement => (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        background: disabled ? '#2d3748' : color,
        color: '#fff', border: 'none', borderRadius: 8, cursor: disabled ? 'default' : 'pointer',
        fontWeight: 700, fontSize: 12, opacity: disabled ? 0.45 : 1,
        transition: 'opacity 0.2s', padding: '9px 12px', ...extra,
      }}
    >
      {label}
    </button>
  );

  const logPanel = (lines: number) => log.length > 0 ? (
    <div style={{ background: '#060d1a', borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {log.slice(-lines).map((l, i) => <div key={i} style={{ fontSize: 11, color: l.color, lineHeight: 1.5 }}>{l.text}</div>)}
    </div>
  ) : null;

  const score = (layerIdx + 1) * 1000 + totalWon * 100 + player.lvl * 50;

  // ── MENU ──────────────────────────────────────────────────────────────────
  if (phase === 'menu') return (
    <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius: 16, padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', minHeight: 380, justifyContent: 'center' }}>
      <div style={{ fontSize: 12, color: '#38bdf8', letterSpacing: 5, textTransform: 'uppercase', fontWeight: 700 }}>DREAMengin presents</div>
      <div style={{ fontSize: 40, fontWeight: 900, color: '#7dd3fc', textShadow: '0 0 30px #38bdf8,0 0 60px #0ea5e9', letterSpacing: 2 }}>DREAMquest</div>
      <div style={{ fontSize: 12, color: '#64748b', maxWidth: 340, lineHeight: 1.9 }}>
        Five layers of dream await. Descend through The Calm, The Fog, The Spiral, The Deep, and face The Awakening. Only those who master the dream survive.
      </div>
      <div style={{ display: 'flex', gap: 20, fontSize: 11, color: '#475569' }}>
        <span>⚔️ Turn-based combat</span>
        <span>🌙 Dream abilities</span>
        <span>⬆️ Level system</span>
      </div>
      {btn('▶ Enter the Dream', startGame, '#1d4ed8', false, { padding: '14px 44px', fontSize: 15, borderRadius: 10, boxShadow: '0 0 20px #3b82f644' })}
    </div>
  );

  // ── GAME OVER ─────────────────────────────────────────────────────────────
  if (phase === 'gameover') return (
    <div style={{ background: 'linear-gradient(135deg,#0f172a,#1a0505)', borderRadius: 16, padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', minHeight: 320, justifyContent: 'center' }}>
      <div style={{ fontSize: 38, fontWeight: 900, color: '#ef4444', textShadow: '0 0 24px #ef4444' }}>💀 DREAM SHATTERED</div>
      <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 2.1 }}>
        <div>Layer: <span style={{ color: '#38bdf8' }}>{LAYER_INFO[layerIdx].name}</span></div>
        <div>Enemies defeated: <span style={{ color: '#fbbf24' }}>{totalWon}</span></div>
        <div>Level: <span style={{ color: '#c084fc' }}>{player.lvl}</span></div>
        <div>Final score: <span style={{ color: '#4ade80', fontWeight: 700 }}>{score}</span></div>
      </div>
      {btn('🔄 Re-enter the Dream', startGame, '#7c3aed', false, { padding: '12px 32px', fontSize: 14 })}
    </div>
  );

  // ── WIN ───────────────────────────────────────────────────────────────────
  if (phase === 'win') return (
    <div style={{ background: 'linear-gradient(135deg,#1a1000,#2a1500,#0f172a)', borderRadius: 16, padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', minHeight: 320, justifyContent: 'center' }}>
      <div style={{ fontSize: 38, fontWeight: 900, color: '#fbbf24', textShadow: '0 0 32px #f59e0b,0 0 64px #d97706' }}>✨ DREAM MASTERED</div>
      <div style={{ fontSize: 13, color: '#d4a044', lineHeight: 1.8, maxWidth: 320 }}>
        You defeated the Dream Destroyer and shattered the eternal dream. The Awakening is complete. You are free.
      </div>
      <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 2.1 }}>
        <div>Enemies defeated: <span style={{ color: '#fbbf24' }}>{totalWon}</span></div>
        <div>Level reached: <span style={{ color: '#c084fc' }}>{player.lvl}</span></div>
        <div>Final score: <span style={{ color: '#4ade80', fontWeight: 700 }}>{score}</span></div>
      </div>
      {btn('🌙 Dream Again', startGame, '#d97706', false, { padding: '12px 32px', fontSize: 14 })}
    </div>
  );

  // ── VENDOR ────────────────────────────────────────────────────────────────
  if (phase === 'vendor') return (
    <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24' }}>💫 Dream Vendor</div>
        <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>✨ {player.shards} Shards</div>
      </div>
      <div style={{ fontSize: 11, color: '#64748b' }}>Spend Dream Shards to upgrade your dreamer.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {([
          { id: 'hp'  as const, label: '❤️ Max HP +30',  cost: 3, color: '#15803d', sub: `Now: ${player.maxHP}` },
          { id: 'dp'  as const, label: '💜 Max DP +20',  cost: 2, color: '#6d28d9', sub: `Now: ${player.maxDP}` },
          { id: 'atk' as const, label: '⚔️ ATK +8',      cost: 4, color: '#92400e', sub: `Now: ${player.atk}`  },
          { id: 'def' as const, label: '🛡️ DEF +3',     cost: 3, color: '#1d4ed8', sub: `Now: ${player.def}`  },
        ] as const).map(item => (
          <button
            key={item.id}
            onClick={() => handleBuy(item.id)}
            disabled={player.shards < item.cost}
            style={{
              background: player.shards < item.cost ? '#1f2937' : item.color,
              color: '#fff', border: 'none', borderRadius: 8, padding: 12,
              cursor: player.shards < item.cost ? 'default' : 'pointer',
              opacity: player.shards < item.cost ? 0.45 : 1,
              fontWeight: 700, fontSize: 12, textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            <span>{item.label}</span>
            <span style={{ fontSize: 10, opacity: 0.75 }}>{item.sub}</span>
            <span style={{ fontSize: 11, color: '#fde68a' }}>Cost: {item.cost} Shards</span>
          </button>
        ))}
      </div>
      {logPanel(3)}
      {btn('← Back to ' + LAYER_INFO[layerIdx].name, () => setPhase('explore'), '#374151', false, { marginTop: 'auto' })}
    </div>
  );

  // ── BATTLE ────────────────────────────────────────────────────────────────
  if (phase === 'battle') return (
    <div style={{ background: '#0a0f1e', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Canvas + damage number overlay */}
      <div style={{ position: 'relative', transform: `translateX(${shakeX}px)`, transition: 'transform 0.04s' }}>
        <canvas ref={canvasRef} width={CW} height={CH} style={{ display: 'block', width: '100%', maxWidth: CW }} />
        {/* Level-up banner */}
        {lvlUpMsg && (
          <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(250,204,21,0.96)', color: '#1a1000', padding: '10px 22px', borderRadius: 10, fontWeight: 900, fontSize: 13, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10 }}>
            {lvlUpMsg}
          </div>
        )}
        {/* DOM damage numbers */}
        {dmgNums.map(dn => {
          const pct = (dn.x / CW) * 100;
          const pctY = (dn.y / CH) * 100;
          return (
            <div key={dn.id} style={{ position: 'absolute', left: `${pct}%`, top: `${pctY}%`, transform: 'translateX(-50%)', color: dn.color, fontWeight: 900, fontSize: 20, textShadow: `0 0 8px ${dn.color}`, pointerEvents: 'none', zIndex: 9, lineHeight: 1 }}>
              {dn.text}
            </div>
          );
        })}
      </div>

      {/* Battle log */}
      <div style={{ background: '#060d1a', padding: '8px 12px', minHeight: 66, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {log.slice(-4).map((l, i) => <div key={i} style={{ fontSize: 11, color: l.color, lineHeight: 1.5 }}>{l.text}</div>)}
      </div>

      {/* Actions */}
      <div style={{ padding: '10px 12px', background: '#0a0f1e', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Basic actions */}
        <div style={{ display: 'flex', gap: 7 }}>
          {btn('⚔️ Attack', handleAttack, '#dc2626', false, { flex: '1' })}
          {btn(`🧪 Elixir (${player.hpPotions})`, () => handleItem('hp'), '#15803d', player.hpPotions <= 0, { flex: '1' })}
          {btn(`💎 Crystal (${player.dpPotions})`, () => handleItem('dp'), '#6d28d9', player.dpPotions <= 0, { flex: '1' })}
          {btn('🏃 Flee', handleFlee, '#374151', false, { flex: '1' })}
        </div>
        {/* Dream abilities */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {unlockedAbilities.map(a => (
            <button
              key={a.name}
              onClick={() => handleAbility(a)}
              disabled={player.dp < a.dpCost}
              title={`${a.desc} · ${a.dpCost} DP`}
              style={{
                background: player.dp < a.dpCost ? '#1f2937' : a.color,
                color: '#fff', border: 'none', borderRadius: 7, padding: '7px 10px',
                cursor: player.dp < a.dpCost ? 'default' : 'pointer',
                fontWeight: 700, fontSize: 11,
                opacity: player.dp < a.dpCost ? 0.4 : 1,
              }}
            >
              {a.emoji} {a.name} <span style={{ opacity: 0.7, fontSize: 10 }}>({a.dpCost}DP)</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── EXPLORE ───────────────────────────────────────────────────────────────
  const layer = LAYER_INFO[layerIdx];
  const canDescend = battlesWon >= 3;
  const isFinalLayer = layerIdx >= LAYER_INFO.length - 1;

  return (
    <div style={{ background: 'linear-gradient(180deg,#0f172a,#0a1628)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 13, minHeight: 480 }}>
      {/* Layer header */}
      <div style={{ background: 'linear-gradient(90deg,#0a1628,#1e3a5f)', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#7dd3fc' }}>Layer {layerIdx + 1}: {layer.name}</div>
          <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>{battlesWon}/3 battles {canDescend ? '✅' : ''}</div>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7, fontStyle: 'italic' }}>{layer.flavor}</div>
      </div>

      {/* Player stats */}
      <div style={{ background: '#0f172a', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{ color: '#7dd3fc', fontWeight: 700, fontSize: 13 }}>🌙 Dreamer LV {player.lvl}</span>
          <span style={{ color: '#fbbf24', fontSize: 12 }}>✨ {player.shards} Shards</span>
        </div>
        {bar(player.hp, player.maxHP, hpColor(player.hp, player.maxHP))}
        <div style={{ fontSize: 10, color: '#6b7280' }}>❤️ HP {player.hp}/{player.maxHP}</div>
        {bar(player.dp, player.maxDP, '#818cf8')}
        <div style={{ fontSize: 10, color: '#6b7280' }}>💜 DP {player.dp}/{player.maxDP}</div>
        {bar(player.xp, player.xpNext, '#fbbf24')}
        <div style={{ fontSize: 10, color: '#6b7280' }}>
          ⭐ XP {player.xp}/{player.xpNext} · ⚔️ {player.atk} ATK · 🛡️ {player.def} DEF · 🧪×{player.hpPotions} 💎×{player.dpPotions}
        </div>
      </div>

      {/* Log */}
      {logPanel(3)}

      {/* Unlocked abilities */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {unlockedAbilities.map(a => (
          <div key={a.name} style={{ background: '#0f172a', border: `1px solid ${a.color}44`, borderRadius: 6, padding: '4px 9px', fontSize: 10, color: a.color }}>
            {a.emoji} {a.name} · {a.dpCost}DP
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
        {btn(`🌀 Explore ${layer.name}`, handleExplore, '#1d4ed8', false, { padding: '13px', fontSize: 14, textAlign: 'center' as const })}
        <div style={{ display: 'flex', gap: 8 }}>
          {btn('💫 Dream Vendor', () => setPhase('vendor'), '#92400e', false, { flex: '1' })}
          <button
            onClick={canDescend ? handleDescend : undefined}
            style={{
              flex: 1, background: !canDescend ? '#1f2937' : isFinalLayer ? '#b45309' : '#6d28d9',
              color: '#fff', border: 'none', borderRadius: 8, padding: '9px 12px',
              cursor: canDescend ? 'pointer' : 'default', fontWeight: 700, fontSize: 12,
              opacity: canDescend ? 1 : 0.45, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}
          >
            <span>{isFinalLayer ? '⚠️ Face The Awakening' : '↓ Descend Deeper'}</span>
            {!canDescend && <span style={{ fontSize: 10 }}>{3 - battlesWon} battle(s) needed</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

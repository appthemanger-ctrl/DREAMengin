'use client';
/**
 * RPGGame — Simple turn-based RPG adventure.
 * Category: RPG / adventure
 */
import { useCallback, useEffect, useState } from 'react';
import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';

type Phase = 'menu' | 'explore' | 'battle' | 'shop' | 'gameover' | 'win';

interface Stats { hp: number; maxHp: number; attack: number; defense: number; level: number; xp: number; xpNext: number; gold: number; }
interface Enemy { name: string; hp: number; maxHp: number; attack: number; defense: number; xp: number; gold: number; emoji: string; }
interface BattleLog { text: string; color: string; }

const ENEMIES: Enemy[] = [
  { name: 'Goblin', hp: 30, maxHp: 30, attack: 5, defense: 1, xp: 20, gold: 8, emoji: '👺' },
  { name: 'Skeleton', hp: 45, maxHp: 45, attack: 8, defense: 2, xp: 30, gold: 12, emoji: '💀' },
  { name: 'Dark Knight', hp: 80, maxHp: 80, attack: 14, defense: 5, xp: 60, gold: 25, emoji: '⚔️' },
  { name: 'Dragon', hp: 150, maxHp: 150, attack: 22, defense: 8, xp: 120, gold: 60, emoji: '🐉' },
];

const StatBar = ({ val, max, color }: { val: number; max: number; color: string }) => (
  <div style={{ height: 6, background: '#374151', borderRadius: 3 }}>
    <div style={{ height: 6, width: `${(val/max)*100}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
  </div>
);

const EVENTS = [
  'You find a treasure chest! (+15 gold)',
  'A wandering merchant sells you a health potion! (-10 gold, +30 HP)',
  'You discover an ancient rune. (+5 XP)',
  'A pack of wolves attacks!',
  'You rest at a campfire. (+20 HP)',
  'Bandits ambush you!',
  'A fairy blesses you! (+1 Attack)',
];

const BASE: Stats = { hp: 80, maxHp: 80, attack: 12, defense: 4, level: 1, xp: 0, xpNext: 50, gold: 50 };

function levelUp(s: Stats): Stats {
  if (s.xp < s.xpNext) return s;
  return { ...s, level: s.level + 1, xp: s.xp - s.xpNext, xpNext: Math.floor(s.xpNext * 1.6), maxHp: s.maxHp + 20, hp: s.maxHp + 20, attack: s.attack + 3, defense: s.defense + 1 };
}

export default function RPGGame() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [stats, setStats] = useState<Stats>({ ...BASE });
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [log, setLog] = useState<BattleLog[]>([]);
  const [area, setArea] = useState(0);
  const [victories, setVictories] = useState(0);
  const submitScore = useSubmitScore('rpg');
  useEffect(() => {
    if (phase === 'win' || phase === 'gameover')
      submitScore(victories * 1000 + stats.level * 100, stats.level);
  }, [phase, victories, stats.level, submitScore]);

  const addLog = (text: string, color = '#e5e7eb') => setLog(l => [...l.slice(-5), { text, color }]);

  const startGame = useCallback(() => {
    setStats({ ...BASE }); setArea(0); setVictories(0); setLog([]); setEnemy(null);
    setPhase('explore');
  }, []);
  useGameAutoStart(phase === 'menu' ? startGame : null);

  const explore = useCallback(() => {
    const eventIdx = Math.floor(Math.random() * EVENTS.length);
    const event = EVENTS[eventIdx];

    if (event.includes('attacks') || event.includes('ambush')) {
      const enemyIdx = Math.min(Math.floor(Math.random() * (area + 2)), ENEMIES.length - 1);
      const e = { ...ENEMIES[enemyIdx] };
      e.hp = e.maxHp + area * 15; e.maxHp = e.hp; e.attack += area * 3; e.gold += area * 5;
      setEnemy(e); setLog([]); addLog(`⚔️ ${e.name} appears!`, '#f87171'); setPhase('battle');
    } else {
      let s = { ...stats };
      if (event.includes('gold')) { s.gold += 15; addLog('💰 Found 15 gold!', '#facc15'); }
      if (event.includes('potion')) { if (s.gold >= 10) { s.hp = Math.min(s.maxHp, s.hp + 30); s.gold -= 10; addLog('🧪 HP restored +30', '#86efac'); } else addLog('Not enough gold...', '#6b7280'); }
      if (event.includes('rune')) { s.xp += 5; s = levelUp(s); addLog('✨ +5 XP', '#a78bfa'); }
      if (event.includes('campfire')) { s.hp = Math.min(s.maxHp, s.hp + 20); addLog('🔥 Rested, +20 HP', '#f97316'); }
      if (event.includes('fairy')) { s.attack++; addLog('🧚 +1 Attack!', '#f0abfc'); }
      setStats(s);
    }
  }, [area, stats]);

  const attack = useCallback(() => {
    if (!enemy) return;
    let s = { ...stats }; const e = { ...enemy };
    // Player attacks
    const dmg = Math.max(1, s.attack - e.defense + Math.floor(Math.random() * 5));
    e.hp = Math.max(0, e.hp - dmg);
    addLog(`⚔️ You deal ${dmg} damage`, '#86efac');
    if (e.hp <= 0) {
      s.xp += e.xp; s.gold += e.gold; s = levelUp(s);
      addLog(`🏆 ${e.name} defeated! +${e.xp} XP, +${e.gold}💰`, '#facc15');
      const newV = victories + 1;
      setVictories(newV);
      if (newV >= 10) { setStats(s); setPhase('win'); return; }
      if (newV % 3 === 0) setArea(a => a + 1);
      setStats(s); setEnemy(null); setPhase('explore'); return;
    }
    // Enemy attacks
    const eDmg = Math.max(1, e.attack - s.defense + Math.floor(Math.random() * 4));
    s.hp = Math.max(0, s.hp - eDmg);
    addLog(`💥 ${e.name} deals ${eDmg} damage`, '#f87171');
    if (s.hp <= 0) { setStats(s); setPhase('gameover'); return; }
    setStats(s); setEnemy(e);
  }, [enemy, stats, victories]);

  const flee = useCallback(() => {
    if (Math.random() < 0.5) { addLog('💨 Escaped!', '#a78bfa'); setEnemy(null); setPhase('explore'); }
    else { const dmg = Math.max(1, (enemy?.attack ?? 5) - stats.defense); const s = { ...stats, hp: Math.max(0, stats.hp - dmg) }; addLog(`Failed to flee! -${dmg} HP`, '#f87171'); if (s.hp <= 0) { setStats(s); setPhase('gameover'); } else setStats(s); }
  }, [enemy, stats]);

  const openShop = useCallback(() => setPhase('shop'), []);
  const buyHeal = useCallback(() => { if (stats.gold >= 20) setStats(s => ({ ...s, hp: Math.min(s.maxHp, s.hp + 40), gold: s.gold - 20 })); }, [stats.gold]);
  const buyAttack = useCallback(() => { if (stats.gold >= 40) setStats(s => ({ ...s, attack: s.attack + 5, gold: s.gold - 40 })); }, [stats.gold]);

  const HP_COLOR = (hp: number, max: number) => hp / max > 0.5 ? '#22c55e' : hp / max > 0.25 ? '#f59e0b' : '#ef4444';

  if (phase === 'menu') return (
    <div style={{ background: '#1a0a2e', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#c084fc' }}>⚔️ DREAMENGIN RPG</div>
      <div style={{ fontSize: 12, color: '#a78bfa', maxWidth: 300, lineHeight: 1.6 }}>Explore, battle monsters, level up. Defeat 10 enemies to win!</div>
      <button onClick={startGame} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Begin Adventure</button>
    </div>
  );

  if (phase === 'gameover') return (
    <div style={{ background: '#1a0a2e', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 28, color: '#f87171', fontWeight: 900 }}>💀 You Died</div>
      <div style={{ fontSize: 14, color: '#a78bfa' }}>Enemies defeated: {victories} · Level: {stats.level}</div>
      <button onClick={startGame} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Try Again</button>
    </div>
  );

  if (phase === 'win') return (
    <div style={{ background: '#1a0a2e', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 28, color: '#4ade80', fontWeight: 900 }}>🏆 VICTORY!</div>
      <div style={{ fontSize: 14, color: '#a78bfa' }}>10 monsters defeated! Level {stats.level} · {stats.gold} gold</div>
      <button onClick={startGame} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>New Adventure</button>
    </div>
  );

  if (phase === 'shop') return (
    <div style={{ background: '#1a0a2e', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#c084fc' }}>🏪 Merchant Shop · 💰 {stats.gold}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={buyHeal} disabled={stats.gold < 20} style={{ background: stats.gold >= 20 ? '#14532d' : '#374151', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: stats.gold >= 20 ? 'pointer' : 'default', opacity: stats.gold < 20 ? 0.5 : 1, textAlign: 'left' }}>
          🧪 Health Potion (+40 HP) — 20 gold
        </button>
        <button onClick={buyAttack} disabled={stats.gold < 40} style={{ background: stats.gold >= 40 ? '#1d4ed8' : '#374151', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: stats.gold >= 40 ? 'pointer' : 'default', opacity: stats.gold < 40 ? 0.5 : 1, textAlign: 'left' }}>
          ⚔️ Weapon Upgrade (+5 Attack) — 40 gold
        </button>
      </div>
      <button onClick={() => setPhase('explore')} style={{ background: '#374151', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>← Back to Adventure</button>
    </div>
  );

  return (
    <div style={{ background: '#1a0a2e', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Player stats */}
      <div style={{ background: '#2d1b69', borderRadius: 8, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#c084fc', fontWeight: 700, fontSize: 13 }}>⚔️ Hero Lv.{stats.level}</span>
          <span style={{ color: '#facc15', fontSize: 12 }}>💰 {stats.gold} · {victories}/10 kills</span>
        </div>
        <StatBar val={stats.hp} max={stats.maxHp} color={HP_COLOR(stats.hp, stats.maxHp)} />
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>HP {stats.hp}/{stats.maxHp}</div>
        <StatBar val={stats.xp} max={stats.xpNext} color='#818cf8' />
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>XP {stats.xp}/{stats.xpNext} · ATK {stats.attack} · DEF {stats.defense}</div>
      </div>

      {/* Battle */}
      {phase === 'battle' && enemy && (
        <div style={{ background: '#3b0a1e', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 36 }}>{enemy.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#f87171', fontWeight: 700, fontSize: 14 }}>{enemy.name}</div>
              <StatBar val={enemy.hp} max={enemy.maxHp} color='#ef4444' />
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>HP {enemy.hp}/{enemy.maxHp} · ATK {enemy.attack}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={attack} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>⚔️ Attack</button>
            <button onClick={flee} style={{ flex: 1, background: '#374151', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>💨 Flee</button>
          </div>
        </div>
      )}

      {/* Battle log */}
      {log.length > 0 && (
        <div style={{ background: '#0c1445', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {log.slice(-4).map((l, i) => <div key={i} style={{ fontSize: 11, color: l.color }}>{l.text}</div>)}
        </div>
      )}

      {/* Explore */}
      {phase === 'explore' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={explore} style={{ flex: 1, background: '#7c3aed', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            🗺️ Explore Area {area + 1}
          </button>
          <button onClick={openShop} style={{ background: '#374151', color: '#fff', border: 'none', padding: '12px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>🏪</button>
        </div>
      )}
    </div>
  );
}

'use client';

/**
 * DREAMwars — Dream-themed RTS
 * Dreamers (player · blue/gold) vs Nightmares (AI · purple/red)
 *
 * Mechanics : base building · Dream Energy harvesting · unit combat
 * Rendering : Canvas 2D only (no Babylon.js)
 * HUD       : React state overlay
 */

import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useSubmitScore } from '@/lib/games/hooks';

// ── Layout ────────────────────────────────────────────────────────────────────
const CW = 800, CH = 576, T = 32, COLS = 25, ROWS = 18;
const MM_X = CW - 108, MM_Y = CH - 80, MM_W = 100, MM_H = 72;

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase        = 'menu' | 'playing' | 'win' | 'lose';
type Faction      = 'dreamers' | 'nightmares';
type UnitType     = 'walker' | 'tank' | 'harvester';
type BuildingType = 'core' | 'barracks' | 'factory' | 'refinery';

interface V2 { x: number; y: number }

interface Unit {
  id: number; type: UnitType; faction: Faction; pos: V2;
  hp: number; maxHp: number;
  moveTarget: V2 | null; attackTarget: number | null;
  cooldown: number; carryEnergy: number;
}

interface Building {
  id: number; type: BuildingType; faction: Faction; pos: V2;
  hp: number; maxHp: number; trainTimer: number; trainType: UnitType | null;
}

interface ResNode { x: number; y: number; amount: number }
interface Boom    { x: number; y: number; r: number; life: number }

interface GS {
  units: Unit[]; buildings: Building[]; resources: ResNode[];
  energy: Record<Faction, number>; selected: number[];
  booms: Boom[]; aiSpawn: number; aiAttack: number; tick: number;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const US: Record<UnitType, { hp: number; spd: number; dmg: number; rng: number; cost: number; cd: number }> = {
  walker:    { hp: 50,  spd: 1.2, dmg: 8,  rng: 2.5, cost: 100, cd: 1.2 },
  tank:      { hp: 120, spd: 0.7, dmg: 30, rng: 3.0, cost: 350, cd: 1.8 },
  harvester: { hp: 60,  spd: 0.9, dmg: 0,  rng: 0,   cost: 150, cd: 0   },
};

const BS: Record<BuildingType, { hp: number; cost: number; w: number; h: number; tt: number }> = {
  core:     { hp: 500, cost: 0,   w: 3, h: 3, tt: 0  },
  barracks: { hp: 200, cost: 250, w: 2, h: 2, tt: 6  },
  factory:  { hp: 250, cost: 400, w: 3, h: 2, tt: 10 },
  refinery: { hp: 200, cost: 200, w: 2, h: 2, tt: 8  },
};

// ── Labels ────────────────────────────────────────────────────────────────────
const DR_BL: Record<BuildingType, string> = {
  core: 'Dream Core', barracks: 'Dream Barracks', factory: 'Dream Factory', refinery: 'Dream Refinery',
};
const NM_BL: Record<BuildingType, string> = {
  core: 'Nightmare Spire', barracks: 'Dark Barracks', factory: 'Shadow Factory', refinery: 'Void Refinery',
};
const DR_UL: Record<UnitType, string> = { walker: 'Dream Walker', tank: 'Dream Tank', harvester: 'Dream Harvester' };
const NM_UL: Record<UnitType, string> = { walker: 'Night Walker', tank: 'Nightmare Tank', harvester: 'Shadow Harvester' };

// ── Colors ────────────────────────────────────────────────────────────────────
const FC = {
  dreamers:   { bg: '#0c2340', border: '#38bdf8', unit: '#7dd3fc', bar: '#0ea5e9'  },
  nightmares: { bg: '#1a0822', border: '#a855f7', unit: '#c084fc', bar: '#7c3aed' },
};
const TILES = ['#0d1b2a', '#111827', '#0f172a', '#131d30'];

// Building placement offsets (relative to player Dream Core top-left)
const BUILD_OFFSETS: Record<BuildingType, V2> = {
  core:     { x: 0, y: 0 },
  barracks: { x: 5, y: 0 },
  factory:  { x: 5, y: 3 },
  refinery: { x: 0, y: 4 },
};

// ── Pure helpers ──────────────────────────────────────────────────────────────
let _id = 1;
const uid    = () => _id++;
const dist   = (a: V2, b: V2) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp  = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const toward = (pos: V2, tgt: V2, spd: number): V2 => {
  const d = dist(pos, tgt);
  if (d <= spd) return { ...tgt };
  return { x: pos.x + (tgt.x - pos.x) * spd / d, y: pos.y + (tgt.y - pos.y) * spd / d };
};

/** Grid-centre of a building */
const bc = (b: Building): V2 => ({ x: b.pos.x + BS[b.type].w / 2, y: b.pos.y + BS[b.type].h / 2 });

const mkUnit = (type: UnitType, faction: Faction, pos: V2): Unit => ({
  id: uid(), type, faction, pos: { ...pos },
  hp: US[type].hp, maxHp: US[type].hp,
  moveTarget: null, attackTarget: null, cooldown: 0, carryEnergy: 0,
});

const mkBuilding = (type: BuildingType, faction: Faction, pos: V2): Building => ({
  id: uid(), type, faction, pos: { ...pos },
  hp: BS[type].hp, maxHp: BS[type].hp, trainTimer: 0, trainType: null,
});

// ── Initial game state ────────────────────────────────────────────────────────
function initState(): GS {
  _id = 1;
  return {
    buildings: [
      // Dreamers – top-left
      mkBuilding('core',     'dreamers',   { x: 1,  y: 2  }),
      mkBuilding('barracks', 'dreamers',   { x: 5,  y: 2  }),
      mkBuilding('refinery', 'dreamers',   { x: 1,  y: 6  }),
      // Nightmares – bottom-right
      mkBuilding('core',     'nightmares', { x: 20, y: 13 }),
      mkBuilding('barracks', 'nightmares', { x: 16, y: 13 }),
      mkBuilding('factory',  'nightmares', { x: 20, y: 10 }),
      mkBuilding('refinery', 'nightmares', { x: 16, y: 10 }),
    ],
    units: [
      mkUnit('walker',    'dreamers',   { x: 4, y: 5 }),
      mkUnit('walker',    'dreamers',   { x: 5, y: 5 }),
      mkUnit('walker',    'dreamers',   { x: 6, y: 5 }),
      mkUnit('harvester', 'dreamers',   { x: 3, y: 4 }),
      mkUnit('walker',    'nightmares', { x: 19, y: 12 }),
      mkUnit('walker',    'nightmares', { x: 20, y: 12 }),
      mkUnit('harvester', 'nightmares', { x: 21, y: 12 }),
    ],
    resources: [
      { x: 9,  y: 2,  amount: 800 }, { x: 10, y: 2,  amount: 600 },
      { x: 9,  y: 3,  amount: 700 }, { x: 10, y: 3,  amount: 500 },
      { x: 6,  y: 9,  amount: 600 }, { x: 7,  y: 9,  amount: 700 },
      { x: 14, y: 7,  amount: 800 }, { x: 15, y: 7,  amount: 600 },
      { x: 12, y: 13, amount: 700 }, { x: 13, y: 13, amount: 500 },
      { x: 3,  y: 11, amount: 600 }, { x: 4,  y: 11, amount: 400 },
    ],
    energy:   { dreamers: 300, nightmares: 800 },
    selected: [], booms: [], aiSpawn: 8, aiAttack: 22, tick: 0,
  };
}

// ── Step: harvester ───────────────────────────────────────────────────────────
function stepHarvester(gs: GS, u: Unit, dt: number): void {
  const MAX = 100;
  if (u.carryEnergy < MAX) {
    // Seek nearest resource with remaining energy
    let nr: ResNode | null = null, nd = Infinity;
    for (const r of gs.resources) {
      if (r.amount <= 0) continue;
      const d = dist(u.pos, { x: r.x + 0.5, y: r.y + 0.5 });
      if (d < nd) { nd = d; nr = r; }
    }
    if (nr) {
      if (nd < 0.8) {
        const take = Math.min(dt * 25, nr.amount, MAX - u.carryEnergy);
        nr.amount -= take; u.carryEnergy += take;
      } else {
        u.pos = toward(u.pos, { x: nr.x + 0.5, y: nr.y + 0.5 }, US.harvester.spd * dt);
      }
    }
  } else {
    // Return to own refinery
    const ref = gs.buildings.find(b => b.faction === u.faction && b.type === 'refinery' && b.hp > 0);
    if (ref) {
      const t = bc(ref);
      if (dist(u.pos, t) < 1.5) {
        gs.energy[u.faction] = Math.min(9999, gs.energy[u.faction] + u.carryEnergy);
        u.carryEnergy = 0;
      } else {
        u.pos = toward(u.pos, t, US.harvester.spd * dt);
      }
    }
  }
}

// ── Step: combat unit ─────────────────────────────────────────────────────────
function stepCombat(gs: GS, u: Unit, dt: number): void {
  const s = US[u.type];
  const enemy: Faction = u.faction === 'dreamers' ? 'nightmares' : 'dreamers';

  // Resolve explicit attack order
  if (u.attackTarget !== null) {
    const tu = gs.units.find(e => e.id === u.attackTarget && e.hp > 0);
    const tb = gs.buildings.find(b => b.id === u.attackTarget && b.hp > 0);
    const tpos = tu ? tu.pos : tb ? bc(tb) : null;
    if (!tpos) {
      u.attackTarget = null;
    } else {
      if (dist(u.pos, tpos) <= s.rng) {
        if (u.cooldown <= 0) {
          u.cooldown = s.cd;
          if (tu) {
            tu.hp -= s.dmg;
            gs.booms.push({ x: tu.pos.x * T + T / 2, y: tu.pos.y * T + T / 2, r: 6,  life: 0.45 });
          } else if (tb) {
            tb.hp -= s.dmg;
            gs.booms.push({ x: bc(tb).x * T,          y: bc(tb).y * T,          r: 14, life: 0.45 });
          }
        }
        return; // hold position
      }
      u.pos = toward(u.pos, tpos, s.spd * dt);
      return;
    }
  }

  // Auto-attack: nearest enemy entity within weapon range
  if (u.cooldown <= 0) {
    let best: { id: number; pos: V2; d: number } | null = null;

    for (const e of gs.units) {
      if (e.faction !== enemy || e.hp <= 0) continue;
      const d = dist(u.pos, e.pos);
      if (d <= s.rng && (!best || d < best.d)) best = { id: e.id, pos: e.pos, d };
    }
    if (!best) {
      for (const b of gs.buildings) {
        if (b.faction !== enemy || b.hp <= 0) continue;
        const c = bc(b); const d = dist(u.pos, c);
        if (d <= s.rng && (!best || d < best.d)) best = { id: b.id, pos: c, d };
      }
    }
    if (best) {
      u.cooldown = s.cd;
      const tu = gs.units.find(e => e.id === best!.id);
      const tb = gs.buildings.find(b => b.id === best!.id);
      if (tu) {
        tu.hp -= s.dmg;
        gs.booms.push({ x: best.pos.x * T + T / 2, y: best.pos.y * T + T / 2, r: 6,  life: 0.4 });
      } else if (tb) {
        tb.hp -= s.dmg;
        gs.booms.push({ x: best.pos.x * T,          y: best.pos.y * T,          r: 14, life: 0.4 });
      }
    }
  }

  // Walk to move-to order
  if (u.moveTarget) {
    if (dist(u.pos, u.moveTarget) < 0.4) u.moveTarget = null;
    else u.pos = toward(u.pos, u.moveTarget, s.spd * dt);
  }
}

// ── Step: AI (Nightmares) ─────────────────────────────────────────────────────
function stepAI(gs: GS, dt: number): void {
  gs.aiSpawn  -= dt;
  gs.aiAttack -= dt;

  // Periodic spawn
  if (gs.aiSpawn <= 0) {
    gs.aiSpawn = 7 + Math.random() * 5;
    const idle = (t: BuildingType) =>
      gs.buildings.find(b => b.faction === 'nightmares' && b.type === t && b.hp > 0 && b.trainTimer <= 0);
    const harv = gs.units.filter(u => u.faction === 'nightmares' && u.type === 'harvester').length;
    const fac = idle('factory'), bar = idle('barracks'), ref = idle('refinery');
    const e = gs.energy.nightmares;
    if (ref && harv < 3 && e >= 150) {
      gs.energy.nightmares -= 150; ref.trainTimer = 8;  ref.trainType = 'harvester';
    } else if (fac && e >= 350) {
      gs.energy.nightmares -= 350; fac.trainTimer = 10; fac.trainType = 'tank';
    } else if (bar && e >= 100) {
      gs.energy.nightmares -= 100; bar.trainTimer = 6;  bar.trainType = 'walker';
    }
  }

  // Periodic attack wave: send all fighters toward Dreamer Core
  if (gs.aiAttack <= 0) {
    gs.aiAttack = 16 + Math.random() * 8;
    const dcore = gs.buildings.find(b => b.faction === 'dreamers' && b.type === 'core');
    if (dcore) {
      const c = bc(dcore);
      for (const u of gs.units) {
        if (u.faction === 'nightmares' && u.type !== 'harvester') {
          u.attackTarget = dcore.id;
          u.moveTarget   = c;
        }
      }
    }
  }
}

// ── stepGame ──────────────────────────────────────────────────────────────────
function stepGame(gs: GS, dt: number): void {
  gs.tick++;

  // Decay explosions
  for (let i = gs.booms.length - 1; i >= 0; i--) {
    gs.booms[i].life -= dt;
    gs.booms[i].r    += dt * 18;
    if (gs.booms[i].life <= 0) gs.booms.splice(i, 1);
  }

  // Building train timers
  for (const b of gs.buildings) {
    if (b.trainTimer > 0) {
      b.trainTimer -= dt;
      if (b.trainTimer <= 0 && b.trainType) {
        const sp: V2 = {
          x: clamp(bc(b).x + (Math.random() - 0.5) * 3, 0, COLS - 1),
          y: clamp(bc(b).y + (Math.random() - 0.5) * 3, 0, ROWS - 1),
        };
        gs.units.push(mkUnit(b.trainType, b.faction, sp));
        b.trainTimer = 0; b.trainType = null;
      }
    }
  }

  stepAI(gs, dt);

  // Tick all units
  for (const u of gs.units) {
    if (u.cooldown > 0) u.cooldown -= dt;
    if (u.type === 'harvester') stepHarvester(gs, u, dt);
    else                        stepCombat(gs, u, dt);
    u.pos.x = clamp(u.pos.x, 0, COLS - 1);
    u.pos.y = clamp(u.pos.y, 0, ROWS - 1);
  }

  // Death explosions
  for (const u of gs.units)
    if (u.hp <= 0)  gs.booms.push({ x: u.pos.x * T + T / 2, y: u.pos.y * T + T / 2, r: 8,  life: 0.6 });
  for (const b of gs.buildings)
    if (b.hp <= 0)  gs.booms.push({ x: bc(b).x * T,          y: bc(b).y * T,          r: 22, life: 0.9 });

  // Remove dead entities
  gs.units     = gs.units.filter(u => u.hp > 0);
  gs.buildings = gs.buildings.filter(b => b.hp > 0);
  gs.selected  = gs.selected.filter(id =>
    gs.units.some(u => u.id === id) || gs.buildings.some(b => b.id === id),
  );

  // Clear stale attack targets
  for (const u of gs.units) {
    if (
      u.attackTarget !== null &&
      !gs.units.some(e => e.id === u.attackTarget) &&
      !gs.buildings.some(b => b.id === u.attackTarget)
    ) u.attackTarget = null;
  }
}

// ── drawGame ──────────────────────────────────────────────────────────────────
function drawGame(ctx: CanvasRenderingContext2D, gs: GS): void {
  // Tile grid
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = TILES[(r + c) % 4];
      ctx.fillRect(c * T, r * T, T, T);
    }

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth   = 0.5;
  for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * T, 0);  ctx.lineTo(c * T, CH); ctx.stroke(); }
  for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * T);  ctx.lineTo(CW, r * T); ctx.stroke(); }

  // Resource nodes — golden glow
  for (const r of gs.resources) {
    if (r.amount <= 0) continue;
    const cx = r.x * T + T / 2, cy = r.y * T + T / 2;
    const g  = ctx.createRadialGradient(cx, cy, 2, cx, cy, T / 2);
    g.addColorStop(0, 'rgba(251,191,36,0.85)');
    g.addColorStop(1, 'rgba(245,158,11,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, T / 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
  }

  // Buildings
  for (const b of gs.buildings) {
    const { w, h, tt } = BS[b.type];
    const bx = b.pos.x * T, by = b.pos.y * T, bw = w * T, bh = h * T;
    const c   = FC[b.faction];
    const sel = gs.selected.includes(b.id);

    if (sel) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
      ctx.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);
    }

    ctx.fillStyle   = c.bg;     ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = c.border; ctx.lineWidth = sel ? 2 : 1.5;
    ctx.strokeRect(bx, by, bw, bh);

    // Icon
    const icon = b.type === 'core' ? '◆' : b.type === 'barracks' ? '⚔' : b.type === 'factory' ? '⚙' : '⛏';
    ctx.fillStyle   = c.border;
    ctx.font        = `${h >= 3 ? 16 : 13}px sans-serif`;
    ctx.textAlign   = 'center';
    ctx.fillText(icon, bx + bw / 2, by + bh / 2 + 5);
    ctx.textAlign   = 'left';

    // Train progress bar
    if (b.trainTimer > 0 && tt > 0) {
      const p = 1 - b.trainTimer / tt;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx, by + bh - 5, bw,     4);
      ctx.fillStyle = c.bar;              ctx.fillRect(bx, by + bh - 5, bw * p, 4);
    }

    // HP bar
    const hr = b.hp / b.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, by - 7, bw,      4);
    ctx.fillStyle = hr > 0.5 ? '#22c55e' : hr > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(bx, by - 7, bw * hr, 4);
  }

  // Units
  for (const u of gs.units) {
    const cx = u.pos.x * T + T / 2, cy = u.pos.y * T + T / 2;
    const r   = u.type === 'tank' ? 10 : u.type === 'harvester' ? 7 : 6;
    const c   = FC[u.faction];
    const sel = gs.selected.includes(u.id);

    if (sel) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();
    }

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(cx, cy + r + 1, r * 0.8, 3, 0, 0, Math.PI * 2); ctx.fill();

    // Body
    ctx.fillStyle = c.unit;
    if (u.type === 'tank') {
      ctx.fillRect(cx - r, cy - r * 0.7, r * 2, r * 1.4);
      ctx.fillStyle = c.border; ctx.fillRect(cx - 1.5, cy - r, 3, r * 0.85); // barrel
    } else {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }

    // Harvester carry indicator
    if (u.type === 'harvester' && u.carryEnergy > 0) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(cx + r, cy - r, 3.5, 0, Math.PI * 2); ctx.fill();
    }

    // HP bar
    const hr = u.hp / u.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(cx - r, cy - r - 6, r * 2,      3);
    ctx.fillStyle = hr > 0.5 ? '#22c55e' : '#ef4444';
    ctx.fillRect(cx - r, cy - r - 6, r * 2 * hr, 3);
  }

  // Explosions
  for (const b of gs.booms) {
    const a = Math.min(b.life * 2, 1);
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0,   `rgba(255,220,100,${a})`);
    g.addColorStop(0.5, `rgba(255,80,20,${(a * 0.7).toFixed(2)})`);
    g.addColorStop(1,   'rgba(120,10,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  }

  // ── Minimap ────────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.fillRect(MM_X - 2, MM_Y - 2, MM_W + 4, MM_H + 4);
  ctx.fillStyle = '#060812';           ctx.fillRect(MM_X, MM_Y, MM_W, MM_H);

  const sx = MM_W / COLS, sy = MM_H / ROWS;
  for (const r of gs.resources) {
    if (r.amount <= 0) continue;
    ctx.fillStyle = '#f59e0b'; ctx.fillRect(MM_X + r.x * sx, MM_Y + r.y * sy, sx, sy);
  }
  for (const b of gs.buildings) {
    ctx.fillStyle = b.faction === 'dreamers' ? '#38bdf8' : '#a855f7';
    ctx.fillRect(MM_X + b.pos.x * sx, MM_Y + b.pos.y * sy, BS[b.type].w * sx, BS[b.type].h * sy);
  }
  for (const u of gs.units) {
    ctx.fillStyle = u.faction === 'dreamers' ? '#7dd3fc' : '#c084fc';
    ctx.fillRect(MM_X + u.pos.x * sx, MM_Y + u.pos.y * sy, 2.5, 2.5);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
  ctx.strokeRect(MM_X, MM_Y, MM_W, MM_H);
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('MAP', MM_X + 3, MM_Y + 9);
}

// ── HUD button style ──────────────────────────────────────────────────────────
function btnS(enabled: boolean, accent = '#38bdf8'): CSSProperties {
  return {
    background:  enabled ? `${accent}20` : 'rgba(255,255,255,0.03)',
    color:       enabled ? accent : '#475569',
    border:      `1px solid ${enabled ? `${accent}60` : 'rgba(255,255,255,0.07)'}`,
    padding:     '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
    cursor:      enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.5,
    whiteSpace:  'nowrap',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DREAMwars() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gsRef      = useRef<GS>(initState());
  const phaseRef   = useRef<Phase>('menu');

  const [phase,       setPhaseState] = useState<Phase>('menu');
  const [energy,      setEnergy]     = useState(300);
  const [infoLine,    setInfoLine]   = useState('');
  const [selBldgId,   setSelBldgId]  = useState<number | null>(null);

  const submitScore = useSubmitScore('dreamwars');

  // Keep phaseRef in sync and notify score
  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  useEffect(() => {
    if (phase === 'win')  submitScore(1000);
    if (phase === 'lose') submitScore(200);
  }, [phase, submitScore]);

  // ── Start / restart ────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    _id = 1;
    gsRef.current = initState();
    setEnergy(300); setInfoLine(''); setSelBldgId(null);
    setPhase('playing');
  }, [setPhase]);

  // ── Train a unit from the selected dreamer building ────────────────────────
  const trainUnit = useCallback((type: UnitType) => {
    const gs = gsRef.current;
    const b  = selBldgId !== null
      ? gs.buildings.find(bd => bd.id === selBldgId && bd.faction === 'dreamers')
      : undefined;
    if (!b || b.trainTimer > 0) return;
    const valid =
      (type === 'walker'    && b.type === 'barracks') ||
      (type === 'tank'      && b.type === 'factory')  ||
      (type === 'harvester' && b.type === 'refinery');
    if (!valid) return;
    if (gs.energy.dreamers < US[type].cost) return;
    gs.energy.dreamers -= US[type].cost;
    b.trainTimer = BS[b.type].tt;
    b.trainType  = type;
  }, [selBldgId]);

  // ── Build a new building near the Dream Core ───────────────────────────────
  const buildBuilding = useCallback((type: BuildingType) => {
    const gs = gsRef.current;
    if (gs.energy.dreamers < BS[type].cost) return;
    if (gs.buildings.some(b => b.faction === 'dreamers' && b.type === type)) return;
    const core = gs.buildings.find(b => b.faction === 'dreamers' && b.type === 'core');
    if (!core) return;
    gs.energy.dreamers -= BS[type].cost;
    const off = BUILD_OFFSETS[type];
    gs.buildings.push(mkBuilding(type, 'dreamers', {
      x: clamp(core.pos.x + off.x, 0, COLS - BS[type].w),
      y: clamp(core.pos.y + off.y, 0, ROWS - BS[type].h),
    }));
  }, []);

  // ── Canvas click: select / move / attack ───────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const gs  = gsRef.current;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const gx = ((e.clientX - rect.left) / rect.width)  * CW / T;
    const gy = ((e.clientY - rect.top)  / rect.height) * CH / T;

    // Select own unit
    const clickedUnit = gs.units.find(u =>
      u.faction === 'dreamers' && Math.abs(u.pos.x - gx) < 0.9 && Math.abs(u.pos.y - gy) < 0.9,
    );
    if (clickedUnit) {
      gs.selected = [clickedUnit.id];
      setSelBldgId(null);
      setInfoLine(`${DR_UL[clickedUnit.type]} · HP ${clickedUnit.hp}/${clickedUnit.maxHp}`);
      return;
    }

    // Select own building
    const clickedBldg = gs.buildings.find(b =>
      b.faction === 'dreamers' &&
      gx >= b.pos.x && gx < b.pos.x + BS[b.type].w &&
      gy >= b.pos.y && gy < b.pos.y + BS[b.type].h,
    );
    if (clickedBldg) {
      gs.selected = [clickedBldg.id];
      setSelBldgId(clickedBldg.id);
      setInfoLine(`${DR_BL[clickedBldg.type]} · HP ${clickedBldg.hp}/${clickedBldg.maxHp}`);
      return;
    }

    // Issue orders to selected units
    if (gs.selected.length > 0 && gs.units.some(u => gs.selected.includes(u.id))) {
      const enemyUnit = gs.units.find(u =>
        u.faction === 'nightmares' && Math.abs(u.pos.x - gx) < 0.9 && Math.abs(u.pos.y - gy) < 0.9,
      );
      const enemyBldg = gs.buildings.find(b =>
        b.faction === 'nightmares' &&
        gx >= b.pos.x && gx < b.pos.x + BS[b.type].w &&
        gy >= b.pos.y && gy < b.pos.y + BS[b.type].h,
      );
      for (const id of gs.selected) {
        const u = gs.units.find(u => u.id === id);
        if (!u) continue;
        if (enemyUnit)       { u.attackTarget = enemyUnit.id;  u.moveTarget = null; }
        else if (enemyBldg)  { u.attackTarget = enemyBldg.id;  u.moveTarget = bc(enemyBldg); }
        else                 { u.attackTarget = null;           u.moveTarget = { x: gx, y: gy }; }
      }
      return;
    }

    // Deselect
    gs.selected = []; setSelBldgId(null); setInfoLine('');
  }, []);

  // ── Game loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    let running = true;
    let last    = performance.now();

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      stepGame(gsRef.current, dt);
      drawGame(ctx, gsRef.current);

      // Sync HUD every 20 ticks (~3× per second at 60 fps)
      if (gsRef.current.tick % 20 === 0) {
        const gs = gsRef.current;
        setEnergy(Math.floor(gs.energy.dreamers));

        // Refresh selection info text
        const sid = gs.selected[0];
        if (sid !== undefined) {
          const su = gs.units.find(u => u.id === sid);
          const sb = gs.buildings.find(b => b.id === sid);
          if (su) {
            const carry = su.type === 'harvester' ? ` · D.E. ${Math.floor(su.carryEnergy)}/100` : '';
            const lbl   = su.faction === 'dreamers' ? DR_UL[su.type] : NM_UL[su.type];
            setInfoLine(`${lbl} · HP ${su.hp}/${su.maxHp}${carry}`);
          } else if (sb) {
            const lbl = sb.faction === 'dreamers' ? DR_BL[sb.type] : NM_BL[sb.type];
            const trn = sb.trainTimer > 0 ? ` · Training ${sb.trainType} (${Math.ceil(sb.trainTimer)}s)` : '';
            setInfoLine(`${lbl} · HP ${sb.hp}/${sb.maxHp}${trn}`);
          }
        }

        // Win / lose check
        const dcore = gs.buildings.find(b => b.faction === 'dreamers'   && b.type === 'core');
        const ncore = gs.buildings.find(b => b.faction === 'nightmares' && b.type === 'core');
        if (!ncore)  { running = false; setPhase('win'); }
        if (!dcore)  { running = false; setPhase('lose'); }
      }

      if (running) requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
    return () => { running = false; };
  }, [phase, setPhase]);

  // ── Render-time derived values ─────────────────────────────────────────────
  const gs          = gsRef.current;
  const selBldg     = selBldgId !== null
    ? gs.buildings.find(b => b.id === selBldgId && b.faction === 'dreamers')
    : undefined;
  const hasBarracks = gs.buildings.some(b => b.faction === 'dreamers' && b.type === 'barracks');
  const hasFactory  = gs.buildings.some(b => b.faction === 'dreamers' && b.type === 'factory');
  const hasRefinery = gs.buildings.some(b => b.faction === 'dreamers' && b.type === 'refinery');
  const isTraining  = !!(selBldg && selBldg.trainTimer > 0);
  const drCount     = gs.units.filter(u => u.faction === 'dreamers').length;
  const nmCount     = gs.units.filter(u => u.faction === 'nightmares').length;

  // ── Menu ───────────────────────────────────────────────────────────────────
  if (phase === 'menu') return (
    <div style={{ background: 'linear-gradient(135deg,#08101e,#10031f)', minHeight: 430, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, borderRadius: 16, padding: '44px 36px', fontFamily: "'Space Grotesk',sans-serif" }}>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '0.05em', lineHeight: 1 }}>
          <span style={{ color: '#38bdf8', textShadow: '0 0 36px #38bdf850' }}>DREAM</span>
          <span style={{ color: '#a855f7', textShadow: '0 0 36px #a855f750' }}>wars</span>
        </div>
        <div style={{ fontSize: 10, color: '#334155', marginTop: 6, letterSpacing: '0.14em' }}>
          BASE BUILDING · DREAM ENERGY · UNIT COMBAT
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(56,189,248,0.07)', border: '1.5px solid rgba(56,189,248,0.35)', borderRadius: 12, padding: '20px 22px', maxWidth: 200, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8', marginBottom: 7 }}>✦ Dreamers</div>
          <div style={{ fontSize: 11, color: '#7dd3fc', lineHeight: 1.75 }}>
            Guardians of the Dream Realm. Crystal energy and hope-forged steel defend the waking world against darkness.
          </div>
          <div style={{ marginTop: 10, fontSize: 10, color: '#0ea5e9', fontWeight: 700, letterSpacing: '0.1em' }}>▶ YOU PLAY THIS</div>
        </div>
        <div style={{ background: 'rgba(168,85,247,0.07)', border: '1.5px solid rgba(168,85,247,0.35)', borderRadius: 12, padding: '20px 22px', maxWidth: 200, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#a855f7', marginBottom: 7 }}>☽ Nightmares</div>
          <div style={{ fontSize: 11, color: '#c084fc', lineHeight: 1.75 }}>
            Corruption given form. Shadow factories, dark energy, and relentless hunger consume everything they touch.
          </div>
          <div style={{ marginTop: 10, fontSize: 10, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.1em' }}>◈ AI CONTROLLED</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 520 }}>
        {['Click unit/building → select', 'Click map → move', 'Click enemy → attack', 'Harvesters auto-collect D.E.', 'Build Factory for Tanks', 'Destroy Nightmare Spire to win'].map(t => (
          <span key={t} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: 999, fontSize: 10, color: '#64748b' }}>{t}</span>
        ))}
      </div>

      <button
        onClick={startGame}
        style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', color: '#fff', border: 'none', padding: '14px 48px', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', boxShadow: '0 0 40px rgba(56,189,248,0.22)' }}
      >
        ▶ BEGIN DREAMWARS
      </button>
    </div>
  );

  // ── Win / Lose ─────────────────────────────────────────────────────────────
  if (phase === 'win' || phase === 'lose') {
    const win = phase === 'win';
    return (
      <div style={{ background: win ? 'linear-gradient(135deg,#080f1a,#071628)' : 'linear-gradient(135deg,#120208,#1c0616)', minHeight: 430, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, borderRadius: 16, padding: 44, fontFamily: "'Space Grotesk',sans-serif" }}>
        <div style={{ fontSize: 54, fontWeight: 900, color: win ? '#38bdf8' : '#f87171', textShadow: `0 0 52px ${win ? '#38bdf840' : '#ef444440'}` }}>
          {win ? '✦ VICTORY' : '☽ DEFEATED'}
        </div>
        <div style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 400, lineHeight: 1.75 }}>
          {win
            ? 'The Nightmare Spire crumbles to dust. Peace flows back into the Dream Realm. The Dreamers prevail!'
            : 'Your Dream Core has fallen. The Nightmares flood unchecked. But the dream is never truly over…'}
        </div>
        <button onClick={startGame} style={{ background: win ? '#0ea5e9' : '#7c3aed', color: '#fff', border: 'none', padding: '12px 36px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Play Again
        </button>
      </div>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: "'Space Grotesk',sans-serif", userSelect: 'none' }}>

      {/* Top HUD bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: 'rgba(6,12,22,0.96)', borderRadius: 8, border: '1px solid rgba(56,189,248,0.14)', flexWrap: 'wrap' }}>
        <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 13 }}>✦ {energy.toLocaleString()} D.E.</span>
        <span style={{ color: '#1e3a5f' }}>│</span>
        <span style={{ color: '#38bdf8', fontSize: 11 }}>✦ Dreamers: {drCount}</span>
        <span style={{ color: '#1e3a5f' }}>│</span>
        <span style={{ color: '#a855f7', fontSize: 11 }}>☽ Nightmares: {nmCount}</span>
        {infoLine && (
          <>
            <span style={{ color: '#1e3a5f' }}>│</span>
            <span style={{ color: '#94a3b8', fontSize: 11, flexShrink: 0 }}>● {infoLine}</span>
          </>
        )}
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(56,189,248,0.16)' }}>
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          onClick={handleClick}
          style={{ display: 'block', width: '100%', cursor: 'crosshair', maxHeight: 480 }}
        />
      </div>

      {/* Bottom action bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', padding: '4px 0', minHeight: 32 }}>

        {/* Build buttons — only shown when building is not yet placed */}
        {!hasBarracks && (
          <button onClick={() => buildBuilding('barracks')} disabled={energy < 250} style={btnS(energy >= 250)}>
            ⚔ Barracks <span style={{ opacity: 0.55, fontSize: 10 }}>250 D.E.</span>
          </button>
        )}
        {!hasRefinery && (
          <button onClick={() => buildBuilding('refinery')} disabled={energy < 200} style={btnS(energy >= 200)}>
            ⛏ Refinery <span style={{ opacity: 0.55, fontSize: 10 }}>200 D.E.</span>
          </button>
        )}
        {!hasFactory && (
          <button onClick={() => buildBuilding('factory')} disabled={energy < 400} style={btnS(energy >= 400)}>
            ⚙ Factory <span style={{ opacity: 0.55, fontSize: 10 }}>400 D.E.</span>
          </button>
        )}

        {/* Train buttons — shown when a dreamer building is selected */}
        {selBldg && (
          <>
            {(!hasBarracks || !hasRefinery || !hasFactory) && (
              <span style={{ color: '#1e3a5f', fontSize: 11 }}>│</span>
            )}
            <span style={{ color: '#38bdf8', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>TRAIN:</span>

            {selBldg.type === 'barracks' && (
              <button onClick={() => trainUnit('walker')} disabled={energy < 100 || isTraining} style={btnS(energy >= 100 && !isTraining)}>
                ◈ Walker <span style={{ opacity: 0.55, fontSize: 10 }}>100 D.E.</span>
              </button>
            )}
            {selBldg.type === 'factory' && (
              <button onClick={() => trainUnit('tank')} disabled={energy < 350 || isTraining} style={btnS(energy >= 350 && !isTraining)}>
                ◉ Tank <span style={{ opacity: 0.55, fontSize: 10 }}>350 D.E.</span>
              </button>
            )}
            {selBldg.type === 'refinery' && (
              <button onClick={() => trainUnit('harvester')} disabled={energy < 150 || isTraining} style={btnS(energy >= 150 && !isTraining)}>
                ◎ Harvester <span style={{ opacity: 0.55, fontSize: 10 }}>150 D.E.</span>
              </button>
            )}

            {isTraining && (
              <span style={{ color: '#fbbf24', fontSize: 10, animation: 'none' }}>
                ⏳ {selBldg.trainType} ({Math.ceil(selBldg.trainTimer)}s)
              </span>
            )}
          </>
        )}

        <span style={{ marginLeft: 'auto', color: '#1e3a5f', fontSize: 10 }}>
          click unit/bldg → select · map → move · enemy → attack
        </span>
      </div>
    </div>
  );
}

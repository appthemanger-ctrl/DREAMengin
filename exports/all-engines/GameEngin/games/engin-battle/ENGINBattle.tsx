'use client';

/**
 * ENGINBattle — Age of Empires-inspired RTS for DREAMengin.
 *
 * Three factions mirror the AI Triad:
 *   Dr. Eams  (🤖, cyan)    — Robotics / permanent Research upgrades
 *   IDARi     (🧠, purple)  — Intelligence / Analyze scan reveals all enemies
 *   Boogie    (🎵, gold)    — Chaos / Groove Engine speed+damage burst
 *
 * Tech stack : Canvas 2D + React state HUD (no Babylon.js)
 * Self-contained: only react hooks + useSubmitScore from @/lib/games/hooks
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';

// ─── Canvas / Grid constants ──────────────────────────────────────────────────
const CANVAS_W = 784;
const CANVAS_H = 560;
const TILE     = 28;
const COLS     = Math.floor(CANVAS_W / TILE); // 28
const ROWS     = Math.floor(CANVAS_H / TILE); // 20

// ─── Core types ───────────────────────────────────────────────────────────────
type FactionId = 'eams' | 'idari' | 'boogie';
type UnitRole  = 'basic' | 'heavy' | 'gatherer';
type BuildType = 'hq' | 'barracks' | 'special';
type GamePhase = 'menu' | 'playing' | 'victory' | 'defeat';

interface Vec2      { x: number; y: number; }
interface Explosion { x: number; y: number; r: number; alpha: number; }
interface ResCell   { x: number; y: number; amount: number; }
interface Star      { x: number; y: number; r: number; b: number; }

interface TrainEntry {
  role: UnitRole;
  timer: number;
  maxTimer: number;
}

interface Unit {
  id: number;
  role: UnitRole;
  faction: FactionId;
  pos: Vec2;
  hp: number;
  maxHp: number;
  moveTarget: Vec2 | null;
  attackTargetId: number | null;
  attackCooldown: number;
  carryFrags: number;
}

interface Building {
  id: number;
  type: BuildType;
  faction: FactionId;
  pos: Vec2;
  hp: number;
  maxHp: number;
}

interface GameState {
  terrain:    number[][];
  stars:      Star[];
  resources:  ResCell[];
  units:      Unit[];
  buildings:  Building[];
  credits:    Record<FactionId, number>;
  selected:   number[];
  trainQueue: Record<FactionId, TrainEntry | null>;
  // Dr. Eams — Research
  researchLevel:    number; // 0–3
  researchCooldown: number;
  // IDARi — Analyze
  analyzeCooldown: number;
  analyzeActive:   number; // seconds remaining
  // Boogie — Groove
  grooveCooldown: number;
  grooveActive:   number; // seconds remaining
  // AI state
  aiTimers:       Record<FactionId, number>;
  aiAttackTimers: Record<FactionId, number>;
  // Effects
  explosions: Explosion[];
  // Meta
  tick:           number;
  playerFaction:  FactionId;
}

// ─── Faction configs ──────────────────────────────────────────────────────────
interface FactionCfg {
  name: string; emoji: string;
  color: string; dark: string; light: string;
  unitNames:    Record<UnitRole, string>;
  unitIcons:    Record<UnitRole, string>;
  specialEmoji: string;
  specialName:  string;
  specialDesc:  string;
  blurb:        string;
}

const FACTIONS: Record<FactionId, FactionCfg> = {
  eams: {
    name: 'Dr. Eams', emoji: '🤖',
    color: '#38bdf8', dark: '#0284c7', light: '#e0f2fe',
    unitNames: { basic: 'Drone', heavy: 'MechWarrior', gatherer: 'Collector Bot' },
    unitIcons:  { basic: '✦',    heavy: '⬡',           gatherer: '⚙'           },
    specialEmoji: '🔬', specialName: 'Research',
    specialDesc: 'Permanently upgrades all unit ATK & SPD (+25% per tier, 3 tiers). Costs 200💾.',
    blurb: 'Robotics faction. Outscales every foe through iterative tech research.',
  },
  idari: {
    name: 'IDARi', emoji: '🧠',
    color: '#a78bfa', dark: '#6d28d9', light: '#ede9fe',
    unitNames: { basic: 'Sentinel', heavy: 'Logic Bomb', gatherer: 'Data Node' },
    unitIcons:  { basic: '◈',       heavy: '◆',          gatherer: '○'         },
    specialEmoji: '👁', specialName: 'Analyze',
    specialDesc: 'Reveals & highlights ALL enemy units and buildings for 4 s. Costs 100💾.',
    blurb: 'Intelligence faction. Information advantage enables surgical strikes.',
  },
  boogie: {
    name: 'Boogie', emoji: '🎵',
    color: '#fbbf24', dark: '#b45309', light: '#fef3c7',
    unitNames: { basic: 'Beat Rider', heavy: 'Bass Bomber', gatherer: 'Groover' },
    unitIcons:  { basic: '♪',         heavy: '♫',           gatherer: '♬'      },
    specialEmoji: '🎶', specialName: 'Groove',
    specialDesc: 'All friendly units gain ×1.6 SPD & ×1.5 ATK for 10 s. Costs 160💾.',
    blurb: 'Chaos faction. Overwhelming burst pressure when the Groove drops.',
  },
};

// ─── Stats ────────────────────────────────────────────────────────────────────
const UNIT_STATS: Record<UnitRole, {
  hp: number; speed: number; damage: number; range: number; cost: number; trainTime: number;
}> = {
  basic:    { hp: 75,  speed: 1.5,  damage: 14, range: 2.5, cost: 80,  trainTime: 7  },
  heavy:    { hp: 240, speed: 0.75, damage: 44, range: 3.5, cost: 260, trainTime: 14 },
  gatherer: { hp: 55,  speed: 1.3,  damage: 0,  range: 0,   cost: 65,  trainTime: 5  },
};

const BLDG_STATS: Record<BuildType, { hp: number; size: number }> = {
  hq:       { hp: 750, size: 2   },
  barracks: { hp: 250, size: 1.5 },
  special:  { hp: 200, size: 1.5 },
};

// ─── Ability constants ────────────────────────────────────────────────────────
const RESEARCH_COST     = 200; const RESEARCH_COOLDOWN = 25;
const ANALYZE_COST      = 100; const ANALYZE_COOLDOWN  = 20; const ANALYZE_DURATION  = 4;
const GROOVE_COST       = 160; const GROOVE_COOLDOWN   = 35; const GROOVE_DURATION   = 10;
const GROOVE_BUFF       = 1.6;

// ─── Starting positions (HQ top-left corner in grid coords) ──────────────────
const BASE_POS: Record<FactionId, Vec2> = {
  eams:   { x: 1,                          y: 1        },
  idari:  { x: COLS - 5,                   y: 1        },
  boogie: { x: Math.floor(COLS / 2) - 2,  y: ROWS - 5 },
};

// ─── Harvesting constants ──────────────────────────────────────────────────────
const CARRY_CAP    = 80;
const HARVEST_RPS  = 16; // resource units per second per gatherer

// ─── Pure helpers ─────────────────────────────────────────────────────────────
let _uid = 1;
const uid    = () => _uid++;
const dist   = (a: Vec2, b: Vec2) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
const clamp  = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const toward = (pos: Vec2, tgt: Vec2, spd: number): Vec2 => {
  const d = dist(pos, tgt);
  if (d <= spd) return { ...tgt };
  const r = spd / d;
  return { x: pos.x + (tgt.x - pos.x) * r, y: pos.y + (tgt.y - pos.y) * r };
};

// ─── createInitialState ───────────────────────────────────────────────────────
function createInitialState(playerFaction: FactionId): GameState {
  _uid = 1;

  // Space-themed terrain variation
  const terrain: number[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) return 3; // border void
      const seed = (r * 37 + c * 19) % 100;
      if (seed < 7)  return 2; // nebula patch
      if (seed < 14) return 1; // dim cloud
      return 0;                // deep space
    })
  );

  // Star field (static decoration)
  const stars: Star[] = Array.from({ length: 90 }, () => ({
    x: Math.random() * CANVAS_W,
    y: Math.random() * CANVAS_H,
    r: Math.random() * 1.2 + 0.3,
    b: Math.random() * 0.55 + 0.25,
  }));

  // Code Fragment resource clusters — 5 locations away from all three bases
  const resources: ResCell[] = [];
  const resCenters: Vec2[] = [
    { x: 9,  y: 5  },
    { x: 20, y: 5  },
    { x: 6,  y: 13 },
    { x: 22, y: 13 },
    { x: 14, y: 10 }, // centre
  ];
  for (const c of resCenters) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = c.x + dx, ny = c.y + dy;
        if (nx > 0 && nx < COLS - 1 && ny > 0 && ny < ROWS - 1) {
          resources.push({ x: nx, y: ny, amount: 270 + Math.random() * 200 });
        }
      }
    }
  }

  // Buildings — each faction gets HQ, Barracks, Special building
  const buildings: Building[] = [];
  for (const fid of ['eams', 'idari', 'boogie'] as FactionId[]) {
    const bp = BASE_POS[fid];
    buildings.push({
      id: uid(), type: 'hq', faction: fid, pos: { ...bp },
      hp: BLDG_STATS.hq.hp, maxHp: BLDG_STATS.hq.hp,
    });
    buildings.push({
      id: uid(), type: 'barracks', faction: fid, pos: { x: bp.x, y: bp.y + 3 },
      hp: BLDG_STATS.barracks.hp, maxHp: BLDG_STATS.barracks.hp,
    });
    buildings.push({
      id: uid(), type: 'special', faction: fid, pos: { x: bp.x + 3, y: bp.y },
      hp: BLDG_STATS.special.hp, maxHp: BLDG_STATS.special.hp,
    });
  }

  // Starting units — 2 basic combat units + 1 gatherer per faction
  const units: Unit[] = [];
  for (const fid of ['eams', 'idari', 'boogie'] as FactionId[]) {
    const bp = BASE_POS[fid];
    for (let i = 0; i < 2; i++) {
      const st = UNIT_STATS.basic;
      units.push({
        id: uid(), role: 'basic', faction: fid,
        pos: { x: bp.x + 1 + i * 0.9, y: bp.y + 1 },
        hp: st.hp, maxHp: st.hp,
        moveTarget: null, attackTargetId: null, attackCooldown: 0, carryFrags: 0,
      });
    }
    const gs = UNIT_STATS.gatherer;
    units.push({
      id: uid(), role: 'gatherer', faction: fid,
      pos: { x: bp.x + 1.5, y: bp.y + 2 },
      hp: gs.hp, maxHp: gs.hp,
      moveTarget: null, attackTargetId: null, attackCooldown: 0, carryFrags: 0,
    });
  }

  return {
    terrain, stars, resources, units, buildings,
    credits:    { eams: 1200, idari: 1200, boogie: 1200 },
    selected:   [],
    trainQueue: { eams: null, idari: null, boogie: null },
    researchLevel: 0,   researchCooldown: 0,
    analyzeCooldown: 0, analyzeActive: 0,
    grooveCooldown: 0,  grooveActive: 0,
    aiTimers:       { eams: 5,  idari: 5.5, boogie: 4   },
    aiAttackTimers: { eams: 10, idari: 12,  boogie: 8   },
    explosions: [],
    tick: 0, playerFaction,
  };
}

// ─── getSpawnPos ──────────────────────────────────────────────────────────────
function getSpawnPos(state: GameState, faction: FactionId): Vec2 {
  const brk = state.buildings.find(b => b.faction === faction && b.type === 'barracks');
  if (brk) {
    return {
      x: clamp(brk.pos.x + BLDG_STATS.barracks.size * 0.5, 0.5, COLS - 0.5),
      y: clamp(brk.pos.y + BLDG_STATS.barracks.size + 0.5,  0.5, ROWS - 0.5),
    };
  }
  const hq = state.buildings.find(b => b.faction === faction && b.type === 'hq');
  if (hq) {
    return {
      x: clamp(hq.pos.x + 1,                     0.5, COLS - 0.5),
      y: clamp(hq.pos.y + BLDG_STATS.hq.size + 0.3, 0.5, ROWS - 0.5),
    };
  }
  return { ...BASE_POS[faction] };
}

// ─── stepGatherer ─────────────────────────────────────────────────────────────
function stepGatherer(unit: Unit, state: GameState, dt: number): void {
  if (unit.carryFrags >= CARRY_CAP) {
    // Return to HQ to deposit
    const hq = state.buildings.find(b => b.faction === unit.faction && b.type === 'hq');
    if (!hq) return;
    const depot: Vec2 = {
      x: hq.pos.x + BLDG_STATS.hq.size / 2,
      y: hq.pos.y + BLDG_STATS.hq.size / 2,
    };
    if (dist(unit.pos, depot) < 1.5) {
      state.credits[unit.faction] += unit.carryFrags;
      unit.carryFrags = 0;
    } else {
      const newPos = toward(unit.pos, depot, UNIT_STATS.gatherer.speed * dt * 2);
      unit.pos.x = clamp(newPos.x, 0.5, COLS - 0.5);
      unit.pos.y = clamp(newPos.y, 0.5, ROWS - 0.5);
    }
    return;
  }

  // Find nearest resource with amount remaining
  let nearest: ResCell | null = null;
  let nearestD = Infinity;
  for (const res of state.resources) {
    if (res.amount <= 0) continue;
    const d = dist(unit.pos, res);
    if (d < nearestD) { nearestD = d; nearest = res; }
  }
  if (!nearest) return;

  if (nearestD < 1.2) {
    const take = Math.min(HARVEST_RPS * dt, nearest.amount, CARRY_CAP - unit.carryFrags);
    nearest.amount  -= take;
    unit.carryFrags += take;
  } else {
    const newPos = toward(unit.pos, nearest, UNIT_STATS.gatherer.speed * dt * 2);
    unit.pos.x = clamp(newPos.x, 0.5, COLS - 0.5);
    unit.pos.y = clamp(newPos.y, 0.5, ROWS - 0.5);
  }
}

// ─── stepCombatUnit ───────────────────────────────────────────────────────────
function stepCombatUnit(unit: Unit, state: GameState, dt: number): void {
  const base  = UNIT_STATS[unit.role];
  let speed   = base.speed;
  let damage  = base.damage;
  const range = base.range;

  // Apply faction-specific buffs
  if (unit.faction === 'eams' && state.researchLevel > 0) {
    damage *= 1 + state.researchLevel * 0.25;
    speed  *= 1 + state.researchLevel * 0.10;
  }
  if (unit.faction === 'boogie' && state.grooveActive > 0) {
    speed  *= GROOVE_BUFF;
    damage *= 1.5;
  }

  if (unit.attackTargetId !== null) {
    const tUnit = state.units.find(u => u.id === unit.attackTargetId);
    const tBldg = state.buildings.find(b => b.id === unit.attackTargetId);
    let tPos: Vec2 | null = tUnit?.pos ?? null;
    if (!tPos && tBldg) {
      tPos = {
        x: tBldg.pos.x + BLDG_STATS[tBldg.type].size / 2,
        y: tBldg.pos.y + BLDG_STATS[tBldg.type].size / 2,
      };
    }
    if (!tPos) {
      // Target gone
      unit.attackTargetId = null;
    } else {
      const d = dist(unit.pos, tPos);
      if (d <= range) {
        if (unit.attackCooldown <= 0) {
          unit.attackCooldown = 1.2;
          if (tUnit) tUnit.hp  -= damage;
          if (tBldg) tBldg.hp -= damage;
          state.explosions.push({
            x: tPos.x * TILE + TILE / 2,
            y: tPos.y * TILE + TILE / 2,
            r: tBldg ? 5 : 3, alpha: 0.85,
          });
        }
      } else {
        const newPos = toward(unit.pos, tPos, speed * dt * 2);
        unit.pos.x = clamp(newPos.x, 0.5, COLS - 0.5);
        unit.pos.y = clamp(newPos.y, 0.5, ROWS - 0.5);
      }
    }
  } else if (unit.moveTarget) {
    if (dist(unit.pos, unit.moveTarget) < 0.4) {
      unit.moveTarget = null;
    } else {
      const newPos = toward(unit.pos, unit.moveTarget, speed * dt * 2);
      unit.pos.x = clamp(newPos.x, 0.5, COLS - 0.5);
      unit.pos.y = clamp(newPos.y, 0.5, ROWS - 0.5);
    }
  } else {
    // Idle — auto-detect nearby enemies
    let closest: Unit | null = null;
    let closestD = 4.5;
    for (const u of state.units) {
      if (u.faction === unit.faction) continue;
      const d = dist(u.pos, unit.pos);
      if (d < closestD) { closestD = d; closest = u; }
    }
    if (closest) unit.attackTargetId = closest.id;
  }
}

// ─── stepTrainQueues ──────────────────────────────────────────────────────────
function stepTrainQueues(state: GameState, dt: number): void {
  for (const fid of ['eams', 'idari', 'boogie'] as FactionId[]) {
    const q = state.trainQueue[fid];
    if (!q) continue;
    q.timer -= dt;
    if (q.timer <= 0) {
      const stats = UNIT_STATS[q.role];
      const spawn = getSpawnPos(state, fid);
      state.units.push({
        id: uid(), role: q.role, faction: fid, pos: { ...spawn },
        hp: stats.hp, maxHp: stats.hp,
        moveTarget: null, attackTargetId: null, attackCooldown: 0, carryFrags: 0,
      });
      state.trainQueue[fid] = null;
    }
  }
}

// ─── stepAI ───────────────────────────────────────────────────────────────────
function stepAI(state: GameState, dt: number): void {
  const all: FactionId[] = ['eams', 'idari', 'boogie'];
  const pf = state.playerFaction;

  for (const faction of all) {
    if (faction === pf) continue; // player faction — skip

    // ── Training / ability timer ──
    state.aiTimers[faction] -= dt;
    if (state.aiTimers[faction] <= 0) {
      state.aiTimers[faction] = 4 + Math.random() * 5;

      // Trigger special ability opportunistically
      if (faction === 'eams' && state.researchCooldown <= 0 && state.researchLevel < 3
          && state.credits.eams >= RESEARCH_COST) {
        state.credits.eams     -= RESEARCH_COST;
        state.researchLevel    += 1;
        state.researchCooldown  = RESEARCH_COOLDOWN;
      }
      if (faction === 'idari' && state.analyzeCooldown <= 0
          && state.credits.idari >= ANALYZE_COST) {
        state.credits.idari   -= ANALYZE_COST;
        state.analyzeActive    = ANALYZE_DURATION;
        state.analyzeCooldown  = ANALYZE_COOLDOWN;
      }
      if (faction === 'boogie' && state.grooveCooldown <= 0
          && state.credits.boogie >= GROOVE_COST) {
        state.credits.boogie -= GROOVE_COST;
        state.grooveActive    = GROOVE_DURATION;
        state.grooveCooldown  = GROOVE_COOLDOWN;
      }

      // Train a unit if queue is free
      if (!state.trainQueue[faction]) {
        const myUnits   = state.units.filter(u => u.faction === faction);
        const gathCnt   = myUnits.filter(u => u.role === 'gatherer').length;
        const combatCnt = myUnits.filter(u => u.role !== 'gatherer').length;
        let role: UnitRole | null = null;

        if (gathCnt === 0 && state.credits[faction] >= UNIT_STATS.gatherer.cost) {
          role = 'gatherer';
        } else if (combatCnt < 8) {
          if (state.credits[faction] >= UNIT_STATS.heavy.cost && Math.random() < 0.35) {
            role = 'heavy';
          } else if (state.credits[faction] >= UNIT_STATS.basic.cost) {
            role = 'basic';
          }
        }

        if (role) {
          state.credits[faction]   -= UNIT_STATS[role].cost;
          state.trainQueue[faction] = {
            role,
            timer:    UNIT_STATS[role].trainTime,
            maxTimer: UNIT_STATS[role].trainTime,
          };
        }
      }
    }

    // ── Attack timer — periodically order all combat units to assault a target ──
    state.aiAttackTimers[faction] -= dt;
    if (state.aiAttackTimers[faction] <= 0) {
      state.aiAttackTimers[faction] = 8 + Math.random() * 9;

      // 65 % chance to target the player; 35 % chance to hit the other AI
      const otherAI = all.find(f => f !== faction && f !== pf) ?? pf;
      const targetF: FactionId = Math.random() < 0.65 ? pf : otherAI;
      const targetHQ = state.buildings.find(b => b.faction === targetF && b.type === 'hq');
      if (targetHQ) {
        const myFighters = state.units.filter(u => u.faction === faction && u.role !== 'gatherer');
        for (const u of myFighters) {
          u.attackTargetId = targetHQ.id;
          u.moveTarget     = null;
        }
      }
    }
  }
}

// ─── stepGame ─────────────────────────────────────────────────────────────────
function stepGame(state: GameState, dt: number): void {
  state.tick++;

  // Ability timer countdown
  if (state.analyzeActive > 0)    state.analyzeActive    = Math.max(0, state.analyzeActive   - dt);
  if (state.analyzeCooldown > 0)  state.analyzeCooldown  = Math.max(0, state.analyzeCooldown - dt);
  if (state.grooveActive > 0)     state.grooveActive     = Math.max(0, state.grooveActive    - dt);
  if (state.grooveCooldown > 0)   state.grooveCooldown   = Math.max(0, state.grooveCooldown  - dt);
  if (state.researchCooldown > 0) state.researchCooldown = Math.max(0, state.researchCooldown- dt);

  // Explosion decay
  state.explosions = state.explosions
    .map(e => ({ ...e, r: e.r + 2.2, alpha: e.alpha - 0.048 }))
    .filter(e => e.alpha > 0);

  // Step each unit
  for (const unit of state.units) {
    if (unit.attackCooldown > 0) unit.attackCooldown -= dt;
    if (unit.role === 'gatherer') {
      stepGatherer(unit, state, dt);
    } else {
      stepCombatUnit(unit, state, dt);
    }
  }

  // Remove dead units — add small explosion
  for (const u of state.units) {
    if (u.hp <= 0) {
      state.explosions.push({
        x: u.pos.x * TILE + TILE / 2, y: u.pos.y * TILE + TILE / 2, r: 5, alpha: 1,
      });
    }
  }
  state.units = state.units.filter(u => u.hp > 0);

  // Remove dead buildings — add large explosion
  for (const b of state.buildings) {
    if (b.hp <= 0) {
      const sz = BLDG_STATS[b.type].size * TILE;
      state.explosions.push({
        x: b.pos.x * TILE + sz / 2, y: b.pos.y * TILE + sz / 2, r: 9, alpha: 1,
      });
    }
  }
  state.buildings = state.buildings.filter(b => b.hp > 0);

  // Advance training queues
  stepTrainQueues(state, dt);

  // AI decisions
  stepAI(state, dt);
}

// ─── drawGame ─────────────────────────────────────────────────────────────────
function drawGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  const T = TILE;

  // ── Deep space background ──
  ctx.fillStyle = '#060912';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // ── Stars ──
  for (const s of state.stars) {
    ctx.fillStyle = `rgba(200,220,255,${s.b})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Terrain overlay patches (nebula / void) ──
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = state.terrain[r][c];
      if (t === 1) {
        ctx.fillStyle = 'rgba(80,40,130,0.17)';
        ctx.fillRect(c * T, r * T, T, T);
      } else if (t === 2) {
        ctx.fillStyle = 'rgba(50,50,110,0.22)';
        ctx.fillRect(c * T, r * T, T, T);
      } else if (t === 3) {
        ctx.fillStyle = 'rgba(6,6,20,0.55)';
        ctx.fillRect(c * T, r * T, T, T);
      }
    }
  }

  // ── Grid lines ──
  ctx.strokeStyle = 'rgba(100,120,200,0.055)';
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * T, 0); ctx.lineTo(c * T, ROWS * T); ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * T); ctx.lineTo(COLS * T, r * T); ctx.stroke();
  }

  // ── Faction territory glows (radial gradient around living HQs) ──
  for (const fid of ['eams', 'idari', 'boogie'] as FactionId[]) {
    const hqB = state.buildings.find(b => b.faction === fid && b.type === 'hq');
    if (!hqB) continue;
    const cx = (hqB.pos.x + 1) * T;
    const cy = (hqB.pos.y + 1) * T;
    const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, 4.5 * T);
    g.addColorStop(0, FACTIONS[fid].color + '28');
    g.addColorStop(1, FACTIONS[fid].color + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // ── Resource cells (Code Fragments) ──
  for (const res of state.resources) {
    if (res.amount <= 0) continue;
    const a  = clamp(res.amount / 300, 0.15, 1);
    const px = res.x * T + 4, py = res.y * T + 4, s = T - 8;
    ctx.fillStyle   = `rgba(20,240,200,${0.12 * a})`;
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = `rgba(20,240,200,${0.55 * a})`;
    ctx.lineWidth   = 1;
    ctx.strokeRect(px + 1, py + 1, s - 2, s - 2);
    // Glowing centre dot
    ctx.fillStyle = `rgba(80,255,220,${0.75 * a})`;
    ctx.beginPath();
    ctx.arc(res.x * T + T / 2, res.y * T + T / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── IDARi Analyze effect — pulsing outline around all non-IDARi entities ──
  if (state.analyzeActive > 0) {
    const pulse = 0.55 + 0.45 * Math.sin(state.tick * 0.3);
    ctx.strokeStyle = `rgba(167,139,250,${pulse * 0.88})`;
    ctx.lineWidth   = 2;
    for (const u of state.units) {
      if (u.faction === 'idari') continue;
      ctx.beginPath();
      ctx.arc(u.pos.x * T + T / 2, u.pos.y * T + T / 2, 14, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const b of state.buildings) {
      if (b.faction === 'idari') continue;
      const sz = BLDG_STATS[b.type].size * T;
      ctx.strokeRect(b.pos.x * T - 3, b.pos.y * T - 3, sz + 6, sz + 6);
    }
  }

  // ── Buildings ──
  for (const b of state.buildings) {
    const cfg = FACTIONS[b.faction];
    const sz  = BLDG_STATS[b.type].size * T;
    const px  = b.pos.x * T, py = b.pos.y * T;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(px + 3, py + 3, sz, sz);

    // Body — linear gradient from faction colour to dark
    const bg = ctx.createLinearGradient(px, py, px + sz, py + sz);
    bg.addColorStop(0, cfg.color + 'cc');
    bg.addColorStop(1, cfg.dark  + 'ee');
    ctx.fillStyle = bg;
    ctx.fillRect(px, py, sz, sz);

    // Border
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth   = b.type === 'hq' ? 2.5 : 1.5;
    ctx.strokeRect(px, py, sz, sz);

    // Central icon
    ctx.fillStyle    = 'rgba(255,255,255,0.92)';
    ctx.font         = `bold ${b.type === 'hq' ? 15 : 11}px sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const icon = b.type === 'hq' ? cfg.emoji : b.type === 'barracks' ? '⚔' : cfg.specialEmoji;
    ctx.fillText(icon, px + sz / 2, py + sz / 2);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign    = 'left';

    // HP bar (above building)
    const hpR = b.hp / b.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(px, py - 5, sz, 3);
    ctx.fillStyle = hpR > 0.6 ? '#22c55e' : hpR > 0.3 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(px, py - 5, sz * hpR, 3);
  }

  // ── Boogie Groove aura around boogie units while active ──
  if (state.grooveActive > 0) {
    const pulse = 0.6 + 0.4 * Math.sin(state.tick * 0.5);
    for (const u of state.units) {
      if (u.faction !== 'boogie') continue;
      const cx = u.pos.x * T + T / 2, cy = u.pos.y * T + T / 2;
      const ag = ctx.createRadialGradient(cx, cy, 3, cx, cy, 18);
      ag.addColorStop(0, `rgba(251,191,36,${0.45 * pulse})`);
      ag.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.fillStyle = ag;
      ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ── Units ──
  for (const unit of state.units) {
    const cfg = FACTIONS[unit.faction];
    const cx  = unit.pos.x * T + T / 2;
    const cy  = unit.pos.y * T + T / 2;
    const r   = unit.role === 'heavy' ? 11 : unit.role === 'basic' ? 8 : 6;

    // Selection ring (dashed white)
    if (state.selected.includes(unit.id)) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2); ctx.stroke();
    }

    // Unit body — radial gradient for a slight 3-D feel
    const ug = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 1, cx, cy, r);
    ug.addColorStop(0, cfg.light);
    ug.addColorStop(1, cfg.color);
    ctx.fillStyle = ug;

    if (unit.role === 'heavy') {
      // Diamond silhouette
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = cfg.dark; ctx.lineWidth = 1.5; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = cfg.dark; ctx.lineWidth = 1; ctx.stroke();
    }

    // Unit role icon
    ctx.fillStyle    = 'rgba(0,0,0,0.78)';
    ctx.font         = `${Math.max(7, r - 1)}px sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.unitIcons[unit.role], cx, cy);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign    = 'left';

    // Gatherer carry bar (cyan strip above HP bar)
    if (unit.role === 'gatherer' && unit.carryFrags > 0) {
      ctx.fillStyle = 'rgba(20,240,200,0.88)';
      ctx.fillRect(cx - r, cy - r - 4, r * 2 * (unit.carryFrags / CARRY_CAP), 2);
    }

    // HP bar
    const hpR = unit.hp / unit.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(cx - r, cy - r - 8, r * 2, 3);
    ctx.fillStyle = hpR > 0.5 ? '#22c55e' : '#ef4444';
    ctx.fillRect(cx - r, cy - r - 8, r * 2 * hpR, 3);
  }

  // ── Explosions ──
  for (const e of state.explosions) {
    const eg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
    eg.addColorStop(0,   `rgba(255,255,120,${e.alpha})`);
    eg.addColorStop(0.4, `rgba(255,100,20,${e.alpha * 0.8})`);
    eg.addColorStop(1,   'rgba(200,50,0,0)');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
  }
}

// ─── HUD data type ─────────────────────────────────────────────────────────────
interface HudData {
  credits:          number;
  trainQueue:       TrainEntry | null;
  researchLevel:    number;
  researchCooldown: number;
  analyzeCooldown:  number;
  analyzeActive:    number;
  grooveCooldown:   number;
  grooveActive:     number;
  factionStatus:    Record<FactionId, { units: number; hq: boolean }>;
}

const INITIAL_HUD: HudData = {
  credits: 1200, trainQueue: null,
  researchLevel: 0, researchCooldown: 0,
  analyzeCooldown: 0, analyzeActive: 0,
  grooveCooldown: 0, grooveActive: 0,
  factionStatus: {
    eams:  { units: 3, hq: true },
    idari: { units: 3, hq: true },
    boogie:{ units: 3, hq: true },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ENGINBattle() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const stateRef    = useRef<GameState | null>(null);
  const rafRef      = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [phase,         setPhase]         = useState<GamePhase>('menu');
  const [playerFaction, setPlayerFaction] = useState<FactionId>('eams');
  const [winner,        setWinner]        = useState<FactionId | null>(null);
  const [hudData,       setHudData]       = useState<HudData>(INITIAL_HUD);

  const submitScore = useSubmitScore('engin-battle');
  useEffect(() => {
    if (phase === 'victory') submitScore(3000);
    if (phase === 'defeat')  submitScore(500);
  }, [phase, submitScore]);

  // ── Start / reset ──
  const startGame = useCallback((faction: FactionId) => {
    stateRef.current = createInitialState(faction);
    setPlayerFaction(faction);
    setWinner(null);
    setHudData(INITIAL_HUD);
    setPhase('playing');
  }, []);
  // Default auto-start: Dr. Eams faction
  useGameAutoStart(phase === 'menu' ? () => startGame('eams') : null);

  // ── Main game loop ──
  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (!running) return;
      const dt  = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const state = stateRef.current!;
      stepGame(state, dt);
      drawGame(ctx, state);

      // Refresh HUD state every 20 ticks (~3 Hz)
      if (state.tick % 20 === 0) {
        const pf = state.playerFaction;
        setHudData({
          credits:          state.credits[pf],
          trainQueue:       state.trainQueue[pf],
          researchLevel:    state.researchLevel,
          researchCooldown: state.researchCooldown,
          analyzeCooldown:  state.analyzeCooldown,
          analyzeActive:    state.analyzeActive,
          grooveCooldown:   state.grooveCooldown,
          grooveActive:     state.grooveActive,
          factionStatus: {
            eams:  { units: state.units.filter(u => u.faction === 'eams').length,   hq: !!state.buildings.find(b => b.faction === 'eams'   && b.type === 'hq') },
            idari: { units: state.units.filter(u => u.faction === 'idari').length,  hq: !!state.buildings.find(b => b.faction === 'idari'  && b.type === 'hq') },
            boogie:{ units: state.units.filter(u => u.faction === 'boogie').length, hq: !!state.buildings.find(b => b.faction === 'boogie' && b.type === 'hq') },
          },
        });

        // Win / lose check
        const liveHQs = state.buildings.filter(b => b.type === 'hq');
        const alive   = new Set(liveHQs.map(b => b.faction));
        if (alive.size <= 1 || !alive.has(pf)) {
          running = false;
          const aliveArr = [...alive] as FactionId[];
          const w = alive.has(pf) ? pf : (aliveArr.length > 0 ? aliveArr[0] : null);
          setWinner(w);
          setPhase(alive.has(pf) ? 'victory' : 'defeat');
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  // ── Canvas: left-click to select / move / attack ──
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = stateRef.current;
    if (!state) return;
    const rect   = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const gx = ((e.clientX - rect.left) * scaleX) / TILE;
    const gy = ((e.clientY - rect.top)  * scaleY) / TILE;
    const pf = state.playerFaction;

    // Click on friendly unit → select it
    const friendly = state.units.find(
      u => u.faction === pf && dist(u.pos, { x: gx, y: gy }) < 1.2
    );
    if (friendly) {
      state.selected = [friendly.id];
      return;
    }

    if (state.selected.length === 0) return;

    // Click with active selection
    const enemyUnit = state.units.find(
      u => u.faction !== pf && dist(u.pos, { x: gx, y: gy }) < 1.2
    );
    const enemyBldg = state.buildings.find(b =>
      b.faction !== pf &&
      gx >= b.pos.x && gx < b.pos.x + BLDG_STATS[b.type].size &&
      gy >= b.pos.y && gy < b.pos.y + BLDG_STATS[b.type].size
    );

    state.selected.forEach((selId, i) => {
      const unit = state.units.find(u => u.id === selId);
      if (!unit || unit.role === 'gatherer') return;
      if (enemyUnit) {
        unit.attackTargetId = enemyUnit.id;
        unit.moveTarget     = null;
      } else if (enemyBldg) {
        unit.attackTargetId = enemyBldg.id;
        unit.moveTarget     = null;
      } else {
        // Spread units slightly so they don't stack
        const offset = { x: (i % 3) * 0.85 - 0.85, y: Math.floor(i / 3) * 0.85 };
        unit.attackTargetId = null;
        unit.moveTarget     = {
          x: clamp(gx + offset.x, 0.5, COLS - 0.5),
          y: clamp(gy + offset.y, 0.5, ROWS - 0.5),
        };
      }
    });
  }, []);

  // ── Right-click → deselect ──
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (stateRef.current) stateRef.current.selected = [];
  }, []);

  // ── Select all non-gatherer player units ──
  const selectAll = useCallback(() => {
    const state = stateRef.current;
    if (!state) return;
    state.selected = state.units
      .filter(u => u.faction === state.playerFaction && u.role !== 'gatherer')
      .map(u => u.id);
  }, []);

  // ── Train a unit ──
  const trainUnit = useCallback((role: UnitRole) => {
    const state = stateRef.current;
    if (!state) return;
    const pf   = state.playerFaction;
    const cost = UNIT_STATS[role].cost;
    if (state.credits[pf] < cost || state.trainQueue[pf]) return;
    if (!state.buildings.find(b => b.faction === pf && b.type === 'barracks')) return;
    state.credits[pf]   -= cost;
    state.trainQueue[pf] = {
      role, timer: UNIT_STATS[role].trainTime, maxTimer: UNIT_STATS[role].trainTime,
    };
  }, []);

  // ── Activate special ability ──
  const useAbility = useCallback(() => {
    const state = stateRef.current;
    if (!state) return;
    const pf = state.playerFaction;
    if (pf === 'eams') {
      if (state.researchCooldown > 0 || state.researchLevel >= 3 || state.credits.eams < RESEARCH_COST) return;
      state.credits.eams     -= RESEARCH_COST;
      state.researchLevel    += 1;
      state.researchCooldown  = RESEARCH_COOLDOWN;
    } else if (pf === 'idari') {
      if (state.analyzeCooldown > 0 || state.credits.idari < ANALYZE_COST) return;
      state.credits.idari   -= ANALYZE_COST;
      state.analyzeActive    = ANALYZE_DURATION;
      state.analyzeCooldown  = ANALYZE_COOLDOWN;
    } else {
      if (state.grooveCooldown > 0 || state.credits.boogie < GROOVE_COST) return;
      state.credits.boogie -= GROOVE_COST;
      state.grooveActive    = GROOVE_DURATION;
      state.grooveCooldown  = GROOVE_COOLDOWN;
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Menu
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div style={{
        background: '#060912', minHeight: 520,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 28, borderRadius: 12, padding: '36px 24px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 38, fontWeight: 900, letterSpacing: '0.06em',
            color: '#f0f6ff', textShadow: '0 0 32px rgba(100,150,255,0.45)',
          }}>
            ⚔ ENGINBattle
          </div>
          <div style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>
            Age of Empires · AI Triad Edition · RTS · Choose your faction
          </div>
        </div>

        {/* Faction cards */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {(['eams', 'idari', 'boogie'] as FactionId[]).map(fid => {
            const fc = FACTIONS[fid];
            return (
              <button
                key={fid}
                onClick={() => startGame(fid)}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `2px solid ${fc.color}55`,
                  borderRadius: 14, padding: '20px 22px',
                  cursor: 'pointer', textAlign: 'left',
                  width: 215, color: '#f0f6ff',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = fc.color;
                  el.style.background  = fc.color + '18';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = fc.color + '55';
                  el.style.background  = 'rgba(255,255,255,0.02)';
                }}
              >
                <div style={{ fontSize: 30 }}>{fc.emoji}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: fc.color, marginTop: 6 }}>
                  {fc.name}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 1.55 }}>
                  {fc.blurb}
                </div>
                {/* Special ability */}
                <div style={{
                  marginTop: 10, borderTop: `1px solid ${fc.color}44`, paddingTop: 8,
                }}>
                  <div style={{ fontSize: 10, color: fc.color, fontWeight: 600 }}>
                    {fc.specialEmoji} {fc.specialName}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, lineHeight: 1.5 }}>
                    {fc.specialDesc}
                  </div>
                </div>
                {/* Unit roster */}
                <div style={{ marginTop: 8 }}>
                  {(['basic', 'heavy', 'gatherer'] as UnitRole[]).map(role => (
                    <div key={role} style={{ fontSize: 10, color: '#64748b', marginBottom: 1 }}>
                      {fc.unitIcons[role]} {fc.unitNames[role]} — {UNIT_STATS[role].hp}HP / {UNIT_STATS[role].cost}💾
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 12, background: fc.color, color: '#000',
                  padding: '6px 0', borderRadius: 6, textAlign: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>
                  ▶ DEPLOY AS {fc.name.toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Control tips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            'Click unit to select',
            'Click ground to move',
            'Click enemy to attack',
            'Right-click to deselect',
            '"All" button = select all fighters',
            'Gatherers auto-harvest 💾',
            'Destroy all enemy HQs to win',
          ].map(tip => (
            <span key={tip} style={{
              fontSize: 10, color: '#475569',
              background: 'rgba(255,255,255,0.04)',
              padding: '4px 10px', borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              {tip}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Victory / Defeat
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === 'victory' || phase === 'defeat') {
    const isVictory = phase === 'victory';
    const winCfg    = winner ? FACTIONS[winner] : null;
    const plCfg     = FACTIONS[playerFaction];
    return (
      <div style={{
        background: isVictory ? '#061809' : '#160407',
        minHeight: 480,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 18, borderRadius: 12, padding: 36,
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ fontSize: 52 }}>{isVictory ? '🏆' : '💀'}</div>
        <div style={{
          fontSize: 34, fontWeight: 900, letterSpacing: '0.04em',
          color: isVictory ? '#4ade80' : '#f87171',
        }}>
          {isVictory ? 'VICTORY!' : 'DEFEAT'}
        </div>
        {winCfg && (
          <div style={{ fontSize: 18, fontWeight: 600, color: winCfg.color }}>
            {winCfg.emoji} {winCfg.name} claims the battlefield
          </div>
        )}
        <div style={{
          fontSize: 13, color: '#94a3b8', textAlign: 'center', maxWidth: 380, lineHeight: 1.7,
        }}>
          {isVictory
            ? `Your ${plCfg.name} forces have crushed all opposition. Both enemy HQs lie in ruins.`
            : `Your HQ has been annihilated. ${winCfg?.name ?? 'An enemy'} dominates the field.`}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={() => setPhase('menu')}
            style={{
              background: '#1e293b', color: '#94a3b8',
              border: '1px solid #334155', padding: '10px 22px',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ← Menu
          </button>
          <button
            onClick={() => startGame(playerFaction)}
            style={{
              background: plCfg.color, color: '#000',
              border: 'none', padding: '10px 28px',
              borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Play Again {plCfg.emoji}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Playing
  // ─────────────────────────────────────────────────────────────────────────────
  const plCfg = FACTIONS[playerFaction];
  const tq    = hudData.trainQueue;

  // Build ability button label + status
  let abilityReady    = false;
  let abilityLabel    = '';
  let abilityStatus   = '';

  if (playerFaction === 'eams') {
    abilityReady  = hudData.researchCooldown <= 0 && hudData.researchLevel < 3
                    && hudData.credits >= RESEARCH_COST;
    abilityLabel  = `${plCfg.specialEmoji} Research Lv.${hudData.researchLevel + 1} (${RESEARCH_COST}💾)`;
    abilityStatus = hudData.researchLevel >= 3
      ? 'MAX LEVEL'
      : hudData.researchCooldown > 0
        ? `⏳ ${Math.ceil(hudData.researchCooldown)}s`
        : '✓ READY';
  } else if (playerFaction === 'idari') {
    abilityReady  = hudData.analyzeCooldown <= 0 && hudData.credits >= ANALYZE_COST;
    abilityLabel  = `${plCfg.specialEmoji} Analyze (${ANALYZE_COST}💾)`;
    abilityStatus = hudData.analyzeActive > 0
      ? `👁 ACTIVE ${Math.ceil(hudData.analyzeActive)}s`
      : hudData.analyzeCooldown > 0
        ? `⏳ ${Math.ceil(hudData.analyzeCooldown)}s`
        : '✓ READY';
  } else {
    abilityReady  = hudData.grooveCooldown <= 0 && hudData.credits >= GROOVE_COST;
    abilityLabel  = `${plCfg.specialEmoji} Groove (${GROOVE_COST}💾)`;
    abilityStatus = hudData.grooveActive > 0
      ? `🎶 GROOVING ${Math.ceil(hudData.grooveActive)}s`
      : hudData.grooveCooldown > 0
        ? `⏳ ${Math.ceil(hudData.grooveCooldown)}s`
        : '✓ READY';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Top HUD bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '7px 12px', background: '#0a0f1e', borderRadius: 8,
        border: `1px solid ${plCfg.color}33`,
      }}>
        {/* Player faction label */}
        <span style={{ color: plCfg.color, fontWeight: 700, fontSize: 13 }}>
          {plCfg.emoji} {plCfg.name}
        </span>

        <span style={{ color: '#1e293b', fontSize: 10 }}>│</span>

        {/* Resources */}
        <span style={{ color: '#14f5c8', fontWeight: 700, fontSize: 13 }}>
          💾 {Math.floor(hudData.credits).toLocaleString()}
        </span>

        <span style={{ color: '#1e293b', fontSize: 10 }}>│</span>

        {/* Per-faction status badges */}
        {(['eams', 'idari', 'boogie'] as FactionId[]).map(fid => {
          const fs = hudData.factionStatus[fid];
          const fc = FACTIONS[fid];
          const isPlayer = fid === playerFaction;
          return (
            <span key={fid} style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 999,
              background: fs.hq ? fc.color + '1e' : 'rgba(239,68,68,0.14)',
              border: `1px solid ${fs.hq ? fc.color + '55' : '#ef444455'}`,
              color: fs.hq ? fc.color : '#ef4444',
            }}>
              {fc.emoji} {isPlayer ? 'YOU' : fc.name.split(' ')[0]} {fs.units}u {fs.hq ? '✓' : '✗'}
            </span>
          );
        })}

        {/* Active effect indicator */}
        {playerFaction === 'eams' && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#38bdf8' }}>
            🔬 Research Lv.{hudData.researchLevel}/3
          </span>
        )}
        {playerFaction === 'idari' && hudData.analyzeActive > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#a78bfa', fontWeight: 700 }}>
            👁 SCANNING {Math.ceil(hudData.analyzeActive)}s
          </span>
        )}
        {playerFaction === 'boogie' && hudData.grooveActive > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>
            🎶 GROOVING {Math.ceil(hudData.grooveActive)}s
          </span>
        )}
      </div>

      {/* ── Canvas ── */}
      <div style={{
        position: 'relative', borderRadius: 8, overflow: 'hidden',
        border: `1px solid ${plCfg.color}44`,
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          style={{ display: 'block', width: '100%', cursor: 'crosshair', maxHeight: 460 }}
        />
      </div>

      {/* ── Bottom HUD — training + ability ── */}
      <div style={{
        display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center',
        padding: '8px 10px', background: '#0a0f1e', borderRadius: 8,
        border: `1px solid ${plCfg.color}22`,
      }}>
        {/* Train label */}
        <span style={{ color: '#475569', fontSize: 11, flexShrink: 0 }}>Train:</span>

        {/* Unit train buttons */}
        {(['basic', 'heavy', 'gatherer'] as UnitRole[]).map(role => {
          const st       = UNIT_STATS[role];
          const canAfford = hudData.credits >= st.cost;
          const busy      = !!tq;
          const off       = !canAfford || busy;
          return (
            <button
              key={role}
              onClick={() => trainUnit(role)}
              disabled={off}
              title={`Train ${plCfg.unitNames[role]} — ${st.hp}HP ${st.damage > 0 ? st.damage + 'ATK' : 'Gatherer'} | ${st.cost}💾 | ${st.trainTime}s`}
              style={{
                background:  off ? '#1e293b' : plCfg.color + '2e',
                color:       off ? '#475569' : plCfg.color,
                border:      `1px solid ${off ? '#334155' : plCfg.color + '77'}`,
                padding:     '5px 11px', borderRadius: 6,
                fontSize: 11, fontWeight: 600,
                cursor: off ? 'not-allowed' : 'pointer',
                opacity: off ? 0.58 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {plCfg.unitIcons[role]} {plCfg.unitNames[role]}
              <span style={{ opacity: 0.65 }}> {st.cost}💾</span>
            </button>
          );
        })}

        {/* Training progress */}
        {tq && (
          <span style={{
            color: '#94a3b8', fontSize: 11,
            background: '#1e293b', padding: '4px 10px', borderRadius: 6,
            border: '1px solid #334155',
          }}>
            ⌛ {plCfg.unitNames[tq.role]} — {Math.ceil(tq.timer)}s
            <span style={{
              display: 'inline-block', marginLeft: 6,
              width: 40, height: 4, background: '#334155',
              borderRadius: 2, verticalAlign: 'middle',
              position: 'relative',
            }}>
              {/* progress fill is a CSS approach — inline block trick */}
            </span>
          </span>
        )}

        {/* Select-all button */}
        <button
          onClick={selectAll}
          style={{
            background: '#1e293b', color: '#94a3b8',
            border: '1px solid #334155', padding: '5px 10px',
            borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}
        >
          All
        </button>

        {/* Special ability — pushed to right */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={useAbility}
            disabled={!abilityReady}
            style={{
              background:  abilityReady ? plCfg.color : '#1e293b',
              color:       abilityReady ? '#000' : '#475569',
              border:      `1px solid ${abilityReady ? plCfg.color : '#334155'}`,
              padding:     '5px 14px', borderRadius: 6,
              fontSize: 11, fontWeight: 700,
              cursor: abilityReady ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            {abilityLabel}
          </button>
          <span style={{
            fontSize: 10, color: plCfg.color, minWidth: 90,
            fontWeight: abilityStatus.startsWith('✓') || abilityStatus.includes('ACTIVE') || abilityStatus.includes('GROOVING') ? 700 : 400,
          }}>
            {abilityStatus}
          </span>
        </div>
      </div>

      {/* ── Controls reminder ── */}
      <div style={{ fontSize: 10, color: '#2d3748', textAlign: 'center', letterSpacing: '0.03em' }}>
        Left-click unit → select &nbsp;·&nbsp; Left-click ground/enemy → move/attack &nbsp;·&nbsp; Right-click → deselect &nbsp;·&nbsp; "All" → select all fighters
      </div>
    </div>
  );
}

'use client';

/**
 * DREAM FORCE: Operation Dream Protocol
 *
 * Year 2047. The NEXUS CORPS has activated the Dream Protocol — a neural
 * broadcast network that enslaves human consciousness. You command the
 * DREAM RESISTANCE. Destroy the Nexus Command Forge before the final
 * broadcast reaches critical power and ends free thought forever.
 *
 * Red Alert 2-inspired real-time strategy. Canvas-based, zero server deps.
 * Factions · Base Building · Resource Harvesting · Unit Production · AI
 * Detailed sprite rendering · Particle FX · Screen shake · Mini-map
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';

// ─────────────────────────────────────────────────────────────────────────────
//  Canvas / grid constants
// ─────────────────────────────────────────────────────────────────────────────
const CW   = 900;
const CH   = 600;
const T    = 40;                        // tile size (px)
const COLS = Math.floor(CW / T);        // 22
const ROWS = Math.floor(CH / T);        // 15

// ─────────────────────────────────────────────────────────────────────────────
//  Domain types
// ─────────────────────────────────────────────────────────────────────────────
type Faction      = 'resistance' | 'nexus';
type UnitType     = 'soldier' | 'tank' | 'harvester' | 'artillery';
type BuildingType = 'base' | 'barracks' | 'factory' | 'refinery' | 'powerplant';
type Phase        = 'briefing' | 'playing' | 'victory' | 'defeat';

interface Vec2 { x: number; y: number; }

interface Unit {
  id: number;
  type: UnitType;
  faction: Faction;
  pos: Vec2;
  hp: number; maxHp: number;
  moveTarget: Vec2 | null;
  attackTargetId: number | null;
  attackCooldown: number;
  harvesting: boolean;
  carryOre: number;
  facing: number;      // radians
  walkCycle: number;   // 0..1
  muzzleFlash: number; // seconds remaining
}

interface Building {
  id: number;
  type: BuildingType;
  faction: Faction;
  pos: Vec2;
  hp: number; maxHp: number;
  buildTimer: number; buildCost: number;
  radarAngle: number;
  lightPhase: number;
}

interface OreCell { x: number; y: number; amount: number; }

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  kind: 'spark' | 'smoke' | 'debris' | 'dust' | 'muzzle';
  r: number; g: number; b: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Balance constants
// ─────────────────────────────────────────────────────────────────────────────
const UNIT_STATS: Record<UnitType, {
  hp: number; speed: number; damage: number; range: number; cost: number;
  label: string; produceTime: number;
}> = {
  soldier:   { hp: 70,  speed: 1.2, damage: 12, range: 2.5, cost: 100, label: 'Striker',      produceTime: 6  },
  tank:      { hp: 280, speed: 0.7, damage: 50, range: 3.5, cost: 450, label: 'Liberator',    produceTime: 12 },
  harvester: { hp: 130, speed: 0.9, damage: 0,  range: 0,   cost: 220, label: 'Dream Hauler', produceTime: 8  },
  artillery: { hp: 90,  speed: 0.4, damage: 90, range: 5.5, cost: 650, label: 'Siege Cannon', produceTime: 18 },
};

const BUILDING_STATS: Record<BuildingType, {
  hp: number; cost: number; label: string; shortLabel: string;
  produces?: UnitType; buildTime: number; size: number;
}> = {
  base:       { hp: 700, cost: 0,   label: 'Command Forge',shortLabel:'CMD',   buildTime: 0,  size: 2   },
  powerplant: { hp: 200, cost: 200, label: 'Power Core',   shortLabel:'PWR',   buildTime: 5,  size: 1.5 },
  barracks:   { hp: 260, cost: 300, label: 'Combat Lab',   shortLabel:'LAB',   produces:'soldier',   buildTime: 8,  size: 1.5 },
  factory:    { hp: 400, cost: 600, label: 'War Forge',    shortLabel:'FORGE', produces:'tank',      buildTime: 15, size: 2   },
  refinery:   { hp: 320, cost: 400, label: 'Crystal Silo', shortLabel:'SILO',  produces:'harvester', buildTime: 10, size: 1.5 },
};

// Faction colour palettes
const FC = {
  resistance: { hi:'#22d3ee', mid:'#0891b2', lo:'#0e7490', accent:'#a5f3fc', dimGlow:'rgba(6,182,212,0.5)' },
  nexus:      { hi:'#f87171', mid:'#dc2626', lo:'#991b1b', accent:'#fca5a5', dimGlow:'rgba(220,38,38,0.5)'  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  ID generator
// ─────────────────────────────────────────────────────────────────────────────
let _uid = 1;
function uid() { return _uid++; }

// ─────────────────────────────────────────────────────────────────────────────
//  Math helpers
// ─────────────────────────────────────────────────────────────────────────────
function dist(a: Vec2, b: Vec2) { return Math.hypot(a.x - b.x, a.y - b.y); }

function toward(pos: Vec2, tgt: Vec2, spd: number): Vec2 {
  const d = dist(pos, tgt);
  if (d <= spd) return { ...tgt };
  return { x: pos.x + (tgt.x - pos.x) * spd / d, y: pos.y + (tgt.y - pos.y) * spd / d };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Initial game state
// ─────────────────────────────────────────────────────────────────────────────
function createGS() {
  _uid = 1;

  // terrain: 0=grass 1=dirt 2=forest 3=water
  const terrain: number[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      if ((c === 10 || c === 11) && r >= 1 && r <= 13) return 3; // river
      if ((c === 10 || c === 11) && (r === 4 || r === 10)) return 1; // bridges
      if (r >= 5 && r <= 9 && c >= 13 && c <= 16) return 2;  // forest E
      if (r >= 10 && r <= 13 && c >= 3 && c <= 6) return 2;  // forest W
      const n = (Math.sin(c * 0.91) * Math.cos(r * 1.07) + 1) * 0.5;
      return n < 0.1 ? 1 : 0;
    })
  );

  const ore: OreCell[] = [];
  for (const c of [{ x:6,y:3 },{ x:15,y:11 },{ x:4,y:11 },{ x:18,y:3 },{ x:14,y:7 }]) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = c.x + dx, ny = c.y + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && terrain[ny][nx] !== 3)
        ore.push({ x: nx, y: ny, amount: 300 + Math.random() * 200 });
    }
  }

  const mkB = (type: BuildingType, faction: Faction, x: number, y: number): Building => ({
    id: uid(), type, faction, pos: { x, y },
    hp: BUILDING_STATS[type].hp, maxHp: BUILDING_STATS[type].hp,
    buildTimer: 0, buildCost: BUILDING_STATS[type].cost,
    radarAngle: 0, lightPhase: Math.random() * Math.PI * 2,
  });

  const mkU = (type: UnitType, faction: Faction, x: number, y: number): Unit => ({
    id: uid(), type, faction, pos: { x, y },
    hp: UNIT_STATS[type].hp, maxHp: UNIT_STATS[type].hp,
    moveTarget: null, attackTargetId: null, attackCooldown: 0,
    harvesting: false, carryOre: 0,
    facing: faction === 'resistance' ? 0 : Math.PI,
    walkCycle: 0, muzzleFlash: 0,
  });

  const buildings: Building[] = [
    mkB('base',       'resistance', 1, 1),
    mkB('powerplant', 'resistance', 4, 1),
    mkB('barracks',   'resistance', 1, 4),
    mkB('refinery',   'resistance', 4, 4),
    mkB('base',       'nexus', COLS - 4, ROWS - 4),
    mkB('powerplant', 'nexus', COLS - 7, ROWS - 3),
    mkB('barracks',   'nexus', COLS - 4, ROWS - 7),
    mkB('refinery',   'nexus', COLS - 7, ROWS - 6),
  ];

  const units: Unit[] = [
    mkU('soldier',   'resistance', 3, 3),
    mkU('soldier',   'resistance', 3, 4),
    mkU('harvester', 'resistance', 6, 5),
    mkU('soldier',   'nexus', COLS - 4, ROWS - 5),
    mkU('soldier',   'nexus', COLS - 5, ROWS - 4),
    mkU('harvester', 'nexus', COLS - 7, ROWS - 7),
  ];

  return {
    terrain, ore, buildings, units,
    credits: { resistance: 1500, nexus: 1500 } as Record<Faction, number>,
    selected: [] as number[],
    buildQueue: {
      resistance: null as null | { type: BuildingType; timer: number; maxTimer: number },
      nexus:      null as null | { type: BuildingType; timer: number; maxTimer: number },
    },
    aiTimer: 0,
    tick: 0,
    particles: [] as Particle[],
    shake: 0,
    globalAnim: 0,
  };
}

type GS = ReturnType<typeof createGS>;

// ─────────────────────────────────────────────────────────────────────────────
//  Particle helpers
// ─────────────────────────────────────────────────────────────────────────────
function spawnExplosion(ps: Particle[], cx: number, cy: number, big: boolean) {
  const n = big ? 28 : 14;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const spd = 1 + Math.random() * (big ? 4 : 2.5);
    const roll = Math.random();
    if (roll < 0.4) {
      ps.push({ x:cx, y:cy, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd,
        life:0.5+Math.random()*0.5, maxLife:1, size:2+Math.random()*2,
        kind:'spark', r:255, g:180+Math.floor(Math.random()*75), b:0 });
    } else if (roll < 0.7) {
      ps.push({ x:cx, y:cy, vx:Math.cos(a)*spd*0.3, vy:Math.sin(a)*spd*0.3-0.5,
        life:1+Math.random(), maxLife:2, size:big?12+Math.random()*14:5+Math.random()*8,
        kind:'smoke', r:80, g:80, b:80 });
    } else {
      ps.push({ x:cx, y:cy, vx:Math.cos(a)*spd*1.5, vy:Math.sin(a)*spd*1.5-1,
        life:0.3+Math.random()*0.5, maxLife:0.8, size:2+Math.random()*4,
        kind:'debris', r:100+Math.floor(Math.random()*60), g:80, b:60 });
    }
  }
}

function spawnDust(ps: Particle[], cx: number, cy: number) {
  for (let i = 0; i < 2; i++) {
    const a = Math.random() * Math.PI * 2;
    ps.push({ x:cx+(Math.random()-0.5)*8, y:cy+(Math.random()-0.5)*8,
      vx:Math.cos(a)*0.3, vy:Math.sin(a)*0.3,
      life:0.3+Math.random()*0.3, maxLife:0.6, size:4+Math.random()*5,
      kind:'dust', r:160, g:140, b:100 });
  }
}

function spawnMuzzle(ps: Particle[], cx: number, cy: number, facing: number) {
  for (let i = 0; i < 5; i++) {
    const spread = (Math.random()-0.5)*0.5;
    const spd = 3+Math.random()*2;
    ps.push({ x:cx, y:cy, vx:Math.cos(facing+spread)*spd, vy:Math.sin(facing+spread)*spd,
      life:0.18, maxLife:0.18, size:2+Math.random()*3,
      kind:'muzzle', r:255, g:220, b:50 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Game step (logic)
// ─────────────────────────────────────────────────────────────────────────────
function stepGS(gs: GS, dt: number) {
  gs.tick++;
  gs.globalAnim += dt;
  gs.shake = Math.max(0, gs.shake - dt * 8);

  // Particles
  gs.particles = gs.particles.filter(p => {
    p.life -= dt;
    p.x += p.vx; p.y += p.vy;
    if (p.kind === 'smoke')        { p.vy -= 0.05; p.size += 0.12; }
    else if (p.kind === 'spark' || p.kind === 'debris') p.vy += 0.1;
    return p.life > 0;
  });

  // Building animations
  for (const b of gs.buildings) {
    b.radarAngle += dt * 1.8;
    b.lightPhase  += dt * 2.5;
  }

  // Units
  for (const unit of gs.units) {
    if (unit.attackCooldown > 0) unit.attackCooldown -= dt;
    if (unit.muzzleFlash  > 0) unit.muzzleFlash  -= dt;

    if (unit.type === 'harvester') {
      const oreCell = gs.ore.find(o => o.amount > 0 && dist({ x:o.x, y:o.y }, unit.pos) < 8);
      const refinery = gs.buildings.find(b => b.faction === unit.faction && b.type === 'refinery');
      if (unit.carryOre >= 100 && refinery) {
        const rPos = refinery.pos;
        if (dist(unit.pos, rPos) < 1.5) {
          gs.credits[unit.faction] += unit.carryOre;
          unit.carryOre = 0; unit.harvesting = false;
        } else {
          unit.facing = Math.atan2(rPos.y - unit.pos.y, rPos.x - unit.pos.x);
          unit.pos = toward(unit.pos, rPos, UNIT_STATS.harvester.speed * dt * 2);
          unit.walkCycle = (unit.walkCycle + dt * 3) % 1;
        }
      } else if (oreCell) {
        const oPos = { x: oreCell.x, y: oreCell.y };
        if (dist(unit.pos, oPos) < 1.2) {
          const h = Math.min(5, oreCell.amount);
          oreCell.amount -= h; unit.carryOre += h; unit.harvesting = true;
          if (oreCell.amount <= 0) gs.ore = gs.ore.filter(o => o !== oreCell);
        } else {
          unit.facing = Math.atan2(oreCell.y - unit.pos.y, oreCell.x - unit.pos.x);
          unit.pos = toward(unit.pos, oPos, UNIT_STATS.harvester.speed * dt * 2);
          unit.walkCycle = (unit.walkCycle + dt * 3) % 1;
        }
      }
      continue;
    }

    // Combat units
    if (unit.attackTargetId !== null) {
      const tgtUnit = gs.units.find(u => u.id === unit.attackTargetId);
      const tgtBldg = gs.buildings.find(b => b.id === unit.attackTargetId);
      const tPos    = tgtUnit?.pos ?? tgtBldg?.pos ?? null;
      if (!tPos) { unit.attackTargetId = null; continue; }

      const d     = dist(unit.pos, tPos);
      const range = UNIT_STATS[unit.type].range;
      unit.facing = Math.atan2(tPos.y - unit.pos.y, tPos.x - unit.pos.x);

      if (d <= range) {
        if (unit.attackCooldown <= 0) {
          unit.attackCooldown = unit.type === 'artillery' ? 2.5 : 0.8;
          unit.muzzleFlash = 0.12;
          const dmg = UNIT_STATS[unit.type].damage;
          const mpx = unit.pos.x * T + T / 2;
          const mpy = unit.pos.y * T + T / 2;
          spawnMuzzle(gs.particles, mpx, mpy, unit.facing);
          if (tgtUnit) {
            tgtUnit.hp -= dmg;
            spawnExplosion(gs.particles, tPos.x * T + T / 2, tPos.y * T + T / 2, false);
          } else if (tgtBldg) {
            tgtBldg.hp -= dmg;
            const bsize = BUILDING_STATS[tgtBldg.type].size;
            spawnExplosion(gs.particles, tPos.x * T + bsize * T / 2, tPos.y * T + bsize * T / 2, true);
            gs.shake = Math.min(gs.shake + 0.4, 2.5);
          }
        }
      } else {
        unit.pos = toward(unit.pos, tPos, UNIT_STATS[unit.type].speed * dt * 2);
        unit.walkCycle = (unit.walkCycle + dt * 4) % 1;
        if (gs.tick % 5 === 0) spawnDust(gs.particles, unit.pos.x * T + T / 2, unit.pos.y * T + T / 2);
      }
    } else if (unit.moveTarget) {
      if (dist(unit.pos, unit.moveTarget) < 0.4) {
        unit.moveTarget = null;
      } else {
        unit.facing = Math.atan2(unit.moveTarget.y - unit.pos.y, unit.moveTarget.x - unit.pos.x);
        unit.pos = toward(unit.pos, unit.moveTarget, UNIT_STATS[unit.type].speed * dt * 2);
        unit.walkCycle = (unit.walkCycle + dt * 4) % 1;
      }
    } else {
      const enemy: Faction = unit.faction === 'resistance' ? 'nexus' : 'resistance';
      const nearby = gs.units.find(u => u.faction === enemy && dist(u.pos, unit.pos) < 4);
      if (nearby) unit.attackTargetId = nearby.id;
    }
  }

  // Remove dead units
  for (const dead of gs.units.filter(u => u.hp <= 0)) {
    spawnExplosion(gs.particles, dead.pos.x * T + T / 2, dead.pos.y * T + T / 2, true);
    gs.shake = Math.min(gs.shake + 0.3, 2.5);
  }
  gs.units = gs.units.filter(u => u.hp > 0);

  // Remove dead buildings
  for (const dead of gs.buildings.filter(b => b.hp <= 0)) {
    const bsize = BUILDING_STATS[dead.type].size;
    spawnExplosion(gs.particles, dead.pos.x * T + bsize * T / 2, dead.pos.y * T + bsize * T / 2, true);
    gs.shake = Math.min(gs.shake + 1.2, 3.5);
  }
  gs.buildings = gs.buildings.filter(b => b.hp > 0);

  // Build queues (produce units)
  for (const faction of ['resistance', 'nexus'] as Faction[]) {
    const q = gs.buildQueue[faction];
    if (!q) continue;
    q.timer -= dt;
    if (q.timer <= 0) {
      const stats = BUILDING_STATS[q.type];
      const base = gs.buildings.find(b => b.faction === faction && b.type === 'base');
      if (base && stats.produces) {
        const ox = faction === 'resistance' ? 6 : COLS - 9;
        const oy = faction === 'resistance' ? 6 : ROWS - 9;
        const us = UNIT_STATS[stats.produces];
        gs.units.push({
          id: uid(), type: stats.produces, faction, pos: { x:ox, y:oy },
          hp: us.hp, maxHp: us.hp,
          moveTarget: null, attackTargetId: null, attackCooldown: 0,
          harvesting: false, carryOre: 0,
          facing: faction === 'resistance' ? 0 : Math.PI,
          walkCycle: 0, muzzleFlash: 0,
        });
      }
      gs.buildQueue[faction] = null;
    }
  }

  // Nexus AI
  gs.aiTimer -= dt;
  if (gs.aiTimer <= 0) {
    gs.aiTimer = 2.5 + Math.random() * 3;
    const resBase   = gs.buildings.find(b => b.faction === 'resistance' && b.type === 'base');
    const nexusUnits = gs.units.filter(u => u.faction === 'nexus' && u.type !== 'harvester');
    for (const u of nexusUnits) {
      if (resBase && u.attackTargetId === null) u.attackTargetId = resBase.id;
    }
    if (!gs.buildQueue.nexus && gs.credits.nexus >= 300 && nexusUnits.length < 14) {
      const pick  = Math.random() < 0.45 ? 'tank' : 'soldier';
      const bType: BuildingType = pick === 'tank' ? 'factory' : 'barracks';
      const hasBldg = gs.buildings.find(b => b.faction === 'nexus' && b.type === bType);
      if (hasBldg && gs.credits.nexus >= UNIT_STATS[pick as UnitType].cost) {
        gs.credits.nexus -= UNIT_STATS[pick as UnitType].cost;
        gs.buildQueue.nexus = { type: bType, timer: BUILDING_STATS[bType].buildTime, maxTimer: BUILDING_STATS[bType].buildTime };
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Terrain tile drawing
// ─────────────────────────────────────────────────────────────────────────────
function drawTile(ctx: CanvasRenderingContext2D, type: number, c: number, r: number, anim: number) {
  const x = c * T, y = r * T;
  if (type === 3) { // water
    const w = (Math.sin(anim * 1.5 + c * 0.7 + r * 0.5) * 0.12) + 0.88;
    ctx.fillStyle = `rgb(${Math.floor(12*w)},${Math.floor(55*w)},${Math.floor(130*w)})`;
    ctx.fillRect(x, y, T, T);
    ctx.strokeStyle = `rgba(120,200,255,${0.12 + Math.sin(anim*2+c-r)*0.06})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x+4,  y+T*0.33); ctx.quadraticCurveTo(x+T*0.5,y+T*0.33-3,x+T-4,y+T*0.33); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+6,  y+T*0.66); ctx.quadraticCurveTo(x+T*0.5,y+T*0.66-2,x+T-6,y+T*0.66); ctx.stroke();
    return;
  }
  if (type === 2) { // forest
    ctx.fillStyle = '#1a3a12'; ctx.fillRect(x, y, T, T);
    ctx.fillStyle = '#3d2a0e'; ctx.fillRect(x+T*0.5-2, y+T*0.5+2, 4, T*0.5-2);
    const g = ctx.createRadialGradient(x+T*0.5,y+T*0.5,2,x+T*0.5,y+T*0.5,T*0.45);
    g.addColorStop(0,'#52a020'); g.addColorStop(0.6,'#2e6412'); g.addColorStop(1,'#1a3a0a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x+T*0.5,y+T*0.5,T*0.42,0,Math.PI*2); ctx.fill();
    return;
  }
  if (type === 1) { // dirt
    ctx.fillStyle = '#7a5c3a'; ctx.fillRect(x, y, T, T);
    ctx.fillStyle = '#6e5030';
    for (let i = 0; i < 4; i++) {
      const px = x + 5 + (i*9 + c*3) % (T-8);
      const py = y + 3 + (i*7 + r*5) % (T-6);
      ctx.beginPath(); ctx.arc(px,py,2,0,Math.PI*2); ctx.fill();
    }
    return;
  }
  // grass
  ctx.fillStyle = ((c+r)%3===0)?'#2f5e1e':(((c*r)%5===0)?'#395f20':'#3a6b22');
  ctx.fillRect(x, y, T, T);
  if ((c + r*3) % 7 === 0) {
    ctx.strokeStyle = 'rgba(80,160,30,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x+6,y+T-4); ctx.lineTo(x+8,y+T-10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+T-8,y+T-5); ctx.lineTo(x+T-6,y+T-11); ctx.stroke();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Ore crystal cluster
// ─────────────────────────────────────────────────────────────────────────────
function drawOre(ctx: CanvasRenderingContext2D, o: OreCell, anim: number) {
  const x = o.x*T + T*0.5, y = o.y*T + T*0.5;
  const alpha = Math.min(1, o.amount/300);
  const pulse = 0.7 + Math.sin(anim*2 + o.x + o.y)*0.3;
  const grd = ctx.createRadialGradient(x,y,2,x,y,T*0.55);
  grd.addColorStop(0,`rgba(180,100,255,${alpha*0.55*pulse})`);
  grd.addColorStop(1,'rgba(100,60,200,0)');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x,y,T*0.55,0,Math.PI*2); ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = (i/5)*Math.PI*2 + anim*0.2;
    const len = (T*0.28 + (i%2)*T*0.1)*alpha;
    ctx.save(); ctx.translate(x,y); ctx.rotate(a);
    const sg = ctx.createLinearGradient(0,-len,0,0);
    sg.addColorStop(0,`rgba(220,180,255,${alpha*pulse})`);
    sg.addColorStop(1,`rgba(140,80,230,${alpha*0.6})`);
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.moveTo(-3,0); ctx.lineTo(0,-len); ctx.lineTo(3,0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Building sprites
// ─────────────────────────────────────────────────────────────────────────────
function drawBuilding(ctx: CanvasRenderingContext2D, b: Building, selected: boolean, anim: number) {
  const f  = FC[b.faction];
  const sz = BUILDING_STATS[b.type].size;
  const bx = b.pos.x*T, by = b.pos.y*T;
  const bw = sz*T,       bh = sz*T;
  const cx = bx+bw*0.5,  cy = by+bh*0.5;

  if (selected) {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.setLineDash([4,3]); ctx.strokeRect(bx-3,by-3,bw+6,bh+6); ctx.setLineDash([]);
  }
  // drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(bx+4,by+4,bw,bh);

  switch (b.type) {
    case 'base':       _drawBase(ctx,bx,by,bw,bh,cx,cy,f,b,anim); break;
    case 'powerplant': _drawPower(ctx,bx,by,bw,bh,cx,cy,f,b,anim); break;
    case 'barracks':   _drawBarracks(ctx,bx,by,bw,bh,cx,cy,f); break;
    case 'factory':    _drawFactory(ctx,bx,by,bw,bh,cx,cy,f,anim); break;
    case 'refinery':   _drawRefinery(ctx,bx,by,bw,bh,cx,cy,f,b,anim); break;
  }

  // HP bar
  const hp = b.hp/b.maxHp;
  ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(bx,by-7,bw,5);
  ctx.fillStyle = hp>0.6?'#22c55e':hp>0.3?'#f59e0b':'#ef4444';
  ctx.fillRect(bx,by-7,bw*hp,5);
  ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=0.5; ctx.strokeRect(bx,by-7,bw,5);
}

function _drawBase(ctx: CanvasRenderingContext2D, bx:number, by:number, bw:number, bh:number,
  cx:number, cy:number, f:typeof FC[Faction], b:Building, anim:number) {
  const grd = ctx.createLinearGradient(bx,by,bx+bw,by+bh);
  grd.addColorStop(0,f.mid); grd.addColorStop(0.5,f.lo); grd.addColorStop(1,'#0d0d1e');
  ctx.fillStyle=grd; ctx.fillRect(bx,by,bw,bh);
  ctx.strokeStyle=f.hi; ctx.lineWidth=2;
  ctx.strokeRect(bx+3,by+3,bw-6,bh-6);
  // cross panels
  ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(cx,by+3); ctx.lineTo(cx,by+bh-3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx+3,cy); ctx.lineTo(bx+bw-3,cy); ctx.stroke();
  // corner pillars
  for (const [ox,oy] of [[0,0],[bw-10,0],[0,bh-10],[bw-10,bh-10]] as [number,number][]) {
    ctx.fillStyle=f.hi;  ctx.fillRect(bx+ox,by+oy,10,10);
    ctx.fillStyle=f.accent; ctx.fillRect(bx+ox+2,by+oy+2,6,6);
  }
  // animated radar dish
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(b.radarAngle);
  ctx.strokeStyle=f.accent; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(bw*0.28,0); ctx.stroke();
  ctx.beginPath(); ctx.arc(0,0,bw*0.28,-Math.PI*0.35,Math.PI*0.35); ctx.stroke();
  ctx.restore();
  // blink light
  const blink = Math.sin(anim*4+b.lightPhase)>0;
  ctx.fillStyle=blink?'#22ff44':'#115522';
  ctx.beginPath(); ctx.arc(bx+7,by+7,3.5,0,Math.PI*2); ctx.fill();
}

function _drawPower(ctx: CanvasRenderingContext2D, bx:number, by:number, bw:number, bh:number,
  cx:number, cy:number, f:typeof FC[Faction], b:Building, anim:number) {
  ctx.fillStyle='#12122a'; ctx.fillRect(bx,by,bw,bh);
  ctx.strokeStyle=f.mid; ctx.lineWidth=1.5; ctx.strokeRect(bx+4,by+4,bw-8,bh-8);
  const pulse = 0.6+Math.sin(anim*3)*0.4;
  const isRes = f === FC.resistance;
  // energy rings
  ctx.strokeStyle=f.hi; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(cx,cy,bw*0.3*pulse,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx,cy,bw*0.18,0,Math.PI*2); ctx.stroke();
  // core
  const gg = ctx.createRadialGradient(cx,cy,2,cx,cy,bw*0.22);
  gg.addColorStop(0, isRes?`rgba(0,255,200,${pulse})`:`rgba(255,100,50,${pulse})`);
  gg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(cx,cy,bw*0.22,0,Math.PI*2); ctx.fill();
  // indicator lights
  for (let i=0;i<4;i++) {
    const a = i*Math.PI*0.5+anim;
    const blink = Math.sin(anim*5+i*1.5)>0.3;
    ctx.fillStyle = blink?f.accent:f.lo;
    ctx.beginPath(); ctx.arc(cx+Math.cos(a)*bw*0.38, cy+Math.sin(a)*bh*0.38,3.5,0,Math.PI*2); ctx.fill();
  }
  const blink2 = Math.sin(anim*4+b.lightPhase)>0;
  ctx.fillStyle=blink2?'#22ff44':'#115522';
  ctx.beginPath(); ctx.arc(bx+7,by+7,3,0,Math.PI*2); ctx.fill();
}

function _drawBarracks(ctx: CanvasRenderingContext2D, bx:number, by:number, bw:number, bh:number,
  cx:number, cy:number, f:typeof FC[Faction]) {
  // main body
  ctx.fillStyle='#1e2030'; ctx.fillRect(bx,by+bh*0.1,bw,bh*0.9);
  // roof strip
  ctx.fillStyle=f.lo; ctx.fillRect(bx,by,bw,bh*0.12);
  ctx.fillStyle=f.hi; ctx.fillRect(bx,by,bw,3);
  // windows
  ctx.fillStyle='rgba(255,240,100,0.75)';
  for (let i=0;i<3;i++) ctx.fillRect(bx+4+i*(bw/3-2),by+bh*0.23,bw/3-6,bh*0.2);
  // door
  ctx.fillStyle=f.mid; ctx.fillRect(cx-6,by+bh*0.6,12,bh*0.4);
  ctx.strokeStyle=f.accent; ctx.lineWidth=1; ctx.strokeRect(cx-6,by+bh*0.6,12,bh*0.4);
  // sandbags
  ctx.fillStyle='#8B7355';
  for (let i=0;i<5;i++) {
    ctx.beginPath(); ctx.ellipse(bx+4+i*(bw*0.19),by+bh-4,bw*0.09,4.5,0,0,Math.PI*2); ctx.fill();
  }
  // faction stripe
  ctx.fillStyle=f.hi; ctx.fillRect(bx+bw-6,by+bh*0.1,6,bh*0.9);
}

function _drawFactory(ctx: CanvasRenderingContext2D, bx:number, by:number, bw:number, bh:number,
  cx:number, cy:number, f:typeof FC[Faction], anim:number) {
  ctx.fillStyle='#141428'; ctx.fillRect(bx,by+bh*0.2,bw,bh*0.8);
  ctx.fillStyle=f.lo; ctx.fillRect(bx,by,bw,bh*0.22);
  ctx.fillStyle=f.hi; ctx.fillRect(bx,by,bw,3);
  // bay doors
  ctx.fillStyle=f.mid; ctx.fillRect(cx-bw*0.3,by+bh*0.55,bw*0.6,bh*0.45);
  ctx.fillStyle='#080812'; ctx.fillRect(cx-bw*0.28,by+bh*0.57,bw*0.56,bh*0.43);
  ctx.strokeStyle=f.hi; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(cx,by+bh*0.57); ctx.lineTo(cx,by+bh); ctx.stroke();
  // smokestack
  ctx.fillStyle='#2a2a2a'; ctx.fillRect(bx+bw*0.72,by-bh*0.15,bw*0.12,bh*0.38);
  for (let i=0;i<3;i++) {
    const sy = by-bh*0.15-5-i*8 - (anim*15)%30;
    const sa = Math.min(0.55,(30-(anim*15+i*10)%30)/30);
    ctx.fillStyle=`rgba(120,120,140,${sa})`;
    ctx.beginPath(); ctx.arc(bx+bw*0.78,sy,5+i*3,0,Math.PI*2); ctx.fill();
  }
  // gear icon
  ctx.strokeStyle=f.accent; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(bx+bw*0.23,cy,bw*0.11,0,Math.PI*2); ctx.stroke();
  // side ribs
  for (let i=0;i<3;i++) {
    ctx.fillStyle=i%2===0?f.lo:'#141428';
    ctx.fillRect(bx,by+bh*0.2+i*(bh*0.26),bw*0.08,bh*0.26);
  }
}

function _drawRefinery(ctx: CanvasRenderingContext2D, bx:number, by:number, bw:number, bh:number,
  cx:number, cy:number, f:typeof FC[Faction], b:Building, anim:number) {
  ctx.fillStyle='#101a10'; ctx.fillRect(bx,by,bw,bh);
  // dome tank
  const tr = bw*0.28;
  ctx.fillStyle=f.lo;
  ctx.beginPath(); ctx.arc(cx,cy-tr*0.1,tr,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=f.hi; ctx.lineWidth=1.5; ctx.stroke();
  const sg = ctx.createRadialGradient(cx-tr*0.3,cy-tr*0.4,0,cx,cy,tr);
  sg.addColorStop(0,'rgba(255,255,255,0.25)'); sg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(cx,cy,tr,0,Math.PI*2); ctx.fill();
  // ore glow
  const pulse = 0.4+Math.sin(anim*2.5)*0.3;
  ctx.fillStyle=`rgba(180,100,255,${pulse*0.5})`;
  ctx.beginPath(); ctx.arc(cx,cy,tr*0.5,0,Math.PI*2); ctx.fill();
  // conveyor arm + animated dots
  ctx.strokeStyle='#666'; ctx.lineWidth=4;
  ctx.beginPath(); ctx.moveTo(bx+bw*0.9,cy); ctx.lineTo(bx+bw+6,cy); ctx.stroke();
  for (let i=0;i<3;i++) {
    const dx = (anim*20+i*10)%25;
    ctx.fillStyle=f.accent; ctx.beginPath(); ctx.arc(bx+bw*0.9+dx,cy,2,0,Math.PI*2); ctx.fill();
  }
  // pipes
  ctx.strokeStyle=f.mid; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(bx+4,by+bh*0.7); ctx.lineTo(bx+4,by+bh); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx+bw-4,by+bh*0.7); ctx.lineTo(bx+bw-4,by+bh); ctx.stroke();
  const blink = Math.sin(anim*4+b.lightPhase)>0;
  ctx.fillStyle=blink?'#aa44ff':'#551177';
  ctx.beginPath(); ctx.arc(bx+7,by+7,3,0,Math.PI*2); ctx.fill();
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit sprites
// ─────────────────────────────────────────────────────────────────────────────
function drawUnit(ctx: CanvasRenderingContext2D, u: Unit, selected: boolean) {
  const f  = FC[u.faction];
  const px = u.pos.x*T + T*0.5;
  const py = u.pos.y*T + T*0.5;

  if (selected) {
    const r2 = u.type==='tank'?14:u.type==='harvester'?12:10;
    ctx.strokeStyle='#fff'; ctx.lineWidth=1.5;
    ctx.setLineDash([3,2]);
    ctx.beginPath(); ctx.arc(px,py,r2+3,0,Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.save(); ctx.translate(px,py);
  switch (u.type) {
    case 'soldier':   _drawSoldier(ctx,u,f); break;
    case 'tank':      _drawTank(ctx,u,f); break;
    case 'harvester': _drawHarvester(ctx,u,f); break;
    case 'artillery': _drawArtillery(ctx,u,f); break;
  }
  // muzzle flash
  if (u.muzzleFlash > 0) {
    const fx = Math.cos(u.facing)*15, fy = Math.sin(u.facing)*15;
    const mg = ctx.createRadialGradient(fx,fy,0,fx,fy,9);
    mg.addColorStop(0,'rgba(255,255,180,0.9)'); mg.addColorStop(1,'rgba(255,140,0,0)');
    ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(fx,fy,9,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // HP bar
  const hp = u.hp/u.maxHp;
  const bw = u.type==='tank'?26:18;
  ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(px-bw*0.5,py-17,bw,3);
  ctx.fillStyle=hp>0.6?'#22c55e':hp>0.3?'#f59e0b':'#ef4444';
  ctx.fillRect(px-bw*0.5,py-17,bw*hp,3);
}

function _drawSoldier(ctx: CanvasRenderingContext2D, u: Unit, f: typeof FC[Faction]) {
  const wc = Math.sin(u.walkCycle*Math.PI*2);
  ctx.save(); ctx.rotate(u.facing - Math.PI*0.5);
  // shadow
  ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0,8,6,3,0,0,Math.PI*2); ctx.fill();
  // legs
  ctx.fillStyle=f.lo;
  ctx.fillRect(-3, 2+wc*2, 2.5, 6);
  ctx.fillRect(0.5, 2-wc*2, 2.5, 6);
  // body armour
  const bg = ctx.createLinearGradient(-5,-8,5,4);
  bg.addColorStop(0,f.hi); bg.addColorStop(1,f.lo);
  ctx.fillStyle=bg;
  ctx.beginPath(); ctx.roundRect(-5,-9,10,13,2); ctx.fill();
  // head
  ctx.fillStyle=f.mid; ctx.beginPath(); ctx.arc(0,-13,4.5,0,Math.PI*2); ctx.fill();
  // visor
  ctx.fillStyle=f.accent; ctx.fillRect(-3,-15,6,3);
  // weapon
  ctx.strokeStyle='#bbb'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(3,-5); ctx.lineTo(15,-7); ctx.stroke();
  ctx.restore();
}

function _drawTank(ctx: CanvasRenderingContext2D, u: Unit, f: typeof FC[Faction]) {
  ctx.save(); ctx.rotate(u.facing - Math.PI*0.5);
  // shadow
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0,6,13,5,0,0,Math.PI*2); ctx.fill();
  // tracks
  ctx.fillStyle='#111';
  ctx.fillRect(-13,-11,5,23); ctx.fillRect(8,-11,5,23);
  ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=1;
  for (let i=-10;i<13;i+=5) {
    ctx.beginPath(); ctx.moveTo(-13,i); ctx.lineTo(-8,i); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8,i); ctx.lineTo(13,i); ctx.stroke();
  }
  // hull
  const hg = ctx.createLinearGradient(-8,-11,8,12);
  hg.addColorStop(0,f.mid); hg.addColorStop(1,f.lo);
  ctx.fillStyle=hg; ctx.beginPath(); ctx.roundRect(-8,-11,16,23,3); ctx.fill();
  ctx.strokeStyle=f.hi; ctx.lineWidth=1;
  ctx.strokeRect(-8,-11,16,23);
  ctx.beginPath(); ctx.moveTo(-8,4); ctx.lineTo(8,4); ctx.stroke();
  // turret
  const tg = ctx.createRadialGradient(0,-2,0,0,-2,8);
  tg.addColorStop(0,f.hi); tg.addColorStop(1,f.mid);
  ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(0,-2,8,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=f.accent; ctx.lineWidth=1; ctx.stroke();
  // barrel
  ctx.fillStyle='#555'; ctx.fillRect(-2.5,-22,5,15);
  ctx.fillStyle='#333'; ctx.fillRect(-1.5,-25,3,5);
  ctx.restore();
}

function _drawHarvester(ctx: CanvasRenderingContext2D, u: Unit, f: typeof FC[Faction]) {
  ctx.save(); ctx.rotate(u.facing - Math.PI*0.5);
  // shadow
  ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0,8,11,4,0,0,Math.PI*2); ctx.fill();
  // body
  const bg = ctx.createLinearGradient(-9,-11,9,13);
  bg.addColorStop(0,'#8a8a5a'); bg.addColorStop(1,'#5a5a30');
  ctx.fillStyle=bg; ctx.beginPath(); ctx.roundRect(-9,-11,18,22,3); ctx.fill();
  // cab
  ctx.fillStyle=f.lo; ctx.fillRect(-6,-15,12,8);
  ctx.fillStyle='rgba(100,200,255,0.5)'; ctx.fillRect(-4,-14,8,5);
  // scoop
  ctx.fillStyle='#666';
  ctx.beginPath(); ctx.moveTo(-8,-19); ctx.lineTo(8,-19); ctx.lineTo(11,-13); ctx.lineTo(-11,-13); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#999'; ctx.lineWidth=1; ctx.stroke();
  // wheels
  ctx.fillStyle='#1a1a1a';
  for (const wx of [-8,8]) {
    ctx.beginPath(); ctx.arc(wx,-6,4.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(wx, 6,4.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#444';
    ctx.beginPath(); ctx.arc(wx,-6,2.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(wx, 6,2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a1a1a';
  }
  // ore load indicator
  if (u.carryOre > 0) {
    const pct = u.carryOre/100;
    ctx.fillStyle=`rgba(180,100,255,${0.5+pct*0.5})`;
    ctx.fillRect(-7,-8+(1-pct)*16,14,pct*16);
  }
  ctx.restore();
}

function _drawArtillery(ctx: CanvasRenderingContext2D, u: Unit, f: typeof FC[Faction]) {
  ctx.save(); ctx.rotate(u.facing - Math.PI*0.5);
  // shadow
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0,8,14,5,0,0,Math.PI*2); ctx.fill();
  // support legs
  ctx.strokeStyle='#555'; ctx.lineWidth=3;
  for (const [lx,ly] of [[-11,11],[11,11],[-9,-9],[9,-9]] as [number,number][]) {
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(lx,ly); ctx.stroke();
  }
  // platform
  const pg = ctx.createLinearGradient(-11,-9,11,11);
  pg.addColorStop(0,f.mid); pg.addColorStop(1,f.lo);
  ctx.fillStyle=pg; ctx.beginPath(); ctx.roundRect(-11,-9,22,20,2); ctx.fill();
  ctx.strokeStyle=f.hi; ctx.lineWidth=1.5; ctx.stroke();
  // long barrel
  ctx.fillStyle='#3a3a3a'; ctx.fillRect(-3.5,-30,7,24);
  ctx.fillStyle='#222'; ctx.fillRect(-2,-33,4,6);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
//  Particles
// ─────────────────────────────────────────────────────────────────────────────
function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const t  = p.life / p.maxLife;
    const al = t;
    if (p.kind === 'smoke') {
      ctx.fillStyle=`rgba(${p.r},${p.g},${p.b},${al*0.45})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
    } else if (p.kind === 'spark') {
      ctx.strokeStyle=`rgba(${p.r},${p.g},${p.b},${al})`;
      ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-p.vx*3,p.y-p.vy*3); ctx.stroke();
    } else {
      ctx.fillStyle=`rgba(${p.r},${p.g},${p.b},${al})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(0.5,p.size*t),0,Math.PI*2); ctx.fill();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mini-map
// ─────────────────────────────────────────────────────────────────────────────
function drawMinimap(ctx: CanvasRenderingContext2D, gs: GS) {
  const mmW=110, mmH=74;
  const mx=CW-mmW-6, my=CH-mmH-6;
  const sx=mmW/COLS, sy=mmH/ROWS;
  ctx.fillStyle='rgba(0,0,0,0.78)'; ctx.fillRect(mx-2,my-2,mmW+4,mmH+4);
  ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1; ctx.strokeRect(mx-2,my-2,mmW+4,mmH+4);
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    const tp = gs.terrain[r][c];
    ctx.fillStyle = tp===3?'#0d3d6b':tp===2?'#1e3d14':tp===1?'#7a5c3a':'#3a6b22';
    ctx.fillRect(mx+c*sx,my+r*sy,sx,sy);
  }
  for (const o of gs.ore) { ctx.fillStyle='rgba(180,100,255,0.6)'; ctx.fillRect(mx+o.x*sx,my+o.y*sy,sx,sy); }
  for (const b of gs.buildings) {
    ctx.fillStyle = FC[b.faction].hi;
    ctx.fillRect(mx+b.pos.x*sx-1,my+b.pos.y*sy-1,4,4);
  }
  for (const u of gs.units) {
    ctx.fillStyle = FC[u.faction].accent;
    ctx.beginPath(); ctx.arc(mx+u.pos.x*sx+sx*0.5,my+u.pos.y*sy+sy*0.5,1.5,0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.font='8px monospace'; ctx.textAlign='left';
  ctx.fillText('TACTICAL MAP',mx+2,my-4);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Full draw pass
// ─────────────────────────────────────────────────────────────────────────────
function drawGS(ctx: CanvasRenderingContext2D, gs: GS, selected: number[]) {
  ctx.clearRect(0,0,CW,CH);
  if (gs.shake > 0) {
    const ox=(Math.random()-0.5)*gs.shake*4, oy=(Math.random()-0.5)*gs.shake*4;
    ctx.save(); ctx.translate(ox,oy);
  }
  // terrain
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) drawTile(ctx,gs.terrain[r][c],c,r,gs.globalAnim);
  // ore
  for (const o of gs.ore) drawOre(ctx,o,gs.globalAnim);
  // buildings (sorted Y)
  [...gs.buildings].sort((a,b)=>a.pos.y-b.pos.y).forEach(b=>drawBuilding(ctx,b,selected.includes(b.id),gs.globalAnim));
  // units (sorted Y)
  [...gs.units].sort((a,b)=>a.pos.y-b.pos.y).forEach(u=>drawUnit(ctx,u,selected.includes(u.id)));
  // particles
  drawParticles(ctx,gs.particles);
  if (gs.shake > 0) ctx.restore();
  // minimap (never shaken)
  drawMinimap(ctx,gs);
}

// ─────────────────────────────────────────────────────────────────────────────
//  React component
// ─────────────────────────────────────────────────────────────────────────────
export default function RTSGame() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gsRef      = useRef<GS>(createGS());
  const rafRef     = useRef<number>(0);
  const lastRef    = useRef<number>(0);
  const selRef     = useRef<number[]>([]);

  const [phase,      setPhase]      = useState<Phase>('briefing');
  const [credits,    setCredits]    = useState(1500);
  const [unitCounts, setUnitCounts] = useState({ player:0, enemy:0 });
  const [buildQueue, setBuildQueue] = useState<GS['buildQueue']['resistance']>(null);
  const [briefPage,  setBriefPage]  = useState(0);
  const submitScore = useSubmitScore('rts');

  useEffect(() => {
    if (phase === 'victory') submitScore(1000);
    if (phase === 'defeat')  submitScore(100);
  }, [phase, submitScore]);

  const startGame = useCallback(() => {
    _uid = 1;
    gsRef.current = createGS();
    selRef.current = [];
    setPhase('playing');
    setCredits(1500);
    setBuildQueue(null);
    setBriefPage(0);
  }, []);

  // auto-start support
  useGameAutoStart(phase === 'briefing' ? startGame : null);

  // main game loop
  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    lastRef.current = performance.now();

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      const gs = gsRef.current;
      stepGS(gs, dt);
      drawGS(ctx, gs, selRef.current);

      if (gs.tick % 30 === 0) {
        setCredits(gs.credits.resistance);
        setUnitCounts({
          player: gs.units.filter(u=>u.faction==='resistance').length,
          enemy:  gs.units.filter(u=>u.faction==='nexus').length,
        });
        setBuildQueue({ ...gs.buildQueue.resistance } as GS['buildQueue']['resistance']);
        const resBase  = gs.buildings.find(b=>b.faction==='resistance'&&b.type==='base');
        const nexBase  = gs.buildings.find(b=>b.faction==='nexus'&&b.type==='base');
        if (!nexBase)  { running=false; setPhase('victory'); }
        else if (!resBase) { running=false; setPhase('defeat'); }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { running=false; cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const gs   = gsRef.current;
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx   = CW / rect.width, sy = CH / rect.height;
    const px   = (e.clientX - rect.left) * sx;
    const py   = (e.clientY - rect.top)  * sy;
    const gx   = px / T, gy = py / T;

    const clickedAllied = gs.units.find(u=>
      u.faction==='resistance' && Math.abs(u.pos.x-gx)<1 && Math.abs(u.pos.y-gy)<1
    );
    if (clickedAllied) { selRef.current=[clickedAllied.id]; gs.selected=[clickedAllied.id]; return; }

    if (selRef.current.length > 0) {
      const clickedEnemyUnit = gs.units.find(u=>
        u.faction==='nexus' && Math.abs(u.pos.x-gx)<1 && Math.abs(u.pos.y-gy)<1
      );
      const clickedEnemyBldg = gs.buildings.find(b=>
        b.faction==='nexus' && gx>=b.pos.x && gx<b.pos.x+BUILDING_STATS[b.type].size &&
        gy>=b.pos.y && gy<b.pos.y+BUILDING_STATS[b.type].size
      );
      for (const id of selRef.current) {
        const unit = gs.units.find(u=>u.id===id);
        if (!unit) continue;
        if (clickedEnemyUnit)  { unit.attackTargetId=clickedEnemyUnit.id; unit.moveTarget=null; }
        else if (clickedEnemyBldg) { unit.attackTargetId=clickedEnemyBldg.id; unit.moveTarget=null; }
        else { unit.attackTargetId=null; unit.moveTarget={ x:gx, y:gy }; }
      }
    }
  }, []);

  const queueUnit = useCallback((type: UnitType) => {
    const gs   = gsRef.current;
    const cost = UNIT_STATS[type].cost;
    if (gs.credits.resistance < cost) return;
    const bType: BuildingType = type==='tank'?'factory':type==='harvester'?'refinery':type==='artillery'?'factory':'barracks';
    if (!gs.buildings.find(b=>b.faction==='resistance'&&b.type===bType)) return;
    if (gs.buildQueue.resistance) return;
    gs.credits.resistance -= cost;
    const stats = BUILDING_STATS[bType];
    gs.buildQueue.resistance = { type:bType, timer:stats.buildTime, maxTimer:stats.buildTime };
  }, []);

  // ── Briefing screen ───────────────────────────────────────────────────────
  if (phase === 'briefing') {
    const pages = [
      {
        title: 'DREAM FORCE',
        sub: 'Operation: Dream Protocol',
        body: [
          'YEAR 2047. The NEXUS CORPS has activated the Dream Protocol — a global',
          'neural broadcast array that enslaves human consciousness through',
          'encrypted sleep signals. 94% of Earth\'s population is now compliant.',
          '',
          'You are General KAEL, commander of the last free cell:',
          'the DREAM RESISTANCE.',
        ],
        color: '#22d3ee',
      },
      {
        title: 'YOUR MISSION',
        sub: 'Destroy the Nexus Command Forge',
        body: [
          '▸ Build your Command Forge and expand your base.',
          '▸ Train Strikers and Liberator Tanks to push the front.',
          '▸ Deploy Dream Haulers to mine Crystal Energy.',
          '▸ Unlock the Siege Cannon to crack Nexus defenses.',
          '',
          'Destroy the NEXUS COMMAND FORGE to win.',
          'Do NOT let them destroy yours.',
        ],
        color: '#f59e0b',
      },
    ];
    const pg = pages[briefPage];
    return (
      <div style={{ background:'linear-gradient(135deg,#050d18,#0d1a2e)', minHeight:420, borderRadius:12, padding:32, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, border:'1px solid rgba(34,211,238,0.2)', position:'relative', overflow:'hidden' }}>
        {/* scan lines */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)', pointerEvents:'none' }} />
        <div style={{ fontSize:11, letterSpacing:'0.3em', color:'rgba(34,211,238,0.6)', textTransform:'uppercase' }}>// CLASSIFIED INTEL PACKAGE //</div>
        <div style={{ fontSize:28, fontWeight:900, color:pg.color, textShadow:`0 0 30px ${pg.color}88`, letterSpacing:'0.06em', textAlign:'center' }}>{pg.title}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', letterSpacing:'0.15em' }}>{pg.sub.toUpperCase()}</div>
        <div style={{ background:'rgba(0,0,0,0.4)', border:`1px solid ${pg.color}33`, borderRadius:8, padding:'16px 24px', maxWidth:480, width:'100%' }}>
          {pg.body.map((line, i) => (
            <div key={i} style={{ fontSize:12, color:'#d1faf6', lineHeight:1.8, fontFamily:'monospace' }}>{line}</div>
          ))}
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          {briefPage > 0 && (
            <button onClick={()=>setBriefPage(p=>p-1)} style={{ background:'rgba(255,255,255,0.08)', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.15)', padding:'8px 18px', borderRadius:6, fontSize:12, cursor:'pointer' }}>← Back</button>
          )}
          {briefPage < pages.length-1 ? (
            <button onClick={()=>setBriefPage(p=>p+1)} style={{ background:`linear-gradient(135deg,${pg.color}30,${pg.color}15)`, color:pg.color, border:`1px solid ${pg.color}50`, padding:'10px 24px', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer', letterSpacing:'0.05em' }}>Next ▶</button>
          ) : (
            <button onClick={startGame} style={{ background:`linear-gradient(135deg,#22d3ee,#0891b2)`, color:'#000', border:'none', padding:'12px 32px', borderRadius:8, fontSize:15, fontWeight:900, cursor:'pointer', letterSpacing:'0.06em', boxShadow:'0 0 20px rgba(34,211,238,0.4)' }}>⚡ DEPLOY FORCES</button>
          )}
        </div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>CLICK UNIT → SELECT · CLICK MAP → MOVE · CLICK RED → ATTACK</div>
      </div>
    );
  }

  // ── Victory / Defeat ─────────────────────────────────────────────────────
  if (phase === 'victory' || phase === 'defeat') {
    const win = phase === 'victory';
    return (
      <div style={{ background: win?'linear-gradient(135deg,#022c22,#064e3b)':'linear-gradient(135deg,#1c0505,#450a0a)', minHeight:420, borderRadius:12, padding:32, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:18, border:`1px solid ${win?'rgba(34,197,94,0.3)':'rgba(248,113,113,0.3)'}` }}>
        <div style={{ fontSize:48 }}>{win?'🏆':'💀'}</div>
        <div style={{ fontSize:36, fontWeight:900, color:win?'#4ade80':'#f87171', textShadow:`0 0 30px ${win?'#4ade80':'#f87171'}88` }}>{win?'DREAM RESISTANCE WINS':'DREAM PROTOCOL ACTIVATED'}</div>
        <div style={{ fontSize:14, color:'#d1d5db', textAlign:'center', maxWidth:380, lineHeight:1.7 }}>
          {win
            ? 'The NEXUS Command Forge has been reduced to ash. Neural broadcast arrays offline. Free thought restored. The Dream lives.'
            : 'Your Command Forge is destroyed. The Dream Protocol has reached critical power. Resistance is... terminated. For now.'}
        </div>
        <button onClick={startGame} style={{ background:win?'linear-gradient(135deg,#22c55e,#16a34a)':'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', border:'none', padding:'12px 28px', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', letterSpacing:'0.04em' }}>
          ↺ DEPLOY AGAIN
        </button>
      </div>
    );
  }

  // ── Playing HUD ───────────────────────────────────────────────────────────
  const bqLabel = buildQueue
    ? `${BUILDING_STATS[buildQueue.type].label} → ${BUILDING_STATS[buildQueue.type].produces ? UNIT_STATS[BUILDING_STATS[buildQueue.type].produces!].label : '?'} (${Math.ceil(buildQueue.timer)}s)`
    : null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {/* ── top HUD bar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 12px', background:'linear-gradient(90deg,#050d18,#0d1a2e)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:8, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:11, color:'rgba(34,211,238,0.6)', letterSpacing:'0.1em', fontFamily:'monospace' }}>CREDITS</span>
          <span style={{ fontSize:14, fontWeight:800, color:'#a5f3fc', fontFamily:'monospace' }}>{'▲'} {credits.toLocaleString()}</span>
        </div>
        <span style={{ color:'rgba(255,255,255,0.15)', fontSize:10 }}>│</span>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#22d3ee', display:'inline-block' }} />
          <span style={{ fontSize:11, color:'#a5f3fc' }}>RESISTANCE {unitCounts.player}</span>
        </div>
        <span style={{ color:'rgba(255,255,255,0.15)', fontSize:10 }}>│</span>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#f87171', display:'inline-block' }} />
          <span style={{ fontSize:11, color:'#fca5a5' }}>NEXUS {unitCounts.enemy}</span>
        </div>
        {bqLabel && (
          <div style={{ marginLeft:'auto', fontSize:10, color:'#fbbf24', background:'rgba(251,191,36,0.1)', padding:'2px 8px', borderRadius:4, border:'1px solid rgba(251,191,36,0.2)', fontFamily:'monospace' }}>
            ⚙ PRODUCING: {bqLabel}
          </div>
        )}
      </div>

      {/* ── canvas ── */}
      <div style={{ position:'relative', borderRadius:8, overflow:'hidden', border:'2px solid rgba(34,211,238,0.25)', boxShadow:'0 0 30px rgba(34,211,238,0.08)' }}>
        <canvas
          ref={canvasRef}
          width={CW} height={CH}
          onClick={handleCanvasClick}
          style={{ display:'block', width:'100%', cursor:'crosshair', maxHeight:480 }}
        />
      </div>

      {/* ── build panel ── */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', padding:'6px 2px', alignItems:'center' }}>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em', fontFamily:'monospace' }}>TRAIN UNIT:</span>
        {([
          { type:'soldier'   as UnitType, icon:'⚔', label:'STRIKER',   cost:UNIT_STATS.soldier.cost   },
          { type:'tank'      as UnitType, icon:'🔲', label:'LIBERATOR', cost:UNIT_STATS.tank.cost      },
          { type:'harvester' as UnitType, icon:'⬡', label:'HAULER',    cost:UNIT_STATS.harvester.cost },
          { type:'artillery' as UnitType, icon:'💥', label:'SIEGE',     cost:UNIT_STATS.artillery.cost },
        ]).map(btn => {
          const canAfford = credits >= btn.cost;
          const busy      = !!buildQueue;
          return (
            <button
              key={btn.type}
              onClick={()=>queueUnit(btn.type)}
              disabled={!canAfford || busy}
              style={{
                background: canAfford && !busy
                  ? 'linear-gradient(135deg,rgba(34,211,238,0.2),rgba(8,145,178,0.15))'
                  : 'rgba(255,255,255,0.04)',
                color: canAfford && !busy ? '#a5f3fc' : '#4b5563',
                border: `1px solid ${canAfford && !busy ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.08)'}`,
                padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:700,
                cursor: canAfford && !busy ? 'pointer' : 'not-allowed',
                letterSpacing:'0.05em', fontFamily:'monospace',
              }}
            >
              {btn.icon} {btn.label} <span style={{ color:'rgba(255,255,255,0.4)', fontSize:10 }}>${btn.cost}</span>
            </button>
          );
        })}
        <span style={{ marginLeft:'auto', fontSize:9, color:'rgba(255,255,255,0.2)', fontFamily:'monospace' }}>
          SELECT → CLICK UNIT  ·  MOVE → CLICK GROUND  ·  ATTACK → CLICK RED
        </span>
      </div>
    </div>
  );
}

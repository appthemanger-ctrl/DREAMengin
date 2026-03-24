'use client';

/**
 * RTSGame — Command & Conquer: Red Alert 2 style real-time strategy game.
 * Canvas-based, runs entirely in the browser with no server dependencies.
 * Supports: base building, unit production, resource gathering, combat, AI opponent.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSubmitScore } from '@/lib/games/hooks';

const CANVAS_W = 900;
const CANVAS_H = 600;
const TILE = 40;
const COLS = Math.floor(CANVAS_W / TILE);
const ROWS = Math.floor(CANVAS_H / TILE);

type Faction = 'allies' | 'soviet';
type UnitType = 'soldier' | 'tank' | 'harvester';
type BuildingType = 'base' | 'barracks' | 'factory' | 'refinery' | 'powerplant';
type Phase = 'menu' | 'playing' | 'victory' | 'defeat';

interface Vec2 { x: number; y: number; }

interface Unit {
  id: number;
  type: UnitType;
  faction: Faction;
  pos: Vec2;          // grid coords (fractional during movement)
  hp: number;
  maxHp: number;
  /** Move-to destination (grid coords). Null when idle or in combat range. */
  moveTarget: Vec2 | null;
  /** ID of enemy unit or building to attack. Null when no target. */
  attackTargetId: number | null;
  attackCooldown: number;
  harvesting: boolean;
  carryOre: number;
}

interface Building {
  id: number;
  type: BuildingType;
  faction: Faction;
  pos: Vec2;
  hp: number;
  maxHp: number;
  buildTimer: number;
  buildCost: number;
}

interface OreCell { x: number; y: number; amount: number; }

const UNIT_STATS: Record<UnitType, { hp: number; speed: number; damage: number; range: number; cost: number; label: string }> = {
  soldier:   { hp: 50,  speed: 1,   damage: 8,  range: 2, cost: 100, label: 'GI / Conscript' },
  tank:      { hp: 200, speed: 0.6, damage: 35, range: 3, cost: 400, label: 'Tank' },
  harvester: { hp: 100, speed: 0.8, damage: 0,  range: 0, cost: 200, label: 'Ore Truck' },
};

const BUILDING_STATS: Record<BuildingType, { hp: number; cost: number; label: string; produces?: UnitType; buildTime: number }> = {
  base:       { hp: 500, cost: 0,    label: 'Construction Yard', buildTime: 0 },
  powerplant: { hp: 150, cost: 200,  label: 'Power Plant',       buildTime: 5 },
  barracks:   { hp: 200, cost: 300,  label: 'Barracks',          produces: 'soldier', buildTime: 8 },
  factory:    { hp: 300, cost: 600,  label: 'War Factory',       produces: 'tank',    buildTime: 15 },
  refinery:   { hp: 250, cost: 400,  label: 'Ore Refinery',      produces: 'harvester', buildTime: 10 },
};

const COLORS: Record<Faction, { primary: string; secondary: string; unit: string }> = {
  allies: { primary: '#3b82f6', secondary: '#1d4ed8', unit: '#60a5fa' },
  soviet: { primary: '#dc2626', secondary: '#991b1b', unit: '#f87171' },
};

const TERRAIN_COLOR: Record<number, string> = {
  0: '#3d5a2a',  // grass
  1: '#8B7355',  // dirt
  2: '#1a3a1a',  // forest
  3: '#2a4a2a',  // forest dark
};

let nextId = 1;
function uid() { return nextId++; }

function dist(a: Vec2, b: Vec2) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function moveToward(pos: Vec2, target: Vec2, speed: number): Vec2 {
  const d = dist(pos, target);
  if (d < speed) return { ...target };
  const ratio = speed / d;
  return { x: pos.x + (target.x - pos.x) * ratio, y: pos.y + (target.y - pos.y) * ratio };
}

function createInitialState() {
  // Map terrain
  const terrain: number[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      if ((r > 5 && r < 9) && (c > 8 && c < 14)) return 2;
      if ((r > 10 && r < 14) && (c > 14 && c < 20)) return 2;
      return Math.random() < 0.15 ? 1 : 0;
    })
  );

  // Ore fields
  const ore: OreCell[] = [];
  const oreCenters = [{ x: 10, y: 4 }, { x: 12, y: 12 }, { x: 3, y: 8 }, { x: 18, y: 3 }];
  for (const c of oreCenters) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = c.x + dx; const ny = c.y + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
          ore.push({ x: nx, y: ny, amount: 300 + Math.random() * 200 });
        }
      }
    }
  }

  const buildings: Building[] = [
    { id: uid(), type: 'base', faction: 'allies', pos: { x: 1, y: 1 }, hp: 500, maxHp: 500, buildTimer: 0, buildCost: 0 },
    { id: uid(), type: 'powerplant', faction: 'allies', pos: { x: 3, y: 1 }, hp: 150, maxHp: 150, buildTimer: 0, buildCost: 0 },
    { id: uid(), type: 'barracks', faction: 'allies', pos: { x: 1, y: 3 }, hp: 200, maxHp: 200, buildTimer: 0, buildCost: 0 },
    { id: uid(), type: 'refinery', faction: 'allies', pos: { x: 3, y: 3 }, hp: 250, maxHp: 250, buildTimer: 0, buildCost: 0 },

    { id: uid(), type: 'base', faction: 'soviet', pos: { x: COLS - 3, y: ROWS - 3 }, hp: 500, maxHp: 500, buildTimer: 0, buildCost: 0 },
    { id: uid(), type: 'powerplant', faction: 'soviet', pos: { x: COLS - 5, y: ROWS - 3 }, hp: 150, maxHp: 150, buildTimer: 0, buildCost: 0 },
    { id: uid(), type: 'barracks', faction: 'soviet', pos: { x: COLS - 3, y: ROWS - 5 }, hp: 200, maxHp: 200, buildTimer: 0, buildCost: 0 },
    { id: uid(), type: 'refinery', faction: 'soviet', pos: { x: COLS - 5, y: ROWS - 5 }, hp: 250, maxHp: 250, buildTimer: 0, buildCost: 0 },
  ];

  const units: Unit[] = [
    { id: uid(), type: 'soldier', faction: 'allies', pos: { x: 2, y: 2 }, hp: 50, maxHp: 50, moveTarget: null, attackTargetId: null, attackCooldown: 0, harvesting: false, carryOre: 0 },
    { id: uid(), type: 'soldier', faction: 'allies', pos: { x: 2, y: 3 }, hp: 50, maxHp: 50, moveTarget: null, attackTargetId: null, attackCooldown: 0, harvesting: false, carryOre: 0 },
    { id: uid(), type: 'harvester', faction: 'allies', pos: { x: 4, y: 4 }, hp: 100, maxHp: 100, moveTarget: null, attackTargetId: null, attackCooldown: 0, harvesting: false, carryOre: 0 },

    { id: uid(), type: 'soldier', faction: 'soviet', pos: { x: COLS - 3, y: ROWS - 4 }, hp: 50, maxHp: 50, moveTarget: null, attackTargetId: null, attackCooldown: 0, harvesting: false, carryOre: 0 },
    { id: uid(), type: 'soldier', faction: 'soviet', pos: { x: COLS - 4, y: ROWS - 3 }, hp: 50, maxHp: 50, moveTarget: null, attackTargetId: null, attackCooldown: 0, harvesting: false, carryOre: 0 },
    { id: uid(), type: 'harvester', faction: 'soviet', pos: { x: COLS - 5, y: ROWS - 6 }, hp: 100, maxHp: 100, moveTarget: null, attackTargetId: null, attackCooldown: 0, harvesting: false, carryOre: 0 },
  ];

  return {
    terrain,
    ore,
    buildings,
    units,
    credits: { allies: 1500, soviet: 1500 },
    selected: [] as number[],
    buildQueue: { allies: null as null | { type: BuildingType; timer: number; maxTimer: number }, soviet: null as null | { type: BuildingType; timer: number; maxTimer: number } },
    aiTimer: 0,
    tick: 0,
    explosions: [] as { x: number; y: number; r: number; maxR: number; alpha: number }[],
  };
}

type GameState = ReturnType<typeof createInitialState>;

function stepGame(state: GameState, dt: number) {
  state.tick++;
  const T = TILE;

  // Update explosions
  state.explosions = state.explosions
    .map(e => ({ ...e, r: e.r + 1.5, alpha: e.alpha - 0.04 }))
    .filter(e => e.alpha > 0);

  // Unit logic
  for (const unit of state.units) {
    if (unit.attackCooldown > 0) unit.attackCooldown -= dt;

    if (unit.type === 'harvester') {
      // Find nearest ore
      const oreCell = state.ore.find(o => o.amount > 0 && dist({ x: o.x, y: o.y }, unit.pos) < 8);
      const refinery = state.buildings.find(b => b.faction === unit.faction && b.type === 'refinery');

      if (unit.carryOre >= 100 && refinery) {
        // Return to refinery
        const rPos = refinery.pos;
        if (dist(unit.pos, rPos) < 1.5) {
          state.credits[unit.faction] += unit.carryOre;
          unit.carryOre = 0;
          unit.harvesting = false;
        } else {
          unit.pos = moveToward(unit.pos, rPos, UNIT_STATS.harvester.speed * dt * 2);
        }
      } else if (oreCell) {
        if (dist(unit.pos, oreCell) < 1.2) {
          // Harvest
          const harvest = Math.min(5, oreCell.amount);
          oreCell.amount -= harvest;
          unit.carryOre += harvest;
          unit.harvesting = true;
          if (oreCell.amount <= 0) state.ore = state.ore.filter(o => o !== oreCell);
        } else {
          unit.pos = moveToward(unit.pos, oreCell, UNIT_STATS.harvester.speed * dt * 2);
        }
      }
      continue;
    }

    // Combat units
    if (unit.attackTargetId !== null) {
      const targetUnit     = state.units.find(u => u.id === unit.attackTargetId);
      const targetBuilding = state.buildings.find(b => b.id === unit.attackTargetId);
      const tPos = targetUnit?.pos ?? targetBuilding?.pos ?? null;

      if (!tPos) {
        // Target gone — clear and let auto-attack pick a new one
        unit.attackTargetId = null;
        continue;
      }

      const d = dist(unit.pos, tPos);
      const range = UNIT_STATS[unit.type].range;

      if (d <= range) {
        // In range — attack
        if (unit.attackCooldown <= 0) {
          unit.attackCooldown = 1 / dt / 2;
          if (targetUnit) {
            targetUnit.hp -= UNIT_STATS[unit.type].damage;
            state.explosions.push({ x: tPos.x * T + T / 2, y: tPos.y * T + T / 2, r: 2, maxR: 12, alpha: 0.8 });
          } else if (targetBuilding) {
            targetBuilding.hp -= UNIT_STATS[unit.type].damage;
            state.explosions.push({ x: tPos.x * T + T * 1.5, y: tPos.y * T + T * 1.5, r: 3, maxR: 20, alpha: 0.9 });
          }
        }
      } else {
        // Move toward attack target
        unit.pos = moveToward(unit.pos, tPos, UNIT_STATS[unit.type].speed * dt * 2);
      }
    } else if (unit.moveTarget) {
      // Move-to order (no attack target)
      if (dist(unit.pos, unit.moveTarget) < 0.4) {
        unit.moveTarget = null;
      } else {
        unit.pos = moveToward(unit.pos, unit.moveTarget, UNIT_STATS[unit.type].speed * dt * 2);
      }
    } else {
      // Idle — auto-attack nearby enemies
      const enemyFaction: Faction = unit.faction === 'allies' ? 'soviet' : 'allies';
      const nearby = state.units.find(u => u.faction === enemyFaction && dist(u.pos, unit.pos) < 4);
      if (nearby) unit.attackTargetId = nearby.id;
    }
  }

  // Remove dead units
  const deadUnits = state.units.filter(u => u.hp <= 0);
  for (const dead of deadUnits) {
    state.explosions.push({ x: dead.pos.x * T + T / 2, y: dead.pos.y * T + T / 2, r: 5, maxR: 25, alpha: 1 });
  }
  state.units = state.units.filter(u => u.hp > 0);

  // Remove dead buildings
  const deadBuildings = state.buildings.filter(b => b.hp <= 0);
  for (const dead of deadBuildings) {
    state.explosions.push({ x: dead.pos.x * T + T * 1.5, y: dead.pos.y * T + T * 1.5, r: 8, maxR: 40, alpha: 1 });
  }
  state.buildings = state.buildings.filter(b => b.hp > 0);

  // Build queue
  for (const faction of ['allies', 'soviet'] as Faction[]) {
    const q = state.buildQueue[faction];
    if (q) {
      q.timer -= dt;
      if (q.timer <= 0) {
        const stats = BUILDING_STATS[q.type];
        const base = state.buildings.find(b => b.faction === faction && b.type === 'base');
        if (base) {
          const offsetX = faction === 'allies' ? 5 : COLS - 8;
          const offsetY = faction === 'allies' ? 1 : ROWS - 8;
          // Produce unit if it's a unit-producing building type
          if (stats.produces) {
            state.units.push({
              id: uid(),
              type: stats.produces,
              faction,
              pos: { x: offsetX, y: offsetY },
              hp: UNIT_STATS[stats.produces].hp,
              maxHp: UNIT_STATS[stats.produces].hp,
              moveTarget: null,
              attackTargetId: null,
              attackCooldown: 0,
              harvesting: false,
              carryOre: 0,
            });
          }
        }
        state.buildQueue[faction] = null;
      }
    }
  }

  // Simple AI for soviet
  state.aiTimer -= dt;
  if (state.aiTimer <= 0) {
    state.aiTimer = 3 + Math.random() * 4;
    const alliesBase = state.buildings.find(b => b.faction === 'allies' && b.type === 'base');
    const sovietUnits = state.units.filter(u => u.faction === 'soviet' && (u.type === 'soldier' || u.type === 'tank'));

    for (const u of sovietUnits) {
      if (alliesBase && u.attackTargetId === null) {
        u.attackTargetId = alliesBase.id;
      }
    }

    // Soviet build logic
    if (!state.buildQueue.soviet && state.credits.soviet >= 300 && sovietUnits.length < 12) {
      const queue = Math.random() < 0.4 ? 'tank' : 'soldier';
      const queueBuilding = queue === 'tank' ? 'factory' : 'barracks';
      const hasBuilding = state.buildings.find(b => b.faction === 'soviet' && b.type === queueBuilding);
      if (hasBuilding) {
        const cost = UNIT_STATS[queue as UnitType].cost;
        if (state.credits.soviet >= cost) {
          state.credits.soviet -= cost;
          const stats = BUILDING_STATS[queueBuilding];
          state.buildQueue.soviet = { type: queueBuilding, timer: stats.buildTime, maxTimer: stats.buildTime };
        }
      }
    }
  }
}

function drawGame(ctx: CanvasRenderingContext2D, state: GameState) {
  const T = TILE;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Terrain
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = TERRAIN_COLOR[state.terrain[r][c]];
      ctx.fillRect(c * T, r * T, T, T);
    }
  }

  // Grid lines (subtle)
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * T, 0); ctx.lineTo(c * T, ROWS * T); ctx.stroke(); }
  for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * T); ctx.lineTo(COLS * T, r * T); ctx.stroke(); }

  // Ore
  for (const o of state.ore) {
    const alpha = Math.min(1, o.amount / 300);
    ctx.fillStyle = `rgba(255,220,50,${0.4 + alpha * 0.5})`;
    ctx.fillRect(o.x * T + 4, o.y * T + 4, T - 8, T - 8);
    ctx.fillStyle = `rgba(255,200,0,${alpha * 0.6})`;
    ctx.font = '9px monospace';
    ctx.fillText('ORE', o.x * T + 5, o.y * T + T / 2 + 4);
  }

  // Buildings
  for (const b of state.buildings) {
    const colors = COLORS[b.faction];
    const w = b.type === 'base' ? T * 2 : T * 1.5;
    const h = b.type === 'base' ? T * 2 : T * 1.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(b.pos.x * T + 3, b.pos.y * T + 3, w, h);

    // Body
    ctx.fillStyle = colors.primary;
    ctx.fillRect(b.pos.x * T, b.pos.y * T, w, h);

    // Border
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.pos.x * T, b.pos.y * T, w, h);

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    const label = BUILDING_STATS[b.type].label.split(' ')[0];
    ctx.fillText(label, b.pos.x * T + w / 2, b.pos.y * T + h / 2 + 3);
    ctx.textAlign = 'left';

    // HP bar
    const hpRatio = b.hp / b.maxHp;
    const barW = w;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(b.pos.x * T, b.pos.y * T - 6, barW, 4);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(b.pos.x * T, b.pos.y * T - 6, barW * hpRatio, 4);
  }

  // Units
  for (const unit of state.units) {
    const colors = COLORS[unit.faction];
    const cx = unit.pos.x * T + T / 2;
    const cy = unit.pos.y * T + T / 2;
    const r = unit.type === 'tank' ? 10 : unit.type === 'harvester' ? 8 : 7;
    const isSelected = state.selected.includes(unit.id);

    if (isSelected) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = colors.unit;
    ctx.beginPath();
    if (unit.type === 'tank') {
      ctx.fillRect(cx - r, cy - r * 0.7, r * 2, r * 1.4);
    } else {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (unit.type !== 'tank') ctx.fill();

    // Unit icon
    ctx.fillStyle = '#fff';
    ctx.font = unit.type === 'tank' ? '11px sans-serif' : '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(unit.type === 'soldier' ? '⚔' : unit.type === 'tank' ? '🔫' : '⛏', cx, cy + 4);
    ctx.textAlign = 'left';

    // HP bar
    const hpRatio = unit.hp / unit.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(cx - r, cy - r - 5, r * 2, 3);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : '#ef4444';
    ctx.fillRect(cx - r, cy - r - 5, r * 2 * hpRatio, 3);
  }

  // Explosions
  for (const e of state.explosions) {
    const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
    gradient.addColorStop(0, `rgba(255,255,100,${e.alpha})`);
    gradient.addColorStop(0.5, `rgba(255,100,20,${e.alpha * 0.8})`);
    gradient.addColorStop(1, `rgba(200,50,0,0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function RTSGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [phase, setPhase] = useState<Phase>('menu');
  const [credits, setCredits] = useState(1500);
  const [unitsCount, setUnitsCount] = useState({ allies: 0, enemies: 0 });
  const [buildQueue, setBuildQueue] = useState<{ type: BuildingType; timer: number; maxTimer: number } | null>(null);
  const submitScore = useSubmitScore('rts');
  useEffect(() => {
    if (phase === 'victory') submitScore(1000);
    if (phase === 'defeat')  submitScore(100);
  }, [phase, submitScore]);

  const queueUnit = useCallback((type: UnitType) => {
    const state = stateRef.current;
    const cost = UNIT_STATS[type].cost;
    if (state.credits.allies < cost) return;
    const buildingType: BuildingType = type === 'tank' ? 'factory' : type === 'harvester' ? 'refinery' : 'barracks';
    const hasBuilding = state.buildings.find(b => b.faction === 'allies' && b.type === buildingType);
    if (!hasBuilding) return;
    if (state.buildQueue.allies) return;
    state.credits.allies -= cost;
    const stats = BUILDING_STATS[buildingType];
    state.buildQueue.allies = { type: buildingType, timer: stats.buildTime, maxTimer: stats.buildTime };
  }, []);

  const startGame = useCallback(() => {
    nextId = 1;
    stateRef.current = createInitialState();
    setPhase('playing');
    setCredits(1500);
  }, []);

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
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      stepGame(stateRef.current, dt);
      drawGame(ctx, stateRef.current);

      // Tick UI every 30 frames
      if (stateRef.current.tick % 30 === 0) {
        setCredits(stateRef.current.credits.allies);
        setUnitsCount({
          allies: stateRef.current.units.filter(u => u.faction === 'allies').length,
          enemies: stateRef.current.units.filter(u => u.faction === 'soviet').length,
        });
        setBuildQueue(stateRef.current.buildQueue.allies);

        // Win/lose check
        const alliesBase = stateRef.current.buildings.find(b => b.faction === 'allies' && b.type === 'base');
        const sovietBase = stateRef.current.buildings.find(b => b.faction === 'soviet' && b.type === 'base');
        if (!sovietBase) { running = false; setPhase('victory'); }
        else if (!alliesBase) { running = false; setPhase('defeat'); }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = stateRef.current;
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const gx = px / TILE;
    const gy = py / TILE;

    // Check if clicking on allied unit (select)
    const clickedUnit = state.units.find(u =>
      u.faction === 'allies' && Math.abs(u.pos.x - gx) < 1 && Math.abs(u.pos.y - gy) < 1
    );

    if (clickedUnit) {
      state.selected = [clickedUnit.id];
      return;
    }

    // If units selected, move/attack
    if (state.selected.length > 0) {
      const clickedEnemy = state.units.find(u =>
        u.faction === 'soviet' && Math.abs(u.pos.x - gx) < 1 && Math.abs(u.pos.y - gy) < 1
      );
      const clickedEnemyBuilding = state.buildings.find(b =>
        b.faction === 'soviet' && gx >= b.pos.x && gx < b.pos.x + 2 && gy >= b.pos.y && gy < b.pos.y + 2
      );

      for (const selId of state.selected) {
        const unit = state.units.find(u => u.id === selId);
        if (!unit) continue;
        if (clickedEnemy) {
          unit.attackTargetId = clickedEnemy.id;
          unit.moveTarget = null;
        } else if (clickedEnemyBuilding) {
          unit.attackTargetId = clickedEnemyBuilding.id;
          unit.moveTarget = null;
        } else {
          unit.attackTargetId = null;
          unit.moveTarget = { x: gx, y: gy };
        }
      }
      return;
    }
  }, []);

  if (phase === 'menu') {
    return (
      <div style={{ background: '#1a2a1a', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, borderRadius: 12, padding: 32 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#ef4444', textShadow: '0 0 20px #ef444488', letterSpacing: '0.04em' }}>⚔ RED ALERT: DREAMENGIN</div>
        <div style={{ fontSize: 13, color: '#86efac', maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
          Command your Allied forces against the Soviet threat. Build bases, train units, harvest ore, and destroy the enemy Construction Yard to win.
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', fontSize: 11, color: '#6b7280' }}>
          {['Click unit to select', 'Click ground to move', 'Click enemy to attack', 'Build units below', 'Destroy enemy base to win'].map(t => (
            <span key={t} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)' }}>{t}</span>
          ))}
        </div>
        <button
          onClick={startGame}
          style={{ background: 'linear-gradient(135deg, #ef4444, #991b1b)', color: '#fff', border: 'none', padding: '14px 36px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em' }}
        >
          ▶ DEPLOY FORCES
        </button>
      </div>
    );
  }

  if (phase === 'victory' || phase === 'defeat') {
    return (
      <div style={{ background: phase === 'victory' ? '#14532d' : '#450a0a', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, borderRadius: 12, padding: 32 }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: phase === 'victory' ? '#4ade80' : '#f87171' }}>
          {phase === 'victory' ? '🏆 VICTORY!' : '💀 DEFEAT'}
        </div>
        <div style={{ fontSize: 14, color: '#d1d5db' }}>
          {phase === 'victory' ? 'Soviet forces have been eliminated. Allied Command is victorious!' : 'Your Construction Yard has been destroyed. The Soviets prevail.'}
        </div>
        <button onClick={startGame} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* HUD */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#1a2a1a', borderRadius: 8, flexWrap: 'wrap' }}>
        <span style={{ color: '#facc15', fontWeight: 700, fontSize: 13 }}>💰 {credits.toLocaleString()}</span>
        <span style={{ color: '#6b7280', fontSize: 11 }}>|</span>
        <span style={{ color: '#86efac', fontSize: 11 }}>
          Units: {unitsCount.allies}
        </span>
        <span style={{ color: '#6b7280', fontSize: 11 }}>|</span>
        <span style={{ color: '#f87171', fontSize: 11 }}>
          Enemies: {unitsCount.enemies}
        </span>
        {buildQueue && (
          <span style={{ color: '#93c5fd', fontSize: 11, marginLeft: 'auto' }}>
            Building: {buildQueue.type} ({Math.ceil(buildQueue.timer)}s)
          </span>
        )}
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '2px solid rgba(42,138,184,0.3)' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleCanvasClick}
          style={{ display: 'block', width: '100%', cursor: 'pointer', maxHeight: 450 }}
        />
      </div>

      {/* Build panel */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0' }}>
        <span style={{ color: '#9ca3af', fontSize: 11, alignSelf: 'center', marginRight: 4 }}>Train:</span>
        {([
          { type: 'soldier' as UnitType, label: '⚔ GI', cost: 100 },
          { type: 'tank' as UnitType, label: '🔫 Tank', cost: 400 },
          { type: 'harvester' as UnitType, label: '⛏ Harvester', cost: 200 },
        ]).map(b => (
          <button
            key={b.type}
            onClick={() => queueUnit(b.type)}
            disabled={!!buildQueue || credits < b.cost}
            style={{
              background: credits >= b.cost && !buildQueue ? '#1d4ed8' : '#374151',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: credits >= b.cost && !buildQueue ? 'pointer' : 'not-allowed',
              opacity: credits >= b.cost && !buildQueue ? 1 : 0.5,
            }}
          >
            {b.label} (${b.cost})
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: '#6b7280', fontSize: 10, alignSelf: 'center' }}>
          Click unit → select · Click map → move · Click red → attack
        </span>
      </div>
    </div>
  );
}

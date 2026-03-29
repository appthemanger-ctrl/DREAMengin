'use client';

/**
 * BabylonSideScroller — Babylon.js powered 3D side-scrolling platformer.
 *
 * Replaces the old Canvas-2D Dr. Eams Platformer.
 * Key improvements:
 *  • Babylon.js @babylonjs/core v8 for 3-D rendering (glow, lighting, PBR).
 *  • Set<string>-based key tracking so movement + jump always work together.
 *  • Coyote-time (8 frames after leaving ledge) + jump buffering (6 frames).
 *  • Double-jump, particle bursts, scrolling parallax background layers.
 *  • 2 handcrafted intro levels + 148 procedurally-generated levels (3-150).
 *  • Every 10th level is a named boss fight (15 unique bosses).
 *  • 15 themed zones — sky, platform colours and lore text change every 10 levels.
 *  • Session-seeded generation: every playthrough is unique, retrying a level
 *    gives the same layout.
 *  • Shared GameRemote CustomEvent bridge.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';
import { createBabylonEngine } from '@/lib/babylon/createEngine';
import {
  DreamEngineGodTierSystem,
  applyGodTierToBabylon,
  defaultDeviceSignals,
  defaultUXSignals,
  defaultRouteSignals,
  type BabylonSceneLike,
} from '@/lib/god-tier/godTierEngine';

// ─── Game constants ──────────────────────────────────────────────────────────
const GW = 800; // logical canvas width
const GH = 480; // logical canvas height
const GRAV       = 0.048;   // units / frame²
const MAX_FALL   = 0.95;    // terminal velocity (positive = down in BJS Y-up is handled)
const JUMP_VY    = 0.68;    // initial jump Y velocity
const WALK_SPD   = 0.115;   // horizontal speed
const COYOTE_MS  = 8;       // extra frames to jump after leaving ledge
const JBUF_MS    = 6;       // frames to buffer a jump before landing
const DASH_SPD   = 0.42;    // player dash speed (≈ 3.7× walk)
const DASH_DUR   = 10;      // dash duration in frames
const DASH_COOL  = 45;      // frames between dashes
const PROJ_SPD   = 4.5;     // boss projectile speed (px/frame)
const PROJ_LIFE  = 120;     // frames before projectile despawns
const COMBO_WIN  = 1500;    // ms window to chain a combo kill

// Babylon render-unit scale:  1 BU ≈ 40 logical px
const PX_PER_BU  = 40;
const TOTAL_LEVELS = 150;

const SESSION_SEED: number =
  // 'use client' ensures this only runs in the browser (no SSR hydration mismatch).
  typeof window !== 'undefined' ? (Math.floor(Math.random() * 2147483647) || 1) : 1;

// Named constants for boss behaviour
const BOSS_ENRAGE_THRESHOLD  = 0.5;   // fraction of max HP at which boss speeds up
const BOSS_ENRAGE_MULTIPLIER = 1.5;   // speed multiplier when enraged

// Named constants for seeding
const LEVEL_SEED_KEY    = 31337;      // prime-ish XOR key mixed with level number
const STAR_SEED_PRIME   = 7919;       // prime for parallax star distribution
const STAR_SEED_OFFSET  = 13;         // offset to avoid seed=0

/** Zone index 0-14; changes every 10 levels. */
function getZoneIdx(level: number): number { return Math.min(14, Math.floor((level - 1) / 10)); }
/** Returns true for every 10th level (boss arenas). */
function isBossLevel(level: number): boolean { return level % 10 === 0 && level >= 10 && level <= TOTAL_LEVELS; }

// ─── Zone metadata (15 zones, one per 10-level band) ─────────────────────────
interface ZoneMeta {
  name: string; story: string;
  sky: [number,number,number];
  gnd: [number,number,number]; plt: [number,number,number]; em: [number,number,number];
}
const ZONES: ZoneMeta[] = [
  { name:'Lucid Meadows',    story:'The dream begins at the edge of waking.\nRun far — something stirs in the meadow.',
    sky:[0.04,0.07,0.18], gnd:[0.12,0.20,0.14], plt:[0.22,0.40,0.28], em:[0.02,0.05,0.02] },
  { name:'Crystal Caverns',  story:'The meadow cracks open.\nGlimmering tunnels pulse with forgotten dreams.',
    sky:[0.02,0.03,0.14], gnd:[0.10,0.12,0.35], plt:[0.18,0.22,0.62], em:[0.02,0.03,0.12] },
  { name:'Neon Corridor',    story:'A dead city awakens in neon.\nEchoes of a dreamer who never woke.',
    sky:[0.04,0.00,0.10], gnd:[0.12,0.00,0.18], plt:[0.36,0.02,0.50], em:[0.06,0.00,0.10] },
  { name:'Cloud Kingdom',    story:'Higher. The storms below look like oceans.\nA kingdom built on forgotten promises.',
    sky:[0.12,0.16,0.30], gnd:[0.28,0.32,0.44], plt:[0.50,0.56,0.72], em:[0.06,0.07,0.12] },
  { name:'Shadow Vale',      story:'The light runs out here.\nSomething ancient waits in the dark.',
    sky:[0.01,0.01,0.04], gnd:[0.06,0.02,0.06], plt:[0.12,0.04,0.14], em:[0.02,0.01,0.02] },
  { name:'Ocean Abyss',      story:'Deeper than sleep. The dreamer drowns\nin memories that belong to someone else.',
    sky:[0.01,0.04,0.12], gnd:[0.02,0.10,0.22], plt:[0.04,0.24,0.46], em:[0.01,0.04,0.08] },
  { name:'Time Rift',        story:'The past and future bleed together.\nRun — or be erased.',
    sky:[0.07,0.04,0.14], gnd:[0.14,0.10,0.22], plt:[0.28,0.18,0.48], em:[0.04,0.02,0.08] },
  { name:'Mind Maze',        story:'Every corridor is a fear.\nOnly the dreamer can choose which door opens.',
    sky:[0.08,0.03,0.10], gnd:[0.18,0.05,0.16], plt:[0.36,0.08,0.38], em:[0.05,0.01,0.06] },
  { name:'Storm Peaks',      story:'At the roof of dreams the wind strips\neverything away but the will to continue.',
    sky:[0.04,0.06,0.16], gnd:[0.14,0.18,0.26], plt:[0.26,0.32,0.52], em:[0.03,0.04,0.08] },
  { name:'The Void',         story:'Nothing. And yet — you are still here.\nThe last dream before the final truth.',
    sky:[0.01,0.01,0.02], gnd:[0.05,0.02,0.06], plt:[0.09,0.03,0.11], em:[0.02,0.01,0.03] },
  { name:'Reborn Highlands', story:'Surviving the void changes everything.\nThe highlands bloom where nothing should grow.',
    sky:[0.06,0.10,0.18], gnd:[0.18,0.26,0.20], plt:[0.32,0.48,0.36], em:[0.03,0.06,0.04] },
  { name:'Echo Halls',       story:'Every footstep echoes with a life unlived.\nThe halls replay every choice ever made.',
    sky:[0.04,0.04,0.14], gnd:[0.10,0.10,0.26], plt:[0.20,0.20,0.52], em:[0.02,0.02,0.08] },
  { name:'Final Frontier',   story:'Beyond the last horizon the dreamer\nfinally sees what they have been running toward.',
    sky:[0.08,0.04,0.12], gnd:[0.18,0.08,0.20], plt:[0.36,0.14,0.42], em:[0.05,0.02,0.07] },
  { name:'Ascendant Realm',  story:'The dreamer becomes the dream.\nEach step here reshapes the world behind you.',
    sky:[0.10,0.08,0.18], gnd:[0.20,0.16,0.30], plt:[0.38,0.32,0.58], em:[0.06,0.05,0.10] },
  { name:'The Dream Heart',  story:'The heart of all dreams.\nOnly one who has survived everything arrives here.',
    sky:[0.08,0.04,0.20], gnd:[0.12,0.08,0.28], plt:[0.22,0.14,0.52], em:[0.04,0.02,0.10] },
];

// ─── Boss metadata (15 bosses, one per zone at every 10th level) ─────────────
interface BossMeta {
  name: string; title: string; intro: string;
  hp: number; spd: number; size: number;
  col: [number,number,number]; em: [number,number,number];
}
const BOSSES: BossMeta[] = [
  { name:'The Meadow Troll',    title:'Guardian of the Gate',
    intro:'A lumbering troll blocks the only exit.\nStomp it 3 times to pass.',
    hp:3,  spd:1.8, size:1.8, col:[0.20,0.50,0.20], em:[0.04,0.12,0.04] },
  { name:'Crystal Golem',       title:'Sentinel of the Deep',
    intro:'An ancient golem of crystallised dreams.\nFour hits to shatter.',
    hp:4,  spd:1.4, size:2.0, col:[0.30,0.40,0.80], em:[0.06,0.09,0.22] },
  { name:'Neon Phantom',        title:'Ghost of the Corridor',
    intro:'It flickers between states of existence.\nHit it 4 times — fast.',
    hp:4,  spd:3.2, size:1.6, col:[0.70,0.00,0.80], em:[0.20,0.00,0.26] },
  { name:'Cloud Titan',         title:'King of the Skylands',
    intro:'Massive and slow, but one hit sends you flying.\nLand on it 5 times.',
    hp:5,  spd:0.9, size:2.4, col:[0.70,0.75,0.90], em:[0.14,0.16,0.22] },
  { name:'Shadow Beast',        title:'Devourer of Light',
    intro:'Born from absolute darkness.\nFast. Relentless. Five hits.',
    hp:5,  spd:3.6, size:1.9, col:[0.10,0.02,0.14], em:[0.06,0.01,0.08] },
  { name:'Deep Leviathan',      title:'Ruler of the Abyss',
    intro:'The ocean dreamed this nightmare into being.\nSix stomps to silence it.',
    hp:6,  spd:2.0, size:2.3, col:[0.04,0.18,0.40], em:[0.01,0.05,0.12] },
  { name:'Time Wraith',         title:'The Uncorrectable Error',
    intro:'A mistake echoing across every timeline.\nSix hits to erase it.',
    hp:6,  spd:3.8, size:1.7, col:[0.60,0.60,0.70], em:[0.12,0.12,0.16] },
  { name:'Mind Demon',          title:'The Fear You Never Faced',
    intro:'A manifestation of every avoided thought.\nSeven hits to confront it.',
    hp:7,  spd:2.8, size:2.1, col:[0.55,0.05,0.55], em:[0.14,0.01,0.14] },
  { name:'Storm Drake',         title:'Fury of the Peak',
    intro:'Born from lightning at the top of the dream world.\nEight hits to ground it.',
    hp:8,  spd:2.5, size:2.2, col:[0.30,0.35,0.60], em:[0.07,0.08,0.16] },
  { name:'The Void Lord',       title:'Master of Nothingness',
    intro:'It has watched you from the beginning.\nTHE HALFWAY BOSS. Ten hits.',
    hp:10, spd:2.2, size:2.8, col:[0.05,0.00,0.10], em:[0.10,0.00,0.16] },
  { name:'Risen Goliath',       title:'What Survived the Void',
    intro:'Something came back from nothing — changed.\nEight hits.',
    hp:8,  spd:2.6, size:2.3, col:[0.55,0.42,0.15], em:[0.14,0.10,0.02] },
  { name:'Echo Specter',        title:'A Life Unlived',
    intro:'Every echo has become a monster.\nNine hits to silence every regret.',
    hp:9,  spd:3.4, size:1.8, col:[0.10,0.60,0.70], em:[0.02,0.14,0.18] },
  { name:'Frontier Colossus',   title:'The Wall at the Edge',
    intro:'A titan at the border of the last unknown.\nTen hits.',
    hp:10, spd:2.8, size:2.5, col:[0.55,0.08,0.14], em:[0.14,0.01,0.02] },
  { name:'Ascendant Titan',     title:"The Dreamer's Shadow",
    intro:"A reflection of everything you could have been.\nEleven hits.",
    hp:11, spd:3.0, size:2.6, col:[0.70,0.65,0.20], em:[0.18,0.16,0.02] },
  { name:'The Dream King',      title:'Ruler of All Dreams',
    intro:'From the heart of every dream ever dreamed.\nFINAL BOSS. Fifteen hits.',
    hp:15, spd:2.4, size:3.2, col:[0.80,0.60,0.08], em:[0.28,0.18,0.00] },
];

// ─── Seeded RNG (deterministic, avoids hydration mismatches) ─────────────────
function seededRng(seed: number) {
  let s = (seed | 0) >>> 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface PlatDef {
  x: number; y: number; w: number; h: number;
  type: 'solid' | 'moving' | 'goal';
  moveRange?: number; moveSpd?: number;
}
interface CoinDef { x: number; y: number; isGoal?: boolean; }
interface EnemyDef {
  x: number; y: number; vx: number;
  /** True for boss enemies. */
  boss?: boolean;
  /** Hits required to defeat (bosses only); regular enemies always take 1. */
  hitsLeft?: number;
  /** Visual scale multiplier (bosses only). */
  size?: number;
  /** Boss body colour [R,G,B]. */
  bossColor?: [number,number,number];
  /** Boss emissive colour [R,G,B]. */
  bossEmissive?: [number,number,number];
}

interface LevelDef {
  platforms: PlatDef[];
  coins: CoinDef[];
  enemies: EnemyDef[];
  worldW: number;
  /** Zone name shown in HUD. */
  zoneName?: string;
  /** Lore text shown in the between-level overlay. */
  zoneStory?: string;
  /** True for boss arenas — victory requires stomping the boss, not a goal coin. */
  isBossLevel?: boolean;
}

// ─── Level data (logical pixels, Y-down) ─────────────────────────────────────
// Ground sits at y=400.  Platforms use their TOP-LEFT corner (x,y,w,h).
// sessionSeed gives each playthrough unique procedural layouts.

/** Returns the boss entry for a given level (safe index clamping). */
function getBossForLevel(level: number): BossMeta {
  return BOSSES[Math.min(BOSSES.length - 1, Math.floor(level / 10) - 1)];
}

function makeLevel(n: number, sessionSeed: number): LevelDef {
  if (n === 1) return {
    worldW: 2400,
    platforms: [
      { x: 0,    y: 400, w: 2400, h: 80, type: 'solid' },
      { x: 300,  y: 310, w: 120,  h: 20, type: 'solid' },
      { x: 500,  y: 250, w: 140,  h: 20, type: 'solid' },
      { x: 700,  y: 200, w: 120,  h: 20, type: 'solid' },
      { x: 900,  y: 310, w: 160,  h: 20, type: 'solid' },
      { x: 1100, y: 250, w: 140,  h: 20, type: 'solid' },
      { x: 1300, y: 170, w: 130,  h: 20, type: 'solid' },
      { x: 1550, y: 300, w: 160,  h: 20, type: 'moving', moveRange: 80, moveSpd: 0.7 },
      { x: 1800, y: 200, w: 130,  h: 20, type: 'solid' },
      { x: 2050, y: 260, w: 200,  h: 20, type: 'solid' },
      { x: 2200, y: 160, w: 140,  h: 20, type: 'goal' },
    ],
    coins: [
      { x: 360, y: 280 }, { x: 400, y: 280 },
      { x: 560, y: 220 }, { x: 600, y: 220 },
      { x: 760, y: 170 }, { x: 800, y: 170 },
      { x: 950, y: 280 }, { x: 990, y: 280 },
      { x: 1140,y: 220 }, { x: 1180,y: 220 },
      { x: 1360,y: 140 }, { x: 1400,y: 140 },
      { x: 1620,y: 270 }, { x: 1660,y: 270 },
      { x: 1860,y: 170 }, { x: 1900,y: 170 },
      { x: 2240,y: 130, isGoal: true },
    ],
    enemies: [
      { x: 900,  y: 368, vx: 1.4 },
      { x: 1300, y: 368, vx: -1.6 },
      { x: 1800, y: 368, vx: 1.2 },
    ],
    zoneName: ZONES[0].name,
    zoneStory: ZONES[0].story,
  };

  if (n === 2) return {
    worldW: 2800,
    platforms: [
      { x: 0,    y: 400, w: 2800, h: 80, type: 'solid' },
      { x: 200,  y: 330, w: 100,  h: 20, type: 'solid' },
      { x: 360,  y: 260, w: 90,   h: 20, type: 'solid' },
      { x: 510,  y: 190, w: 100,  h: 20, type: 'solid' },
      { x: 660,  y: 280, w: 90,   h: 20, type: 'moving', moveRange: 100, moveSpd: 1.2 },
      { x: 820,  y: 200, w: 80,   h: 20, type: 'solid' },
      { x: 980,  y: 300, w: 110,  h: 20, type: 'solid' },
      { x: 1150, y: 180, w: 90,   h: 20, type: 'moving', moveRange: 60, moveSpd: 0.9 },
      { x: 1310, y: 260, w: 110,  h: 20, type: 'solid' },
      { x: 1480, y: 150, w: 100,  h: 20, type: 'solid' },
      { x: 1650, y: 240, w: 100,  h: 20, type: 'moving', moveRange: 80, moveSpd: 1.0 },
      { x: 1820, y: 160, w: 90,   h: 20, type: 'solid' },
      { x: 2000, y: 280, w: 120,  h: 20, type: 'solid' },
      { x: 2200, y: 180, w: 110,  h: 20, type: 'solid' },
      { x: 2440, y: 240, w: 130,  h: 20, type: 'solid' },
      { x: 2620, y: 140, w: 120,  h: 20, type: 'goal' },
    ],
    coins: [
      { x: 240, y: 300 }, { x: 400, y: 230 }, { x: 550, y: 160 },
      { x: 720, y: 250 }, { x: 860, y: 170 }, { x: 1020,y: 270 },
      { x: 1200,y: 150 }, { x: 1360,y: 230 }, { x: 1520,y: 120 },
      { x: 1690,y: 210 }, { x: 1860,y: 130 }, { x: 2050,y: 250 },
      { x: 2240,y: 150 }, { x: 2660,y: 110, isGoal: true },
    ],
    enemies: [
      { x: 200, y: 368, vx: 1.5 },
      { x: 700, y: 368, vx: -1.8 },
      { x: 1200,y: 368, vx: 1.6 },
      { x: 1800,y: 368, vx: -2.0 },
      { x: 2400,y: 368, vx: 1.7 },
    ],
    zoneName: ZONES[0].name,
  };

  if (isBossLevel(n)) return makeBossLevel(n);
  return makeProceduralLevel(n, sessionSeed);
}

// ─── Procedural level generator (levels 3-149 excluding boss levels) ─────────
function makeProceduralLevel(n: number, sessionSeed: number): LevelDef {
  // XOR session seed with level key → unique per session, repeatable on retry
  const rng = seededRng(((sessionSeed ^ (n * LEVEL_SEED_KEY + 7)) | 1) >>> 0);
  const zoneIdx = getZoneIdx(n);
  const zone    = ZONES[zoneIdx];

  // t: difficulty 0.0 (level 3) → 1.0 (level 149)
  const t = Math.min(1, (n - 3) / 146);

  const worldW    = Math.round(3000 + t * 2800);               // 3000 → 5800 px
  const minPlatW  = Math.max(42, Math.round(125 - t * 83));    // 125 → 42 px
  const maxPlatW  = Math.max(minPlatW + 15, Math.round(160 - t * 80)); // 160 → 80 px
  const minGap    = Math.round(52 + t * 18);                   // 52 → 70 px
  const maxGap    = Math.round(82 + t * 8);                    // 82 → 90 px  (safe single-jump range)
  const movRatio  = 0.20 + t * 0.45;                           // 20% → 65% moving
  const movSpd    = 1.0  + t * 1.8;                            // 1.0 → 2.8
  const platCount = Math.round(12 + t * 17);                   // 12 → 29 platforms
  const enemyCnt  = Math.round(4  + t * 7);                    // 4 → 11 enemies
  const enemySpd  = 1.6  + t * 2.2;                            // 1.6 → 3.8

  const platforms: PlatDef[] = [{ x: 0, y: 400, w: worldW, h: 80, type: 'solid' }];
  const coins:   CoinDef[]   = [];
  const enemies: EnemyDef[]  = [];

  let cx = 150, cy = 340;
  let cw = Math.round(minPlatW + rng() * (maxPlatW - minPlatW));

  for (let i = 0; i < platCount; i++) {
    const gap = Math.round(minGap + rng() * (maxGap - minGap));
    cx += cw + gap;
    if (cx > worldW - 300) break;

    // Up to 100 px higher (clamped — safely reachable with a single jump),
    // or up to 200 px lower (gravity assists falling).
    const rawDy  = (rng() - 0.5) * 400;
    const clampedDy = rawDy < 0 ? Math.max(rawDy, -100) : Math.min(rawDy, 200);
    cy = Math.max(90, Math.min(370, Math.round(cy + clampedDy)));
    cw = Math.round(minPlatW + rng() * (maxPlatW - minPlatW));

    const isMoving = rng() < movRatio;
    const p: PlatDef = { x: cx, y: cy, w: cw, h: 20, type: isMoving ? 'moving' : 'solid' };
    if (isMoving) {
      p.moveRange = Math.round(40 + rng() * 60);
      p.moveSpd   = parseFloat((movSpd * (0.7 + rng() * 0.6)).toFixed(2));
    }
    platforms.push(p);

    if (rng() > 0.3) {
      coins.push({ x: cx + Math.round(cw * 0.25), y: cy - 30 });
      if (rng() > 0.55 && cw > 65) coins.push({ x: cx + Math.round(cw * 0.65), y: cy - 30 });
    }
  }

  // Goal — 60-95 px past last platform's right edge, 20-120 px higher
  const goalGap  = Math.round(60 + rng() * 35);
  const goalRise = Math.round(20 + rng() * 100);
  const goalX    = Math.min(worldW - 170, cx + cw + goalGap);
  const goalY    = Math.max(90, cy - goalRise);
  platforms.push({ x: goalX, y: goalY, w: 110, h: 20, type: 'goal' });
  coins.push({ x: goalX + 35, y: goalY - 40, isGoal: true });

  // Enemies spread evenly across world
  const spacing = Math.round(worldW / (enemyCnt + 1));
  for (let i = 0; i < enemyCnt; i++) {
    const ex  = Math.max(150, Math.min(worldW - 150, Math.round(spacing * (i + 1) + (rng() - 0.5) * 120)));
    const spd = parseFloat((enemySpd * (0.6 + rng() * 0.8)).toFixed(2));
    enemies.push({ x: ex, y: 368, vx: rng() < 0.5 ? spd : -spd });
  }

  // Show zone intro story on the first level of each zone.
  // Level 3 is the first procedural level — show zone 0 story even though 3 % 10 ≠ 1.
  const isFirstOfZone = (n % 10 === 1) || n === 3;

  return { platforms, coins, enemies, worldW, zoneName: zone.name, zoneStory: isFirstOfZone ? zone.story : undefined };
}

// ─── Boss arena generator (every 10th level) ─────────────────────────────────
function makeBossLevel(n: number): LevelDef {
  const bossIdx = Math.min(BOSSES.length - 1, Math.floor(n / 10) - 1);
  const boss    = BOSSES[bossIdx];
  const zone    = ZONES[getZoneIdx(n)];

  const worldW = 1100;
  const platforms: PlatDef[] = [
    { x: 0,   y: 400, w: worldW, h: 80, type: 'solid' },
    { x: 160, y: 300, w: 130,   h: 20, type: 'solid' },
    { x: 380, y: 235, w: 140,   h: 20, type: 'solid' },
    { x: 620, y: 280, w: 130,   h: 20, type: 'solid' },
    { x: 860, y: 215, w: 110,   h: 20, type: 'solid' },
  ];

  // Score coins scattered around the arena (no goal coin — boss IS the goal)
  const coins: CoinDef[] = [
    { x: 200, y: 270 }, { x: 440, y: 205 }, { x: 660, y: 250 }, { x: 900, y: 185 },
  ];

  const enemies: EnemyDef[] = [{
    x: 450, y: 355, vx: boss.spd,
    boss: true, hitsLeft: boss.hp, size: boss.size,
    bossColor: boss.col, bossEmissive: boss.em,
  }];

  return {
    platforms, coins, enemies, worldW,
    zoneName: zone.name,
    zoneStory: `⚔ BOSS: ${boss.name}\n${boss.title}\n\n${boss.intro}`,
    isBossLevel: true,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function BabylonSideScroller() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gameRef    = useRef<GameCore | null>(null);
  const [status, setStatus]   = useState<'title'|'playing'|'dead'|'complete'|'win'>('title');
  const [level,  setLevel]    = useState(1);
  const [score,  setScore]    = useState(0);
  const [lives,  setLives]    = useState(3);
  const vpadRef  = useRef({ left: false, right: false, jump: false, dash: false });
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem('madmaxi_best') ?? '0', 10); }
    catch { return 0; }
  });
  // Ref mirrors bestScore so callbacks can read the latest value without stale closures
  const bestScoreRef = useRef((() => {
    try { return parseInt(localStorage.getItem('madmaxi_best') ?? '0', 10); }
    catch { return 0; }
  })());
  const [progress, setProgress] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  // Session seed — module-level so it's set once per page load (not per render).
  // Every playthrough gets a unique seed; retrying a level uses the same one.
  const sessionSeedRef = useRef(SESSION_SEED);

  // Boss state
  const [bossHp,    setBossHp]    = useState(0);
  const [bossMaxHp, setBossMaxHp] = useState(0);
  const [bossName,  setBossName]  = useState('');

  // Combat feedback
  const [comboCount, setComboCount] = useState(0);
  const [dashReady,  setDashReady]  = useState(true);

  // Zone / story
  const [zoneName,   setZoneName]   = useState('');
  const [zoneStory,  setZoneStory]  = useState('');
  const [wasABoss,   setWasABoss]   = useState(false); // was the level we just finished a boss?

  // Submit final score when game truly ends (win = all 150 levels, or dead with 0 lives)
  const submitScore = useSubmitScore('platformer');
  useEffect(() => {
    if (status === 'win') submitScore(score, level - 1);
    if (status === 'dead' && lives === 0) submitScore(score, level);
  }, [status, lives, score, level, submitScore]);

  // ── Start / restart ────────────────────────────────────────────────────────
  const startGame = useCallback((lv: number, sc: number, li: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    gameRef.current?.destroy();

    // Derive zone/boss info for this level
    const zIdx    = getZoneIdx(lv);
    const isBoss  = isBossLevel(lv);
    const bossEntry = isBoss ? getBossForLevel(lv) : null;
    setZoneName(ZONES[zIdx].name);
    setBossHp(bossEntry ? bossEntry.hp : 0);
    setBossMaxHp(bossEntry ? bossEntry.hp : 0);
    setBossName(bossEntry ? bossEntry.name : '');
    setWasABoss(false);

    const core = new GameCore(canvas, lv, sc, li, {
      onScore:    (s)  => {
        setScore(s);
        if (s > bestScoreRef.current) {
          bestScoreRef.current = s;
          setBestScore(s);
          setIsNewBest(true);
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('madmaxi_best', String(s)); } catch { /* quota/private */ }
          }
        }
      },
      onDie:      (li) => { setLives(li); setStatus('dead'); },
      onComplete: (lv) => {
        const nextZone = getZoneIdx(lv);
        const isNewZone = lv > 1 && getZoneIdx(lv - 1) !== nextZone;
        const nextIsBoss = isBossLevel(lv);
        // Build story text for the "level complete" overlay
        let story = '';
        if (isNewZone) story += ZONES[nextZone].story;
        if (nextIsBoss) {
          const nb = getBossForLevel(lv);
          story += (story ? '\n\n' : '') + `⚔ BOSS NEXT: ${nb.name}\n${nb.intro}`;
        }
        setZoneStory(story);
        setWasABoss(isBossLevel(lv - 1));
        setLevel(lv);
        setStatus(lv > TOTAL_LEVELS ? 'win' : 'complete');
      },
      onProgress: (pct) => setProgress(pct),
      onBossHp:   (hp) => setBossHp(hp),
      onCombo:    (c)  => setComboCount(c),
      onDash:     ()   => { setDashReady(false); setTimeout(() => setDashReady(true), DASH_COOL * 16); },
    }, sessionSeedRef.current);
    gameRef.current = core;
    setProgress(0);
    setIsNewBest(false);
    setStatus('playing');
  }, []);
  useGameAutoStart(status === 'title' ? () => startGame(1, 0, 3) : null);

  // ── Key events ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const keysDown = new Set<string>();
    const down = (e: KeyboardEvent) => {
      keysDown.add(e.code);
      gameRef.current?.setKeys(keysDown);
      if ((e.code === 'Space' || e.code === 'Enter') && status === 'title') {
        startGame(1, 0, 3);
      }
      // Arrow keys / space — prevent page scroll only when game is running
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
      // Shift = dash
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        const vp = { ...vpadRef.current, dash: true };
        vpadRef.current = vp;
        gameRef.current?.setVpad(vp);
      }
    };
    const up = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
      gameRef.current?.setKeys(keysDown);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        const vp = { ...vpadRef.current, dash: false };
        vpadRef.current = vp;
        gameRef.current?.setVpad(vp);
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
    };
  }, [status, startGame]);

  // ── GameRemote bridge ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { action, active } = (e as CustomEvent<{ action: string; active: boolean }>).detail;
      const vp = { ...vpadRef.current };
      if (action === 'move-left' || action === 'move-up-left' || action === 'move-down-left')
        vp.left  = active;
      if (action === 'move-right' || action === 'move-up-right' || action === 'move-down-right')
        vp.right = active;
      if (action === 'move-stop') { vp.left = false; vp.right = false; }
      if (action === 'jump' || action === 'jump-spin' || action === 'jump-shoot')
        vp.jump = active;
      if (action === 'dash' || action === 'attack')
        vp.dash = active;
      vpadRef.current = vp;
      gameRef.current?.setVpad(vp);
    };
    window.addEventListener('de-game-input', handler);
    return () => window.removeEventListener('de-game-input', handler);
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => { gameRef.current?.destroy(); }, []);

  // ── Button shared style ────────────────────────────────────────────────────
  const btnBase: React.CSSProperties = {
    border: 'none', borderRadius: 10, cursor: 'pointer',
    fontWeight: 800, fontSize: 14, userSelect: 'none',
    transition: 'opacity 0.1s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {/* ── Canvas ── */}
      <div style={{ position: 'relative', width: '100%', maxWidth: GW }}>
        <canvas
          ref={canvasRef}
          width={GW}
          height={GH}
          style={{ width: '100%', borderRadius: 12, display: 'block',
                   background: '#0a0a1a', cursor: 'default' }}
          onClick={() => { if (status === 'title') startGame(1, 0, 3); }}
        />

        {/* ── Overlay: title ── */}
        {status === 'title' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg,rgba(10,15,40,0.85),rgba(5,5,20,0.92))',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fa0', letterSpacing: '0.15em',
                          textTransform: 'uppercase', marginBottom: 8 }}>
              DREAMengin × Babylon.js
            </div>
            <div style={{ fontSize: 46, fontWeight: 900, color: '#fff',
                          textShadow: '0 0 32px #fa0,0 0 12px #fa0,0 0 4px #f80', lineHeight: 1.0, marginBottom: 6,
                          letterSpacing: '-0.02em' }}>
              MADMAXI
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fa0', letterSpacing: '0.1em',
                          textTransform: 'uppercase', marginBottom: 20 }}>
              🏎 MAX SPEED · MAX GLORY
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 28, textAlign: 'center' }}>
              150 levels · 15 zones · boss every 10 · unique each run
            </div>
            <button
              style={{ ...btnBase, background: 'linear-gradient(135deg,#c8981a,#f7c44a)',
                       color: '#000', padding: '12px 36px', fontSize: 16, fontWeight: 800, boxShadow: '0 0 20px #fa06' }}
              onClick={() => startGame(1, 0, 3)}
            >
              ▶ Race Now
            </button>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 14 }}>
              WASD / Arrows · Space to jump · move + jump works together
            </div>
          </div>
        )}

        {/* ── Overlay: dead ── */}
        {status === 'dead' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(20,5,5,0.88)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#f55',
                          textShadow: '0 0 16px #f55', marginBottom: 8 }}>Dream Lost</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              Level {level} · Score {score}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
              {lives} {lives === 1 ? 'life' : 'lives'} remaining
            </div>
            {lives > 0 ? (
              <button
                style={{ ...btnBase, background: 'linear-gradient(135deg,#b82a2a,#f74a4a)',
                         color: '#fff', padding: '10px 30px' }}
                onClick={() => startGame(level, score, lives)}
              >Retry Level {level}</button>
            ) : (
              <button
                style={{ ...btnBase, background: 'linear-gradient(135deg,#2a8ab8,#4a6cf7)',
                         color: '#fff', padding: '10px 30px' }}
                onClick={() => startGame(1, 0, 3)}
              >New Game</button>
            )}
          </div>
        )}

        {/* ── Overlay: level complete ── */}
        {status === 'complete' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '0 24px',
            background: wasABoss ? 'rgba(20,10,5,0.92)' : 'rgba(5,20,10,0.92)', borderRadius: 12,
          }}>
            {wasABoss ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fa0', letterSpacing: '0.15em',
                              textTransform: 'uppercase', marginBottom: 6 }}>Boss Defeated!</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fa0',
                              textShadow: '0 0 16px #fa0', marginBottom: 6 }}>⚔ {bossName}</div>
              </>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 900, color: '#4f8',
                            textShadow: '0 0 16px #4f8', marginBottom: 6 }}>Dream Complete!</div>
            )}
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>
              Level {level - 1} · Score {score}
            </div>
            {zoneStory ? (
              <div style={{ fontSize: 11, color: 'rgba(200,220,255,0.7)', textAlign: 'center',
                            lineHeight: 1.6, marginBottom: 18, maxWidth: 380,
                            whiteSpace: 'pre-line', borderTop: '1px solid rgba(255,255,255,0.1)',
                            paddingTop: 10 }}>
                {zoneStory}
              </div>
            ) : <div style={{ marginBottom: 18 }} />}
            <button
              style={{ ...btnBase, background: isBossLevel(level)
                ? 'linear-gradient(135deg,#8a2a2a,#f74a1a)'
                : 'linear-gradient(135deg,#1a8a3a,#4af74a)',
                color: '#fff', padding: '10px 30px' }}
              onClick={() => startGame(level, score, lives)}
            >{isBossLevel(level) ? `⚔ Fight ${getBossForLevel(level).name}` : `Level ${level} →`}</button>
          </div>
        )}

        {/* ── Overlay: victory ── */}
        {status === 'win' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg,rgba(5,10,30,0.92),rgba(10,5,30,0.92))',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fa0',
                          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              All 150 Dreams Conquered
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#fff',
                          textShadow: '0 0 28px #fa0,0 0 8px #fa0', lineHeight: 1.1, marginBottom: 8 }}>
              YOU WIN!
            </div>
            <div style={{ fontSize: 22, color: '#fa0', fontWeight: 800, marginBottom: 4 }}>
              Final Score: {score}
            </div>
            {isNewBest && (
              <div style={{ fontSize: 13, color: '#4af', fontWeight: 700, marginBottom: 4 }}>
                ✦ New Best Score!
              </div>
            )}
            {bestScore > 0 && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
                Best: {bestScore}
              </div>
            )}
            <button
              style={{ ...btnBase, background: 'linear-gradient(135deg,#c8981a,#f7c44a)',
                       color: '#000', padding: '12px 36px', fontSize: 16, marginTop: 4 }}
              onClick={() => startGame(1, 0, 3)}
            >Play Again</button>
          </div>
        )}

        {/* ── HUD ── */}
        {status === 'playing' && (
          <>
            <div style={{ position: 'absolute', top: 10, left: 12, right: 12,
                          display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff',
                            textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                            borderRadius: 6, padding: '3px 10px' }}>
                ⭐ {score}
              </div>
              {bestScore > 0 && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fa0',
                              textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                              borderRadius: 6, padding: '3px 8px' }}>
                  🏆 {bestScore}
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4af',
                            textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                            borderRadius: 6, padding: '3px 8px', maxWidth: 110,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {zoneName || ZONES[getZoneIdx(level)].name}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff',
                            textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                            borderRadius: 6, padding: '3px 10px' }}>
                LVL {level}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff',
                            textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                            borderRadius: 6, padding: '3px 10px' }}>
                {'❤️'.repeat(Math.max(0, lives))}
              </div>
            </div>

            {/* Boss health bar */}
            {bossMaxHp > 0 && (
              <div style={{ position: 'absolute', top: 42, left: 12, right: 12, pointerEvents: 'none' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#fa0', textAlign: 'center',
                              marginBottom: 3, textShadow: '0 1px 4px #000' }}>
                  ⚔ {bossName} — {bossHp} / {bossMaxHp}
                </div>
                <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 4, height: 7 }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%`,
                    background: bossHp / bossMaxHp > 0.5
                      ? 'linear-gradient(90deg,#f80,#fa0)'
                      : 'linear-gradient(90deg,#f22,#f55)',
                    transition: 'width 0.2s',
                  }} />
                </div>
              </div>
            )}

            {/* Combo + Dash indicators */}
            <div style={{
              position: 'absolute', top: bossMaxHp > 0 ? 80 : 42,
              right: 12, pointerEvents: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
            }}>
              {comboCount > 1 && (
                <div style={{
                  background: 'rgba(255,180,0,0.2)', border: '1px solid #fa0',
                  borderRadius: 4, padding: '2px 8px',
                  fontSize: 11, fontWeight: 700, color: '#ffd700',
                  textShadow: '0 0 8px #fa0',
                }}>
                  ×{comboCount} COMBO
                </div>
              )}
              <div style={{
                background: dashReady ? 'rgba(0,200,255,0.15)' : 'rgba(100,100,100,0.15)',
                border: `1px solid ${dashReady ? '#0cf' : '#444'}`,
                borderRadius: 4, padding: '2px 8px',
                fontSize: 10, color: dashReady ? '#0cf' : '#666',
              }}>
                {dashReady ? '⚡ DASH' : '· dash ·'}
              </div>
            </div>

            {/* Progress bar (hidden during boss fights — no scrolling world) */}
            {bossMaxHp === 0 && (
              <div style={{ position: 'absolute', bottom: 8, left: 12, right: 12,
                            background: 'rgba(0,0,0,0.35)', borderRadius: 4, height: 5,
                            pointerEvents: 'none' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${progress}%`,
                              background: 'linear-gradient(90deg,#4af,#4af7a0)',
                              transition: 'width 0.25s' }} />
              </div>
            )}
          </>
        )}
      </div>

      <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center', maxWidth: 500 }}>
        Use the shared PS-style GameRemote or keyboard: ← → / A D move &nbsp;·&nbsp; ↑ / W / Space jump (double-jump) &nbsp;·&nbsp;
        <strong>Shift</strong> to dash &nbsp;·&nbsp; Dodge boss projectiles!
      </p>
    </div>
  );
}

// ─── GameCore — owns the Babylon.js engine lifecycle ─────────────────────────
interface GameCallbacks {
  onScore:     (s: number) => void;
  onDie:       (livesLeft: number) => void;
  onComplete:  (nextLevel: number) => void;
  onProgress?: (pct: number) => void;
  onBossHp?:   (current: number) => void;
  onCombo?:    (count: number) => void;
  onDash?:     () => void;
}

type VPad = { left: boolean; right: boolean; jump: boolean; dash: boolean };

class GameCore {
  private disposed = false;
  private keys: Set<string> = new Set();
  private vpad: VPad = { left: false, right: false, jump: false, dash: false };
  private godTier = new DreamEngineGodTierSystem();

  // physics state (logical pixels, Y-down)
  private px   = 60; // player x (left edge)
  private py   = 350; // player y (top edge)
  private pvx  = 0;
  private pvy  = 0;
  private onGround   = false;
  private jumpCount  = 0; // 0 = no jump used, 1 = single, 2 = double
  private coyoteFr   = 0; // coyote-time frames remaining
  private jBufFr     = 0; // jump-buffer frames remaining
  private prevJump   = false;
  private facingR    = true;
  private invincible = 0; // frames

  // ── Dash system ────────────────────────────────────────────────────────
  private dashFrames = 0;   // frames of active dash remaining
  private dashCool   = 0;   // cooldown frames remaining
  private dashDir    = 1;   // direction (+1 or -1)

  // ── Combo system ───────────────────────────────────────────────────────
  private comboCount     = 0;       // consecutive kills in window
  private comboTimestamp = 0;       // ms timestamp of last kill

  // ── Boss projectiles ───────────────────────────────────────────────────
  private projectiles: {
    x: number; y: number;
    vx: number; vy: number;
    life: number;
    mesh: import('@babylonjs/core').Mesh | null;
  }[] = [];

  private score: number;
  private lives: number;
  private level: number;
  private cbs: GameCallbacks;

  private platforms: (PlatDef & { curX: number; moveDir: number })[] = [];
  private coins: (CoinDef & { collected: boolean })[] = [];
  private enemies: (EnemyDef & { alive: boolean; curX: number; curY: number; hitsLeft: number })[] = [];

  private camX   = 0;
  private worldW = 2400;
  private isBossLevel = false;
  private bossHitsMax = 0;
  private sessionSeed: number;

  // Babylon
  private engine: import('@babylonjs/core').AbstractEngine | null = null;
  private scene:  import('@babylonjs/core').Scene  | null = null;
  // Cached BJS module reference (set once in initBabylon)
  private bjs: typeof import('@babylonjs/core') | null = null;

  // Babylon mesh refs
  private playerMesh:  import('@babylonjs/core').Mesh | null = null;
  private playerHead:  import('@babylonjs/core').Mesh | null = null;
  private platMeshes:  import('@babylonjs/core').Mesh[] = [];
  private coinMeshes:  (import('@babylonjs/core').Mesh | null)[] = [];
  private enemyMeshes: (import('@babylonjs/core').Mesh | null)[] = [];
  private bgPlane:     import('@babylonjs/core').Mesh | null = null;

  // Goal star meshes
  private goalMesh:    import('@babylonjs/core').Mesh | null = null;
  private goalRing:    import('@babylonjs/core').Mesh | null = null;
  private goalIdx:     number = -1;

  // Parallax background stars
  private bgStars: { mesh: import('@babylonjs/core').Mesh; baseX: number; parallax: number }[] = [];
  private skylineBands: { mesh: import('@babylonjs/core').Mesh; baseX: number; parallax: number; pulseOffset: number }[] = [];
  private shadowGen: import('@babylonjs/core').ShadowGenerator | null = null;

  // camera ref
  private camMesh: import('@babylonjs/core').FreeCamera | null = null;

  // particles
  private dustPS: import('@babylonjs/core').ParticleSystem | null = null;

  // anim
  private animTick = 0;

  // guard: prevent multiple onDie calls before React re-renders
  private dying = false;

  constructor(
    canvas: HTMLCanvasElement,
    level: number,
    score: number,
    lives: number,
    cbs: GameCallbacks,
    sessionSeed = 1,
  ) {
    this.level = level;
    this.score = score;
    this.lives = lives;
    this.cbs   = cbs;
    this.sessionSeed = sessionSeed;
    this.initLevel(level);
    this.initBabylon(canvas);
  }

  private initLevel(n: number) {
    const def = makeLevel(n, this.sessionSeed);
    this.worldW      = def.worldW;
    this.isBossLevel = def.isBossLevel ?? false;
    this.platforms   = def.platforms.map(p => ({ ...p, curX: p.x, moveDir: 1 }));
    this.coins       = def.coins.map(c => ({ ...c, collected: false }));
    this.enemies     = def.enemies.map(e => ({
      ...e, alive: true, curX: e.x, curY: e.y,
      hitsLeft: e.hitsLeft ?? 1,
    }));
    // Track max boss HP for health-bar percentage calculations
    const bossEnemy = def.enemies.find(e => e.boss);
    this.bossHitsMax = bossEnemy?.hitsLeft ?? 0;
    this.px    = 60;
    this.py    = 350;
    this.pvx   = 0;
    this.pvy   = 0;
    this.camX  = 0;
    this.onGround  = false;
    this.jumpCount = 0;
    this.coyoteFr  = 0;
    this.jBufFr    = 0;
    this.prevJump  = false;
    this.invincible = 0;
    this.dying  = false;
    this.goalIdx = -1;
    // Reset combat state
    this.dashFrames = 0;
    this.dashCool   = 0;
    this.comboCount = 0;
    this.comboTimestamp = 0;
    // Dispose any live projectiles
    for (const p of this.projectiles) p.mesh?.dispose();
    this.projectiles = [];
  }

  private async initBabylon(canvas: HTMLCanvasElement) {
    const [{ engine: engineInst }, BJS] = await Promise.all([
      createBabylonEngine(canvas, { preserveDrawingBuffer: true, stencil: true, antialias: true }),
      import('@babylonjs/core'),
    ]);
    if (this.disposed) { engineInst.dispose(); return; }

    const engine = engineInst;
    const scene  = new BJS.Scene(engine);
    this.engine  = engine;
    this.scene   = scene;
    this.bjs     = BJS;

    // Sky gradient — zone-themed
    const zone = ZONES[getZoneIdx(this.level)];
    scene.clearColor = new BJS.Color4(zone.sky[0], zone.sky[1], zone.sky[2], 1);

    // ── Camera (FreeCamera, side-view looking in +Z direction) ──────────────
    const cam = new BJS.FreeCamera('cam', new BJS.Vector3(0, 6, -22), scene);
    cam.setTarget(new BJS.Vector3(0, 6, 0));
    this.camMesh = cam;

    // ── Lighting ─────────────────────────────────────────────────────────────
    const ambient = new BJS.HemisphericLight('amb', new BJS.Vector3(0, 1, 0), scene);
    ambient.intensity  = 0.82;
    ambient.diffuse    = new BJS.Color3(0.85, 0.90, 1.0);
    ambient.groundColor= new BJS.Color3(0.1, 0.1, 0.25);

    const sun = new BJS.DirectionalLight('sun', new BJS.Vector3(0.35, -1, 0.45), scene);
    sun.intensity = 0.95;
    sun.diffuse   = new BJS.Color3(1.0, 0.95, 0.8);
    sun.shadowMinZ = 1;
    sun.shadowMaxZ = 70;
    const shadowGen = new BJS.ShadowGenerator(2048, sun);
    shadowGen.usePercentageCloserFiltering = true;
    shadowGen.filteringQuality = BJS.ShadowGenerator.QUALITY_HIGH;
    shadowGen.bias = 0.0008;
    this.shadowGen = shadowGen;

    // ── Glow layer ───────────────────────────────────────────────────────────
    const glow = new BJS.GlowLayer('glow', scene);
    glow.intensity = 0.9;

    // MADMAXI graphics upgrade: lightweight post-processing for clearer highlights
    // and smoother edges without changing gameplay physics.
    const pipeline = new BJS.DefaultRenderingPipeline('madmaxi-pipeline', true, scene, [cam]);
    pipeline.samples = 2;
    pipeline.fxaaEnabled = true;
    pipeline.imageProcessingEnabled = true;
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.72;
    pipeline.bloomWeight = 0.34;
    pipeline.bloomKernel = 62;
    pipeline.bloomScale = 0.76;

    // ── Background plane (starfield / gradient) ──────────────────────────────
    const bg = BJS.MeshBuilder.CreatePlane('bg', { width: 120, height: 40 }, scene);
    bg.position = new BJS.Vector3(0, 8, 10);
    const bgMat = new BJS.StandardMaterial('bgMat', scene);
    bgMat.diffuseColor  = new BJS.Color3(0.04, 0.06, 0.16);
    bgMat.emissiveColor = new BJS.Color3(0.06, 0.09, 0.25);
    bgMat.backFaceCulling = false;
    bg.material = bgMat;
    this.bgPlane = bg;

    // Aurora skyline bands — animated, layered backdrop for MADMAXI visual upgrade.
    const skylineLayers: [number, number, number, number][] = [
      [0.05, 12, 0.17, 0.24],
      [0.09, 10, 0.22, 0.20],
      [0.14, 8, 0.29, 0.16],
    ];
    skylineLayers.forEach(([parallax, depth, sat, alpha], idx) => {
      const band = BJS.MeshBuilder.CreatePlane(`skyline_band_${idx}`, { width: 140, height: 18 }, scene);
      const mat = new BJS.StandardMaterial(`skyline_mat_${idx}`, scene);
      mat.disableLighting = true;
      mat.alpha = alpha;
      mat.backFaceCulling = false;
      mat.diffuseColor = new BJS.Color3(zone.sky[0] + sat, zone.sky[1] + sat * 0.7, zone.sky[2] + sat * 1.05);
      mat.emissiveColor = new BJS.Color3(zone.sky[0] + sat * 0.6, zone.sky[1] + sat * 0.45, zone.sky[2] + sat);
      band.material = mat;
      band.position.set(0, 10 + idx * 2.4, depth);
      this.skylineBands.push({ mesh: band, baseX: 0, parallax, pulseOffset: idx * 1.8 });
    });

    // ── Parallax star layers (3 depths, scrolling at different rates) ────────
    const rng = seededRng(this.level * STAR_SEED_PRIME + STAR_SEED_OFFSET);
    // layer config: [parallaxFactor, z-depth, count, size-range]
    const starLayers: [number, number, number, number][] = [
      [0.04, 14, 26, 0.07],   // distant — slowest parallax, deep z
      [0.09,  9, 18, 0.09],   // mid
      [0.16,  5, 12, 0.11],   // near — fastest parallax, shallow z
    ];
    for (const [parallax, depth, count, size] of starLayers) {
      for (let s = 0; s < count; s++) {
        const star = BJS.MeshBuilder.CreateSphere(`bgs_l${depth}_${s}`,
          { diameter: size + rng() * size, segments: 6 }, scene);
        const mat = new BJS.StandardMaterial(`bgsm_${depth}_${s}`, scene);
        const b = 0.55 + rng() * 0.45;
        mat.emissiveColor = new BJS.Color3(b * 0.90, b * 0.93, b);
        mat.disableLighting = true;
        star.material = mat;
        const baseX = (rng() - 0.5) * 54;
        star.position.set(baseX, rng() * 13 + 0.5, depth);
        this.bgStars.push({ mesh: star, baseX, parallax });
      }
    }

    // ── Platform meshes ───────────────────────────────────────────────────────
    for (const p of this.platforms) {
      const bw = p.w / PX_PER_BU;
      const bh = p.h / PX_PER_BU;
      const mesh = BJS.MeshBuilder.CreateBox(`plat_${p.x}`, { width: bw, height: bh, depth: 1.2 }, scene);
      const mat  = new BJS.StandardMaterial(`pmat_${p.x}`, scene);

      if (p.type === 'goal') {
        mat.diffuseColor  = new BJS.Color3(0.9, 0.7, 0.1);
        mat.emissiveColor = new BJS.Color3(0.5, 0.35, 0.0);
        glow.addIncludedOnlyMesh(mesh);
      } else if (p.type === 'moving') {
        mat.diffuseColor  = new BJS.Color3(0.2, 0.55, 0.85);
        mat.emissiveColor = new BJS.Color3(0.05, 0.15, 0.3);
      } else {
        const isGround = p.y === 400;
        mat.diffuseColor  = isGround
          ? new BJS.Color3(zone.gnd[0], zone.gnd[1], zone.gnd[2])
          : new BJS.Color3(zone.plt[0], zone.plt[1], zone.plt[2]);
        mat.emissiveColor = new BJS.Color3(zone.em[0], zone.em[1], zone.em[2]);
      }
      mat.specularColor = new BJS.Color3(0.15, 0.2, 0.4);
      mesh.material = mat;
      mesh.receiveShadows = true;
      shadowGen.addShadowCaster(mesh, false);
      this.platMeshes.push(mesh);
    }

    // ── Coin meshes ───────────────────────────────────────────────────────────
    // Goal coin is special: rendered as an animated star (sphere + torus ring).
    const goalMat = new BJS.StandardMaterial('goalMat', scene);
    goalMat.diffuseColor  = new BJS.Color3(1.0, 0.85, 0.10);
    goalMat.emissiveColor = new BJS.Color3(0.70, 0.42, 0.00);
    goalMat.specularColor = new BJS.Color3(1.0, 0.9, 0.3);

    for (let i = 0; i < this.coins.length; i++) {
      const c = this.coins[i];
      if (c.isGoal) {
        this.goalIdx = i;
        // Central star body
        const star = BJS.MeshBuilder.CreateSphere(`goal_body`, { diameter: 0.88, segments: 10 }, scene);
        star.material = goalMat;
        shadowGen.addShadowCaster(star, false);
        glow.addIncludedOnlyMesh(star);
        this.goalMesh = star;
        // Orbiting torus ring
        const ring = BJS.MeshBuilder.CreateTorus(`goal_ring`,
          { diameter: 1.5, thickness: 0.10, tessellation: 28 }, scene);
        ring.material = goalMat;
        shadowGen.addShadowCaster(ring, false);
        glow.addIncludedOnlyMesh(ring);
        this.goalRing = ring;
        this.coinMeshes.push(null); // keep index aligned with this.coins[] for collision detection
      } else {
        const mesh = BJS.MeshBuilder.CreateSphere(`coin_${c.x}_${c.y}`,
          { diameter: 0.42, segments: 14 }, scene);
        const mat  = new BJS.StandardMaterial(`cmat_${c.x}`, scene);
        mat.diffuseColor  = new BJS.Color3(0.95, 0.75, 0.1);
        mat.emissiveColor = new BJS.Color3(0.35, 0.25, 0.0);
        mesh.material = mat;
        shadowGen.addShadowCaster(mesh, false);
        glow.addIncludedOnlyMesh(mesh);
        this.coinMeshes.push(mesh);
      }
    }

    // ── Enemy meshes ──────────────────────────────────────────────────────────
    for (let ei = 0; ei < this.enemies.length; ei++) {
      const en = this.enemies[ei];
      const isBoss  = !!en.boss;
      const diameter = isBoss ? 0.85 * (en.size ?? 1.8) : 0.85;
      const mesh = BJS.MeshBuilder.CreateSphere(`enemy_${ei}`,
        { diameter, segments: isBoss ? 24 : 16 }, scene);
      const mat  = new BJS.StandardMaterial(`emat_${ei}`, scene);
      if (isBoss && en.bossColor) {
        const [r,g,b] = en.bossColor;
        const [er,eg,eb] = en.bossEmissive ?? [r*0.4,g*0.4,b*0.4];
        mat.diffuseColor  = new BJS.Color3(r, g, b);
        mat.emissiveColor = new BJS.Color3(er, eg, eb);
        mat.specularColor = new BJS.Color3(0.8, 0.7, 0.4);
      } else {
        mat.diffuseColor  = new BJS.Color3(0.85, 0.18, 0.18);
        mat.emissiveColor = new BJS.Color3(0.35, 0.03, 0.03);
        mat.specularColor = new BJS.Color3(0.5, 0.1, 0.1);
      }
      mesh.material = mat;
      shadowGen.addShadowCaster(mesh, false);
      glow.addIncludedOnlyMesh(mesh);
      this.enemyMeshes.push(mesh);
    }

    // ── Player meshes (body + head) ───────────────────────────────────────────
    const body = BJS.MeshBuilder.CreateCapsule('player',
      { radius: 0.32, height: 1.0, tessellation: 20, subdivisions: 6 }, scene);
    const bodyMat = new BJS.StandardMaterial('bodyMat', scene);
    bodyMat.diffuseColor  = new BJS.Color3(0.1, 0.55, 0.95);
    bodyMat.emissiveColor = new BJS.Color3(0.03, 0.18, 0.45);
    bodyMat.specularColor = new BJS.Color3(0.4, 0.7, 1.0);
    body.material = bodyMat;
    shadowGen.addShadowCaster(body, true);
    glow.addIncludedOnlyMesh(body);
    this.playerMesh = body;

    const head = BJS.MeshBuilder.CreateSphere('phead', { diameter: 0.42, segments: 18 }, scene);
    const headMat = new BJS.StandardMaterial('headMat', scene);
    headMat.diffuseColor  = new BJS.Color3(0.85, 0.80, 0.70);
    headMat.emissiveColor = new BJS.Color3(0.15, 0.12, 0.08);
    head.material = headMat;
    shadowGen.addShadowCaster(head, true);
    glow.addIncludedOnlyMesh(head);
    this.playerHead = head;

    // ── Particle system (landing/jump dust) ────────────────────────────────
    const dust = new BJS.ParticleSystem('dust', 60, scene);
    // Use a 1x1 white data-URI texture for cross-origin-safe particles
    dust.particleTexture  = new BJS.Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
      scene,
    );
    dust.emitter          = new BJS.Vector3(0, 0, 0);
    dust.minSize          = 0.08;
    dust.maxSize          = 0.22;
    dust.minLifeTime      = 0.2;
    dust.maxLifeTime      = 0.5;
    dust.minEmitPower     = 0.8;
    dust.maxEmitPower     = 2.0;
    dust.emitRate         = 0;
    dust.direction1       = new BJS.Vector3(-1.5, 1, -0.5);
    dust.direction2       = new BJS.Vector3(1.5,  2,  0.5);
    dust.color1 = new BJS.Color4(0.4, 0.65, 1.0, 0.8);
    dust.color2 = new BJS.Color4(0.2, 0.4,  0.8, 0.4);
    dust.colorDead = new BJS.Color4(0, 0, 0, 0);
    dust.gravity  = new BJS.Vector3(0, -4, 0);
    dust.start();
    this.dustPS = dust;

    // ── Render loop + God Tier ─────────────────────────────────────────────
    let lastGtMs = 0;
    engine.runRenderLoop(() => {
      if (this.disposed) return;
      this.tick();
      scene.render();
      // God Tier hardware scaling — check every 3000ms
      const now = performance.now();
      if (now - lastGtMs > 3000) {
        lastGtMs = now;
        const perf = (engine as import('@babylonjs/core').Engine).performanceMonitor;
        const avgFrame = perf ? perf.averageFrameTime : 16.6;
        const gt = this.godTier.update({
          device:  defaultDeviceSignals(),
          runtime: { frameMs: avgFrame, avgFrameMs: avgFrame, cpuMs: avgFrame * 0.4, gpuMs: avgFrame * 0.5, droppedFrameRatio: perf ? (perf.averageFrameTime > 20 ? 0.1 : 0) : 0, inputLatencyMs: 20, scrollVelocity: 0, pointerVelocity: 0, interactionBurst: 0 },
          ux:      defaultUXSignals(),
          route:   defaultRouteSignals('/game/madmaxi'),
          meshes:  scene.meshes.map((m) => ({
            id: m.id, visible: m.isVisible, interactive: m.isPickable, nearPointer: false,
            distanceToCamera: 10, transformDelta: 0, materialChanged: false,
            screenCoverage: m.id === 'player' ? 0.15 : 0.05,
            semanticWeight: m.id === 'player' || m.id === 'goal' ? 1.0 : 0.3,
            motionWeight:   m.id === 'player' ? 1.0 : 0.2,
            detailWeight:   0.5,
            heroWeight:     m.id === 'player' ? 1.0 : 0.2,
            occluded: false,
          })),
          ui: [],
        });
        applyGodTierToBabylon(engine, scene as unknown as BabylonSceneLike, gt, window.devicePixelRatio ?? 1);
      }
    });

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => { this.engine?.resize(); };

  setKeys(k: Set<string>) { this.keys = k; }
  setVpad(v: VPad)        { this.vpad = v; }

  // ── Physics & logic tick ──────────────────────────────────────────────────
  private tick() {
    if (!this.engine || !this.scene) return;
    if (this.dying) return;
    this.animTick++;

    const isLeft  = this.keys.has('ArrowLeft')  || this.keys.has('KeyA')  || this.vpad.left;
    const isRight = this.keys.has('ArrowRight') || this.keys.has('KeyD')  || this.vpad.right;
    const isJump  = this.keys.has('ArrowUp')    || this.keys.has('KeyW')  || this.keys.has('Space') || this.vpad.jump;
    const isDash  = this.vpad.dash;

    // Jump buffer — remember a fresh jump press for JBUF_MS frames
    const freshJump = isJump && !this.prevJump;
    if (freshJump) this.jBufFr = JBUF_MS;
    if (this.jBufFr > 0) this.jBufFr--;
    this.prevJump = isJump;

    // ── Dash system ────────────────────────────────────────────────────────
    if (this.dashCool > 0) this.dashCool--;
    if (isDash && this.dashCool === 0 && this.dashFrames === 0) {
      this.dashDir    = this.facingR ? 1 : -1;
      this.dashFrames = DASH_DUR;
      this.dashCool   = DASH_COOL;
      this.invincible = Math.max(this.invincible, DASH_DUR + 2); // i-frames during dash
      this.cbs.onDash?.();
    }

    // ── Horizontal movement ────────────────────────────────────────────────
    if (this.dashFrames > 0) {
      this.pvx = this.dashDir * DASH_SPD * PX_PER_BU;
      this.dashFrames--;
    } else {
      this.pvx = isRight ? WALK_SPD * PX_PER_BU
                : isLeft  ? -WALK_SPD * PX_PER_BU
                : 0;
    }
    if (isRight) this.facingR = true;
    if (isLeft)  this.facingR = false;

    // Gravity
    this.pvy += GRAV * PX_PER_BU;
    if (this.pvy > MAX_FALL * PX_PER_BU) this.pvy = MAX_FALL * PX_PER_BU;

    // Move
    this.px += this.pvx;
    this.py += this.pvy;

    // World bounds (clamp left, don't scroll past right until goal)
    if (this.px < 0) { this.px = 0; this.pvx = 0; }

    // ── Platform collisions ───────────────────────────────────────────────
    const wasOnGround = this.onGround;
    this.onGround = false;

    const PW = 28, PH = 40; // player hitbox

    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      // Update moving platform
      if (p.type === 'moving' && p.moveRange && p.moveSpd) {
        p.curX += p.moveSpd * p.moveDir;
        if (p.curX > p.x + p.moveRange || p.curX < p.x - p.moveRange)
          p.moveDir *= -1;
      } else {
        p.curX = p.x;
      }

      // AABB collision (player bottom vs platform top)
      const px2 = this.px + PW, py2 = this.py + PH;
      const tx2 = p.curX + p.w,  ty2 = p.y + p.h;
      const tx  = p.curX,         ty  = p.y;

      if (px2 > tx && this.px < tx2 && py2 > ty && this.py < ty2) {
        const overlapT = py2 - ty;
        const overlapB = ty2 - this.py;
        const overlapL = px2 - tx;
        const overlapR = tx2 - this.px;
        const minOv    = Math.min(overlapT, overlapB, overlapL, overlapR);

        if (minOv === overlapT && this.pvy >= 0) {
          // Land on top
          this.py = ty - PH;
          this.pvy = 0;
          this.onGround = true;
          this.jumpCount = 0;
          // Moving platform drag
          if (p.type === 'moving') this.px += (p.moveSpd ?? 0) * p.moveDir;
        } else if (minOv === overlapB && this.pvy < 0) {
          // Hit ceiling
          this.py = ty2;
          this.pvy = 0;
        } else if (minOv === overlapL) {
          this.px = tx - PW;
          this.pvx = 0;
        } else if (minOv === overlapR) {
          this.px = tx2;
          this.pvx = 0;
        }
      }
    }

    // Coyote time
    if (wasOnGround && !this.onGround) {
      this.coyoteFr = COYOTE_MS;
    }
    if (this.onGround) this.coyoteFr = 0;
    if (this.coyoteFr > 0) this.coyoteFr--;

    // Jump: ground jump, coyote jump, or double-jump
    const canJump = this.onGround || this.coyoteFr > 0;
    if (this.jBufFr > 0) {
      if (canJump && this.jumpCount === 0) {
        this.pvy       = -JUMP_VY * PX_PER_BU;
        this.jumpCount = 1;
        this.jBufFr    = 0;
        this.coyoteFr  = 0;
        this.emitDust();
      } else if (!canJump && this.jumpCount === 1) {
        // Double-jump
        this.pvy       = -JUMP_VY * 0.85 * PX_PER_BU;
        this.jumpCount = 2;
        this.jBufFr    = 0;
        this.emitDust();
      }
    }

    // Fell off screen — die
    if (this.py > GH + 60) {
      this.dying = true;
      this.lives--;
      this.cbs.onDie(this.lives);
      return;
    }

    // Emit progress (every 15 frames to avoid excessive re-renders)
    if (this.animTick % 15 === 0) {
      this.cbs.onProgress?.(Math.min(100, Math.round((this.px / this.worldW) * 100)));
    }

    // ── Coin collection ────────────────────────────────────────────────────
    const CW = 18, PCX = this.px + PW / 2, PCY = this.py + PH / 2;
    for (let i = 0; i < this.coins.length; i++) {
      const c = this.coins[i];
      if (c.collected) continue;
      const cx = c.x + CW / 2, cy = c.y + CW / 2;
      if (Math.abs(PCX - cx) < CW + 8 && Math.abs(PCY - cy) < CW + 8) {
        c.collected = true;
        if (c.isGoal) {
          // Hide the goal star meshes
          this.goalMesh?.setEnabled(false);
          this.goalMesh = null;
          this.goalRing?.setEnabled(false);
          this.goalRing = null;
          this.score += 500;
          this.cbs.onScore(this.score);
          this.cbs.onComplete(this.level + 1);
          return;
        } else {
          if (this.coinMeshes[i]) {
            this.coinMeshes[i]!.setEnabled(false);
            this.coinMeshes[i] = null;
          }
          this.score += 100;
          this.cbs.onScore(this.score);
        }
      }
    }

    // ── Enemy collisions ──────────────────────────────────────────────────
    if (this.invincible > 0) this.invincible--;

    for (let i = 0; i < this.enemies.length; i++) {
      const en = this.enemies[i];
      if (!en.alive) continue;

      // Boss enrages at ≤50% HP — speed multiplied by 1.5
      const enrageMultiplier = (en.boss && this.bossHitsMax > 0 && en.hitsLeft / this.bossHitsMax <= BOSS_ENRAGE_THRESHOLD) ? BOSS_ENRAGE_MULTIPLIER : 1.0;

      // Move enemy
      en.curX += en.vx * enrageMultiplier;
      // Reverse at world edges
      const groundPlat = this.platforms.find(p => p.y === 400);
      const gLeft  = groundPlat ? groundPlat.x : 0;
      const gRight = gLeft + (groundPlat ? groundPlat.w : this.worldW);
      // Boss uses scaled hitbox
      const eSize = en.boss ? Math.round((en.size ?? 1.8) * 32) : 32;
      if (en.curX < gLeft || en.curX > gRight - eSize) en.vx *= -1;

      const ex2 = en.curX + eSize, ey2 = en.curY + eSize;
      const px2e = this.px + PW, py2e = this.py + PH;

      if (px2e > en.curX && this.px < ex2 && py2e > en.curY && this.py < ey2) {
        const stompThreshold = en.boss ? (en.size ?? 1.8) * 22 : 22;
        const stompOv = py2e - en.curY;
        if (stompOv < stompThreshold && this.pvy > 0) {
          // Stomp hit!
          en.hitsLeft--;
          this.pvy = -JUMP_VY * 0.7 * PX_PER_BU;
          if (en.boss) {
            // Report boss HP update before checking for death
            this.cbs.onBossHp?.(en.hitsLeft);
            if (en.hitsLeft <= 0) {
              // Boss defeated — boss level victory
              en.alive = false;
              if (this.enemyMeshes[i]) {
                this.enemyMeshes[i]!.setEnabled(false);
                this.enemyMeshes[i] = null;
              }
              this.score += this.bossHitsMax * 300;
              this.cbs.onScore(this.score);
              this.cbs.onComplete(this.level + 1);
              return;
            }
            // Boss still alive — bounce player higher for drama
            this.pvy = -JUMP_VY * 0.9 * PX_PER_BU;
          } else {
            en.alive = false;
            if (this.enemyMeshes[i]) {
              this.enemyMeshes[i]!.setEnabled(false);
              this.enemyMeshes[i] = null;
            }
            // Combo kill scoring
            const now = Date.now();
            if (now - this.comboTimestamp < COMBO_WIN) {
              this.comboCount++;
            } else {
              this.comboCount = 1;
            }
            this.comboTimestamp = now;
            this.score += 200 * this.comboCount;
            this.cbs.onScore(this.score);
            this.cbs.onCombo?.(this.comboCount);
          }
        } else if (this.invincible === 0) {
          // Hit by enemy
          this.dying = true;
          this.invincible = 90;
          this.lives--;
          this.cbs.onDie(this.lives);
          return;
        }
      }

      // ── Boss projectile firing ─────────────────────────────────────────
      if (en.boss && en.alive && this.animTick % 80 === 0) {
        // Boss fires a projectile toward the player
        const PW2 = 28;
        const bCX = en.curX + (en.size ?? 1.8) * 32 / 2;
        const bCY = en.curY + (en.size ?? 1.8) * 32 / 2;
        const pCX = this.px + PW2 / 2;
        const pCY = this.py + 20;
        const dx = pCX - bCX;
        const dy = pCY - bCY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const projMesh = (this.scene && this.bjs) ? ((): import('@babylonjs/core').Mesh | null => {
          try {
            const BJS = this.bjs!;
            const m = BJS.MeshBuilder.CreateSphere('proj_' + Date.now(),
              { diameter: 0.35, segments: 6 }, this.scene!);
            const mat = new BJS.StandardMaterial('projMat', this.scene!);
            mat.emissiveColor = new BJS.Color3(1, 0.2, 0.2);
            m.material = mat;
            m.position.set(
              (bCX - this.camX - GW / 2) / PX_PER_BU,
              -(bCY - GH / 2) / PX_PER_BU,
              0.5,
            );
            return m;
          } catch { return null; }
        })() : null;

        this.projectiles.push({
          x: bCX, y: bCY,
          vx: (dx / dist) * PROJ_SPD,
          vy: (dy / dist) * PROJ_SPD,
          life: PROJ_LIFE,
          mesh: projMesh,
        });
      }
    }

    // ── Projectile updates ───────────────────────────────────────────────
    for (let p = this.projectiles.length - 1; p >= 0; p--) {
      const proj = this.projectiles[p];
      proj.life--;
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Update mesh position
      if (proj.mesh) {
        proj.mesh.position.x = (proj.x - this.camX - GW / 2) / PX_PER_BU;
        proj.mesh.position.y = -(proj.y - GH / 2) / PX_PER_BU;
      }

      // Expire
      if (proj.life <= 0 || proj.y > GH + 20) {
        proj.mesh?.dispose();
        this.projectiles.splice(p, 1);
        continue;
      }

      // Hit player
      if (this.invincible === 0 &&
          proj.x > this.px - 8 && proj.x < this.px + PW + 8 &&
          proj.y > this.py - 8 && proj.y < this.py + PH + 8) {
        proj.mesh?.dispose();
        this.projectiles.splice(p, 1);
        this.dying = true;
        this.invincible = 90;
        this.lives--;
        this.cbs.onDie(this.lives);
        return;
      }
    }

    // ── Smooth camera follow ─────────────────────────────────────────────
    const targetCamX = this.px - GW / 3;
    const maxCamX    = this.worldW - GW;
    this.camX += (Math.max(0, Math.min(maxCamX, targetCamX)) - this.camX) * 0.09;

    // ── Sync Babylon meshes ──────────────────────────────────────────────
    this.syncMeshes();
  }

  private emitDust() {
    if (!this.dustPS) return;
    const bx = (this.px + 14 - this.camX - GW / 2) / PX_PER_BU;
    const by = -(this.py + 40 - GH / 2) / PX_PER_BU;
    (this.dustPS.emitter as import('@babylonjs/core').Vector3).set(bx, by, 0);
    this.dustPS.manualEmitCount = 12;
  }

  private syncMeshes() {
    const toB = (lx: number, ly: number, lw = 0, lh = 0) => ({
      bx: (lx + lw / 2 - this.camX - GW / 2) / PX_PER_BU,
      by: -(ly + lh / 2 - GH / 2) / PX_PER_BU,
    });

    // Platforms
    for (let i = 0; i < this.platMeshes.length; i++) {
      const p = this.platforms[i];
      const { bx, by } = toB(p.curX, p.y, p.w, p.h);
      this.platMeshes[i].position.x = bx;
      this.platMeshes[i].position.y = by;
      this.platMeshes[i].position.z = 0;
    }

    // Coins (regular only — goal coin handled separately below)
    const coinY = Math.sin(this.animTick * 0.05) * 0.1; // bob animation
    for (let i = 0; i < this.coinMeshes.length; i++) {
      const m = this.coinMeshes[i];
      if (!m) continue;
      const c = this.coins[i];
      const { bx, by } = toB(c.x, c.y, 18, 18);
      m.position.x = bx;
      m.position.y = by + coinY;
      m.position.z = 0.2;
      m.rotation.y = this.animTick * 0.04;
    }

    // Goal star (sphere + orbiting torus ring)
    if (this.goalMesh && this.goalIdx >= 0) {
      const gc = this.coins[this.goalIdx];
      if (!gc.collected) {
        const floatY = Math.sin(this.animTick * 0.055) * 0.20;
        const pulse  = 1.0 + Math.sin(this.animTick * 0.08) * 0.12;
        const { bx, by } = toB(gc.x, gc.y, 18, 18);
        this.goalMesh.position.set(bx, by + floatY, 0.2);
        this.goalMesh.scaling.setAll(pulse);
        this.goalMesh.rotation.y = this.animTick * 0.05;
        if (this.goalRing) {
          this.goalRing.position.set(bx, by + floatY, 0.2);
          this.goalRing.rotation.y  =  this.animTick * 0.04;
          this.goalRing.rotation.x  = Math.PI / 3 + Math.sin(this.animTick * 0.025) * 0.35;
          this.goalRing.scaling.setAll(pulse);
        }
      }
    }

    // Enemies
    for (let i = 0; i < this.enemyMeshes.length; i++) {
      const m = this.enemyMeshes[i];
      if (!m) continue;
      const en = this.enemies[i];
      const eSize = en.boss ? Math.round((en.size ?? 1.8) * 32) : 32;
      const { bx, by } = toB(en.curX, en.curY, eSize, eSize);
      m.position.x = bx;
      m.position.y = by;
      m.position.z = 0;
      if (en.boss) {
        // Boss visual: shrinks as it loses HP; pulses faster when enraged
        const hpRatio     = this.bossHitsMax > 0 ? en.hitsLeft / this.bossHitsMax : 1;
        const enraged     = hpRatio <= BOSS_ENRAGE_THRESHOLD;
        const pulseSpeed  = enraged ? 0.18 : 0.08;
        const pulse       = 1 + Math.sin(this.animTick * pulseSpeed) * 0.07;
        const healthScale = 0.70 + hpRatio * 0.30; // 1.0 full HP → 0.70 at last hit
        m.scaling.setAll(healthScale * pulse);
      } else {
        const pulse = 1 + Math.sin(this.animTick * 0.1 + i) * 0.06;
        m.scaling.setAll(pulse);
      }
    }

    // Player
    const PW = 28, PH = 40;
    const { bx: pbx, by: pby } = toB(this.px, this.py, PW, PH);
    if (this.playerMesh) {
      this.playerMesh.position.x = pbx;
      this.playerMesh.position.y = pby;
      this.playerMesh.position.z = 0;
      // Squash-stretch
      if (this.onGround) {
        this.playerMesh.scaling.x = 1.15;
        this.playerMesh.scaling.y = 0.88;
      } else {
        this.playerMesh.scaling.x = 0.88;
        this.playerMesh.scaling.y = 1.15;
      }
      this.playerMesh.scaling.z = 1;
      // Flicker when invincible
      this.playerMesh.setEnabled(this.invincible === 0 || (this.animTick & 4) !== 0);
    }
    if (this.playerHead) {
      this.playerHead.position.x = pbx + (this.facingR ? 0.1 : -0.1);
      this.playerHead.position.y = pby + 0.55;
      this.playerHead.position.z = 0;
      this.playerHead.setEnabled(this.invincible === 0 || (this.animTick & 4) !== 0);
    }

    // Parallax background plane
    if (this.bgPlane) {
      this.bgPlane.position.x = this.camX / PX_PER_BU * 0.2;
    }

    // Parallax star layers — each layer scrolls at its own rate
    const camBX = this.camX / PX_PER_BU;
    for (const { mesh, baseX, parallax } of this.bgStars) {
      mesh.position.x = baseX - camBX * parallax;
      const twinkle = 0.92 + Math.sin(this.animTick * 0.045 + baseX) * 0.12;
      mesh.scaling.setAll(twinkle);
    }
    for (const skyline of this.skylineBands) {
      skyline.mesh.position.x = skyline.baseX - camBX * skyline.parallax;
      skyline.mesh.position.y = 10 + Math.sin(this.animTick * 0.01 + skyline.pulseOffset) * 0.9;
    }

    // Camera follows player smoothly in X
    if (this.camMesh) {
      // Camera X is fixed — mesh positions handle horizontal scrolling
      this.camMesh.position.x = 0;
    }
  }

  destroy() {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    this.dustPS?.stop();
    // Clean up projectile meshes
    for (const proj of this.projectiles) proj.mesh?.dispose();
    this.projectiles = [];
    this.scene?.dispose();
    this.engine?.stopRenderLoop();
    this.engine?.dispose();
    this.engine = null;
    this.scene  = null;
    this.bjs    = null;
  }
}

import { getMadmaxiEnemyCount, ZONES } from './config';
import type {
  CoinDef,
  EnemyDef,
  HazardDef,
  LevelDef,
  MadmaxiEnemyKind,
  MadmaxiPowerUpKind,
  PlatDef,
  PowerUpDef,
} from './types';

interface RouteStep {
  gap: number;
  y: number;
  w: number;
  moving?: { range: number; spd: number };
}

interface HazardMarker {
  slot: number;
  type: 'spike' | 'drop';
  xOffset?: number;
  yOffset?: number;
  moveRange?: number;
  moveSpd?: number;
  triggerRadius?: number;
}

interface PowerUpMarker {
  slot: number;
  type: MadmaxiPowerUpKind;
  xOffset?: number;
  yOffset?: number;
}

interface StarterTemplate {
  worldW: number;
  goalY: number;
  goalGap: number;
  encounterName: string;
  encounterStory: string;
  steps: RouteStep[];
  signatureEnemies: MadmaxiEnemyKind[];
  enemyCycle: MadmaxiEnemyKind[];
  hazards: HazardMarker[];
  powerUps: PowerUpMarker[];
}

interface ZoneStarterPack {
  zoneIdx: number;
  levelOne: StarterTemplate;
  levelTwo: StarterTemplate;
}

const PACKS: ZoneStarterPack[] = [
  {
    zoneIdx: 0,
    levelOne: {
      worldW: 2480,
      goalY: 156,
      goalGap: 120,
      encounterName: 'Mosswire Gate',
      encounterStory: 'MAXI storms the meadow perimeter while sentry bots and trap blooms wake in waves.',
      steps: [
        { gap: 140, y: 318, w: 120 },
        { gap: 110, y: 252, w: 132 },
        { gap: 120, y: 194, w: 118 },
        { gap: 110, y: 300, w: 148, moving: { range: 78, spd: 0.74 } },
        { gap: 128, y: 182, w: 104 },
        { gap: 132, y: 248, w: 126 },
        { gap: 118, y: 164, w: 108 },
        { gap: 112, y: 288, w: 140, moving: { range: 58, spd: 0.88 } },
        { gap: 124, y: 204, w: 112 },
      ],
      signatureEnemies: ['runner','charger','hopper','flyer','zigzag','orbiter','sniper','burrower','spiker','shadow'],
      enemyCycle: ['runner','hopper','flyer','shadow'],
      hazards: [
        { slot: 1, type: 'spike', xOffset: 28, yOffset: -14, moveRange: 34, moveSpd: 0.9 },
        { slot: 4, type: 'drop', xOffset: 52, yOffset: -160, triggerRadius: 170 },
        { slot: 7, type: 'spike', xOffset: 48, yOffset: -14, moveRange: 42, moveSpd: 1.0 },
      ],
      powerUps: [
        { slot: 3, type: 'shield', xOffset: 46, yOffset: -56 },
        { slot: 7, type: 'laser', xOffset: 56, yOffset: -58 },
      ],
    },
    levelTwo: {
      worldW: 2860,
      goalY: 146,
      goalGap: 132,
      encounterName: 'Roots of the Wake',
      encounterStory: 'The meadow caves in and resets the pace with faster ambushes, sliding spikes, and collapsing overhead junk.',
      steps: [
        { gap: 120, y: 332, w: 102 },
        { gap: 96, y: 262, w: 92 },
        { gap: 104, y: 192, w: 102 },
        { gap: 96, y: 280, w: 90, moving: { range: 104, spd: 1.18 } },
        { gap: 108, y: 206, w: 84 },
        { gap: 120, y: 302, w: 110 },
        { gap: 104, y: 182, w: 92, moving: { range: 62, spd: 0.94 } },
        { gap: 114, y: 258, w: 110 },
        { gap: 112, y: 154, w: 96 },
        { gap: 122, y: 238, w: 114, moving: { range: 82, spd: 1.02 } },
      ],
      signatureEnemies: ['runner','charger','hopper','flyer','zigzag','orbiter','sniper','burrower','spiker','shadow'],
      enemyCycle: ['charger','zigzag','orbiter','burrower','shadow'],
      hazards: [
        { slot: 3, type: 'spike', xOffset: 32, yOffset: -14, moveRange: 58, moveSpd: 1.12 },
        { slot: 6, type: 'drop', xOffset: 40, yOffset: -150, triggerRadius: 166 },
        { slot: 8, type: 'spike', xOffset: 36, yOffset: -14, moveRange: 46, moveSpd: 1.24 },
        { slot: 9, type: 'drop', xOffset: 46, yOffset: -170, triggerRadius: 180 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 42, yOffset: -60 },
        { slot: 9, type: 'giant', xOffset: 46, yOffset: -60 },
      ],
    },
  },
  {
    zoneIdx: 1,
    levelOne: {
      worldW: 3000,
      goalY: 136,
      goalGap: 148,
      encounterName: 'Prism Tunnel Breach',
      encounterStory: 'Crystal cutters split the cavern into clean kill lanes while drones refract shots through the ceiling.',
      steps: [
        { gap: 128, y: 318, w: 112 },
        { gap: 108, y: 246, w: 102 },
        { gap: 116, y: 176, w: 116 },
        { gap: 100, y: 268, w: 92, moving: { range: 90, spd: 1.06 } },
        { gap: 124, y: 158, w: 108 },
        { gap: 126, y: 236, w: 126 },
        { gap: 112, y: 142, w: 98 },
        { gap: 108, y: 224, w: 120, moving: { range: 72, spd: 0.98 } },
        { gap: 116, y: 182, w: 108 },
      ],
      signatureEnemies: ['flyer','zigzag','orbiter','sniper','hopper','shadow'],
      enemyCycle: ['flyer','orbiter','sniper','zigzag','shadow'],
      hazards: [
        { slot: 2, type: 'drop', xOffset: 44, yOffset: -178, triggerRadius: 154 },
        { slot: 4, type: 'spike', xOffset: 28, yOffset: -14, moveRange: 30, moveSpd: 0.94 },
        { slot: 7, type: 'spike', xOffset: 46, yOffset: -14, moveRange: 36, moveSpd: 1.08 },
      ],
      powerUps: [
        { slot: 3, type: 'laser', xOffset: 34, yOffset: -60 },
        { slot: 7, type: 'shield', xOffset: 54, yOffset: -58 },
      ],
    },
    levelTwo: {
      worldW: 3260,
      goalY: 130,
      goalGap: 154,
      encounterName: 'Shatterline Engine',
      encounterStory: 'The second chamber stacks crystal pistons, falling shards, and orbit drones into a relentless rhythm test.',
      steps: [
        { gap: 110, y: 334, w: 104 },
        { gap: 92, y: 260, w: 90 },
        { gap: 96, y: 198, w: 96 },
        { gap: 100, y: 286, w: 88, moving: { range: 108, spd: 1.22 } },
        { gap: 106, y: 214, w: 94 },
        { gap: 116, y: 164, w: 102 },
        { gap: 110, y: 246, w: 106, moving: { range: 84, spd: 1.08 } },
        { gap: 118, y: 154, w: 92 },
        { gap: 114, y: 230, w: 108 },
        { gap: 122, y: 178, w: 112 },
      ],
      signatureEnemies: ['orbiter','sniper','flyer','zigzag','shadow','charger'],
      enemyCycle: ['orbiter','flyer','sniper','shadow','hopper'],
      hazards: [
        { slot: 1, type: 'spike', xOffset: 24, yOffset: -14, moveRange: 28, moveSpd: 1.04 },
        { slot: 3, type: 'drop', xOffset: 34, yOffset: -168, triggerRadius: 166 },
        { slot: 6, type: 'spike', xOffset: 38, yOffset: -14, moveRange: 44, moveSpd: 1.18 },
        { slot: 8, type: 'drop', xOffset: 46, yOffset: -176, triggerRadius: 182 },
      ],
      powerUps: [
        { slot: 4, type: 'high-jump', xOffset: 40, yOffset: -58 },
        { slot: 8, type: 'giant', xOffset: 44, yOffset: -58 },
      ],
    },
  },
  {
    zoneIdx: 2,
    levelOne: {
      worldW: 3120,
      goalY: 138,
      goalGap: 150,
      encounterName: 'Billboard Riot',
      encounterStory: 'Neon drones, shadow stalkers, and traffic-lane crushers turn the corridor into a live-fire chase.',
      steps: [
        { gap: 122, y: 320, w: 114 },
        { gap: 100, y: 242, w: 102 },
        { gap: 108, y: 184, w: 108 },
        { gap: 98, y: 282, w: 96, moving: { range: 96, spd: 1.12 } },
        { gap: 104, y: 202, w: 92 },
        { gap: 110, y: 154, w: 98 },
        { gap: 116, y: 238, w: 122 },
        { gap: 112, y: 168, w: 100, moving: { range: 78, spd: 1.04 } },
        { gap: 118, y: 228, w: 110 },
      ],
      signatureEnemies: ['runner','charger','flyer','shadow','zigzag','sniper'],
      enemyCycle: ['shadow','flyer','charger','zigzag','orbiter'],
      hazards: [
        { slot: 0, type: 'spike', xOffset: 30, yOffset: -14, moveRange: 32, moveSpd: 1.06 },
        { slot: 3, type: 'drop', xOffset: 46, yOffset: -162, triggerRadius: 170 },
        { slot: 6, type: 'spike', xOffset: 52, yOffset: -14, moveRange: 46, moveSpd: 1.18 },
      ],
      powerUps: [
        { slot: 2, type: 'laser', xOffset: 38, yOffset: -56 },
        { slot: 7, type: 'shield', xOffset: 44, yOffset: -56 },
      ],
    },
    levelTwo: {
      worldW: 3380,
      goalY: 126,
      goalGap: 156,
      encounterName: 'Afterimage Expressway',
      encounterStory: 'Moving overpasses and surveillance turrets punish hesitation while the skyline flickers like a boss warning.',
      steps: [
        { gap: 112, y: 336, w: 100 },
        { gap: 90, y: 264, w: 88 },
        { gap: 94, y: 206, w: 90 },
        { gap: 96, y: 292, w: 86, moving: { range: 114, spd: 1.26 } },
        { gap: 104, y: 220, w: 94 },
        { gap: 110, y: 170, w: 96 },
        { gap: 112, y: 256, w: 104, moving: { range: 90, spd: 1.10 } },
        { gap: 118, y: 178, w: 96 },
        { gap: 112, y: 242, w: 106 },
        { gap: 120, y: 166, w: 100 },
      ],
      signatureEnemies: ['charger','shadow','flyer','sniper','orbiter','zigzag'],
      enemyCycle: ['shadow','charger','sniper','flyer','burrower'],
      hazards: [
        { slot: 2, type: 'spike', xOffset: 22, yOffset: -14, moveRange: 26, moveSpd: 1.1 },
        { slot: 4, type: 'drop', xOffset: 42, yOffset: -170, triggerRadius: 170 },
        { slot: 6, type: 'spike', xOffset: 44, yOffset: -14, moveRange: 48, moveSpd: 1.24 },
        { slot: 8, type: 'drop', xOffset: 46, yOffset: -184, triggerRadius: 188 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 34, yOffset: -56 },
        { slot: 9, type: 'laser', xOffset: 44, yOffset: -56 },
      ],
    },
  },
  {
    zoneIdx: 3,
    levelOne: {
      worldW: 3200,
      goalY: 148,
      goalGap: 146,
      encounterName: 'Skybridge Procession',
      encounterStory: 'Cloudborne escorts sweep MAXI onto floating roads with gust traps and palace defense drones.',
      steps: [
        { gap: 126, y: 304, w: 130 },
        { gap: 110, y: 234, w: 118 },
        { gap: 116, y: 170, w: 120 },
        { gap: 104, y: 252, w: 104, moving: { range: 96, spd: 0.94 } },
        { gap: 128, y: 156, w: 112 },
        { gap: 120, y: 220, w: 124 },
        { gap: 116, y: 142, w: 108 },
        { gap: 122, y: 206, w: 118, moving: { range: 72, spd: 0.9 } },
        { gap: 128, y: 170, w: 110 },
      ],
      signatureEnemies: ['flyer','orbiter','runner','hopper','zigzag','sniper'],
      enemyCycle: ['flyer','orbiter','hopper','runner','shadow'],
      hazards: [
        { slot: 1, type: 'drop', xOffset: 52, yOffset: -174, triggerRadius: 156 },
        { slot: 5, type: 'spike', xOffset: 30, yOffset: -14, moveRange: 32, moveSpd: 0.92 },
        { slot: 7, type: 'drop', xOffset: 44, yOffset: -182, triggerRadius: 182 },
      ],
      powerUps: [
        { slot: 3, type: 'high-jump', xOffset: 36, yOffset: -58 },
        { slot: 8, type: 'shield', xOffset: 44, yOffset: -58 },
      ],
    },
    levelTwo: {
      worldW: 3460,
      goalY: 136,
      goalGap: 152,
      encounterName: 'Stormgate Balcony',
      encounterStory: 'The kingdom answers with lightning rails, patrolling drakes, and brutal forced movement over open air.',
      steps: [
        { gap: 114, y: 326, w: 112 },
        { gap: 94, y: 248, w: 96 },
        { gap: 102, y: 186, w: 98 },
        { gap: 96, y: 270, w: 88, moving: { range: 120, spd: 1.08 } },
        { gap: 104, y: 198, w: 92 },
        { gap: 108, y: 152, w: 96 },
        { gap: 116, y: 240, w: 108, moving: { range: 88, spd: 1.02 } },
        { gap: 118, y: 166, w: 100 },
        { gap: 112, y: 230, w: 106 },
        { gap: 122, y: 162, w: 100 },
      ],
      signatureEnemies: ['flyer','shadow','orbiter','sniper','hopper','charger'],
      enemyCycle: ['flyer','shadow','sniper','orbiter','zigzag'],
      hazards: [
        { slot: 2, type: 'drop', xOffset: 40, yOffset: -176, triggerRadius: 166 },
        { slot: 3, type: 'spike', xOffset: 24, yOffset: -14, moveRange: 30, moveSpd: 1.02 },
        { slot: 6, type: 'drop', xOffset: 38, yOffset: -186, triggerRadius: 188 },
        { slot: 8, type: 'spike', xOffset: 40, yOffset: -14, moveRange: 42, moveSpd: 1.18 },
      ],
      powerUps: [
        { slot: 4, type: 'laser', xOffset: 36, yOffset: -58 },
        { slot: 9, type: 'giant', xOffset: 46, yOffset: -58 },
      ],
    },
  },
  {
    zoneIdx: 4,
    levelOne: {
      worldW: 3280,
      goalY: 144,
      goalGap: 148,
      encounterName: 'Lantern Grave',
      encounterStory: 'Shadow Vale opens with narrow ledges, predatory ambushes, and traps hidden in the low light.',
      steps: [
        { gap: 120, y: 320, w: 110 },
        { gap: 96, y: 252, w: 94 },
        { gap: 102, y: 188, w: 100 },
        { gap: 100, y: 280, w: 90, moving: { range: 92, spd: 1.08 } },
        { gap: 110, y: 212, w: 94 },
        { gap: 116, y: 158, w: 96 },
        { gap: 108, y: 244, w: 106 },
        { gap: 114, y: 174, w: 98, moving: { range: 70, spd: 1.02 } },
        { gap: 120, y: 226, w: 110 },
      ],
      signatureEnemies: ['shadow','burrower','charger','sniper','zigzag','spiker'],
      enemyCycle: ['shadow','burrower','charger','spiker','sniper'],
      hazards: [
        { slot: 0, type: 'spike', xOffset: 26, yOffset: -14, moveRange: 28, moveSpd: 1.0 },
        { slot: 3, type: 'drop', xOffset: 40, yOffset: -168, triggerRadius: 164 },
        { slot: 6, type: 'spike', xOffset: 36, yOffset: -14, moveRange: 40, moveSpd: 1.16 },
      ],
      powerUps: [
        { slot: 2, type: 'shield', xOffset: 34, yOffset: -56 },
        { slot: 7, type: 'laser', xOffset: 42, yOffset: -56 },
      ],
    },
    levelTwo: {
      worldW: 3520,
      goalY: 132,
      goalGap: 156,
      encounterName: 'Blackroot Maw',
      encounterStory: 'The second Vale route tightens into a punishing stealth sprint with sudden drops and close-range brawlers.',
      steps: [
        { gap: 112, y: 334, w: 102 },
        { gap: 92, y: 266, w: 88 },
        { gap: 94, y: 202, w: 90 },
        { gap: 98, y: 292, w: 84, moving: { range: 118, spd: 1.24 } },
        { gap: 104, y: 216, w: 88 },
        { gap: 108, y: 164, w: 92 },
        { gap: 112, y: 252, w: 100 },
        { gap: 118, y: 180, w: 94, moving: { range: 84, spd: 1.08 } },
        { gap: 112, y: 238, w: 102 },
        { gap: 122, y: 174, w: 96 },
      ],
      signatureEnemies: ['shadow','charger','burrower','spiker','sniper','orbiter'],
      enemyCycle: ['shadow','charger','burrower','sniper','zigzag'],
      hazards: [
        { slot: 1, type: 'spike', xOffset: 24, yOffset: -14, moveRange: 26, moveSpd: 1.08 },
        { slot: 4, type: 'drop', xOffset: 42, yOffset: -176, triggerRadius: 176 },
        { slot: 7, type: 'spike', xOffset: 38, yOffset: -14, moveRange: 46, moveSpd: 1.2 },
        { slot: 9, type: 'drop', xOffset: 44, yOffset: -184, triggerRadius: 184 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 32, yOffset: -56 },
        { slot: 8, type: 'giant', xOffset: 40, yOffset: -56 },
      ],
    },
  },
  {
    zoneIdx: 5,
    levelOne: {
      worldW: 3360,
      goalY: 140,
      goalGap: 152,
      encounterName: 'Pressure Trench',
      encounterStory: 'Ocean Abyss kicks off with sinking lanes, predator swarms, and crushing debris timed to your jumps.',
      steps: [
        { gap: 124, y: 322, w: 116 },
        { gap: 102, y: 248, w: 102 },
        { gap: 108, y: 190, w: 108 },
        { gap: 100, y: 286, w: 94, moving: { range: 100, spd: 1.04 } },
        { gap: 112, y: 214, w: 96 },
        { gap: 118, y: 160, w: 100 },
        { gap: 110, y: 246, w: 112 },
        { gap: 116, y: 170, w: 96, moving: { range: 78, spd: 0.98 } },
        { gap: 120, y: 234, w: 110 },
      ],
      signatureEnemies: ['burrower','hopper','orbiter','flyer','shadow','sniper'],
      enemyCycle: ['hopper','burrower','orbiter','flyer','shadow'],
      hazards: [
        { slot: 2, type: 'drop', xOffset: 38, yOffset: -176, triggerRadius: 170 },
        { slot: 5, type: 'spike', xOffset: 24, yOffset: -14, moveRange: 34, moveSpd: 1.0 },
        { slot: 7, type: 'drop', xOffset: 40, yOffset: -182, triggerRadius: 186 },
      ],
      powerUps: [
        { slot: 3, type: 'shield', xOffset: 32, yOffset: -58 },
        { slot: 8, type: 'laser', xOffset: 42, yOffset: -58 },
      ],
    },
    levelTwo: {
      worldW: 3600,
      goalY: 130,
      goalGap: 156,
      encounterName: 'Leviathan Spillway',
      encounterStory: 'Now the abyss fights dirty with faster collapse windows and long-range pressure from the back line.',
      steps: [
        { gap: 114, y: 336, w: 104 },
        { gap: 92, y: 266, w: 90 },
        { gap: 96, y: 206, w: 92 },
        { gap: 98, y: 296, w: 88, moving: { range: 124, spd: 1.22 } },
        { gap: 106, y: 222, w: 90 },
        { gap: 110, y: 168, w: 94 },
        { gap: 112, y: 258, w: 102, moving: { range: 86, spd: 1.08 } },
        { gap: 118, y: 184, w: 96 },
        { gap: 112, y: 244, w: 104 },
        { gap: 124, y: 176, w: 98 },
      ],
      signatureEnemies: ['hopper','shadow','sniper','orbiter','burrower','charger'],
      enemyCycle: ['burrower','hopper','shadow','sniper','orbiter'],
      hazards: [
        { slot: 1, type: 'spike', xOffset: 22, yOffset: -14, moveRange: 28, moveSpd: 1.06 },
        { slot: 4, type: 'drop', xOffset: 40, yOffset: -180, triggerRadius: 180 },
        { slot: 6, type: 'spike', xOffset: 36, yOffset: -14, moveRange: 44, moveSpd: 1.2 },
        { slot: 8, type: 'drop', xOffset: 42, yOffset: -188, triggerRadius: 190 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 30, yOffset: -56 },
        { slot: 9, type: 'giant', xOffset: 42, yOffset: -56 },
      ],
    },
  },
  {
    zoneIdx: 6,
    levelOne: {
      worldW: 3440,
      goalY: 136,
      goalGap: 152,
      encounterName: 'Fractured Timeline',
      encounterStory: 'Time Rift opens with warped pacing, mirrored hazards, and enemies that seem to arrive too early.',
      steps: [
        { gap: 124, y: 320, w: 110 },
        { gap: 102, y: 244, w: 96 },
        { gap: 106, y: 182, w: 100 },
        { gap: 100, y: 278, w: 90, moving: { range: 98, spd: 1.12 } },
        { gap: 112, y: 200, w: 94 },
        { gap: 118, y: 154, w: 96 },
        { gap: 110, y: 236, w: 108 },
        { gap: 118, y: 166, w: 96, moving: { range: 80, spd: 1.04 } },
        { gap: 122, y: 224, w: 108 },
      ],
      signatureEnemies: ['zigzag','orbiter','sniper','shadow','flyer','charger'],
      enemyCycle: ['zigzag','orbiter','shadow','sniper','flyer'],
      hazards: [
        { slot: 1, type: 'drop', xOffset: 44, yOffset: -176, triggerRadius: 164 },
        { slot: 4, type: 'spike', xOffset: 24, yOffset: -14, moveRange: 32, moveSpd: 1.04 },
        { slot: 7, type: 'drop', xOffset: 38, yOffset: -184, triggerRadius: 186 },
      ],
      powerUps: [
        { slot: 3, type: 'laser', xOffset: 34, yOffset: -56 },
        { slot: 8, type: 'shield', xOffset: 42, yOffset: -56 },
      ],
    },
    levelTwo: {
      worldW: 3680,
      goalY: 126,
      goalGap: 160,
      encounterName: 'Clocktear Causeway',
      encounterStory: 'The causeway escalates with fake rhythm changes, high-speed split lanes, and more ruthless edge traps.',
      steps: [
        { gap: 112, y: 338, w: 102 },
        { gap: 92, y: 266, w: 88 },
        { gap: 94, y: 202, w: 90 },
        { gap: 98, y: 294, w: 84, moving: { range: 124, spd: 1.26 } },
        { gap: 104, y: 214, w: 88 },
        { gap: 108, y: 164, w: 92 },
        { gap: 114, y: 250, w: 100, moving: { range: 90, spd: 1.12 } },
        { gap: 118, y: 176, w: 94 },
        { gap: 114, y: 238, w: 102 },
        { gap: 124, y: 170, w: 96 },
      ],
      signatureEnemies: ['shadow','sniper','orbiter','zigzag','charger','hopper'],
      enemyCycle: ['zigzag','shadow','sniper','orbiter','flyer'],
      hazards: [
        { slot: 2, type: 'spike', xOffset: 22, yOffset: -14, moveRange: 26, moveSpd: 1.1 },
        { slot: 4, type: 'drop', xOffset: 40, yOffset: -180, triggerRadius: 176 },
        { slot: 6, type: 'spike', xOffset: 38, yOffset: -14, moveRange: 44, moveSpd: 1.22 },
        { slot: 9, type: 'drop', xOffset: 42, yOffset: -192, triggerRadius: 194 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 30, yOffset: -56 },
        { slot: 8, type: 'giant', xOffset: 40, yOffset: -56 },
      ],
    },
  },
  {
    zoneIdx: 7,
    levelOne: {
      worldW: 3520,
      goalY: 138,
      goalGap: 150,
      encounterName: 'Synapse Run',
      encounterStory: 'Mind Maze pushes pattern recognition: feints, looping enemies, and traps that force you into bad reads.',
      steps: [
        { gap: 122, y: 320, w: 112 },
        { gap: 100, y: 246, w: 96 },
        { gap: 104, y: 186, w: 98 },
        { gap: 102, y: 282, w: 90, moving: { range: 100, spd: 1.12 } },
        { gap: 112, y: 206, w: 92 },
        { gap: 118, y: 158, w: 94 },
        { gap: 110, y: 244, w: 106 },
        { gap: 116, y: 172, w: 96, moving: { range: 82, spd: 1.04 } },
        { gap: 122, y: 230, w: 108 },
      ],
      signatureEnemies: ['orbiter','zigzag','shadow','sniper','flyer','charger'],
      enemyCycle: ['orbiter','zigzag','shadow','hopper','sniper'],
      hazards: [
        { slot: 0, type: 'spike', xOffset: 28, yOffset: -14, moveRange: 30, moveSpd: 1.02 },
        { slot: 3, type: 'drop', xOffset: 40, yOffset: -174, triggerRadius: 166 },
        { slot: 6, type: 'spike', xOffset: 36, yOffset: -14, moveRange: 42, moveSpd: 1.16 },
      ],
      powerUps: [
        { slot: 2, type: 'laser', xOffset: 30, yOffset: -56 },
        { slot: 8, type: 'shield', xOffset: 42, yOffset: -56 },
      ],
    },
    levelTwo: {
      worldW: 3760,
      goalY: 126,
      goalGap: 160,
      encounterName: 'Fear Circuit',
      encounterStory: 'The second maze route weaponizes hesitation with oppressive air space and sharp recovery checks.',
      steps: [
        { gap: 112, y: 338, w: 102 },
        { gap: 92, y: 266, w: 88 },
        { gap: 94, y: 204, w: 90 },
        { gap: 96, y: 294, w: 84, moving: { range: 126, spd: 1.28 } },
        { gap: 106, y: 220, w: 88 },
        { gap: 108, y: 166, w: 90 },
        { gap: 112, y: 252, w: 100, moving: { range: 92, spd: 1.1 } },
        { gap: 118, y: 180, w: 94 },
        { gap: 114, y: 240, w: 102 },
        { gap: 124, y: 172, w: 96 },
      ],
      signatureEnemies: ['shadow','orbiter','sniper','zigzag','charger','spiker'],
      enemyCycle: ['shadow','zigzag','orbiter','sniper','flyer'],
      hazards: [
        { slot: 2, type: 'spike', xOffset: 22, yOffset: -14, moveRange: 26, moveSpd: 1.12 },
        { slot: 4, type: 'drop', xOffset: 42, yOffset: -182, triggerRadius: 180 },
        { slot: 7, type: 'spike', xOffset: 36, yOffset: -14, moveRange: 46, moveSpd: 1.22 },
        { slot: 8, type: 'drop', xOffset: 40, yOffset: -188, triggerRadius: 188 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 28, yOffset: -56 },
        { slot: 9, type: 'giant', xOffset: 40, yOffset: -56 },
      ],
    },
  },
  {
    zoneIdx: 8,
    levelOne: {
      worldW: 3600,
      goalY: 136,
      goalGap: 154,
      encounterName: 'Gale Spine',
      encounterStory: 'Storm Peaks greets you with long jumps, wind-lashed flyers, and trap rails that punish greedy movement.',
      steps: [
        { gap: 126, y: 316, w: 118 },
        { gap: 104, y: 240, w: 102 },
        { gap: 110, y: 182, w: 106 },
        { gap: 100, y: 274, w: 94, moving: { range: 98, spd: 1.08 } },
        { gap: 112, y: 198, w: 96 },
        { gap: 118, y: 150, w: 100 },
        { gap: 112, y: 236, w: 114 },
        { gap: 118, y: 164, w: 98, moving: { range: 80, spd: 1.0 } },
        { gap: 124, y: 226, w: 108 },
      ],
      signatureEnemies: ['flyer','zigzag','orbiter','shadow','sniper','hopper'],
      enemyCycle: ['flyer','zigzag','orbiter','shadow','charger'],
      hazards: [
        { slot: 1, type: 'drop', xOffset: 42, yOffset: -176, triggerRadius: 164 },
        { slot: 4, type: 'spike', xOffset: 28, yOffset: -14, moveRange: 34, moveSpd: 1.02 },
        { slot: 7, type: 'drop', xOffset: 42, yOffset: -186, triggerRadius: 188 },
      ],
      powerUps: [
        { slot: 3, type: 'shield', xOffset: 34, yOffset: -56 },
        { slot: 8, type: 'laser', xOffset: 44, yOffset: -56 },
      ],
    },
    levelTwo: {
      worldW: 3840,
      goalY: 124,
      goalGap: 160,
      encounterName: 'Thunder Ladder',
      encounterStory: 'The second climb stacks more forced-air movement and projectile pressure before the drake hunt begins.',
      steps: [
        { gap: 112, y: 338, w: 104 },
        { gap: 94, y: 264, w: 90 },
        { gap: 96, y: 202, w: 92 },
        { gap: 96, y: 292, w: 86, moving: { range: 126, spd: 1.26 } },
        { gap: 106, y: 214, w: 90 },
        { gap: 108, y: 162, w: 92 },
        { gap: 114, y: 250, w: 102, moving: { range: 92, spd: 1.12 } },
        { gap: 120, y: 176, w: 96 },
        { gap: 116, y: 238, w: 104 },
        { gap: 126, y: 170, w: 98 },
      ],
      signatureEnemies: ['shadow','flyer','sniper','orbiter','zigzag','charger'],
      enemyCycle: ['flyer','shadow','sniper','orbiter','zigzag'],
      hazards: [
        { slot: 2, type: 'spike', xOffset: 22, yOffset: -14, moveRange: 26, moveSpd: 1.12 },
        { slot: 4, type: 'drop', xOffset: 40, yOffset: -182, triggerRadius: 182 },
        { slot: 6, type: 'spike', xOffset: 38, yOffset: -14, moveRange: 46, moveSpd: 1.24 },
        { slot: 9, type: 'drop', xOffset: 44, yOffset: -194, triggerRadius: 194 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 30, yOffset: -56 },
        { slot: 8, type: 'giant', xOffset: 40, yOffset: -56 },
      ],
    },
  },
  {
    zoneIdx: 9,
    levelOne: {
      worldW: 3680,
      goalY: 132,
      goalGap: 156,
      encounterName: 'Null March',
      encounterStory: 'The Void wastes no time: sparse footing, punishing silhouettes, and enemies that make empty space lethal.',
      steps: [
        { gap: 126, y: 320, w: 108 },
        { gap: 104, y: 248, w: 94 },
        { gap: 108, y: 188, w: 96 },
        { gap: 102, y: 284, w: 88, moving: { range: 102, spd: 1.12 } },
        { gap: 114, y: 212, w: 92 },
        { gap: 118, y: 160, w: 94 },
        { gap: 112, y: 246, w: 106 },
        { gap: 118, y: 174, w: 96, moving: { range: 84, spd: 1.04 } },
        { gap: 124, y: 232, w: 106 },
      ],
      signatureEnemies: ['shadow','sniper','orbiter','zigzag','burrower','spiker'],
      enemyCycle: ['shadow','sniper','orbiter','zigzag','charger'],
      hazards: [
        { slot: 0, type: 'spike', xOffset: 22, yOffset: -14, moveRange: 24, moveSpd: 1.04 },
        { slot: 3, type: 'drop', xOffset: 40, yOffset: -178, triggerRadius: 170 },
        { slot: 6, type: 'spike', xOffset: 34, yOffset: -14, moveRange: 44, moveSpd: 1.18 },
      ],
      powerUps: [
        { slot: 2, type: 'shield', xOffset: 30, yOffset: -56 },
        { slot: 8, type: 'laser', xOffset: 40, yOffset: -56 },
      ],
    },
    levelTwo: {
      worldW: 3920,
      goalY: 120,
      goalGap: 164,
      encounterName: 'Last Light Spiral',
      encounterStory: 'The void spiral cuts away your safety nets and forces perfect execution before the halfway throne fight.',
      steps: [
        { gap: 114, y: 340, w: 100 },
        { gap: 94, y: 268, w: 86 },
        { gap: 96, y: 206, w: 88 },
        { gap: 98, y: 296, w: 82, moving: { range: 128, spd: 1.28 } },
        { gap: 106, y: 220, w: 86 },
        { gap: 108, y: 168, w: 90 },
        { gap: 114, y: 254, w: 98, moving: { range: 94, spd: 1.14 } },
        { gap: 120, y: 182, w: 92 },
        { gap: 116, y: 242, w: 100 },
        { gap: 128, y: 176, w: 94 },
      ],
      signatureEnemies: ['shadow','sniper','orbiter','zigzag','charger','flyer'],
      enemyCycle: ['shadow','orbiter','sniper','zigzag','spiker'],
      hazards: [
        { slot: 2, type: 'spike', xOffset: 18, yOffset: -14, moveRange: 24, moveSpd: 1.12 },
        { slot: 4, type: 'drop', xOffset: 36, yOffset: -186, triggerRadius: 182 },
        { slot: 7, type: 'spike', xOffset: 34, yOffset: -14, moveRange: 46, moveSpd: 1.26 },
        { slot: 9, type: 'drop', xOffset: 42, yOffset: -198, triggerRadius: 198 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 28, yOffset: -56 },
        { slot: 8, type: 'giant', xOffset: 38, yOffset: -56 },
      ],
    },
  },
  {
    zoneIdx: 10,
    levelOne: {
      worldW: 3760,
      goalY: 136,
      goalGap: 156,
      encounterName: 'Verdant Return',
      encounterStory: 'Reborn Highlands swings from hopeful color into harder combat density and aggressive restart pacing.',
      steps: [
        { gap: 126, y: 318, w: 116 },
        { gap: 104, y: 242, w: 100 },
        { gap: 110, y: 184, w: 102 },
        { gap: 100, y: 276, w: 92, moving: { range: 104, spd: 1.12 } },
        { gap: 114, y: 202, w: 94 },
        { gap: 118, y: 154, w: 98 },
        { gap: 112, y: 238, w: 110 },
        { gap: 118, y: 166, w: 98, moving: { range: 82, spd: 1.04 } },
        { gap: 124, y: 228, w: 108 },
      ],
      signatureEnemies: ['runner','hopper','flyer','orbiter','shadow','sniper'],
      enemyCycle: ['runner','hopper','shadow','flyer','orbiter'],
      hazards: [
        { slot: 1, type: 'drop', xOffset: 42, yOffset: -174, triggerRadius: 168 },
        { slot: 4, type: 'spike', xOffset: 28, yOffset: -14, moveRange: 34, moveSpd: 1.06 },
        { slot: 7, type: 'drop', xOffset: 40, yOffset: -188, triggerRadius: 190 },
      ],
      powerUps: [
        { slot: 3, type: 'shield', xOffset: 34, yOffset: -56 },
        { slot: 8, type: 'laser', xOffset: 42, yOffset: -56 },
      ],
    },
    levelTwo: {
      worldW: 4000,
      goalY: 124,
      goalGap: 164,
      encounterName: 'Bloomfire Ridge',
      encounterStory: 'The ridge pairs beautiful vistas with a very rude density spike: harder lanes, deadlier recoveries, no freebies.',
      steps: [
        { gap: 114, y: 340, w: 102 },
        { gap: 94, y: 266, w: 88 },
        { gap: 96, y: 204, w: 90 },
        { gap: 98, y: 294, w: 84, moving: { range: 128, spd: 1.28 } },
        { gap: 106, y: 218, w: 88 },
        { gap: 108, y: 166, w: 92 },
        { gap: 114, y: 252, w: 100, moving: { range: 94, spd: 1.14 } },
        { gap: 120, y: 180, w: 94 },
        { gap: 116, y: 240, w: 102 },
        { gap: 128, y: 174, w: 96 },
      ],
      signatureEnemies: ['shadow','hopper','sniper','orbiter','flyer','charger'],
      enemyCycle: ['runner','shadow','hopper','sniper','orbiter'],
      hazards: [
        { slot: 2, type: 'spike', xOffset: 20, yOffset: -14, moveRange: 26, moveSpd: 1.14 },
        { slot: 4, type: 'drop', xOffset: 40, yOffset: -186, triggerRadius: 184 },
        { slot: 7, type: 'spike', xOffset: 36, yOffset: -14, moveRange: 48, moveSpd: 1.26 },
        { slot: 9, type: 'drop', xOffset: 42, yOffset: -198, triggerRadius: 198 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 28, yOffset: -56 },
        { slot: 8, type: 'giant', xOffset: 40, yOffset: -56 },
      ],
    },
  },
  {
    zoneIdx: 11,
    levelOne: {
      worldW: 3840,
      goalY: 132,
      goalGap: 160,
      encounterName: 'Mirror Procession',
      encounterStory: 'Echo Halls layers memory lanes, returning threats, and precision timing over reverberating floors.',
      steps: [
        { gap: 124, y: 320, w: 112 },
        { gap: 104, y: 246, w: 96 },
        { gap: 108, y: 186, w: 98 },
        { gap: 102, y: 282, w: 90, moving: { range: 106, spd: 1.14 } },
        { gap: 114, y: 208, w: 92 },
        { gap: 118, y: 158, w: 94 },
        { gap: 112, y: 244, w: 106 },
        { gap: 118, y: 172, w: 96, moving: { range: 84, spd: 1.06 } },
        { gap: 124, y: 232, w: 108 },
      ],
      signatureEnemies: ['orbiter','shadow','sniper','flyer','zigzag','burrower'],
      enemyCycle: ['orbiter','shadow','sniper','flyer','zigzag'],
      hazards: [
        { slot: 0, type: 'spike', xOffset: 24, yOffset: -14, moveRange: 26, moveSpd: 1.04 },
        { slot: 3, type: 'drop', xOffset: 40, yOffset: -178, triggerRadius: 170 },
        { slot: 6, type: 'spike', xOffset: 34, yOffset: -14, moveRange: 44, moveSpd: 1.2 },
      ],
      powerUps: [
        { slot: 2, type: 'laser', xOffset: 28, yOffset: -56 },
        { slot: 8, type: 'shield', xOffset: 40, yOffset: -56 },
      ],
    },
    levelTwo: {
      worldW: 4080,
      goalY: 120,
      goalGap: 166,
      encounterName: 'Replay Chamber',
      encounterStory: 'The chamber uses repeated shapes to trick your eyes while the enemy density quietly spikes in the background.',
      steps: [
        { gap: 114, y: 340, w: 102 },
        { gap: 94, y: 268, w: 88 },
        { gap: 96, y: 206, w: 90 },
        { gap: 98, y: 296, w: 84, moving: { range: 130, spd: 1.28 } },
        { gap: 106, y: 220, w: 88 },
        { gap: 108, y: 168, w: 92 },
        { gap: 114, y: 254, w: 100, moving: { range: 96, spd: 1.16 } },
        { gap: 120, y: 182, w: 94 },
        { gap: 116, y: 242, w: 102 },
        { gap: 128, y: 176, w: 96 },
      ],
      signatureEnemies: ['shadow','orbiter','sniper','flyer','zigzag','charger'],
      enemyCycle: ['shadow','orbiter','sniper','zigzag','burrower'],
      hazards: [
        { slot: 2, type: 'spike', xOffset: 18, yOffset: -14, moveRange: 24, moveSpd: 1.14 },
        { slot: 4, type: 'drop', xOffset: 40, yOffset: -188, triggerRadius: 184 },
        { slot: 7, type: 'spike', xOffset: 36, yOffset: -14, moveRange: 48, moveSpd: 1.28 },
        { slot: 9, type: 'drop', xOffset: 42, yOffset: -200, triggerRadius: 200 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 28, yOffset: -56 },
        { slot: 8, type: 'giant', xOffset: 40, yOffset: -56 },
      ],
    },
  },
  {
    zoneIdx: 12,
    levelOne: {
      worldW: 3920,
      goalY: 130,
      goalGap: 160,
      encounterName: 'Redline Horizon',
      encounterStory: 'Final Frontier opens like a championship lap: faster chases, burning edges, and brutal mid-air pressure.',
      steps: [
        { gap: 126, y: 320, w: 114 },
        { gap: 104, y: 244, w: 98 },
        { gap: 108, y: 184, w: 100 },
        { gap: 102, y: 280, w: 92, moving: { range: 108, spd: 1.16 } },
        { gap: 114, y: 204, w: 94 },
        { gap: 118, y: 156, w: 96 },
        { gap: 112, y: 240, w: 108 },
        { gap: 120, y: 170, w: 96, moving: { range: 86, spd: 1.08 } },
        { gap: 126, y: 230, w: 108 },
      ],
      signatureEnemies: ['charger','flyer','shadow','sniper','zigzag','spiker'],
      enemyCycle: ['charger','shadow','flyer','sniper','zigzag'],
      hazards: [
        { slot: 1, type: 'drop', xOffset: 40, yOffset: -178, triggerRadius: 172 },
        { slot: 4, type: 'spike', xOffset: 26, yOffset: -14, moveRange: 34, moveSpd: 1.08 },
        { slot: 7, type: 'drop', xOffset: 40, yOffset: -190, triggerRadius: 190 },
      ],
      powerUps: [
        { slot: 3, type: 'laser', xOffset: 32, yOffset: -56 },
        { slot: 8, type: 'shield', xOffset: 40, yOffset: -56 },
      ],
    },
    levelTwo: {
      worldW: 4160,
      goalY: 118,
      goalGap: 168,
      encounterName: 'Edgeburn Sprint',
      encounterStory: 'Then the sprint turns nasty with no warm-up: more drop traps, more shots, less room to recover.',
      steps: [
        { gap: 114, y: 340, w: 102 },
        { gap: 94, y: 266, w: 88 },
        { gap: 96, y: 204, w: 90 },
        { gap: 98, y: 296, w: 84, moving: { range: 132, spd: 1.3 } },
        { gap: 108, y: 220, w: 88 },
        { gap: 110, y: 168, w: 92 },
        { gap: 114, y: 256, w: 100, moving: { range: 98, spd: 1.18 } },
        { gap: 122, y: 182, w: 94 },
        { gap: 118, y: 244, w: 102 },
        { gap: 130, y: 178, w: 96 },
      ],
      signatureEnemies: ['shadow','charger','sniper','flyer','zigzag','orbiter'],
      enemyCycle: ['charger','shadow','sniper','flyer','zigzag'],
      hazards: [
        { slot: 2, type: 'spike', xOffset: 18, yOffset: -14, moveRange: 24, moveSpd: 1.14 },
        { slot: 4, type: 'drop', xOffset: 40, yOffset: -190, triggerRadius: 186 },
        { slot: 7, type: 'spike', xOffset: 36, yOffset: -14, moveRange: 48, moveSpd: 1.3 },
        { slot: 9, type: 'drop', xOffset: 44, yOffset: -202, triggerRadius: 202 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 28, yOffset: -56 },
        { slot: 8, type: 'giant', xOffset: 40, yOffset: -56 },
      ],
    },
  },
  {
    zoneIdx: 13,
    levelOne: {
      worldW: 4000,
      goalY: 128,
      goalGap: 164,
      encounterName: 'Thronewake Path',
      encounterStory: 'Ascendant Realm opens in full spectacle with elite pacing and dense encounter layering right out of the gate.',
      steps: [
        { gap: 126, y: 320, w: 114 },
        { gap: 106, y: 244, w: 98 },
        { gap: 110, y: 184, w: 100 },
        { gap: 102, y: 278, w: 92, moving: { range: 110, spd: 1.16 } },
        { gap: 116, y: 202, w: 94 },
        { gap: 120, y: 154, w: 96 },
        { gap: 114, y: 238, w: 108 },
        { gap: 120, y: 168, w: 98, moving: { range: 88, spd: 1.08 } },
        { gap: 126, y: 228, w: 108 },
      ],
      signatureEnemies: ['shadow','orbiter','charger','sniper','flyer','zigzag'],
      enemyCycle: ['shadow','charger','orbiter','sniper','flyer'],
      hazards: [
        { slot: 1, type: 'drop', xOffset: 42, yOffset: -180, triggerRadius: 174 },
        { slot: 4, type: 'spike', xOffset: 26, yOffset: -14, moveRange: 34, moveSpd: 1.08 },
        { slot: 7, type: 'drop', xOffset: 40, yOffset: -192, triggerRadius: 194 },
      ],
      powerUps: [
        { slot: 3, type: 'laser', xOffset: 32, yOffset: -56 },
        { slot: 8, type: 'shield', xOffset: 42, yOffset: -56 },
      ],
    },
    levelTwo: {
      worldW: 4240,
      goalY: 116,
      goalGap: 170,
      encounterName: 'Crownbreaker Terrace',
      encounterStory: 'The terrace doubles down with boss-adjacent encounter density and almost no safe tempo resets.',
      steps: [
        { gap: 114, y: 340, w: 102 },
        { gap: 94, y: 268, w: 88 },
        { gap: 98, y: 206, w: 90 },
        { gap: 100, y: 296, w: 84, moving: { range: 134, spd: 1.32 } },
        { gap: 108, y: 220, w: 88 },
        { gap: 110, y: 168, w: 92 },
        { gap: 116, y: 256, w: 100, moving: { range: 100, spd: 1.18 } },
        { gap: 122, y: 182, w: 94 },
        { gap: 120, y: 244, w: 102 },
        { gap: 132, y: 178, w: 96 },
      ],
      signatureEnemies: ['shadow','charger','orbiter','sniper','flyer','zigzag'],
      enemyCycle: ['shadow','charger','orbiter','sniper','flyer'],
      hazards: [
        { slot: 2, type: 'spike', xOffset: 18, yOffset: -14, moveRange: 24, moveSpd: 1.16 },
        { slot: 4, type: 'drop', xOffset: 40, yOffset: -192, triggerRadius: 188 },
        { slot: 7, type: 'spike', xOffset: 36, yOffset: -14, moveRange: 48, moveSpd: 1.32 },
        { slot: 9, type: 'drop', xOffset: 44, yOffset: -204, triggerRadius: 204 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 28, yOffset: -56 },
        { slot: 8, type: 'giant', xOffset: 40, yOffset: -56 },
      ],
    },
  },
  {
    zoneIdx: 14,
    levelOne: {
      worldW: 4080,
      goalY: 126,
      goalGap: 166,
      encounterName: 'Heartforge Approach',
      encounterStory: 'The Dream Heart starts loud: radiant hazards, elite enemy mixes, and royal pressure from the first stride.',
      steps: [
        { gap: 128, y: 320, w: 114 },
        { gap: 108, y: 244, w: 98 },
        { gap: 110, y: 184, w: 100 },
        { gap: 104, y: 278, w: 92, moving: { range: 112, spd: 1.18 } },
        { gap: 118, y: 202, w: 94 },
        { gap: 120, y: 152, w: 96 },
        { gap: 116, y: 238, w: 108 },
        { gap: 122, y: 168, w: 98, moving: { range: 90, spd: 1.1 } },
        { gap: 128, y: 228, w: 110 },
      ],
      signatureEnemies: ['shadow','orbiter','sniper','charger','flyer','zigzag'],
      enemyCycle: ['shadow','orbiter','sniper','charger','flyer'],
      hazards: [
        { slot: 1, type: 'drop', xOffset: 42, yOffset: -182, triggerRadius: 176 },
        { slot: 4, type: 'spike', xOffset: 24, yOffset: -14, moveRange: 34, moveSpd: 1.1 },
        { slot: 7, type: 'drop', xOffset: 40, yOffset: -194, triggerRadius: 196 },
      ],
      powerUps: [
        { slot: 3, type: 'laser', xOffset: 32, yOffset: -56 },
        { slot: 8, type: 'shield', xOffset: 42, yOffset: -56 },
      ],
    },
    levelTwo: {
      worldW: 4320,
      goalY: 114,
      goalGap: 172,
      encounterName: 'Royal Starfall',
      encounterStory: 'Before the final king, the starfall route demands mastery: speed, spacing, and clean execution under heavy pressure.',
      steps: [
        { gap: 116, y: 340, w: 102 },
        { gap: 94, y: 268, w: 88 },
        { gap: 98, y: 206, w: 90 },
        { gap: 100, y: 296, w: 84, moving: { range: 136, spd: 1.34 } },
        { gap: 110, y: 220, w: 88 },
        { gap: 112, y: 168, w: 92 },
        { gap: 118, y: 256, w: 100, moving: { range: 102, spd: 1.2 } },
        { gap: 124, y: 182, w: 94 },
        { gap: 120, y: 244, w: 102 },
        { gap: 132, y: 178, w: 96 },
      ],
      signatureEnemies: ['shadow','orbiter','sniper','charger','flyer','zigzag'],
      enemyCycle: ['shadow','orbiter','sniper','charger','flyer'],
      hazards: [
        { slot: 2, type: 'spike', xOffset: 18, yOffset: -14, moveRange: 24, moveSpd: 1.18 },
        { slot: 4, type: 'drop', xOffset: 40, yOffset: -194, triggerRadius: 190 },
        { slot: 7, type: 'spike', xOffset: 36, yOffset: -14, moveRange: 48, moveSpd: 1.34 },
        { slot: 9, type: 'drop', xOffset: 44, yOffset: -206, triggerRadius: 206 },
      ],
      powerUps: [
        { slot: 5, type: 'high-jump', xOffset: 28, yOffset: -56 },
        { slot: 8, type: 'giant', xOffset: 40, yOffset: -56 },
      ],
    },
  },
];

function buildPlatforms(template: StarterTemplate): { platforms: PlatDef[]; routePlatforms: PlatDef[]; goal: PlatDef } {
  const routePlatforms: PlatDef[] = [];
  let cursor = 0;
  for (const step of template.steps) {
    cursor += step.gap;
    routePlatforms.push({
      x: cursor,
      y: step.y,
      w: step.w,
      h: 20,
      type: step.moving ? 'moving' : 'solid',
      moveRange: step.moving?.range,
      moveSpd: step.moving?.spd,
    });
    cursor += step.w;
  }

  const goal: PlatDef = {
    x: Math.min(template.worldW - 150, cursor + template.goalGap),
    y: template.goalY,
    w: 120,
    h: 20,
    type: 'goal',
  };

  return {
    platforms: [{ x: 0, y: 400, w: template.worldW, h: 80, type: 'solid' }, ...routePlatforms, goal],
    routePlatforms,
    goal,
  };
}

function buildCoins(routePlatforms: PlatDef[], goal: PlatDef): CoinDef[] {
  const regularPlatforms = routePlatforms.slice(0, 9);
  const coins = regularPlatforms.map((platform, index) => ({
    x: platform.x + Math.round(platform.w * (0.32 + (index % 3) * 0.18)),
    y: platform.y - 30 - (index % 2) * 8,
  }));
  return [...coins, { x: goal.x + 38, y: goal.y - 34, isGoal: true }];
}

function resolveEnemyAnchor(kind: MadmaxiEnemyKind, platform: PlatDef, x: number): Pick<EnemyDef, 'y' | 'anchorX' | 'anchorY'> {
  switch (kind) {
    case 'flyer': {
      const hoverY = Math.max(150, platform.y - 54);
      return { y: hoverY, anchorY: hoverY };
    }
    case 'zigzag': {
      const hoverY = Math.max(176, platform.y - 18);
      return { y: hoverY, anchorY: hoverY };
    }
    case 'orbiter': {
      const orbitY = Math.max(164, platform.y - 38);
      return { y: orbitY, anchorX: x, anchorY: orbitY };
    }
    case 'sniper': {
      const perchY = Math.max(132, platform.y - 18);
      return { y: perchY, anchorY: perchY };
    }
    case 'shadow': {
      const stalkY = Math.max(304, platform.y + 118);
      return { y: stalkY, anchorY: stalkY };
    }
    case 'hopper': {
      const hopY = Math.min(368, platform.y + 90);
      return { y: hopY, anchorY: hopY };
    }
    case 'burrower':
      return { y: 374, anchorY: 374 };
    case 'spiker':
      return { y: 360, anchorY: 360 };
    case 'charger':
    case 'runner':
    default:
      return { y: 368, anchorY: 368 };
  }
}

function buildEnemies(level: number, zoneIdx: number, template: StarterTemplate, routePlatforms: PlatDef[]): EnemyDef[] {
  const requiredCount = getMadmaxiEnemyCount(level);
  const enemyKinds: MadmaxiEnemyKind[] = [...template.signatureEnemies];
  while (enemyKinds.length < requiredCount) {
    enemyKinds.push(template.enemyCycle[(enemyKinds.length - template.signatureEnemies.length) % template.enemyCycle.length]);
  }

  return enemyKinds.slice(0, requiredCount).map((kind, index) => {
    const platform = routePlatforms[(index * 2 + zoneIdx) % routePlatforms.length];
    const x = Math.max(150, Math.min(template.worldW - 150, platform.x + Math.round(platform.w * (0.25 + ((index + zoneIdx) % 3) * 0.22))));
    const speedBase = 1.4 + zoneIdx * 0.1 + Math.floor((level - 1) / 10) * 0.05;
    const vx = (index % 2 === 0 ? 1 : -1) * Number((speedBase + (index % 4) * 0.18).toFixed(2));
    return {
      x,
      vx,
      kind,
      ...resolveEnemyAnchor(kind, platform, x),
    };
  });
}

function buildHazards(template: StarterTemplate, routePlatforms: PlatDef[]): HazardDef[] {
  return template.hazards.map((hazard) => {
    const platform = routePlatforms[Math.min(routePlatforms.length - 1, hazard.slot)];
    return {
      x: platform.x + Math.round(platform.w * 0.25) + (hazard.xOffset ?? 0),
      y: platform.y + (hazard.yOffset ?? -14),
      type: hazard.type,
      moveRange: hazard.moveRange,
      moveSpd: hazard.moveSpd,
      triggerRadius: hazard.triggerRadius,
    };
  });
}

function buildPowerUps(template: StarterTemplate, routePlatforms: PlatDef[]): PowerUpDef[] {
  return template.powerUps.map((powerUp) => {
    const platform = routePlatforms[Math.min(routePlatforms.length - 1, powerUp.slot)];
    return {
      x: platform.x + Math.round(platform.w * 0.5) + (powerUp.xOffset ?? 0),
      y: platform.y + (powerUp.yOffset ?? -56),
      type: powerUp.type,
    };
  });
}

function buildStarterLevel(level: number, zoneIdx: number, template: StarterTemplate, includeZoneStory: boolean): LevelDef {
  const zone = ZONES[zoneIdx];
  const { platforms, routePlatforms, goal } = buildPlatforms(template);
  const storyParts = [
    includeZoneStory ? zone.story : undefined,
    `⚡ ${template.encounterName}`,
    template.encounterStory,
    `🎵 ${zone.audioTheme} · ✨ ${zone.vfxTheme}`,
  ].filter(Boolean);

  return {
    worldW: template.worldW,
    platforms,
    coins: buildCoins(routePlatforms, goal),
    enemies: buildEnemies(level, zoneIdx, template, routePlatforms),
    hazards: buildHazards(template, routePlatforms),
    powerUps: buildPowerUps(template, routePlatforms),
    zoneName: zone.name,
    zoneStory: storyParts.join('\n\n'),
    encounterName: template.encounterName,
    audioTheme: zone.audioTheme,
    vfxTheme: zone.vfxTheme,
    isAuthored: true,
  };
}

export function getAuthoredStarterLevel(level: number): LevelDef | null {
  const zoneSlot = ((level - 1) % 10) + 1;
  if (zoneSlot !== 1 && zoneSlot !== 2) return null;
  const zoneIdx = Math.floor((level - 1) / 10);
  const pack = PACKS[zoneIdx];
  if (!pack) return null;
  return buildStarterLevel(level, zoneIdx, zoneSlot === 1 ? pack.levelOne : pack.levelTwo, zoneSlot === 1);
}

export function isMadmaxiAuthoredLevel(level: number): boolean {
  return getAuthoredStarterLevel(level) !== null;
}

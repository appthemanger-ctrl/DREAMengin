import type { BossMeta, MadmaxiEnemyKind, MadmaxiPowerUpKind, ZoneMeta } from './types';

export const TOTAL_LEVELS = 150;
export const LEVEL_SEED_KEY = 31337;
export const STAR_SEED_PRIME = 7919;
export const STAR_SEED_OFFSET = 13;
export const EXTRA_POWERUP_EVERY_N_LEVELS = 3;
export const BOSS_ENRAGE_THRESHOLD = 0.5;
export const BOSS_ENRAGE_MULTIPLIER = 1.5;

export const MADMAXI_ENEMY_KINDS = [
  'runner',
  'charger',
  'hopper',
  'flyer',
  'zigzag',
  'orbiter',
  'sniper',
  'burrower',
  'spiker',
  'shadow',
] as const satisfies readonly MadmaxiEnemyKind[];

export const MADMAXI_POWERUP_KINDS = [
  'shield',
  'high-jump',
  'laser',
  'giant',
] as const satisfies readonly MadmaxiPowerUpKind[];

export const MADMAXI_SUPER_STREAK = 9;
export const MADMAXI_SUPER_SECONDS = 30;

export function seededRng(seed: number) {
  let s = (seed | 0) >>> 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

export function getZoneIdx(level: number): number {
  return Math.min(14, Math.floor((level - 1) / 10));
}

export function isBossLevel(level: number): boolean {
  return level % 10 === 0 && level >= 10 && level <= TOTAL_LEVELS;
}

export function getMadmaxiEnemyCount(level: number): number {
  if (isBossLevel(level)) return 1;
  const bandSlot = ((Math.max(1, level) - 1) % 10) + 1;
  return Math.min(10, bandSlot + 1);
}

export function getEnemyKindForIndex(index: number, level: number): MadmaxiEnemyKind {
  const rotation = Math.floor((Math.max(1, level) - 1) / 10) % MADMAXI_ENEMY_KINDS.length;
  return MADMAXI_ENEMY_KINDS[(index + rotation) % MADMAXI_ENEMY_KINDS.length];
}

export function getPowerUpForIndex(index: number, rng: () => number): MadmaxiPowerUpKind {
  return MADMAXI_POWERUP_KINDS[(index + Math.floor(rng() * MADMAXI_POWERUP_KINDS.length)) % MADMAXI_POWERUP_KINDS.length];
}

export const ZONES: ZoneMeta[] = [
  { name:'Lucid Meadows', story:'The dream begins at the edge of waking.\nRun far — something stirs in the meadow.',
    sky:[0.04,0.07,0.18], gnd:[0.12,0.20,0.14], plt:[0.22,0.40,0.28], em:[0.02,0.05,0.02],
    accent:[0.78,0.90,0.48], hazard:[0.58,0.16,0.12], laser:[0.22,0.90,0.95], audioTheme:'meadow pulse choir', vfxTheme:'sunwake bloom' },
  { name:'Crystal Caverns', story:'The meadow cracks open.\nGlimmering tunnels pulse with forgotten dreams.',
    sky:[0.02,0.03,0.14], gnd:[0.10,0.12,0.35], plt:[0.18,0.22,0.62], em:[0.02,0.03,0.12],
    accent:[0.56,0.86,1.00], hazard:[0.80,0.42,0.20], laser:[0.38,0.90,1.00], audioTheme:'crystal echo engine', vfxTheme:'prism flare lattice' },
  { name:'Neon Corridor', story:'A dead city awakens in neon.\nEchoes of a dreamer who never woke.',
    sky:[0.04,0.00,0.10], gnd:[0.12,0.00,0.18], plt:[0.36,0.02,0.50], em:[0.06,0.00,0.10],
    accent:[0.98,0.24,0.86], hazard:[0.96,0.24,0.18], laser:[0.10,0.98,0.92], audioTheme:'neon overdrive sync', vfxTheme:'plasma billboard rain' },
  { name:'Cloud Kingdom', story:'Higher. The storms below look like oceans.\nA kingdom built on forgotten promises.',
    sky:[0.12,0.16,0.30], gnd:[0.28,0.32,0.44], plt:[0.50,0.56,0.72], em:[0.06,0.07,0.12],
    accent:[0.96,0.98,1.00], hazard:[0.88,0.48,0.18], laser:[0.46,0.88,1.00], audioTheme:'sky brass ascent', vfxTheme:'aurora cloudburst' },
  { name:'Shadow Vale', story:'The light runs out here.\nSomething ancient waits in the dark.',
    sky:[0.01,0.01,0.04], gnd:[0.06,0.02,0.06], plt:[0.12,0.04,0.14], em:[0.02,0.01,0.02],
    accent:[0.58,0.32,0.86], hazard:[0.72,0.08,0.14], laser:[0.64,0.52,1.00], audioTheme:'shadow bass ritual', vfxTheme:'umbra veil shimmer' },
  { name:'Ocean Abyss', story:'Deeper than sleep. The dreamer drowns\nin memories that belong to someone else.',
    sky:[0.01,0.04,0.12], gnd:[0.02,0.10,0.22], plt:[0.04,0.24,0.46], em:[0.01,0.04,0.08],
    accent:[0.28,0.88,0.98], hazard:[0.88,0.44,0.24], laser:[0.16,0.86,1.00], audioTheme:'abyss tide synth', vfxTheme:'foam current halo' },
  { name:'Time Rift', story:'The past and future bleed together.\nRun — or be erased.',
    sky:[0.07,0.04,0.14], gnd:[0.14,0.10,0.22], plt:[0.28,0.18,0.48], em:[0.04,0.02,0.08],
    accent:[0.98,0.86,0.34], hazard:[0.88,0.24,0.18], laser:[0.80,0.86,0.98], audioTheme:'chrono pulse engine', vfxTheme:'time tear strobe' },
  { name:'Mind Maze', story:'Every corridor is a fear.\nOnly the dreamer can choose which door opens.',
    sky:[0.08,0.03,0.10], gnd:[0.18,0.05,0.16], plt:[0.36,0.08,0.38], em:[0.05,0.01,0.06],
    accent:[0.96,0.36,0.98], hazard:[0.92,0.18,0.26], laser:[0.68,0.36,1.00], audioTheme:'psy maze choir', vfxTheme:'synapse fracture bloom' },
  { name:'Storm Peaks', story:'At the roof of dreams the wind strips\neverything away but the will to continue.',
    sky:[0.04,0.06,0.16], gnd:[0.14,0.18,0.26], plt:[0.26,0.32,0.52], em:[0.03,0.04,0.08],
    accent:[0.72,0.88,1.00], hazard:[0.94,0.56,0.20], laser:[0.52,0.92,1.00], audioTheme:'stormbreaker march', vfxTheme:'lightning rim surge' },
  { name:'The Void', story:'Nothing. And yet — you are still here.\nThe last dream before the final truth.',
    sky:[0.01,0.01,0.02], gnd:[0.05,0.02,0.06], plt:[0.09,0.03,0.11], em:[0.02,0.01,0.03],
    accent:[0.84,0.82,0.98], hazard:[0.74,0.18,0.42], laser:[0.84,0.78,1.00], audioTheme:'void signal choir', vfxTheme:'null horizon pulse' },
  { name:'Reborn Highlands', story:'Surviving the void changes everything.\nThe highlands bloom where nothing should grow.',
    sky:[0.06,0.10,0.18], gnd:[0.18,0.26,0.20], plt:[0.32,0.48,0.36], em:[0.03,0.06,0.04],
    accent:[0.92,0.96,0.46], hazard:[0.80,0.32,0.20], laser:[0.38,0.98,0.76], audioTheme:'reborn ridge anthem', vfxTheme:'verdant comet sweep' },
  { name:'Echo Halls', story:'Every footstep echoes with a life unlived.\nThe halls replay every choice ever made.',
    sky:[0.04,0.04,0.14], gnd:[0.10,0.10,0.26], plt:[0.20,0.20,0.52], em:[0.02,0.02,0.08],
    accent:[0.38,0.88,0.98], hazard:[0.92,0.34,0.18], laser:[0.32,0.94,1.00], audioTheme:'echo vault resonance', vfxTheme:'afterimage glass pulse' },
  { name:'Final Frontier', story:'Beyond the last horizon the dreamer\nfinally sees what they have been running toward.',
    sky:[0.08,0.04,0.12], gnd:[0.18,0.08,0.20], plt:[0.36,0.14,0.42], em:[0.05,0.02,0.07],
    accent:[0.96,0.68,0.42], hazard:[0.92,0.28,0.14], laser:[0.98,0.72,0.28], audioTheme:'frontier engine roar', vfxTheme:'meteor trail bloom' },
  { name:'Ascendant Realm', story:'The dreamer becomes the dream.\nEach step here reshapes the world behind you.',
    sky:[0.10,0.08,0.18], gnd:[0.20,0.16,0.30], plt:[0.38,0.32,0.58], em:[0.06,0.05,0.10],
    accent:[0.98,0.90,0.54], hazard:[0.90,0.34,0.22], laser:[0.90,0.90,0.42], audioTheme:'ascendant crown hymn', vfxTheme:'gold shard corona' },
  { name:'The Dream Heart', story:'The heart of all dreams.\nOnly one who has survived everything arrives here.',
    sky:[0.08,0.04,0.20], gnd:[0.12,0.08,0.28], plt:[0.22,0.14,0.52], em:[0.04,0.02,0.10],
    accent:[1.00,0.82,0.34], hazard:[0.98,0.28,0.24], laser:[1.00,0.82,0.24], audioTheme:'dreamheart royal pulse', vfxTheme:'starcore overglow' },
];

export const BOSSES: BossMeta[] = [
  { name:'The Meadow Troll', title:'Guardian of the Gate', intro:'A lumbering troll blocks the only exit.\nStomp it 3 times to pass.', hp:3, spd:1.8, size:1.8, col:[0.20,0.50,0.20], em:[0.04,0.12,0.04] },
  { name:'Crystal Golem', title:'Sentinel of the Deep', intro:'An ancient golem of crystallised dreams.\nFour hits to shatter.', hp:4, spd:1.4, size:2.0, col:[0.30,0.40,0.80], em:[0.06,0.09,0.22] },
  { name:'Neon Phantom', title:'Ghost of the Corridor', intro:'It flickers between states of existence.\nHit it 4 times — fast.', hp:4, spd:3.2, size:1.6, col:[0.70,0.00,0.80], em:[0.20,0.00,0.26] },
  { name:'Cloud Titan', title:'King of the Skylands', intro:'Massive and slow, but one hit sends you flying.\nLand on it 5 times.', hp:5, spd:0.9, size:2.4, col:[0.70,0.75,0.90], em:[0.14,0.16,0.22] },
  { name:'Shadow Beast', title:'Devourer of Light', intro:'Born from absolute darkness.\nFast. Relentless. Five hits.', hp:5, spd:3.6, size:1.9, col:[0.10,0.02,0.14], em:[0.06,0.01,0.08] },
  { name:'Deep Leviathan', title:'Ruler of the Abyss', intro:'The ocean dreamed this nightmare into being.\nSix stomps to silence it.', hp:6, spd:2.0, size:2.3, col:[0.04,0.18,0.40], em:[0.01,0.05,0.12] },
  { name:'Time Wraith', title:'The Uncorrectable Error', intro:'A mistake echoing across every timeline.\nSix hits to erase it.', hp:6, spd:3.8, size:1.7, col:[0.60,0.60,0.70], em:[0.12,0.12,0.16] },
  { name:'Mind Demon', title:'The Fear You Never Faced', intro:'A manifestation of every avoided thought.\nSeven hits to confront it.', hp:7, spd:2.8, size:2.1, col:[0.55,0.05,0.55], em:[0.14,0.01,0.14] },
  { name:'Storm Drake', title:'Fury of the Peak', intro:'Born from lightning at the top of the dream world.\nEight hits to ground it.', hp:8, spd:2.5, size:2.2, col:[0.30,0.35,0.60], em:[0.07,0.08,0.16] },
  { name:'The Void Lord', title:'Master of Nothingness', intro:'It has watched you from the beginning.\nTHE HALFWAY BOSS. Ten hits.', hp:10, spd:2.2, size:2.8, col:[0.05,0.00,0.10], em:[0.10,0.00,0.16] },
  { name:'Risen Goliath', title:'What Survived the Void', intro:'Something came back from nothing — changed.\nEight hits.', hp:8, spd:2.6, size:2.3, col:[0.55,0.42,0.15], em:[0.14,0.10,0.02] },
  { name:'Echo Specter', title:'A Life Unlived', intro:'Every echo has become a monster.\nNine hits to silence every regret.', hp:9, spd:3.4, size:1.8, col:[0.10,0.60,0.70], em:[0.02,0.14,0.18] },
  { name:'Frontier Colossus', title:'The Wall at the Edge', intro:'A titan at the border of the last unknown.\nTen hits.', hp:10, spd:2.8, size:2.5, col:[0.55,0.08,0.14], em:[0.14,0.01,0.02] },
  { name:'Ascendant Titan', title:"The Dreamer's Shadow", intro:"A reflection of everything you could have been.\nEleven hits.", hp:11, spd:3.0, size:2.6, col:[0.70,0.65,0.20], em:[0.18,0.16,0.02] },
  { name:'The Dream King', title:'Ruler of All Dreams', intro:'From the heart of every dream ever dreamed.\nFINAL BOSS. Fifteen hits.', hp:15, spd:2.4, size:3.2, col:[0.80,0.60,0.08], em:[0.28,0.18,0.00] },
];

export function getBossForLevel(level: number): BossMeta {
  return BOSSES[Math.min(BOSSES.length - 1, Math.floor(level / 10) - 1)];
}

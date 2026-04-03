import {
  EXTRA_POWERUP_EVERY_N_LEVELS,
  LEVEL_SEED_KEY,
  ZONES,
  getBossForLevel,
  getEnemyKindForIndex,
  getMadmaxiEnemyCount,
  getPowerUpForIndex,
  getZoneIdx,
  isBossLevel,
  seededRng,
} from './config';
import { getAuthoredStarterLevel, isMadmaxiAuthoredLevel } from './authoredZonePacks';
import type { EnemyDef, HazardDef, LevelDef, PlatDef, PowerUpDef } from './types';

export function getMadmaxiLevelDefinition(level: number, sessionSeed: number): LevelDef {
  const authored = getAuthoredStarterLevel(level);
  if (authored) return authored;
  if (isBossLevel(level)) return makeBossLevel(level);
  return makeProceduralLevel(level, sessionSeed);
}

export { isMadmaxiAuthoredLevel };

function makeProceduralLevel(level: number, sessionSeed: number): LevelDef {
  const rng = seededRng(((sessionSeed ^ (level * LEVEL_SEED_KEY + 7)) | 1) >>> 0);
  const zoneIdx = getZoneIdx(level);
  const zone = ZONES[zoneIdx];
  const t = Math.min(1, (level - 3) / 146);

  const worldW = Math.round(3000 + t * 2800);
  const minPlatW = Math.max(42, Math.round(125 - t * 83));
  const maxPlatW = Math.max(minPlatW + 15, Math.round(160 - t * 80));
  const minGap = Math.round(52 + t * 18);
  const maxGap = Math.round(82 + t * 8);
  const movRatio = 0.28 + t * 0.52;
  const movSpd = 1.0 + t * 1.8;
  const platCount = Math.round(12 + t * 17);
  const enemyCnt = getMadmaxiEnemyCount(level);
  const enemySpd = 1.6 + t * 2.2;

  const platforms: PlatDef[] = [{ x: 0, y: 400, w: worldW, h: 80, type: 'solid' }];
  const coins: LevelDef['coins'] = [];
  const enemies: EnemyDef[] = [];
  const hazards: HazardDef[] = [];
  const powerUps: PowerUpDef[] = [];

  let cx = 150;
  let cy = 340;
  let cw = Math.round(minPlatW + rng() * (maxPlatW - minPlatW));

  for (let i = 0; i < platCount; i++) {
    const gap = Math.round(minGap + rng() * (maxGap - minGap));
    cx += cw + gap;
    if (cx > worldW - 300) break;

    const rawDy = (rng() - 0.5) * 400;
    const clampedDy = rawDy < 0 ? Math.max(rawDy, -100) : Math.min(rawDy, 200);
    cy = Math.max(90, Math.min(370, Math.round(cy + clampedDy)));
    cw = Math.round(minPlatW + rng() * (maxPlatW - minPlatW));

    const isMoving = rng() < movRatio;
    const platform: PlatDef = { x: cx, y: cy, w: cw, h: 20, type: isMoving ? 'moving' : 'solid' };
    if (isMoving) {
      platform.moveRange = Math.round(40 + rng() * 60);
      platform.moveSpd = parseFloat((movSpd * (0.7 + rng() * 0.6)).toFixed(2));
    }
    platforms.push(platform);
  }

  const coinPlatforms = platforms.slice(1);
  const step = Math.max(1, Math.floor(coinPlatforms.length / 9));
  for (let ci = 0; ci < 9 && ci * step < coinPlatforms.length; ci++) {
    const cp = coinPlatforms[Math.min(Math.max(0, coinPlatforms.length - 2), ci * step)];
    coins.push({ x: cp.x + Math.round(cp.w * 0.4), y: cp.y - 32 });
  }
  while (coins.length < 9 && coinPlatforms.length > 0) {
    const cp = coinPlatforms[coins.length % coinPlatforms.length];
    coins.push({ x: cp.x + Math.round(cp.w * 0.5), y: cp.y - 28 });
  }

  const goalGap = Math.round(60 + rng() * 35);
  const goalRise = Math.round(20 + rng() * 100);
  const goalX = Math.min(worldW - 170, cx + cw + goalGap);
  const goalY = Math.max(90, cy - goalRise);
  platforms.push({ x: goalX, y: goalY, w: 110, h: 20, type: 'goal' });
  coins.push({ x: goalX + 35, y: goalY - 40, isGoal: true });

  const spawnStart = 260;
  const spawnEnd = Math.max(spawnStart + 120, worldW - 320);
  const spacing = enemyCnt <= 1 ? 0 : (spawnEnd - spawnStart) / Math.max(1, enemyCnt - 1);
  const jitter = Math.max(0, Math.min(36, Math.round(spacing * 0.12)));
  for (let i = 0; i < enemyCnt; i++) {
    const baseX = enemyCnt <= 1 ? Math.round((spawnStart + spawnEnd) / 2) : spawnStart + spacing * i;
    const ex = Math.max(spawnStart, Math.min(spawnEnd, Math.round(baseX + (rng() - 0.5) * jitter)));
    const spd = parseFloat((enemySpd * (0.6 + rng() * 0.8)).toFixed(2));
    const kind = getEnemyKindForIndex(i, level);
    const anchorY = kind === 'flyer'
      ? Math.max(150, 260 - (i % 3) * 28)
      : kind === 'zigzag'
        ? 280
        : kind === 'orbiter'
          ? Math.max(175, 240 - (i % 2) * 36)
          : kind === 'shadow'
            ? 320
            : 368;
    enemies.push({
      x: ex,
      y: kind === 'flyer' || kind === 'zigzag' || kind === 'orbiter' || kind === 'shadow' ? anchorY : 368,
      vx: rng() < 0.5 ? spd : -spd,
      kind,
      anchorX: ex,
      anchorY,
    });
  }

  const hazardCount = Math.min(8, 2 + Math.floor(t * 6));
  const hazardPlatforms = platforms.slice(1, Math.max(2, platforms.length - 1));
  for (let hi = 0; hi < hazardCount && hazardPlatforms.length > 0; hi++) {
    const hp = hazardPlatforms[(hi * 2 + Math.floor(rng() * 3)) % hazardPlatforms.length];
    if (hi % 2 === 0) {
      hazards.push({
        x: hp.x + Math.round(hp.w * 0.2),
        y: hp.y - 14,
        type: 'spike',
        moveRange: Math.max(18, Math.round(hp.w * 0.35)),
        moveSpd: parseFloat((0.9 + t * 1.8 + rng() * 0.5).toFixed(2)),
      });
    } else {
      hazards.push({
        x: hp.x + Math.round(hp.w * 0.5),
        y: Math.max(40, hp.y - 140 - Math.round(rng() * 80)),
        type: 'drop',
        triggerRadius: 140 + Math.round(rng() * 120),
      });
    }
  }

  const powerUpCount = level % EXTRA_POWERUP_EVERY_N_LEVELS === 0 ? 2 : 1;
  for (let pi = 0; pi < powerUpCount && coinPlatforms.length > 0; pi++) {
    const pp = coinPlatforms[(pi * 3 + Math.floor(rng() * 3)) % coinPlatforms.length];
    powerUps.push({
      x: pp.x + Math.round(pp.w * 0.55),
      y: pp.y - 62,
      type: getPowerUpForIndex(pi, rng),
    });
  }

  const zoneStart = Math.floor((level - 1) / 10) * 10 + 1;
  const showZoneStory = !isMadmaxiAuthoredLevel(zoneStart) && (level % 10 === 1 || level === 3);

  return {
    platforms,
    coins,
    enemies,
    hazards,
    powerUps,
    worldW,
    zoneName: zone.name,
    zoneStory: showZoneStory ? `${zone.story}\n\n🎵 ${zone.audioTheme} · ✨ ${zone.vfxTheme}` : undefined,
    encounterName: `${zone.name} Rush`,
    audioTheme: zone.audioTheme,
    vfxTheme: zone.vfxTheme,
  };
}

function makeBossLevel(level: number): LevelDef {
  const boss = getBossForLevel(level);
  const zone = ZONES[getZoneIdx(level)];
  const bossRank = Math.max(0, Math.floor(level / 10) - 1);
  const bossHp = Math.max(boss.hp, 3 + bossRank);
  const bossSpd = Math.max(boss.spd, parseFloat((1.8 + bossRank * 0.12).toFixed(2)));

  const worldW = 1100;
  const platforms: PlatDef[] = [
    { x: 0, y: 400, w: worldW, h: 80, type: 'solid' },
    { x: 160, y: 300, w: 130, h: 20, type: 'solid' },
    { x: 380, y: 235, w: 140, h: 20, type: 'solid' },
    { x: 620, y: 280, w: 130, h: 20, type: 'solid' },
    { x: 860, y: 215, w: 110, h: 20, type: 'solid' },
  ];

  return {
    worldW,
    platforms,
    coins: [
      { x: 200, y: 270 },
      { x: 440, y: 205 },
      { x: 660, y: 250 },
      { x: 900, y: 185 },
    ],
    enemies: [{
      x: 450,
      y: 355,
      vx: bossSpd,
      boss: true,
      hitsLeft: bossHp,
      size: boss.size,
      bossColor: boss.col,
      bossEmissive: boss.em,
    }],
    zoneName: zone.name,
    zoneStory: `⚔ BOSS: ${boss.name}\n${boss.title}\n\n${boss.intro}\n\n🎵 ${zone.audioTheme} · ✨ ${zone.vfxTheme}`,
    encounterName: boss.name,
    audioTheme: zone.audioTheme,
    vfxTheme: zone.vfxTheme,
    isBossLevel: true,
  };
}

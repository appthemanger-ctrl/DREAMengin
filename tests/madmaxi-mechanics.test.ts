import { describe, expect, it } from 'vitest';

import {
  MADMAXI_ENEMY_KINDS,
  MADMAXI_POWERUP_KINDS,
  MADMAXI_SUPER_SECONDS,
  MADMAXI_SUPER_STREAK,
  getEnemyKindForIndex,
  getMadmaxiLevelDefinition,
  getMadmaxiEnemyCount,
  getPowerUpForIndex,
} from '@/components/games/madmaxi';
import { getMadmaxiEnemyCount as getMadmaxiEnemyCountFromWrapper } from '@/components/games/BabylonSideScroller';

describe('MADMAXI mechanics config', () => {
  it('tracks ten distinct enemy archetypes and four power-ups', () => {
    expect(MADMAXI_ENEMY_KINDS).toHaveLength(10);
    expect(new Set(MADMAXI_ENEMY_KINDS).size).toBe(10);
    expect(MADMAXI_POWERUP_KINDS).toEqual(['shield', 'high-jump', 'laser', 'giant']);
  });

  it('ramps each 10-level band from two enemies up to ten before the boss, then resets', () => {
    expect(getMadmaxiEnemyCount(1)).toBe(2);
    expect(getMadmaxiEnemyCount(2)).toBe(3);
    expect(getMadmaxiEnemyCount(9)).toBe(10);
    expect(getMadmaxiEnemyCount(10)).toBe(1);
    expect(getMadmaxiEnemyCount(11)).toBe(2);
    expect(getMadmaxiEnemyCount(19)).toBe(10);
    expect(getMadmaxiEnemyCount(20)).toBe(1);
    expect(getMadmaxiEnemyCountFromWrapper(21)).toBe(getMadmaxiEnemyCount(21));
  });

  it('locks super mode to the clean-streak rules requested for MADMAXI', () => {
    expect(MADMAXI_SUPER_STREAK).toBe(9);
    expect(MADMAXI_SUPER_SECONDS).toBe(30);
  });

  it('rotates enemy archetypes and resolves power-up kinds through exported helpers', () => {
    expect(getEnemyKindForIndex(0, 1)).toBe('runner');
    expect(getEnemyKindForIndex(1, 1)).toBe('charger');
    expect(getEnemyKindForIndex(0, 11)).toBe('charger');

    expect(getPowerUpForIndex(0, () => 0)).toBe('shield');
    expect(getPowerUpForIndex(0, () => 0.3)).toBe('high-jump');
    expect(getPowerUpForIndex(0, () => 0.6)).toBe('laser');
    expect(getPowerUpForIndex(0, () => 0.95)).toBe('giant');
  });

  it('scales boss fights upward as the run advances', () => {
    const firstBoss = getMadmaxiLevelDefinition(10, 12345).enemies[0];
    const secondBoss = getMadmaxiLevelDefinition(20, 12345).enemies[0];
    const finalBoss = getMadmaxiLevelDefinition(150, 12345).enemies[0];

    expect(firstBoss?.boss).toBe(true);
    expect(secondBoss?.boss).toBe(true);
    expect(finalBoss?.boss).toBe(true);
    expect((secondBoss?.hitsLeft ?? 0)).toBeGreaterThan(firstBoss?.hitsLeft ?? 0);
    expect((finalBoss?.hitsLeft ?? 0)).toBeGreaterThan(secondBoss?.hitsLeft ?? 0);
    expect(Math.abs(finalBoss?.vx ?? 0)).toBeGreaterThan(Math.abs(firstBoss?.vx ?? 0));
  });
});

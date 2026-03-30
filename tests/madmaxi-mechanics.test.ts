import { describe, expect, it } from 'vitest';

import {
  MADMAXI_ENEMY_KINDS,
  MADMAXI_POWERUP_KINDS,
  MADMAXI_SUPER_SECONDS,
  MADMAXI_SUPER_STREAK,
  getEnemyKindForIndex,
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

  it('starts at ten enemies and adds two every ten levels', () => {
    expect(getMadmaxiEnemyCount(1)).toBe(10);
    expect(getMadmaxiEnemyCount(10)).toBe(10);
    expect(getMadmaxiEnemyCount(11)).toBe(12);
    expect(getMadmaxiEnemyCount(21)).toBe(14);
    expect(getMadmaxiEnemyCount(101)).toBe(30);
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
});

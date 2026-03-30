import { describe, expect, it } from 'vitest';

import {
  ZONES,
  getMadmaxiLevelDefinition,
  isMadmaxiAuthoredLevel,
} from '@/components/games/madmaxi';
import { isMadmaxiAuthoredLevel as isMadmaxiAuthoredLevelFromWrapper } from '@/components/games/BabylonSideScroller';

describe('MADMAXI authored zone starter levels', () => {
  it('marks the first two levels of each 10-level zone band as authored', () => {
    expect(isMadmaxiAuthoredLevel(1)).toBe(true);
    expect(isMadmaxiAuthoredLevel(2)).toBe(true);
    expect(isMadmaxiAuthoredLevel(11)).toBe(true);
    expect(isMadmaxiAuthoredLevel(12)).toBe(true);
    expect(isMadmaxiAuthoredLevel(21)).toBe(true);
    expect(isMadmaxiAuthoredLevel(22)).toBe(true);
    expect(isMadmaxiAuthoredLevel(141)).toBe(true);
    expect(isMadmaxiAuthoredLevel(142)).toBe(true);

    expect(isMadmaxiAuthoredLevel(3)).toBe(false);
    expect(isMadmaxiAuthoredLevel(13)).toBe(false);
    expect(isMadmaxiAuthoredLevel(23)).toBe(false);
    expect(isMadmaxiAuthoredLevel(10)).toBe(false);
    expect(isMadmaxiAuthoredLevelFromWrapper(21)).toBe(isMadmaxiAuthoredLevel(21));
  });

  it('gives zone opener levels authored encounter metadata and themed labels', () => {
    const level11 = getMadmaxiLevelDefinition(11, 12345);
    const level12 = getMadmaxiLevelDefinition(12, 12345);

    expect(level11.isAuthored).toBe(true);
    expect(level11.zoneName).toBe(ZONES[1].name);
    expect(level11.encounterName).toBeTruthy();
    expect(level11.audioTheme).toBe(ZONES[1].audioTheme);
    expect(level11.vfxTheme).toBe(ZONES[1].vfxTheme);
    expect(level11.coins).toHaveLength(10);
    expect(level11.hazards?.length ?? 0).toBeGreaterThan(0);
    expect(level11.powerUps?.length ?? 0).toBeGreaterThan(0);

    expect(level12.isAuthored).toBe(true);
    expect(level12.zoneName).toBe(ZONES[1].name);
    expect(level12.encounterName).not.toBe(level11.encounterName);
    expect(level12.zoneStory).toContain('⚡');
  });

  it('returns to procedural generation after the two authored starters in each zone band', () => {
    const level13 = getMadmaxiLevelDefinition(13, 12345);
    const level23 = getMadmaxiLevelDefinition(23, 12345);

    expect(level13.isAuthored).not.toBe(true);
    expect(level13.zoneName).toBe(ZONES[1].name);
    expect(level13.audioTheme).toBe(ZONES[1].audioTheme);
    expect(level13.vfxTheme).toBe(ZONES[1].vfxTheme);
    expect(level13.worldW).toBeGreaterThan(3000);

    expect(level23.isAuthored).not.toBe(true);
    expect(level23.zoneName).toBe(ZONES[2].name);
    expect(level23.enemies.length).toBeGreaterThanOrEqual(level13.enemies.length);
  });
});

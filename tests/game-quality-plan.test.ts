import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ADVANCED_GAME_TARGETS,
  GAME_CONTROL_PROFILES,
  GAME_ENGINE_STANDARDS,
  GAME_QUALITY_PILLARS,
} from '@/lib/games/quality-plan';

describe('GAME_QUALITY_PILLARS', () => {
  it('keeps game quality and controls as explicit priorities', () => {
    expect(GAME_QUALITY_PILLARS.some((pillar) => pillar.emphasis === 'Quality')).toBe(true);
    expect(GAME_QUALITY_PILLARS.some((pillar) => pillar.emphasis === 'Controls')).toBe(true);
  });

  it('captures premium mobile/home session goals', () => {
    const details = GAME_QUALITY_PILLARS.map((pillar) => pillar.detail).join(' ');
    expect(details).toMatch(/mobile|thumb|touch/i);
    expect(details).toMatch(/home|living-room|couch/i);
  });
});

describe('GAME_CONTROL_PROFILES', () => {
  it('offers distinct control modes for precision, arcade, and couch play', () => {
    expect(GAME_CONTROL_PROFILES.map((profile) => profile.id)).toEqual(['precision', 'arcade', 'couch']);
  });

  it('gives each control profile two concrete tuning bullets', () => {
    for (const profile of GAME_CONTROL_PROFILES) {
      expect(profile.bullets).toHaveLength(2);
      profile.bullets.forEach((bullet) => expect(bullet.trim().length).toBeGreaterThan(0));
    }
  });
});

describe('GAME_ENGINE_STANDARDS', () => {
  it('keeps premium engine depth ahead of simple tap-only design', () => {
    const details = GAME_ENGINE_STANDARDS.map((standard) => standard.detail).join(' ');
    expect(details).toMatch(/responsiveness|premium|engine-grade/i);
    expect(details).toMatch(/tap-only|procedural|boss|AI|progression/i);
  });
});

describe('ADVANCED_GAME_TARGETS', () => {
  it('tracks a flagship/advanced set of complex games for mandatory agent upgrades', () => {
    expect(ADVANCED_GAME_TARGETS.map((target) => target.id)).toEqual([
      'babylon-side-scroller',
      'engin-battle',
      'dreamquest',
    ]);
    expect(ADVANCED_GAME_TARGETS.some((target) => target.tier === 'flagship')).toBe(true);
  });

  it('stays in sync with the workflow-facing JSON manifest', () => {
    const manifestPath = resolve(process.cwd(), 'config/advanced-game-targets.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      advancedTargets: Array<{ id: string }>;
    };

    expect(manifest.advancedTargets.map((target) => target.id)).toEqual(
      ADVANCED_GAME_TARGETS.map((target) => target.id),
    );
  });
});

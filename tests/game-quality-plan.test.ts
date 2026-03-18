import { describe, expect, it } from 'vitest';

import { GAME_CONTROL_PROFILES, GAME_QUALITY_PILLARS } from '@/lib/games/quality-plan';

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

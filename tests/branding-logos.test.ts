import { describe, expect, it, beforeEach } from 'vitest';
import { getRandomLogo, resetLogoCache, LOGO_PATHS } from '@/lib/branding/logos';

describe('getRandomLogo', () => {
  beforeEach(() => {
    resetLogoCache();
  });

  it('returns one of the three known logo paths', () => {
    const logo = getRandomLogo();
    expect(LOGO_PATHS).toContain(logo);
  });

  it('returns the same value on repeated calls within a page load (per-load cache)', () => {
    const first = getRandomLogo();
    const second = getRandomLogo();
    const third = getRandomLogo();
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it('can return a different value after cache reset', () => {
    // Run multiple resets to give the random a chance to differ
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      resetLogoCache();
      seen.add(getRandomLogo());
    }
    // With 30 trials over 3 logos the probability of seeing only 1 is (1/3)^29 ≈ 0
    expect(seen.size).toBeGreaterThan(1);
  });

  it('all three logos are reachable over many resets', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      resetLogoCache();
      seen.add(getRandomLogo());
    }
    expect(seen.size).toBe(3);
  });

  it('paths begin with / and end with .png', () => {
    const logo = getRandomLogo();
    expect(logo).toMatch(/^\/branding\/logo[123]\.png$/);
  });
});

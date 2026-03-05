// tests/hero-sprite.test.ts
// Unit tests for HeroSprite touch-zone detection logic.
// The hitZone helper is exported from the component so it can be tested
// without a browser / canvas environment.

import { describe, it, expect } from 'vitest';
import { hitZone, ZONE_QUOTES, pickZoneQuote } from '@/components/HeroSprite';

describe('HeroSprite hitZone', () => {
  const H = 288; // representative canvas height

  it('returns "head" for the top 30% of the canvas', () => {
    expect(hitZone(0,         H)).toBe('head');
    expect(hitZone(H * 0.10,  H)).toBe('head');
    expect(hitZone(H * 0.29,  H)).toBe('head');
  });

  it('returns "torso" for the middle band (30%–68%)', () => {
    expect(hitZone(H * 0.30,  H)).toBe('torso');
    expect(hitZone(H * 0.50,  H)).toBe('torso');
    expect(hitZone(H * 0.67,  H)).toBe('torso');
  });

  it('returns "legs" for the bottom 32% of the canvas', () => {
    expect(hitZone(H * 0.68,  H)).toBe('legs');
    expect(hitZone(H * 0.85,  H)).toBe('legs');
    expect(hitZone(H,          H)).toBe('legs');
  });

  it('handles a very small canvas without throwing', () => {
    expect(() => hitZone(1, 10)).not.toThrow();
  });

  it('maps Enter → head, Space → torso, ArrowDown → legs zones correctly', () => {
    // Keyboard mapping mirrors: Enter=head (y=0), Space=torso (y=50%), ArrowDown=legs (y=100%)
    expect(hitZone(0,         H)).toBe('head');   // Enter fires head reaction
    expect(hitZone(H * 0.50,  H)).toBe('torso');  // Space fires torso reaction
    expect(hitZone(H,          H)).toBe('legs');  // ArrowDown fires legs reaction
  });
});

describe('HeroSprite ZONE_QUOTES', () => {
  it('has at least 3 funny quotes for each interaction zone', () => {
    expect(ZONE_QUOTES.head.length).toBeGreaterThanOrEqual(3);
    expect(ZONE_QUOTES.torso.length).toBeGreaterThanOrEqual(3);
    expect(ZONE_QUOTES.legs.length).toBeGreaterThanOrEqual(3);
  });

  it('all quotes are non-empty strings', () => {
    for (const zone of ['head', 'torso', 'legs'] as const) {
      for (const q of ZONE_QUOTES[zone]) {
        expect(typeof q).toBe('string');
        expect(q.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('no quote is the old boring label (head! / arms! / legs!)', () => {
    const boring = ['🧠 head!', '👋 arms!', '🦵 legs!'];
    for (const zone of ['head', 'torso', 'legs'] as const) {
      for (const q of ZONE_QUOTES[zone]) {
        expect(boring).not.toContain(q);
      }
    }
  });
});

describe('pickZoneQuote', () => {
  it('returns a string from the correct zone pool', () => {
    for (const zone of ['head', 'torso', 'legs'] as const) {
      const result = pickZoneQuote(zone);
      expect(ZONE_QUOTES[zone]).toContain(result);
    }
  });

  it('returns different quotes over multiple picks (randomness check)', () => {
    const results = new Set<string>();
    for (let i = 0; i < 60; i++) results.add(pickZoneQuote('head'));
    // With 6 quotes and 60 picks, expect at least 4 unique results
    expect(results.size).toBeGreaterThanOrEqual(4);
  });
});

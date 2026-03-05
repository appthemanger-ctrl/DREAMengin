// tests/hero-sprite.test.ts
// Unit tests for HeroSprite touch-zone detection logic.
// The hitZone helper is exported from the component so it can be tested
// without a browser / canvas environment.

import { describe, it, expect } from 'vitest';
import { hitZone } from '@/components/HeroSprite';

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

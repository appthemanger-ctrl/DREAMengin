/**
 * tests/neural-seam-flow.test.ts
 *
 * Unit tests for lib/dreamdm/bridgeSeamFlow.ts
 *
 * All functions are pure (no browser APIs, no React), so these run
 * in the standard Vitest Node environment without any mocks.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SEAM_CHANNEL_COLORS,
  SEAM_DEFAULT_COLOR,
  channelColor,
  createSeamParticle,
  createIdleParticle,
  tickParticles,
  isParticleDead,
  evictDeadParticles,
  _resetIdCounter,
  type SeamParticle,
} from '@/lib/dreamdm/bridgeSeamFlow';

beforeEach(() => {
  _resetIdCounter();
});

// ── channelColor ──────────────────────────────────────────────────────────────

describe('channelColor()', () => {
  it('returns the canonical hex for known channels', () => {
    expect(channelColor('code')).toBe(SEAM_CHANNEL_COLORS['code']);
    expect(channelColor('music')).toBe(SEAM_CHANNEL_COLORS['music']);
    expect(channelColor('games')).toBe(SEAM_CHANNEL_COLORS['games']);
    expect(channelColor('lab')).toBe(SEAM_CHANNEL_COLORS['lab']);
    expect(channelColor('brand')).toBe(SEAM_CHANNEL_COLORS['brand']);
    expect(channelColor('create')).toBe(SEAM_CHANNEL_COLORS['create']);
    expect(channelColor('content')).toBe(SEAM_CHANNEL_COLORS['content']);
  });

  it('returns the default gold for unknown channels', () => {
    expect(channelColor('unknown')).toBe(SEAM_DEFAULT_COLOR);
    expect(channelColor('')).toBe(SEAM_DEFAULT_COLOR);
    expect(channelColor('admin')).toBe(SEAM_DEFAULT_COLOR);
  });

  it('handles the game alias correctly', () => {
    expect(channelColor('game')).toBe(SEAM_CHANNEL_COLORS['games']);
  });
});

// ── createSeamParticle ────────────────────────────────────────────────────────

describe('createSeamParticle()', () => {
  it('assigns the correct color for the channel', () => {
    const p = createSeamParticle('code');
    expect(p.color).toBe(SEAM_CHANNEL_COLORS['code']);
  });

  it('falls back to default color for unknown channel', () => {
    const p = createSeamParticle('mystery');
    expect(p.color).toBe(SEAM_DEFAULT_COLOR);
  });

  it('starts with age 0 and alpha 1', () => {
    const p = createSeamParticle('music');
    expect(p.age).toBe(0);
    expect(p.alpha).toBe(1);
  });

  it('starts within the middle horizontal zone (x ∈ [0.2, 0.8])', () => {
    // Run many times to statistically confirm.
    for (let i = 0; i < 50; i++) {
      const p = createSeamParticle('lab');
      expect(p.x).toBeGreaterThanOrEqual(0.2);
      expect(p.x).toBeLessThanOrEqual(0.8);
    }
  });

  it('sets isIdle = false', () => {
    const p = createSeamParticle('brand');
    expect(p.isIdle).toBe(false);
  });

  it('assigns a positive horizontal velocity', () => {
    // vx must be nonzero (moves left or right).
    for (let i = 0; i < 20; i++) {
      const p = createSeamParticle('code');
      expect(Math.abs(p.vx)).toBeGreaterThan(0);
    }
  });

  it('increments IDs across calls', () => {
    const a = createSeamParticle('code');
    const b = createSeamParticle('music');
    expect(b.id).toBe(a.id + 1);
  });

  it('lifespan is between 700 and 1000 ms', () => {
    for (let i = 0; i < 30; i++) {
      const p = createSeamParticle('games');
      expect(p.lifespanMs).toBeGreaterThanOrEqual(700);
      expect(p.lifespanMs).toBeLessThanOrEqual(1000);
    }
  });
});

// ── createIdleParticle ────────────────────────────────────────────────────────

describe('createIdleParticle()', () => {
  it('starts at the given x position', () => {
    const p = createIdleParticle(0.1);
    expect(p.x).toBe(0.1);
  });

  it('sets isIdle = true', () => {
    const p = createIdleParticle(0.05);
    expect(p.isIdle).toBe(true);
  });

  it('has a low starting alpha (≤ 0.36)', () => {
    for (let i = 0; i < 20; i++) {
      const p = createIdleParticle(0.1);
      expect(p.alpha).toBeLessThanOrEqual(0.36);
    }
  });

  it('has a long lifespan (≥ 5000 ms)', () => {
    for (let i = 0; i < 20; i++) {
      const p = createIdleParticle(0.1);
      expect(p.lifespanMs).toBeGreaterThanOrEqual(5000);
    }
  });

  it('moves rightward (positive vx)', () => {
    const p = createIdleParticle(0.0);
    expect(p.vx).toBeGreaterThan(0);
  });
});

// ── tickParticles ─────────────────────────────────────────────────────────────

describe('tickParticles()', () => {
  it('advances age proportionally to dt / lifespanMs', () => {
    const p = createSeamParticle('code');
    const lifespan = p.lifespanMs;
    tickParticles([p], lifespan * 0.5);
    expect(p.age).toBeCloseTo(0.5, 3);
  });

  it('caps age at 1', () => {
    const p = createSeamParticle('code');
    tickParticles([p], p.lifespanMs * 10);
    expect(p.age).toBe(1);
  });

  it('moves x by vx * dt', () => {
    const p = createSeamParticle('lab');
    const startX = p.x;
    const dt = 100;
    tickParticles([p], dt);
    expect(p.x).toBeCloseTo(startX + p.vx * dt, 6);
  });

  it('skips already-dead particles (age = 1)', () => {
    const p = createSeamParticle('games');
    p.age = 1;
    const startX = p.x;
    tickParticles([p], 200);
    // x should not change when age is already 1
    expect(p.x).toBe(startX);
  });

  it('reduces alpha in the last 40% of life', () => {
    const p = createSeamParticle('brand');
    // Set age to 80% → in the fade window.
    p.age = 0;
    tickParticles([p], p.lifespanMs * 0.8);
    expect(p.alpha).toBeLessThan(1);
    expect(p.alpha).toBeGreaterThanOrEqual(0);
  });

  it('mutates particles in place', () => {
    const particles: SeamParticle[] = [createSeamParticle('code'), createSeamParticle('music')];
    const refs = particles.map(p => p);
    tickParticles(particles, 16);
    // Same object references.
    expect(particles[0]).toBe(refs[0]);
    expect(particles[1]).toBe(refs[1]);
  });
});

// ── isParticleDead ────────────────────────────────────────────────────────────

describe('isParticleDead()', () => {
  it('returns false for a fresh particle', () => {
    const p = createSeamParticle('music');
    expect(isParticleDead(p)).toBe(false);
  });

  it('returns true when age = 1', () => {
    const p = createSeamParticle('music');
    p.age = 1;
    expect(isParticleDead(p)).toBe(true);
  });

  it('returns true when alpha is effectively 0', () => {
    const p = createSeamParticle('code');
    p.alpha = 0;
    expect(isParticleDead(p)).toBe(true);
  });

  it('returns true when x overflows the left edge', () => {
    const p = createSeamParticle('lab');
    p.x = -0.1;
    expect(isParticleDead(p)).toBe(true);
  });

  it('returns true when x overflows the right edge', () => {
    const p = createSeamParticle('brand');
    p.x = 1.1;
    expect(isParticleDead(p)).toBe(true);
  });
});

// ── evictDeadParticles ────────────────────────────────────────────────────────

describe('evictDeadParticles()', () => {
  it('removes expired particles', () => {
    const a = createSeamParticle('code');
    const b = createSeamParticle('music');
    b.age = 1; // dead
    const result = evictDeadParticles([a, b]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(a.id);
  });

  it('returns a new array (non-mutating)', () => {
    const particles = [createSeamParticle('games')];
    const result = evictDeadParticles(particles);
    expect(result).not.toBe(particles);
  });

  it('returns empty array when all are dead', () => {
    const particles = [createSeamParticle('lab'), createSeamParticle('brand')];
    for (const p of particles) p.age = 1;
    expect(evictDeadParticles(particles)).toHaveLength(0);
  });

  it('keeps all particles when none are dead', () => {
    const particles = [createSeamParticle('code'), createSeamParticle('music'), createIdleParticle(0.1)];
    expect(evictDeadParticles(particles)).toHaveLength(3);
  });
});

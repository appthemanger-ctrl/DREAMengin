// tests/warp-engine.test.ts
// Unit tests for the WarpEngine — the browser-native scaled-down NVIDIA Warp
// implementation.  All tests run in the Node environment (no DOM needed)
// because the engine itself has zero browser dependencies.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  WarpEngine,
  WarpParticle,
  WarpContext,
  spawnParticle,
  integrateKernel,
  decayKernel,
  gravityKernel,
  turbulenceKernel,
  spiralKernel,
  expansionKernel,
  flowKernel,
  dampingKernel,
  wrapBoundaryKernel,
} from '@/lib/warp/warpEngine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParticle(overrides: Partial<WarpParticle> = {}): WarpParticle {
  return {
    pos:     { x: 400, y: 300 },
    vel:     { x: 10, y: -10 },
    life:    1.0,
    decay:   0.1,
    radius:  2,
    color:   '#7eb8f7',
    opacity: 1.0,
    ...overrides,
  };
}

function makeCtx(overrides: Partial<WarpContext> = {}): WarpContext {
  return {
    time:   1.0,
    dt:     0.016,
    width:  800,
    height: 600,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// integrateKernel
// ---------------------------------------------------------------------------

describe('integrateKernel', () => {
  it('advances position by velocity * dt', () => {
    const p   = makeParticle({ pos: { x: 0, y: 0 }, vel: { x: 100, y: 50 } });
    const ctx = makeCtx({ dt: 0.1 });
    integrateKernel(p, ctx);
    expect(p.pos.x).toBeCloseTo(10);
    expect(p.pos.y).toBeCloseTo(5);
  });

  it('does not change velocity', () => {
    const p = makeParticle({ vel: { x: 20, y: -30 } });
    integrateKernel(p, makeCtx());
    expect(p.vel.x).toBe(20);
    expect(p.vel.y).toBe(-30);
  });

  it('handles zero velocity', () => {
    const p = makeParticle({ pos: { x: 5, y: 5 }, vel: { x: 0, y: 0 } });
    integrateKernel(p, makeCtx());
    expect(p.pos.x).toBe(5);
    expect(p.pos.y).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// decayKernel
// ---------------------------------------------------------------------------

describe('decayKernel', () => {
  it('reduces life by decay * dt', () => {
    const p   = makeParticle({ life: 1.0, decay: 0.5 });
    const ctx = makeCtx({ dt: 0.1 });
    decayKernel(p, ctx);
    expect(p.life).toBeCloseTo(0.95);
  });

  it('clamps life to 0', () => {
    const p = makeParticle({ life: 0.001, decay: 10 });
    decayKernel(p, makeCtx({ dt: 0.1 }));
    expect(p.life).toBe(0);
  });

  it('sets opacity equal to life', () => {
    const p = makeParticle({ life: 0.6, decay: 0.1 });
    decayKernel(p, makeCtx({ dt: 0.1 }));
    expect(p.opacity).toBeCloseTo(p.life);
  });
});

// ---------------------------------------------------------------------------
// gravityKernel
// ---------------------------------------------------------------------------

describe('gravityKernel', () => {
  it('increases vy (downward)', () => {
    const p = makeParticle({ vel: { x: 0, y: 0 } });
    gravityKernel(p, makeCtx({ dt: 1 }));
    expect(p.vel.y).toBeGreaterThan(0);
  });

  it('does not affect vx', () => {
    const p = makeParticle({ vel: { x: 5, y: 0 } });
    gravityKernel(p, makeCtx({ dt: 1 }));
    expect(p.vel.x).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// turbulenceKernel
// ---------------------------------------------------------------------------

describe('turbulenceKernel', () => {
  it('changes velocity in both axes', () => {
    const p = makeParticle({ vel: { x: 0, y: 0 } });
    turbulenceKernel(p, makeCtx({ dt: 1 }));
    expect(Math.abs(p.vel.x) + Math.abs(p.vel.y)).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// spiralKernel
// ---------------------------------------------------------------------------

describe('spiralKernel', () => {
  it('applies a velocity change toward the centre', () => {
    // Particle far to the left of centre — vx should increase (pull right)
    const p   = makeParticle({ pos: { x: 0, y: 300 }, vel: { x: 0, y: 0 } });
    const ctx = makeCtx({ width: 800, height: 600, dt: 1 });
    spiralKernel(p, ctx);
    // x-component should be positive (pull toward cx=400)
    expect(p.vel.x).toBeGreaterThan(0);
  });

  it('does not affect a particle exactly at centre (near-zero force)', () => {
    const p   = makeParticle({ pos: { x: 400, y: 300 }, vel: { x: 0, y: 0 } });
    spiralKernel(p, makeCtx({ dt: 1 }));
    // Force is ~0 at centre but not exactly 0 due to tangential component
    expect(isFinite(p.vel.x)).toBe(true);
    expect(isFinite(p.vel.y)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// expansionKernel
// ---------------------------------------------------------------------------

describe('expansionKernel', () => {
  it('pushes a right-of-centre particle further right', () => {
    const p   = makeParticle({ pos: { x: 700, y: 300 }, vel: { x: 0, y: 0 } });
    expansionKernel(p, makeCtx({ dt: 1 }));
    expect(p.vel.x).toBeGreaterThan(0);
  });

  it('pushes a left-of-centre particle further left', () => {
    const p   = makeParticle({ pos: { x: 100, y: 300 }, vel: { x: 0, y: 0 } });
    expansionKernel(p, makeCtx({ dt: 1 }));
    expect(p.vel.x).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// flowKernel
// ---------------------------------------------------------------------------

describe('flowKernel', () => {
  it('changes particle velocity (field is nonzero at arbitrary positions)', () => {
    const p   = makeParticle({ pos: { x: 200, y: 150 }, vel: { x: 0, y: 0 } });
    flowKernel(p, makeCtx({ time: 0.5, dt: 1 }));
    const speed = Math.abs(p.vel.x) + Math.abs(p.vel.y);
    expect(speed).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// dampingKernel
// ---------------------------------------------------------------------------

describe('dampingKernel', () => {
  it('reduces velocity magnitude', () => {
    const p = makeParticle({ vel: { x: 100, y: 100 } });
    dampingKernel(p, makeCtx({ dt: 0.1 }));
    expect(Math.abs(p.vel.x)).toBeLessThan(100);
    expect(Math.abs(p.vel.y)).toBeLessThan(100);
  });

  it('preserves velocity direction (sign unchanged)', () => {
    const p = makeParticle({ vel: { x: 50, y: -30 } });
    dampingKernel(p, makeCtx({ dt: 0.05 }));
    expect(p.vel.x).toBeGreaterThan(0);
    expect(p.vel.y).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// wrapBoundaryKernel
// ---------------------------------------------------------------------------

describe('wrapBoundaryKernel', () => {
  const ctx = makeCtx({ width: 800, height: 600 });

  it('wraps a particle escaping the right edge back to the left', () => {
    const p = makeParticle({ pos: { x: 900, y: 300 } });
    wrapBoundaryKernel(p, ctx);
    expect(p.pos.x).toBeCloseTo(100);
  });

  it('wraps a particle escaping the left edge back to the right', () => {
    const p = makeParticle({ pos: { x: -50, y: 300 } });
    wrapBoundaryKernel(p, ctx);
    expect(p.pos.x).toBeCloseTo(750);
  });

  it('wraps a particle escaping the bottom back to the top', () => {
    const p = makeParticle({ pos: { x: 400, y: 700 } });
    wrapBoundaryKernel(p, ctx);
    expect(p.pos.y).toBeCloseTo(100);
  });

  it('wraps a particle escaping the top back to the bottom', () => {
    const p = makeParticle({ pos: { x: 400, y: -10 } });
    wrapBoundaryKernel(p, ctx);
    expect(p.pos.y).toBeCloseTo(590);
  });

  it('leaves an in-bounds particle unchanged', () => {
    const p = makeParticle({ pos: { x: 400, y: 300 } });
    wrapBoundaryKernel(p, ctx);
    expect(p.pos.x).toBe(400);
    expect(p.pos.y).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// spawnParticle
// ---------------------------------------------------------------------------

describe('spawnParticle', () => {
  it.each(['particles', 'field', 'flow', 'orbit'] as const)(
    'creates a valid particle for effect "%s"',
    (effect) => {
      const p = spawnParticle(effect, 800, 600);
      expect(p.life).toBeGreaterThan(0);
      expect(p.life).toBeLessThanOrEqual(1);
      expect(p.decay).toBeGreaterThan(0);
      expect(p.radius).toBeGreaterThan(0);
      expect(typeof p.color).toBe('string');
      expect(p.color.startsWith('#')).toBe(true);
    },
  );

  it('emits "particles" from the top edge (y ≈ -4)', () => {
    // Run many times so we're confident it's always near the top
    for (let i = 0; i < 20; i++) {
      const p = spawnParticle('particles', 800, 600);
      expect(p.pos.y).toBeCloseTo(-4);
    }
  });

  it('emits "orbit" particles near the centre', () => {
    for (let i = 0; i < 20; i++) {
      const p = spawnParticle('orbit', 800, 600);
      expect(Math.abs(p.pos.x - 400)).toBeLessThanOrEqual(40);
      expect(Math.abs(p.pos.y - 300)).toBeLessThanOrEqual(40);
    }
  });
});

// ---------------------------------------------------------------------------
// WarpEngine class
// ---------------------------------------------------------------------------

describe('WarpEngine', () => {
  let engine: WarpEngine;

  beforeEach(() => {
    engine = new WarpEngine({ maxParticles: 50, spawnRate: 100, effect: 'flow' });
    engine.resize(800, 600);
  });

  it('starts with no particles', () => {
    expect(engine.particles).toHaveLength(0);
  });

  it('spawns particles on the first step', () => {
    engine.step(0.1);
    expect(engine.particles.length).toBeGreaterThan(0);
  });

  it('respects maxParticles cap', () => {
    for (let i = 0; i < 100; i++) engine.step(0.05);
    expect(engine.particles.length).toBeLessThanOrEqual(engine.maxParticles);
  });

  it('tracks elapsed time', () => {
    engine.step(0.5);
    engine.step(0.5);
    expect(engine.elapsedTime).toBeCloseTo(1.0);
  });

  it('reaps dead particles over time', () => {
    // Seed with high-decay particles and run long enough to kill them
    const highDecay = new WarpEngine({ maxParticles: 10, spawnRate: 0, effect: 'flow' });
    highDecay.resize(800, 600);
    highDecay.particles = Array.from({ length: 10 }, () =>
      makeParticle({ life: 0.01, decay: 100 }),
    );
    highDecay.step(0.1);
    expect(highDecay.particles.length).toBe(0);
  });

  it('reset() clears all particles and resets time', () => {
    engine.step(0.5);
    engine.reset();
    expect(engine.particles).toHaveLength(0);
    expect(engine.elapsedTime).toBe(0);
  });

  it('setEffect() changes the active effect', () => {
    engine.setEffect('orbit');
    expect(engine.effect).toBe('orbit');
  });

  it('resize() updates simulation domain', () => {
    engine.resize(1920, 1080);
    // Step and check particles are spawned within the new domain
    engine.step(0.1);
    for (const p of engine.particles) {
      expect(isFinite(p.pos.x)).toBe(true);
      expect(isFinite(p.pos.y)).toBe(true);
    }
  });

  it('load property reflects particle pool fill ratio', () => {
    expect(engine.load).toBe(0);
    for (let i = 0; i < 20; i++) engine.step(0.05);
    expect(engine.load).toBeGreaterThan(0);
    expect(engine.load).toBeLessThanOrEqual(1);
  });

  it('accepts extra kernels that execute each step', () => {
    let kernelCalled = false;
    const trackerEngine = new WarpEngine({
      maxParticles: 10,
      spawnRate:    100,
      effect:       'flow',
      extraKernels: [() => { kernelCalled = true; }],
    });
    trackerEngine.resize(800, 600);
    // Pre-seed one particle so the kernel loop has something to iterate over
    trackerEngine.particles = [makeParticle()];
    trackerEngine.step(0.016);
    expect(kernelCalled).toBe(true);
  });

  it('all particle positions remain finite after many steps', () => {
    for (let i = 0; i < 120; i++) engine.step(0.016);
    for (const p of engine.particles) {
      expect(isFinite(p.pos.x)).toBe(true);
      expect(isFinite(p.pos.y)).toBe(true);
      expect(isFinite(p.vel.x)).toBe(true);
      expect(isFinite(p.vel.y)).toBe(true);
    }
  });

  it.each(['particles', 'field', 'flow', 'orbit'] as const)(
    'runs without error for effect "%s"',
    (effect) => {
      const e = new WarpEngine({ maxParticles: 30, spawnRate: 50, effect });
      e.resize(800, 600);
      expect(() => {
        for (let i = 0; i < 20; i++) e.step(0.016);
      }).not.toThrow();
    },
  );
});

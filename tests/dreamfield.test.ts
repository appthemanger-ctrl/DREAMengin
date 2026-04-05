/**
 * Tests for components/daydream/DREAMfield.tsx
 *
 * Runs in Node (no WebGPU/canvas/AudioContext) so we verify:
 *   - Module exports the component as default, named DREAMfield
 *   - PLANET_CONFIGS shape and values are correct
 *   - createAmbientAudio handles missing AudioContext gracefully
 *   - All planet hrefs route to canonical daydream routes
 *   - Momentum library interop
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Stub Babylon.js ───────────────────────────────────────────────────────────

const mockEngine = {
  getDeltaTime: vi.fn(() => 16),
  runRenderLoop: vi.fn(),
  stopRenderLoop: vi.fn(),
  resize:        vi.fn(),
  dispose:       vi.fn(),
};

vi.mock('@/lib/babylon/createEngine', () => ({
  createBabylonEngine: vi.fn().mockResolvedValue({
    engine:    mockEngine,
    isWebGPU:  false,
  }),
}));

const mockScene = {
  clearColor:               null,
  render:                   vi.fn(),
  onBeforeRenderObservable: { add: vi.fn() },
  meshes:                   [],
};

const mockMesh = {
  position:       { x: 0, y: 0, z: 0, set: vi.fn() },
  rotation:       { x: 0, y: 0, z: 0 },
  material:       null,
  parent:         null,
  actionManager:  null,
};

vi.mock('@babylonjs/core', () => ({
  Scene:             vi.fn(() => mockScene),
  Vector3:           vi.fn((x: number, y: number, z: number) => ({ x, y, z })),
  Color3:            vi.fn((r: number, g: number, b: number) => ({ r, g, b })),
  Color4:            vi.fn((r: number, g: number, b: number, a: number) => ({ r, g, b, a })),
  ArcRotateCamera:   vi.fn(() => ({
    lowerRadiusLimit: 0, upperRadiusLimit: 0,
    lowerBetaLimit:   0, upperBetaLimit:   0,
    attachControl:    vi.fn(),
  })),
  HemisphericLight:  vi.fn(() => ({ intensity: 0, diffuse: null, groundColor: null })),
  PointLight:        vi.fn(() => ({ diffuse: null, specular: null, intensity: 0, range: 0 })),
  MeshBuilder: {
    CreateSphere: vi.fn(() => ({ ...mockMesh })),
    CreateTorus:  vi.fn(() => ({ ...mockMesh })),
  },
  PBRMaterial: vi.fn(() => ({
    albedoColor: null, emissiveColor: null, metallic: 0, roughness: 0,
  })),
  GlowLayer:    vi.fn(() => ({ intensity: 0, addIncludedOnlyMesh: vi.fn() })),
  ParticleSystem: vi.fn(() => ({
    particleTexture: null, emitter: null,
    minEmitBox: null, maxEmitBox: null,
    color1: null, color2: null, colorDead: null,
    minSize: 0, maxSize: 0,
    minLifeTime: 0, maxLifeTime: 0,
    emitRate: 0, minEmitPower: 0, maxEmitPower: 0,
    updateSpeed: 0,
    start: vi.fn(),
  })),
  Texture: vi.fn(),
  DefaultRenderingPipeline: vi.fn(() => ({
    bloomEnabled: false, bloomThreshold: 0, bloomWeight: 0, bloomScale: 0,
    chromaticAberrationEnabled: false,
    chromaticAberration: { aberrationAmount: 0 },
    fxaaEnabled: false,
  })),
  ActionManager: Object.assign(
    vi.fn(() => ({ registerAction: vi.fn() })),
    {
      OnPickTrigger:          0,
      OnPointerOverTrigger:   9,
      OnPointerOutTrigger:   10,
    },
  ),
  ExecuteCodeAction: vi.fn(),
}));

// ── Stub forge momentum ───────────────────────────────────────────────────────

vi.mock('@/lib/forge/forgeMomentum', () => ({
  computeMomentum: vi.fn(() => ({
    composite:          55,
    level:              'FLOWING',
    streakDays:          4,
    enginesUsedToday:   ['music', 'games'],
    actionsToday:        8,
    actionsWeek:        22,
    dimensions:         [],
    computedAt:          new Date().toISOString(),
  })),
  getLevelColor: vi.fn((level: string) => {
    const map: Record<string, string> = {
      TRANSCENDENT: '#a855f7',
      BLAZING:      '#ef4444',
      FLOWING:      '#22c55e',
      WARMING:      '#fb923c',
      DORMANT:      '#64748b',
    };
    return map[level] ?? '#64748b';
  }),
  getLevelEmoji: vi.fn((level: string) => {
    const map: Record<string, string> = {
      TRANSCENDENT: '🌟',
      BLAZING:      '🔥',
      FLOWING:      '🌊',
      WARMING:      '☀️',
      DORMANT:      '💤',
    };
    return map[level] ?? '💤';
  }),
}));

// ── Stub next/navigation ──────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DREAMfield', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(()  => { vi.restoreAllMocks(); });

  // ── Default export ─────────────────────────────────────────────────────────

  it('exports DREAMfield as the default export', async () => {
    const mod = await import('@/components/daydream/DREAMfield');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('default export is named DREAMfield', async () => {
    const mod = await import('@/components/daydream/DREAMfield');
    expect(mod.default.name).toBe('DREAMfield');
  });

  // ── PLANET_CONFIGS ─────────────────────────────────────────────────────────

  it('exports PLANET_CONFIGS as a named export', async () => {
    const mod = await import('@/components/daydream/DREAMfield');
    expect(mod.PLANET_CONFIGS).toBeDefined();
    expect(Array.isArray(mod.PLANET_CONFIGS)).toBe(true);
  });

  it('PLANET_CONFIGS has exactly 6 entries (one per creative Engin)', async () => {
    const { PLANET_CONFIGS } = await import('@/components/daydream/DREAMfield');
    expect(PLANET_CONFIGS).toHaveLength(6);
  });

  it('every planet config has required string fields', async () => {
    const { PLANET_CONFIGS } = await import('@/components/daydream/DREAMfield');
    for (const cfg of PLANET_CONFIGS) {
      expect(typeof cfg.enginId).toBe('string');
      expect(cfg.enginId.length).toBeGreaterThan(0);
      expect(typeof cfg.name).toBe('string');
      expect(cfg.name.length).toBeGreaterThan(0);
      expect(typeof cfg.emoji).toBe('string');
      expect(typeof cfg.label).toBe('string');
      expect(typeof cfg.accent).toBe('string');
      expect(cfg.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('every planet config has positive numeric physics fields', async () => {
    const { PLANET_CONFIGS } = await import('@/components/daydream/DREAMfield');
    for (const cfg of PLANET_CONFIGS) {
      expect(cfg.orbitRadius).toBeGreaterThan(0);
      expect(cfg.orbitSpeed).toBeGreaterThan(0);
      expect(cfg.size).toBeGreaterThan(0);
      expect(typeof cfg.r).toBe('number');
      expect(typeof cfg.g).toBe('number');
      expect(typeof cfg.b).toBe('number');
      expect(cfg.r).toBeGreaterThanOrEqual(0);
      expect(cfg.r).toBeLessThanOrEqual(1);
    }
  });

  it('all planet hrefs point to canonical /daydream/* routes', async () => {
    const { PLANET_CONFIGS } = await import('@/components/daydream/DREAMfield');
    const valid = new Set([
      '/daydream/games',
      '/daydream/music',
      '/daydream/code',
      '/daydream/lab',
      '/daydream/brand',
      '/daydream/create',
    ]);
    for (const cfg of PLANET_CONFIGS) {
      expect(valid.has(cfg.href)).toBe(true);
    }
  });

  it('each enginId is unique', async () => {
    const { PLANET_CONFIGS } = await import('@/components/daydream/DREAMfield');
    const ids = PLANET_CONFIGS.map(p => p.enginId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('orbit radii are strictly increasing (inner → outer)', async () => {
    const { PLANET_CONFIGS } = await import('@/components/daydream/DREAMfield');
    for (let i = 1; i < PLANET_CONFIGS.length; i++) {
      expect(PLANET_CONFIGS[i].orbitRadius).toBeGreaterThan(
        PLANET_CONFIGS[i - 1].orbitRadius,
      );
    }
  });

  it('exactly 2 ring planets exist (code, create)', async () => {
    const { PLANET_CONFIGS } = await import('@/components/daydream/DREAMfield');
    const ringed = PLANET_CONFIGS.filter(p => p.ringPlanet);
    expect(ringed).toHaveLength(2);
    const ids = ringed.map(p => p.enginId);
    expect(ids).toContain('code');
    expect(ids).toContain('create');
  });

  // ── createAmbientAudio ─────────────────────────────────────────────────────

  it('exports createAmbientAudio as a named export', async () => {
    const mod = await import('@/components/daydream/DREAMfield');
    expect(typeof mod.createAmbientAudio).toBe('function');
  });

  it('createAmbientAudio returns { cleanup, analyser } for all momentum levels', async () => {
    const { createAmbientAudio } = await import('@/components/daydream/DREAMfield');
    const levels = ['DORMANT', 'WARMING', 'FLOWING', 'BLAZING', 'TRANSCENDENT'] as const;
    for (const lvl of levels) {
      const result = createAmbientAudio(lvl);
      expect(typeof result.cleanup).toBe('function');
      // analyser is null when AudioContext is unavailable (Node env)
      expect(result.analyser === null || typeof result.analyser === 'object').toBe(true);
      // cleanup must not throw
      expect(() => result.cleanup()).not.toThrow();
    }
  });

  it('createAmbientAudio cleanup is idempotent (double-call safe)', async () => {
    const { createAmbientAudio } = await import('@/components/daydream/DREAMfield');
    const { cleanup } = createAmbientAudio('FLOWING');
    expect(() => { cleanup(); cleanup(); }).not.toThrow();
  });

  // ── Forge Momentum integration ─────────────────────────────────────────────

  it('getLevelColor returns valid CSS hex for all levels', async () => {
    const { getLevelColor } = await import('@/lib/forge/forgeMomentum');
    const levels = ['DORMANT', 'WARMING', 'FLOWING', 'BLAZING', 'TRANSCENDENT'] as const;
    for (const lvl of levels) {
      const color = getLevelColor(lvl);
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('getLevelEmoji returns a non-empty string for all levels', async () => {
    const { getLevelEmoji } = await import('@/lib/forge/forgeMomentum');
    const levels = ['DORMANT', 'WARMING', 'FLOWING', 'BLAZING', 'TRANSCENDENT'] as const;
    for (const lvl of levels) {
      const emoji = getLevelEmoji(lvl);
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThan(0);
    }
  });
});

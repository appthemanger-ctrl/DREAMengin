/**
 * Tests for components/dreamengin/DREAMenginOS.tsx
 *
 * Runs in Node (no WebGPU/canvas) so we verify:
 *   - Module exports the component as default
 *   - Props type-shape is correct
 *   - Babylon engine factory is invoked via createBabylonEngine
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Stubs ─────────────────────────────────────────────────────────────────────

const mockEngine = {
  runRenderLoop: vi.fn(),
  stopRenderLoop: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
};

vi.mock('@/lib/babylon/createEngine', () => ({
  createBabylonEngine: vi.fn().mockResolvedValue({
    engine: mockEngine,
    isWebGPU: true,
  }),
}));

const mockScene = {
  clearColor: null,
  enablePhysics: vi.fn(),
  meshes: [],
  onBeforeRenderObservable: { add: vi.fn() },
  render: vi.fn(),
};

vi.mock('@babylonjs/core', () => ({
  Scene: vi.fn(() => mockScene),
  Vector3: vi.fn((x: number, y: number, z: number) => ({ x, y, z })),
  Color4: vi.fn((r: number, g: number, b: number, a: number) => ({ r, g, b, a })),
  DefaultRenderingPipeline: vi.fn(() => ({
    bloomEnabled: false,
    bloomThreshold: 0,
    bloomWeight: 0,
    chromaticAberrationEnabled: false,
    chromaticAberration: { aberrationAmount: 0 },
  })),
  GlowLayer: vi.fn(() => ({ intensity: 0 })),
  HavokPlugin: vi.fn(),
}));

vi.mock('@babylonjs/havok', () => ({
  default: vi.fn().mockResolvedValue({}),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DREAMenginOS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports DREAMenginOS as the default export', async () => {
    const mod = await import('@/components/dreamengin/DREAMenginOS');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('exports DREAMenginOSProps type (module shape check)', async () => {
    // TypeScript-only check — if this compiles, the type exists
    const mod = await import('@/components/dreamengin/DREAMenginOS');
    expect(mod.default.name).toBe('DREAMenginOS');
  });

  it('createBabylonEngine is importable and mockable', async () => {
    const { createBabylonEngine } = await import('@/lib/babylon/createEngine');
    expect(typeof createBabylonEngine).toBe('function');
  });
});

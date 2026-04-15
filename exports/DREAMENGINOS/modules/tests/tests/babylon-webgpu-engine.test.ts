/**
 * Tests for lib/babylon/createEngine.ts — WebGPU-first engine factory.
 *
 * These tests run in Node (no DOM / WebGPU available) so they verify
 * the factory falls back gracefully to the WebGL path when WebGPU is
 * not present.  They also verify the module shape and option defaults.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Minimal Babylon.js stubs ──────────────────────────────────────────────────

const mockWebGLEngine = {
  setHardwareScalingLevel: vi.fn(),
  runRenderLoop: vi.fn(),
  stopRenderLoop: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
  isWebGPU: false,
};

const mockWebGPUEngine = {
  setHardwareScalingLevel: vi.fn(),
  runRenderLoop: vi.fn(),
  stopRenderLoop: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
  isWebGPU: true,
};

const MockEngine = vi.fn(function (this: typeof mockWebGLEngine) {
  Object.assign(this, mockWebGLEngine);
}) as unknown as new (...args: unknown[]) => typeof mockWebGLEngine;
const MockWebGPUEngine = {
  IsSupportedAsync: Promise.resolve(false),
  CreateAsync: vi.fn().mockResolvedValue(mockWebGPUEngine),
};

vi.mock('@babylonjs/core', () => ({
  Engine: MockEngine,
  WebGPUEngine: MockWebGPUEngine,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createBabylonEngine', () => {
  const canvas = {} as HTMLCanvasElement;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: WebGPU not supported
    MockWebGPUEngine.IsSupportedAsync = Promise.resolve(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports createBabylonEngine as a function', async () => {
    const mod = await import('@/lib/babylon/createEngine');
    expect(typeof mod.createBabylonEngine).toBe('function');
  });

  it('returns a BabylonEngineResult with engine + isWebGPU flag', async () => {
    const { createBabylonEngine } = await import('@/lib/babylon/createEngine');
    const result = await createBabylonEngine(canvas);
    expect(result).toHaveProperty('engine');
    expect(result).toHaveProperty('isWebGPU');
    expect(typeof result.isWebGPU).toBe('boolean');
  });

  it('falls back to WebGL Engine when WebGPU is not supported', async () => {
    MockWebGPUEngine.IsSupportedAsync = Promise.resolve(false);
    const { createBabylonEngine } = await import('@/lib/babylon/createEngine');
    const result = await createBabylonEngine(canvas, { antialias: true });
    expect(result.isWebGPU).toBe(false);
    expect(MockEngine).toHaveBeenCalledWith(canvas, true, expect.objectContaining({ antialias: true }));
  });

  it('returns WebGPU engine when supported', async () => {
    MockWebGPUEngine.IsSupportedAsync = Promise.resolve(true);
    const { createBabylonEngine } = await import('@/lib/babylon/createEngine');
    const result = await createBabylonEngine(canvas, { antialias: false });
    expect(result.isWebGPU).toBe(true);
    expect(MockWebGPUEngine.CreateAsync).toHaveBeenCalledWith(
      canvas,
      expect.objectContaining({ powerPreference: 'high-performance' })
    );
  });

  it('falls back to WebGL if WebGPUEngine.CreateAsync throws', async () => {
    MockWebGPUEngine.IsSupportedAsync = Promise.resolve(true);
    MockWebGPUEngine.CreateAsync = vi.fn().mockRejectedValue(new Error('GPU unavailable'));
    const { createBabylonEngine } = await import('@/lib/babylon/createEngine');
    const result = await createBabylonEngine(canvas);
    expect(result.isWebGPU).toBe(false);
    expect(MockEngine).toHaveBeenCalled();
    // Restore
    MockWebGPUEngine.CreateAsync = vi.fn().mockResolvedValue(mockWebGPUEngine);
  });

  it('falls back to WebGL if IsSupportedAsync rejects', async () => {
    MockWebGPUEngine.IsSupportedAsync = Promise.reject(new Error('no navigator.gpu'));
    const { createBabylonEngine } = await import('@/lib/babylon/createEngine');
    const result = await createBabylonEngine(canvas);
    expect(result.isWebGPU).toBe(false);
    // Restore
    MockWebGPUEngine.IsSupportedAsync = Promise.resolve(false);
  });

  it('uses antialias: true as default', async () => {
    const { createBabylonEngine } = await import('@/lib/babylon/createEngine');
    await createBabylonEngine(canvas);
    expect(MockEngine).toHaveBeenCalledWith(canvas, true, expect.objectContaining({ antialias: true }));
  });

  it('passes custom options to WebGL Engine', async () => {
    MockWebGPUEngine.IsSupportedAsync = Promise.resolve(false);
    const { createBabylonEngine } = await import('@/lib/babylon/createEngine');
    await createBabylonEngine(canvas, { antialias: false, preserveDrawingBuffer: true, stencil: false });
    expect(MockEngine).toHaveBeenCalledWith(
      canvas,
      false,
      expect.objectContaining({ antialias: false, preserveDrawingBuffer: true, stencil: false })
    );
  });
});

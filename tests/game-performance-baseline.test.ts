import { describe, expect, it } from 'vitest';

import {
  createPerformanceBaselineSampler,
  resolveRendererBackend,
} from '@/lib/games/performance-baseline';

describe('resolveRendererBackend', () => {
  it('prefers WebGPU for webgpu and babylon runtimes when supported', () => {
    expect(resolveRendererBackend('webgpu', true)).toBe('webgpu');
    expect(resolveRendererBackend('babylon', true)).toBe('webgpu');
  });

  it('falls back to deterministic non-WebGPU backends for other runtimes', () => {
    expect(resolveRendererBackend('webgpu', false)).toBe('webgl2');
    expect(resolveRendererBackend('babylon', false)).toBe('webgl2');
    expect(resolveRendererBackend('canvas', true)).toBe('canvas2d');
    expect(resolveRendererBackend('dom', true)).toBe('dom');
  });
});

describe('createPerformanceBaselineSampler', () => {
  it('builds a stable 60fps baseline from repeated frame deltas', () => {
    const sampler = createPerformanceBaselineSampler();

    expect(sampler.pushFrame(0)).toBeNull();
    const sample = sampler.pushFrame(16.67);

    expect(sample).not.toBeNull();
    expect(sample?.fps).toBeGreaterThanOrEqual(59);
    expect(sample?.fps).toBeLessThanOrEqual(60);
    expect(sample?.avgFrameMs).toBeGreaterThanOrEqual(16.6);
    expect(sample?.avgFrameMs).toBeLessThanOrEqual(16.7);
    expect(sample?.sampleCount).toBe(1);
  });

  it('caps history to the requested sample window', () => {
    const sampler = createPerformanceBaselineSampler(3);

    sampler.pushFrame(0);
    sampler.pushFrame(16);
    sampler.pushFrame(32);
    sampler.pushFrame(48);
    const sample = sampler.pushFrame(80);

    expect(sample?.sampleCount).toBe(3);
    expect(sample?.avgFrameMs).toBeGreaterThan(21);
    expect(sample?.avgFrameMs).toBeLessThan(22);
  });
});

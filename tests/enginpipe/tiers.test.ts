/**
 * tests/enginpipe/tiers.test.ts
 *
 * Unit tests for the generic capability → quality-tier resolver.
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TIER_CONFIG,
  detectCapabilityTier,
  getTierConfig,
  scoreCapabilities,
  tierFromScore,
} from '@/lib/enginpipe/quality/tiers';

describe('enginpipe / quality tiers', () => {
  it('exposes the four canonical tiers in DEFAULT_TIER_CONFIG', () => {
    expect(Object.keys(DEFAULT_TIER_CONFIG).sort()).toEqual([
      'high',
      'low',
      'medium',
      'ultra',
    ]);
    expect(DEFAULT_TIER_CONFIG.low.target_fps).toBe(30);
    expect(DEFAULT_TIER_CONFIG.ultra.target_fps).toBe(60);
  });

  it('scores a high-end desktop into the upper bracket', () => {
    const score = scoreCapabilities({
      navigator: { deviceMemory: 16, hardwareConcurrency: 16 },
      screen: { width: 2560, height: 1440 },
      gpuRenderer: 'NVIDIA RTX 4080',
    });
    expect(score).toBeGreaterThanOrEqual(80);
    expect(tierFromScore(score)).toBe('ultra');
  });

  it('scores a mid-range mobile into medium/high', () => {
    const tier = detectCapabilityTier({
      navigator: { deviceMemory: 4, hardwareConcurrency: 6 },
      screen: { width: 1080, height: 2400 },
      gpuRenderer: 'Adreno 730',
    });
    expect(['medium', 'high']).toContain(tier);
  });

  it('scores a low-end device into low', () => {
    const tier = detectCapabilityTier({
      navigator: { deviceMemory: 1, hardwareConcurrency: 2 },
      screen: { width: 720, height: 1280 },
      gpuRenderer: 'Mali-T720',
    });
    expect(tier).toBe('low');
  });

  it('handles missing input by falling back to defaults', () => {
    const tier = detectCapabilityTier();
    expect(['low', 'medium', 'high', 'ultra']).toContain(tier);
  });

  it('getTierConfig returns the matching configuration', () => {
    expect(getTierConfig('low').max_asset_size).toBe('480p');
    expect(getTierConfig('ultra').features).toContain('advanced_fx');
  });

  it('tierFromScore boundaries are inclusive', () => {
    expect(tierFromScore(80)).toBe('ultra');
    expect(tierFromScore(79)).toBe('high');
    expect(tierFromScore(60)).toBe('high');
    expect(tierFromScore(59)).toBe('medium');
    expect(tierFromScore(35)).toBe('medium');
    expect(tierFromScore(34)).toBe('low');
    expect(tierFromScore(0)).toBe('low');
  });
});

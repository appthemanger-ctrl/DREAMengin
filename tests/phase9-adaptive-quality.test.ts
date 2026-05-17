/**
 * tests/phase9-adaptive-quality.test.ts
 *
 * Tests for lib/webgpu/adaptiveQuality.ts — battery/framerate-aware
 * adaptive quality scaling.
 */

import { describe, expect, it } from 'vitest';
import {
  AdaptiveQualityController,
  getQualityProfile,
  resolveQualityTier,
  type DeviceSignals,
  type QualityTier,
} from '@/lib/webgpu/adaptiveQuality';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSignals(overrides?: Partial<DeviceSignals>): DeviceSignals {
  return {
    battery: null,
    memoryGB: 8,
    cores: 8,
    pressure: 0,
    ...overrides,
  };
}

// ─── resolveQualityTier ───────────────────────────────────────────────────────

describe('Adaptive Quality — resolveQualityTier', () => {
  it('returns ultra when no pressure and no battery constraint', () => {
    expect(resolveQualityTier(makeSignals())).toBe('ultra');
  });

  it('returns high at pressure 1', () => {
    expect(resolveQualityTier(makeSignals({ pressure: 1 }))).toBe('high');
  });

  it('returns medium at pressure 2', () => {
    expect(resolveQualityTier(makeSignals({ pressure: 2 }))).toBe('medium');
  });

  it('returns low at pressure 3', () => {
    expect(resolveQualityTier(makeSignals({ pressure: 3 }))).toBe('low');
  });

  it('returns low on critical battery (< 15%, not charging)', () => {
    expect(resolveQualityTier(makeSignals({
      battery: { level: 0.10, charging: false },
    }))).toBe('low');
  });

  it('returns medium on low battery (< 30%, not charging)', () => {
    expect(resolveQualityTier(makeSignals({
      battery: { level: 0.25, charging: false },
    }))).toBe('medium');
  });

  it('ignores battery level when charging', () => {
    expect(resolveQualityTier(makeSignals({
      battery: { level: 0.10, charging: true },
    }))).toBe('ultra');
  });

  it('returns medium for low memory (≤ 2 GB)', () => {
    expect(resolveQualityTier(makeSignals({ memoryGB: 2 }))).toBe('medium');
  });

  it('battery constraint takes priority over pressure', () => {
    // Battery < 15% → low, even if pressure is 0
    expect(resolveQualityTier(makeSignals({
      battery: { level: 0.05, charging: false },
      pressure: 0,
    }))).toBe('low');
  });
});

// ─── getQualityProfile ────────────────────────────────────────────────────────

describe('Adaptive Quality — getQualityProfile', () => {
  it('returns correct profiles for each tier', () => {
    const tiers: QualityTier[] = ['ultra', 'high', 'medium', 'low'];
    for (const tier of tiers) {
      const profile = getQualityProfile(tier);
      expect(profile.tier).toBe(tier);
      expect(profile.resolutionScale).toBeGreaterThan(0);
      expect(profile.resolutionScale).toBeLessThanOrEqual(1);
      expect(profile.physicsHz).toBeGreaterThan(0);
    }
  });

  it('ultra has highest quality', () => {
    const ultra = getQualityProfile('ultra');
    expect(ultra.resolutionScale).toBe(1.0);
    expect(ultra.polygonBudget).toBe(1.0);
    expect(ultra.postProcessing).toBe(true);
    expect(ultra.particles).toBe(true);
  });

  it('low has lowest quality', () => {
    const low = getQualityProfile('low');
    expect(low.resolutionScale).toBe(0.5);
    expect(low.postProcessing).toBe(false);
    expect(low.particles).toBe(false);
  });
});

// ─── AdaptiveQualityController ────────────────────────────────────────────────

describe('Adaptive Quality — AdaptiveQualityController', () => {
  it('starts at ultra tier', () => {
    const ctrl = new AdaptiveQualityController();
    expect(ctrl.getTier()).toBe('ultra');
  });

  it('downgrades immediately', () => {
    const ctrl = new AdaptiveQualityController();
    ctrl.update(makeSignals({ pressure: 3 }));
    expect(ctrl.getTier()).toBe('low');
  });

  it('does not upgrade immediately', () => {
    const ctrl = new AdaptiveQualityController({ upgradeFrames: 5 });
    // Force downgrade first
    ctrl.update(makeSignals({ pressure: 3 }));
    expect(ctrl.getTier()).toBe('low');

    // Now signal ultra — should not upgrade immediately
    ctrl.update(makeSignals({ pressure: 0 }));
    expect(ctrl.getTier()).toBe('low');
  });

  it('upgrades after sustained frames', () => {
    const ctrl = new AdaptiveQualityController({ upgradeFrames: 3 });
    ctrl.update(makeSignals({ pressure: 3 }));
    expect(ctrl.getTier()).toBe('low');

    // 3 frames at pressure 0 should trigger upgrade
    ctrl.update(makeSignals({ pressure: 0 }));
    ctrl.update(makeSignals({ pressure: 0 }));
    ctrl.update(makeSignals({ pressure: 0 }));
    expect(ctrl.getTier()).toBe('ultra');
  });

  it('resets upgrade counter on tier change', () => {
    const ctrl = new AdaptiveQualityController({ upgradeFrames: 3 });
    ctrl.update(makeSignals({ pressure: 3 }));
    expect(ctrl.getTier()).toBe('low');

    // Start upgrading
    ctrl.update(makeSignals({ pressure: 0 }));
    ctrl.update(makeSignals({ pressure: 0 }));
    // Interrupt with pressure
    ctrl.update(makeSignals({ pressure: 2 }));
    // Should not have upgraded to ultra, but downgrade is ignored since
    // medium > low. It should now be at medium actually.
    // pressure 2 = medium, which is > low, so it starts upgrade process
    expect(ctrl.getTier()).toBe('low'); // still at low, needs sustained frames
  });

  it('update returns a quality profile', () => {
    const ctrl = new AdaptiveQualityController();
    const profile = ctrl.update(makeSignals());
    expect(profile.tier).toBe('ultra');
    expect(profile.resolutionScale).toBe(1.0);
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import {
  type CalibrationProfile,
  calibrateDevice,
  getActiveProfile,
  resetCalibration,
  setActiveProfile,
} from '@/lib/dreamr/swipeCalibration';

afterEach(() => {
  resetCalibration();
});

describe('Swipe Calibration', () => {
  describe('getActiveProfile', () => {
    it('starts at factory defaults (slopeMin=0.6, slopeMax=0.85, triggerThresholdPx=55)', () => {
      const profile = getActiveProfile();
      expect(profile.slopeMin).toBeCloseTo(0.6, 5);
      expect(profile.slopeMax).toBeCloseTo(0.85, 5);
      expect(profile.triggerThresholdPx).toBe(55);
      expect(profile.calibratedAt).toBe('');
    });
  });

  describe('calibrateDevice', () => {
    it('returns the active profile unchanged when given no samples', () => {
      const before = getActiveProfile();
      const result = calibrateDevice([]);
      expect(result).toEqual(before);
    });

    it('produces a non-empty calibratedAt ISO timestamp', () => {
      const profile = calibrateDevice([
        { observedDeviationPx: 2.0, travelPx: 80, durationMs: 200 },
      ]);
      expect(profile.calibratedAt).not.toBe('');
      expect(() => new Date(profile.calibratedAt)).not.toThrow();
    });

    it('sets the profile as the active profile', () => {
      const profile = calibrateDevice([
        { observedDeviationPx: 2.0, travelPx: 80, durationMs: 200 },
      ]);
      expect(getActiveProfile()).toEqual(profile);
    });

    it('widens the slope window for a high-jitter device (devScale > 1)', () => {
      // Observed deviation 3 px >> canonical 1.5 px → devScale = 2 → wider window
      const wide = calibrateDevice([
        { observedDeviationPx: 3.0, travelPx: 100, durationMs: 200 },
      ]);
      const factoryWidth = 0.85 - 0.6; // 0.25
      const calibratedWidth = wide.slopeMax - wide.slopeMin;
      expect(calibratedWidth).toBeGreaterThan(factoryWidth);
    });

    it('narrows the slope window for a low-jitter / stylus device (devScale < 1)', () => {
      // Observed deviation 0.75 px < 1.5 px → devScale = 0.5 → narrower window
      const narrow = calibrateDevice([
        { observedDeviationPx: 0.75, travelPx: 80, durationMs: 200 },
      ]);
      const factoryWidth = 0.85 - 0.6;
      const calibratedWidth = narrow.slopeMax - narrow.slopeMin;
      expect(calibratedWidth).toBeLessThan(factoryWidth);
    });

    it('clamps triggerThresholdPx between 20 and 120 px', () => {
      // Very high deviation → devScale = 2 → raw threshold = 110 (still ≤ 120)
      const profile = calibrateDevice([
        { observedDeviationPx: 10, travelPx: 200, durationMs: 200 },
      ]);
      expect(profile.triggerThresholdPx).toBeGreaterThanOrEqual(20);
      expect(profile.triggerThresholdPx).toBeLessThanOrEqual(120);
    });

    it('averages multiple samples', () => {
      const profileMulti = calibrateDevice([
        { observedDeviationPx: 1.0, travelPx: 80, durationMs: 100 },
        { observedDeviationPx: 3.0, travelPx: 80, durationMs: 300 },
      ]);
      const profileSingle = calibrateDevice([
        { observedDeviationPx: 2.0, travelPx: 80, durationMs: 200 },
      ]);
      // Both should produce the same result (mean dev=2.0, mean dur=200)
      expect(profileMulti.slopeMin).toBeCloseTo(profileSingle.slopeMin, 5);
      expect(profileMulti.slopeMax).toBeCloseTo(profileSingle.slopeMax, 5);
    });
  });

  describe('setActiveProfile', () => {
    it('replaces the active profile with the supplied one', () => {
      const custom: CalibrationProfile = {
        slopeMin: 0.3,
        slopeMax: 1.2,
        triggerThresholdPx: 40,
        calibratedAt: '2026-01-01T00:00:00.000Z',
      };
      setActiveProfile(custom);
      expect(getActiveProfile()).toEqual(custom);
    });

    it('does not mutate the supplied object', () => {
      const custom: CalibrationProfile = {
        slopeMin: 0.3,
        slopeMax: 1.2,
        triggerThresholdPx: 40,
        calibratedAt: '2026-01-01T00:00:00.000Z',
      };
      setActiveProfile(custom);
      getActiveProfile(); // access does not modify
      expect(custom.slopeMin).toBe(0.3);
    });
  });

  describe('resetCalibration', () => {
    it('restores factory defaults after calibration', () => {
      calibrateDevice([{ observedDeviationPx: 3.0, travelPx: 100, durationMs: 200 }]);
      resetCalibration();
      const profile = getActiveProfile();
      expect(profile.slopeMin).toBeCloseTo(0.6, 5);
      expect(profile.slopeMax).toBeCloseTo(0.85, 5);
      expect(profile.triggerThresholdPx).toBe(55);
      expect(profile.calibratedAt).toBe('');
    });
  });
});

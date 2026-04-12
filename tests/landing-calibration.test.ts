/**
 * tests/landing-calibration.test.ts
 *
 * Asserts that LandingHero wires the calibrateDevice sequence so that
 * "Humanity" calibration samples are collected from the very first
 * pointer interactions a visitor makes on the landing page.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const src = readFileSync(join(root, 'components/LandingHero.tsx'), 'utf-8');

describe('landing page calibrateDevice wiring', () => {
  it('imports calibrateDevice from the swipeCalibration module', () => {
    expect(src).toContain("from '@/lib/dreamr/swipeCalibration'");
    expect(src).toContain('calibrateDevice');
  });

  it('imports CalibrationSample type', () => {
    expect(src).toContain('CalibrationSample');
  });

  it('uses useRef to hold mutable gesture state without triggering re-renders', () => {
    expect(src).toContain('useRef');
    expect(src).toContain('calibrationRef');
  });

  it('registers pointerdown listener to start gesture capture on arrival', () => {
    expect(src).toContain("addEventListener('pointerdown'");
    expect(src).toContain('onPointerDown');
  });

  it('registers pointermove listener to track gesture positions', () => {
    expect(src).toContain("addEventListener('pointermove'");
    expect(src).toContain('onPointerMove');
  });

  it('registers pointerup listener to finalise each sample', () => {
    expect(src).toContain("addEventListener('pointerup'");
    expect(src).toContain('onPointerUp');
  });

  it('collects observedDeviationPx, travelPx, and durationMs per gesture', () => {
    expect(src).toContain('observedDeviationPx');
    expect(src).toContain('travelPx');
    expect(src).toContain('durationMs');
  });

  it('calls calibrateDevice once three samples have been accumulated', () => {
    expect(src).toContain('samples.length >= 3');
    expect(src).toContain('calibrateDevice(state.samples)');
  });

  it('sets calibrated = true after firing calibrateDevice to stop further collection', () => {
    expect(src).toContain('state.calibrated = true');
  });

  it('removes all pointer listeners in the effect cleanup', () => {
    expect(src).toContain("removeEventListener('pointerdown'");
    expect(src).toContain("removeEventListener('pointermove'");
    expect(src).toContain("removeEventListener('pointerup'");
  });
});

/**
 * tests/gameengin-remote.test.ts
 *
 * Locks the GameEngin Standard Remote contract:
 *   - Layout invariants (portrait 70/30, landscape 15/70/15, R3 = L × 1.10).
 *   - HUD whitelist (lives, points, timer, streak, branding only).
 *   - Every named base / sprint / multi-touch combo from the directive.
 *   - SprintDetector double-tap+hold-and-move semantics.
 *   - ComboMachine sequence + multi-touch + sprint-variant precedence.
 */

import { describe, it, expect } from 'vitest';
import {
  PORTRAIT_LAYOUT,
  LANDSCAPE_LAYOUT,
  LEFT_JOYSTICK_RADIUS_MM,
  RIGHT_JOYSTICK_RADIUS_MM,
  RIGHT_JOYSTICK_RADIUS_RATIO,
  HUD_ALLOWED_ELEMENTS,
  isHudElementAllowed,
  layoutFor,
  radiusMmToPx,
  BASE_MOVES,
  SPRINT_MOVES,
  BASE_COMBOS,
  SPRINT_COMBOS,
  MULTITOUCH_COMBOS,
  ComboMachine,
  SprintDetector,
  DOUBLE_TAP_WINDOW_MS,
  type Combo,
  type FaceButton,
} from '@/lib/gameengin/remote';

describe('GameEngin standard remote — layout', () => {
  it('portrait splits screen 70 / 30', () => {
    expect(PORTRAIT_LAYOUT.gameView).toBe(0.70);
    expect(PORTRAIT_LAYOUT.controlArea).toBe(0.30);
    expect(PORTRAIT_LAYOUT.gameView + PORTRAIT_LAYOUT.controlArea).toBeCloseTo(1, 6);
  });

  it('landscape splits screen 15 / 70 / 15', () => {
    expect(LANDSCAPE_LAYOUT.leftBar).toBe(0.15);
    expect(LANDSCAPE_LAYOUT.gameView).toBe(0.70);
    expect(LANDSCAPE_LAYOUT.rightBar).toBe(0.15);
    expect(
      (LANDSCAPE_LAYOUT.leftBar ?? 0) + LANDSCAPE_LAYOUT.gameView + (LANDSCAPE_LAYOUT.rightBar ?? 0),
    ).toBeCloseTo(1, 6);
  });

  it('right joystick radius is 10 % larger than left', () => {
    expect(RIGHT_JOYSTICK_RADIUS_RATIO).toBeCloseTo(1.10, 6);
    expect(RIGHT_JOYSTICK_RADIUS_MM).toBeCloseTo(LEFT_JOYSTICK_RADIUS_MM * 1.10, 6);
  });

  it('left joystick radius matches DualSense throw range (12-15 mm)', () => {
    expect(LEFT_JOYSTICK_RADIUS_MM).toBeGreaterThanOrEqual(12);
    expect(LEFT_JOYSTICK_RADIUS_MM).toBeLessThanOrEqual(15);
  });

  it('mm → px conversion is correct at 160 dpi reference', () => {
    expect(radiusMmToPx(25.4, 160)).toBeCloseTo(160, 6);
  });

  it('layoutFor returns the expected allocation', () => {
    expect(layoutFor('portrait')).toBe(PORTRAIT_LAYOUT);
    expect(layoutFor('landscape')).toBe(LANDSCAPE_LAYOUT);
  });

  it('HUD whitelist is exactly: lives, points, timer, streak, branding', () => {
    expect([...HUD_ALLOWED_ELEMENTS]).toEqual(['lives', 'points', 'timer', 'streak', 'branding']);
    expect(isHudElementAllowed('lives')).toBe(true);
    expect(isHudElementAllowed('minimap')).toBe(false);
    expect(isHudElementAllowed('ammo')).toBe(false);
  });
});

describe('GameEngin standard remote — moves & combos catalogue', () => {
  it('declares all 4 base single-button moves with correct face-button bindings', () => {
    expect(BASE_MOVES.find((m) => m.button === 'X')!.name).toBe('Jump');
    expect(BASE_MOVES.find((m) => m.button === 'O')!.name).toBe('Spin');
    expect(BASE_MOVES.find((m) => m.button === 'SQUARE')!.name).toBe('Shoot Laser');
    expect(BASE_MOVES.find((m) => m.button === 'TRIANGLE')!.name).toBe('Duck / Slide');
  });

  it('declares both sprint single-button moves', () => {
    const targeting = SPRINT_MOVES.find((m) => m.name === 'Targeting Mode');
    expect(targeting?.button).toBe('SQUARE');
    expect(targeting?.hold).toBe(true);
    expect(SPRINT_MOVES.find((m) => m.name === 'Slide Attack')?.button).toBe('TRIANGLE');
  });

  it('declares every named base combo with the directive-specified sequence', () => {
    const expected: Array<{ name: string; sequence: FaceButton[] }> = [
      { name: 'Drop Kick',     sequence: ['X', 'TRIANGLE'] },
      { name: 'Upper Cut',     sequence: ['TRIANGLE', 'X'] },
      { name: 'Spinning Kick', sequence: ['O', 'X'] },
      { name: 'Sonic Spin',    sequence: ['TRIANGLE', 'O'] },
      { name: '10 Lasers',     sequence: ['X', 'O', 'SQUARE'] },
      { name: 'Spin Jump',     sequence: ['O', 'X'] },
      { name: 'Laser Spin',    sequence: ['O', 'SQUARE'] },
      { name: 'Slide Spin',    sequence: ['TRIANGLE', 'O'] },
      { name: 'Jump Laser',    sequence: ['X', 'SQUARE'] },
    ];
    for (const e of expected) {
      const c = BASE_COMBOS.find((x) => x.name === e.name) as Combo | undefined;
      expect(c, `base combo "${e.name}" missing`).toBeDefined();
      expect(c!.sequence).toEqual(e.sequence);
      expect(c!.sprint).toBe(false);
    }
  });

  it('declares every named sprint combo variant', () => {
    const expected = [
      { name: 'Sprint Drop Kick',     sequence: ['X', 'TRIANGLE'] },
      { name: 'Sprint Upper Cut',     sequence: ['TRIANGLE', 'X'] },
      { name: 'Sprint Spinning Kick', sequence: ['O', 'X'] },
      { name: 'Sprint Sonic Spin',    sequence: ['TRIANGLE', 'O'] },
      { name: 'Sprint 10 Lasers',     sequence: ['X', 'O', 'SQUARE'] },
    ];
    for (const e of expected) {
      const c = SPRINT_COMBOS.find((x) => x.name === e.name);
      expect(c, `sprint combo "${e.name}" missing`).toBeDefined();
      expect(c!.sequence).toEqual(e.sequence);
      expect(c!.sprint).toBe(true);
    }
  });

  it('declares the three multi-touch simultaneous combos', () => {
    expect(MULTITOUCH_COMBOS.find((c) => c.name === 'Jumping Spin')?.buttons).toEqual(['X', 'O']);
    expect(MULTITOUCH_COMBOS.find((c) => c.name === 'Slide Shoot')?.buttons).toEqual(['TRIANGLE', 'SQUARE']);
    expect(MULTITOUCH_COMBOS.find((c) => c.name === 'Jump Shoot')?.buttons).toEqual(['X', 'SQUARE']);
  });
});

describe('GameEngin standard remote — SprintDetector', () => {
  it('does not sprint on a single tap-and-hold-and-move', () => {
    const det = new SprintDetector();
    det.onTouchStart(0);
    det.onMove(10, 0.9);
    expect(det.isSprinting()).toBe(false);
  });

  it('sprints on double-tap + hold + move', () => {
    const det = new SprintDetector();
    det.onTouchStart(0);
    det.onTouchEnd(50);
    det.onTouchStart(100); // within window
    det.onMove(110, 0.8);
    expect(det.isSprinting()).toBe(true);
  });

  it('does not sprint when held but not moving', () => {
    const det = new SprintDetector();
    det.onTouchStart(0);
    det.onTouchEnd(50);
    det.onTouchStart(100);
    det.onMove(110, 0.05); // below threshold
    expect(det.isSprinting()).toBe(false);
  });

  it('exits sprint on release', () => {
    const det = new SprintDetector();
    det.onTouchStart(0);
    det.onTouchEnd(50);
    det.onTouchStart(100);
    det.onMove(110, 0.8);
    expect(det.isSprinting()).toBe(true);
    det.onTouchEnd(500);
    expect(det.isSprinting()).toBe(false);
  });

  it('rejects double-tap if 2nd tap is outside the window', () => {
    const det = new SprintDetector();
    det.onTouchStart(0);
    det.onTouchEnd(50);
    det.onTouchStart(50 + DOUBLE_TAP_WINDOW_MS + 100);
    det.onMove(60 + DOUBLE_TAP_WINDOW_MS + 100, 0.9);
    expect(det.isSprinting()).toBe(false);
  });
});

describe('GameEngin standard remote — ComboMachine', () => {
  it('recognises a 2-button base combo (Upper Cut: △ → X)', () => {
    const m = new ComboMachine();
    expect(m.press('TRIANGLE', 0)).toBeNull();
    const r = m.press('X', 100);
    expect(r?.kind).toBe('sequence');
    if (r?.kind === 'sequence') expect(r.combo.name).toBe('Upper Cut');
  });

  it('recognises a 3-button base combo (10 Lasers: X → O → □)', () => {
    const m = new ComboMachine();
    m.press('X', 0);
    m.press('O', 100);
    const r = m.press('SQUARE', 200);
    expect(r?.kind).toBe('sequence');
    if (r?.kind === 'sequence') expect(r.combo.name).toBe('10 Lasers');
  });

  it('prefers sprint variant when sprint is active', () => {
    let sprint = false;
    const m = new ComboMachine({ isSprinting: () => sprint });
    sprint = true;
    m.press('X', 0);
    const r = m.press('TRIANGLE', 100);
    expect(r?.kind).toBe('sequence');
    if (r?.kind === 'sequence') expect(r.combo.name).toBe('Sprint Drop Kick');
  });

  it('falls back to base variant when sprint is inactive', () => {
    const m = new ComboMachine({ isSprinting: () => false });
    m.press('X', 0);
    const r = m.press('TRIANGLE', 100);
    if (r?.kind === 'sequence') expect(r.combo.name).toBe('Drop Kick');
  });

  it('does not match if presses fall outside the combo window', () => {
    const m = new ComboMachine({ comboWindowMs: 100 });
    m.press('X', 0);
    const r = m.press('TRIANGLE', 500);
    expect(r).toBeNull();
  });

  it('detects multi-touch Jump Shoot (X + □ within multi-touch window)', () => {
    const m = new ComboMachine();
    m.press('X', 0);
    const r = m.press('SQUARE', 30);
    expect(r?.kind).toBe('multitouch');
    if (r?.kind === 'multitouch') expect(r.combo.name).toBe('Jump Shoot');
  });

  it('treats Jump Shoot multi-touch as same combo regardless of press order', () => {
    const m = new ComboMachine();
    m.press('SQUARE', 0);
    const r = m.press('X', 10);
    expect(r?.kind).toBe('multitouch');
    if (r?.kind === 'multitouch') expect(r.combo.name).toBe('Jump Shoot');
  });

  it('reset clears any pending sequence', () => {
    const m = new ComboMachine();
    m.press('X', 0);
    m.reset();
    const r = m.press('TRIANGLE', 50);
    // Without the X in buffer, △ alone is not a combo.
    expect(r).toBeNull();
  });
});

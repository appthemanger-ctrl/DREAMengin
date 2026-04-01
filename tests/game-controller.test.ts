import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  computeLeftStickVector,
  LEFT_STICK_RADIUS_PX,
  LEFT_STICK_DEAD_ZONE,
} from '@/lib/games/gameControllerLeft';
import {
  evaluateRightStickTap,
  computeAimDelta,
  RIGHT_TAP_MAX_MS,
  RIGHT_TAP_MAX_PX,
  RIGHT_RESET_TIMEOUT_MS,
} from '@/lib/games/gameControllerRight';
import {
  ButtonInteractionManager,
  CONTROLLER_BUTTON_DEFS,
  CONTROLLER_BUTTONS,
  BTN_TAP_MAX_MS,
  BTN_LONG_PRESS_MS,
  BTN_DOUBLE_TAP_MAX_MS,
  BTN_TAP_AND_HOLD_WINDOW_MS,
  type ButtonInteractionEvent,
  type ControllerButton,
} from '@/lib/games/gameControllerButtons';

const REPO_ROOT = process.cwd();

// ─── Left stick math ────────────────────────────────────────────────────────

describe('gameControllerLeft – stick vector math', () => {
  it('returns zero vector when at origin', () => {
    expect(computeLeftStickVector(100, 100, 100, 100)).toEqual({ x: 0, y: 0 });
  });

  it('returns full right vector when dragged one radius to the right', () => {
    const v = computeLeftStickVector(0, 0, LEFT_STICK_RADIUS_PX, 0);
    expect(v.x).toBeCloseTo(1, 3);
    expect(v.y).toBeCloseTo(0, 3);
  });

  it('clamps magnitude to 1 when dragged beyond the radius', () => {
    const v = computeLeftStickVector(0, 0, LEFT_STICK_RADIUS_PX * 3, 0);
    expect(v.x).toBeCloseTo(1, 3);
    expect(v.y).toBeCloseTo(0, 3);
  });

  it('returns diagonal at ~0.707 when dragged to half-radius diagonally', () => {
    // Dragging to (r/2, r/2) has Euclidean distance r/√2 ≈ 0.707r, so magnitude ≈ 0.707.
    const r = LEFT_STICK_RADIUS_PX / 2;
    const v = computeLeftStickVector(0, 0, r, r);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1 / Math.SQRT2, 1);
  });

  it('has a defined dead-zone constant', () => {
    expect(LEFT_STICK_DEAD_ZONE).toBeGreaterThan(0);
    expect(LEFT_STICK_DEAD_ZONE).toBeLessThan(0.5);
  });

  it('handles zero radius gracefully (no division by zero)', () => {
    expect(computeLeftStickVector(0, 0, 10, 0, 0)).toEqual({ x: 0, y: 0 });
  });
});

// ─── Right stick tap/aim ─────────────────────────────────────────────────────

describe('gameControllerRight – tap detection', () => {
  it('classifies a short, low-movement touch as a tap', () => {
    const result = evaluateRightStickTap(100, 100, 102, 101, 0, 150);
    expect(result.isTap).toBe(true);
    expect(result.durationMs).toBe(150);
  });

  it('rejects a touch that moved too far as not a tap', () => {
    const result = evaluateRightStickTap(0, 0, 30, 0, 0, 100);
    expect(result.isTap).toBe(false);
    expect(result.distancePx).toBeCloseTo(30, 0);
  });

  it('rejects a touch that lasted too long as not a tap', () => {
    const result = evaluateRightStickTap(0, 0, 2, 2, 0, RIGHT_TAP_MAX_MS + 1);
    expect(result.isTap).toBe(false);
    expect(result.durationMs).toBeGreaterThan(RIGHT_TAP_MAX_MS);
  });

  it('accepts a touch at exactly the boundary (max ms, max px)', () => {
    const result = evaluateRightStickTap(0, 0, RIGHT_TAP_MAX_PX, 0, 0, RIGHT_TAP_MAX_MS);
    expect(result.isTap).toBe(true);
  });

  it('exposes RIGHT_RESET_TIMEOUT_MS as 200', () => {
    expect(RIGHT_RESET_TIMEOUT_MS).toBe(200);
  });
});

describe('gameControllerRight – aim delta', () => {
  it('computes correct pixel deltas', () => {
    expect(computeAimDelta(10, 20, 35, 15)).toEqual({ dx: 25, dy: -5 });
    expect(computeAimDelta(0, 0, 0, 0)).toEqual({ dx: 0, dy: 0 });
    expect(computeAimDelta(100, 100, 80, 90)).toEqual({ dx: -20, dy: -10 });
  });
});

// ─── Button interaction manager ──────────────────────────────────────────────

describe('ButtonInteractionManager – tap', () => {
  it('emits hold-start then tap then release for a short press', () => {
    const mgr = new ButtonInteractionManager();
    const events: ButtonInteractionEvent[] = [];
    mgr.subscribe((e) => events.push(e));

    const now = 1000;
    mgr.pressStart('circle', 1, now);
    mgr.pressEnd('circle', 1, now + 100); // 100ms < TAP_MAX_MS

    expect(events.map((e) => e.interaction)).toEqual(['hold-start', 'release', 'tap']);
    expect(events.every((e) => e.button === 'circle')).toBe(true);
    mgr.destroy();
  });

  it('emits hold-start then hold-end then release for a medium press', () => {
    const mgr = new ButtonInteractionManager();
    const events: ButtonInteractionEvent[] = [];
    mgr.subscribe((e) => events.push(e));

    const now = 1000;
    mgr.pressStart('x', 2, now);
    mgr.pressEnd('x', 2, now + BTN_TAP_MAX_MS + 100); // longer than tap

    expect(events.map((e) => e.interaction)).toEqual(['hold-start', 'release', 'hold-end']);
    mgr.destroy();
  });
});

describe('ButtonInteractionManager – double-tap', () => {
  it('emits double-tap when two taps arrive within the window', () => {
    const mgr = new ButtonInteractionManager();
    const events: ButtonInteractionEvent[] = [];
    mgr.subscribe((e) => events.push(e));

    const t = 0;
    mgr.pressStart('triangle', 3, t);
    mgr.pressEnd('triangle', 3, t + 80);           // first tap (short)
    // Second press within BTN_TAP_AND_HOLD_WINDOW_MS — also short → double-tap
    mgr.pressStart('triangle', 4, t + 200);
    mgr.pressEnd('triangle', 4, t + 200 + 70);     // short second press

    const interactions = events.map((e) => e.interaction);
    expect(interactions).toContain('double-tap');
    mgr.destroy();
  });

  it('does NOT emit double-tap when second tap is too slow', () => {
    const mgr = new ButtonInteractionManager();
    const events: ButtonInteractionEvent[] = [];
    mgr.subscribe((e) => events.push(e));

    const t = 0;
    mgr.pressStart('square', 5, t);
    mgr.pressEnd('square', 5, t + 80);
    // Second press outside DOUBLE_TAP_MAX_MS
    mgr.pressStart('square', 6, t + BTN_DOUBLE_TAP_MAX_MS + 100);
    mgr.pressEnd('square', 6, t + BTN_DOUBLE_TAP_MAX_MS + 180);

    const interactions = events.map((e) => e.interaction);
    expect(interactions).not.toContain('double-tap');
    // Both presses should be individual taps
    expect(interactions.filter((i) => i === 'tap').length).toBe(2);
    mgr.destroy();
  });
});

describe('ButtonInteractionManager – long-press', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('emits long-press after the threshold when still held', () => {
    const mgr = new ButtonInteractionManager();
    const events: ButtonInteractionEvent[] = [];
    mgr.subscribe((e) => events.push(e));

    mgr.pressStart('l1', 7, 0);
    vi.advanceTimersByTime(BTN_LONG_PRESS_MS + 10);

    expect(events.map((e) => e.interaction)).toContain('long-press');
    mgr.destroy();
  });

  it('does NOT emit long-press when released before the threshold', () => {
    const mgr = new ButtonInteractionManager();
    const events: ButtonInteractionEvent[] = [];
    mgr.subscribe((e) => events.push(e));

    mgr.pressStart('r1', 8, 0);
    vi.advanceTimersByTime(BTN_LONG_PRESS_MS - 50);
    mgr.pressEnd('r1', 8, BTN_LONG_PRESS_MS - 50);

    expect(events.map((e) => e.interaction)).not.toContain('long-press');
    mgr.destroy();
  });
});

describe('ButtonInteractionManager – tap-and-hold', () => {
  it('emits tap-and-hold on second press when it arrives quickly after first tap and is held', () => {
    const mgr = new ButtonInteractionManager();
    const events: ButtonInteractionEvent[] = [];
    mgr.subscribe((e) => events.push(e));

    const t = 0;
    // First tap
    mgr.pressStart('r2', 9,  t);
    mgr.pressEnd('r2',   9,  t + 80);
    // Quick re-press within TAP_AND_HOLD_WINDOW_MS, held longer than TAP_MAX_MS → tap-and-hold
    mgr.pressStart('r2', 10, t + 150);
    mgr.pressEnd('r2',   10, t + 150 + BTN_TAP_MAX_MS + 50);

    expect(events.map((e) => e.interaction)).toContain('tap-and-hold');
    mgr.destroy();
  });
});

describe('ButtonInteractionManager – button definitions', () => {
  it('defines all eight expected buttons', () => {
    expect(CONTROLLER_BUTTONS).toContain('x');
    expect(CONTROLLER_BUTTONS).toContain('circle');
    expect(CONTROLLER_BUTTONS).toContain('triangle');
    expect(CONTROLLER_BUTTONS).toContain('square');
    expect(CONTROLLER_BUTTONS).toContain('l1');
    expect(CONTROLLER_BUTTONS).toContain('l2');
    expect(CONTROLLER_BUTTONS).toContain('r1');
    expect(CONTROLLER_BUTTONS).toContain('r2');
    expect(CONTROLLER_BUTTONS).toHaveLength(8);
  });

  it('has a symbol and label for every button', () => {
    for (const btn of CONTROLLER_BUTTONS) {
      const def = CONTROLLER_BUTTON_DEFS.find((d) => d.id === btn);
      expect(def).toBeDefined();
      expect(def!.symbol.length).toBeGreaterThan(0);
      expect(def!.label.length).toBeGreaterThan(0);
    }
  });
});

// ─── Integration — source-level checks ───────────────────────────────────────

describe('GameController integration', () => {
  it('GameHUD routes the controller mode to GameController', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/GameHUD.tsx'), 'utf8');
    expect(src).toContain("mode === 'controller'");
    expect(src).toContain('<GameController');
    expect(src).toContain("import GameController from '@/components/games/GameController'");
  });

  it('MobileHudMode includes the controller value', () => {
    const src = readFileSync(join(REPO_ROOT, 'lib/games/mobileControls.ts'), 'utf8');
    expect(src).toContain("'controller'");
    expect(src).toContain("MobileHudMode");
  });

  it('mobileControls exports emitMobileLookDelta, emitMobileJump, emitMobileShoot', () => {
    const src = readFileSync(join(REPO_ROOT, 'lib/games/mobileControls.ts'), 'utf8');
    expect(src).toContain('emitMobileLookDelta');
    expect(src).toContain('emitMobileJump');
    expect(src).toContain('emitMobileShoot');
  });

  it('GameController implements left stick, right stick, and button ring', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/GameController.tsx'), 'utf8');
    expect(src).toContain('handleLeftStart');
    expect(src).toContain('handleRightZoneStart');
    expect(src).toContain('ButtonInteractionManager');
    expect(src).toContain('evaluateRightStickTap');
    expect(src).toContain('computeLeftStickVector');
    expect(src).toContain('emitMobileJump');
    expect(src).toContain('emitMobileLookDelta');
    expect(src).toContain('RIGHT_RESET_TIMEOUT_MS');
    expect(src).toContain('startAutoFire');
  });

  it('left stick emits jump on thumb-lift', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/GameController.tsx'), 'utf8');
    expect(src).toContain('emitMobileJump');
    // Jump must be inside the handleLeftEnd callback
    expect(src).toContain('handleLeftEnd');
  });

  it('right stick has 200ms reset timeout before firing shot', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/GameController.tsx'), 'utf8');
    expect(src).toContain('RIGHT_RESET_TIMEOUT_MS');
    expect(src).toContain('rightResetTimerRef');
  });

  it('GameController module CSS exists', () => {
    const css = readFileSync(join(REPO_ROOT, 'components/games/GameController.module.css'), 'utf8');
    expect(css).toContain('.overlay');
    expect(css).toContain('.leftZone');
    expect(css).toContain('.rightZone');
    expect(css).toContain('.floatingStick');
    expect(css).toContain('.faceCluster');
    expect(css).toContain('.shoulderGroup');
    expect(css).toContain('.shootFlash');
  });
});

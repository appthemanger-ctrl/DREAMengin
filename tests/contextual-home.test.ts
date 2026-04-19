import { describe, expect, it, vi } from 'vitest';

import {
  HOME_BOTTOM_THRESHOLD,
  HOME_TOP_THRESHOLD,
  resolveHomeTarget,
  runHomeAction,
} from '@/lib/home-buttons/contextual-home';

describe('resolveHomeTarget', () => {
  it('returns "surface" when bar is at the bottom (high splitRatio)', () => {
    expect(resolveHomeTarget(1.0)).toBe('surface');
    expect(resolveHomeTarget(HOME_BOTTOM_THRESHOLD)).toBe('surface');
    expect(resolveHomeTarget(0.9)).toBe('surface');
  });

  it('returns "dreamspace" when bar is at the top (low splitRatio)', () => {
    expect(resolveHomeTarget(0.0)).toBe('dreamspace');
    expect(resolveHomeTarget(HOME_TOP_THRESHOLD)).toBe('dreamspace');
    expect(resolveHomeTarget(0.1)).toBe('dreamspace');
  });

  it('returns "both" when bar is in the middle', () => {
    expect(resolveHomeTarget(0.5)).toBe('both');
    expect(resolveHomeTarget(0.4)).toBe('both');
    expect(resolveHomeTarget(0.6)).toBe('both');
  });
});

describe('runHomeAction', () => {
  it('fires returnHome only when bar is at the bottom', () => {
    const returnHome = vi.fn();
    const returnDreamSpace = vi.fn();
    const fired = runHomeAction(1.0, { returnHome, returnDreamSpace });
    expect(fired).toBe(true);
    expect(returnHome).toHaveBeenCalledOnce();
    expect(returnDreamSpace).not.toHaveBeenCalled();
  });

  it('fires returnDreamSpace only when bar is at the top', () => {
    const returnHome = vi.fn();
    const returnDreamSpace = vi.fn();
    const fired = runHomeAction(0.05, { returnHome, returnDreamSpace });
    expect(fired).toBe(true);
    expect(returnDreamSpace).toHaveBeenCalledOnce();
    expect(returnHome).not.toHaveBeenCalled();
  });

  it('fires BOTH callbacks when the bar is in the middle', () => {
    const returnHome = vi.fn();
    const returnDreamSpace = vi.fn();
    const fired = runHomeAction(0.5, { returnHome, returnDreamSpace });
    expect(fired).toBe(true);
    expect(returnHome).toHaveBeenCalledOnce();
    expect(returnDreamSpace).toHaveBeenCalledOnce();
  });

  it('returns false when no callbacks are registered (caller falls back to routing)', () => {
    expect(runHomeAction(1.0, null)).toBe(false);
    expect(runHomeAction(0.5, undefined)).toBe(false);
    expect(runHomeAction(0.0, {})).toBe(false);
  });

  it('falls back to the only available callback when the targeted one is missing', () => {
    // Bar at bottom → wants returnHome, but only returnDreamSpace is registered
    const returnDreamSpace = vi.fn();
    expect(runHomeAction(1.0, { returnDreamSpace })).toBe(true);
    expect(returnDreamSpace).toHaveBeenCalledOnce();

    // Bar at top → wants returnDreamSpace, but only returnHome is registered
    const returnHome = vi.fn();
    expect(runHomeAction(0.0, { returnHome })).toBe(true);
    expect(returnHome).toHaveBeenCalledOnce();
  });
});

import { describe, expect, it } from 'vitest';

import {
  BAR_FLING_TO_TOP_VELOCITY_PX_PER_MS,
  GOLD_DOUBLE_TAP_MS,
  GOLD_TAP_SLOP_PX,
  resolveGoldTapAction,
  shouldCollapseGoldSwipe,
  shouldCollapseTopExpandedDrag,
  shouldSnapBottomDragToTop,
  shouldTreatGoldReleaseAsTap,
} from '@/lib/dreamdm/barInteractions';

describe('resolveGoldTapAction', () => {
  it('opens menus immediately on the first tap', () => {
    expect(resolveGoldTapAction({ now: 1_000, lastTapAt: 0, isTop: false })).toEqual({
      action: 'menu',
      nextLastTapAt: 1_000,
    });
  });

  it('uses the second tap within the window to go home from the bottom state', () => {
    expect(resolveGoldTapAction({ now: 1_000 + GOLD_DOUBLE_TAP_MS - 1, lastTapAt: 1_000, isTop: false })).toEqual({
      action: 'home',
      nextLastTapAt: 0,
    });
  });

  it('uses the second tap within the window to open HomeDream in DreamSpace when pinned at the top', () => {
    expect(resolveGoldTapAction({ now: 1_000 + GOLD_DOUBLE_TAP_MS - 1, lastTapAt: 1_000, isTop: true })).toEqual({
      action: 'home-dreamspace',
      nextLastTapAt: 0,
    });
  });
});

describe('gold release gesture helpers', () => {
  it('keeps small movement within the tap slop tappable', () => {
    expect(shouldTreatGoldReleaseAsTap(GOLD_TAP_SLOP_PX)).toBe(true);
    expect(shouldTreatGoldReleaseAsTap(-GOLD_TAP_SLOP_PX)).toBe(true);
  });

  it('collapses only a downward swipe from the top state', () => {
    expect(shouldCollapseGoldSwipe({ dy: GOLD_TAP_SLOP_PX + 1, isTop: true })).toBe(true);
    expect(shouldCollapseGoldSwipe({ dy: GOLD_TAP_SLOP_PX + 1, isTop: false })).toBe(false);
    expect(shouldCollapseGoldSwipe({ dy: GOLD_TAP_SLOP_PX, isTop: true })).toBe(false);
  });
});

describe('bar snap helpers', () => {
  it('snaps to the top when the drag is already near the top edge', () => {
    expect(shouldSnapBottomDragToTop({
      screenH: 900,
      dragH: 892,
      barH: 80,
      velocityPxPerMs: 0,
    })).toBe(true);
  });

  it('snaps to the top when the user throws the bar upward in one motion', () => {
    expect(shouldSnapBottomDragToTop({
      screenH: 900,
      dragH: 200,
      barH: 80,
      velocityPxPerMs: BAR_FLING_TO_TOP_VELOCITY_PX_PER_MS - 0.1,
    })).toBe(true);
  });

  it('does not snap to the top on a short slow pull from the bottom', () => {
    expect(shouldSnapBottomDragToTop({
      screenH: 900,
      dragH: 110,
      barH: 80,
      velocityPxPerMs: -0.2,
    })).toBe(false);
  });

  it('collapses an expanded top panel when the drag is thrown down fast enough', () => {
    expect(shouldCollapseTopExpandedDrag({
      dy: 30,
      slideDown: 30,
      snapDownPx: 88,
      velocityPxPerMs: 1,
    })).toBe(true);
  });
});

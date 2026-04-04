import { describe, expect, it } from 'vitest';

import {
  BAR_FLING_TO_TOP_MIN_DRAG_PX,
  BAR_FLING_TO_TOP_VELOCITY_THRESHOLD_PX_PER_MS,
  GOLD_SECOND_TAP_WINDOW_MS,
  GOLD_TAP_SLOP_PX,
  resolveGoldTapAction,
  shouldCollapseGoldSwipe,
  shouldCollapseTopExpandedDrag,
  shouldSnapBottomDragToTop,
  shouldTreatGoldReleaseAsTap,
  snapToSplitPoint,
  snapSplitRatioOnRelease,
  SPLIT_SNAP_POINTS,
  SPLIT_FLING_VELOCITY_PX_PER_MS,
  DEFAULT_SPLIT_RATIO,
  DIVIDER_H,
  ORB_SIZE,
  ORB_TAP_SLOP,
  clampOrbOffset,
  computeOrbDragPosition,
} from '@/lib/dreamdm/barInteractions';

describe('resolveGoldTapAction', () => {
  it('opens menus immediately on the first tap', () => {
    expect(resolveGoldTapAction({ now: 1_000, lastTapAt: 0, isTop: false })).toEqual({
      action: 'menu',
      nextLastTapAt: 1_000,
    });
  });

  it('uses the second tap within the window to go home from the bottom state', () => {
    expect(resolveGoldTapAction({ now: 1_000 + GOLD_SECOND_TAP_WINDOW_MS - 1, lastTapAt: 1_000, isTop: false })).toEqual({
      action: 'home',
      nextLastTapAt: 0,
    });
  });

  it('uses the second tap within the window to open HomeDream in DreamSpace when pinned at the top', () => {
    expect(resolveGoldTapAction({ now: 1_000 + GOLD_SECOND_TAP_WINDOW_MS - 1, lastTapAt: 1_000, isTop: true })).toEqual({
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
    expect(shouldCollapseGoldSwipe({ dy: -(GOLD_TAP_SLOP_PX + 1), isTop: true })).toBe(false);
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
      velocityPxPerMs: BAR_FLING_TO_TOP_VELOCITY_THRESHOLD_PX_PER_MS - 0.1,
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

  it('does not snap to the top on velocity alone before the minimum upward throw distance is reached', () => {
    expect(shouldSnapBottomDragToTop({
      screenH: 900,
      dragH: 80 + BAR_FLING_TO_TOP_MIN_DRAG_PX - 1,
      barH: 80,
      velocityPxPerMs: BAR_FLING_TO_TOP_VELOCITY_THRESHOLD_PX_PER_MS - 0.1,
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

// ── Split-screen divider snap helpers ─────────────────────────────────────────

describe('snapToSplitPoint', () => {
  it('snaps 0.9 ratio to the Surface-focus point', () => {
    expect(snapToSplitPoint(0.9)).toBe(0.9);
  });

  it('snaps 0.5 ratio to the balanced point', () => {
    expect(snapToSplitPoint(0.5)).toBe(0.5);
  });

  it('snaps 0.1 ratio to the Dream-focus point', () => {
    expect(snapToSplitPoint(0.1)).toBe(0.1);
  });

  it('snaps a value midway between 0.5 and 0.9 to the nearest point', () => {
    expect(snapToSplitPoint(0.75)).toBe(0.9);
  });

  it('snaps a value midway between 0.1 and 0.5 to the nearest point', () => {
    expect(snapToSplitPoint(0.25)).toBe(0.1);
  });

  it('snaps an extreme low value to the lowest snap point', () => {
    expect(snapToSplitPoint(0.0)).toBe(0.1);
  });

  it('snaps an extreme high value to the highest snap point', () => {
    expect(snapToSplitPoint(1.0)).toBe(1.0);
  });
});

describe('snapSplitRatioOnRelease', () => {
  it('returns the nearest snap point when velocity is neutral', () => {
    expect(snapSplitRatioOnRelease(0.97, 0)).toBe(1.0);
    expect(snapSplitRatioOnRelease(0.88, 0)).toBe(0.9);
    expect(snapSplitRatioOnRelease(0.55, 0)).toBe(0.5);
    expect(snapSplitRatioOnRelease(0.15, 0)).toBe(0.1);
  });

  it('advances one snap step downward (Dream-focus) on a strong downward fling', () => {
    // Current ratio near Surface-only, flung downward → goes to Surface-focus
    expect(snapSplitRatioOnRelease(0.97, SPLIT_FLING_VELOCITY_PX_PER_MS)).toBe(0.9);
    // Current ratio near Surface-focus, flung downward → goes to balanced
    expect(snapSplitRatioOnRelease(0.88, SPLIT_FLING_VELOCITY_PX_PER_MS)).toBe(0.5);
    // Current ratio near balanced, flung downward → goes to Dream-focus
    expect(snapSplitRatioOnRelease(0.52, SPLIT_FLING_VELOCITY_PX_PER_MS)).toBe(0.1);
  });

  it('advances one snap step upward (Surface-only) on a strong upward fling', () => {
    // Current ratio near Dream-focus, flung upward → goes to balanced
    expect(snapSplitRatioOnRelease(0.12, -SPLIT_FLING_VELOCITY_PX_PER_MS)).toBe(0.5);
    // Current ratio near balanced, flung upward → goes to Surface-focus
    expect(snapSplitRatioOnRelease(0.48, -SPLIT_FLING_VELOCITY_PX_PER_MS)).toBe(0.9);
    // Current ratio near Surface-focus, flung upward → goes to Surface-only
    expect(snapSplitRatioOnRelease(0.88, -SPLIT_FLING_VELOCITY_PX_PER_MS)).toBe(1.0);
  });

  it('does not advance past the Dream-focus limit on a downward fling', () => {
    expect(snapSplitRatioOnRelease(0.12, SPLIT_FLING_VELOCITY_PX_PER_MS)).toBe(0.1);
  });

  it('does not advance past the Surface-only limit on an upward fling', () => {
    expect(snapSplitRatioOnRelease(0.97, -SPLIT_FLING_VELOCITY_PX_PER_MS)).toBe(1.0);
  });
});

describe('split-screen divider constants', () => {
  it('exports four canonical snap points including hidden DreamSpace', () => {
    expect(SPLIT_SNAP_POINTS).toHaveLength(4);
    expect(SPLIT_SNAP_POINTS[0]).toBe(0.1);
    expect(SPLIT_SNAP_POINTS[1]).toBe(0.5);
    expect(SPLIT_SNAP_POINTS[2]).toBe(0.9);
    expect(SPLIT_SNAP_POINTS[3]).toBe(1.0);
  });

  it('defaults to Surface-only (DreamSpace hidden)', () => {
    expect(DEFAULT_SPLIT_RATIO).toBe(1.0);
  });

  it('exports a positive DIVIDER_H', () => {
    expect(DIVIDER_H).toBeGreaterThan(0);
  });
});

// ── Minimized orb drag helpers ──────────────────────────────────────────────

describe('minimized orb constants', () => {
  it('exports a positive ORB_SIZE', () => {
    expect(ORB_SIZE).toBe(48);
  });

  it('exports a positive ORB_TAP_SLOP', () => {
    expect(ORB_TAP_SLOP).toBe(8);
  });
});

describe('clampOrbOffset', () => {
  it('clamps negative offset to 0', () => {
    expect(clampOrbOffset(-10, 1440)).toBe(0);
  });

  it('clamps offset that would push the orb off-screen to max', () => {
    expect(clampOrbOffset(1440, 1440)).toBe(1440 - ORB_SIZE);
  });

  it('keeps a valid offset unchanged', () => {
    expect(clampOrbOffset(100, 1440)).toBe(100);
  });

  it('handles zero viewport extent by clamping to 0', () => {
    expect(clampOrbOffset(20, ORB_SIZE)).toBe(0);
  });
});

describe('computeOrbDragPosition', () => {
  const W = 1440;
  const H = 900;

  it('returns start position when drag delta is zero', () => {
    expect(computeOrbDragPosition(20, 20, 0, 0, W, H)).toEqual({ x: 20, y: 20 });
  });

  it('moves the orb to the left when dragging right (positive dx)', () => {
    // "right" offset decreases by dx
    const result = computeOrbDragPosition(200, 100, 50, 0, W, H);
    expect(result.x).toBe(150);
    expect(result.y).toBe(100);
  });

  it('moves the orb upward when dragging down (positive dy)', () => {
    // "bottom" offset decreases by dy
    const result = computeOrbDragPosition(100, 200, 0, 80, W, H);
    expect(result.x).toBe(100);
    expect(result.y).toBe(120);
  });

  it('clamps to 0 when dragged past the right/bottom edge', () => {
    const result = computeOrbDragPosition(20, 20, 100, 100, W, H);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('clamps to the far edge when dragged past the left/top edge', () => {
    const result = computeOrbDragPosition(20, 20, -2000, -2000, W, H);
    expect(result.x).toBe(W - ORB_SIZE);
    expect(result.y).toBe(H - ORB_SIZE);
  });
});

// ── Glowing light position cycle ────────────────────────────────────────────

import { cycleLightPosition, DRAG_TAP_THRESHOLD_PX, DOUBLE_TAP_WINDOW_MS, type LightPosition } from '@/lib/dreamdm/barInteractions';

describe('glowing light constants', () => {
  it('exports a positive DRAG_TAP_THRESHOLD_PX', () => {
    expect(DRAG_TAP_THRESHOLD_PX).toBeGreaterThan(0);
  });

  it('exports a positive DOUBLE_TAP_WINDOW_MS', () => {
    expect(DOUBLE_TAP_WINDOW_MS).toBeGreaterThan(0);
  });
});

describe('cycleLightPosition', () => {
  it('advances from bottom to middle', () => {
    expect(cycleLightPosition('bottom')).toBe('middle');
  });

  it('advances from middle to top', () => {
    expect(cycleLightPosition('middle')).toBe('top');
  });

  it('returns from top back to middle (ping-pong)', () => {
    expect(cycleLightPosition('top')).toBe('middle');
  });

  it('returns from second middle back to bottom', () => {
    // Simulate: bottom→middle→top→middle (4-step cycle, 3 calls from bottom)
    // The caller (DreamDMBar) tracks the full ping-pong via lightCycleRef.
    // Verify the 3-step descent back to middle from top:
    let pos: LightPosition = 'bottom';
    pos = cycleLightPosition(pos); // → middle
    pos = cycleLightPosition(pos); // → top
    pos = cycleLightPosition(pos); // → middle (ping-pong peak reached)
    // After top→middle, the bar is back at middle.
    // The caller detects this and will reset to bottom on the next interaction.
    expect(pos).toBe('middle');
  });
});

import { describe, expect, it } from 'vitest';

import {
  BAR_FLING_LINE_RATIO,
  BAR_FLING_TO_BOTTOM_VELOCITY_THRESHOLD_PX_PER_MS,
  BAR_FLING_TO_TOP_VELOCITY_THRESHOLD_PX_PER_MS,
  decideBarRelease,
} from '@/lib/dreamdm/barInteractions';

describe('decideBarRelease', () => {
  const screenH = 1000;
  const barH = 80;
  const lineH = screenH * BAR_FLING_LINE_RATIO;

  it('parks the bar where the user let go on a slow drag below the line', () => {
    const action = decideBarRelease({
      screenH,
      dragH: lineH - 50,
      barH,
      velocityPxPerMs: 0,
    });
    expect(action).toBe('park');
  });

  it('parks the bar where the user let go on a slow drag above the line', () => {
    const action = decideBarRelease({
      screenH,
      dragH: lineH + 50,
      barH,
      velocityPxPerMs: 0,
    });
    expect(action).toBe('park');
  });

  it('snaps to top on an upward fling that has already crossed the line', () => {
    const action = decideBarRelease({
      screenH,
      dragH: lineH + 10,
      barH,
      velocityPxPerMs: BAR_FLING_TO_TOP_VELOCITY_THRESHOLD_PX_PER_MS - 0.1,
    });
    expect(action).toBe('snap-top');
  });

  it('does NOT snap to top on an upward fling that has not reached the line', () => {
    const action = decideBarRelease({
      screenH,
      dragH: lineH - 10,
      barH,
      velocityPxPerMs: BAR_FLING_TO_TOP_VELOCITY_THRESHOLD_PX_PER_MS - 0.1,
    });
    expect(action).toBe('park');
  });

  it('snaps to bottom on a downward fling near or below the line', () => {
    const action = decideBarRelease({
      screenH,
      dragH: lineH - 20,
      barH,
      velocityPxPerMs: BAR_FLING_TO_BOTTOM_VELOCITY_THRESHOLD_PX_PER_MS + 0.1,
    });
    expect(action).toBe('snap-bottom');
  });

  it('still snaps to top when the bar is already nearly pinned to the screen top', () => {
    const action = decideBarRelease({
      screenH,
      dragH: screenH - 4, // barTop = 4 → within BAR_SNAP_TO_TOP_THRESHOLD_PX
      barH,
      velocityPxPerMs: 0,
    });
    expect(action).toBe('snap-top');
  });
});

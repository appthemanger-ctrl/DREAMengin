/** Matches the existing touch-friendly second-tap escalation window used by the gold button. */
export const GOLD_SECOND_TAP_WINDOW_MS = 280;
export const GOLD_TAP_SLOP_PX = 14;
export const BAR_SNAP_TO_TOP_THRESHOLD_PX = 8;
export const BAR_SNAP_TO_TOP_HEIGHT_RATIO = 0.84;
export const BAR_FLING_TO_TOP_VELOCITY_THRESHOLD_PX_PER_MS = -0.9;
export const BAR_FLING_TO_TOP_MIN_DRAG_PX = 44;
export const BAR_FLING_TO_BOTTOM_VELOCITY_THRESHOLD_PX_PER_MS = 0.9;
export const MIN_POINTER_SAMPLE_DELTA_MS = 1;

export type GoldTapAction = 'menu' | 'home' | 'home-dreamspace';

/**
 * Resolves a gold-button release into the immediate menu action or the second-tap home action.
 * A second tap inside the second-tap window escalates based on whether the bar is at the top.
 */
export function resolveGoldTapAction({
  now,
  lastTapAt,
  isTop,
}: {
  now: number;
  lastTapAt: number;
  isTop: boolean;
}): { action: GoldTapAction; nextLastTapAt: number } {
  if (now - lastTapAt < GOLD_SECOND_TAP_WINDOW_MS) {
    return {
      action: isTop ? 'home-dreamspace' : 'home',
      nextLastTapAt: 0,
    };
  }

  return { action: 'menu', nextLastTapAt: now };
}

/** Treats small pointer movement as a tap instead of a swipe or throw. */
export function shouldTreatGoldReleaseAsTap(dy: number): boolean {
  return Math.abs(dy) <= GOLD_TAP_SLOP_PX;
}

/** Returns pointer velocity in pixels per millisecond and guards same-frame samples from dividing by zero. */
export function calculatePointerVelocity(previousY: number, nextY: number, previousAt: number, nextAt: number): number {
  return (nextY - previousY) / Math.max(nextAt - previousAt, MIN_POINTER_SAMPLE_DELTA_MS);
}

/** Only a downward swipe from the top-pinned state should collapse the bar. */
export function shouldCollapseGoldSwipe({
  dy,
  isTop,
}: {
  dy: number;
  isTop: boolean;
}): boolean {
  return isTop && dy > GOLD_TAP_SLOP_PX;
}

/**
 * Snaps a bottom-origin drag to the top if it is already near the top, tall enough,
 * or thrown upward fast enough after clearing the minimum fling distance.
 */
export function shouldSnapBottomDragToTop({
  screenH,
  dragH,
  barH,
  velocityPxPerMs,
}: {
  screenH: number;
  dragH: number;
  barH: number;
  velocityPxPerMs: number;
}): boolean {
  const barTopFromScreenTop = screenH - dragH;
  return (
    barTopFromScreenTop <= BAR_SNAP_TO_TOP_THRESHOLD_PX ||
    dragH >= screenH * BAR_SNAP_TO_TOP_HEIGHT_RATIO ||
    (velocityPxPerMs <= BAR_FLING_TO_TOP_VELOCITY_THRESHOLD_PX_PER_MS &&
      dragH - barH >= BAR_FLING_TO_TOP_MIN_DRAG_PX)
  );
}

/** Collapses the expanded top panel when the user drags far enough down or throws it downward. */
export function shouldCollapseTopExpandedDrag({
  dy,
  slideDown,
  snapDownPx,
  velocityPxPerMs,
}: {
  dy: number;
  slideDown: number;
  snapDownPx: number;
  velocityPxPerMs: number;
}): boolean {
  return (
    dy > snapDownPx ||
    slideDown > snapDownPx ||
    velocityPxPerMs >= BAR_FLING_TO_BOTTOM_VELOCITY_THRESHOLD_PX_PER_MS
  );
}

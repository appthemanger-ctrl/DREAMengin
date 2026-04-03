// ── Split-screen divider constants ────────────────────────────────────────────
/** Fixed height (px) of the DreamDM Bar when it operates as a true split-screen divider. */
export const DIVIDER_H = 80;
/** Canonical snap points for the split-screen divider: [Dream-focus, Balanced, Surface-focus, Surface-only] */
export const SPLIT_SNAP_POINTS = [0.1, 0.5, 0.9, 1.0] as const;
/** Default split ratio — Surface Space fully dominant (DreamSpace hidden). Swipe bar up to reveal. */
export const DEFAULT_SPLIT_RATIO = 1.0;
/** Min/max reachable ratio during a drag (prevents collapsing Surface to zero; allows full DreamSpace hide). */
export const SPLIT_RATIO_MIN = 0.05;
export const SPLIT_RATIO_MAX = 1.0;
/** Fling velocity (px/ms) needed to jump one whole snap step toward the throw direction. */
export const SPLIT_FLING_VELOCITY_PX_PER_MS = 0.55;

/**
 * Returns the nearest canonical snap point for the given split ratio.
 */
export function snapToSplitPoint(ratio: number): number {
  let best: number = SPLIT_SNAP_POINTS[0];
  let bestDist = Math.abs(ratio - best);
  for (const pt of SPLIT_SNAP_POINTS) {
    const d = Math.abs(ratio - pt);
    if (d < bestDist) { bestDist = d; best = pt; }
  }
  return best;
}

/**
 * Resolves the final snap point after a drag release.
 *
 * If the fling velocity is strong enough upward (negative) or downward (positive),
 * the snap steps one increment past the nearest point in that direction, giving a
 * momentum-style feel consistent with the gold-button swipe gesture.
 */
export function snapSplitRatioOnRelease(ratio: number, velocityPxPerMs: number): number {
  const nearest = snapToSplitPoint(ratio);
  const idx = (SPLIT_SNAP_POINTS as readonly number[]).indexOf(nearest);
  if (velocityPxPerMs >= SPLIT_FLING_VELOCITY_PX_PER_MS && idx > 0) {
    // fling downward → lower split ratio (more Dream Space)
    return SPLIT_SNAP_POINTS[idx - 1];
  }
  if (velocityPxPerMs <= -SPLIT_FLING_VELOCITY_PX_PER_MS && idx < SPLIT_SNAP_POINTS.length - 1) {
    // fling upward → higher split ratio (more Surface Space)
    return SPLIT_SNAP_POINTS[idx + 1];
  }
  return nearest;
}

// ── Gold-button / bar snap constants (legacy bar-window behaviour) ─────────────
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

// ── Minimized orb position helpers ───────────────────────────────────────────
/** Size of the minimized gold orb (px). */
export const ORB_SIZE = 48;
/** Tap slop for the minimized orb — movement below this threshold is treated as a tap. */
export const ORB_TAP_SLOP = 8;

/**
 * Clamps a minimized-orb CSS offset (right/bottom) so the orb stays fully
 * on-screen. `viewportExtent` is the viewport dimension (width for x, height for y).
 */
export function clampOrbOffset(offset: number, viewportExtent: number): number {
  return Math.max(0, Math.min(viewportExtent - ORB_SIZE, offset));
}

/**
 * Returns the new right/bottom offsets after a pointer drag of (dx, dy) pixels.
 * Positive dx = pointer moved right → "right" offset decreases.
 * Positive dy = pointer moved down  → "bottom" offset decreases.
 */
export function computeOrbDragPosition(
  startRight: number,
  startBottom: number,
  dx: number,
  dy: number,
  screenW: number,
  screenH: number,
): { x: number; y: number } {
  return {
    x: clampOrbOffset(startRight - dx, screenW),
    y: clampOrbOffset(startBottom - dy, screenH),
  };
}

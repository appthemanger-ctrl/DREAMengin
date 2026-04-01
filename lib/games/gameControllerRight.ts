// Pure logic for the floating right stick (aim + shoot).
// No React imports — usable in any context.

/** Maximum touch duration (ms) for a press to be classified as a tap. */
export const RIGHT_TAP_MAX_MS = 250;

/** Maximum drag distance (px) for a press to still be classified as a tap. */
export const RIGHT_TAP_MAX_PX = 12;

/**
 * After the right thumb lifts, wait this many milliseconds before cancelling
 * any pending shot.  Allows quick repositioning without firing.
 */
export const RIGHT_RESET_TIMEOUT_MS = 200;

/** Delay (ms) before auto-fire begins when tap-and-hold is detected. */
export const AUTO_FIRE_DELAY_MS = 300;

/** Interval (ms) between auto-fire shots. */
export const AUTO_FIRE_INTERVAL_MS = 80;

export interface TapResult {
  isTap: boolean;
  durationMs: number;
  distancePx: number;
}

/**
 * Determine whether a completed right-stick touch gesture was a tap.
 * Returns a `TapResult` so the caller can decide what to do with the data.
 */
export function evaluateRightStickTap(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  startMs: number,
  endMs: number,
): TapResult {
  const distancePx = Math.hypot(endX - startX, endY - startY);
  const durationMs = endMs - startMs;
  return {
    isTap: distancePx <= RIGHT_TAP_MAX_PX && durationMs <= RIGHT_TAP_MAX_MS,
    durationMs,
    distancePx,
  };
}

/**
 * Compute the raw pixel delta from previous to current touch position.
 * The caller is responsible for scaling this to a meaningful turn speed.
 */
export function computeAimDelta(
  prevX: number,
  prevY: number,
  nextX: number,
  nextY: number,
): { dx: number; dy: number } {
  return { dx: nextX - prevX, dy: nextY - prevY };
}

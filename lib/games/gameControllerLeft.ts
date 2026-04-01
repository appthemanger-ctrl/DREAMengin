// Pure math helpers for the floating left stick (movement + jump).
// No React imports — usable in any context.

/** Radius of the stick dead zone in pixels. */
export const LEFT_STICK_RADIUS_PX = 72;

/** Below this normalised magnitude the stick is treated as centred. */
export const LEFT_STICK_DEAD_ZONE = 0.12;

export interface StickVector {
  x: number;
  y: number;
}

/**
 * Compute a normalised (−1…1, −1…1) stick vector from an origin to the
 * current touch position.  Movement is clamped to `radiusPx` before
 * normalising so full-speed is reached when the thumb reaches the edge of
 * the stick shell.
 */
export function computeLeftStickVector(
  originX: number,
  originY: number,
  currentX: number,
  currentY: number,
  radiusPx = LEFT_STICK_RADIUS_PX,
): StickVector {
  const dx = currentX - originX;
  const dy = currentY - originY;
  const dist = Math.hypot(dx, dy);
  if (!dist || !radiusPx) return { x: 0, y: 0 };
  const scale = Math.min(dist, radiusPx) / radiusPx;
  return {
    x: Number(((dx / dist) * scale).toFixed(4)),
    y: Number(((dy / dist) * scale).toFixed(4)),
  };
}

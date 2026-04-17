/**
 * lib/renderer/FrustumCuller.ts
 *
 * AXIS-ALIGNED 2-D FRUSTUM CULLER
 *
 * Fast AABB-vs-viewport overlap test used by Canvas2DRenderer to skip draw
 * calls for entities that lie entirely outside the current viewport.
 *
 * Zero allocations per call — all maths is inline arithmetic.
 *
 * Usage:
 *   const culler = new FrustumCuller();
 *   if (culler.isVisible(entityX, entityY, entityW, entityH, viewport)) {
 *     ctx.fillRect(entityX, entityY, entityW, entityH);
 *   }
 */

// ─── Rect ─────────────────────────────────────────────────────────────────────

/** An axis-aligned rectangle in logical (pixel) space. */
export interface Rect {
  /** Left edge. */
  x: number;
  /** Top edge. */
  y: number;
  /** Width. */
  w: number;
  /** Height. */
  h: number;
}

// ─── FrustumCuller ────────────────────────────────────────────────────────────

/**
 * Axis-aligned 2-D frustum (viewport) culler.
 *
 * `isVisible` returns `true` when the entity's axis-aligned bounding box
 * overlaps with the viewport rectangle.  Entities fully outside the viewport
 * can be skipped entirely, saving Canvas 2D fill/stroke calls.
 *
 * Coordinates are in the same logical-pixel space as the canvas draw calls.
 *
 * @example
 * const culler = new FrustumCuller();
 * const vp: Rect = { x: 0, y: 0, w: 900, h: 600 };
 * if (culler.isVisible(unit.px - 20, unit.py - 20, 40, 40, vp)) {
 *   drawUnit(ctx, unit);
 * }
 */
export class FrustumCuller {
  /**
   * Returns `true` when the given AABB intersects the viewport.
   *
   * Uses separating-axis theorem: two AABBs are non-overlapping when there
   * is a separating axis — i.e., one box is entirely to the left, right,
   * above or below the other.
   *
   * @param x        - entity AABB left edge
   * @param y        - entity AABB top edge
   * @param w        - entity AABB width  (must be ≥ 0)
   * @param h        - entity AABB height (must be ≥ 0)
   * @param viewport - current visible rect
   */
  isVisible(x: number, y: number, w: number, h: number, viewport: Rect): boolean {
    // Early-out: entity entirely left / right / above / below viewport
    if (x + w < viewport.x) return false;
    if (x     > viewport.x + viewport.w) return false;
    if (y + h < viewport.y) return false;
    if (y     > viewport.y + viewport.h) return false;
    return true;
  }
}

import type { Action } from './delta';

type Options = {
  /**
   * If provided, vertical swipes will only emit when this returns true.
   * (Used to avoid stealing vertical scroll inside scrollable surfaces.)
   */
  canEmitVertical?: () => boolean;
};

/**
 * Input mapping:
 * - 1-finger swipe => swipe_left/right/up/down
 *
 * Depth gestures (depth_in/depth_out) are handled separately (pinch / wheel)
 * by the surface, to avoid double-firing when users pinch with two touches.
 */
export function createGestureArbiter(emit: (a: Action) => void, opts: Options = {}) {
  const SWIPE_TH = 70;

  let startX = 0;
  let startY = 0;
  const pointers = new Map<number, PointerEvent>();

  const onPointerDown = (e: PointerEvent) => {
    pointers.set(e.pointerId, e);
    if (pointers.size === 1) {
      startX = e.clientX;
      startY = e.clientY;
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, e);
  };

  const onPointerUp = (e: PointerEvent) => {
    const was = pointers.size;
    pointers.delete(e.pointerId);

    // Only one-finger swipes are interpreted here.
    if (was !== 1) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    if (ax < SWIPE_TH && ay < SWIPE_TH) return;

    if (ax > ay) {
      emit(dx < 0 ? 'swipe_left' : 'swipe_right');
      return;
    }

    // Vertical swipe gating
    if (opts.canEmitVertical && !opts.canEmitVertical()) return;
    emit(dy < 0 ? 'swipe_up' : 'swipe_down');
  };

  const onPointerCancel = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}

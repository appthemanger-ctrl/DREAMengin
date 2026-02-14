import type { Dir } from './delta';

/**
 * Input mapping:
 * - 1-finger swipe => U/D/L/R
 *
 * Depth gestures (IN/OUT) are handled separately (pinch / wheel) by the surface,
 * to avoid double-firing when users pinch with two touches.
 */
export function create6DirGestureArbiter(emit: (d: Dir) => void) {
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
    if (ax > ay) emit(dx < 0 ? 'L' : 'R');
    else emit(dy < 0 ? 'U' : 'D');
  };

  const onPointerCancel = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}

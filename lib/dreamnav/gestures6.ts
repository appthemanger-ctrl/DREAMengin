import type { Dir } from './delta';

/**
 * 6-direction input mapping:
 * - 1-finger swipe => U/D/L/R
 * - 2-finger swipe up/down => IN/OUT
 *   (two-finger up = IN, two-finger down = OUT)
 */
export function create6DirGestureArbiter(emit: (d: Dir) => void) {
  const SWIPE_TH = 70;
  const DEPTH_TH = 60;
  const TAP_MOVE = 10;

  let startX = 0;
  let startY = 0;
  let pointers = new Map<number, PointerEvent>();

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

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    // Two-finger swipe => depth directions
    if (was === 2) {
      if (ay >= DEPTH_TH && ay > ax) emit(dy < 0 ? 'IN' : 'OUT');
      return;
    }

    // One-finger swipe => cardinal directions
    if (was === 1) {
      if (ax < SWIPE_TH && ay < SWIPE_TH) return;
      if (ax > ay) emit(dx < 0 ? 'L' : 'R');
      else emit(dy < 0 ? 'U' : 'D');
    }
  };

  const onPointerCancel = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}

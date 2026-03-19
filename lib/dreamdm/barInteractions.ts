export const GOLD_DOUBLE_TAP_MS = 280;
export const GOLD_TAP_SLOP_PX = 14;
export const BAR_FLING_TO_TOP_VELOCITY_PX_PER_MS = -0.9;
export const BAR_FLING_TO_TOP_MIN_DRAG_PX = 44;
export const BAR_FLING_TO_BOTTOM_VELOCITY_PX_PER_MS = 0.9;

export type GoldTapAction = 'menu' | 'home' | 'home-dreamspace';

export function resolveGoldTapAction({
  now,
  lastTapAt,
  isTop,
}: {
  now: number;
  lastTapAt: number;
  isTop: boolean;
}): { action: GoldTapAction; nextLastTapAt: number } {
  if (now - lastTapAt < GOLD_DOUBLE_TAP_MS) {
    return {
      action: isTop ? 'home-dreamspace' : 'home',
      nextLastTapAt: 0,
    };
  }

  return { action: 'menu', nextLastTapAt: now };
}

export function shouldTreatGoldReleaseAsTap(dy: number): boolean {
  return Math.abs(dy) <= GOLD_TAP_SLOP_PX;
}

export function shouldCollapseGoldSwipe({
  dy,
  isTop,
}: {
  dy: number;
  isTop: boolean;
}): boolean {
  return isTop && dy > GOLD_TAP_SLOP_PX;
}

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
    barTopFromScreenTop <= 8 ||
    dragH >= screenH * 0.84 ||
    (velocityPxPerMs <= BAR_FLING_TO_TOP_VELOCITY_PX_PER_MS &&
      dragH - barH >= BAR_FLING_TO_TOP_MIN_DRAG_PX)
  );
}

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
    velocityPxPerMs >= BAR_FLING_TO_BOTTOM_VELOCITY_PX_PER_MS
  );
}

// Re-export the shared responsive scale system so callers can pull both the
// legacy compact-runtime helpers and the new adaptable/dynamic/scalable
// utilities from a single well-known module.
export * from './responsive';

export const COMPACT_RUNTIME_VIEWPORT_MAX_WIDTH = 768;

export function isCompactRuntimeViewport(width: number): boolean {
  return width < COMPACT_RUNTIME_VIEWPORT_MAX_WIDTH;
}

export function getPreferredViewportHeight(
  innerHeight: number,
  visualViewportHeight?: number | null,
): number {
  if (
    typeof visualViewportHeight !== 'number' ||
    !Number.isFinite(visualViewportHeight) ||
    visualViewportHeight <= 0
  ) {
    return innerHeight;
  }

  return Math.max(0, Math.min(innerHeight, visualViewportHeight));
}

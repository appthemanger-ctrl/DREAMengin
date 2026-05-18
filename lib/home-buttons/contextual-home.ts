/**
 * Contextual Home resolver.
 *
 * Decides what "Home" means based on the DreamDM Bar's current vertical
 * position (splitRatio). The DreamDM Bar IS home: depending on which runtime
 * dominates, pressing Home should reset that runtime, or both runtimes when
 * the bar is in the middle.
 *
 * splitRatio convention (see DreamSystemContext):
 *   1.0 = Surface Space fills viewport (bar at bottom)  → top dominant
 *   0.5 = balanced split                                 → bar is home
 *   0.0 = DreamSpace fills viewport (bar at top)        → bottom dominant
 *
 * Mapping (per the DreamDM Bar spec):
 *   bar near bottom  (splitRatio >= 0.66) → return Surface (top runtime) only
 *   bar near top     (splitRatio <= 0.34) → return DreamSpace (bottom runtime) only
 *   bar in middle    (0.34 < splitRatio < 0.66) → return both runtimes
 */

export const HOME_BOTTOM_THRESHOLD = 0.66;
export const HOME_TOP_THRESHOLD    = 0.34;

export type HomeTarget = 'surface' | 'dreamspace' | 'both';

/** Pure function — what does Home mean at this splitRatio? */
export function resolveHomeTarget(splitRatio: number): HomeTarget {
  if (splitRatio >= HOME_BOTTOM_THRESHOLD) return 'surface';
  if (splitRatio <= HOME_TOP_THRESHOLD)    return 'dreamspace';
  return 'both';
}

export interface RuntimeHomeCallbacks {
  /** Reset the top (Surface) runtime to HomeDream. */
  returnHome?:       () => void;
  /** Reset the bottom (DreamSpace) runtime to its home view. */
  returnDreamSpace?: () => void;
}

/**
 * Run the contextual Home action.
 *
 * @returns true if at least one callback fired; false if no callback was available
 *          (the caller can then fall back to route-based navigation).
 */
export function runHomeAction(
  splitRatio: number,
  callbacks: RuntimeHomeCallbacks | null | undefined,
): boolean {
  if (!callbacks) return false;
  const target = resolveHomeTarget(splitRatio);

  let fired = false;
  if (target === 'surface' || target === 'both') {
    if (callbacks.returnHome) { callbacks.returnHome(); fired = true; }
  }
  if (target === 'dreamspace' || target === 'both') {
    if (callbacks.returnDreamSpace) { callbacks.returnDreamSpace(); fired = true; }
  }
  // If the targeted callback is missing, fall back to the other one if available
  // (graceful degradation when only one runtime is registered).
  if (!fired) {
    if (callbacks.returnHome)       { callbacks.returnHome();       fired = true; }
    else if (callbacks.returnDreamSpace) { callbacks.returnDreamSpace(); fired = true; }
  }
  return fired;
}
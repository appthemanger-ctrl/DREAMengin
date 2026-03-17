/**
 * Pure state machine for the Home Button system.
 *
 * Per ARCHITECTURE.md §6.1 (authoritative):
 *
 *  ONE gold button on the right rail. No locked/nav mode distinction.
 *
 *    • single tap  → open-both-menus (Daydreams on left + System on right, simultaneously)
 *    • double tap  → go-home         (reset anchor, close all overlays)
 *    • drag        → reposition vertically along right rail
 *    • position    → persists in localStorage key `dreamengin:controls:v4`
 *
 *  Two-button layout (back + daydream-action) is only visible on Daydream Side B.
 */

export type TapKind = 'single' | 'double';

export type HomeButtonAction =
  | { type: 'go-home' }
  | { type: 'open-both-menus' };

/** Resolve what action a tap produces. Mode-free — button behavior is constant. */
export function resolveHomeTap(tap: TapKind): HomeButtonAction {
  if (tap === 'single') return { type: 'open-both-menus' };
  return { type: 'go-home' };
}

/**
 * Menu state.
 * When both menus are open they display side-by-side (dreams=left, system=right).
 */
export type MenuState = { dreamsOpen: boolean; systemOpen: boolean };

/** Open both menus simultaneously. */
export function openBothMenus(): MenuState {
  return { dreamsOpen: true, systemOpen: true };
}

export function closeAllMenus(): MenuState {
  return { dreamsOpen: false, systemOpen: false };
}

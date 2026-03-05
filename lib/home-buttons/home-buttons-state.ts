/**
 * Pure state machine for the Home Button system.
 *
 * Per SPEC.md §3.1 (v2.1 — authoritative):
 *
 *  ONE gold System button on the right rail.
 *
 *  LOCKED MODE (button snapped to center, subtle gold ring):
 *    • single tap  → open-dreams-menu
 *    • double tap  → enter-nav-mode  (unlock, button snaps to saved corner)
 *
 *  NAV MODE (button on right rail):
 *    • single tap  → go-home        (reset anchor)
 *    • double tap  → open-system-menu
 */

export type Mode = 'locked' | 'nav';
export type TapKind = 'single' | 'double';

export type HomeButtonAction =
  | { type: 'go-home' }
  | { type: 'enter-nav-mode' }
  | { type: 'exit-nav-mode' }
  | { type: 'open-dreams-menu' }
  | { type: 'open-system-menu' };

/** Resolve what action a tap produces given the current mode. */
export function resolveHomeTap(
  mode: Mode,
  tap: TapKind,
): HomeButtonAction {
  if (mode === 'locked') {
    if (tap === 'single') return { type: 'open-dreams-menu' };
    return { type: 'enter-nav-mode' };
  }
  // NAV MODE
  if (tap === 'single') return { type: 'go-home' };
  return { type: 'open-system-menu' };
}

/** Apply an action to the mode, returning the new mode. */
export function applyAction(mode: Mode, action: HomeButtonAction): Mode {
  if (action.type === 'enter-nav-mode') return 'nav';
  if (action.type === 'exit-nav-mode') return 'locked';
  return mode;
}

/**
 * Menu state.
 */
export type MenuState = { dreamsOpen: boolean; systemOpen: boolean };

/** Open one menu exclusively. */
export function openMenu(
  _current: MenuState,
  menu: 'dreams' | 'system',
): MenuState {
  return {
    dreamsOpen: menu === 'dreams',
    systemOpen: menu === 'system',
  };
}

export function closeAllMenus(): MenuState {
  return { dreamsOpen: false, systemOpen: false };
}

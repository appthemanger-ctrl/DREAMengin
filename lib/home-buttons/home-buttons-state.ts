/**
 * Pure state machine for the Home Buttons system.
 *
 * Two modes:
 *  - LOCKED HOME MODE (default): shows single unified Home control.
 *    • single tap  → go-home
 *    • double tap  → enter-nav-mode
 *  - NAV MODE (unlocked): shows two separate Menu Buttons.
 *    • single tap System   → open-system-menu
 *    • single tap Daydreams → open-daydreams-menu
 *    • double tap either   → exit-nav-mode
 */

export type Mode = 'locked' | 'nav';
export type ButtonId = 'dreams' | 'system';
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
  button: ButtonId,
): HomeButtonAction {
  if (mode === 'locked') {
    if (tap === 'single') return { type: 'go-home' };
    return { type: 'enter-nav-mode' };
  }
  // NAV MODE
  if (tap === 'double') return { type: 'exit-nav-mode' };
  if (button === 'dreams') return { type: 'open-dreams-menu' };
  return { type: 'open-system-menu' };
}

/** Apply an action to the mode, returning the new mode. */
export function applyAction(mode: Mode, action: HomeButtonAction): Mode {
  if (action.type === 'enter-nav-mode') return 'nav';
  if (action.type === 'exit-nav-mode') return 'locked';
  return mode;
}

/**
 * Menu exclusivity: opening one menu closes the other.
 * Returns the new menu open state.
 */
export type MenuState = { dreamsOpen: boolean; systemOpen: boolean };

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

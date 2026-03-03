/**
 * Pure state machine for the Home Buttons system.
 *
 * Per SPEC.md §3.1 (v2.0 — authoritative):
 *
 *  LOCKED MODE (buttons snapped to center, cross-color rings):
 *    • single tap  → open-both-menus (Daydreams + System side-by-side)
 *    • double tap  → enter-nav-mode  (unlock, buttons snap to saved corners)
 *
 *  NAV MODE (buttons on rails):
 *    • single tap        → go-home   (reset anchor)
 *    • double tap dreams → open-dreams-menu
 *    • double tap system → open-system-menu
 *
 *  Buttons also auto-lock when dragged within SNAP_DISTANCE of each other
 *  (magnetic snap handled in DreamNavControls).
 */

export type Mode = 'locked' | 'nav';
export type ButtonId = 'dreams' | 'system';
export type TapKind = 'single' | 'double';

export type HomeButtonAction =
  | { type: 'go-home' }
  | { type: 'enter-nav-mode' }
  | { type: 'exit-nav-mode' }
  | { type: 'open-both-menus' }
  | { type: 'open-dreams-menu' }
  | { type: 'open-system-menu' };

/** Resolve what action a tap produces given the current mode. */
export function resolveHomeTap(
  mode: Mode,
  tap: TapKind,
  button: ButtonId,
): HomeButtonAction {
  if (mode === 'locked') {
    if (tap === 'single') return { type: 'open-both-menus' };
    return { type: 'enter-nav-mode' };
  }
  // NAV MODE
  if (tap === 'single') return { type: 'go-home' };
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
 * Menu state.
 * Both can be open simultaneously (locked single-tap per SPEC §3.1).
 */
export type MenuState = { dreamsOpen: boolean; systemOpen: boolean };

/** Open one menu exclusively (unlocked mode). */
export function openMenu(
  _current: MenuState,
  menu: 'dreams' | 'system',
): MenuState {
  return {
    dreamsOpen: menu === 'dreams',
    systemOpen: menu === 'system',
  };
}

/** Open both menus simultaneously (locked single-tap per SPEC §3.1). */
export function openBothMenus(): MenuState {
  return { dreamsOpen: true, systemOpen: true };
}

export function closeAllMenus(): MenuState {
  return { dreamsOpen: false, systemOpen: false };
}

/**
 * Game Home Button — in-game overlay of the shell's ⌂ home button.
 *
 * While a game is in play/pause mode the shell hides its real home link
 * and renders a GameHomeButton in the same spot. Tapping that button:
 *   • single tap → pause-game
 *   • double tap → open-game-menu  (which contains the exit route)
 */
export type GameHomeButtonAction = 'pause-game' | 'open-game-menu';

export function resolveGameHomeTap(tap: TapKind): GameHomeButtonAction {
  return tap === 'double' ? 'open-game-menu' : 'pause-game';
}

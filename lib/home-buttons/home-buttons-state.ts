/**
 * Pure state machine for the Home Button system.
 *
 * Per SPEC.md §3.1 (v3.0 — single button):
 *
 *  One floating button — the DREAMengin home control.
 *    • single tap  → go-home   (reset anchor / return to home)
 *    • double tap  → open-menu (opens the combined Daydreams + System menu)
 */

export type Mode = 'default';
export type TapKind = 'single' | 'double';

export type HomeButtonAction =
  | { type: 'go-home' }
  | { type: 'open-menu' };

/** Resolve what action a tap produces. */
export function resolveHomeTap(
  tap: TapKind,
): HomeButtonAction {
  if (tap === 'single') return { type: 'go-home' };
  return { type: 'open-menu' };
}

/** Menu state for the single combined menu. */
export type MenuState = { open: boolean };

/** Open the combined menu. */
export function openMenu(): MenuState {
  return { open: true };
}

export function closeMenu(): MenuState {
  return { open: false };
}

// ---------------------------------------------------------------------------
// Legacy aliases — kept for backward compatibility with existing tests/code
// that still imports the two-button API names.
// ---------------------------------------------------------------------------

/** @deprecated Use resolveHomeTap(tap) — ButtonId is no longer used. */
export type ButtonId = 'dreams' | 'system';

/** @deprecated Two-button mode is removed. Use resolveHomeTap(tap). */
export function resolveHomeTapLegacy(
  _mode: 'locked' | 'nav',
  tap: TapKind,
  _button: ButtonId,
): HomeButtonAction {
  return resolveHomeTap(tap);
}

/** @deprecated No longer needed — mode is always 'default'. */
export function applyAction(_mode: unknown, _action: HomeButtonAction): 'default' {
  return 'default';
}

/** @deprecated Use openMenu(). */
export function openBothMenus(): MenuState {
  return { open: true };
}

/** @deprecated Use closeMenu(). */
export function closeAllMenus(): MenuState {
  return { open: false };
}

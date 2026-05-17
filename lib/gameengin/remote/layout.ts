/**
 * lib/gameengin/remote/layout.ts
 *
 * GameEngin Standard Remote — locked layout & joystick specs.
 *
 * These values are the **canonical contract** for every cartridge's mobile
 * remote. Any HUD implementation (`MobileGameHUD`, custom remotes, dispense
 * remotes, etc.) MUST satisfy them so players build a single muscle memory
 * across the entire library.
 *
 * Source: directive "GAMEENGIN STANDARD REMOTE — LAYOUT & ARC LENGTH".
 */

/** Screen-orientation modes the remote supports. */
export type RemoteOrientation = 'portrait' | 'landscape';

/** Allocation in fractions of a unit (sums to 1.0 within an orientation). */
export interface RemoteAllocation {
  /** Game view fraction. */
  gameView: number;
  /** Control area fraction (portrait) or { left, right } bar fractions (landscape). */
  controlArea: number;
  /** Landscape-only: left bar fraction. */
  leftBar?: number;
  /** Landscape-only: right bar fraction. */
  rightBar?: number;
}

export const PORTRAIT_LAYOUT: RemoteAllocation = Object.freeze({
  gameView: 0.70,
  controlArea: 0.30,
});

export const LANDSCAPE_LAYOUT: RemoteAllocation = Object.freeze({
  gameView: 0.70,
  leftBar: 0.15,
  rightBar: 0.15,
  controlArea: 0.30, // leftBar + rightBar
});

/**
 * DualSense physical thumb-stick travel maps to ~12-15 mm on-screen.
 * We pick the midpoint (13.5 mm) as the canonical value; HUDs that need to
 * scale to device DPI can read this constant and convert.
 */
export const LEFT_JOYSTICK_RADIUS_MM = 13.5;

/** Right joystick (R3) is 10 % larger than left joystick. */
export const RIGHT_JOYSTICK_RADIUS_RATIO = 1.10;
export const RIGHT_JOYSTICK_RADIUS_MM = LEFT_JOYSTICK_RADIUS_MM * RIGHT_JOYSTICK_RADIUS_RATIO;

/**
 * Convert millimetres to CSS pixels for a given device DPI (default 160 dpi
 * which is the CSS reference). Any HUD that knows the real device DPI should
 * pass it in to get an accurate on-screen radius.
 */
export function radiusMmToPx(mm: number, dpi = 160: number {
  return (mm / 25.4) * dpi;
}

/**
 * The ONLY HUD elements the GameEngin standard remote permits, per the
 * directive: "Keep only: lives, points, timer, streak, and branding. Remove
 * all else." This is the allow-list a HUD spec test can assert against.
 */
export const HUD_ALLOWED_ELEMENTS = Object.freeze([
  'lives',
  'points',
  'timer',
  'streak',
  'branding',
] as const);

export type HudAllowedElement = (typeof HUD_ALLOWED_ELEMENTS)[number];

export function isHudElementAllowed(element: string: element is HudAllowedElement {
  return (HUD_ALLOWED_ELEMENTS as readonly string[]).includes(element);
}

/** Convenience accessor — returns the allocation for a given orientation. */
export function layoutFor(orientation: RemoteOrientation: RemoteAllocation {
  return orientation === 'portrait' ? PORTRAIT_LAYOUT : LANDSCAPE_LAYOUT;
}

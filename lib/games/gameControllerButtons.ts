// Button interaction state machine for the DREAMengin Game Controller.
// Handles tap, hold, double-tap, long-press, tap-and-hold, and release
// for all eight controller buttons.

export type ControllerButton =
  | 'x'
  | 'circle'
  | 'triangle'
  | 'square'
  | 'l1'
  | 'l2'
  | 'r1'
  | 'r2';

export type ButtonInteraction =
  | 'tap'
  | 'hold-start'
  | 'hold-end'
  | 'double-tap'
  | 'long-press'
  | 'tap-and-hold'
  | 'release';

/** Short press must be shorter than this to be classified as a tap. */
export const BTN_TAP_MAX_MS = 250;

/** Threshold for classifying a press as a long-press. */
export const BTN_LONG_PRESS_MS = 600;

/** Two taps within this window = double-tap. */
export const BTN_DOUBLE_TAP_MAX_MS = 400;

/** A tap followed by a press within this window = tap-and-hold. */
export const BTN_TAP_AND_HOLD_WINDOW_MS = 300;

export const CONTROLLER_BUTTONS: readonly ControllerButton[] = [
  'x',
  'circle',
  'triangle',
  'square',
  'l1',
  'l2',
  'r1',
  'r2',
] as const;

export interface ControllerButtonDef {
  id: ControllerButton;
  symbol: string;
  label: string;
}

export const CONTROLLER_BUTTON_DEFS: readonly ControllerButtonDef[] = [
  { id: 'triangle', symbol: '△', label: 'Triangle' },
  { id: 'square',   symbol: '□', label: 'Square'   },
  { id: 'circle',   symbol: '○', label: 'Circle'   },
  { id: 'x',        symbol: '×', label: 'Cross'    },
  { id: 'l1',       symbol: 'L1', label: 'L1'      },
  { id: 'l2',       symbol: 'L2', label: 'L2'      },
  { id: 'r1',       symbol: 'R1', label: 'R1'      },
  { id: 'r2',       symbol: 'R2', label: 'R2'      },
] as const;

export interface ButtonInteractionEvent {
  button: ControllerButton;
  interaction: ButtonInteraction;
}

function emitWindowEvent(button: ControllerButton, interaction: ButtonInteraction) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ButtonInteractionEvent>('de-ctrl-button', {
      detail: { button, interaction },
    }),
  );
}

interface ButtonState {
  touchId: number | null;
  pressStart: number;
  lastTapAt: number;
  longPressTimer: ReturnType<typeof setTimeout> | null;
  longPressDidFire: boolean;
  isTapAndHoldCandidate: boolean;
}

function freshState(): ButtonState {
  return {
    touchId: null,
    pressStart: 0,
    lastTapAt: 0,
    longPressTimer: null,
    longPressDidFire: false,
    isTapAndHoldCandidate: false,
  };
}

/**
 * Manages touch-gesture state for all eight controller buttons simultaneously.
 *
 * Usage:
 *   const mgr = new ButtonInteractionManager();
 *   mgr.subscribe(({ button, interaction }) => { ... });
 *   // On touchstart for a button:
 *   mgr.pressStart('circle', touch.identifier);
 *   // On touchend for a button:
 *   mgr.pressEnd('circle', touch.identifier);
 *   // Clean up timers when unmounting:
 *   mgr.destroy();
 */
export class ButtonInteractionManager {
  private readonly states = new Map<ControllerButton, ButtonState>();
  private readonly listeners = new Set<(e: ButtonInteractionEvent) => void>();

  constructor() {
    for (const btn of CONTROLLER_BUTTONS) {
      this.states.set(btn, freshState());
    }
  }

  /** Register a listener; returns an unsubscribe function. */
  subscribe(fn: (e: ButtonInteractionEvent) => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private fire(button: ControllerButton, interaction: ButtonInteraction) {
    emitWindowEvent(button, interaction);
    this.listeners.forEach((fn) => fn({ button, interaction }));
  }

  /**
   * Call when a touch begins on a button.
   * `now` defaults to `Date.now()` and is exposed for testing.
   */
  pressStart(button: ControllerButton, touchId: number, now = Date.now()) {
    const s = this.states.get(button);
    if (!s || s.touchId !== null) return;
    s.touchId = touchId;
    s.pressStart = now;
    s.longPressDidFire = false;

    // Check for tap-and-hold candidate: a re-press that arrives quickly after a prior tap.
    // We don't fire 'tap-and-hold' yet — we wait to see if the second press is held or short.
    const sinceLastTap = now - s.lastTapAt;
    s.isTapAndHoldCandidate =
      s.lastTapAt > 0 && sinceLastTap <= BTN_TAP_AND_HOLD_WINDOW_MS;
    if (s.isTapAndHoldCandidate) {
      s.lastTapAt = 0;
    }

    this.fire(button, 'hold-start');

    // Schedule long-press detection.
    s.longPressTimer = setTimeout(() => {
      if (s.touchId === touchId) {
        s.longPressDidFire = true;
        this.fire(button, 'long-press');
      }
    }, BTN_LONG_PRESS_MS);
  }

  /**
   * Call when a touch ends on a button.
   * `now` defaults to `Date.now()` and is exposed for testing.
   */
  pressEnd(button: ControllerButton, touchId: number, now = Date.now()) {
    const s = this.states.get(button);
    if (!s || s.touchId !== touchId) return;

    if (s.longPressTimer !== null) {
      clearTimeout(s.longPressTimer);
      s.longPressTimer = null;
    }

    const duration = now - s.pressStart;
    const prevTapAt = s.lastTapAt;
    s.touchId = null;

    // Always fire release.
    this.fire(button, 'release');

    if (s.longPressDidFire) {
      s.lastTapAt = 0;
      this.fire(button, 'hold-end');
      return;
    }

    if (s.isTapAndHoldCandidate) {
      // Second press after a tap: short → double-tap, held → tap-and-hold.
      if (duration <= BTN_TAP_MAX_MS) {
        this.fire(button, 'double-tap');
      } else {
        this.fire(button, 'tap-and-hold');
      }
      return;
    }

    if (duration <= BTN_TAP_MAX_MS) {
      // Short press — check for double-tap (wider window, no overlap with tap-and-hold here).
      const sinceLastTap = now - prevTapAt;
      if (prevTapAt > 0 && sinceLastTap <= BTN_DOUBLE_TAP_MAX_MS) {
        s.lastTapAt = 0;
        this.fire(button, 'double-tap');
      } else {
        s.lastTapAt = now;
        this.fire(button, 'tap');
      }
    } else {
      // Medium-length hold.
      s.lastTapAt = 0;
      this.fire(button, 'hold-end');
    }
  }

  /** Release all active touches — call on unmount or focus loss. */
  destroy() {
    for (const s of this.states.values()) {
      if (s.longPressTimer !== null) {
        clearTimeout(s.longPressTimer);
        s.longPressTimer = null;
      }
      s.touchId = null;
    }
  }
}

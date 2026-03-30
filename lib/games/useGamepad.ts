'use client';

/**
 * lib/games/useGamepad.ts
 *
 * HTML5 Gamepad API hook for DREAMengin.
 *
 * Bridges the browser Gamepad API (works on PS5's hidden browser, Chrome,
 * Firefox, Safari) into the existing `de-game-input` CustomEvent protocol
 * so every game that already listens for remote / touch events gets
 * DualSense / Xbox / generic gamepad input for free.
 *
 * DualSense standard button layout (matches W3C Gamepad mapping):
 *   0  Cross (×)      → jump
 *   1  Circle (○)     → shoot
 *   2  Square (□)     → spin
 *   3  Triangle (△)   → duck
 *   4  L1             → jump-spin
 *   5  R1             → r1 (dash)
 *   6  L2             → l2
 *   7  R2             → jump-shoot
 *   8  Share / Create → (ignored)
 *   9  Options        → pause
 *   10 L3             → l3
 *   11 R3             → r3
 *   12 D-Pad Up       → jump
 *   13 D-Pad Down     → duck
 *   14 D-Pad Left     → move-left
 *   15 D-Pad Right    → move-right
 *
 * Left analog stick (axes 0, 1):
 *   axis 0 < -DEAD   → move-left
 *   axis 0 > +DEAD   → move-right
 *   axis 1 < -DEAD   → move-up   (i.e. jump)
 *
 * DualSense-specific features (March 2026):
 *   - Haptic feedback: Works on Android Chrome, desktop browsers
 *   - Bluetooth pairing: Android 12+, iOS 14.5+
 *   - Mobile support: Auto-detected via vendor ID (054c) or name
 *
 * Usage:
 *   const { connected, gamepadName, isDualSense, rumble } = useGamepad();
 *   // Trigger haptic feedback:
 *   rumble(0.5, 100); // 50% intensity, 100ms duration
 *
 * When `connected` is true the hook is actively polling and firing
 * `de-game-input` events on `window` — any game listening for those events
 * will respond immediately.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

/** Subset of GameInputAction that this hook can emit. */
type GameAction =
  | 'move-left' | 'move-right' | 'move-up' | 'move-down'
  | 'move-stop'
  | 'jump' | 'duck' | 'spin' | 'shoot'
  | 'jump-spin' | 'jump-shoot' | 'l2' | 'r1' | 'l3' | 'r3'
  | 'pause';

export interface GamepadStatus {
  /** Whether at least one gamepad is currently connected. */
  connected: boolean;
  /** Human-readable name of the first connected gamepad (e.g. "DualSense"). */
  gamepadName: string;
  /** Whether the connected gamepad is a DualSense controller. */
  isDualSense: boolean;
  /** Rumble/haptic feedback function (intensity: 0-1, duration in ms). */
  rumble: (intensity: number, duration?: number) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Analog stick dead-zone — inputs below this are ignored. */
const DEAD = 0.25;

/**
 * Standard Gamepad API button → game action mapping.
 * Indices matching the W3C "standard" gamepad layout (DualSense / Xbox).
 * `null` means the button is captured but has no mapped action.
 */
const BUTTON_MAP: (GameAction | null)[] = [
  'jump',       // 0  Cross / A
  'shoot',      // 1  Circle / B
  'spin',       // 2  Square / X
  'duck',       // 3  Triangle / Y
  'jump-spin',  // 4  L1 / LB
  'r1',         // 5  R1 / RB
  'l2',         // 6  L2 / LT
  'jump-shoot', // 7  R2 / RT
  null,         // 8  Share / Back
  'pause',      // 9  Options / Start
  'l3',         // 10 L3
  'r3',         // 11 R3
  'jump',       // 12 D-Pad Up
  'duck',       // 13 D-Pad Down
  'move-left',  // 14 D-Pad Left
  'move-right', // 15 D-Pad Right
];

// ── Fire helper ───────────────────────────────────────────────────────────────

function fire(action: GameAction, active: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('de-game-input', { detail: { action, active } }));
}

// ── DualSense detection helper ───────────────────────────────────────────────

function checkIsDualSense(gamepadId: string): boolean {
  const id = gamepadId.toLowerCase();
  return (
    id.includes('dualsense') ||
    id.includes('054c') || // Sony vendor ID
    id.includes('wireless controller') ||
    id.includes('ps5')
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGamepad(): GamepadStatus {
  const [status, setStatus] = useState<GamepadStatus>({
    connected: false,
    gamepadName: '',
    isDualSense: false,
    rumble: () => {}, // no-op until connected
  });

  /**
   * Previous button-pressed state: `buttonState[i]` is true when button i
   * was pressed in the last poll frame.  Initialised lazily on first connect.
   */
  const buttonState = useRef<boolean[]>([]);

  /** Previous axis directions for the left stick. */
  const axisState = useRef({ left: false, right: false, up: false });

  /** rAF handle so we can cancel the poll loop on cleanup. */
  const rafRef = useRef<number | null>(null);

  /** Whether the poll loop is running. */
  const polling = useRef(false);

  /** Current gamepad index for haptic feedback. */
  const gamepadIndexRef = useRef(-1);

  // ── Rumble/Haptic feedback function ──────────────────────────────────────

  const rumble = useCallback((intensity: number, duration: number = 100) => {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[gamepadIndexRef.current];

    if (!gamepad) return;

    // Haptic Actuator API (supported on Android Chrome, desktop browsers)
    const actuators = (gamepad as any).hapticActuators || (gamepad as any).vibrationActuator;
    if (actuators && actuators.length > 0) {
      const clampedIntensity = Math.max(0, Math.min(1, intensity));
      actuators[0].pulse(clampedIntensity, duration / 1000);
      return;
    }

    // Fallback to Vibration API (works on some mobile devices)
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }, []);

  // ── Connect / disconnect listeners ───────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ── Poll (defined inside effect so rAF self-reference is stable) ────────
    function poll() {
      if (typeof navigator === 'undefined') return;

      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let gp: Gamepad | null = null;
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) { gp = gamepads[i]; break; }
      }

      if (!gp) {
        polling.current = false;
        return;
      }

      // ── Buttons ──────────────────────────────────────────────────────────
      for (let i = 0; i < gp.buttons.length; i++) {
        const pressed = gp.buttons[i].pressed || gp.buttons[i].value > 0.5;
        const was     = buttonState.current[i] ?? false;
        if (pressed !== was) {
          buttonState.current[i] = pressed;
          const action = BUTTON_MAP[i] ?? null;
          if (action) fire(action, pressed);
        }
      }

      // ── Left analog stick ────────────────────────────────────────────────
      const ax = gp.axes[0] ?? 0; // X
      const ay = gp.axes[1] ?? 0; // Y

      const nowLeft  = ax < -DEAD;
      const nowRight = ax >  DEAD;
      const nowUp    = ay < -DEAD;

      const prev = axisState.current;

      if (nowLeft !== prev.left) {
        fire('move-left', nowLeft);
        if (!nowLeft && !nowRight) fire('move-stop', false);
      }
      if (nowRight !== prev.right) {
        fire('move-right', nowRight);
        if (!nowLeft && !nowRight) fire('move-stop', false);
      }
      if (nowUp !== prev.up) {
        fire('jump', nowUp);
      }

      axisState.current = { left: nowLeft, right: nowRight, up: nowUp };

      // ── Schedule next frame ─────────────────────────────────────────────
      rafRef.current = requestAnimationFrame(poll);
    }

    // ── Start / stop helpers ─────────────────────────────────────────────
    function startPolling() {
      if (polling.current) return;
      polling.current = true;
      rafRef.current  = requestAnimationFrame(poll);
    }

    function stopPolling() {
      polling.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // Release any stuck buttons / axes when disconnecting
      buttonState.current.forEach((was, i) => {
        if (was) {
          buttonState.current[i] = false;
          const action = BUTTON_MAP[i] ?? null;
          if (action) fire(action, false);
        }
      });
      const prev = axisState.current;
      if (prev.left)  fire('move-left',  false);
      if (prev.right) fire('move-right', false);
      if (prev.up)    fire('jump',       false);
      fire('move-stop', false);
      axisState.current = { left: false, right: false, up: false };
      buttonState.current = [];
    }

    const onConnect = (e: GamepadEvent) => {
      gamepadIndexRef.current = e.gamepad.index;
      const isDualSense = checkIsDualSense(e.gamepad.id);
      setStatus({
        connected: true,
        gamepadName: e.gamepad.id,
        isDualSense,
        rumble,
      });
      startPolling();
    };

    const onDisconnect = () => {
      stopPolling();
      gamepadIndexRef.current = -1;
      // Check if any other gamepads remain
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const remaining = Array.from(navigator.getGamepads()).filter(Boolean);
        if (remaining.length > 0 && remaining[0]) {
          gamepadIndexRef.current = remaining[0]!.index;
          const isDualSense = checkIsDualSense(remaining[0]!.id);
          setStatus({
            connected: true,
            gamepadName: remaining[0]!.id,
            isDualSense,
            rumble,
          });
          startPolling();
          return;
        }
      }
      setStatus({
        connected: false,
        gamepadName: '',
        isDualSense: false,
        rumble: () => {}, // no-op when disconnected
      });
    };

    window.addEventListener('gamepadconnected',    onConnect    as EventListener);
    window.addEventListener('gamepaddisconnected', onDisconnect as EventListener);

    // Resume polling if a gamepad is already connected (page reload / remount)
    if (navigator.getGamepads) {
      const initial = Array.from(navigator.getGamepads()).filter(Boolean);
      if (initial.length > 0 && initial[0]) {
        gamepadIndexRef.current = initial[0]!.index;
        const isDualSense = checkIsDualSense(initial[0]!.id);
        setStatus({
          connected: true,
          gamepadName: initial[0]!.id,
          isDualSense,
          rumble,
        });
        startPolling();
      }
    }

    return () => {
      window.removeEventListener('gamepadconnected',    onConnect    as EventListener);
      window.removeEventListener('gamepaddisconnected', onDisconnect as EventListener);
      stopPolling();
    };
  }, []); // empty deps — all mutable state is in refs

  return status;
}

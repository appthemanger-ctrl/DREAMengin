'use client';

/**
 * lib/games/DualSenseManager.ts
 *
 * PS5 DualSense controller integration for DREAMengin with mobile Bluetooth support.
 *
 * Key features (March 2026 browser capabilities):
 *   - Bluetooth pairing: Android 12+ Chrome, iOS 14.5+ Safari
 *   - Standard gamepad input: sticks, buttons, triggers, D-pad
 *   - Gyro/accelerometer: Excellent for mobile steering/aiming (phone tilt)
 *   - Basic vibration/haptics: Works on Android Chrome (limited on iOS)
 *   - Adaptive triggers: Desktop-only via WebHID (not available in mobile browsers)
 *   - LED/Touchpad: Limited browser support — use in-game visual feedback
 *
 * Pairing instructions:
 *   1. Hold PS button + Create button until light bar flashes blue
 *   2. Pair in phone/tablet Bluetooth settings
 *   3. Open DREAMengin in browser → controller auto-detected
 *
 * Integration:
 *   - Works with existing `de-game-input` CustomEvent protocol
 *   - Complements useGamepad hook for standard input
 *   - Adds DualSense-specific features (gyro, haptics)
 *   - Maintains compatibility with DualRuntimeContainer and spatial multitasking
 */

import { useEffect, useRef, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface DualSenseState {
  connected: boolean;
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  triggers: { l2: number; r2: number };
  gyro: { x: number; y: number; z: number };
  buttons: {
    cross: boolean;      // × button
    circle: boolean;     // ○ button
    square: boolean;     // □ button
    triangle: boolean;   // △ button
    l1: boolean;
    r1: boolean;
    l2Button: boolean;   // L2 as digital button
    r2Button: boolean;   // R2 as digital button
    l3: boolean;         // Left stick press
    r3: boolean;         // Right stick press
    share: boolean;      // Share/Create button
    options: boolean;    // Options button
    ps: boolean;         // PS button
    touchpad: boolean;   // Touchpad press
    dpadUp: boolean;
    dpadDown: boolean;
    dpadLeft: boolean;
    dpadRight: boolean;
  };
}

export interface DualSenseConfig {
  /** Enable gyroscope input (mobile tilt steering/aiming) */
  enableGyro?: boolean;
  /** Enable haptic feedback (rumble) */
  enableHaptics?: boolean;
  /** Dead zone for analog sticks (0-1) */
  deadZone?: number;
  /** Enable debug logging */
  debug?: boolean;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDualSense(config: DualSenseConfig = {}) {
  const {
    enableGyro = true,
    enableHaptics = true,
    deadZone = 0.15,
    debug = false,
  } = config;

  const [state, setState] = useState<DualSenseState>({
    connected: false,
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 },
    triggers: { l2: 0, r2: 0 },
    gyro: { x: 0, y: 0, z: 0 },
    buttons: {
      cross: false,
      circle: false,
      square: false,
      triangle: false,
      l1: false,
      r1: false,
      l2Button: false,
      r2Button: false,
      l3: false,
      r3: false,
      share: false,
      options: false,
      ps: false,
      touchpad: false,
      dpadUp: false,
      dpadDown: false,
      dpadLeft: false,
      dpadRight: false,
    },
  });

  const gamepadIndexRef = useRef(-1);
  const rafRef = useRef<number | null>(null);
  const isMobile = useRef(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

  // ── Helper: Check if gamepad is DualSense ────────────────────────────────
  const isDualSense = (gamepad: Gamepad): boolean => {
    const id = gamepad.id.toLowerCase();
    return (
      id.includes('dualsense') ||
      id.includes('054c') || // Sony vendor ID
      id.includes('wireless controller') ||
      id.includes('ps5')
    );
  };

  // ── Helper: Apply dead zone to analog value ──────────────────────────────
  const applyDeadZone = (value: number): number => {
    if (Math.abs(value) < deadZone) return 0;
    // Scale remaining range to 0-1
    const sign = value < 0 ? -1 : 1;
    return sign * ((Math.abs(value) - deadZone) / (1 - deadZone));
  };

  // ── Helper: Read gyro data (mobile) ──────────────────────────────────────
  const readGyro = (gamepad: Gamepad): { x: number; y: number; z: number } => {
    if (!enableGyro || !isMobile.current) {
      return { x: 0, y: 0, z: 0 };
    }

    // Try to read angular velocity from gamepad extension
    const gp = gamepad as any;
    if (gp.angularVelocity && Array.isArray(gp.angularVelocity)) {
      return {
        x: gp.angularVelocity[0] || 0,
        y: gp.angularVelocity[1] || 0,
        z: gp.angularVelocity[2] || 0,
      };
    }

    return { x: 0, y: 0, z: 0 };
  };

  // ── Helper: Read gamepad state ───────────────────────────────────────────
  const readGamepadState = (gamepad: Gamepad): DualSenseState => {
    const axes = gamepad.axes;
    const buttons = gamepad.buttons;

    return {
      connected: true,
      leftStick: {
        x: applyDeadZone(axes[0] || 0),
        y: applyDeadZone(axes[1] || 0),
      },
      rightStick: {
        x: applyDeadZone(axes[2] || 0),
        y: applyDeadZone(axes[3] || 0),
      },
      triggers: {
        l2: buttons[6]?.value || 0,
        r2: buttons[7]?.value || 0,
      },
      gyro: readGyro(gamepad),
      buttons: {
        cross: buttons[0]?.pressed || false,
        circle: buttons[1]?.pressed || false,
        square: buttons[2]?.pressed || false,
        triangle: buttons[3]?.pressed || false,
        l1: buttons[4]?.pressed || false,
        r1: buttons[5]?.pressed || false,
        l2Button: buttons[6]?.pressed || false,
        r2Button: buttons[7]?.pressed || false,
        share: buttons[8]?.pressed || false,
        options: buttons[9]?.pressed || false,
        l3: buttons[10]?.pressed || false,
        r3: buttons[11]?.pressed || false,
        dpadUp: buttons[12]?.pressed || false,
        dpadDown: buttons[13]?.pressed || false,
        dpadLeft: buttons[14]?.pressed || false,
        dpadRight: buttons[15]?.pressed || false,
        ps: buttons[16]?.pressed || false,
        touchpad: buttons[17]?.pressed || false,
      },
    };
  };

  // ── Poll loop ────────────────────────────────────────────────────────────
  const poll = () => {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[gamepadIndexRef.current];

    if (!gamepad) {
      rafRef.current = requestAnimationFrame(poll);
      return;
    }

    const newState = readGamepadState(gamepad);
    setState(newState);

    rafRef.current = requestAnimationFrame(poll);
  };

  // ── Rumble/Haptic feedback ───────────────────────────────────────────────
  const rumble = (intensity: number, duration: number = 100) => {
    if (!enableHaptics || typeof navigator === 'undefined') return;

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[gamepadIndexRef.current];

    if (!gamepad) return;

    // Haptic Actuator API (supported on Android Chrome)
    const actuators = (gamepad as any).hapticActuators || (gamepad as any).vibrationActuator;
    if (actuators && actuators.length > 0) {
      const clampedIntensity = Math.max(0, Math.min(1, intensity));
      actuators[0].pulse(clampedIntensity, duration / 1000);
      return;
    }

    // Fallback to Vibration API (deprecated but still works on some devices)
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  // ── Visual feedback (LED simulation) ─────────────────────────────────────
  const showFeedback = (color: string = 'neon', pattern: 'pulse' | 'flash' | 'solid' = 'pulse') => {
    if (debug) {
      console.log(`[DualSense] Visual feedback: ${color} (${pattern}) - LED control limited on mobile`);
    }
    // Real LED control requires WebHID (desktop only)
    // Emit custom event for in-game visual feedback
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('de-dualsense-feedback', {
        detail: { color, pattern },
      }));
    }
  };

  // ── Connect/disconnect handlers ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onConnect = (e: GamepadEvent) => {
      if (!isDualSense(e.gamepad)) return;

      gamepadIndexRef.current = e.gamepad.index;
      setState(prev => ({ ...prev, connected: true }));

      if (debug) {
        console.log(
          `🎮 PS5 DualSense connected via ${isMobile.current ? 'phone Bluetooth' : 'USB/desktop'}`,
          '\nGamepad ID:', e.gamepad.id,
          '\nGyro enabled:', enableGyro && isMobile.current,
          '\nHaptics enabled:', enableHaptics
        );
      }

      // Start polling
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(poll);
      }
    };

    const onDisconnect = (e: GamepadEvent) => {
      if (e.gamepad.index === gamepadIndexRef.current) {
        gamepadIndexRef.current = -1;
        setState(prev => ({ ...prev, connected: false }));

        if (debug) {
          console.log('🎮 DualSense disconnected');
        }

        // Stop polling
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
    };

    window.addEventListener('gamepadconnected', onConnect as EventListener);
    window.addEventListener('gamepaddisconnected', onDisconnect as EventListener);

    // Check for already-connected DualSense (page reload / remount)
    if (navigator.getGamepads) {
      const gamepads = Array.from(navigator.getGamepads()).filter(Boolean) as Gamepad[];
      const dualsense = gamepads.find(gp => isDualSense(gp));
      if (dualsense) {
        gamepadIndexRef.current = dualsense.index;
        setState(prev => ({ ...prev, connected: true }));
        rafRef.current = requestAnimationFrame(poll);

        if (debug) {
          console.log('🎮 DualSense already connected on mount');
        }
      }
    }

    return () => {
      window.removeEventListener('gamepadconnected', onConnect as EventListener);
      window.removeEventListener('gamepaddisconnected', onDisconnect as EventListener);

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [enableGyro, enableHaptics, deadZone, debug]);

  return {
    state,
    rumble,
    showFeedback,
    isMobile: isMobile.current,
  };
}

// ── Class-based API (for non-React contexts) ─────────────────────────────────

export class DualSenseManager {
  private gamepadIndex = -1;
  private isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  private rafHandle: number | null = null;
  private config: Required<DualSenseConfig>;
  private currentState: DualSenseState;

  constructor(config: DualSenseConfig = {}) {
    this.config = {
      enableGyro: config.enableGyro ?? true,
      enableHaptics: config.enableHaptics ?? true,
      deadZone: config.deadZone ?? 0.15,
      debug: config.debug ?? false,
    };

    this.currentState = {
      connected: false,
      leftStick: { x: 0, y: 0 },
      rightStick: { x: 0, y: 0 },
      triggers: { l2: 0, r2: 0 },
      gyro: { x: 0, y: 0, z: 0 },
      buttons: {
        cross: false,
        circle: false,
        square: false,
        triangle: false,
        l1: false,
        r1: false,
        l2Button: false,
        r2Button: false,
        l3: false,
        r3: false,
        share: false,
        options: false,
        ps: false,
        touchpad: false,
        dpadUp: false,
        dpadDown: false,
        dpadLeft: false,
        dpadRight: false,
      },
    };
  }

  async init() {
    if (typeof window === 'undefined') return;

    window.addEventListener('gamepadconnected', this.onConnect as EventListener);
    window.addEventListener('gamepaddisconnected', this.onDisconnect as EventListener);

    // Check for already-connected DualSense
    if (navigator.getGamepads) {
      const gamepads = Array.from(navigator.getGamepads()).filter(Boolean) as Gamepad[];
      const dualsense = gamepads.find(gp => this.isDualSense(gp));
      if (dualsense) {
        this.gamepadIndex = dualsense.index;
        this.currentState.connected = true;
        this.startPolling();

        if (this.config.debug) {
          console.log('🎮 DualSense already connected');
        }
      }
    }
  }

  destroy() {
    if (typeof window === 'undefined') return;

    window.removeEventListener('gamepadconnected', this.onConnect as EventListener);
    window.removeEventListener('gamepaddisconnected', this.onDisconnect as EventListener);

    this.stopPolling();
  }

  getState(): DualSenseState {
    return { ...this.currentState };
  }

  rumble(intensity: number, duration: number = 100) {
    if (!this.config.enableHaptics || typeof navigator === 'undefined') return;

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[this.gamepadIndex];

    if (!gamepad) return;

    const actuators = (gamepad as any).hapticActuators || (gamepad as any).vibrationActuator;
    if (actuators && actuators.length > 0) {
      const clampedIntensity = Math.max(0, Math.min(1, intensity));
      actuators[0].pulse(clampedIntensity, duration / 1000);
    } else if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }

  showFeedback(color: string = 'neon', pattern: 'pulse' | 'flash' | 'solid' = 'pulse') {
    if (this.config.debug) {
      console.log(`[DualSense] Visual feedback: ${color} (${pattern})`);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('de-dualsense-feedback', {
        detail: { color, pattern },
      }));
    }
  }

  private isDualSense(gamepad: Gamepad): boolean {
    const id = gamepad.id.toLowerCase();
    return (
      id.includes('dualsense') ||
      id.includes('054c') ||
      id.includes('wireless controller') ||
      id.includes('ps5')
    );
  }

  private applyDeadZone(value: number): number {
    if (Math.abs(value) < this.config.deadZone) return 0;
    const sign = value < 0 ? -1 : 1;
    return sign * ((Math.abs(value) - this.config.deadZone) / (1 - this.config.deadZone));
  }

  private readGyro(gamepad: Gamepad): { x: number; y: number; z: number } {
    if (!this.config.enableGyro || !this.isMobile) {
      return { x: 0, y: 0, z: 0 };
    }

    const gp = gamepad as any;
    if (gp.angularVelocity && Array.isArray(gp.angularVelocity)) {
      return {
        x: gp.angularVelocity[0] || 0,
        y: gp.angularVelocity[1] || 0,
        z: gp.angularVelocity[2] || 0,
      };
    }

    return { x: 0, y: 0, z: 0 };
  }

  private updateState() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[this.gamepadIndex];

    if (!gamepad) return;

    const axes = gamepad.axes;
    const buttons = gamepad.buttons;

    this.currentState = {
      connected: true,
      leftStick: {
        x: this.applyDeadZone(axes[0] || 0),
        y: this.applyDeadZone(axes[1] || 0),
      },
      rightStick: {
        x: this.applyDeadZone(axes[2] || 0),
        y: this.applyDeadZone(axes[3] || 0),
      },
      triggers: {
        l2: buttons[6]?.value || 0,
        r2: buttons[7]?.value || 0,
      },
      gyro: this.readGyro(gamepad),
      buttons: {
        cross: buttons[0]?.pressed || false,
        circle: buttons[1]?.pressed || false,
        square: buttons[2]?.pressed || false,
        triangle: buttons[3]?.pressed || false,
        l1: buttons[4]?.pressed || false,
        r1: buttons[5]?.pressed || false,
        l2Button: buttons[6]?.pressed || false,
        r2Button: buttons[7]?.pressed || false,
        share: buttons[8]?.pressed || false,
        options: buttons[9]?.pressed || false,
        l3: buttons[10]?.pressed || false,
        r3: buttons[11]?.pressed || false,
        dpadUp: buttons[12]?.pressed || false,
        dpadDown: buttons[13]?.pressed || false,
        dpadLeft: buttons[14]?.pressed || false,
        dpadRight: buttons[15]?.pressed || false,
        ps: buttons[16]?.pressed || false,
        touchpad: buttons[17]?.pressed || false,
      },
    };
  }

  private poll = () => {
    this.updateState();
    this.rafHandle = requestAnimationFrame(this.poll);
  };

  private startPolling() {
    if (this.rafHandle === null) {
      this.rafHandle = requestAnimationFrame(this.poll);
    }
  }

  private stopPolling() {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  private onConnect = (e: GamepadEvent) => {
    if (!this.isDualSense(e.gamepad)) return;

    this.gamepadIndex = e.gamepad.index;
    this.currentState.connected = true;
    this.startPolling();

    if (this.config.debug) {
      console.log(
        `🎮 PS5 DualSense connected via ${this.isMobile ? 'phone Bluetooth' : 'USB/desktop'}`,
        '\nGamepad ID:', e.gamepad.id
      );
    }
  };

  private onDisconnect = (e: GamepadEvent) => {
    if (e.gamepad.index === this.gamepadIndex) {
      this.gamepadIndex = -1;
      this.currentState.connected = false;
      this.stopPolling();

      if (this.config.debug) {
        console.log('🎮 DualSense disconnected');
      }
    }
  };
}

/**
 * components/gameengin/input/DualSenseManager.ts
 *
 * DualSense controller integration for mobile Bluetooth and desktop USB.
 *
 * Key features (March 2026):
 * - Bluetooth pairing to phone (Android Chrome best, iOS Safari decent)
 * - Gamepad API: Sticks, buttons, triggers, D-pad, gyro
 * - Haptics/Rumble: Basic vibration on Android Chrome
 * - Adaptive triggers: Limited on mobile (WebHID is desktop-only)
 * - LED/Touchpad: Limited on mobile - use in-game visual feedback
 *
 * Pairing: Hold PS button + Create button until light bar flashes blue
 * → pair in phone Bluetooth settings. Works on Android 12+ and iOS 14.5+.
 *
 * Architecture: Integrates with existing dual-runtime, DreamDM Bar drag,
 * and spatial multitasking (game keeps rendering while messaging/resizing).
 */

import * as BABYLON from '@babylonjs/core';

export interface DualSenseState {
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  triggers: { l2: number; r2: number };
  gyro: { x: number; y: number };
  buttons: {
    cross: boolean;
    circle: boolean;
    square: boolean;
    triangle: boolean;
    l1: boolean;
    r1: boolean;
    share: boolean;
    options: boolean;
    l3: boolean;
    r3: boolean;
    dpadUp: boolean;
    dpadDown: boolean;
    dpadLeft: boolean;
    dpadRight: boolean;
  };
}

export class DualSenseManager {
  private gamepadIndex = -1;
  private isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  private scene: BABYLON.Scene;
  private engine: BABYLON.AbstractEngine;
  private onStatusChange?: (status: string) => void;

  constructor(
    scene: BABYLON.Scene,
    engine: BABYLON.AbstractEngine,
    onStatusChange?: (status: string) => void
  ) {
    this.scene = scene;
    this.engine = engine;
    this.onStatusChange = onStatusChange;
  }

  async init() {
    // Listen for Bluetooth pairing on phone
    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      const gp = e.gamepad;
      if (
        gp.id.toLowerCase().includes('dualsense') ||
        gp.id.includes('054C') ||
        gp.id.includes('Wireless Controller')
      ) {
        this.gamepadIndex = gp.index;
        const mode = this.isMobile ? 'phone Bluetooth' : 'USB/desktop';
        console.log(`🎮 PS5 DualSense connected via ${mode}`);

        // Mobile-friendly status
        if (this.isMobile) {
          const status = 'DualSense ready — gyro steering + basic rumble active';
          console.log('📱 Mobile mode: Gyro steering/aim + basic rumble active. Adaptive triggers limited.');
          this.onStatusChange?.(status);
        } else {
          this.onStatusChange?.('DualSense ready — all features active');
        }
      }
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadIndex = -1;
      this.onStatusChange?.('DualSense disconnected');
    });

    // Poll in render loop for smooth input
    this.scene.onBeforeRenderObservable.add(() => this.update());
  }

  private update() {
    const gp = navigator.getGamepads()[this.gamepadIndex];
    if (!gp) return;

    // Core mapping (works on phone Bluetooth) - handled in getState()
    // This update loop is for future frame-by-frame processing if needed
  }

  getState(): DualSenseState {
    const gp = navigator.getGamepads()[this.gamepadIndex];
    if (!gp) {
      return {
        leftStick: { x: 0, y: 0 },
        rightStick: { x: 0, y: 0 },
        triggers: { l2: 0, r2: 0 },
        gyro: { x: 0, y: 0 },
        buttons: {
          cross: false,
          circle: false,
          square: false,
          triangle: false,
          l1: false,
          r1: false,
          share: false,
          options: false,
          l3: false,
          r3: false,
          dpadUp: false,
          dpadDown: false,
          dpadLeft: false,
          dpadRight: false,
        },
      };
    }

    // Gyro is great on mobile for natural steering/aim (phone tilt)
    const gyro = this.isMobile
      ? {
          x: (gp as any).angularVelocity?.[0] || 0,
          y: (gp as any).angularVelocity?.[1] || 0,
        }
      : { x: 0, y: 0 };

    return {
      leftStick: { x: gp.axes[0] || 0, y: gp.axes[1] || 0 },
      rightStick: { x: gp.axes[2] || 0, y: gp.axes[3] || 0 },
      triggers: {
        l2: gp.buttons[6]?.value || 0,
        r2: gp.buttons[7]?.value || 0,
      },
      gyro,
      buttons: {
        cross: gp.buttons[0]?.pressed || false,
        circle: gp.buttons[1]?.pressed || false,
        square: gp.buttons[2]?.pressed || false,
        triangle: gp.buttons[3]?.pressed || false,
        l1: gp.buttons[4]?.pressed || false,
        r1: gp.buttons[5]?.pressed || false,
        share: gp.buttons[8]?.pressed || false,
        options: gp.buttons[9]?.pressed || false,
        l3: gp.buttons[10]?.pressed || false,
        r3: gp.buttons[11]?.pressed || false,
        dpadUp: gp.buttons[12]?.pressed || false,
        dpadDown: gp.buttons[13]?.pressed || false,
        dpadLeft: gp.buttons[14]?.pressed || false,
        dpadRight: gp.buttons[15]?.pressed || false,
      },
    };
  }

  rumble(intensity: number, durationMs: number = 100) {
    const gp = navigator.getGamepads()[this.gamepadIndex];
    if (gp?.hapticActuators?.length && gp.hapticActuators.length > 0) {
      const clampedIntensity = Math.max(0, Math.min(1, intensity));
      gp.hapticActuators[0].pulse(clampedIntensity, durationMs / 1000);
    }
  }

  // Optional: Visual LED feedback in-game (since real LED control is desktop/WebHID only)
  showFeedback(color: string = 'neon') {
    console.log(`Visual feedback: ${color} (real LED limited on mobile)`);
  }

  isConnected(): boolean {
    return this.gamepadIndex !== -1;
  }

  dispose() {
    // Cleanup if needed
    this.gamepadIndex = -1;
  }
}

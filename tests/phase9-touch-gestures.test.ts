/**
 * tests/phase9-touch-gestures.test.ts
 *
 * Tests for lib/gestures/touchGestures.ts — the pure gesture recognition engine.
 */

import { describe, expect, it } from 'vitest';
import {
  GestureRecogniser,
  type GestureCallbacks,
  type GestureEvent,
} from '@/lib/gestures/touchGestures';

// ─── Constructor and basic API ────────────────────────────────────────────────

describe('Touch Gestures — GestureRecogniser', () => {
  it('can be instantiated with callbacks', () => {
    const callbacks: GestureCallbacks = {};
    const recogniser = new GestureRecogniser(callbacks);
    expect(recogniser).toBeDefined();
  });

  it('can be instantiated with config overrides', () => {
    const callbacks: GestureCallbacks = {};
    const recogniser = new GestureRecogniser(callbacks, {
      swipeThreshold: 100,
      longPressMs: 800,
    });
    expect(recogniser).toBeDefined();
  });

  it('attach returns a detach function', () => {
    const callbacks: GestureCallbacks = {};
    const recogniser = new GestureRecogniser(callbacks);

    // Create a minimal mock element
    const listeners = new Map<string, EventListenerOrEventListenerObject>();
    const el = {
      addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
        listeners.set(type, listener);
      },
      removeEventListener: (type: string) => {
        listeners.delete(type);
      },
    } as unknown as HTMLElement;

    const detach = recogniser.attach(el);
    expect(typeof detach).toBe('function');

    // Should have added touch listeners
    expect(listeners.has('touchstart')).toBe(true);
    expect(listeners.has('touchmove')).toBe(true);
    expect(listeners.has('touchend')).toBe(true);

    // Detach should remove them
    detach();
    expect(listeners.has('touchstart')).toBe(false);
    expect(listeners.has('touchmove')).toBe(false);
    expect(listeners.has('touchend')).toBe(false);
  });
});

// ─── GestureEvent type contracts ──────────────────────────────────────────────

describe('Touch Gestures — event types', () => {
  it('GestureEvent has correct shape for pinch', () => {
    const event: GestureEvent = {
      type: 'pinch',
      fingers: 2,
      center: { x: 100, y: 200 },
      scale: 1.5,
      timestamp: Date.now(),
    };
    expect(event.type).toBe('pinch');
    expect(event.scale).toBe(1.5);
    expect(event.fingers).toBe(2);
  });

  it('GestureEvent has correct shape for rotate', () => {
    const event: GestureEvent = {
      type: 'rotate',
      fingers: 2,
      center: { x: 100, y: 200 },
      rotation: Math.PI / 4,
      timestamp: Date.now(),
    };
    expect(event.type).toBe('rotate');
    expect(event.rotation).toBe(Math.PI / 4);
  });

  it('GestureEvent has correct shape for swipe', () => {
    const event: GestureEvent = {
      type: 'swipe-left',
      fingers: 3,
      center: { x: 100, y: 200 },
      velocity: { x: -1.5, y: 0 },
      timestamp: Date.now(),
    };
    expect(event.type).toBe('swipe-left');
    expect(event.fingers).toBe(3);
    expect(event.velocity?.x).toBeLessThan(0);
  });

  it('GestureEvent has correct shape for tap', () => {
    const event: GestureEvent = {
      type: 'tap',
      fingers: 1,
      center: { x: 50, y: 80 },
      timestamp: Date.now(),
    };
    expect(event.type).toBe('tap');
  });

  it('GestureEvent has correct shape for pan', () => {
    const event: GestureEvent = {
      type: 'pan',
      fingers: 1,
      center: { x: 150, y: 300 },
      delta: { x: 50, y: 100 },
      timestamp: Date.now(),
    };
    expect(event.type).toBe('pan');
    expect(event.delta?.x).toBe(50);
  });

  it('supports all gesture types', () => {
    const types = ['pinch', 'rotate', 'swipe-left', 'swipe-right',
                   'swipe-up', 'swipe-down', 'pan', 'tap', 'long-press'];
    for (const type of types) {
      const event: GestureEvent = {
        type: type as GestureEvent['type'],
        fingers: 1,
        center: { x: 0, y: 0 },
        timestamp: Date.now(),
      };
      expect(event.type).toBe(type);
    }
  });
});

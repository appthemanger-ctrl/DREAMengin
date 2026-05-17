/**
 * tests/phase9-touch-gestures.test.ts
 *
 * Tests for lib/gestures/touchGestures.ts — the pure gesture recognition engine.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GestureRecogniser,
  type GestureCallbacks,
  type GestureEvent,
} from '@/lib/gestures/touchGestures';

function makeTouch(
  identifier: number,
  clientX: number,
  clientY: number,
): Touch {
  return {
    identifier,
    clientX,
    clientY,
  } as Touch;
}

function makeEvent(touches: Touch[], changedTouches: Touch[] = touches): TouchEvent {
  return {
    touches,
    changedTouches,
    preventDefault: vi.fn(),
  } as unknown as TouchEvent;
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

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

describe('Touch Gestures — runtime behaviour', () => {
  it('fires tap for a quick stationary single-touch interaction', () => {
    const onTap = vi.fn();
    const recogniser = new GestureRecogniser({ onTap });

    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(1_120);

    (recogniser as any).handleTouchStart(makeEvent([makeTouch(1, 20, 40)]));
    (recogniser as any).handleTouchEnd(
      makeEvent([], [makeTouch(1, 22, 42)]),
    );

    expect(onTap).toHaveBeenCalledTimes(1);
    expect(onTap).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tap',
        fingers: 1,
        center: { x: 20, y: 40 },
      }),
    );
  });

  it('does not fire tap after significant movement', () => {
    const onTap = vi.fn();
    const recogniser = new GestureRecogniser({ onTap });

    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(1_120);

    (recogniser as any).handleTouchStart(makeEvent([makeTouch(1, 20, 40)]));
    (recogniser as any).handleTouchEnd(
      makeEvent([], [makeTouch(1, 60, 90)]),
    );

    expect(onTap).not.toHaveBeenCalled();
  });

  it('waits for pan threshold before emitting pan updates', () => {
    const onPan = vi.fn();
    const recogniser = new GestureRecogniser({ onPan }, { panThreshold: 10 });

    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(1_010)
      .mockReturnValueOnce(1_020);

    (recogniser as any).handleTouchStart(makeEvent([makeTouch(1, 100, 100)]));
    (recogniser as any).handleTouchMove(makeEvent([makeTouch(1, 106, 104)]));
    (recogniser as any).handleTouchMove(makeEvent([makeTouch(1, 120, 115)]));

    expect(onPan).toHaveBeenCalledTimes(1);
    expect(onPan).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pan',
        delta: { x: 20, y: 15 },
      }),
    );
  });

  it('normalises rotation deltas across the angle wrap boundary', () => {
    const onRotate = vi.fn();
    const recogniser = new GestureRecogniser(
      { onRotate },
      { rotateThreshold: 0.01 },
    );

    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(1_020);

    (recogniser as any).handleTouchStart(
      makeEvent([makeTouch(1, 0, 0), makeTouch(2, -1, 0.1)]),
    );
    (recogniser as any).handleTouchMove(
      makeEvent([makeTouch(1, 0, 0), makeTouch(2, -1, -0.1)]),
    );

    expect(onRotate).toHaveBeenCalledTimes(1);
    expect(Math.abs(onRotate.mock.calls[0][0].rotation)).toBeLessThan(0.5);
  });

  it('does not emit tap or swipe callbacks on touchcancel', () => {
    const onTap = vi.fn();
    const onSwipe = vi.fn();
    const recogniser = new GestureRecogniser({ onTap, onSwipe });

    vi.spyOn(Date, 'now').mockReturnValue(1_000);

    (recogniser as any).handleTouchStart(
      makeEvent([
        makeTouch(1, 0, 0),
        makeTouch(2, 10, 0),
        makeTouch(3, 20, 0),
      ]),
    );
    (recogniser as any).handleTouchMove(
      makeEvent([
        makeTouch(1, 100, 0),
        makeTouch(2, 110, 0),
        makeTouch(3, 120, 0),
      ]),
    );
    (recogniser as any).handleTouchCancel(makeEvent([]));

    expect(onTap).not.toHaveBeenCalled();
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('fires long-press after the configured delay', () => {
    vi.useFakeTimers();

    const onLongPress = vi.fn();
    const recogniser = new GestureRecogniser(
      { onLongPress },
      { longPressMs: 200 },
    );

    vi.spyOn(Date, 'now').mockReturnValue(1_000);

    (recogniser as any).handleTouchStart(makeEvent([makeTouch(1, 30, 60)]));
    vi.advanceTimersByTime(200);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'long-press',
        center: { x: 30, y: 60 },
      }),
    );
  });
});

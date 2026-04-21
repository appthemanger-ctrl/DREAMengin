/**
 * tests/enginpipe/input.test.ts
 *
 * Unit tests for the EnginPipe Unified Input & Haptics Manager (Component 12).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createInputManager,
  createHapticsManager,
  emptyInputState,
  type InputEvent,
  type InputManager,
} from '@/lib/enginpipe/input';

function makeEvent(overrides: Partial<InputEvent> = {}): InputEvent {
  return {
    kind:      'button_down',
    source:    'keyboard',
    id:        'Space',
    value:     1,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('enginpipe / input — emptyInputState', () => {
  it('all axes are zero', () => {
    const s = emptyInputState();
    expect(s.leftStick).toEqual({ x: 0, y: 0 });
    expect(s.rightStick).toEqual({ x: 0, y: 0 });
    expect(s.leftTrigger).toBe(0);
    expect(s.rightTrigger).toBe(0);
  });

  it('all sets are empty', () => {
    const s = emptyInputState();
    expect(s.activeSources.size).toBe(0);
    expect(s.heldButtons.size).toBe(0);
    expect(s.heldNotes.size).toBe(0);
    expect(s.touches.length).toBe(0);
  });
});

describe('enginpipe / input — InputManager buttons', () => {
  let mgr: InputManager;
  beforeEach(() => { mgr = createInputManager(); });

  it('button_down adds to heldButtons', () => {
    mgr.feed(makeEvent({ kind: 'button_down', id: 'A', source: 'gamepad' }));
    expect(mgr.getState().heldButtons.has('A')).toBe(true);
  });

  it('button_up removes from heldButtons', () => {
    mgr.feed(makeEvent({ kind: 'button_down', id: 'B' }));
    mgr.feed(makeEvent({ kind: 'button_up',   id: 'B' }));
    expect(mgr.getState().heldButtons.has('B')).toBe(false);
  });

  it('activeSources is updated on each feed', () => {
    mgr.feed(makeEvent({ source: 'keyboard' }));
    mgr.feed(makeEvent({ source: 'gamepad' }));
    expect(mgr.getState().activeSources.has('keyboard')).toBe(true);
    expect(mgr.getState().activeSources.has('gamepad')).toBe(true);
  });
});

describe('enginpipe / input — InputManager axes', () => {
  let mgr: InputManager;
  beforeEach(() => { mgr = createInputManager(); });

  it('axis_move id=0 sets leftStick.x', () => {
    mgr.feed(makeEvent({ kind: 'axis_move', source: 'gamepad', id: 0, value: 0.75 }));
    expect(mgr.getState().leftStick.x).toBeCloseTo(0.75);
  });

  it('axis_move id=1 sets leftStick.y', () => {
    mgr.feed(makeEvent({ kind: 'axis_move', source: 'gamepad', id: 1, value: -0.5 }));
    expect(mgr.getState().leftStick.y).toBeCloseTo(-0.5);
  });

  it('axis_move id=4 sets leftTrigger', () => {
    mgr.feed(makeEvent({ kind: 'axis_move', source: 'gamepad', id: 4, value: 0.9 }));
    expect(mgr.getState().leftTrigger).toBeCloseTo(0.9);
  });

  it('axis_move id=5 sets rightTrigger', () => {
    mgr.feed(makeEvent({ kind: 'axis_move', source: 'gamepad', id: 5, value: 0.3 }));
    expect(mgr.getState().rightTrigger).toBeCloseTo(0.3);
  });
});

describe('enginpipe / input — InputManager touch', () => {
  let mgr: InputManager;
  beforeEach(() => { mgr = createInputManager(); });

  it('touch_start adds a touch point', () => {
    mgr.feed(makeEvent({ kind: 'touch_start', source: 'touch', id: 1, value: 100, raw: 200 }));
    const touches = mgr.getState().touches;
    expect(touches).toHaveLength(1);
    expect(touches[0].id).toBe(1);
    expect(touches[0].x).toBe(100);
  });

  it('touch_end removes the touch point', () => {
    mgr.feed(makeEvent({ kind: 'touch_start', source: 'touch', id: 2, value: 50, raw: 60 }));
    mgr.feed(makeEvent({ kind: 'touch_end',   source: 'touch', id: 2, value: 50 }));
    expect(mgr.getState().touches).toHaveLength(0);
  });
});

describe('enginpipe / input — InputManager MIDI', () => {
  let mgr: InputManager;
  beforeEach(() => { mgr = createInputManager(); });

  it('midi_note_on adds the note', () => {
    mgr.feed(makeEvent({ kind: 'midi_note_on', source: 'midi', id: 60, value: 0.8 }));
    expect(mgr.getState().heldNotes.has(60)).toBe(true);
  });

  it('midi_note_off removes the note', () => {
    mgr.feed(makeEvent({ kind: 'midi_note_on',  source: 'midi', id: 61, value: 0.7 }));
    mgr.feed(makeEvent({ kind: 'midi_note_off', source: 'midi', id: 61, value: 0   }));
    expect(mgr.getState().heldNotes.has(61)).toBe(false);
  });
});

describe('enginpipe / input — listeners', () => {
  it('onEvent fires for every feed call', () => {
    const mgr      = createInputManager();
    const listener = vi.fn();
    mgr.onEvent(listener);

    mgr.feed(makeEvent());
    mgr.feed(makeEvent({ kind: 'button_up' }));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('onEvent unsubscribe stops callbacks', () => {
    const mgr      = createInputManager();
    const listener = vi.fn();
    const unsub    = mgr.onEvent(listener);
    unsub();
    mgr.feed(makeEvent());
    expect(listener).not.toHaveBeenCalled();
  });

  it('onStateChange fires after every feed call', () => {
    const mgr      = createInputManager();
    const listener = vi.fn();
    mgr.onStateChange(listener);
    mgr.feed(makeEvent());
    mgr.feed(makeEvent({ kind: 'button_up' }));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('reset() clears state and fires stateChange listeners', () => {
    const mgr      = createInputManager();
    const listener = vi.fn();
    mgr.onStateChange(listener);
    mgr.feed(makeEvent({ kind: 'button_down', id: 'Z' }));
    mgr.reset();
    expect(mgr.getState().heldButtons.size).toBe(0);
    expect(listener).toHaveBeenCalledTimes(2); // feed + reset
  });
});

describe('enginpipe / input — HapticsManager', () => {
  it('queues and drains haptic requests', () => {
    const hap = createHapticsManager();
    hap.request({ channel: 'right_trigger', effect: 'click', intensity: 0.8 });
    hap.request({ channel: 'left_motor',    effect: 'vibration', intensity: 0.5, durationMs: 200 });

    const requests = hap.drain();
    expect(requests).toHaveLength(2);
    expect(requests[0].channel).toBe('right_trigger');
    expect(requests[0].queuedAt).toBeGreaterThan(0);

    // Queue is cleared after drain.
    expect(hap.drain()).toHaveLength(0);
  });

  it('peek returns queue without clearing it', () => {
    const hap = createHapticsManager();
    hap.request({ channel: 'left_trigger', effect: 'resistance', intensity: 0.6 });
    const peeked = hap.peek();
    expect(peeked).toHaveLength(1);
    // Still in queue.
    expect(hap.drain()).toHaveLength(1);
  });

  it('stopAll queues none effect on all 4 channels', () => {
    const hap = createHapticsManager();
    hap.stopAll();
    const reqs = hap.drain();
    expect(reqs).toHaveLength(4);
    expect(reqs.every((r) => r.effect === 'none')).toBe(true);
  });

  it('InputManager exposes a haptics manager', () => {
    const mgr = createInputManager();
    expect(mgr.haptics).toBeDefined();
    mgr.haptics.request({ channel: 'right_motor', effect: 'pulse', intensity: 0.4 });
    expect(mgr.haptics.drain()).toHaveLength(1);
  });
});

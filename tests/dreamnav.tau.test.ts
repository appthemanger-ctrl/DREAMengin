import { describe, expect, it } from 'vitest';

import { tau, transition, type NavState } from '@/lib/dreamnav/tau';

describe('dreamnav tau', () => {
  it('maps home node actions to inner layer', () => {
    expect(tau(0, 'swipe_up')).toBe(1);
    expect(tau(0, 'swipe_down')).toBe(2);
    expect(tau(0, 'swipe_left')).toBe(3);
    expect(tau(0, 'swipe_right')).toBe(4);
    expect(tau(0, 'zoom_in')).toBe(5);
    expect(tau(0, 'zoom_out')).toBe(6);
  });

  it('cycles repeated direction 0 -> n -> nb -> 0', () => {
    expect(tau(0, 'swipe_left')).toBe(3);
    expect(tau(3, 'swipe_left')).toBe('3b');
    expect(tau('3b', 'swipe_left')).toBe(0);
  });

  it('cancels to zero on opposite direction', () => {
    expect(tau(3, 'swipe_right')).toBe(0);
    expect(tau('5b', 'zoom_out')).toBe(0);
    expect(tau(1, 'swipe_down')).toBe(0);
  });

  it('preserves layer on cross-axis movement', () => {
    expect(tau(3, 'swipe_up')).toBe(1);
    expect(tau('3b', 'swipe_up')).toBe('1b');
  });

  it('resets heading when transition reaches 0', () => {
    const start: NavState = { node: '3b', heading: 'L' };
    expect(transition(start, 'swipe_left')).toEqual({ node: 0, heading: null });
  });
});

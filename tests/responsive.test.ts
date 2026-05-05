import { describe, it, expect } from 'vitest';
import {
  BREAKPOINTS,
  BREAKPOINT_ORDER,
  clamp,
  cssClamp,
  fluid,
  getBreakpoint,
  isAtLeast,
  isBelow,
  pickByBreakpoint,
  readViewportWidth,
} from '../lib/ui/responsive';

describe('responsive utilities', () => {
  describe('getBreakpoint', () => {
    it('returns xs for tiny / invalid widths', () => {
      expect(getBreakpoint(0)).toBe('xs');
      expect(getBreakpoint(-100)).toBe('xs');
      expect(getBreakpoint(Number.NaN)).toBe('xs');
      expect(getBreakpoint(320)).toBe('xs');
    });

    it('returns the largest breakpoint <= width', () => {
      expect(getBreakpoint(BREAKPOINTS.xs)).toBe('xs');
      expect(getBreakpoint(BREAKPOINTS.sm)).toBe('sm');
      expect(getBreakpoint(BREAKPOINTS.md)).toBe('md');
      expect(getBreakpoint(BREAKPOINTS.lg)).toBe('lg');
      expect(getBreakpoint(BREAKPOINTS.xl)).toBe('xl');
      expect(getBreakpoint(BREAKPOINTS.xxl)).toBe('xxl');
      expect(getBreakpoint(BREAKPOINTS.xxl + 500)).toBe('xxl');
    });

    it('handles values just below a breakpoint', () => {
      expect(getBreakpoint(BREAKPOINTS.md - 1)).toBe('sm');
      expect(getBreakpoint(BREAKPOINTS.lg - 1)).toBe('md');
    });

    it('order array is sorted ascending', () => {
      for (let i = 1; i < BREAKPOINT_ORDER.length; i += 1) {
        expect(BREAKPOINTS[BREAKPOINT_ORDER[i]]).toBeGreaterThan(
          BREAKPOINTS[BREAKPOINT_ORDER[i - 1]],
        );
      }
    });
  });

  describe('isAtLeast / isBelow', () => {
    it('compares against named breakpoints', () => {
      expect(isAtLeast(1024, 'lg')).toBe(true);
      expect(isAtLeast(1023, 'lg')).toBe(false);
      expect(isBelow(1023, 'lg')).toBe(true);
      expect(isBelow(1024, 'lg')).toBe(false);
    });

    it('returns false for non-finite widths', () => {
      expect(isAtLeast(Number.NaN, 'md')).toBe(false);
      expect(isBelow(Number.NaN, 'md')).toBe(false);
    });
  });

  describe('clamp', () => {
    it('clamps within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-1, 0, 10)).toBe(0);
      expect(clamp(11, 0, 10)).toBe(10);
    });

    it('returns low when bounds are inverted or value is non-finite', () => {
      expect(clamp(5, 10, 0)).toBe(10);
      expect(clamp(Number.NaN, 0, 10)).toBe(0);
    });
  });

  describe('fluid', () => {
    it('returns min below fromWidth and max above toWidth', () => {
      expect(fluid(100, { min: 8, max: 24, fromWidth: 360, toWidth: 1280 })).toBe(8);
      expect(fluid(2000, { min: 8, max: 24, fromWidth: 360, toWidth: 1280 })).toBe(24);
    });

    it('linearly interpolates between anchors', () => {
      const mid = fluid(820, { min: 0, max: 100, fromWidth: 320, toWidth: 1320 });
      expect(mid).toBeCloseTo(50, 5);
    });

    it('returns min for invalid range or non-finite width', () => {
      expect(fluid(Number.NaN, { min: 4, max: 8 })).toBe(4);
      expect(fluid(800, { min: 4, max: 8, fromWidth: 1000, toWidth: 500 })).toBe(4);
    });
  });

  describe('pickByBreakpoint', () => {
    it('picks the value at or below the current breakpoint', () => {
      const values = { xs: 'a', md: 'b', xl: 'c' } as const;
      expect(pickByBreakpoint(320, values, 'fallback')).toBe('a');
      expect(pickByBreakpoint(800, values, 'fallback')).toBe('b');
      expect(pickByBreakpoint(1000, values, 'fallback')).toBe('b');
      expect(pickByBreakpoint(1400, values, 'fallback')).toBe('c');
    });

    it('walks upward when only larger breakpoints are defined', () => {
      expect(pickByBreakpoint(320, { lg: 9 }, 0)).toBe(9);
    });

    it('returns fallback when map is empty', () => {
      expect(pickByBreakpoint(800, {}, 'fb')).toBe('fb');
    });
  });

  describe('cssClamp', () => {
    it('returns a fixed px value when min equals max', () => {
      expect(cssClamp(16, 16)).toBe('16px');
    });

    it('returns a fixed px value when range is degenerate', () => {
      expect(cssClamp(8, 16, 1000, 500)).toBe('8px');
    });

    it('produces a clamp() expression with min and max as anchors', () => {
      const out = cssClamp(14, 18, 360, 1280);
      expect(out.startsWith('clamp(14px,')).toBe(true);
      expect(out.endsWith(', 18px)')).toBe(true);
      expect(out).toContain('vw');
    });
  });

  describe('readViewportWidth', () => {
    it('returns the default when window is unavailable (Node test env)', () => {
      // vitest config uses environment: 'node' so window is undefined here.
      expect(readViewportWidth()).toBe(BREAKPOINTS.lg);
      expect(readViewportWidth(640)).toBe(640);
    });
  });
});

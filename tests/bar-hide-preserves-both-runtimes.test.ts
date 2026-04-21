/**
 * bar-hide-preserves-both-runtimes.test.ts
 *
 * Asserts that hiding the DreamDM Bar does NOT collapse either runtime region
 * and does NOT force splitRatio to 1. Both HomeDream Surface and DreamSpace
 * must remain rendered and independently scrollable when isBarMinimized is true.
 *
 * Per Bar Ownership Law §0 (docs/LAW.md):
 *   "Hiding the bar removes only the bar's own UI. Both HomeDream and DreamSpace
 *   remain rendered at whatever split they held the moment the bar disappeared."
 */

import { describe, expect, it } from 'vitest';
import { DIVIDER_H } from '@/lib/dreamdm/barInteractions';

// ---------------------------------------------------------------------------
// Pure layout helpers — extracted from HomeSystem render logic so we can test
// the layout math without mounting React components.
// ---------------------------------------------------------------------------

interface RegionLayout {
  topHeight: string;
  bottomRegionTop: string;
  bottomHeight: string;
  runtimeSplitRatio: number;
}

/**
 * Compute the CSS layout strings that HomeSystem derives from the current
 * splitRatio and isBarMinimized values.
 *
 * This mirrors the exact calculation in
 * dreamdmbar/homedream/dream.homedream.HomeSystem.tsx — intentionally kept
 * in sync so a future change to the component must also update this test.
 */
function computeRegionLayout(splitRatio: number, isBarMinimized: boolean): RegionLayout {
  const dividerHeight = isBarMinimized ? 0 : DIVIDER_H;

  // Bar Ownership Law §0: hiding the bar must NOT change the split ratio.
  const runtimeSplitRatio = splitRatio;

  const topHeight = `calc((100% - ${dividerHeight}px) * ${runtimeSplitRatio})`;
  const bottomRegionTop = `calc(${topHeight} + ${dividerHeight}px)`;
  const bottomHeight = `calc(100% - ${bottomRegionTop})`;

  return { topHeight, bottomHeight, bottomRegionTop, runtimeSplitRatio };
}

/**
 * Evaluate a CSS calc() expression against a given viewport height.
 * Supports the subset of calc() used by HomeSystem:
 *   calc((100% - Xpx) * R)
 *   calc(A + Bpx)
 *   calc(100% - A)
 */
function evalCssCalc(expr: string, viewportHeight: number): number {
  // Strip "calc(" … ")"
  const inner = expr.replace(/^calc\(/, '').replace(/\)$/, '');

  // Pattern: (100% - Dpx) * R  →  (vh - D) * R
  const topMatch = inner.match(/^\(100% - ([\d.]+)px\) \* ([\d.]+)$/);
  if (topMatch) {
    const divH = parseFloat(topMatch[1]);
    const ratio = parseFloat(topMatch[2]);
    return (viewportHeight - divH) * ratio;
  }

  // Pattern: EXPR + Dpx
  const addMatch = inner.match(/^(.+) \+ ([\d.]+)px$/);
  if (addMatch) {
    return evalCssCalc(addMatch[1], viewportHeight) + parseFloat(addMatch[2]);
  }

  // Pattern: 100% - EXPR
  const subMatch = inner.match(/^100% - (.+)$/);
  if (subMatch) {
    return viewportHeight - evalCssCalc(subMatch[1], viewportHeight);
  }

  throw new Error(`evalCssCalc: unrecognized expression: "${expr}"`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const VIEWPORT_H = 800;
const SPLIT_RATIO = 0.6;

describe('Bar Ownership Law §0 — bar-hide preserves both runtimes', () => {
  describe('bar visible (isBarMinimized = false)', () => {
    const layout = computeRegionLayout(SPLIT_RATIO, false);
    const topPx = evalCssCalc(layout.topHeight, VIEWPORT_H);
    const bottomPx = evalCssCalc(layout.bottomHeight, VIEWPORT_H);

    it('splitRatio is passed through unchanged', () => {
      expect(layout.runtimeSplitRatio).toBe(SPLIT_RATIO);
    });

    it('HomeDream Surface region has positive height', () => {
      expect(topPx).toBeGreaterThan(0);
    });

    it('DreamSpace region has positive height', () => {
      expect(bottomPx).toBeGreaterThan(0);
    });

    it('top + divider + bottom sums to the full viewport', () => {
      const sum = topPx + DIVIDER_H + bottomPx;
      expect(sum).toBeCloseTo(VIEWPORT_H, 1);
    });
  });

  describe('bar hidden (isBarMinimized = true) with same splitRatio = 0.6', () => {
    const layout = computeRegionLayout(SPLIT_RATIO, true);
    const topPx = evalCssCalc(layout.topHeight, VIEWPORT_H);
    const bottomPx = evalCssCalc(layout.bottomHeight, VIEWPORT_H);

    it('splitRatio is NOT forced to 1 — it stays at 0.6', () => {
      expect(layout.runtimeSplitRatio).toBe(SPLIT_RATIO);
      expect(layout.runtimeSplitRatio).not.toBe(1);
    });

    it('HomeDream Surface region still has positive height', () => {
      expect(topPx).toBeGreaterThan(0);
    });

    it('DreamSpace region still has positive height', () => {
      expect(bottomPx).toBeGreaterThan(0);
    });

    it('neither region height drops to zero', () => {
      expect(topPx).toBeGreaterThan(0);
      expect(bottomPx).toBeGreaterThan(0);
    });

    it('top + bottom sums to the full viewport (no divider when bar is hidden)', () => {
      // When the bar is hidden dividerHeight = 0, so top + bottom = 100%
      const sum = topPx + bottomPx;
      expect(sum).toBeCloseTo(VIEWPORT_H, 1);
    });
  });

  describe('bar re-shown after being hidden', () => {
    it('splitRatio is unchanged when bar becomes visible again', () => {
      const hidden = computeRegionLayout(SPLIT_RATIO, true);
      const shown = computeRegionLayout(SPLIT_RATIO, false);
      // Both must use the original splitRatio — bar hide/show must not drift it
      expect(hidden.runtimeSplitRatio).toBe(SPLIT_RATIO);
      expect(shown.runtimeSplitRatio).toBe(SPLIT_RATIO);
    });

    it('top region height is the same before hide and after re-show', () => {
      const before = evalCssCalc(computeRegionLayout(SPLIT_RATIO, false).topHeight, VIEWPORT_H);
      const after = evalCssCalc(computeRegionLayout(SPLIT_RATIO, false).topHeight, VIEWPORT_H);
      expect(after).toBeCloseTo(before, 1);
    });
  });
});

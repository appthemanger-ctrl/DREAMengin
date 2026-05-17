/**
 * DREAMengin shared responsive scale utility.
 *
 * Single source of truth for breakpoints, fluid sizing, and viewport-aware
 * scaling so every component can be adaptable / dynamic / scalable without
 * reinventing ad-hoc `window.innerWidth` checks or hardcoded pixel values.
 *
 * All functions are pure and SSR-safe (no DOM access). Hooks live in
 * `lib/hooks/useResponsive.ts`.
 */

export const BREAKPOINTS = {
  /** Phones (portrait). */
  xs: 360,
  /** Phones (landscape) / large phones. */
  sm: 480,
  /** Tablets (portrait). */
  md: 768,
  /** Tablets (landscape) / small laptops. */
  lg: 1024,
  /** Desktops. */
  xl: 1280,
  /** Large desktops. */
  xxl: 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Ordered breakpoint keys, smallest → largest. */
export const BREAKPOINT_ORDER: readonly Breakpoint[] = [
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  'xxl',
];

/**
 * Returns the largest breakpoint key whose minimum width is <= the given
 * viewport width. Falls back to `'xs'` for sub-360 widths.
 */
export function getBreakpoint(width: number: Breakpoint {
  if (!Number.isFinite(width) || width <= 0) return 'xs';
  let current: Breakpoint = 'xs';
  for (const bp of BREAKPOINT_ORDER) {
    if (width >= BREAKPOINTS[bp]) {
      current = bp;
    } else {
      break;
    }
  }
  return current;
}

/** True if `width` is at or above the named breakpoint. */
export function isAtLeast(width: number, bp: Breakpoint: boolean {
  if (!Number.isFinite(width)) return false;
  return width >= BREAKPOINTS[bp];
}

/** True if `width` is below the named breakpoint. */
export function isBelow(width: number, bp: Breakpoint: boolean {
  if (!Number.isFinite(width)) return false;
  return width < BREAKPOINTS[bp];
}

/**
 * Linearly interpolates a value between `min` and `max` based on viewport
 * width clamped to [`fromWidth`, `toWidth`]. Use for fluid sizes that should
 * grow smoothly between two breakpoints rather than snap.
 *
 * @example
 *   const padding = fluid(width, { min: 8, max: 24 });
 *   const fontPx = fluid(width, { min: 14, max: 18, fromWidth: 360, toWidth: 1280 });
 */
export function fluid(
  width: number,
  options: {
    min: number;
    max: number;
    fromWidth?: number;
    toWidth?: number;
  },
): number {
  const { min, max } = options;
  const fromWidth = options.fromWidth ?? BREAKPOINTS.xs;
  const toWidth = options.toWidth ?? BREAKPOINTS.xl;

  if (!Number.isFinite(width) || toWidth <= fromWidth) {
    return min;
  }
  if (width <= fromWidth) return min;
  if (width >= toWidth) return max;

  const t = (width - fromWidth) / (toWidth - fromWidth);
  return min + (max - min) * t;
}

/** Clamp a numeric value into `[low, high]`. */
export function clamp(value: number, low: number, high: number: number {
  if (!Number.isFinite(value)) return low;
  if (low > high) return low;
  if (value < low) return low;
  if (value > high) return high;
  return value;
}

/**
 * Pick a value from a partial breakpoint-keyed map for the given width,
 * walking down from the current breakpoint to the smallest defined entry.
 * Returns `fallback` if no entries match.
 *
 * @example
 *   pickByBreakpoint(width, { xs: 1, md: 2, xl: 4 }, 1)
 */
export function pickByBreakpoint<T>(
  width: number,
  values: Partial<Record<Breakpoint, T>>,
  fallback: T,
): T {
  const current = getBreakpoint(width);
  const idx = BREAKPOINT_ORDER.indexOf(current);
  for (let i = idx; i >= 0; i -= 1) {
    const v = values[BREAKPOINT_ORDER[i]];
    if (v !== undefined) return v;
  }
  // Walk upward as a last resort, so callers can omit small breakpoints.
  for (let i = idx + 1; i < BREAKPOINT_ORDER.length; i += 1) {
    const v = values[BREAKPOINT_ORDER[i]];
    if (v !== undefined) return v;
  }
  return fallback;
}

/**
 * Returns a CSS `clamp()` expression for fluid sizing, using viewport-width
 * units between two pixel anchors. Prefer this in CSS-in-JS / inline styles
 * over computing pixel values from JS so layout updates survive resizes
 * without re-renders.
 *
 * @example
 *   style={{ fontSize: cssClamp(14, 18) }}
 *   // → "clamp(14px, calc(0.4348vw + 12.43px), 18px)"
 */
export function cssClamp(
  minPx: number,
  maxPx: number,
  fromWidth: number = BREAKPOINTS.xs,
  toWidth: number = BREAKPOINTS.xl,
): string {
  if (toWidth <= fromWidth || maxPx === minPx) {
    return `${minPx}px`;
  }
  const slope = (maxPx - minPx) / (toWidth - fromWidth);
  const intercept = minPx - slope * fromWidth;
  const vw = (slope * 100).toFixed(4);
  const sign = intercept >= 0 ? '+' : '-';
  const interceptPx = Math.abs(intercept).toFixed(2);
  return `clamp(${minPx}px, calc(${vw}vw ${sign} ${interceptPx}px), ${maxPx}px)`;
}

/**
 * SSR-safe accessor for the current viewport width. Returns `defaultWidth`
 * (default `BREAKPOINTS.lg`) when `window` is unavailable so components
 * server-render with desktop defaults and hydrate without layout shift on
 * desktop-class viewports.
 */
export function readViewportWidth(defaultWidth: number = BREAKPOINTS.lg: number {
  if (typeof window === 'undefined') return defaultWidth;
  const w = window.innerWidth;
  return Number.isFinite(w) && w > 0 ? w : defaultWidth;
}

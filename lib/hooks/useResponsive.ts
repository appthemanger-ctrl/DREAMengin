'use client';

/**
 * React hooks for DREAMengin's shared responsive system.
 *
 * Pair with `lib/ui/responsive.ts` (pure utilities). These hooks are the
 * recommended way to make any client component adaptable / dynamic /
 * scalable without ad-hoc `window.innerWidth` listeners.
 */

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  BREAKPOINTS,
  type Breakpoint,
  fluid,
  getBreakpoint,
  isAtLeast,
  isBelow,
  pickByBreakpoint,
  readViewportWidth,
} from '../ui/responsive';

type Listener = () => void;

interface ViewportSnapshot {
  width: number;
  height: number;
}

const SSR_SNAPSHOT: ViewportSnapshot = {
  width: BREAKPOINTS.lg,
  height: 800,
};

let cachedSnapshot: ViewportSnapshot | null = null;
const listeners = new Set<Listener>();
let resizeBound = false;

function readSnapshot(): ViewportSnapshot {
  if (typeof window === 'undefined') return SSR_SNAPSHOT;
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    width: Number.isFinite(w) && w > 0 ? w : SSR_SNAPSHOT.width,
    height: Number.isFinite(h) && h > 0 ? h : SSR_SNAPSHOT.height,
  };
}

function ensureSnapshot(): ViewportSnapshot {
  if (!cachedSnapshot) cachedSnapshot = readSnapshot();
  return cachedSnapshot;
}

function notify( ){
  const next = readSnapshot();
  const prev = cachedSnapshot;
  if (prev && prev.width === next.width && prev.height === next.height) return;
  cachedSnapshot = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener): () => void {
  if (typeof window === 'undefined') return () => undefined;
  listeners.add(listener);
  if (!resizeBound) {
    window.addEventListener('resize', notify, { passive: true });
    window.addEventListener('orientationchange', notify, { passive: true });
    resizeBound = true;
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && resizeBound) {
      window.removeEventListener('resize', notify);
      window.removeEventListener('orientationchange', notify);
      resizeBound = false;
    }
  };
}

function getServerSnapshot(): ViewportSnapshot {
  return SSR_SNAPSHOT;
}

/**
 * Subscribe to live viewport width/height updates. SSR-safe: returns desktop
 * defaults during server render and hydrates to real values on mount.
 */
export function useViewport(): ViewportSnapshot {
  return useSyncExternalStore(subscribe, ensureSnapshot, getServerSnapshot);
}

/** Current named breakpoint, updated on resize. */
export function useBreakpoint(): Breakpoint {
  const { width } = useViewport();
  return getBreakpoint(width);
}

/** True when the viewport is at least the given breakpoint. */
export function useIsAtLeast(bp: Breakpoint): boolean {
  const { width } = useViewport();
  return isAtLeast(width, bp);
}

/** True when the viewport is below the given breakpoint. */
export function useIsBelow(bp: Breakpoint): boolean {
  const { width } = useViewport();
  return isBelow(width, bp);
}

/** Convenience: true on phone-sized viewports (`< md`). */
export function useIsMobile(): boolean {
  return useIsBelow('md');
}

/** Convenience: true on tablet-sized viewports (`md` ≤ width < `lg`). */
export function useIsTablet(): boolean {
  const { width } = useViewport();
  return isAtLeast(width, 'md') && isBelow(width, 'lg');
}

/** Convenience: true on desktop-sized viewports (`>= lg`). */
export function useIsDesktop(): boolean {
  return useIsAtLeast('lg');
}

/**
 * Pick a value from a partial breakpoint-keyed map, reactively.
 *
 * @example
 *   const cols = useBreakpointValue({ xs: 1, md: 2, xl: 4 }, 1);
 */
export function useBreakpointValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  fallback: T,
): T {
  const { width } = useViewport();
  return pickByBreakpoint(width, values, fallback);
}

/**
 * Compute a fluid numeric value (e.g. padding, font-size) that re-evaluates
 * on resize. Prefer `cssClamp()` in inline styles when possible to avoid
 * re-renders; use this hook when JS needs the actual number.
 */
export function useFluid(
  options: {
    min: number;
    max: number;
    fromWidth?: number;
    toWidth?: number;
  },
): number {
  const { width } = useViewport();
  return fluid(width, options);
}

/**
 * Subscribe to an arbitrary CSS media query. Returns `false` during SSR.
 *
 * @example
 *   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent | MediaQueryList) => {
      setMatches(event.matches);
    };
    handler(mql);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
      return () => mql.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
    }
    // Safari < 14 fallback.
    mql.addListener(handler as (e: MediaQueryListEvent) => void);
    return () => mql.removeListener(handler as (e: MediaQueryListEvent) => void);
  }, [query]);

  return matches;
}

/** Read once, non-reactive. Useful for initial-render decisions. */
export function getCurrentViewportWidth(): number {
  return readViewportWidth();
}
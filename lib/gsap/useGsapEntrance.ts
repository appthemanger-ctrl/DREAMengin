'use client';
/**
 * lib/gsap/useGsapEntrance.ts
 *
 * React hook that runs a GSAP stagger-entrance animation on a container's
 * direct children whenever the `deps` array changes (e.g. when a filter is
 * applied to a list of cards).
 *
 * Usage:
 *   const gridRef = useRef<HTMLDivElement>(null);
 *   useGsapEntrance(gridRef, [filter]);
 *
 *   <div ref={gridRef}>
 *     {items.map(…)}
 *   </div>
 */

import { useEffect, useRef } from 'react';
import { getGsap } from '@/lib/gsap/gsap';

/**
 * Plays a staggered from-below fade-in on every direct child of `containerRef`.
 * Re-runs whenever any value in `deps` changes (uses a shallow ref-compare).
 *
 * @param containerRef  Ref attached to the parent element whose children animate.
 * @param deps          Dependency array — same semantics as useEffect deps.
 * @param options       Optional overrides for the tween defaults.
 */
export function useGsapEntrance(
  containerRef: React.RefObject<HTMLElement | null>,
  deps: unknown[],
  options: {
    duration?: number;
    stagger?: number;
    y?: number;
    ease?: string;
  } = {},
) {
  const {
    duration = 0.38,
    stagger  = 0.045,
    y        = 22,
    ease     = 'power3.out',
  } = options;

  // Keep a stable snapshot of deps so we can skip if nothing changed
  const prevDepsRef = useRef<unknown[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Skip if deps haven't actually changed (avoids redundant re-runs on
    // parent re-renders that don't affect the list)
    const same = deps.length === prevDepsRef.current.length
      && deps.every((d, i) => d === prevDepsRef.current[i]);
    prevDepsRef.current = deps;
    if (same) return;

    const children = Array.from(el.children) as HTMLElement[];
    if (!children.length) return;

    getGsap().then(gsap => {
      // Instantly reset so the animation always plays from scratch
      gsap.set(children, { opacity: 0, y, willChange: 'transform, opacity' });
      gsap.to(children, {
        opacity:  1,
        y:        0,
        duration,
        stagger,
        ease,
        clearProps: 'willChange',
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

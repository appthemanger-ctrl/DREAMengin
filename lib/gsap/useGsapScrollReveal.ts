'use client';
/**
 * lib/gsap/useGsapScrollReveal.ts
 *
 * React hook that triggers a GSAP entrance animation when a container
 * enters the viewport (IntersectionObserver-driven, not scroll-event-driven).
 *
 * Unlike `useGsapEntrance` (which fires on state-change deps), this hook fires
 * once when the element first becomes visible — ideal for content sections,
 * feature grids, and hero panels that should animate in as the user scrolls.
 *
 * Usage:
 *   const sectionRef = useGsapScrollReveal<HTMLDivElement>();
 *
 *   <section ref={sectionRef}>
 *     <h2>…</h2>
 *     <p>…</p>
 *   </section>
 *
 * Options:
 *   direction  — 'up' | 'down' | 'left' | 'right'  (default: 'up')
 *   stagger    — seconds between children                (default: 0.055)
 *   duration   — tween duration in seconds              (default: 0.45)
 *   threshold  — 0–1 fraction visible to trigger         (default: 0.15)
 *   once       — fire only once (default: true)
 *   children   — animate children instead of the root    (default: true)
 */

import { useEffect, useRef } from 'react';
import { getGsap } from '@/lib/gsap/gsap';

export interface ScrollRevealOptions {
  /** Entry direction. 'up' slides in from below (most common). */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** GSAP stagger between sibling elements (seconds). */
  stagger?: number;
  /** Tween duration (seconds). */
  duration?: number;
  /** IntersectionObserver threshold (0–1). */
  threshold?: number;
  /** When true (default), the animation fires only the first time. */
  once?: boolean;
  /**
   * When true (default), the tween targets the direct children of the
   * returned ref element.  When false, the root element itself is tweened.
   */
  children?: boolean;
}

/** Distance offset in pixels for each direction. */
function directionOffset(direction: NonNullable<ScrollRevealOptions['direction']>): {
  x: number; y: number;
} {
  switch (direction) {
    case 'up':    return { x: 0,    y: 30 };
    case 'down':  return { x: 0,    y: -30 };
    case 'left':  return { x: 30,   y: 0 };
    case 'right': return { x: -30,  y: 0 };
  }
}

/**
 * Returns a ref to attach to the container element.
 * Animations respect `prefers-reduced-motion` — they will not play if the
 * user has that preference set.
 */
export function useGsapScrollReveal<T extends HTMLElement = HTMLElement>(
  options: ScrollRevealOptions = {},
): React.RefObject<T | null> {
  const {
    direction  = 'up',
    stagger    = 0.055,
    duration   = 0.45,
    threshold  = 0.15,
    once       = true,
    children   = true,
  } = options;

  const containerRef = useRef<T | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const { x, y } = directionOffset(direction);

    const play = () => {
      if (once && hasPlayedRef.current) return;
      hasPlayedRef.current = true;

      const targets = children
        ? Array.from(el.children) as HTMLElement[]
        : [el];

      if (!targets.length) return;

      getGsap().then(gsap => {
        gsap.set(targets, {
          opacity: 0,
          x,
          y,
          willChange: 'transform, opacity',
        });
        gsap.to(targets, {
          opacity: 1,
          x: 0,
          y: 0,
          duration,
          stagger,
          ease: 'power3.out',
          clearProps: 'willChange',
        });
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            play();
            if (once) observer.disconnect();
          }
        }
      },
      { threshold },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return containerRef;
}

'use client';
/**
 * lib/gsap/useGsapFlip.ts
 *
 * React hook that powers the DaydreamShell A↔B flip transition with a
 * GSAP timeline, replacing the raw CSS-keyframe approach.
 *
 * Returns a `flip(callback)` function.  Call it with the state-update you
 * want to perform at the midpoint of the animation (e.g. switching `side`).
 *
 * Usage (DaydreamShell):
 *   const { containerRef, flip } = useGsapFlip();
 *
 *   const handleFlip = () =>
 *     flip(() => setSide(s => s === 'A' ? 'B' : 'A'));
 *
 *   <div ref={containerRef}>…</div>
 */

import { useCallback, useRef, useState } from 'react';
import { getGsap } from '@/lib/gsap/gsap';

export function useGsapFlip() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const busyRef      = useRef(false);
  const [busy, setBusy] = useState(false);

  /**
   * Animate out → call `midpoint` → animate in.
   * The midpoint callback should trigger the React state change that swaps
   * the rendered content.
   */
  const flip = useCallback((midpoint: () => void) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);

    const el = containerRef.current;

    if (!el || typeof window === 'undefined') {
      // Fallback: just swap immediately with no animation
      midpoint();
      busyRef.current = false;
      setBusy(false);
      return;
    }

    getGsap().then(gsap => {
      const tl = gsap.timeline({
        onComplete: () => {
          busyRef.current = false;
          setBusy(false);
          gsap.set(el, { clearProps: 'all' });
        },
      });

      // Phase 1 — exit: scale down + fade out (like a page being pulled away)
      tl.to(el, {
        opacity:   0,
        scale:     0.95,
        rotateX:   4,
        y:         -8,
        duration:  0.22,
        ease:      'power2.in',
        transformOrigin: '50% 40%',
      });

      // Midpoint — swap React content (runs synchronously between tweens)
      tl.call(midpoint);

      // Phase 2 — enter: spring in from slightly below
      tl.fromTo(
        el,
        { opacity: 0, scale: 0.95, rotateX: -4, y: 12 },
        {
          opacity:  1,
          scale:    1,
          rotateX:  0,
          y:        0,
          duration: 0.38,
          ease:     'back.out(1.2)',
          transformOrigin: '50% 40%',
        },
      );
    });
  }, []);

  return { containerRef, flip, busy };
}

'use client';
/**
 * lib/hooks/useMotionTilt.ts
 *
 * Framer-motion 3-D magnetic tilt effect for interactive cards.
 *
 * Returns a set of motion props (handlers + style) to spread onto a
 * `<motion.div>` (or any motion element).  As the cursor moves over the
 * element the card rotates in 3-D perspective — a GPU-composited effect
 * with zero layout reflows.
 *
 * Under the hood it uses:
 *   • `useMotionValue`   — tracks raw pointer offsets
 *   • `useSpring`        — smooths the raw values into organic motion
 *   • `useTransform`     — maps offset → rotateX / rotateY / scale
 *   • `useMotionTemplate`— assembles the final CSS transform string
 *
 * Usage (basic):
 *   import { useMotionTilt } from '@/lib/hooks/useMotionTilt';
 *
 *   function GameCard() {
 *     const tilt = useMotionTilt();
 *     return <motion.div {...tilt.motionProps}>…</motion.div>;
 *   }
 *
 * Usage (with options):
 *   const tilt = useMotionTilt({ maxTilt: 12, scale: 1.06, glare: true });
 */

import { useRef } from 'react';
import {
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from 'framer-motion';
import type { MotionProps } from 'framer-motion';

export interface MotionTiltOptions {
  /** Maximum tilt angle in degrees (default: 10). */
  maxTilt?: number;
  /** Scale on hover (default: 1.04). */
  scale?: number;
  /**
   * Spring stiffness — controls how snappy the tilt feels.
   * Higher = snappier.  (default: 380)
   */
  stiffness?: number;
  /**
   * Spring damping — controls overshoot / bounciness.
   * Higher = less bounce.  (default: 28)
   */
  damping?: number;
  /**
   * When true, adds a subtle moving glare sheen to the card.
   * Implemented as an absolutely-positioned pseudo-overlay via inline style.
   * (default: false)
   */
  glare?: boolean;
}

export interface MotionTiltResult {
  /** Spread onto your `<motion.div>`. */
  motionProps: MotionProps & {
    style: Record<string, unknown>;
    onMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => void;
  };
  /**
   * When `glare: true`, spread `glareProps` onto a child element that sits
   * absolutely inside the card (e.g. a `<motion.div>` with
   * `style={{ position:'absolute', inset:0, pointerEvents:'none', borderRadius:'inherit' }}`).
   */
  glareStyle: Record<string, unknown>;
}

/**
 * Returns motion props (handlers + style) for a 3-D tilt card effect.
 *
 * All transforms run on the GPU compositor thread — no layout reflows.
 * Respects `prefers-reduced-motion`: if the preference is set the hook
 * returns no-op handlers and an identity transform.
 */
export function useMotionTilt(options: MotionTiltOptions = {}): MotionTiltResult {
  const {
    maxTilt   = 10,
    scale     = 1.04,
    stiffness = 380,
    damping   = 28,
    glare     = false,
  } = options;

  const cardRef = useRef<HTMLElement | null>(null);

  // Raw motion values (updated on mousemove)
  const rawX = useMotionValue(0); // normalised -1 → +1
  const rawY = useMotionValue(0);
  const rawS = useMotionValue(1); // scale: 1 at rest

  // Spring-smoothed versions
  const springConfig = { stiffness, damping };
  const smoothX = useSpring(rawX, springConfig);
  const smoothY = useSpring(rawY, springConfig);
  const smoothS = useSpring(rawS, { stiffness: 260, damping: 24 });

  // Map smoothed values → CSS rotation angles
  const rotateX = useTransform(smoothY, [-1, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [-1, 1], [-maxTilt, maxTilt]);

  // Glare position (maps pointer to a radial-gradient origin)
  const glareX = useTransform(smoothX, [-1, 1], [0, 100]);
  const glareY = useTransform(smoothY, [-1, 1], [0, 100]);
  const glareOpacity = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });

  // Assemble the final transform as a motion CSS string
  const transform = useMotionTemplate`perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${smoothS})`;

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onMouseMove = prefersReduced
    ? () => {}
    : (e: React.MouseEvent<HTMLElement>) => {
        const el = e.currentTarget;
        cardRef.current = el;
        const rect = el.getBoundingClientRect();
        // Normalise pointer to -1 → +1 within the card
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
        rawX.set(nx);
        rawY.set(ny);
        rawS.set(scale);
        if (glare) glareOpacity.set(0.14);
      };

  const onMouseLeave = prefersReduced
    ? () => {}
    : (_e: React.MouseEvent<HTMLElement>) => {
        rawX.set(0);
        rawY.set(0);
        rawS.set(1);
        if (glare) glareOpacity.set(0);
      };

  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.28) 0%, transparent 65%)`;

  return {
    motionProps: {
      style: prefersReduced ? {} : { transform, willChange: 'transform' },
      onMouseMove,
      onMouseLeave,
    },
    glareStyle: glare && !prefersReduced
      ? {
          position: 'absolute' as const,
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none' as const,
          background: glareBackground,
          opacity: glareOpacity,
        }
      : {},
  };
}

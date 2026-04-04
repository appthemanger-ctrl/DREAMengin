'use client';

/**
 * lib/gestures/useTouchGestures.ts
 *
 * Phase 9 §6: React hook for the touch gesture library.
 *
 * Provides pinch-to-zoom, two-finger rotate, and three-finger swipe
 * detection on any element ref, integrated with the dual runtime.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useTouchGestures(ref, {
 *     onPinch: (e) => console.log('pinch scale:', e.scale),
 *     onRotate: (e) => console.log('rotation:', e.rotation),
 *     onSwipe: (e) => {
 *       if (e.type === 'swipe-left' && e.fingers >= 3) switchEngin('next');
 *     },
 *   });
 */

import { useEffect, useRef, type RefObject } from 'react';
import {
  GestureRecogniser,
  type GestureCallbacks,
  type GestureConfig,
} from './touchGestures';

/**
 * useTouchGestures — attach gesture recognition to a DOM element.
 *
 * @param ref - React ref to the target element
 * @param callbacks - gesture event handlers
 * @param config - optional tuning parameters
 */
export function useTouchGestures(
  ref: RefObject<HTMLElement | null>,
  callbacks: GestureCallbacks,
  config?: GestureConfig,
): void {
  // Stabilise callbacks across renders without requiring the consumer to
  // memoise. We store the latest callbacks in a ref and forward through a
  // stable wrapper object so the GestureRecogniser never re-binds.
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const stable: GestureCallbacks = {
      onPinch:     (e) => cbRef.current.onPinch?.(e),
      onRotate:    (e) => cbRef.current.onRotate?.(e),
      onSwipe:     (e) => cbRef.current.onSwipe?.(e),
      onPan:       (e) => cbRef.current.onPan?.(e),
      onTap:       (e) => cbRef.current.onTap?.(e),
      onLongPress: (e) => cbRef.current.onLongPress?.(e),
    };

    const recogniser = new GestureRecogniser(stable, configRef.current);
    return recogniser.attach(el);
  }, [ref]);
}

/**
 * lib/gsap/gsap.ts
 *
 * SSR-safe GSAP loader.
 *
 * Why a wrapper?  GSAP accesses `window` and `document` at import time, which
 * causes Next.js server-component rendering to throw.  This module lazily
 * returns the real GSAP instance only in the browser, providing a tiny no-op
 * shim for SSR so that imports never crash the server build.
 *
 * Usage (in client components):
 *   import { getGsap } from '@/lib/gsap/gsap';
 *
 *   useEffect(() => {
 *     getGsap().then(gsap => {
 *       gsap.to(ref.current, { opacity: 1, y: 0, duration: 0.4 });
 *     });
 *   }, []);
 */

import type { gsap as GsapType } from 'gsap';

let _gsap: typeof GsapType | null = null;

/**
 * Returns the real GSAP instance (browser-only).
 * Safe to call from useEffect / event handlers.
 */
export async function getGsap(): Promise<typeof GsapType> {
  if (typeof window === 'undefined') {
    // SSR no-op — never actually called in server components
    throw new Error('getGsap() must only be called in the browser');
  }
  if (!_gsap) {
    const mod = await import('gsap');
    _gsap = mod.gsap ?? (mod as unknown as { default: typeof GsapType }).default;
  }
  return _gsap!;
}

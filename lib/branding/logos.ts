/**
 * Branding logo rotation utility.
 *
 * getRandomLogo() – returns one of the three brand logos per page load.
 * The result is cached in-memory so all BrandLogo instances on the same
 * page render the same logo (no flicker from independent random rolls).
 *
 * Safe to call from client components only (uses Math.random; no SSR side
 * effects – the BrandLogo component always renders a stable SSR placeholder
 * and calls this on mount).
 */

export const LOGO_PATHS = [
  '/images/logo1.PNG',
  '/images/logo2.PNG',
  '/images/logo3.PNG',
] as const;

export type LogoPath = (typeof LOGO_PATHS)[number];

/** Per-load in-memory cache – reset on each full navigation. */
let _cached: LogoPath | null = null;

/**
 * Returns one logo path, chosen once per page load via a Fisher-Yates
 * shuffle.  Falls back gracefully: if fewer than 3 logos are available
 * at runtime the first in-array path is returned instead.
 */
export function getRandomLogo(): LogoPath {
  if (_cached) return _cached;

  // Shallow copy so LOGO_PATHS const is never mutated.
  const arr: LogoPath[] = [...LOGO_PATHS];

  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  _cached = arr[0] ?? LOGO_PATHS[0];
  return _cached;
}

/** Reset per-load cache.  Used in unit tests only. */
export function resetLogoCache(): void {
  _cached = null;
}

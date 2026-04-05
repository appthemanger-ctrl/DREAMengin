/**
 * swapManager — persists the editor/preview swap state per Daydream.
 *
 * Each Daydream that supports a swappable editor/preview split stores a
 * boolean in localStorage.  The helper is safe to call server-side (it
 * returns the default value when window is unavailable).
 *
 * Keys:
 *   de-code-swap  →  Code Daydream (CodeDreamIDE)
 *   de-lab-swap   →  Lab  Daydream (LabDreamIDE)
 */

const SWAP_KEYS = {
  code: 'de-code-swap',
  lab:  'de-lab-swap',
} as const;

export type SwapDomain = keyof typeof SWAP_KEYS;

/**
 * Read the persisted swap state for a given Daydream domain.
 * Returns `false` (default: editor on top/left) when unavailable.
 */
export function getSwap(domain: SwapDomain): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SWAP_KEYS[domain]) === 'true';
  } catch {
    return false;
  }
}

/**
 * Persist the swap state for a given Daydream domain.
 */
export function setSwap(domain: SwapDomain, value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SWAP_KEYS[domain], String(value));
  } catch {
    // Storage quota exceeded or private-browsing restriction — ignore
  }
}

/**
 * Toggle the swap state and return the new value.
 */
export function toggleSwap(domain: SwapDomain): boolean {
  const next = !getSwap(domain);
  setSwap(domain, next);
  return next;
}

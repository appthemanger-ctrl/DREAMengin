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

const ALL_DOMAINS = Object.keys(SWAP_KEYS) as SwapDomain[];

/**
 * Read the persisted swap state for a given Daydream domain.
 * Returns `false` (default: editor on top/left) when unavailable.
 */
export function getSwap(domain: SwapDomain): boolean {
  if (typeof localStorage === 'undefined') return false;
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
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SWAP_KEYS[domain], String(value));
  } catch (err) {
    // ── Improvement 43: log storage errors ───────────────────────────────
    console.warn('[swapManager] Failed to persist swap state', { domain, err });
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

// ── Improvement 40: clearSwap ─────────────────────────────────────────────────

/**
 * Reset the swap state for a domain to its default (false = editor on top).
 * Safe to call server-side.
 */
export function clearSwap(domain: SwapDomain): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(SWAP_KEYS[domain]);
  } catch (err) {
    console.warn('[swapManager] Failed to clear swap state', { domain, err });
  }
}

// ── Improvement 41: getAllSwapStates ──────────────────────────────────────────

/**
 * Read the swap state for every registered domain in one call.
 * Returns a Record<SwapDomain, boolean> so callers don't need to call
 * getSwap() N times for the same render.
 */
export function getAllSwapStates(): Record<SwapDomain, boolean> {
  return Object.fromEntries(
    ALL_DOMAINS.map((domain) => [domain, getSwap(domain)]),
  ) as Record<SwapDomain, boolean>;
}

// ── Improvement 42: resetAllSwaps ────────────────────────────────────────────

/**
 * Clear the swap state for every registered domain (set to default false).
 * Useful during sign-out or when resetting the workspace to defaults.
 */
export function resetAllSwaps(): void {
  for (const domain of ALL_DOMAINS) {
    clearSwap(domain);
  }
}

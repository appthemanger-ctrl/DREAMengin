import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatRelativeTime(date: string | Date, options?: { compact?: boolean }) {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (options?.compact) {
    if (diffMs < 60_000) return 'just now'
    if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m`
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h`
    return `${Math.floor(diffMs / 86_400_000)}d`
  }

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function generateDedupeHash(userId: string, source: string, externalId: string) {
  return `${userId}-${source}-${externalId}`
}

// ── Improvement 6: debounce ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => void;

/**
 * Returns a debounced version of `fn` that fires only after `delayMs` ms of
 * silence. The returned function also exposes `.cancel()` to abort a pending
 * call and `.flush()` to invoke it immediately.
 */
export function debounce<T extends AnyFn>(
  fn: T,
  delayMs: number,
): T & { cancel: () => void; flush: (...args: Parameters<T>) => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pendingArgs: any[] | null = null

  function debounced(...args: Parameters<T>) {
    pendingArgs = args
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      if (pendingArgs) fn(...pendingArgs)
      pendingArgs = null
    }, delayMs)
  }

  debounced.cancel = () => {
    if (timer !== null) { clearTimeout(timer); timer = null }
    pendingArgs = null
  }

  debounced.flush = (...args: Parameters<T>) => {
    if (timer !== null) { clearTimeout(timer); timer = null }
    fn(...args)
    pendingArgs = null
  }

  return debounced as T & { cancel: () => void; flush: (...args: Parameters<T>) => void }
}

// ── Improvement 7: throttle ───────────────────────────────────────────────────

/**
 * Returns a throttled version of `fn` that fires at most once every
 * `intervalMs` ms regardless of how many times it is called.
 * The trailing call within the interval is always delivered.
 */
export function throttle<T extends AnyFn>(
  fn: T,
  intervalMs: number,
): T & { cancel: () => void } {
  let lastCallAt = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  function throttled(...args: Parameters<T>) {
    const now = Date.now()
    const remaining = intervalMs - (now - lastCallAt)
    if (timer !== null) clearTimeout(timer)
    if (remaining <= 0) {
      lastCallAt = now
      fn(...args)
    } else {
      timer = setTimeout(() => {
        lastCallAt = Date.now()
        timer = null
        fn(...args)
      }, remaining)
    }
  }

  throttled.cancel = () => {
    if (timer !== null) { clearTimeout(timer); timer = null }
  }

  return throttled as T & { cancel: () => void }
}

// ── Improvement 8: clamp ──────────────────────────────────────────────────────

/** Constrain `value` to the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ── Improvement 9: truncate ───────────────────────────────────────────────────

/**
 * Truncate `str` to at most `maxLen` characters (including the suffix).
 * Default suffix is '…'.
 */
export function truncate(str: string, maxLen: number, suffix = '…'): string {
  if (str.length <= maxLen) return str
  return str.slice(0, Math.max(0, maxLen - suffix.length)) + suffix
}

// ── Improvement 10: retry ─────────────────────────────────────────────────────

/**
 * Retry an async function up to `maxAttempts` times using exponential backoff.
 * Throws the last error when all attempts are exhausted.
 *
 * @param fn          Async function to retry.
 * @param maxAttempts Maximum number of attempts (default 3).
 * @param baseDelayMs Initial delay before the second attempt (default 200 ms).
 *                    Each subsequent attempt doubles the delay.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 200,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxAttempts) {
        await sleep(baseDelayMs * Math.pow(2, attempt - 1))
      }
    }
  }
  throw lastError
}

// ── Improvement 11: sleep ─────────────────────────────────────────────────────

/** Return a Promise that resolves after `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Improvement 12: deepClone ─────────────────────────────────────────────────

/**
 * Deep-clone a value using `structuredClone` when available, falling back to
 * JSON round-trip for environments that don't support it.
 * Functions, Symbols, and circular references survive `structuredClone` but
 * are silently dropped by the JSON fallback.
 */
export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

// ── Improvement 13: groupBy ───────────────────────────────────────────────────

/**
 * Group an array by a derived key.
 * Returns a `Map<K, T[]>` preserving insertion order of first-seen keys.
 */
export function groupBy<T, K>(arr: readonly T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const item of arr) {
    const key = keyFn(item)
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }
  return map
}

// ── Improvement 14: unique ────────────────────────────────────────────────────

/**
 * Return a new array with duplicate values removed (identity comparison).
 * Preserves the order of first occurrence.
 */
export function unique<T>(arr: readonly T[]): T[] {
  return [...new Set(arr)]
}

// ── Improvement 15: assert ────────────────────────────────────────────────────

/**
 * Assert that `condition` is truthy, throwing an `Error` with `message` when
 * it is not. TypeScript narrows the type of `condition` to `true` after this.
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}